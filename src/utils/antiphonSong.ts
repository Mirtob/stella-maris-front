/**
 * Las antífonas de entrada y de comunión, cuando el coro decide llevarlas al cantoral.
 *
 * No son cantos del catálogo: son el texto propio del día, como el salmo. Viajan igual
 * que él —como un "canto" más de su parte— y por eso salen solas en el folleto, en la
 * vista del cantoral publicado y en el Modo Atril, sin tocar nada de eso.
 *
 * No reemplazan al canto de entrada ni al de comunión: se SUMAN. En la Misa, la
 * antífona de entrada se canta después del canto de entrada, y la de comunión cuando el
 * sacerdote empieza a comulgar. Por eso se añaden al final de su parte.
 *
 * El coro decide si van con una casilla. Sin marcar, la antífona queda solo como
 * referencia en el constructor y no se publica.
 */
import { Song } from '../types';

/** Partes de la Misa que tienen antífona propia en el Misal. */
export type ParteConAntifona = 'Entrada' | 'Comunión';

const TITULO: Record<ParteConAntifona, string> = {
  'Entrada': 'Antífona de entrada',
  'Comunión': 'Antífona de comunión',
};

const PREFIJO: Record<ParteConAntifona, string> = {
  'Entrada': 'antifona-entrada',
  'Comunión': 'antifona-comunion',
};

/**
 * El "canto" de una antífona. `null` si no hay texto o si el coro no la marcó.
 *
 * Lleva la fecha en el id, igual que el salmo: así, al editar o clonar un cantoral,
 * `songsForBuilder` la saca del borrador y se vuelve a derivar de la fecha nueva en vez
 * de arrastrar la antífona del domingo viejo.
 */
export function buildAntiphonSong(
  massDate: string,
  parte: ParteConAntifona,
  texto: string,
  incluir: boolean,
): Song | null {
  const t = (texto ?? '').trim();
  if (!incluir || !t) return null;
  return {
    id: `${PREFIJO[parte]}-${massDate}`,
    title: TITULO[parte],
    category: parte,
    youtubeId: '',
    duration: '',
    lyrics: t,
    isLiturgical: true,
  } as Song;
}

/** ¿Este "canto" es una antífona derivada de la fecha, y no un canto del catálogo? */
export function isAntiphonSong(song: Pick<Song, 'id'>): boolean {
  const id = String(song.id);
  return id.startsWith('antifona-entrada-') || id.startsWith('antifona-comunion-');
}

/** La antífona de esa parte dentro de un cantoral publicado (para reponerla al editar). */
export function findAntiphonSong<T extends Pick<Song, 'id' | 'lyrics'>>(
  songs: T[],
  parte: ParteConAntifona,
): T | undefined {
  return songs.find((s) => String(s.id).startsWith(`${PREFIJO[parte]}-`));
}

/**
 * Agrega las antífonas marcadas al final de su parte.
 *
 * Al final y no al principio: el canto de entrada va primero y la antífona después, que
 * es el orden en que se cantan. Si ya viene una antífona de esa parte (se está editando
 * un cantoral que la traía), no se duplica.
 */
export function conAntifonas<T extends Pick<Song, 'id'>>(cantoral: T[], antifonas: (T | null)[]): T[] {
  let salida = cantoral;
  for (const a of antifonas) {
    if (!a) continue;
    if (salida.some((s) => String(s.id) === String(a.id))) continue;
    salida = [...salida, a];
  }
  return salida;
}
