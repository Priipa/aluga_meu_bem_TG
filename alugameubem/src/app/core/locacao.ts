import { Anuncio, Locacao, StatusLocacao } from './models';
import { LIMITE_NOME_EXIBICAO, LIMITE_TEXTO, LIMITE_TITULO } from './anuncio-documento';
import { nomeExibicao } from './nome-exibicao';

export const COLECAO_LOCACOES = 'locacoes';
export const LIMITE_DIAS_LOCACAO = 30;
export const LIMITE_CAPA = 2048;

const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const STATUS: readonly StatusLocacao[] = [
  'pendente',
  'aprovado',
  'em_andamento',
  'concluido',
  'recusado',
  'cancelado',
];
export const STATUS_ATIVOS: readonly StatusLocacao[] = ['pendente', 'aprovado', 'em_andamento'];
export const STATUS_ENCERRADOS: readonly StatusLocacao[] = ['concluido', 'recusado', 'cancelado'];

export function hojeIso(): string {
  const hoje = new Date();
  return isoDeData(hoje);
}

export function diasDoPeriodo(inicioIso: string, fimIso: string): number {
  const inicio = dataIso(inicioIso);
  const fim = dataIso(fimIso);
  if (!inicio || !fim) {
    return 0;
  }
  return Math.round((fim.getTime() - inicio.getTime()) / 86400000);
}

export function formatarPeriodo(inicioIso: string, fimIso: string, dias: number): string {
  return `${formatarDia(inicioIso)} – ${formatarDia(fimIso)} (${dias} ${dias === 1 ? 'dia' : 'dias'})`;
}

export function rotuloStatusLocacao(status: StatusLocacao): string {
  if (status === 'aprovado') {
    return 'Aprovado';
  }
  if (status === 'em_andamento') {
    return 'Em uso';
  }
  if (status === 'concluido') {
    return 'Concluído';
  }
  if (status === 'recusado') {
    return 'Recusado';
  }
  if (status === 'cancelado') {
    return 'Cancelado';
  }
  return 'Pendente';
}

export function ehStatusAtivo(status: StatusLocacao): boolean {
  return STATUS_ATIVOS.includes(status);
}

export function ehStatusEncerrado(status: StatusLocacao): boolean {
  return STATUS_ENCERRADOS.includes(status);
}

export function descricaoGestaoLocacao(status: StatusLocacao, nomeLocador: string): string {
  if (status === 'aprovado') {
    return 'Combinem a retirada pelo chat.';
  }
  if (status === 'em_andamento') {
    return 'O item está com você.';
  }
  if (status === 'concluido') {
    return 'Aluguel encerrado.';
  }
  if (status === 'recusado') {
    return `${nomeLocador} recusou o pedido.`;
  }
  if (status === 'cancelado') {
    return 'Você cancelou este pedido.';
  }
  return 'Aguardando o locador aceitar.';
}

export function podeAlterarStatus(
  locacao: Pick<Locacao, 'status' | 'locadorId' | 'locatarioId'>,
  uid: string,
  proximo: StatusLocacao,
): boolean {
  if (!uid) {
    return false;
  }
  const participante = uid === locacao.locadorId || uid === locacao.locatarioId;
  if (locacao.status === 'pendente' && uid === locacao.locadorId) {
    return proximo === 'aprovado' || proximo === 'recusado';
  }
  if (locacao.status === 'pendente' && uid === locacao.locatarioId) {
    return proximo === 'cancelado';
  }
  if (locacao.status === 'aprovado' && participante) {
    return proximo === 'em_andamento';
  }
  if (locacao.status === 'em_andamento' && participante) {
    return proximo === 'concluido';
  }
  return false;
}

export function primeiroNome(nome: string): string {
  const parte = nome.trim().split(/\s+/)[0];
  return parte || nome.trim() || 'locatário';
}

