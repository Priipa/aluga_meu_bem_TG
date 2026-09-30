import { readFileSync } from 'node:fs';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';

const regras = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');
const [host, porta] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8080').split(':');
const ambiente = await initializeTestEnvironment({
  projectId: 'demo-aluga-usuarios',
  firestore: { rules: regras, host, port: Number(porta) },
});

const agora = () => serverTimestamp();

function usuario(parcial = {}) {
  return {
    nome: 'Aluga Teste',
    email: 'aluga@email.com',
    cpf: '529.982.247-25',
    telefone: '(11) 98888-7777',
    termos: { versao: '1', aceitoEm: agora() },
    locador: {
      habilitado: false,
      habilitadoEm: null,
      versaoTermos: null,
      termosAceitosEm: null,
    },
    criadoEm: agora(),
    atualizadoEm: agora(),
    ...parcial,
  };
}

async function negadoPorRegra(operacao) {
  const erro = await assertFails(operacao);
  if (erro?.code !== 'permission-denied') {
    throw new Error(`esperava permission-denied, recebeu ${erro?.code ?? 'sem código'}: ${erro?.message ?? erro}`);
  }
}

await ambiente.withSecurityRulesDisabled(async (contexto) => {
  const banco = contexto.firestore();
  await setDoc(doc(banco, 'usuarios/uidDono'), usuario());
  await setDoc(doc(banco, 'usuarios/uidAntigo'), usuario({ cidade: 'Campinas' }));
  await setDoc(doc(banco, 'usuarios/uidNovo'), usuario({ nome: 'Maria Ferreira' }));
});

const dono = ambiente.authenticatedContext('uidDono', { email: 'aluga@email.com' }).firestore();
const antigo = ambiente.authenticatedContext('uidAntigo', { email: 'aluga@email.com' }).firestore();
const novo = ambiente.authenticatedContext('uidNovo', { email: 'aluga@email.com' }).firestore();
const outro = ambiente.authenticatedContext('uidOutro', { email: 'outro@email.com' }).firestore();

await assertSucceeds(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'Aluga Silva',
  atualizadoEm: agora(),
}));
console.log('permitido: dono altera somente nome e atualizadoEm');

await assertSucceeds(updateDoc(doc(dono, 'usuarios/uidDono'), {
  telefone: '(11) 97777-6666',
  atualizadoEm: agora(),
}));
console.log('permitido: dono altera somente telefone e atualizadoEm');

await assertSucceeds(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'Giovanna Nascimento',
  telefone: '(11) 96666-5555',
  atualizadoEm: agora(),
}));
console.log('permitido: dono altera nome, telefone e atualizadoEm');

await assertSucceeds(updateDoc(doc(antigo, 'usuarios/uidAntigo'), {
  nome: 'Conta Antiga',
  telefone: '(11) 95555-4444',
  atualizadoEm: agora(),
}));
let contaAntiga;
await ambiente.withSecurityRulesDisabled(async (contexto) => {
  const lido = await getDoc(doc(contexto.firestore(), 'usuarios/uidAntigo'));
  contaAntiga = lido.data();
});
if (contaAntiga?.cidade !== 'Campinas' || contaAntiga?.nome !== 'Conta Antiga') {
  throw new Error(
    `a cidade da conta antiga foi alterada ou o nome não foi salvo: ${JSON.stringify(contaAntiga)}`,
  );
}
console.log('permitido: conta antiga altera nome e telefone e mantém cidade');

await assertSucceeds(updateDoc(doc(novo, 'usuarios/uidNovo'), {
  'locador.habilitado': true,
  'locador.habilitadoEm': agora(),
  'locador.versaoTermos': '1.0',
  'locador.termosAceitosEm': agora(),
  atualizadoEm: agora(),
}));
await negadoPorRegra(updateDoc(doc(novo, 'usuarios/uidNovo'), {
  'locador.habilitado': true,
  'locador.habilitadoEm': agora(),
  'locador.versaoTermos': '1.0',
  'locador.termosAceitosEm': agora(),
  atualizadoEm: agora(),
}));
console.log('permitido: ativação de locador; segunda ativação continua negada');

await negadoPorRegra(updateDoc(doc(outro, 'usuarios/uidDono'), {
  nome: 'Invasor',
  atualizadoEm: agora(),
}));
console.log('negado: outro usuário altera o perfil');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  email: 'outro@email.com',
  atualizadoEm: agora(),
}));
console.log('negado: alteração de email');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  cpf: '111.444.777-35',
  atualizadoEm: agora(),
}));
console.log('negado: alteração de cpf');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  'termos.versao': '2',
  atualizadoEm: agora(),
}));
console.log('negado: alteração de termos');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'Aluga Teste',
  'locador.habilitado': true,
  atualizadoEm: agora(),
}));
console.log('negado: locador alterado junto da edição pessoal');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  criadoEm: agora(),
  atualizadoEm: agora(),
}));
console.log('negado: alteração de criadoEm');

await negadoPorRegra(updateDoc(doc(antigo, 'usuarios/uidAntigo'), {
  cidade: 'São Paulo',
  atualizadoEm: agora(),
}));
console.log('negado: alteração de cidade');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  apelido: 'Aluga',
  atualizadoEm: agora(),
}));
console.log('negado: campo arbitrário');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'Nome Valido',
  atualizadoEm: Timestamp.fromDate(new Date('2020-01-01T00:00:00Z')),
}));
console.log('negado: atualizadoEm diferente de request.time');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'A',
  atualizadoEm: agora(),
}));
await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  nome: 'A'.repeat(81),
  atualizadoEm: agora(),
}));
console.log('negado: nome inválido');

await negadoPorRegra(updateDoc(doc(dono, 'usuarios/uidDono'), {
  telefone: '11988887777',
  atualizadoEm: agora(),
}));
console.log('negado: telefone inválido');

await ambiente.cleanup();
console.log('regras de usuarios ok');
