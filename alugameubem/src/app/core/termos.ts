export const VERSAO_TERMOS_GERAIS = '1';

/** Versão aceita ao ativar a função de locador. Distinta dos termos gerais do cadastro. */
export const VERSAO_TERMOS_LOCADOR = '1.0';

/** Texto aceito na habilitação do locador. A consulta posterior lê estes mesmos parágrafos. */
export const PARAGRAFOS_TERMOS_LOCADOR = [
  'Ao se tornar locador, você poderá cadastrar itens para aluguel no seu condomínio.',
  'Você será responsável pelas informações dos itens anunciados, pelas condições de uso e conservação e pelo cumprimento das regras aplicáveis aos seus aluguéis.',
] as const;

/**
 * Corpo consultável da versão 1.
 * Vazio de propósito: não há texto jurídico definido nesta etapa.
 * Preencher antes do teste final do cadastro.
 */
export const TEXTO_TERMOS_GERAIS = '';
