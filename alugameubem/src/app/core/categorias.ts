/** Única lista de categorias do MVP. O formulário e as Firestore Rules repetem estes valores. */
export const CATEGORIAS = ['Casa', 'Eletrônicos', 'Esporte', 'Ferramentas'] as const;

export type CategoriaAnuncio = (typeof CATEGORIAS)[number];

export function categoriaValida(valor: string): valor is CategoriaAnuncio {
  return (CATEGORIAS as readonly string[]).includes(valor);
}
