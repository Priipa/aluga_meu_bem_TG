export const LIMITE_FOTOS = 3;
export const LIMITE_BYTES_FOTO = 5 * 1024 * 1024;
export const LADO_MAXIMO_FOTO = 1600;
export const TIPO_FOTO_PUBLICADA = 'image/jpeg';

const EXTENSAO_POR_TIPO = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const;

export type TipoFoto = keyof typeof EXTENSAO_POR_TIPO;

export interface ArquivoFoto {
  type: string;
  size: number;
}

export function extensaoDaFoto(tipo: string): 'jpg' | 'png' | 'webp' | null {
  return EXTENSAO_POR_TIPO[tipo as TipoFoto] ?? null;
}

export function selecionarFotos<T extends ArquivoFoto>(
  quantidadeAtual: number,
  novas: readonly T[],
): { aceitas: T[]; mensagem: string } {
  const aceitas: T[] = [];
  const mensagens = new Set<string>();

  for (const arquivo of novas) {
    const erro = mensagemDaFotoInvalida(arquivo);
    if (erro) {
      mensagens.add(erro);
      continue;
    }
    if (quantidadeAtual + aceitas.length >= LIMITE_FOTOS) {
      mensagens.add('Você pode adicionar no máximo 3 fotos.');
      continue;
    }
    aceitas.push(arquivo);
  }

  return { aceitas, mensagem: [...mensagens].join(' ') };
}

export function validarConjuntoDeFotos(fotos: readonly ArquivoFoto[]): void {
  if (fotos.length < 1) {
    throw new Error('Adicione pelo menos uma foto.');
  }
  if (fotos.length > LIMITE_FOTOS) {
    throw new Error('Você pode adicionar no máximo 3 fotos.');
  }
  for (const foto of fotos) {
    const erro = mensagemDaFotoInvalida(foto);
    if (erro) {
      throw new Error(erro);
    }
  }
}

export function dimensaoDaFoto(
  largura: number,
  altura: number,
  ladoMaximo = LADO_MAXIMO_FOTO,
): { largura: number; altura: number } {
  if (!Number.isInteger(largura) || !Number.isInteger(altura) || largura < 1 || altura < 1 || ladoMaximo < 1) {
    throw new Error('Não foi possível preparar a foto.');
  }
  const maior = Math.max(largura, altura);
  if (maior <= ladoMaximo) {
    return { largura, altura };
  }
  const fator = ladoMaximo / maior;
  return {
    largura: Math.max(1, Math.round(largura * fator)),
    altura: Math.max(1, Math.round(altura * fator)),
  };
}

export function nomeFotoPublicada(indice: number, identificador: string): string {
  return nomeArquivoFoto(indice, TIPO_FOTO_PUBLICADA, identificador);
}

export function nomeArquivoFoto(indice: number, tipo: string, identificador: string): string {
  const extensao = extensaoDaFoto(tipo);
  if (!extensao || indice < 1 || !/^[a-zA-Z0-9]+$/.test(identificador)) {
    throw new Error('Não foi possível preparar a foto.');
  }
  return `imagem-${indice}-${identificador}.${extensao}`;
}

export function caminhoFotoAnuncio(proprietarioId: string, anuncioId: string, arquivo: string): string {
  if (!trechoSeguro(proprietarioId) || !trechoSeguro(anuncioId) || !arquivoSeguro(arquivo)) {
    throw new Error('Não foi possível preparar a foto.');
  }
  return `anuncios/${proprietarioId}/${anuncioId}/${arquivo}`;
}

function mensagemDaFotoInvalida(arquivo: ArquivoFoto): string | null {
  if (!extensaoDaFoto(arquivo.type)) {
    return 'Use apenas fotos JPEG, PNG ou WebP.';
  }
  if (!Number.isFinite(arquivo.size) || arquivo.size <= 0) {
    return 'Não foi possível ler uma das fotos.';
  }
  if (arquivo.size > LIMITE_BYTES_FOTO) {
    return 'Cada foto pode ter no máximo 5 MB.';
  }
  return null;
}

function trechoSeguro(valor: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(valor);
}

function arquivoSeguro(valor: string): boolean {
  return /^imagem-[1-3]-[a-zA-Z0-9]+\.(jpg|png|webp)$/.test(valor);
}
