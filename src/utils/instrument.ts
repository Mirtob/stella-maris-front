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
/**
 * Normaliza un nombre de instrumento para poder compararlo.
 *
 * La BD guarda los valores en minúscula y SIN tilde ("organo", "guitarra",
 * "coro"), mientras que `InstrumentType` los usa con mayúscula y tilde
 * ("Órgano"). Comparar en crudo da `["organo"].includes('Órgano') === false`
 * para todos los cantos, que es la razón por la que el instrumento no filtraba
 * ni ordenaba nada. SongManager ya normalizaba así al leerlos.
 */
function normalizeInstrument(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

export function songMatchesInstrument(song: Song, instrument?: InstrumentType): boolean {
  if (!instrument) return true;

  // Preferir el arreglo; caer a `version` solo si el canto viene de una fuente
  // antigua que no lo trae (mocks, catálogo importado sin instrumentos).
  const list = song.instruments && song.instruments.length > 0
    ? song.instruments
    : (song.version ? [song.version] : []);

  // Sin instrumentos marcados = sirve para todos.
  if (list.length === 0) return true;

  const target = normalizeInstrument(instrument);
  return list.some((i) => normalizeInstrument(i) === target);
}

/**
 * Deja SOLO los cantos que sirven para el instrumento elegido en esta Misa.
 *
 * Es un filtro duro, a propósito: el coro que toca con guitarra no debe ver
 * versiones de órgano. Un momento puede quedar sin cantos y eso es correcto —
 * significa que aún no se ha grabado esa versión. Quien consuma esta función
 * debe distinguir en la UI "no hay para tu instrumento" de "no hay nada".
 */
export function filterByInstrument(songs: Song[], instrument?: InstrumentType): Song[] {
  if (!instrument) return songs;
  return songs.filter((s) => songMatchesInstrument(s, instrument));
}
