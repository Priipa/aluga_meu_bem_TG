import type { SituacaoVinculo } from './autenticacao.service';
import { CategoriaAnuncio, categoriaValida } from './categorias';
import { nomeExibicao } from './nome-exibicao';

/** Limites iguais aos de `firestore.rules` na criação de `anuncios`. */
export const LIMITE_TITULO = 80;
export const LIMITE_TEXTO = 500;
export const LIMITE_NOME_EXIBICAO = 40;

export interface DadosFormularioAnuncio {
  titulo: string;
  descricao: string;
  categoria: string;
  valorDiaria: number;
  porQueAlugar: string;
  acompanha: string;
  condicoes: string;
}

export interface VinculoParaAnuncio {
  id: string;
  usuarioId: string;
  condominioId: string;
  status: string;
}

/** Campos gravados em `anuncios/{id}`, sem os timestamps do servidor. */
export interface DocumentoAnuncio {
  titulo: string;
  descricao: string;
  categoria: CategoriaAnuncio;
  valorDiaria: number;
  porQueAlugar: string;
  acompanha: string;
  condicoes: string;
  proprietarioId: string;
  condominioId: string;
  vinculoId: string;
  nomeExibicao: string;
  status: 'ativo';
  disponivel: true;
}

export interface SessaoParaAnuncio {
  uid: string | null;
  nome: string;
  locadorHabilitado: boolean;
  situacaoVinculo: SituacaoVinculo;
  vinculo: VinculoParaAnuncio | null;
}

export function prepararAnuncio(sessao: SessaoParaAnuncio, dados: DadosFormularioAnuncio): DocumentoAnuncio {
  if (!sessao.uid) {
    throw new Error('Entre na sua conta para publicar um item.');
  }
  if (!sessao.locadorHabilitado) {
    throw new Error('Ative a função de locador para publicar um item.');
  }

  const vinculo = vinculoPublicavel(sessao);
  const titulo = textoObrigatorio(dados.titulo, LIMITE_TITULO, 'Informe o título do item.');
  const descricao = textoObrigatorio(dados.descricao, LIMITE_TEXTO, 'Informe a descrição do item.');
  const porQueAlugar = textoObrigatorio(dados.porQueAlugar, LIMITE_TEXTO, 'Informe por que vale alugar este item.');
  const categoria = dados.categoria.trim();
  if (!categoriaValida(categoria)) {
    throw new Error('Escolha uma categoria da lista.');
  }
  if (!Number.isFinite(dados.valorDiaria) || dados.valorDiaria <= 0) {
    throw new Error('Informe um valor por dia maior que zero.');
  }

  const exibicao = nomeExibicao(sessao.nome);
  if (!exibicao || exibicao.length > LIMITE_NOME_EXIBICAO) {
    throw new Error('Não foi possível identificar seu nome para o anúncio.');
  }

  return {
    titulo,
    descricao,
    categoria,
    valorDiaria: dados.valorDiaria,
    porQueAlugar,
    acompanha: textoOpcional(dados.acompanha, LIMITE_TEXTO),
    condicoes: textoOpcional(dados.condicoes, LIMITE_TEXTO),
    proprietarioId: sessao.uid,
    condominioId: vinculo.condominioId,
    vinculoId: vinculo.id,
    nomeExibicao: exibicao,
    status: 'ativo',
    disponivel: true,
  };
}

function vinculoPublicavel(sessao: SessaoParaAnuncio): VinculoParaAnuncio {
  if (sessao.situacaoVinculo === 'inconsistente') {
    throw new Error('Sua conta tem mais de um condomínio ativo. A publicação fica indisponível até isso ser resolvido.');
  }
  if (sessao.situacaoVinculo === 'erro') {
    throw new Error('Não foi possível confirmar seu condomínio. Tente novamente.');
  }
  const vinculo = sessao.vinculo;
  if (sessao.situacaoVinculo !== 'unico' || !vinculo || !sessao.uid) {
    throw new Error('Não encontramos um condomínio ativo na sua conta.');
  }
  if (
    vinculo.status !== 'ativo' ||
    vinculo.usuarioId !== sessao.uid ||
    !vinculo.condominioId ||
    vinculo.id !== `${sessao.uid}_${vinculo.condominioId}`
  ) {
    throw new Error('Não encontramos um condomínio ativo na sua conta.');
  }
  return vinculo;
}

function textoObrigatorio(valor: string, maximo: number, mensagem: string): string {
  const texto = valor.trim();
  if (!texto || texto.length > maximo) {
    throw new Error(mensagem);
  }
  return texto;
}

function textoOpcional(valor: string, maximo: number): string {
  const texto = valor.trim();
  if (texto.length > maximo) {
    throw new Error('Um dos textos passou do tamanho permitido.');
  }
  return texto;
}
