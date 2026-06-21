import { Song } from '../types';

/**
 * Partes del ordinario de la Misa que se cantan desde la partitura (no desde
 * letra/acordes). Incluye el Padre Nuestro (si se canta) y el Rito de Aspersión
 * (que en Pascua reemplaza al Kyrie). Fuente única para PDF y Modo Atril.
 */
export const ORDINARY_CATEGORIES = [
  'Kyrie',
  'Rito de Aspersión',
  'Gloria',
  'Santo',
  'Cordero de Dios',
  'Padre Nuestro',
] as const;

const SET = new Set<string>(ORDINARY_CATEGORIES as readonly string[]);

/** ¿Este canto es una parte del ordinario que debería mostrarse como partitura? */
export function isOrdinary(song: Pick<Song, 'category'> | null | undefined): boolean {
  return !!song && SET.has(song.category);
}

/** Orden canónico de las partes de la Misa (para ordenar cantorales/atril). */
export const MASS_CATEGORY_ORDER = [
  'Entrada',
  'Rito de Aspersión',
  'Kyrie',
  'Gloria',
  'Salmo',
  'Aleluya',
  'Aclamación al Evangelio',
  'Post Evangelio',
  'Ofertorio',
  'Santo',
  'Padre Nuestro',
  'Cordero de Dios',
  'Comunión',
  'Salida',
] as const;

/** Posición de una categoría en el orden de la Misa (las desconocidas van al final). */
export function massRank(category: string): number {
  const i = (MASS_CATEGORY_ORDER as readonly string[]).indexOf(category);
  return i === -1 ? 999 : i;
}

/** Ordena cantos por el orden de la Misa, estable respecto al orden original. */
export function sortByMassOrder<T extends Pick<Song, 'category'>>(songs: T[]): T[] {
  return songs
    .map((s, i) => [s, i] as const)
    .sort((a, b) => (massRank(a[0].category) - massRank(b[0].category)) || (a[1] - b[1]))
    .map(([s]) => s);
}
