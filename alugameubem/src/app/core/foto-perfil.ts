const CAMINHO_FOTO_PERFIL = /^usuarios\/([A-Za-z0-9_-]+)\/perfil-([A-Za-z0-9]{8,32})\.jpg$/;

/** Caminho no Storage. O documento do usuário guarda só esta referência. */
export function caminhoFotoPerfil(uid: string, identificador: string): string {
  const caminho = `usuarios/${uid}/perfil-${identificador}.jpg`;
  if (!fotoPerfilDoUsuario(caminho, uid)) {
    throw new Error('Não foi possível preparar a foto.');
  }
  return caminho;
}

export function fotoPerfilDoUsuario(caminho: string, uid: string): boolean {
  const encontrado = CAMINHO_FOTO_PERFIL.exec(caminho);
  return encontrado?.[1] === uid;
}

export function identificadorFotoPerfil(): string {
  const bruto = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random().toString(16).slice(2)}`;
  const limpo = bruto.replace(/[^a-zA-Z0-9]/g, '');
  if (limpo.length < 8) {
    throw new Error('Não foi possível preparar a foto.');
  }
  return limpo.slice(0, 24);
}
