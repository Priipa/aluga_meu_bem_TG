import { describe, expect, it } from 'vitest';
import {
  LIMITE_BYTES_FOTO,
  TIPO_FOTO_PUBLICADA,
  caminhoFotoAnuncio,
  dimensaoDaFoto,
  extensaoDaFoto,
  nomeArquivoFoto,
  nomeFotoPublicada,
  selecionarFotos,
  validarConjuntoDeFotos,
} from './anuncio-fotos';

const jpeg = (size = 1000) => ({ type: 'image/jpeg', size });
const png = (size = 1000) => ({ type: 'image/png', size });
const webp = (size = 1000) => ({ type: 'image/webp', size });

describe('fotos do anúncio', () => {
  it('aceita jpeg, png e webp dentro do tamanho', () => {
    const resultado = selecionarFotos(0, [jpeg(), png(), webp(LIMITE_BYTES_FOTO)]);
    expect(resultado.aceitas).toHaveLength(3);
    expect(resultado.mensagem).toBe('');
  });

  it('não passa de 3 fotos e avisa quando a seleção excede', () => {
    const resultado = selecionarFotos(2, [jpeg(), png()]);
    expect(resultado.aceitas).toEqual([jpeg()]);
    expect(resultado.mensagem).toContain('no máximo 3 fotos');
  });

  it('recusa tipo inválido ou arquivo grande sem descartar os válidos', () => {
    const resultado = selecionarFotos(1, [
      { type: 'image/gif', size: 1000 },
      jpeg(),
      { type: 'image/png', size: LIMITE_BYTES_FOTO + 1 },
    ]);
    expect(resultado.aceitas).toEqual([jpeg()]);
    expect(resultado.mensagem).toContain('JPEG, PNG ou WebP');
    expect(resultado.mensagem).toContain('5 MB');
  });

  it('exige de 1 a 3 fotos válidas para publicar', () => {
    expect(() => validarConjuntoDeFotos([])).toThrow(/pelo menos uma foto/);
    expect(() => validarConjuntoDeFotos([jpeg(), png(), webp(), jpeg()])).toThrow(/no máximo 3 fotos/);
    expect(() => validarConjuntoDeFotos([{ type: 'text/plain', size: 10 }])).toThrow(/JPEG, PNG ou WebP/);
    expect(() => validarConjuntoDeFotos([jpeg(), png()])).not.toThrow();
  });

  it('limita o maior lado a 1600 px sem ampliar nem distorcer', () => {
    expect(dimensaoDaFoto(4000, 3000)).toEqual({ largura: 1600, altura: 1200 });
    expect(dimensaoDaFoto(3000, 4000)).toEqual({ largura: 1200, altura: 1600 });
    expect(dimensaoDaFoto(1200, 900)).toEqual({ largura: 1200, altura: 900 });
    expect(dimensaoDaFoto(800, 600)).toEqual({ largura: 800, altura: 600 });

    const paisagem = dimensaoDaFoto(2500, 1000);
    expect(paisagem).toEqual({ largura: 1600, altura: 640 });
    expect(paisagem.largura / paisagem.altura).toBeCloseTo(2500 / 1000);
  });

  it('publica sempre como JPEG .jpg', () => {
    expect(TIPO_FOTO_PUBLICADA).toBe('image/jpeg');
    const arquivo = nomeFotoPublicada(1, 'abc123');
    expect(arquivo).toBe('imagem-1-abc123.jpg');
    expect(caminhoFotoAnuncio('uidA', 'anuncio1', arquivo)).toBe(
      'anuncios/uidA/anuncio1/imagem-1-abc123.jpg',
    );
  });

  it('monta extensão e caminho sem usar o nome original', () => {
    expect(extensaoDaFoto('image/jpeg')).toBe('jpg');
    expect(extensaoDaFoto('image/png')).toBe('png');
    expect(extensaoDaFoto('image/webp')).toBe('webp');
    expect(extensaoDaFoto('image/gif')).toBeNull();

    const arquivo = nomeArquivoFoto(2, 'image/webp', 'abc123');
    expect(arquivo).toBe('imagem-2-abc123.webp');
    expect(caminhoFotoAnuncio('uidA', 'anuncio1', arquivo)).toBe(
      'anuncios/uidA/anuncio1/imagem-2-abc123.webp',
    );
    expect(() => nomeArquivoFoto(1, 'image/gif', 'abc')).toThrow();
    expect(() => caminhoFotoAnuncio('uidA', 'anuncio1', 'foto original.jpg')).toThrow();
  });
});
