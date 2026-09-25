/**
 * Lo que dice HOY el catálogo sobre los cantos de un cantoral, leído de Supabase.
 *
 * Un cantoral guarda una COPIA de sus cantos (ver utils/refrescarCantos), así que para
 * que una corrección hecha en «Gestión de cantos» llegue al folleto, al Modo Atril y a
 * la vista del pueblo hay que volver a leer esos cantos de la tabla `songs`, que es
 * donde escribe el editor.
 *
 * Hasta el 25-sep-2026 esa relectura se hacía con `getSongs()` de services/songLoader,
 * que es el catálogo LEGACY de YouTube (descripciones de los videos, con respaldo a
 * mockSongs) y además guardado una hora en localStorage. Los ids de ahí no son los de
 * Supabase, así que una letra corregida en la app no llegaba nunca a lo ya publicado.
 *
 * Se leen SOLO los cantos del cantoral, por id, sin caché: es una consulta chica y es
 * justo el momento en que importa acertar — el coro puede haber corregido algo cinco
 * minutos antes de la Misa, desde otro teléfono.
 */
import { Song } from '../types';
import { listSongsByIds } from './songs';
import { idsConsultables, refrescarCantos } from '../utils/refrescarCantos';

/** Cuántos ids por consulta: van en la URL de PostgREST y no conviene que crezca sin tope. */
const LOTE = 100;

/**
 * Índice id → canto vigente para los cantos dados. Nunca lanza: si no se puede leer
 * (sin red, sesión caída) devuelve un índice vacío y quien lo use se queda con las
 * copias guardadas, que es lo que se veía antes.
 */
export async function leerCatalogoVigente(songs: Song[]): Promise<Map<string, Song>> {
  const ids = idsConsultables(songs);
  const indice = new Map<string, Song>();
  if (ids.length === 0) return indice;
  try {
    const lotes: string[][] = [];
    for (let i = 0; i < ids.length; i += LOTE) lotes.push(ids.slice(i, i + LOTE));
    const resultados = await Promise.all(lotes.map((l) => listSongsByIds(l)));
    for (const s of resultados.flat()) indice.set(String(s.id), s);
  } catch {
    /* se sigue con las copias */
  }
  return indice;
}

/** Atajo: los mismos cantos, con lo que dice hoy el catálogo. Mismo largo y orden. */
export async function ponerCantosAlDia(songs: Song[]): Promise<Song[]> {
  const indice = await leerCatalogoVigente(songs);
  return refrescarCantos(songs, indice);
}
