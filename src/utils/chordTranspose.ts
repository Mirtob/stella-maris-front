/**
 * Transposición y notación de acordes.
 *
 * Los acordes se escriben en la letra entre corchetes: [Sol], [Lam], [Do#7], [Re/Fa#].
 * Por convención los escribimos en **cifrado latino** (Do, Re, Mi, Fa, Sol, La, Si),
 * pero el usuario puede VER los acordes en latino o en **cifrado americano** (C, D, E…),
 * y transponer con las flechas. La transformación ocurre SOLO dentro de los corchetes,
 * nunca sobre la letra.
 */

export type ChordNotation = 'latin' | 'american';

// Escala cromática (12 semitonos) en ambas notaciones. Dos ortografías de las notas
// alteradas: con SOSTENIDOS (por defecto) y con BEMOLES (para tonalidades de bemoles).
const AMERICAN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const LATIN = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const AMERICAN_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const LATIN_FLAT = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si'];

// Tónicas (índice cromático) cuyas ARMADURAS llevan bemoles, por modo.
//   Mayores de bemoles: Reb(1), Mib(3), Fa(5), Lab(8), Sib(10).
//   Menores de bemoles: Dom(0), Rem(2), Mibm(3), Fam(5), Solm(7), Sibm(10).
// (Fa#/Si mayor y sus relativas se dejan en sostenidos, que es lo usual en guitarra.)
const FLAT_MAJOR_TONICS = new Set([1, 3, 5, 8, 10]);
const FLAT_MINOR_TONICS = new Set([0, 2, 3, 5, 7, 10]);

// Nombre de nota base → índice cromático (sin alteración).
const BASE_INDEX: Record<string, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  DO: 0, RE: 2, MI: 4, FA: 5, SOL: 7, LA: 9, SI: 11,
};
// Prefijos latinos a probar (Sol antes que los de 2 letras).
const LATIN_PREFIXES = ['Sol', 'Do', 'Re', 'Mi', 'Fa', 'La', 'Si'];

interface ParsedBase { index: number; rest: string; }

/** Lee la nota base (latina o americana) + alteración al inicio del token. */
function parseBase(token: string): ParsedBase | null {
  const lower = token.toLowerCase();
  for (const p of LATIN_PREFIXES) {
    if (lower.startsWith(p.toLowerCase())) {
      let index = BASE_INDEX[p.toUpperCase()];
      let rest = token.slice(p.length);
      if (rest[0] === '#') { index = (index + 1) % 12; rest = rest.slice(1); }
      else if (rest[0] === 'b') { index = (index + 11) % 12; rest = rest.slice(1); }
      return { index, rest };
    }
  }
  const m = token.match(/^([A-Ga-g])([#b]?)/);
  if (m) {
    let index = BASE_INDEX[m[1].toUpperCase()];
    if (m[2] === '#') index = (index + 1) % 12;
    else if (m[2] === 'b') index = (index + 11) % 12;
    return { index, rest: token.slice(m[0].length) };
  }
  return null;
}

function formatNote(index: number, notation: ChordNotation, preferFlats = false): string {
  const i = ((index % 12) + 12) % 12;
  if (notation === 'american') return (preferFlats ? AMERICAN_FLAT : AMERICAN)[i];
  return (preferFlats ? LATIN_FLAT : LATIN)[i];
}

/** ¿La tónica es una tonalidad menor? (rest tras la nota: "m", "min", "menor"). */
function isMinorKey(rest: string): boolean {
  return /^\s*(m(?!aj)|min|menor)/i.test(rest);
}

/**
 * Decide si los acordes deben escribirse con BEMOLES: según la ARMADURA de la
 * tonalidad DESTINO (la original transpuesta `semitones`). En Sib, Mib, Fa… (y sus
 * relativas menores) → bemoles; en Sol, Re, La… → sostenidos.
 */
export function keyPrefersFlats(originalKey: string, semitones = 0): boolean {
  const parsed = parseBase((originalKey || '').trim());
  if (!parsed) return false;
  const idx = (((parsed.index + semitones) % 12) + 12) % 12;
  return isMinorKey(parsed.rest) ? FLAT_MINOR_TONICS.has(idx) : FLAT_MAJOR_TONICS.has(idx);
}

/** Transforma un token de acorde (incluye bajo "/X"): transpone y cambia de notación. */
function transformChord(token: string, semitones: number, notation: ChordNotation, preferFlats = false): string {
  return token
    .split('/')
    .map((part) => {
      const trimmed = part.trim();
      const parsed = parseBase(trimmed);
      if (!parsed) return part; // no es un acorde reconocible → dejar igual
      const newIndex = parsed.index + semitones;
      return formatNote(newIndex, notation, preferFlats) + parsed.rest;
    })
    .join('/');
}

/**
 * Transpone y/o reescribe en la notación elegida TODOS los acordes [..] del contenido.
 * No toca la letra (solo lo que está entre corchetes). `preferFlats` fuerza la
 * ortografía con bemoles (usar `keyPrefersFlats(originalKey, semitones)` en el llamador).
 */
export function transposeContent(content: string, semitones: number, notation: ChordNotation = 'latin', preferFlats = false): string {
  return content.replace(/\[([^\]]+)\]/g, (_m, chord) => `[${transformChord(chord, semitones, notation, preferFlats)}]`);
}

/** Tonalidad transpuesta (la clave NO va entre corchetes). Escribe la tónica con la
 *  ortografía (bemoles/sostenidos) propia de la tonalidad destino. */
export function getTransposedKey(originalKey: string, semitones: number, notation: ChordNotation = 'latin'): string {
  if (!originalKey) return originalKey;
  return transformChord(originalKey, semitones, notation, keyPrefersFlats(originalKey, semitones));
}

/** Texto descriptivo de la transposición. */
export function formatTransposition(semitones: number): string {
  if (semitones === 0) return 'Tono original';
  if (semitones > 0) return `+${semitones} ${semitones === 1 ? 'semitono' : 'semitonos'}`;
  return `${semitones} ${Math.abs(semitones) === 1 ? 'semitono' : 'semitonos'}`;
}

// ── Preferencia de notación (compartida, persistida) ─────────────────────────
const NOTATION_KEY = 'stella_maris_chord_notation';

export function getChordNotation(): ChordNotation {
  try { return localStorage.getItem(NOTATION_KEY) === 'american' ? 'american' : 'latin'; } catch { return 'latin'; }
}
export function setChordNotation(n: ChordNotation): void {
  try { localStorage.setItem(NOTATION_KEY, n); } catch { /* modo privado */ }
}
