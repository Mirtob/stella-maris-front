/**
 * El propio gregoriano que el coro decide llevar al cantoral.
 *
 * Igual que el salmo del libro y que las antífonas del Misal, no es un canto del
 * catálogo: sale de la fecha (celebración + ciclo) y de qué libro elija el coro para
 * esa parte. Viaja como un "canto" más de su parte, y por eso sale solo en el folleto,
 * en el cantoral publicado y en el Modo Atril sin tocar nada de eso.
 *
 * Lleva la partitura como IMAGEN y no como PDF: los dos Graduales son facsímiles
 * escaneados y pdf.js no los dibuja bajo la CSP estricta de producción — la misma razón
 * por la que el salmo del libro va como <img>.
 *
 * Y va para TODOS, no sólo para el coro: el gregoriano lo canta también el pueblo, así
 * que el tetragrama se imprime en el folleto igual que se ve en el atril.
 */
import { Song } from '../types';
import {
  resolveGraduale, nombreDelPropio, LIBROS,
  type LibroGraduale, type OpcionesGraduale,
} from '../data/gradualeIndex';

const PREFIJO = 'graduale-';

/**
 * El "canto" del propio gregoriano de una parte. `null` si el libro no lo trae.
 *
 * El id lleva la fecha y la parte, igual que el salmo y las antífonas: al editar o
 * clonar un cantoral, `songsForBuilder` lo saca del borrador y se vuelve a derivar de
 * la fecha nueva, en vez de arrastrar el propio del domingo viejo.
 */
export function buildGradualeSong(
  massDate: string,
  celebracion: string,
  parte: string,
  libro: LibroGraduale | null,
  opciones: OpcionesGraduale = {},
): Song | null {
  if (!libro || !celebracion) return null;
  const propio = resolveGraduale(libro, celebracion, parte, opciones);
  if (!propio) return null;
  return {
    id: `${PREFIJO}${libro}-${parte}-${massDate}`,
    title: `${nombreDelPropio(propio.canto, parte)} gregoriano`,
    category: parte,
    youtubeId: '',
    duration: '',
    lyrics: '',
    isLiturgical: true,
    gradualeImage: propio.imagen,
    gradualeFuente: `${LIBROS[libro].nombre} · p. ${propio.pagina}`,
  } as Song;
}

/** ¿Este "canto" es un propio gregoriano derivado de la fecha? */
export function isGradualeSong(song: Pick<Song, 'id'>): boolean {
  return String(song.id).startsWith(PREFIJO);
}

/** El libro elegido para esa parte dentro de un cantoral publicado (para reponerlo). */
export function libroDelCantoral<T extends Pick<Song, 'id'>>(
  songs: T[], parte: string, massDate: string,
): LibroGraduale | null {
  for (const libro of ['romanum', 'simplex'] as LibroGraduale[]) {
    if (songs.some((s) => String(s.id) === `${PREFIJO}${libro}-${parte}-${massDate}`)) {
      return libro;
    }
  }
  return null;
}

/**
 * La Misa del tiempo del Simplex que llevaba un cantoral publicado.
 *
 * No va en el id —ahí sólo caben libro y parte— sino en la ruta de la imagen, que es
 * `/graduale/simplex/<clave>/<canto>.webp`. Se lee de ahí para que al editar un cantoral
 * el coro no se encuentre con otra Misa distinta de la que publicó.
 */
export function misaDelTiempoDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): string | null {
  const suyo = songs.find((s) => String(s.id).startsWith(`${PREFIJO}simplex-`)
    && String(s.id).endsWith(`-${massDate}`));
  const m = /^\/graduale\/simplex\/([^/]+)\//.exec(suyo?.gradualeImage ?? '');
  return m ? m[1] : null;
}
