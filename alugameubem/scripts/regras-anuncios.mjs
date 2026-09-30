import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const regras = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const [host, porta] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const ambiente = await initializeTestEnvironment({
  projectId: 'demo-aluga-anuncios',
  firestore: { rules: regras, host, port: Number(porta) },
});

const agora = () => serverTimestamp();
let sequencia = 0;

function usuario(habilitado) {
  return {
    nome: 'Maria Ferreira',
    email: 'maria@email.com',
    locador: {
      habilitado,
      habilitadoEm: null,
      versaoTermos: habilitado ? '1' : null,
      termosAceitosEm: null,
    },
  };
}

function vinculo(usuarioId, condominioId, status = 'ativo') {
  return {
    usuarioId,
    condominioId,
    unidade: { bloco: '1', apartamento: '101' },
    status,
    criadoEm: agora(),
    atualizadoEm: agora(),
  };
}

function anuncio(parcial = {}) {
  return {
    titulo: 'Furadeira',
    descricao: 'Furadeira de impacto',
    categoria: 'Ferramentas',
    valorDiaria: 25,
    porQueAlugar: 'Para um reparo rápido',
    acompanha: '',
    condicoes: '',
    proprietarioId: 'uidLocador',
    condominioId: 'cond-a',
    vinculoId: 'uidLocador_cond-a',
    nomeExibicao: 'Maria F.',
    status: 'ativo',
    disponivel: true,
    imagens: ['https://exemplo/foto.jpg'],
    criadoEm: agora(),
    atualizadoEm: agora(),
    ...parcial,
  };
}

function anuncioSem(campo) {
  const dados = anuncio();
  delete dados[campo];
  return dados;
}

async function tentarCriar(banco, parcial = {}) {
  sequencia += 1;
  return setDoc(doc(banco, `anuncios/item-${sequencia}`), anuncio(parcial));
}

function consultaFeed(banco, condominioId) {
  return query(
    collection(banco, 'anuncios'),
    where('condominioId', '==', condominioId),
    where('status', '==', 'ativo'),
    where('disponivel', '==', true),
    orderBy('criadoEm', 'desc'),
  );
}

async function negadoPorRegra(operacao) {
  const erro = await assertFails(operacao);
  if (erro?.code !== 'permission-denied') {
    throw new Error(`esperava permission-denied, recebeu ${erro?.code ?? 'sem código'}: ${erro?.message ?? erro}`);
  }
}

await ambiente.withSecurityRulesDisabled(async (contexto) => {
  const banco = contexto.firestore();
  await setDoc(doc(banco, 'condominios/cond-b'), {
    nome: 'Condominio B',
    endereco: {
      logradouro: 'Rua 2',
      numero: '20',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01000-000',
    },
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  });
  await setDoc(doc(banco, 'condominios/cond-a'), {
    nome: 'Condominio A',
    endereco: {
      logradouro: 'Rua 1',
      numero: '10',
      complemento: '',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01000-000',
    },
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  });
  await setDoc(doc(banco, 'usuarios/uidLocador'), usuario(true));
  await setDoc(doc(banco, 'usuarios/uidComum'), usuario(false));
  await setDoc(doc(banco, 'usuarios/uidInativo'), usuario(true));
  await setDoc(doc(banco, 'vinculos/uidLocador_cond-a'), vinculo('uidLocador', 'cond-a'));
  await setDoc(doc(banco, 'vinculos/uidComum_cond-a'), vinculo('uidComum', 'cond-a'));
  await setDoc(doc(banco, 'vinculos/uidInativo_cond-a'), vinculo('uidInativo', 'cond-a', 'inativo'));
  await setDoc(doc(banco, 'anuncios/pausado'), anuncio({ status: 'pausado' }));
  await setDoc(doc(banco, 'anuncios/indisponivel'), anuncio({ disponivel: false }));
  await setDoc(doc(banco, 'anuncios/outro-condominio'), anuncio({
    proprietarioId: 'uidOutro',
    condominioId: 'cond-c',
    vinculoId: 'uidOutro_cond-c',
  }));
});

const locador = ambiente.authenticatedContext('uidLocador').firestore();
const comum = ambiente.authenticatedContext('uidComum').firestore();
const inativo = ambiente.authenticatedContext('uidInativo').firestore();
const visitante = ambiente.unauthenticatedContext().firestore();

await assertSucceeds(tentarCriar(locador));
console.log('permitido: anúncio válido com 1 imagem');

await assertSucceeds(tentarCriar(locador, {
  imagens: ['https://exemplo/1.jpg', 'https://exemplo/2.jpg', 'https://exemplo/3.jpg'],
}));
console.log('permitido: anúncio válido com 3 imagens');

