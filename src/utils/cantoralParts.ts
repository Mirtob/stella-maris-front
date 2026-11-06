/**
 * Un canto, varias partes de la Misa.
 *
 * Un canto puede llevar etiquetas de más de una parte (p. ej. principal Comunión y
 * además Entrada y Ofertorio). La regla del constructor (pedido del 4-nov-2026):
 *
 *  - En UNA Misa, un canto se usa una sola vez: elegido de Entrada, queda bloqueado
 *    en todas las demás partes de esa Misa (usadoEnLaMisa).
 *  - De una Misa a la siguiente rota: el que fue la Entrada no puede volver a ser la
 *    Entrada, pero sí el Ofertorio o la Comunión (bloqueadoPorLaAnterior, en
 *    utils/previousUsage).
 *  - Se sugiere primero en su etiqueta principal.
 *
 * (Hasta el 4-nov-2026 se bloqueaba solo la parte donde se usó y el mismo canto podía
 * ser Entrada y Comunión de la misma Misa.)
 */
import type { Song } from '../types';

/** El canto sin el sufijo de esta Misa («<id>::aclamacion-…» es el mismo canto). */
const baseId = (id: string) => (id || '').split('::')[0];

/** ¿Este canto ya se usa en ALGUNA parte de esta Misa? Entonces no se puede repetir. */
export function usadoEnLaMisa(cantoral: Song[], songId: string): boolean {
  return cantoral.some(s => baseId(s.id) === baseId(songId));
}

/** ¿Este canto ya se usa EN ESTA parte? (para marcarlo «Agregado» en su tarjeta). */
export function estaEnParte(cantoral: Song[], songId: string, parte: string): boolean {
  return cantoral.some(s => s.id === songId && s.category === parte);
}

/** Otras partes de la Misa donde ya se usa este canto (para avisarlo en la ficha). */
export function partesUsadas(cantoral: Song[], songId: string, parte: string): string[] {
  return cantoral.filter(s => s.id === songId && s.category !== parte).map(s => s.category);
}

/**
 * Orden de las sugerencias de una parte. Menor = se ofrece antes:
 *   0  su etiqueta principal, sin usar todavía en ninguna parte
 *   1  su etiqueta principal, pero ya usado en otra parte
 *   2  etiqueta secundaria, sin usar todavía
 *   3  etiqueta secundaria y ya usado en otra parte
 * Estable: dentro del mismo rango se respeta el orden de entrada.
 */
export function rangoSugerencia(
  song: Song,
  parte: string,
  parteMoment: string,
  cantoral: Song[],
): number {
  const esPrincipal = song.category === parte || song.massMoment === parteMoment;
  return (esPrincipal ? 0 : 2) + (partesUsadas(cantoral, song.id, parte).length > 0 ? 1 : 0);
}

/** Sugerencias de una parte: quita lo ya usado en la Misa y ordena por preferencia. */
export function ordenarSugerencias(
  songs: Song[],
  parte: string,
  parteMoment: string,
  cantoral: Song[],
): Song[] {
  return songs
    .filter(song => !usadoEnLaMisa(cantoral, song.id))
    .map((song, i) => ({ song, i }))
    .sort((a, b) =>
      rangoSugerencia(a.song, parte, parteMoment, cantoral)
        - rangoSugerencia(b.song, parte, parteMoment, cantoral)
      || a.i - b.i)
    .map(({ song }) => song);
}
