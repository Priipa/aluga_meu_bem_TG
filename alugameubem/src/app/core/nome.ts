/** Mesma capitalização usada no cadastro. "aluga teste" → "Aluga Teste". */
export function formatarNomeTitulo(valor: string): string {
  return valor
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s'-])(\p{L})/gu, (_match, separador: string, letra: string) => {
      return separador + letra.toLocaleUpperCase('pt-BR');
    });
}
