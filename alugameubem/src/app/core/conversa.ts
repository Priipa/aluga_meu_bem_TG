import { Anuncio, Conversa } from './models';
import { LIMITE_NOME_EXIBICAO, LIMITE_TEXTO } from './anuncio-documento';
import { nomeExibicao } from './nome-exibicao';

export const LIMITE_MENSAGEM = LIMITE_TEXTO;
export const COLECAO_CONVERSAS = 'conversas';
export const SUBCOLECAO_MENSAGENS = 'mensagens';

export function idConversa(anuncioId: string, interessadoId: string): string {
  return `${anuncioId}_${interessadoId}`;
}

export function partesDaConversa(conversaId: string): { anuncioId: string; interessadoId: string } | null {
  const corte = conversaId.indexOf('_');
  if (corte <= 0 || corte === conversaId.length - 1) {
    return null;
  }
  if (conversaId.includes('_', corte + 1)) {
    return null;
  }
  return {
    anuncioId: conversaId.slice(0, corte),
    interessadoId: conversaId.slice(corte + 1),
  };
}

export function textoDaMensagem(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function mensagemValida(valor: unknown): string {
  const texto = textoDaMensagem(valor);
  if (!texto) {
    throw new Error('Escreva uma mensagem.');
  }
  if (texto.length > LIMITE_MENSAGEM) {
    throw new Error('A mensagem passou do tamanho permitido.');
  }
  return texto;
}

export function documentoDaConversa(entrada: {
  anuncio: Anuncio;
  interessadoId: string;
  nomeInteressado: string;
  texto: string;
}): Omit<Conversa, 'id' | 'criadoEm' | 'atualizadoEm'> {
  const nome = nomeExibicao(entrada.nomeInteressado);
  if (!nome || nome.length > LIMITE_NOME_EXIBICAO) {
    throw new Error('Não foi possível identificar seu nome para a conversa.');
  }
  if (entrada.interessadoId === entrada.anuncio.proprietarioId) {
    throw new Error('Este anúncio é seu.');
  }
  const texto = mensagemValida(entrada.texto);
  return {
    anuncioId: entrada.anuncio.id,
    condominioId: entrada.anuncio.condominioId,
    proprietarioId: entrada.anuncio.proprietarioId,
    interessadoId: entrada.interessadoId,
    participantes: [entrada.anuncio.proprietarioId, entrada.interessadoId],
    tituloAnuncio: entrada.anuncio.titulo,
    nomeProprietario: entrada.anuncio.nomeExibicao,
    nomeInteressado: nome,
    ultimaMensagem: texto,
  };
}

export function nomeDoOutro(conversa: Pick<Conversa, 'proprietarioId' | 'nomeProprietario' | 'nomeInteressado'>, uid: string): string {
  return uid === conversa.proprietarioId ? conversa.nomeInteressado : conversa.nomeProprietario;
}
