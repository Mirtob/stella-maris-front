/**
 * Qué se manda a guardar al EDITAR un canto.
 *
 * La regla que hay que no romper: en `updateSong` (services/songs.ts) `undefined`
 * significa **"no toques esa columna"** y `null` significa **"vacíala"**. Un campo que
 * el editor permite borrar y que se manda como `undefined` no se borra nunca: el dato
 * viejo sobrevive a la edición.
 *
 * Eso fue exactamente el fallo reportado con la partitura — se quitaba en el editor, se
 * guardaba, y el canto seguía mostrándola. Por eso el mapeo "texto vacío → null" vive
 * aquí, en un solo lugar y con pruebas, en vez de repetido campo por campo.
 */

/** Los campos de texto del editor que se pueden vaciar. */
export interface ClearableSongText {
  author: string;
  artist: string;
  driveFileId: string;
  driveFolderId: string;
  duration: string;
  originalKey: string;
  massName: string;
  lyrics: string;
}

/** Texto del formulario → valor a guardar. Vacío (o solo espacios) borra la columna. */
export const clearableText = (raw: string): string | null => raw.trim() || null;

export interface SongTextPatch {
  author: string | null;
  artist: string | null;
  driveFileId: string | null;
  driveFolderId: string | null;
  duration: string | null;
  originalKey: string | null;
  massName: string | null;
  lyrics: string | null;
}

/**
 * Los campos de texto de la ficha, listos para `updateSong`. Todos viajan siempre —
 * ninguno se omite— para que borrar en el editor borre de verdad en la base.
 */
export function songTextPatch(form: ClearableSongText): SongTextPatch {
  return {
    author: clearableText(form.author),
    artist: clearableText(form.artist),
    driveFileId: clearableText(form.driveFileId),
    driveFolderId: clearableText(form.driveFolderId),
    duration: clearableText(form.duration),
    originalKey: clearableText(form.originalKey),
    massName: clearableText(form.massName),
    // La letra conserva sus saltos de línea y su sangría: solo se mira si quedó vacía.
    lyrics: form.lyrics.trim() ? form.lyrics : null,
  };
}
