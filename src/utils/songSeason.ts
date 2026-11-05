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
import { calculateEaster } from './liturgicalCalendar';

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
 * Etiquetas de la Semana Santa. Atan a la Cuaresma, pero con la fecha de la Misa se
 * piden más: un «Viernes Santo» no se ofrece el 2.º domingo de Cuaresma, solo esa
 * semana. Sin fecha se comportan como antes (toda la Cuaresma).
 */
const DE_SEMANA_SANTA = new Set([
  'semana santa', 'domingo de ramos', 'jueves santo', 'viernes santo', 'misa crismal',
]);

/** ¿La fecha cae en Semana Santa? Del Domingo de Ramos al Sábado Santo. */
export function esSemanaSanta(fecha: Date): boolean {
  const pascua = calculateEaster(fecha.getFullYear());
  const ramos = new Date(pascua.getFullYear(), pascua.getMonth(), pascua.getDate() - 7);
  const dia = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  return dia >= ramos && dia < pascua;
}

interface Atadura { tiempo: string; semanaSanta: boolean }

/** Las etiquetas del canto que lo atan a una época (las temáticas no cuentan). */
function ataduras(song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>): Atadura[] {
  return songSeasons(song).flatMap((tag) => {
    const tiempo = seasonOfTag(tag);
    return tiempo ? [{ tiempo, semanaSanta: DE_SEMANA_SANTA.has(normalizar(tag)) }] : [];
  });
}

const coincide = (a: Atadura, season: string, fecha?: Date) =>
  a.semanaSanta && fecha ? esSemanaSanta(fecha) : normalizar(a.tiempo) === normalizar(season);

/**
 * ¿El canto sirve para ese tiempo litúrgico?
 *
 * Sirve si no lleva ninguna etiqueta que lo ate a una época (sin etiquetas, o solo
 * temáticas), o si alguna de las que sí atan apunta a este tiempo. Con `fecha` (la de
 * la Misa), las etiquetas de Semana Santa valen solo esa semana.
 */
export function songMatchesSeason(
  song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>,
  season: string,
  fecha?: Date,
): boolean {
  const at = ataduras(song);
  if (at.length === 0) return true;   // no ata a ninguna época
  return at.some(a => coincide(a, season, fecha));
}

/**
 * Qué tan propio del tiempo es el canto (menor = primero), para ordenar lo que se
 * ofrece al armar el cantoral (pedido del 4-nov-2026: en Adviento, Cuaresma, Pascua o
 * Semana Santa, primero los cantos que llevan esa etiqueta).
 *  0 · de Semana Santa, y la Misa cae en Semana Santa
 *  1 · etiquetado para este tiempo
 *  2 · sirve todo el año
 *  3 · de otro tiempo (solo se ve buscándolo)
 */
export function rangoDelTiempo(
  song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>,
  season: string,
  fecha?: Date,
): number {
  const at = ataduras(song);
  if (at.length === 0) return 2;
  if (fecha && esSemanaSanta(fecha) && at.some(a => a.semanaSanta)) return 0;
  return at.some(a => coincide(a, season, fecha)) ? 1 : 3;
}

/** Los cantos ordenados por `rangoDelTiempo`, sin alterar el orden dentro de cada rango. */
export function ordenarPorTiempo<T extends Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>>(
  songs: T[], season: string, fecha?: Date,
): T[] {
  return songs
    .map((song, i) => ({ song, i, r: rangoDelTiempo(song, season, fecha) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(({ song }) => song);
}

/** Los tiempos a los que ata el canto, para rotularlo («Navidad», «Semana Santa»). */
export function tiemposDelCanto(song: Pick<Song, 'liturgicalSeasons' | 'liturgicalSeason'>): string[] {
  const vistos = new Set<string>();
  for (const a of ataduras(song)) vistos.add(a.semanaSanta ? 'Semana Santa' : a.tiempo);
  return [...vistos];
}
