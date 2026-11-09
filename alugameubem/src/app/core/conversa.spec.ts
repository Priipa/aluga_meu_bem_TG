import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { Anuncio } from './models';
import { documentoDaConversa, idConversa, mensagemValida, partesDaConversa } from './conversa';

describe('id e partes da conversa', () => {
  it('monta e lê o par anúncio + interessado', () => {
    expect(idConversa('anuncio1', 'uid2')).toBe('anuncio1_uid2');
    expect(partesDaConversa('anuncio1_uid2')).toEqual({ anuncioId: 'anuncio1', interessadoId: 'uid2' });
  });

  it('recusa identificador sem o par', () => {
    expect(partesDaConversa('sozanuncio')).toBeNull();
    expect(partesDaConversa('_uid')).toBeNull();
    expect(partesDaConversa('anuncio_uid_extra')).toBeNull();
  });
});

describe('documentoDaConversa', () => {
  it('grava o interessado e a primeira mensagem', () => {
    const documento = documentoDaConversa({
      anuncio: anuncio(),
      interessadoId: 'uid-b',
      nomeInteressado: 'João Silva',
      texto: '  A furadeira está disponível amanhã?  ',
    });
    expect(documento.interessadoId).toBe('uid-b');
    expect(documento.nomeInteressado).toBe('João S.');
    expect(documento.ultimaMensagem).toBe('A furadeira está disponível amanhã?');
    expect(documento.participantes).toEqual(['uid-a', 'uid-b']);
  });

  it('não deixa o dono abrir conversa consigo mesmo', () => {
    expect(() =>
      documentoDaConversa({
        anuncio: anuncio(),
        interessadoId: 'uid-a',
        nomeInteressado: 'Maria Ferreira',
        texto: 'Oi',
      }),
    ).toThrow(/seu/);
  });
});

describe('mensagemValida', () => {
  it('exige texto e respeita o limite', () => {
    expect(mensagemValida('  Olá  ')).toBe('Olá');
    expect(() => mensagemValida('   ')).toThrow(/mensagem/);
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
