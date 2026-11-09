import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { Anuncio } from './models';
import {
  diasDoPeriodo,
  documentoDaLocacao,
  ehStatusAtivo,
  podeAlterarStatus,
  primeiroNome,
  rotuloRetirada,
  rotuloStatusLocacao,
} from './locacao';

describe('diasDoPeriodo', () => {
  it('conta os dias entre as datas, sem incluir o dia final a menos', () => {
    expect(diasDoPeriodo('2026-05-18', '2026-05-20')).toBe(2);
    expect(diasDoPeriodo('2026-05-18', '2026-05-18')).toBe(0);
  });
});

describe('documentoDaLocacao', () => {
  it('monta a solicitação pendente com o total dos dias', () => {
    const documento = documentoDaLocacao({
      anuncio: anuncio(),
      locatarioId: 'uid-b',
      nomeLocatario: 'João Silva',
      mensagem: '  Posso alugar no sábado?  ',
      inicioIso: '2099-05-18',
      fimIso: '2099-05-20',
    });
    expect(documento.status).toBe('pendente');
    expect(documento.dias).toBe(2);
    expect(documento.valorTotal).toBe(50);
    expect(documento.nomeLocatario).toBe('João S.');
    expect(documento.mensagem).toBe('Posso alugar no sábado?');
    expect(documento.participantes).toEqual(['uid-a', 'uid-b']);
  });

  it('não deixa o dono solicitar o próprio item', () => {
    expect(() =>
      documentoDaLocacao({
        anuncio: anuncio(),
        locatarioId: 'uid-a',
        nomeLocatario: 'Maria Ferreira',
        mensagem: 'Oi',
        inicioIso: '2099-05-18',
        fimIso: '2099-05-20',
      }),
    ).toThrow(/seu/);
  });
});

describe('rotuloStatusLocacao', () => {
  it('rotula os estados da locação', () => {
    expect(rotuloStatusLocacao('pendente')).toBe('Pendente');
    expect(rotuloStatusLocacao('aprovado')).toBe('Aprovado');
    expect(rotuloStatusLocacao('em_andamento')).toBe('Em uso');
    expect(rotuloStatusLocacao('concluido')).toBe('Concluído');
    expect(rotuloStatusLocacao('recusado')).toBe('Recusado');
    expect(rotuloStatusLocacao('cancelado')).toBe('Cancelado');
  });
});

describe('podeAlterarStatus', () => {
  const base = {
    status: 'pendente' as const,
    locadorId: 'uid-a',
    locatarioId: 'uid-b',
  };

  it('deixa o locador aceitar ou recusar o pedido', () => {
    expect(podeAlterarStatus(base, 'uid-a', 'aprovado')).toBe(true);
    expect(podeAlterarStatus(base, 'uid-a', 'recusado')).toBe(true);
    expect(podeAlterarStatus(base, 'uid-b', 'aprovado')).toBe(false);
  });

  it('deixa o locatário cancelar, retirar e devolver', () => {
    expect(podeAlterarStatus(base, 'uid-b', 'cancelado')).toBe(true);
    expect(podeAlterarStatus({ ...base, status: 'aprovado' }, 'uid-b', 'em_andamento')).toBe(true);
    expect(podeAlterarStatus({ ...base, status: 'em_andamento' }, 'uid-b', 'concluido')).toBe(true);
  });
});

describe('ehStatusAtivo', () => {
  it('separa aluguéis em andamento dos encerrados', () => {
    expect(ehStatusAtivo('aprovado')).toBe(true);
    expect(ehStatusAtivo('concluido')).toBe(false);
  });
});

describe('primeiroNome', () => {
  it('usa o primeiro nome para o botão de chat', () => {
    expect(primeiroNome('Lucas Silveira')).toBe('Lucas');
  });
});

describe('rotuloRetirada', () => {
  it('descreve a retirada a partir da data de início', () => {
    expect(rotuloRetirada('2099-01-01')).toMatch(/Retirada combinada para/);
  });
});

function anuncio(): Anuncio {
  return {
    id: 'anuncio1',
    titulo: 'Furadeira',
    descricao: 'Furadeira de impacto',
    categoria: 'Ferramentas',
    valorDiaria: 25,
    porQueAlugar: '',
    acompanha: '',
    condicoes: '',
    imagens: ['https://exemplo/foto.jpg'],
    proprietarioId: 'uid-a',
    condominioId: 'cond-1',
    vinculoId: 'uid-a_cond-1',
    nomeExibicao: 'Maria F.',
    status: 'ativo',
    disponivel: true,
    criadoEm: Timestamp.fromDate(new Date('2026-09-01T12:00:00Z')),
    atualizadoEm: Timestamp.fromDate(new Date('2026-09-01T12:00:00Z')),
  };
}
