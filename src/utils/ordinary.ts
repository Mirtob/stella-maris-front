import { Song } from '../types';
import { massOrdinary } from '../data/massOrdinary';

/**
 * Partes del ordinario de la Misa que se cantan desde la partitura (no desde
 * letra/acordes). Incluye el Padre Nuestro (si se canta), el Rito de Aspersión
 * (que en Pascua reemplaza al Kyrie) y las aclamaciones breves que se agregan junto
 * con el Padre Nuestro (data/aclamaciones). Fuente única para PDF y Modo Atril.
 */
export const ORDINARY_CATEGORIES = [
  'Kyrie',
  'Rito de Aspersión',
  'Gloria',
  'Respuesta a Oración Universal',
  'Santo',
  'Aclamación Consagración',
  'Amén (Doxología)',
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

/**
 * Cómo se ROTULA una parte en lo que ve la gente (folleto, Atril, enlace del QR).
 *
 * La categoría guardada no cambia —es la clave de la BD y del orden de la Misa—, solo el
 * rótulo impreso. Las aclamaciones son universales y así las nombra el coro (pedido del
 * 27-sep-2026); "Respuesta a Oración Universal" o "Amén (Doxología)" eran rótulos
 * internos.
 */
const ROTULO_DE_PARTE: Record<string, string> = {
  'Respuesta a Oración Universal': 'Oración universal',
  'Aclamación Consagración': 'Aclamación post consagración',
  'Amén (Doxología)': 'Triple amén (Aclamación doxología)',
  'Padre Nuestro': 'Padre nuestro',
};

export function rotuloDeParte(category: string): string {
  return ROTULO_DE_PARTE[category] ?? category;
}

/**
 * Título y autor de un canto tal como se muestran.
 *
 * Las aclamaciones y el Padre Nuestro que arma la app desde el Drive NO pertenecen a una
 * Misa: se les quita el autor, porque en los cantorales publicados antes del 27-sep-2026
 * salía el nombre de la Misa («Oración universal (Misa Reunidos en su nombre)»), y en los
 * de antes aún «Padre Nuestro (Misa)». Se decide por el id, que los identifica aunque el
 * cantoral ya esté guardado, así que se corrige sin volver a publicar.
 */
export function tituloVisible(song: Pick<Song, 'id' | 'title' | 'author' | 'category'>): { title: string; author?: string } {
  const id = String(song.id ?? '');
  if (id.startsWith('aclamacion-')) return { title: rotuloDeParte(song.category) };
  if (id.startsWith('padre-nuestro-')) {
    return { title: id.startsWith('padre-nuestro-la') ? 'Pater noster' : 'Padre nuestro' };
  }
  return { title: song.title, author: song.author };
}

/**
 * Los tres bloques del ordinario que eligen su partitura por separado (pedido del
 * 30-sep-2026). Cada uno se decide donde se elige ese bloque, y solo ahí:
 *  · 'misa'         → la Misa del catálogo: en el diálogo «Completar la Misa» del Kyrie.
 *  · 'gregoriano'   → la Misa del Kyriale: en su tarjeta, al elegirla.
 *  · 'padreNuestro' → el Padre Nuestro y las aclamaciones: en su tarjeta.
 */
export type GrupoPartitura = 'misa' | 'gregoriano' | 'padreNuestro';
export type PartiturasElegidas = Record<GrupoPartitura, boolean>;

const DEL_PADRE_NUESTRO = new Set([
  'Padre Nuestro', 'Respuesta a Oración Universal', 'Aclamación Consagración', 'Amén (Doxología)',
]);

/** A qué bloque pertenece una parte del ordinario; `null` si no es del ordinario. */
export function grupoDePartitura(song: Pick<Song, 'id' | 'category'>): GrupoPartitura | null {
  if (!isOrdinary(song)) return null;
  if (DEL_PADRE_NUESTRO.has(song.category)) return 'padreNuestro';
  return String(song.id).startsWith('kyriale-') ? 'gregoriano' : 'misa';
}

/** El texto latino de la parte, para el gregoriano que va "solo letra" (no trae letra). */
function letraLatina(category: string): string | undefined {
  return massOrdinary.find((m) => m.category === category && m.latin)?.latin;
}

/**
 * Marca cada parte del ordinario según la elección de SU bloque. El gregoriano no trae
 * letra (es el facsímil), así que sin partitura se le pone el texto latino: si no, el
 * folleto no tendría nada que imprimir y volvería a poner la imagen.
 */
export function marcarPartituras<T extends Pick<Song, 'id' | 'category' | 'folletoSoloLetra' | 'lyrics'>>(
  songs: T[], elegidas: PartiturasElegidas,
): T[] {
  return songs.map((s) => {
    const grupo = grupoDePartitura(s);
    if (!grupo) return s;
    const { folletoSoloLetra: _, ...resto } = s;
    if (elegidas[grupo]) return resto as T;
    const lyrics = !s.lyrics?.trim() && String(s.id).startsWith('kyriale-')
      ? letraLatina(s.category) : s.lyrics;
    return { ...resto, lyrics, folletoSoloLetra: true } as T;
  });
}

/** ¿Ese bloque del cantoral lleva partitura? (Sí, salvo que se haya quitado.) */
export function llevaPartitura(
  songs: Pick<Song, 'id' | 'category' | 'folletoSoloLetra'>[], grupo: GrupoPartitura,
): boolean {
  return !songs.some((s) => grupoDePartitura(s) === grupo && s.folletoSoloLetra);
}
