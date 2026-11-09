import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Tipos dos mocks atuais (catálogo, chat e perfil em tela).
// Mantidos para não quebrar explorar, detalhes, pagamento, chat e perfil
// até as etapas que migrarem essas superfícies.
// ---------------------------------------------------------------------------

export interface Owner {
  name: string;
  since: string;
  avatar: string;
}

export interface Review {
  name: string;
  date: string;
  rating: number;
  text: string;
  avatar: string;
}

export interface DescriptionBlock {
  title: string;
  body: string;
}

export interface Item {
  id: string;
  title: string;
  pricePerDay: number;
  deposit: number;
  categories: string[];
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  description: DescriptionBlock[];
  owner: Owner;
  neighborhood: string;
  city: string;
  location: string;
  conditions: string[];
  reviews: Review[];
}

export interface ChatMessage {
  fromMe: boolean;
  text: string;
  time: string;
}

/** Perfil usado pela sessão e pela tela atual. `city` só existe em contas antigas. */
export interface UserProfile {
  name: string;
  email: string;
  city?: string;
  cpf?: string;
  phone?: string;
  /** Caminho no Storage, não a URL de download. Ausente quando não há foto. */
  fotoPerfil?: string;
  locador: Locador;
}

// ---------------------------------------------------------------------------
// Domínio Firestore (usuarios, condominios, vinculos, produtos, locacoes).
// Timestamps seguem o tipo do SDK (`Timestamp`), o mesmo valor que o
// Firestore devolve após `serverTimestamp()`.
// ---------------------------------------------------------------------------

export type StatusCondominio = 'ativo' | 'inativo';

export type StatusVerificacaoCondominio =
  | 'nao_verificado'
  | 'pendente'
  | 'verificado'
  | 'recusado';

export type StatusVinculo = 'pendente' | 'ativo' | 'recusado' | 'inativo';

export interface TermosUso {
  versao: string;
  aceitoEm: Timestamp;
}

export interface Locador {
  habilitado: boolean;
  habilitadoEm: Timestamp | null;
  versaoTermos: string | null;
  termosAceitosEm: Timestamp | null;
}

/** Collection `usuarios`. O id do documento é o uid do Authentication. */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  /** Caminho opcional no Storage. Contas antigas não têm este campo. */
  fotoPerfil?: string;
  termos: TermosUso;
  locador: Locador;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export interface EnderecoCondominio {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface ContatoCondominio {
  email: string;
  telefone: string;
}

export interface VerificacaoCondominio {
  status: StatusVerificacaoCondominio;
  verificadoEm: Timestamp | null;
}

/** Collection `condominios`. O id TypeScript é o id do documento. */
export interface Condominio {
  id: string;
  nome: string;
  endereco: EnderecoCondominio;
  status: StatusCondominio;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/** `condominios/{id}/privado/dados`. Não é lido pelo cadastro. */
export interface DadosPrivadosCondominio {
  cnpj: string;
  contato: ContatoCondominio;
  verificacao: VerificacaoCondominio;
}

/** DTO do select de cadastro. */
export interface CondominioOpcao {
  id: string;
  nome: string;
  cidade: string;
  bairro: string;
}

export interface Unidade {
  bloco: string;
  apartamento: string;
}

/** Collection `vinculos`. */
export interface Vinculo {
  id: string;
  usuarioId: string;
  condominioId: string;
  unidade: Unidade;
  status: StatusVinculo;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type StatusAnuncio = 'ativo' | 'pausado' | 'arquivado';

/**
 * Documento `anuncios/{anuncioId}`.
 * `id` é o id do documento e não é gravado como campo.
 * `imagens` guarda as URLs de download, de 1 a 3.
 */
export interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  valorDiaria: number;
  porQueAlugar: string;
  acompanha: string;
  condicoes: string;
  imagens: string[];
  proprietarioId: string;
  condominioId: string;
  vinculoId: string;
  nomeExibicao: string;
  status: StatusAnuncio;
  disponivel: boolean;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/**
 * Documento `conversas/{anuncioId}_{interessadoId}`.
 * `id` é o id do documento e não é gravado como campo.
 */
export interface Conversa {
  id: string;
  anuncioId: string;
  condominioId: string;
  proprietarioId: string;
  interessadoId: string;
  participantes: string[];
  tituloAnuncio: string;
  nomeProprietario: string;
  nomeInteressado: string;
  ultimaMensagem: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

/** `conversas/{id}/mensagens/{mensagemId}`. */
export interface MensagemConversa {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: Timestamp | null;
}

/** Rascunho antigo. A collection em uso é `anuncios`, não `produtos`. */
export interface Produto {
  id: string;
  proprietarioId: string;
  condominioId: string;
  nome: string;
  descricao: string;
  categoria: string;
  valorDiaria: number;
  imagens: string[];
  status: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}

export type StatusLocacao =
  | 'pendente'
  | 'aprovado'
  | 'em_andamento'
  | 'concluido'
  | 'recusado'
  | 'cancelado';

/**
 * Documento `locacoes/{id}`.
 * `id` é o id do documento e não é gravado como campo.
 */
export interface Locacao {
  id: string;
  anuncioId: string;
  condominioId: string;
  locadorId: string;
  locatarioId: string;
  participantes: string[];
  tituloAnuncio: string;
  categoriaAnuncio: string;
  capaAnuncio: string;
  nomeLocador: string;
  nomeLocatario: string;
  mensagem: string;
  inicioIso: string;
  fimIso: string;
  dias: number;
  valorDiaria: number;
  valorTotal: number;
  status: StatusLocacao;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
