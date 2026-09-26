/**
 * Poner al día los cantos de un cantoral publicado con lo que dice HOY el catálogo.
 *
 * Un cantoral guarda una COPIA de cada canto dentro de sí (`published_cantorals.songs`
 * es un jsonb). Eso es deliberado: el cantoral tiene que poder abrirse aunque un canto
 * se borre del catálogo, y sin una consulta por canto. Pero tiene un precio que el coro
 * notó enseguida — se corrige una letra en el catálogo y el folleto ya publicado sigue
 * imprimiendo la vieja, porque se armó con la copia congelada.
 *
 * Esto refresca SOLO lo que el folleto imprime —título, autor y letra— más de dónde sale
 * la partitura, que desde que las partes fijas van con música también se imprime. Lo
 * demás se respeta tal cual venía, y en particular:
 *
 *  · La CATEGORÍA no se toca nunca. La parte de la Misa la decide el cantoral, no el
 *    catálogo: un canto puede servir en Entrada y estar puesto en Comunión.
 *  · Los cantos SINTÉTICOS —el salmo del libro, los propios del Graduale, el Kyriale, las
 *    antífonas del Misal, el Padre Nuestro armado por el diálogo— no están en el catálogo
 *    y se quedan exactamente como estaban.
 *  · Un canto BORRADO del catálogo conserva su copia. Es justo para lo que se guardó.
 */
import { Song } from '../types';

/**
 * El id del canto en el CATÁLOGO.
 *
 * Un canto que sirve en varias partes se guarda una vez por parte, con la parte pegada
 * al id (`<id>::comunion`), para que el cantoral no colapse el Santo y el Cordero que
 * vienen de la misma Misa. Para buscarlo en el catálogo hay que quitar ese sufijo.
 */
export function idDeCatalogo(id: string): string {
  const i = (id ?? '').indexOf('::');
  return i === -1 ? (id ?? '') : id.slice(0, i);
}

/** Los ids del catálogo son UUID. Los sintéticos (salmo-…, padre-nuestro-…) no. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Los ids de catálogo que vale la pena consultar.
 *
 * Se quita el sufijo de la parte (`<id>::comunion`) y se descarta lo que no es UUID: la
 * columna `id` es uuid y un solo valor que no lo sea hace fallar la consulta ENTERA.
 */
export function idsConsultables(songs: Song[]): string[] {
  const ids = new Set<string>();
  for (const s of songs ?? []) {
    const id = idDeCatalogo(String(s?.id ?? ''));
    if (UUID.test(id)) ids.add(id);
  }
  return Array.from(ids);
}

/** Los campos que el folleto imprime y que, por tanto, vale la pena refrescar. */
const refrescables = (fuente: Song): Partial<Song> => ({
  title: fuente.title,
  author: fuente.author,
  artist: fuente.artist,
  lyrics: fuente.lyrics,
  originalKey: fuente.originalKey,
  driveFileId: fuente.driveFileId,
  driveFolderId: fuente.driveFolderId,
  sheetMusicUrl: fuente.sheetMusicUrl,
  sheets: fuente.sheets,
  // De qué Misa es esta parte. Va aquí y no entre lo intocable porque es un dato del
  // CATÁLOGO, no una decisión del cantoral — a diferencia de la categoría. Y es con lo
  // que el folleto busca la partitura en Drive, así que arreglar la grafía de una Misa
  // tiene que llegar también a los cantorales ya publicados: si no, siguen buscando por
  // el nombre viejo. (Las cuatro partes de Nebreda estaban escritas de tres formas.)
  massName: fuente.massName,
});

/**
 * Devuelve los cantos del cantoral con lo impreso puesto al día.
 *
 * `catalogo` puede ser el arreglo completo de cantos o un índice ya armado; lo que no
 * esté ahí se devuelve intacto. Nunca lanza y nunca pierde un canto: la lista de salida
 * tiene el mismo largo y el mismo orden que la de entrada.
 */
export function refrescarCantos(songs: Song[], catalogo: Song[] | Map<string, Song>): Song[] {
  const indice = catalogo instanceof Map
    ? catalogo
    : new Map((catalogo ?? []).map((s) => [String(s.id), s]));
  if (indice.size === 0) return songs ?? [];

  return (songs ?? []).map((s) => {
    const alDia = indice.get(idDeCatalogo(String(s.id)));
    if (!alDia) return s;
    // Los campos vacíos del catálogo SÍ pisan a los de la copia: si se le quitó el autor
    // a un canto, el folleto tiene que dejar de imprimirlo. Por eso se asigna el objeto
    // entero de campos refrescables y no solo los que traen valor.
    const puesto = { ...s, ...refrescables(alDia) };
    // Una excepción: la partitura de una parte del ordinario que el constructor RESOLVIÓ
    // desde la carpeta de la Misa en Drive (ver resolveOrdinarySheetMusic). Esa URL no
    // viene del catálogo —el canto no tiene `drive_file_id`— y pisarla con el vacío del
    // catálogo dejaría al Atril sin partitura. Se reconoce porque la copia tampoco tenía
    // `driveFileId`: si lo tenía y el catálogo se lo quitó, sí se borra.
    if (!alDia.driveFileId && !alDia.sheetMusicUrl && !s.driveFileId && s.sheetMusicUrl) {
      puesto.sheetMusicUrl = s.sheetMusicUrl;
    }
    // Lo mismo con las partituras POR VOZ que el constructor sacó de la carpeta de Drive
    // (aclamaciones, Padre Nuestro): si el catálogo no trae ni voces ni carpeta, no hay
    // de dónde sacarlas de nuevo y el coro se quedaría sin su voz en el Atril.
    if (!alDia.sheets?.length && !alDia.driveFolderId && s.sheets?.length) {
      puesto.sheets = s.sheets;
    }
    return puesto;
  });
}
