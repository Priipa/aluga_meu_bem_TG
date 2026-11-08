import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { MARCA_TEXTO_OPCIONAL_VAZIO } from './anuncio-documento';
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

  it('trata porQueAlugar vazio gravado de forma compatível', () => {
    expect(anuncioDaLeitura('doc-1', documento({ porQueAlugar: MARCA_TEXTO_OPCIONAL_VAZIO }))?.porQueAlugar).toBe('');
  });
});

describe('filtrarAnunciosDaHome', () => {
  const anuncios = [
    anuncio('1', 'Furadeira', 'Ferramentas', 25),
    anuncio('2', 'Bicicleta', 'Esporte', 40),
    anuncio('3', 'Projetor', 'Eletrônicos', 80),
  ];

  it('filtra pela categoria oficial', () => {
    expect(filtrarAnunciosDaHome(anuncios, 'Esporte', null, null).map((item) => item.id)).toEqual(['2']);
    expect(filtrarAnunciosDaHome(anuncios, 'Eletrônicos', null, null).map((item) => item.id)).toEqual(['3']);
  });

  it('filtra pela faixa de valor e combina com a categoria', () => {
    expect(filtrarAnunciosDaHome(anuncios, null, 40, null).map((item) => item.id)).toEqual(['2', '3']);
    expect(filtrarAnunciosDaHome(anuncios, null, null, 40).map((item) => item.id)).toEqual(['1', '2']);
    expect(filtrarAnunciosDaHome(anuncios, null, 30, 80).map((item) => item.id)).toEqual(['2', '3']);
    expect(filtrarAnunciosDaHome(anuncios, 'Ferramentas', 20, 30).map((item) => item.id)).toEqual(['1']);
    expect(filtrarAnunciosDaHome(anuncios, 'Esporte', 50, null)).toEqual([]);
  });

  it('devolve a lista inteira quando não há categoria nem faixa de valor', () => {
    expect(filtrarAnunciosDaHome(anuncios, null, null, null)).toHaveLength(3);
  });
});

function anuncio(id: string, titulo: string, categoria: string, valorDiaria: number): Anuncio {
  const lido = anuncioDaLeitura(id, documento({ titulo, categoria, valorDiaria }));
  if (!lido) {
    throw new Error('documento de teste inválido');
  }
  return lido;
}
