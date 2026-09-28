import { describe, expect, it } from 'vitest';
import { prepararAnuncio, SessaoParaAnuncio } from './anuncio-documento';

const dados = {
  titulo: '  Furadeira  ',
  descricao: ' Furadeira de impacto ',
  categoria: 'Ferramentas',
  valorDiaria: 25,
  porQueAlugar: ' Para um reparo rápido ',
  acompanha: '  ',
  condicoes: 'Devolver limpa',
};

function sessao(parcial: Partial<SessaoParaAnuncio> = {}): SessaoParaAnuncio {
  return {
    uid: 'uid-a',
    nome: 'Maria Ferreira',
    locadorHabilitado: true,
    situacaoVinculo: 'unico',
    vinculo: {
      id: 'uid-a_cond-1',
      usuarioId: 'uid-a',
      condominioId: 'cond-1',
      status: 'ativo',
    },
    ...parcial,
  };
}

describe('prepararAnuncio', () => {
  it('monta o documento com vínculo da sessão e nome de exibição', () => {
    expect(prepararAnuncio(sessao(), dados)).toEqual({
      titulo: 'Furadeira',
      descricao: 'Furadeira de impacto',
      categoria: 'Ferramentas',
      valorDiaria: 25,
      porQueAlugar: 'Para um reparo rápido',
      acompanha: '',
      condicoes: 'Devolver limpa',
      proprietarioId: 'uid-a',
      condominioId: 'cond-1',
      vinculoId: 'uid-a_cond-1',
      nomeExibicao: 'Maria F.',
      status: 'ativo',
      disponivel: true,
    });
  });

  it('não publica sem locador habilitado', () => {
    expect(() => prepararAnuncio(sessao({ locadorHabilitado: false }), dados)).toThrow(/locador/);
  });

  it('não publica sem vínculo, com vários vínculos ou com falha ao carregar', () => {
    expect(() => prepararAnuncio(sessao({ situacaoVinculo: 'ausente', vinculo: null }), dados)).toThrow(/condomínio/);
    expect(() => prepararAnuncio(sessao({ situacaoVinculo: 'inconsistente', vinculo: null }), dados)).toThrow(/mais de um/);
    expect(() => prepararAnuncio(sessao({ situacaoVinculo: 'erro', vinculo: null }), dados)).toThrow(/confirmar seu condomínio/);
  });

  it('não aceita categoria fora da lista nem valor inválido', () => {
    expect(() => prepararAnuncio(sessao(), { ...dados, categoria: 'Música' })).toThrow(/categoria/);
    expect(() => prepararAnuncio(sessao(), { ...dados, valorDiaria: 0 })).toThrow(/maior que zero/);
  });
});
