import { Injectable, computed, signal } from '@angular/core';
import {
  User,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { autenticacaoFirebase, bancoFirestore } from './firebase';
import { Locador, UserProfile, Vinculo } from './models';
import { VERSAO_TERMOS_GERAIS, VERSAO_TERMOS_LOCADOR } from './termos';

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
  condominioId: string;
  bloco: string;
  apartamento: string;
}

const COLECAO_USUARIOS = 'usuarios';
const COLECAO_VINCULOS = 'vinculos';

/**
 * ID determinístico do MVP: um documento por par usuário+condomínio.
 * Não cobre duas unidades simultâneas do mesmo usuário no mesmo condomínio.
 * Se esse requisito aparecer, o modelo de identificação deverá ser revisto.
 */
function idVinculo(uid: string, condominioId: string): string {
  return `${uid}_${condominioId}`;
}

/**
 * Resultado da leitura do vínculo ativo.
 * `erro` significa que a consulta não pôde ser concluída — não é o mesmo que ausência.
 */
export type SituacaoVinculo = 'ausente' | 'unico' | 'inconsistente' | 'erro';

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly usuarioFirebase = signal<User | null>(null);
  private readonly dadosPerfil = signal<UserProfile | null>(null);
  private readonly dadosVinculo = signal<Vinculo | null>(null);
  private readonly situacaoInterna = signal<SituacaoVinculo>('ausente');
  /** Invalida uma consulta de vínculo que terminar depois de logout ou troca de conta. */
  private geracaoVinculo = 0;
  private vinculoEmCurso: { uid: string; geracao: number; promessa: Promise<void> } | null = null;

  readonly carregandoSessao = signal(true);
  readonly erroSessao = signal('');
  readonly perfil = computed(() => this.dadosPerfil());
  readonly autenticado = computed(() => this.usuarioFirebase() !== null);
  readonly ehLocador = computed(() => this.dadosPerfil()?.locador.habilitado === true);
  readonly uid = computed(() => this.usuarioFirebase()?.uid ?? null);
  readonly situacaoVinculo = this.situacaoInterna.asReadonly();
  /** Preenchido somente quando existe exatamente um vínculo ativo. */
  readonly vinculoAtivo = computed(() =>
    this.situacaoInterna() === 'unico' ? this.dadosVinculo() : null
  );
  readonly condominioId = computed(() => this.vinculoAtivo()?.condominioId ?? null);

  constructor() {
    onAuthStateChanged(autenticacaoFirebase, (usuario) => {
      void this.sincronizarSessao(usuario);
    });
  }

  async entrar(email: string, senha: string): Promise<void> {
    const credencial = await signInWithEmailAndPassword(autenticacaoFirebase, email, senha);
    this.usuarioFirebase.set(credencial.user);

    try {
      await this.aplicarPerfilRemoto(credencial.user);
    } catch (erro) {
      await signOut(autenticacaoFirebase).catch(() => undefined);
      if (this.codigoErro(erro).startsWith('auth/')) {
        throw erro;
      }
      throw this.erroComCodigo('perfil/nao-carregado');
    }
  }

  async criarConta(dados: DadosCadastro): Promise<void> {
    let usuario: User | null = null;

    try {
      const credencial = await createUserWithEmailAndPassword(
        autenticacaoFirebase,
        dados.email,
        dados.senha
      );
      usuario = credencial.user;
      const uid = usuario.uid;

      await updateProfile(usuario, { displayName: dados.nome });

      const agora = serverTimestamp();
      const lote = writeBatch(bancoFirestore);

      lote.set(doc(bancoFirestore, COLECAO_USUARIOS, uid), {
        nome: dados.nome,
        email: dados.email,
        cpf: dados.cpf,
        telefone: dados.telefone,
        termos: {
          versao: VERSAO_TERMOS_GERAIS,
          aceitoEm: agora,
        },
        locador: {
          habilitado: false,
          habilitadoEm: null,
          versaoTermos: null,
          termosAceitosEm: null,
        },
        criadoEm: agora,
        atualizadoEm: agora,
      });

      lote.set(doc(bancoFirestore, COLECAO_VINCULOS, idVinculo(uid, dados.condominioId)), {
        usuarioId: uid,
        condominioId: dados.condominioId,
        unidade: {
          bloco: dados.bloco,
          apartamento: dados.apartamento,
        },
        status: 'ativo',
        criadoEm: agora,
        atualizadoEm: agora,
      });

      await lote.commit();

      const perfil: UserProfile = {
        name: dados.nome,
        email: dados.email,
        cpf: dados.cpf,
        phone: dados.telefone,
        locador: {
          habilitado: false,
          habilitadoEm: null,
          versaoTermos: null,
          termosAceitosEm: null,
        },
      };

      this.usuarioFirebase.set(usuario);
      this.dadosPerfil.set(perfil);
      this.definirVinculoDoCadastro(uid, dados);
      this.erroSessao.set('');
      this.carregandoSessao.set(false);
    } catch (erro) {
      if (usuario) {
        await deleteUser(usuario).catch(() => undefined);
      }
      if (this.codigoErro(erro).startsWith('auth/')) {
        throw erro;
      }
      throw this.erroComCodigo('perfil/nao-criado');
    }
  }

  async ativarLocador(): Promise<void> {
    const usuario = this.usuarioFirebase();
    const perfil = this.dadosPerfil();
    if (!usuario || !perfil) {
      throw this.erroComCodigo('perfil/nao-carregado');
    }
    if (perfil.locador.habilitado) {
      return;
    }

    await updateDoc(doc(bancoFirestore, COLECAO_USUARIOS, usuario.uid), {
      'locador.habilitado': true,
      'locador.habilitadoEm': serverTimestamp(),
      'locador.versaoTermos': VERSAO_TERMOS_LOCADOR,
      'locador.termosAceitosEm': serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    try {
      await this.aplicarPerfilRemoto(usuario);
    } catch {
      this.dadosPerfil.set({
        ...perfil,
        locador: {
          ...perfil.locador,
          habilitado: true,
          versaoTermos: VERSAO_TERMOS_LOCADOR,
        },
      });
    }
  }

  async sair(): Promise<void> {
    await signOut(autenticacaoFirebase);
    this.usuarioFirebase.set(null);
    this.dadosPerfil.set(null);
    this.limparVinculo();
    this.erroSessao.set('');
  }

  traduzirErro(erro: unknown): string {
    const codigo = this.codigoErro(erro);
    const mensagens: Record<string, string> = {
      'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
      'auth/invalid-email': 'Informe um e-mail válido.',
      'auth/weak-password': 'A senha deve possuir pelo menos 6 caracteres.',
      'auth/user-not-found': 'E-mail ou senha inválidos.',
      'auth/wrong-password': 'E-mail ou senha inválidos.',
      'auth/invalid-credential': 'E-mail ou senha inválidos.',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente em instantes.',
      'auth/network-request-failed': 'Sem conexão. Verifique a internet e tente de novo.',
      'auth/operation-not-allowed': 'O login por e-mail ainda não foi ativado no Firebase.',
      'permission-denied': 'Não foi possível concluir. Tente novamente.',
      'perfil/nao-criado': 'Não foi possível criar sua conta.',
      'perfil/nao-carregado': 'Não foi possível carregar seus dados.',
    };
    return mensagens[codigo] ?? 'Não foi possível concluir. Tente novamente.';
  }

  private async sincronizarSessao(usuario: User | null): Promise<void> {
    const uidAnterior = this.usuarioFirebase()?.uid ?? null;
    this.usuarioFirebase.set(usuario);

    if (!usuario) {
      this.dadosPerfil.set(null);
      this.limparVinculo();
      this.erroSessao.set('');
      this.carregandoSessao.set(false);
      return;
    }

    if (uidAnterior !== usuario.uid) {
      this.dadosPerfil.set(null);
      this.limparVinculo();
    }

    try {
      await this.aplicarPerfilRemoto(usuario);
    } catch {
      if (this.usuarioFirebase()?.uid !== usuario.uid) {
        return;
      }
      if (this.dadosPerfil() && this.usuarioFirebase()?.uid === usuario.uid) {
        this.carregandoSessao.set(false);
        return;
      }
      this.limparVinculo();
      this.erroSessao.set('Não foi possível carregar seus dados.');
      this.carregandoSessao.set(false);
    }
  }

  private async aplicarPerfilRemoto(usuario: User): Promise<void> {
    const geracao = this.geracaoVinculo;
    const remoto = await this.carregarPerfilRemoto(usuario.uid);
    if (!this.sessaoAindaEh(usuario.uid, geracao)) {
      return;
    }
    if (!remoto) {
      throw this.erroComCodigo('perfil/nao-carregado');
    }

    this.dadosPerfil.set(this.mapearPerfil(usuario, remoto));
    this.erroSessao.set('');
    await this.resolverVinculo(usuario.uid);
    if (!this.sessaoAindaEh(usuario.uid, geracao)) {
      return;
    }
    this.carregandoSessao.set(false);
  }

  private sessaoAindaEh(uid: string, geracao: number): boolean {
    return this.geracaoVinculo === geracao && this.usuarioFirebase()?.uid === uid;
  }

  /**
   * Consulta somente os vínculos ativos deste uid.
   * 0 → ausente; 1 → usa esse vínculo; 2 ou mais → inconsistente, sem condomínio corrente.
   * Chamadas sobrepostas do mesmo uid compartilham uma única consulta.
   */
  private resolverVinculo(uid: string): Promise<void> {
    const geracao = this.geracaoVinculo;
    if (this.vinculoEmCurso?.uid === uid && this.vinculoEmCurso.geracao === geracao) {
      return this.vinculoEmCurso.promessa;
    }

    const promessa = this.executarResolucaoVinculo(uid).finally(() => {
      if (this.vinculoEmCurso?.promessa === promessa) {
        this.vinculoEmCurso = null;
      }
    });
    this.vinculoEmCurso = { uid, geracao, promessa };
    return promessa;
  }

  private async executarResolucaoVinculo(uid: string): Promise<void> {
    const geracao = this.geracaoVinculo;

    try {
      const encontrados = await this.buscarVinculosAtivos(uid);
      if (geracao !== this.geracaoVinculo || this.usuarioFirebase()?.uid !== uid) {
        return;
      }
      this.aplicarVinculosEncontrados(uid, encontrados);
    } catch {
      if (geracao !== this.geracaoVinculo || this.usuarioFirebase()?.uid !== uid) {
        return;
      }
      if (this.situacaoInterna() === 'unico' && this.dadosVinculo()?.usuarioId === uid) {
        return;
      }
      this.dadosVinculo.set(null);
      this.situacaoInterna.set('erro');
    }
  }

  private async buscarVinculosAtivos(uid: string): Promise<{ id: string; dados: Record<string, unknown> }[]> {
    const consulta = query(
      collection(bancoFirestore, COLECAO_VINCULOS),
      where('usuarioId', '==', uid),
      where('status', '==', 'ativo'),
      limit(2)
    );
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map((documento) => ({
      id: documento.id,
      dados: documento.data() as Record<string, unknown>,
    }));
  }

  private aplicarVinculosEncontrados(
    uid: string,
    encontrados: { id: string; dados: Record<string, unknown> }[]
  ): void {
    if (encontrados.length === 0) {
      this.dadosVinculo.set(null);
      this.situacaoInterna.set('ausente');
      return;
    }

    if (encontrados.length > 1) {
      this.dadosVinculo.set(null);
      this.situacaoInterna.set('inconsistente');
      return;
    }

    const vinculo = this.mapearVinculo(encontrados[0].id, encontrados[0].dados);
    if (!vinculo || vinculo.usuarioId !== uid || vinculo.status !== 'ativo') {
      this.dadosVinculo.set(null);
      this.situacaoInterna.set('inconsistente');
      return;
    }

    this.dadosVinculo.set(vinculo);
    this.situacaoInterna.set('unico');
  }

  private definirVinculoDoCadastro(uid: string, dados: DadosCadastro): void {
    this.geracaoVinculo += 1;
    const agora = Timestamp.now();
    this.dadosVinculo.set({
      id: idVinculo(uid, dados.condominioId),
      usuarioId: uid,
      condominioId: dados.condominioId,
      unidade: {
        bloco: dados.bloco,
        apartamento: dados.apartamento,
      },
      status: 'ativo',
      criadoEm: agora,
      atualizadoEm: agora,
    });
    this.situacaoInterna.set('unico');
  }

  private limparVinculo(): void {
    this.geracaoVinculo += 1;
    this.dadosVinculo.set(null);
    this.situacaoInterna.set('ausente');
  }

  private mapearVinculo(id: string, dados: Record<string, unknown>): Vinculo | null {
    const usuarioId = dados['usuarioId'];
    const condominioId = dados['condominioId'];
    const status = dados['status'];
    const unidade = dados['unidade'];
    const criadoEm = dados['criadoEm'];
    const atualizadoEm = dados['atualizadoEm'];

    if (typeof usuarioId !== 'string' || typeof condominioId !== 'string' || status !== 'ativo') {
      return null;
    }
    if (!unidade || typeof unidade !== 'object') {
      return null;
    }

    const bloco = (unidade as Record<string, unknown>)['bloco'];
    const apartamento = (unidade as Record<string, unknown>)['apartamento'];
    if (typeof bloco !== 'string' || typeof apartamento !== 'string') {
      return null;
    }
    if (!(criadoEm instanceof Timestamp) || !(atualizadoEm instanceof Timestamp)) {
      return null;
    }

    return {
      id,
      usuarioId,
      condominioId,
      unidade: { bloco, apartamento },
      status,
      criadoEm,
      atualizadoEm,
    };
  }

  private async carregarPerfilRemoto(uid: string): Promise<Record<string, unknown> | null> {
    const snapshot = await getDoc(doc(bancoFirestore, COLECAO_USUARIOS, uid));
    return snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  }

  private mapearPerfil(usuario: User, dados: Record<string, unknown>): UserProfile {
    const telefone = dados['telefone'];
    const cpf = dados['cpf'];
    const cidade = dados['cidade'];

    return {
      name: String(dados['nome'] ?? usuario.displayName ?? 'Você'),
      email: String(dados['email'] ?? usuario.email ?? ''),
      city: typeof cidade === 'string' && cidade.trim() ? cidade : undefined,
      cpf: cpf ? String(cpf) : undefined,
      phone: telefone ? String(telefone) : undefined,
      locador: this.mapearLocador(dados['locador']),
    };
  }

  private mapearLocador(valor: unknown): Locador {
    if (!valor || typeof valor !== 'object') {
      return {
        habilitado: false,
        habilitadoEm: null,
        versaoTermos: null,
        termosAceitosEm: null,
      };
    }

    const locador = valor as Record<string, unknown>;
    const versaoTermos = locador['versaoTermos'];

    return {
      habilitado: locador['habilitado'] === true,
      habilitadoEm: locador['habilitadoEm'] instanceof Timestamp ? locador['habilitadoEm'] : null,
      versaoTermos: typeof versaoTermos === 'string' ? versaoTermos : null,
      termosAceitosEm:
        locador['termosAceitosEm'] instanceof Timestamp ? locador['termosAceitosEm'] : null,
    };
  }

  private erroComCodigo(codigo: string): Error {
    const erro = new Error(codigo);
    Object.assign(erro, { code: codigo });
    return erro;
  }

  private codigoErro(erro: unknown): string {
    if (typeof erro === 'object' && erro && 'code' in erro) {
      return String((erro as { code: string }).code);
    }
    return '';
  }
}
