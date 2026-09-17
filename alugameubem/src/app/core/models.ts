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

/** Collection `produtos`. `status` será fechado na etapa de anúncios. */
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

export interface PeriodoLocacao {
  inicio: Timestamp;
  fim: Timestamp;
}

/** Collection `locacoes`. `status` será fechado na etapa de aluguéis. */
export interface Locacao {
  id: string;
  produtoId: string;
  condominioId: string;
  locadorId: string;
  locatarioId: string;
  periodo: PeriodoLocacao;
  valorDiaria: number;
  valorTotal: number;
  status: string;
  criadoEm: Timestamp;
  atualizadoEm: Timestamp;
}
