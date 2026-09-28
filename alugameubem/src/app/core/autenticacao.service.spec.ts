import { TestBed } from '@angular/core/testing';
import { Timestamp } from 'firebase/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AutenticacaoService } from './autenticacao.service';

const estado = vi.hoisted(() => ({
  callback: null as ((usuario: unknown) => void) | null,
  filtros: [] as unknown[][],
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  createUser: vi.fn(),
  updateProfile: vi.fn(),
  deleteUser: vi.fn(),
  batchSet: vi.fn(),
  batchCommit: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({}),
  onAuthStateChanged: (_auth: unknown, callback: (usuario: unknown) => void) => {
    estado.callback = callback;
    return () => undefined;
  },
  signInWithEmailAndPassword: (...args: unknown[]) => estado.signIn(...args),
  signOut: (...args: unknown[]) => estado.signOut(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => estado.createUser(...args),
  deleteUser: (...args: unknown[]) => estado.deleteUser(...args),
  updateProfile: (...args: unknown[]) => estado.updateProfile(...args),
}));

vi.mock('firebase/firestore', async () => {
  const atual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...atual,
    getFirestore: () => ({}),
    getDoc: (...args: unknown[]) => estado.getDoc(...args),
    getDocs: (...args: unknown[]) => estado.getDocs(...args),
    doc: vi.fn(() => ({})),
    collection: vi.fn(() => ({})),
    query: vi.fn(() => ({})),
    where: (campo: string, op: string, valor: unknown) => {
      estado.filtros.push([campo, op, valor]);
      return { campo, op, valor };
    },
    limit: vi.fn((n: number) => n),
    writeBatch: () => ({
      set: estado.batchSet,
      commit: estado.batchCommit,
    }),
    updateDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'server'),
  };
});

function usuario(uid = 'uid-a') {
  return { uid, displayName: 'Ana', email: 'ana@email.com' };
}

function perfilRemoto() {
  return {
    exists: () => true,
    data: () => ({
      nome: 'Ana',
      email: 'ana@email.com',
      cpf: '529.982.247-25',
      telefone: '(11) 98888-7777',
      locador: {
        habilitado: false,
        habilitadoEm: null,
        versaoTermos: null,
        termosAceitosEm: null,
      },
    }),
  };
}

function documentoVinculo(condominioId: string, uid = 'uid-a') {
  return {
    id: `${uid}_${condominioId}`,
    data: () => ({
      usuarioId: uid,
      condominioId,
      unidade: { bloco: 'B', apartamento: '12' },
      status: 'ativo',
      criadoEm: Timestamp.now(),
      atualizadoEm: Timestamp.now(),
    }),
  };
}

async function sessaoPronta(servico: AutenticacaoService): Promise<void> {
  await vi.waitFor(() => {
    expect(servico.carregandoSessao()).toBe(false);
  });
}

