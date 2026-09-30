import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { Anuncio } from './models';
import { anuncioDaLeitura, filtrarAnunciosDaHome } from './anuncio-lista';

function documento(parcial: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    titulo: 'Furadeira',
    descricao: 'Furadeira de impacto',
    categoria: 'Ferramentas',
    valorDiaria: 25,
    porQueAlugar: 'Para um reparo rápido',
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
    ...parcial,
  };
}

describe('anuncioDaLeitura', () => {
  it('usa o documentId e ignora um id gravado por engano no documento', () => {
    const anuncio = anuncioDaLeitura('doc-real', documento({ id: 'nao-usar' }));
    expect(anuncio?.id).toBe('doc-real');
    expect(anuncio?.nomeExibicao).toBe('Maria F.');
    expect(anuncio?.imagens).toEqual(['https://exemplo/foto.jpg']);
  });

  it('recusa documento sem título ou com imagem inválida', () => {
    expect(anuncioDaLeitura('doc-1', documento({ titulo: 10 }))).toBeNull();
    expect(anuncioDaLeitura('doc-1', documento({ imagens: [''] }))).toBeNull();
    expect(anuncioDaLeitura('', documento())).toBeNull();
  });
});

describe('filtrarAnunciosDaHome', () => {
  const anuncios = [
    anuncio('1', 'Furadeira', 'Ferramenta para parede', 'Ferramentas'),
    anuncio('2', 'Bicicleta', 'Passeio no fim de semana', 'Esporte'),
    anuncio('3', 'Projetor', 'Cinema em casa', 'Eletrônicos'),
  ];

  it('filtra título e descrição sem diferenciar maiúsculas', () => {
    expect(filtrarAnunciosDaHome(anuncios, '  FURADEIRA ', null).map((item) => item.id)).toEqual(['1']);
    expect(filtrarAnunciosDaHome(anuncios, 'cinema', null).map((item) => item.id)).toEqual(['3']);
  });

  it('filtra pela categoria oficial e combina com a busca', () => {
    expect(filtrarAnunciosDaHome(anuncios, '', 'Esporte').map((item) => item.id)).toEqual(['2']);
    expect(filtrarAnunciosDaHome(anuncios, 'casa', 'Eletrônicos').map((item) => item.id)).toEqual(['3']);
    expect(filtrarAnunciosDaHome(anuncios, 'furadeira', 'Esporte')).toEqual([]);
  });

  it('devolve a lista inteira quando não há termo nem categoria', () => {
    expect(filtrarAnunciosDaHome(anuncios, '   ', null)).toHaveLength(3);
  });
});

function anuncio(id: string, titulo: string, descricao: string, categoria: string): Anuncio {
  const lido = anuncioDaLeitura(id, documento({ titulo, descricao, categoria }));
  if (!lido) {
    throw new Error('documento de teste inválido');
  }
  return lido;
}