await assertSucceeds(tentarCriar(locador, { acompanha: 'Maleta e brocas', condicoes: 'Devolver limpa' }));
console.log('permitido: acompanha e condições preenchidos');

await assertFails(tentarCriar(visitante));
console.log('negado: visitante');

await assertFails(tentarCriar(comum, {
  proprietarioId: 'uidComum',
  vinculoId: 'uidComum_cond-a',
}));
console.log('negado: autenticado que não é locador');

await assertFails(tentarCriar(comum, {
  proprietarioId: 'uidComum',
  vinculoId: 'uidComum_cond-a',
  nomeExibicao: 'João C.',
}));
console.log('negado: locador desabilitado');

await assertFails(tentarCriar(locador, { proprietarioId: 'uidOutro' }));
console.log('negado: proprietarioId de outro usuário');

await assertFails(tentarCriar(locador, { condominioId: 'cond-b' }));
console.log('negado: condomínio diferente do vínculo');

await assertFails(tentarCriar(locador, {
  condominioId: 'cond-x',
  vinculoId: 'uidLocador_cond-x',
}));
console.log('negado: vínculo inexistente');

await assertFails(tentarCriar(inativo, {
  proprietarioId: 'uidInativo',
  vinculoId: 'uidInativo_cond-a',
}));
console.log('negado: vínculo inativo');

await assertFails(tentarCriar(locador, { categoria: 'Música' }));
console.log('negado: categoria inválida');

await assertFails(tentarCriar(locador, { valorDiaria: 0 }));
await assertFails(tentarCriar(locador, { valorDiaria: -1 }));
console.log('negado: valorDiaria <= 0');

await assertFails(tentarCriar(locador, { titulo: '' }));
await assertFails(tentarCriar(locador, { titulo: '   ' }));
console.log('negado: título vazio');

await assertFails(tentarCriar(locador, { descricao: '' }));
console.log('negado: descrição vazia');

await assertFails(tentarCriar(locador, { porQueAlugar: '' }));
console.log('negado: porQueAlugar vazio');

await assertFails(tentarCriar(locador, { status: 'pausado' }));
console.log('negado: status diferente de ativo');

await assertFails(tentarCriar(locador, { disponivel: false }));
console.log('negado: disponivel false na criação');

await assertFails(setDoc(doc(locador, 'anuncios/sem-imagens'), anuncioSem('imagens')));
console.log('negado: sem imagens');

await assertFails(tentarCriar(locador, { imagens: [] }));
console.log('negado: imagens vazias');

await assertFails(tentarCriar(locador, {
  imagens: ['https://exemplo/1.jpg', 'https://exemplo/2.jpg', 'https://exemplo/3.jpg', 'https://exemplo/4.jpg'],
}));
console.log('negado: mais de 3 imagens');

await assertFails(tentarCriar(locador, { imagens: 'https://exemplo/foto.jpg' }));
console.log('negado: imagens que não é lista');

await assertFails(tentarCriar(locador, { imagens: [''] }));
await assertFails(tentarCriar(locador, { imagens: ['https://exemplo/1.jpg', ''] }));
console.log('negado: URL vazia');

await assertFails(tentarCriar(locador, { image: 'https://exemplo/foto.jpg' }));
console.log('negado: campo extra');

const anuncioDoDono = await assertSucceeds(getDoc(doc(locador, 'anuncios/item-1')));
const anuncioDoMorador = await assertSucceeds(getDoc(doc(comum, 'anuncios/item-1')));
if (!anuncioDoDono.exists() || !anuncioDoMorador.exists() || anuncioDoMorador.id !== 'item-1') {
  throw new Error('get do anúncio ativo do mesmo condomínio falhou');
}
console.log('permitido: get do morador e do proprietário no mesmo condomínio');

await negadoPorRegra(getDoc(doc(visitante, 'anuncios/item-1')));
await negadoPorRegra(getDocs(collection(locador, 'anuncios')));
console.log('negado: get de visitante e listagem da coleção inteira');

const feedComum = await assertSucceeds(getDocs(consultaFeed(comum, 'cond-a')));
const idsComum = feedComum.docs.map((item) => item.id);
if (!idsComum.includes('item-1')) {
  throw new Error('feed do condomínio não trouxe o anúncio ativo');
}
if (
  idsComum.includes('pausado') ||
  idsComum.includes('indisponivel') ||
  idsComum.includes('outro-condominio')
) {
  throw new Error(`feed incluiu anúncio fora da consulta: ${idsComum.join(',')}`);
}
const feedLocador = await assertSucceeds(getDocs(consultaFeed(locador, 'cond-a')));
if (!feedLocador.docs.some((item) => item.id === 'item-1')) {
  throw new Error('anúncio do próprio usuário ficou de fora do feed');
}
console.log('permitido: listagem do condomínio com vínculo ativo');

