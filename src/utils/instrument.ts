import { Song, InstrumentType } from '../types';

/**
 * ¿Este canto sirve para el instrumento con el que toca el coro hoy?
 *
 * La columna `instruments` de la BD es un ARREGLO y su semántica (fijada en
 * SongManager) es: **vacío = sirve para todas las versiones**. `song.version` es
 * solo `instruments[0]`, así que comparar contra él da falsos negativos:
 *
 *   - `['Coro','Guitarra','Órgano']` → version 'Coro' → no matcheaba 'Órgano'
 *     aunque el canto sí sirve para órgano.
 *   - `[]` (= sirve para todos) → version `undefined` → no matcheaba nunca.
 *
 * Por eso la compatibilidad se decide SIEMPRE con esta función y nunca con
 * `song.version`, que se conserva solo para mostrar la etiqueta en la ficha.
 */
export function songMatchesInstrument(song: Song, instrument?: InstrumentType): boolean {
  if (!instrument) return true;

  // Preferir el arreglo; caer a `version` solo si el canto viene de una fuente
  // antigua que no lo trae (mocks, catálogo importado sin instrumentos).
  const list = song.instruments && song.instruments.length > 0
    ? song.instruments
    : (song.version ? [song.version] : []);

  // Sin instrumentos marcados = sirve para todos.
  if (list.length === 0) return true;

  return list.includes(instrument);
}

/**
 * Ordena dejando primero los cantos compatibles con el instrumento, conservando
 * el orden relativo dentro de cada grupo (orden estable). No oculta nada: el
 * catálogo aún es pequeño y filtrar duro dejaría momentos sin ningún canto.
 */
export function sortByInstrument(songs: Song[], instrument?: InstrumentType): Song[] {
  if (!instrument) return songs;
  const matching: Song[] = [];
  const rest: Song[] = [];
  for (const s of songs) {
    (songMatchesInstrument(s, instrument) ? matching : rest).push(s);
  }
  return [...matching, ...rest];
}
