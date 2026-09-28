import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

const regras = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const [host, porta] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const ambiente = await initializeTestEnvironment({
  projectId: 'demo-aluga-vinculos',
  firestore: {
    rules: regras,
    host,
    port: Number(porta),
  },
});

const agora = () => serverTimestamp();

function endereco() {
  return {
    logradouro: 'Rua 1',
    numero: '10',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Sao Paulo',
    estado: 'SP',
    cep: '01000-000',
  };
}

function vinculo(usuarioId, condominioId) {
  return {
    usuarioId,
    condominioId,
    unidade: { bloco: '1', apartamento: '101' },
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  };
}

await ambiente.withSecurityRulesDisabled(async (contexto) => {
  const banco = contexto.firestore();
  await setDoc(doc(banco, 'condominios/cond-a'), {
    nome: 'Condominio A',
    endereco: endereco(),
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  });
  await setDoc(doc(banco, 'condominios/cond-novo'), {
    nome: 'Condominio Novo',
    endereco: endereco(),
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  });
  await setDoc(doc(banco, 'vinculos/uidA_cond-a'), vinculo('uidA', 'cond-a'));
  await setDoc(doc(banco, 'vinculos/uidB_cond-a'), vinculo('uidB', 'cond-a'));
  await setDoc(doc(banco, 'vinculos/uidD_cond-a'), vinculo('uidD', 'cond-a'));
  await setDoc(doc(banco, 'vinculos/uidD_cond-b'), vinculo('uidD', 'cond-b'));
});

const bancoA = ambiente.authenticatedContext('uidA').firestore();
const bancoAnon = ambiente.unauthenticatedContext().firestore();

const consultaDe = (banco, uid) =>
  query(collection(banco, 'vinculos'), where('usuarioId', '==', uid), where('status', '==', 'ativo'));

const proprios = await assertSucceeds(getDocs(consultaDe(bancoA, 'uidA')));
if (proprios.size !== 1 || proprios.docs[0].data().condominioId !== 'cond-a') {
  throw new Error(`A falhou: esperado 1 vínculo de uidA, recebido ${proprios.size}`);
}
console.log('A ok: uidA lê o próprio vínculo ativo');

await assertFails(getDoc(doc(bancoA, 'vinculos/uidB_cond-a')));
console.log('B ok: uidA não lê o vínculo de uidB');

await assertFails(getDocs(consultaDe(bancoA, 'uidB')));
console.log('C ok: uidA não consulta os vínculos de uidB');

await assertFails(getDocs(consultaDe(bancoAnon, 'uidA')));
console.log('D ok: visitante não consulta vínculos');

await assertFails(getDocs(query(collection(bancoA, 'vinculos'), where('status', '==', 'ativo'))));
console.log('list sem usuarioId ok: a rule não funciona como filtro');

const vazio = await assertSucceeds(getDocs(consultaDe(ambiente.authenticatedContext('uidC').firestore(), 'uidC')));
if (vazio.size !== 0) {
  throw new Error(`sessão 0 falhou: esperado 0, recebido ${vazio.size}`);
}
console.log('sessão 0 ok: consulta vazia');

const unico = await assertSucceeds(getDocs(consultaDe(bancoA, 'uidA')));
if (unico.size !== 1 || unico.docs[0].id !== 'uidA_cond-a') {
  throw new Error(`sessão 1 falhou: esperado uidA_cond-a, recebido ${unico.size}`);
}
console.log('sessão 1 ok: exatamente um vínculo');

const varios = await assertSucceeds(
  getDocs(consultaDe(ambiente.authenticatedContext('uidD').firestore(), 'uidD'))
);
if (varios.size !== 2) {
  throw new Error(`sessão múltipla falhou: esperado 2, recebido ${varios.size}`);
}
console.log('sessão múltipla ok: a query devolve os dois, sem escolher um');

await assertSucceeds(
  setDoc(doc(bancoA, 'vinculos/uidA_cond-novo'), {
    usuarioId: 'uidA',
    condominioId: 'cond-novo',
    unidade: { bloco: '2', apartamento: '202' },
    status: 'ativo',
    criadoEm: agora(),
    atualizadoEm: agora(),
  })
);
console.log('E ok: create do próprio vínculo continua permitido');

await assertFails(updateDoc(doc(bancoA, 'vinculos/uidA_cond-a'), { status: 'inativo' }));
await assertFails(deleteDoc(doc(bancoA, 'vinculos/uidA_cond-a')));
console.log('F ok: update e delete continuam bloqueados');

await ambiente.cleanup();
console.log('regras de vinculos validadas');
