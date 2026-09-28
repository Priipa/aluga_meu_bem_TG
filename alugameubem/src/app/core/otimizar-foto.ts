import { LIMITE_BYTES_FOTO, dimensaoDaFoto } from './anuncio-fotos';

export const QUALIDADE_JPEG = 0.8;

const MENSAGEM_FOTO = 'Não foi possível preparar uma das fotos. Tente outra imagem.';

export async function otimizarFoto(arquivo: Blob): Promise<Blob> {
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
    const destino = dimensaoDaFoto(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = destino.largura;
    canvas.height = destino.altura;
    const contexto = canvas.getContext('2d');
    if (!contexto) {
      throw new Error('Canvas indisponível');
    }
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, destino.largura, destino.altura);
    contexto.drawImage(bitmap, 0, 0, destino.largura, destino.altura);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((resultado) => resolve(resultado), 'image/jpeg', QUALIDADE_JPEG);
    });
    if (!blob || blob.type !== 'image/jpeg' || blob.size <= 0 || blob.size > LIMITE_BYTES_FOTO) {
      throw new Error('JPEG de saída inválido');
    }
    return blob;
  } catch (erro) {
    console.error('Falha ao preparar a foto', erro);
    throw new Error(MENSAGEM_FOTO);
  } finally {
    bitmap?.close();
  }
}
