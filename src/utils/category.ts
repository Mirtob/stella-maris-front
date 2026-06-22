/**
 * Mapeo del `mass_moment` (valor en minúscula de la BD / catálogo Supabase) al
 * NOMBRE de categoría que usa toda la app (constructor, ordinario, PDF, reproductor).
 * Los cantos sincronizados llegan con el moment en minúscula; el resto de la app
 * espera el nombre con mayúscula (ej. 'Entrada', 'Comunión').
 */
export const MOMENT_TO_CATEGORY: Record<string, string> = {
  entrada: 'Entrada',
  kyrie: 'Kyrie',
  gloria: 'Gloria',
  salmo: 'Salmo',
  aleluya: 'Aleluya',
  ofertorio: 'Ofertorio',
  santo: 'Santo',
  cordero: 'Cordero de Dios',
  comunion: 'Comunión',
  final: 'Salida',
  exposicion: 'Exposición y Procesión',
  'no-liturgico': 'No litúrgico',
};

/** Devuelve el nombre de categoría. Si ya viene con mayúscula, lo deja igual. */
export function normalizeCategory(category?: string | null): string {
  if (!category) return '';
  return MOMENT_TO_CATEGORY[category] ?? category;
}
