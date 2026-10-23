/**
 * Qué ve cada perfil de cada canto en el Modo Atril (pantalla y versión impresa).
 *
 * Vivía copiado en AtrilMode y en atrilBookletPDF ("mismo criterio que…"). Se juntó
 * aquí al sumar el Padre Nuestro y las aclamaciones (26-sep-2026), que necesitaban
 * dos reglas nuevas y no podían quedar distintas en la pantalla y en el papel:
 *
 *  · El Pueblo fiel ve la partitura de la VOZ, no la coral completa (partituraDelPueblo).
 *  · En una parte fija del ordinario sin acordes cifrados, el guitarrista ve también la
 *    partitura: con la letra sola no tiene nada que tocar, y esas partes se cantan
 *    leyendo la música (el Pater noster en tetragrama, la aclamación en pentagrama).
 */
import { Song } from '../types';
import { isOrdinary } from './ordinary';
import { hasPartSheet, sheetForPart } from './sheetParts';
import { partituraDelPueblo } from './ordinarySheetMusic';
import { lyricsHaveChords } from './songReport';

export type ContentMode = 'score' | 'chords' | 'lyrics';

/** Lo que el músico eligió con el selector Partitura / Acordes del Atril. */
export type VistaAtril = 'score' | 'chords';

export interface PerfilAtril {
  puebloFiel: boolean;
  organo: boolean;
  /** Voz del corista (SATB, viento…), si tiene. */
  voicePart?: string;
  /** Vista elegida a mano; sin ella manda el instrumento. Solo para el coro. */
  vista?: VistaAtril;
}

/** La vista que el instrumento da por defecto, la que muestra el selector al abrir. */
export function vistaPorDefecto(p: PerfilAtril): VistaAtril {
  return p.organo || p.voicePart ? 'score' : 'chords';
}

/** La partitura (URL de Drive) que le toca a este perfil en este canto. */
export function partituraDelAtril(s: Song, p: PerfilAtril): string | undefined {
  if (p.puebloFiel) return partituraDelPueblo(s);
  // La de su voz si el canto la trae; si no, el full score (sheetForPart nunca deja
  // sin partitura habiendo alguna).
  const mia = sheetForPart(s.sheets ?? [], p.voicePart);
  return mia ? `https://drive.google.com/file/d/${mia.fileId}/view` : s.sheetMusicUrl;
}

/** Qué mostrar de un canto: partitura, letra con acordes o solo letra. */
export function modoDelAtril(s: Song, p: PerfilAtril): ContentMode {
  if (p.puebloFiel) return isOrdinary(s) && partituraDelPueblo(s) ? 'score' : 'lyrics';
  // Vista elegida a mano: se respeta mientras el canto tenga con qué; si no, lo otro,
  // para que ningún canto quede en blanco por el cambio.
  if (p.vista === 'chords') return s.lyrics?.trim() || !partituraDelAtril(s, p) ? 'chords' : 'score';
  if (p.vista === 'score') return partituraDelAtril(s, p) ? 'score' : 'chords';
  // Polifonía: quien tiene voz asignada y el canto trae SU partitura, ve la partitura
  // aunque no sea organista — es justamente para lo que la subió el coro.
  if (hasPartSheet(s.sheets, p.voicePart)) return 'score';
  if (p.organo) return s.sheetMusicUrl ? 'score' : 'chords';
  if (isOrdinary(s) && s.sheetMusicUrl && !lyricsHaveChords(s.lyrics)) return 'score';
  return 'chords'; // Guitarra u otro instrumento del coro
}
