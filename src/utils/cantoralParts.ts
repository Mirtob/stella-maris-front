/**
 * Un canto, varias partes de la Misa.
 *
 * Un canto puede llevar etiquetas de más de una parte (p. ej. principal Comunión y
 * además Entrada y Ofertorio). La regla del constructor:
 *
 *  - Se ocupa por PARTE, no por canto: usarlo en Entrada lo bloquea SOLO en Entrada,
 *    y sigue disponible en Comunión y Ofertorio hasta que se use en todas.
 *  - Se sugiere primero en su etiqueta principal; una vez usado ahí, pasa a asomar
 *    en las secundarias. Así el ciclo se recorre sin que el coro tenga que pensarlo.
 *
 * La identidad de un canto dentro del cantoral es, por tanto, el par (id, parte):
 * el mismo id puede aparecer dos veces en partes distintas y son cosas distintas.
 */
import type { Song } from '../types';

/** ¿Este canto ya se usa EN ESTA parte? (lo que bloquea el botón "Agregar"). */
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

/** Sugerencias de una parte: quita lo ya usado AQUÍ y ordena por preferencia. */
export function ordenarSugerencias(
  songs: Song[],
  parte: string,
  parteMoment: string,
  cantoral: Song[],
): Song[] {
  return songs
    .filter(song => !estaEnParte(cantoral, song.id, parte))
    .map((song, i) => ({ song, i }))
    .sort((a, b) =>
      rangoSugerencia(a.song, parte, parteMoment, cantoral)
        - rangoSugerencia(b.song, parte, parteMoment, cantoral)
      || a.i - b.i)
    .map(({ song }) => song);
}
