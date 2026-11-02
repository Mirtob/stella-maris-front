/**
 * Obras instrumentales: material del coro que la asamblea no canta.
 *
 * Pedido del 2-nov-2026, para que los músicos que no cantan ni tocan el órgano (los
 * bronces) tengan su lugar en el Modo Atril. Hay dos clases de material y se tratan
 * distinto:
 *
 *  · El ARREGLO de bronces de un canto o una aclamación: el canto sigue siendo del
 *    pueblo; lo único del coro son los PDF de cada instrumento, que viven en la carpeta
 *    del canto en Drive (`sheets`). Esos PDF nunca llegan al pueblo: ver
 *    partituraDelPueblo y esLaVoz en utils/ordinarySheetMusic.
 *  · La OBRA instrumental (un ofertorio para bronces, el toque de la elevación): no
 *    tiene letra ni la canta nadie de la asamblea. Esa sale entera de todo lo que ve el
 *    Pueblo fiel: su lista de cantorales, el enlace del QR, su Modo Atril y el folleto.
 */
import { Song } from '../types';

/** La parte de la Misa del toque de la elevación. Siempre instrumental. */
export const ELEVACION = 'Elevación';

/** ¿Es una obra solo instrumental? */
export function esInstrumental(s: Pick<Song, 'category'> & Partial<Pick<Song, 'instrumental'>>): boolean {
  return !!s.instrumental || s.category === ELEVACION;
}

/** Los cantos sin las obras instrumentales: lo que ve y canta el pueblo. */
export function sinInstrumentales<T extends Pick<Song, 'category'> & Partial<Pick<Song, 'instrumental'>>>(
  songs: T[],
): T[] {
  return songs.filter((s) => !esInstrumental(s));
}

/** El mismo cantoral, como lo ve el Pueblo fiel. Devuelve el mismo objeto si no cambia. */
export function cantoralParaElPueblo<C extends { songs: Song[] }>(c: C): C {
  const songs = c.songs ?? [];
  return songs.some(esInstrumental) ? { ...c, songs: sinInstrumentales(songs) } : c;
}
