import { Timestamp } from 'firebase/firestore';
import { Anuncio, StatusAnuncio } from './models';

const STATUS_ANUNCIO: readonly StatusAnuncio[] = ['ativo', 'pausado', 'arquivado'];

/**
 * Monta o anúncio da aplicação a partir do documento lido.
 * `id` é o documentId e não faz parte dos campos gravados.
 */
export function anuncioDaLeitura(id: string, dados: Record<string, unknown>): Anuncio | null {
  const titulo = dados['titulo'];
  const descricao = dados['descricao'];
  const categoria = dados['categoria'];
  const valorDiaria = dados['valorDiaria'];
  const porQueAlugar = dados['porQueAlugar'];
  const acompanha = dados['acompanha'];
  const condicoes = dados['condicoes'];
  const proprietarioId = dados['proprietarioId'];
  const condominioId = dados['condominioId'];
  const vinculoId = dados['vinculoId'];
  const nomeExibicao = dados['nomeExibicao'];
  const status = dados['status'];
  const disponivel = dados['disponivel'];
  const criadoEm = dados['criadoEm'];
  const atualizadoEm = dados['atualizadoEm'];
  const imagens = imagensDaLeitura(dados['imagens']);

  if (!id || imagens === null) {
    return null;
  }
  if (
    typeof titulo !== 'string' ||
    typeof descricao !== 'string' ||
    typeof categoria !== 'string' ||
    typeof porQueAlugar !== 'string' ||
    typeof acompanha !== 'string' ||
    typeof condicoes !== 'string' ||
    typeof proprietarioId !== 'string' ||
    typeof condominioId !== 'string' ||
    typeof vinculoId !== 'string' ||
    typeof nomeExibicao !== 'string'
  ) {
    return null;
  }
  if (typeof valorDiaria !== 'number' || !Number.isFinite(valorDiaria)) {
    return null;
  }
  if (!statusAnuncio(status) || typeof disponivel !== 'boolean') {
    return null;
  }
  if (!(criadoEm instanceof Timestamp) || !(atualizadoEm instanceof Timestamp)) {
    return null;
  }

  return {
    id,
    titulo,
    descricao,
    categoria,
    valorDiaria,
    porQueAlugar,
    acompanha,
    condicoes,
    imagens,
    proprietarioId,
    condominioId,
    vinculoId,
    nomeExibicao,
    status,
    disponivel,
    criadoEm,
    atualizadoEm,
  };
}

/** Busca e categoria acontecem depois da consulta do condomínio, só no cliente. */
export function filtrarAnunciosDaHome(
  anuncios: readonly Anuncio[],
  termo: string,
  categoria: string | null,
): Anuncio[] {
  const busca = termo.trim().toLocaleLowerCase('pt-BR');
  return anuncios.filter((anuncio) => {
    if (categoria && anuncio.categoria !== categoria) {
      return false;
    }
    if (!busca) {
      return true;
    }
    return (
      anuncio.titulo.toLocaleLowerCase('pt-BR').includes(busca) ||
      anuncio.descricao.toLocaleLowerCase('pt-BR').includes(busca)
    );
  });
}

function imagensDaLeitura(valor: unknown): string[] | null {
  if (!Array.isArray(valor) || valor.length > 3) {
    return null;
  }
  const imagens: string[] = [];
  for (const item of valor) {
    if (typeof item !== 'string' || item.length === 0) {
      return null;
    }
    imagens.push(item);
  }
  return imagens;
}

function statusAnuncio(valor: unknown): valor is StatusAnuncio {
  return typeof valor === 'string' && STATUS_ANUNCIO.includes(valor as StatusAnuncio);
}