describe('AutenticacaoService vínculo', () => {
  beforeEach(() => {
    estado.callback = null;
    estado.filtros.length = 0;
    estado.getDoc.mockReset();
    estado.getDocs.mockReset();
    estado.signIn.mockReset();
    estado.signOut.mockReset();
    estado.createUser.mockReset();
    estado.updateProfile.mockReset();
    estado.deleteUser.mockReset();
    estado.batchSet.mockReset();
    estado.batchCommit.mockReset();

    estado.getDoc.mockResolvedValue(perfilRemoto());
    estado.getDocs.mockResolvedValue({ docs: [documentoVinculo('cond-1')] });
    estado.signOut.mockImplementation(async () => {
      estado.callback?.(null);
    });
    estado.batchCommit.mockResolvedValue(undefined);
    estado.updateProfile.mockResolvedValue(undefined);
    estado.deleteUser.mockResolvedValue(undefined);

    TestBed.resetTestingModule();
  });

  function criarServico(): AutenticacaoService {
    TestBed.configureTestingModule({});
    return TestBed.inject(AutenticacaoService);
  }

  it('restaura perfil, vínculo e condominioId a partir da autenticação', async () => {
    const servico = criarServico();

    estado.callback?.(usuario());
    await sessaoPronta(servico);

    expect(servico.autenticado()).toBe(true);
    expect(servico.perfil()?.name).toBe('Ana');
    expect(servico.situacaoVinculo()).toBe('unico');
    expect(servico.vinculoAtivo()?.id).toBe('uid-a_cond-1');
    expect(servico.vinculoAtivo()?.unidade).toEqual({ bloco: 'B', apartamento: '12' });
    expect(servico.condominioId()).toBe('cond-1');
    expect(estado.filtros).toEqual([
      ['usuarioId', '==', 'uid-a'],
      ['status', '==', 'ativo'],
    ]);
  });

  it('mantém o mesmo condominioId quando a sessão é restaurada de novo', async () => {
    const servico = criarServico();

    estado.callback?.(usuario());
    await sessaoPronta(servico);
    estado.callback?.(usuario());
    await sessaoPronta(servico);

    expect(servico.condominioId()).toBe('cond-1');
    expect(servico.perfil()?.email).toBe('ana@email.com');
  });

  it('carrega o vínculo no login', async () => {
    const servico = criarServico();
    estado.signIn.mockImplementation(async () => {
      const user = usuario();
      estado.callback?.(user);
      return { user };
    });

    await servico.entrar('ana@email.com', 'segredo');

    expect(servico.perfil()?.name).toBe('Ana');
    expect(servico.condominioId()).toBe('cond-1');
    expect(servico.situacaoVinculo()).toBe('unico');
  });

  it('limpa perfil, vínculo e condominioId no logout', async () => {
    const servico = criarServico();
    estado.callback?.(usuario());
    await sessaoPronta(servico);

    await servico.sair();

    expect(servico.autenticado()).toBe(false);
    expect(servico.perfil()).toBeNull();
    expect(servico.vinculoAtivo()).toBeNull();
    expect(servico.condominioId()).toBeNull();
    expect(servico.situacaoVinculo()).toBe('ausente');
  });

  it('não republica o vínculo se a consulta termina depois do logout', async () => {
    let entregarVinculos: (valor: { docs: unknown[] }) => void = () => undefined;
    estado.getDocs.mockReturnValue(
      new Promise((resolver) => {
        entregarVinculos = resolver;
      })
    );
    const servico = criarServico();

    estado.callback?.(usuario());
    await vi.waitFor(() => {
      expect(estado.getDocs).toHaveBeenCalled();
    });

    await servico.sair();
    entregarVinculos({ docs: [documentoVinculo('cond-1')] });
    await Promise.resolve();

    expect(servico.perfil()).toBeNull();
    expect(servico.condominioId()).toBeNull();
    expect(servico.vinculoAtivo()).toBeNull();
  });

  it('mantém a sessão autenticada sem condomínio quando não há vínculo ativo', async () => {
    estado.getDocs.mockResolvedValue({ docs: [] });
    const servico = criarServico();

    estado.callback?.(usuario());
    await sessaoPronta(servico);

    expect(servico.autenticado()).toBe(true);
    expect(servico.perfil()?.name).toBe('Ana');
    expect(servico.situacaoVinculo()).toBe('ausente');
    expect(servico.vinculoAtivo()).toBeNull();
    expect(servico.condominioId()).toBeNull();
  });

  it('não escolhe um vínculo quando existe mais de um ativo', async () => {
    estado.getDocs.mockResolvedValue({
      docs: [documentoVinculo('cond-1'), documentoVinculo('cond-2')],
    });
    const servico = criarServico();

    estado.callback?.(usuario());
    await sessaoPronta(servico);

    expect(servico.autenticado()).toBe(true);
    expect(servico.situacaoVinculo()).toBe('inconsistente');
    expect(servico.vinculoAtivo()).toBeNull();
    expect(servico.condominioId()).toBeNull();
  });

  it('não trata falha da consulta como ausência de vínculo', async () => {
    estado.getDocs.mockRejectedValue(Object.assign(new Error('negado'), { code: 'permission-denied' }));
    const servico = criarServico();

    estado.callback?.(usuario());
    await sessaoPronta(servico);

    expect(servico.autenticado()).toBe(true);
    expect(servico.perfil()?.name).toBe('Ana');
    expect(servico.situacaoVinculo()).toBe('erro');
    expect(servico.condominioId()).toBeNull();
  });

  it('monta o vínculo do cadastro com o id do condomínio gravado', async () => {
    estado.createUser.mockResolvedValue({ user: usuario() });
    const servico = criarServico();

    await servico.criarConta({
      nome: 'Ana',
      email: 'ana@email.com',
      senha: 'segredo',
      cpf: '529.982.247-25',
      telefone: '(11) 98888-7777',
      condominioId: 'cond-cadastro',
      bloco: '2',
      apartamento: '34',
    });

    expect(servico.autenticado()).toBe(true);
    expect(servico.perfil()?.name).toBe('Ana');
    expect(servico.situacaoVinculo()).toBe('unico');
    expect(servico.vinculoAtivo()).toMatchObject({
      id: 'uid-a_cond-cadastro',
      usuarioId: 'uid-a',
      condominioId: 'cond-cadastro',
      status: 'ativo',
      unidade: { bloco: '2', apartamento: '34' },
    });
    expect(servico.condominioId()).toBe('cond-cadastro');
    expect(estado.getDocs).not.toHaveBeenCalled();
  });
});
