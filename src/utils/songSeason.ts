/**
 * ¿Este canto sirve para el tiempo litúrgico que se está armando?
 *
 * La regla vivía copiada dentro de CategorySearch y, en el carrusel de sugerencias,
 * una versión distinta y equivocada: filtraba por `song.tags` —un campo que viene de
 * YouTube y que el catálogo real no llena— y, al no encontrar nada, **rellenaba con los
 * primeros cantos del catálogo**. Por eso en Tiempo Ordinario aparecían cantos de
 * Navidad. Aquí está la única versión, para que no vuelvan a divergir.
 *
 * Convenciones del catálogo (`songs.liturgical_seasons`, editable desde la app; ver
 * utils/songTags.ts, que ya agrupa las etiquetas por familia):
 *
 *  - **Sin etiquetas = sirve para todo el año.** Son 23 de los 52 cantos reales.
 *  - Un canto puede llevar varias ("Tiempo Ordinario" + "Virgen María").
 *  - Solo los TIEMPOS y los DÍAS atan a una época. Las **temáticas** (Virgen María,
 *    Gregoriano, Santos…) y las celebraciones fuera del tiempo (Funerales, Otros
 *    sacramentos) no atan: un Ave María se canta en cualquier tiempo, y descartarla
 *    en Tiempo Ordinario por llevar "Virgen María" sería justo el error contrario.
 *  - Se escriben a mano, así que conviven "Tiempo Ordinario" y "tiempo-ordinario":
 *    la comparación normaliza acentos, mayúsculas y guiones.
 */
import { Song } from '../types';

/** Sin acentos, minúsculas, guiones y espacios unificados. */
const normalizar = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Etiquetas que ATAN a un tiempo, y a cuál. Están las cinco temporadas y los días y
 * solemnidades que caen dentro de una (ver el catálogo de utils/songTags.ts).
 *
 * Lo que NO está aquí no ata: temáticas y celebraciones fuera del tiempo litúrgico,
 * más cualquier etiqueta nueva que cree el administrador. Es el criterio prudente —
 * una etiqueta desconocida no debería esconder un canto el año entero.
 */
const TIEMPO_DE: Record<string, string> = {
  // Las cinco temporadas
  'adviento': 'Adviento',
  'navidad': 'Navidad',
  'cuaresma': 'Cuaresma',
  'pascua': 'Pascua',
  'tiempo ordinario': 'Tiempo Ordinario',
  'ordinario': 'Tiempo Ordinario',
  // Cuaresma y Semana Santa
  'miercoles de ceniza': 'Cuaresma',
  'semana santa': 'Cuaresma',
  'domingo de ramos': 'Cuaresma',
  'jueves santo': 'Cuaresma',
  'viernes santo': 'Cuaresma',
  'misa crismal': 'Cuaresma',
  // Pascua: la Vigilia ya es Pascua, y Pentecostés la cierra
  'sabado santo': 'Pascua',
  'vigilia pascual': 'Pascua',
  'domingo de resurreccion': 'Pascua',
  'ascension del senor': 'Pascua',
  'pentecostes': 'Pascua',
  'espiritu santo': 'Pascua',
  // Solemnidades del Tiempo Ordinario
  'corpus christi': 'Tiempo Ordinario',
  'cristo rey': 'Tiempo Ordinario',
  'asuncion de la virgen': 'Tiempo Ordinario',
  // Adviento
  'inmaculada concepcion': 'Adviento',
};

/** Etiquetas de temporada del canto, ya limpias (array nuevo o el campo antiguo). */
export function songSeasons(song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>): string[] {
  const desdeArray = (song.liturgicalSeasons as string[] | undefined) ?? [];
  const crudas = desdeArray.length > 0
    ? desdeArray
    : (song.liturgicalSeason ? String(song.liturgicalSeason).split(',') : []);
  return crudas.map(s => String(s).trim()).filter(Boolean);
}

/** El tiempo al que ata una etiqueta, o `null` si es temática (no ata). */
export function seasonOfTag(tag: string): string | null {
  return TIEMPO_DE[normalizar(tag)] ?? null;
}

/**
 * ¿El canto sirve para ese tiempo litúrgico?
 *
 * Sirve si no lleva ninguna etiqueta que lo ate a una época (sin etiquetas, o solo
 * temáticas), o si alguna de las que sí atan apunta a este tiempo.
 */
export function songMatchesSeason(
  song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>,
  season: string,
): boolean {
  const ataduras = songSeasons(song)
    .map(seasonOfTag)
    .filter((t): t is string => t !== null);

  if (ataduras.length === 0) return true;   // no ata a ninguna época
  return ataduras.some(t => normalizar(t) === normalizar(season));
}