await negadoPorRegra(getDocs(consultaFeed(visitante, 'cond-a')));
console.log('negado: visitante na listagem');

const semVinculo = ambiente.authenticatedContext('uidSemVinculo').firestore();
await negadoPorRegra(getDocs(consultaFeed(semVinculo, 'cond-a')));
console.log('negado: usuário sem vínculo');

await negadoPorRegra(getDocs(consultaFeed(inativo, 'cond-a')));
console.log('negado: vínculo inativo');

await negadoPorRegra(getDocs(consultaFeed(comum, 'cond-c')));
await negadoPorRegra(getDocs(consultaFeed(locador, 'cond-c')));
console.log('negado: outro condomínio');

await negadoPorRegra(getDoc(doc(semVinculo, 'anuncios/item-1')));
await negadoPorRegra(getDoc(doc(inativo, 'anuncios/item-1')));
await negadoPorRegra(getDoc(doc(comum, 'anuncios/outro-condominio')));
await negadoPorRegra(getDoc(doc(locador, 'anuncios/outro-condominio')));
await negadoPorRegra(getDoc(doc(locador, 'anuncios/pausado')));
await negadoPorRegra(getDoc(doc(comum, 'anuncios/pausado')));
await negadoPorRegra(getDoc(doc(locador, 'anuncios/indisponivel')));
await negadoPorRegra(getDoc(doc(comum, 'anuncios/indisponivel')));
console.log('negado: get sem vínculo, vínculo inativo, outro condomínio, pausado ou indisponível');

await negadoPorRegra(getDocs(query(
  collection(comum, 'anuncios'),
  where('status', '==', 'ativo'),
  where('disponivel', '==', true),
)));
console.log('negado: query sem condominioId');

await negadoPorRegra(getDocs(query(
  collection(comum, 'anuncios'),
  where('condominioId', '==', 'cond-a'),
  where('disponivel', '==', true),
)));
console.log('negado: query sem status ativo');

await negadoPorRegra(getDocs(query(
  collection(comum, 'anuncios'),
  where('condominioId', '==', 'cond-a'),
  where('status', '==', 'ativo'),
)));
console.log('negado: query sem disponivel true');

await assertFails(updateDoc(doc(locador, 'anuncios/item-1'), { titulo: 'Outro' }));
await assertFails(deleteDoc(doc(locador, 'anuncios/item-1')));
console.log('negado: update e delete');

const consultaPropria = query(
  collection(locador, 'vinculos'),
  where('usuarioId', '==', 'uidLocador'),
  where('status', '==', 'ativo')
);
const proprios = await assertSucceeds(getDocs(consultaPropria));
if (proprios.size !== 1) {
  throw new Error(`vínculo próprio falhou: ${proprios.size}`);
}
await assertFails(getDocs(query(
  collection(visitante, 'vinculos'),
  where('usuarioId', '==', 'uidLocador'),
  where('status', '==', 'ativo')
)));
await assertFails(updateDoc(doc(locador, 'vinculos/uidLocador_cond-a'), { status: 'inativo' }));
await assertFails(setDoc(doc(locador, 'vinculos/uidLocador_cond-a-extra'), {
  usuarioId: 'uidLocador',
  condominioId: 'cond-a',
  unidade: { bloco: '2', apartamento: '202' },
  status: 'ativo',
  criadoEm: agora(),
  atualizadoEm: agora(),
}));
await assertSucceeds(setDoc(doc(locador, 'vinculos/uidLocador_cond-b'), {
  usuarioId: 'uidLocador',
  condominioId: 'cond-b',
  unidade: { bloco: '2', apartamento: '202' },
  status: 'ativo',
  criadoEm: agora(),
  atualizadoEm: agora(),
}));
console.log('regras anteriores de vínculos continuam válidas');

await assertSucceeds(getDoc(doc(locador, 'usuarios/uidLocador')));
await assertFails(getDoc(doc(locador, 'usuarios/uidComum')));
await assertFails(getDoc(doc(visitante, 'usuarios/uidLocador')));
await assertSucceeds(getDoc(doc(visitante, 'condominios/cond-a')));
console.log('regras de usuarios e condominios continuam válidas');

await ambiente.cleanup();
console.log('regras de anuncios validadas');
