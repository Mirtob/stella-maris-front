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

/**
 * Orden canónico de las partes de la Misa, para ordenar cantorales, folleto y atril.
 *
 * Es la lista COMPLETA de rótulos que el constructor puede producir, incluidos los de
 * los oficios propios (Vigilia Pascual, Triduo, Nochebuena) y los rótulos que cambian
 * con el tiempo litúrgico ("Aclamación al Evangelio" en Cuaresma, "Rito de Aspersión"
 * en Pascua). Cada vista tenía antes su propia lista incompleta y ordenaba con
 * `indexOf`, que devuelve -1 para lo que no conoce: una parte especial se iba ARRIBA
 * DE TODO, antes de la Entrada. Ahora hay una sola fuente y lo desconocido va al final.
 *
 * Notas de orden:
 *  · El Pregón Pascual va tras el lucernario, antes de las lecturas.
 *  · En la Vigilia el Gloria va DESPUÉS de los salmos del Antiguo Testamento; por eso
 *    se ubica ahí. En una Misa normal no hay salmos AT, así que sigue quedando entre
 *    el Kyrie y el Salmo, como corresponde.
 *  · Las secuencias van tras la segunda lectura y antes del Aleluya.
 */
export const MASS_CATEGORY_ORDER = [
  'Kalenda Navideña',
  'Entrada',
  'Pregón Pascual',
  'Rito de Aspersión',
  'Kyrie',
  'Salmo AT 1',
  'Salmo AT 2',
  'Salmo AT 3',
  'Salmo AT 4',
  'Salmo AT 5',
  'Salmo AT 6',
  'Salmo AT 7',
  'Gloria',
  'Salmo Epistolar',
  'Salmo',
  'Secuencia de Pascua',
  'Secuencia de Pentecostés',
  'Secuencia de Corpus',
  'Aleluya Triple',
  'Aleluya',
  'Aclamación al Evangelio',
  'Post Evangelio',
  'Credo',
  'Respuesta a Oración Universal',
  'Ofertorio',
  'Santo',
  'Aclamación Consagración',
  'Amén (Doxología)',
  'Padre Nuestro',
  'Tuyo es el Reino',
  'Cordero de Dios',
  'Comunión',
  'Exposición y Procesión',
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

/** Ordena rótulos de partes por el orden de la Misa (estable; lo desconocido, al final). */
export function sortCategoriesByMassOrder(categories: string[]): string[] {
  return categories
    .map((c, i) => [c, i] as const)
    .sort((a, b) => (massRank(a[0]) - massRank(b[0])) || (a[1] - b[1]))
    .map(([c]) => c);
}

/**
 * Agrupa los cantos de un cantoral por parte de la Misa, en orden litúrgico.
 *
 * Devuelve TODOS los cantos de cada parte, no solo el primero: la Comunión suele
 * llevar dos o tres y cualquier parte puede llevar más de uno. Fuente única para la
 * tarjeta del cantoral, el enlace del QR, el folleto PDF y la guía de la Misa.
 */
export function groupSongsByMassPart<T extends Pick<Song, 'category'>>(
  songs: T[],
): { category: string; songs: T[] }[] {
  const grouped: Record<string, T[]> = {};
  for (const s of songs) (grouped[s.category] ||= []).push(s);
  return sortCategoriesByMassOrder(Object.keys(grouped))
    .map((category) => ({ category, songs: grouped[category] }));
}

/** Ícono de cada parte de la Misa (mismo criterio en todas las vistas). */
export const MASS_CATEGORY_ICON: Record<string, string> = {
  'Kalenda Navideña': '⭐',
  'Entrada': '⛪',
  'Pregón Pascual': '🕯️',
  'Rito de Aspersión': '💧',
  'Kyrie': '🙏',
  'Salmo AT 1': '📜', 'Salmo AT 2': '📜', 'Salmo AT 3': '📜', 'Salmo AT 4': '📜',
  'Salmo AT 5': '📜', 'Salmo AT 6': '📜', 'Salmo AT 7': '📜',
  'Gloria': '✨',
  'Salmo Epistolar': '📖',
  'Salmo': '📖',
  'Secuencia de Pascua': '🌅',
  'Secuencia de Pentecostés': '🔥',
  'Secuencia de Corpus': '🍞',
  'Aleluya Triple': '🎺',
  'Aleluya': '🎺',
  'Aclamación al Evangelio': '📯',
  'Post Evangelio': '📿',
  'Credo': '📿',
  'Respuesta a Oración Universal': '🙏',
  'Ofertorio': '🍇',
  'Santo': '✝️',
  'Aclamación Consagración': '✝️',
  'Amén (Doxología)': '✝️',
  'Padre Nuestro': '🙏',
  'Tuyo es el Reino': '👑',
  'Cordero de Dios': '🐑',
  'Comunión': '🫓',
  'Exposición y Procesión': '🕯️',
  'Salida': '⛪',
};

/** Ícono de una parte, con respaldo genérico. */
export function massCategoryIcon(category: string): string {
  return MASS_CATEGORY_ICON[category] ?? '🎵';
}
