import { describe, expect, it } from 'vitest';
import { LIMITE_BYTES_FOTO, selecionarFotoPerfil } from './anuncio-fotos';
import { caminhoFotoPerfil, fotoPerfilDoUsuario } from './foto-perfil';

describe('foto de perfil', () => {
  it('reusa a validação de tipo e tamanho das fotos de anúncio', () => {
    expect(selecionarFotoPerfil({ type: 'image/png', size: 1200 }).aceita).toEqual({
      type: 'image/png',
      size: 1200,
    });
    expect(selecionarFotoPerfil({ type: 'image/gif', size: 1200 }).mensagem).toContain('JPEG, PNG ou WebP');
    expect(selecionarFotoPerfil({ type: 'image/jpeg', size: LIMITE_BYTES_FOTO + 1 }).mensagem).toContain('5 MB');
  });

  it('grava a referência só no caminho do próprio usuário', () => {
    const caminho = caminhoFotoPerfil('uidA', 'abc12345');
    expect(caminho).toBe('usuarios/uidA/perfil-abc12345.jpg');
    expect(fotoPerfilDoUsuario(caminho, 'uidA')).toBe(true);
    expect(fotoPerfilDoUsuario(caminho, 'uidB')).toBe(false);
    expect(fotoPerfilDoUsuario('usuarios/uidA/perfil-curto.jpg', 'uidA')).toBe(false);
    expect(() => caminhoFotoPerfil('uid/a', 'abc12345')).toThrow();
    expect(() => caminhoFotoPerfil('uidA', '../outro')).toThrow();
  });
});