export function rotuloRetirada(inicioIso: string): string {
  const hoje = hojeIso();
  if (inicioIso === hoje) {
    return 'Retirada combinada para hoje';
  }
  const amanha = isoSomandoDias(hoje, 1);
  if (inicioIso === amanha) {
    return 'Retirada combinada para amanhã';
  }
  return `Retirada combinada para ${formatarDia(inicioIso)}`;
}

function isoSomandoDias(iso: string, quantidade: number): string {
  const data = dataIso(iso);
  if (!data) {
    return iso;
  }
  data.setDate(data.getDate() + quantidade);
  return isoDeData(data);
}

export function documentoDaLocacao(entrada: {
  anuncio: Anuncio;
  locatarioId: string;
  nomeLocatario: string;
  mensagem: string;
  inicioIso: string;
  fimIso: string;
}): Omit<Locacao, 'id' | 'criadoEm' | 'atualizadoEm' | 'status'> & { status: 'pendente' } {
  if (entrada.locatarioId === entrada.anuncio.proprietarioId) {
    throw new Error('Este anúncio é seu.');
  }
  if (entrada.anuncio.status !== 'ativo' || !entrada.anuncio.disponivel) {
    throw new Error('Este item não está disponível para aluguel.');
  }
  const nomeLocatario = nomeExibicao(entrada.nomeLocatario);
  if (!nomeLocatario || nomeLocatario.length > LIMITE_NOME_EXIBICAO) {
    throw new Error('Não foi possível identificar seu nome para a solicitação.');
  }
  const mensagem = entrada.mensagem.trim();
  if (!mensagem) {
    throw new Error('Escreva uma mensagem para o locador.');
  }
  if (mensagem.length > LIMITE_TEXTO) {
    throw new Error('A mensagem passou do tamanho permitido.');
  }
  if (entrada.inicioIso < hojeIso()) {
    throw new Error('A data de início não pode ser no passado.');
  }
  const dias = diasDoPeriodo(entrada.inicioIso, entrada.fimIso);
  if (dias < 1) {
    throw new Error('Informe um período de pelo menos um dia.');
  }
  if (dias > LIMITE_DIAS_LOCACAO) {
    throw new Error(`O período máximo é de ${LIMITE_DIAS_LOCACAO} dias.`);
  }
  const capa = entrada.anuncio.imagens[0] ?? '';
  if (!capa) {
    throw new Error('Este anúncio não tem foto para a solicitação.');
  }
  return {
    anuncioId: entrada.anuncio.id,
    condominioId: entrada.anuncio.condominioId,
    locadorId: entrada.anuncio.proprietarioId,
    locatarioId: entrada.locatarioId,
    participantes: [entrada.anuncio.proprietarioId, entrada.locatarioId],
    tituloAnuncio: entrada.anuncio.titulo.slice(0, LIMITE_TITULO),
    categoriaAnuncio: entrada.anuncio.categoria,
    capaAnuncio: capa.slice(0, LIMITE_CAPA),
    nomeLocador: entrada.anuncio.nomeExibicao,
    nomeLocatario,
    mensagem,
    inicioIso: entrada.inicioIso,
    fimIso: entrada.fimIso,
    dias,
    valorDiaria: entrada.anuncio.valorDiaria,
    valorTotal: dias * entrada.anuncio.valorDiaria,
    status: 'pendente',
  };
}

export function statusLocacao(valor: unknown): valor is StatusLocacao {
  return typeof valor === 'string' && STATUS.includes(valor as StatusLocacao);
}

function formatarDia(iso: string): string {
  const data = dataIso(iso);
  if (!data) {
    return iso;
  }
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function dataIso(iso: string): Date | null {
  if (!ISO_DIA.test(iso)) {
    return null;
  }
  const [ano, mes, dia] = iso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  if (data.getFullYear() !== ano || data.getMonth() !== mes - 1 || data.getDate() !== dia) {
    return null;
  }
  return data;
}

function isoDeData(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${data.getFullYear()}-${mes}-${dia}`;
}
