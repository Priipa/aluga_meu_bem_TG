/**
 * Nome curto para o anúncio: primeiro nome e a inicial do último sobrenome.
 * "Giovanna Priscila Nascimento" → "Giovanna N."
 * "Maria Ferreira" → "Maria F."
 * Um único nome permanece como está.
 */
export function nomeExibicao(nomeCompleto: string): string {
  const partes = nomeCompleto.trim().split(/\s+/).filter((parte) => parte.length > 0);
  if (partes.length === 0) {
    return '';
  }
  if (partes.length === 1) {
    return partes[0];
  }
  const inicial = partes[partes.length - 1].charAt(0).toLocaleUpperCase('pt-BR');
  return `${partes[0]} ${inicial}.`;
}
