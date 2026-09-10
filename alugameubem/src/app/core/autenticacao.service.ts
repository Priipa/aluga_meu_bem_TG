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
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { autenticacaoFirebase, bancoFirestore } from './firebase';
import { UserProfile } from './models';

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
}

const COLECAO_USUARIOS = 'usuarios';
const CIDADE_PADRAO = 'São Paulo';

@Injectable({ providedIn: 'root' })
export class AutenticacaoService {
  private readonly usuarioFirebase = signal<User | null>(null);
  private readonly dadosPerfil = signal<UserProfile | null>(null);

  readonly carregandoSessao = signal(true);
  readonly erroSessao = signal('');
  readonly perfil = computed(() => this.dadosPerfil());
  readonly autenticado = computed(() => this.usuarioFirebase() !== null);
  readonly uid = computed(() => this.usuarioFirebase()?.uid ?? null);

  constructor() {
    onAuthStateChanged(autenticacaoFirebase, (usuario) => {
      void this.sincronizarSessao(usuario);
    });
  }

  async entrar(email: string, senha: string): Promise<void> {
    const credencial = await signInWithEmailAndPassword(autenticacaoFirebase, email, senha);

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

      const perfil: UserProfile = {
        name: dados.nome,
        email: dados.email,
        city: CIDADE_PADRAO,
        cpf: dados.cpf,
        phone: dados.telefone,
      };

      await setDoc(doc(bancoFirestore, COLECAO_USUARIOS, uid), {
        nome: dados.nome,
        email: dados.email,
        cidade: CIDADE_PADRAO,
        cpf: dados.cpf,
        telefone: dados.telefone,
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp(),
      });

      this.usuarioFirebase.set(usuario);
      this.dadosPerfil.set(perfil);
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

  async sair(): Promise<void> {
    await signOut(autenticacaoFirebase);
    this.usuarioFirebase.set(null);
    this.dadosPerfil.set(null);
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
      'perfil/nao-criado': 'Não foi possível criar sua conta.',
      'perfil/nao-carregado': 'Não foi possível carregar seus dados.',
    };
    return mensagens[codigo] ?? 'Não foi possível concluir. Tente novamente.';
  }

  private async sincronizarSessao(usuario: User | null): Promise<void> {
    this.usuarioFirebase.set(usuario);

    if (!usuario) {
      this.dadosPerfil.set(null);
      this.erroSessao.set('');
      this.carregandoSessao.set(false);
      return;
    }

    try {
      await this.aplicarPerfilRemoto(usuario);
    } catch {
      if (this.dadosPerfil() && this.usuarioFirebase()?.uid === usuario.uid) {
        this.carregandoSessao.set(false);
        return;
      }
      this.erroSessao.set('Não foi possível carregar seus dados.');
      this.carregandoSessao.set(false);
    }
  }

  private async aplicarPerfilRemoto(usuario: User): Promise<void> {
    const remoto = await this.carregarPerfilRemoto(usuario.uid);
    if (!remoto) {
      throw this.erroComCodigo('perfil/nao-carregado');
    }

    this.dadosPerfil.set(this.mapearPerfil(usuario, remoto));
    this.erroSessao.set('');
    this.carregandoSessao.set(false);
  }

  private async carregarPerfilRemoto(uid: string): Promise<Record<string, unknown> | null> {
    const snapshot = await getDoc(doc(bancoFirestore, COLECAO_USUARIOS, uid));
    return snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : null;
  }

  private mapearPerfil(usuario: User, dados: Record<string, unknown>): UserProfile {
    const telefone = dados['telefone'];
    const cpf = dados['cpf'];

    return {
      name: String(dados['nome'] ?? usuario.displayName ?? 'Você'),
      email: String(dados['email'] ?? usuario.email ?? ''),
      city: String(dados['cidade'] ?? CIDADE_PADRAO),
      cpf: cpf ? String(cpf) : undefined,
      phone: telefone ? String(telefone) : undefined,
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
