import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, listAll, ref, uploadBytes } from 'firebase/storage';

const regras = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');
const [host, porta] = (process.env.FIREBASE_STORAGE_EMULATOR_HOST ?? '127.0.0.1:9199').split(':');
const ambiente = await initializeTestEnvironment({
  projectId: 'demo-aluga-storage',
  storage: { rules: regras, host, port: Number(porta) },
});

const dono = ambiente.authenticatedContext('uidDono').storage();
const outro = ambiente.authenticatedContext('uidOutro').storage();
const visitante = ambiente.unauthenticatedContext().storage();
const caminho = 'anuncios/uidDono/anuncio-1/imagem-1-abc.jpg';
const cincoMb = 5 * 1024 * 1024;

function bytes(tamanho) {
  return new Uint8Array(tamanho);
}

function enviar(storage, caminhoArquivo, tipo, tamanho = 32) {
  return uploadBytes(ref(storage, caminhoArquivo), bytes(tamanho), { contentType: tipo });
}

await assertSucceeds(enviar(dono, caminho, 'image/jpeg'));
console.log('permitido: dono autenticado no próprio caminho, JPEG');

await assertSucceeds(enviar(dono, 'anuncios/uidDono/anuncio-1/imagem-2-abc.png', 'image/png'));
console.log('permitido: PNG válido');

await assertSucceeds(enviar(dono, 'anuncios/uidDono/anuncio-1/imagem-3-abc.webp', 'image/webp'));
console.log('permitido: WebP válido');

await assertSucceeds(enviar(dono, 'anuncios/uidDono/anuncio-1/imagem-1-limite.jpg', 'image/jpeg', cincoMb));
console.log('permitido: arquivo de 5 MB');

await assertSucceeds(getBytes(ref(dono, caminho)));
console.log('permitido: dono lê o próprio arquivo');

await assertFails(enviar(visitante, 'anuncios/visitante/anuncio-1/imagem-1-abc.jpg', 'image/jpeg'));
console.log('negado: visitante');

await assertFails(enviar(outro, caminho, 'image/jpeg'));
await assertFails(getBytes(ref(outro, caminho)));
await assertFails(deleteObject(ref(outro, caminho)));
console.log('negado: outro usuário');

await assertFails(enviar(dono, 'fotos/uidDono/imagem-1-abc.jpg', 'image/jpeg'));
await assertFails(enviar(dono, 'anuncios/uidDono/imagem-1-abc.jpg', 'image/jpeg'));
console.log('negado: caminho fora de anuncios/{uid}/{anuncioId}');

await assertFails(enviar(dono, 'anuncios/uidDono/anuncio-1/imagem-1-abc.gif', 'image/gif'));
console.log('negado: tipo inválido');

await assertFails(enviar(dono, 'anuncios/uidDono/anuncio-1/imagem-1-grande.jpg', 'image/jpeg', cincoMb + 1));
console.log('negado: arquivo maior que 5 MB');

await assertFails(listAll(ref(dono, 'anuncios/uidDono/anuncio-1')));
console.log('negado: listagem');

await assertSucceeds(deleteObject(ref(dono, caminho)));
try {
  await getBytes(ref(dono, caminho));
  throw new Error('o arquivo removido ainda pode ser lido');
} catch (erro) {
  if (erro?.code !== 'storage/object-not-found') {
    throw erro;
  }
}
console.log('permitido: dono remove o arquivo que enviou');

await ambiente.cleanup();
console.log('regras de storage validadas');
