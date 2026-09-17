/**
 * El ordinario en gregoriano dentro del cantoral.
 *
 * Viaja igual que los propios del Graduale y que las antífonas: como un "canto" más de
 * su parte, con la partitura en el mismo campo (`gradualeImage`), de modo que el folleto,
 * el cantoral publicado y el Modo Atril ya saben dibujarlo sin tocar nada.
 *
 * LA REGLA QUE HAY QUE RESPETAR: al elegir una Misa del Kyriale, el Santo y el Cordero
 * son los de ESA Misa. Lo único que se puede tomar de otra es el Gloria. Por eso aquí se
 * arma todo junto a partir de una sola elección, en vez de dejar cada parte suelta: si
 * cada una se eligiera por su lado, nada impediría mezclar cuatro Misas distintas.
 */
import { Song } from '../types';
import {
  misaDelKyriale, kyrialeImageUrl, fuenteKyriale, tonosDelPaterNoster,
  paterNosterImageUrl, fuentePaterNoster,
  CATEGORIA_DE_LA_PARTE, type ParteKyriale,
} from '../data/kyrialeIndex';
import type { LibroGraduale } from '../data/gradualeIndex';

const PREFIJO = 'kyriale-';

/** La Misa elegida: libro y número romano. */
export interface EleccionKyriale {
  libro: LibroGraduale;
  numero: string;
}

/** Partes que siguen al Kyrie sin discusión, más el Gloria, que puede venir de otra. */
const ATADAS: ParteKyriale[] = ['kyrie', 'sanctus', 'agnus'];

function cantoDe(
  massDate: string, eleccion: EleccionKyriale, parte: ParteKyriale,
): Song | null {
  const misa = misaDelKyriale(eleccion.libro, eleccion.numero);
  if (!misa || !misa.partes.includes(parte)) return null;
  return {
    id: `${PREFIJO}${parte}-${massDate}`,
    title: `${CATEGORIA_DE_LA_PARTE[parte]} gregoriano`,
    category: CATEGORIA_DE_LA_PARTE[parte],
    youtubeId: '',
    duration: '',
    lyrics: '',
    isLiturgical: true,
    // La Misa del Kyriale ocupa el lugar del nombre de Misa del ordinario: así el
    // cantoral muestra de qué Misa es cada parte, igual que con las de castellano.
    massName: `Gregoriana ${misa.rotulo}`,
    gradualeImage: kyrialeImageUrl(misa.libro, misa.numero, parte),
    gradualeFuente: fuenteKyriale(misa),
  } as Song;
}

/**
 * Los cantos del ordinario gregoriano para el cantoral.
 *
 * @param gloriaDe Misa de la que se toma el Gloria. Si se omite, el de la propia Misa.
 */
export function buildKyrialeSongs(
  massDate: string,
  eleccion: EleccionKyriale | null,
  gloriaDe?: EleccionKyriale | null,
): Song[] {
  if (!eleccion) return [];
  const salida = ATADAS.map((p) => cantoDe(massDate, eleccion, p));
  salida.push(cantoDe(massDate, gloriaDe ?? eleccion, 'gloria'));
  return salida.filter((s): s is Song => s !== null);
}

/** ¿Este "canto" es una parte del ordinario gregoriano? */
export function isKyrialeSong(song: Pick<Song, 'id'>): boolean {
  return String(song.id).startsWith(PREFIJO);
}

/**
 * La Misa que llevaba un cantoral publicado, para reponerla al editarlo.
 *
 * Se lee del Kyrie, que es el que manda: el Gloria puede ser de otra Misa, así que
 * mirarlo a él daría la respuesta equivocada cuando el coro lo cambió.
 */
export function misaDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): EleccionKyriale | null {
  const kyrie = songs.find((s) => String(s.id) === `${PREFIJO}kyrie-${massDate}`);
  return kyrie ? desdeLaImagen(kyrie.gradualeImage) : null;
}

/** El Gloria del cantoral publicado, que puede ser de otra Misa que el Kyrie. */
export function gloriaDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): EleccionKyriale | null {
  const gloria = songs.find((s) => String(s.id) === `${PREFIJO}gloria-${massDate}`);
  return gloria ? desdeLaImagen(gloria.gradualeImage) : null;
}

/** De la ruta de la imagen (/kyriale/romanum/XI/kyrie.webp) a libro y número. */
function desdeLaImagen(url?: string): EleccionKyriale | null {
  const m = /^\/kyriale\/(romanum|simplex)\/([^/]+)\//.exec(url ?? '');
  return m ? { libro: m[1] as LibroGraduale, numero: m[2] } : null;
}

/**
 * El Padre Nuestro gregoriano, que se elige aparte de la Misa del Kyriale.
 *
 * Va suelto porque en el libro va suelto: no pertenece a ninguna Misa del Kyriale, sino
 * al rito de comunion, y sus tres tonos sirven con cualquiera de ellas.
 */
export function buildPaterNosterSong(
  massDate: string, libro: LibroGraduale | null, tono: string | null,
): Song | null {
  if (!libro || !tono) return null;
  const ficha = tonosDelPaterNoster(libro).find((t) => t.tono === tono);
  if (!ficha) return null;
  return {
    id: `${PREFIJO}pater-${massDate}`,
    title: 'Padre Nuestro gregoriano',
    category: 'Padre Nuestro',
    youtubeId: '',
    duration: '',
    lyrics: '',
    isLiturgical: true,
    gradualeImage: paterNosterImageUrl(libro, tono),
    gradualeFuente: fuentePaterNoster(libro, ficha),
  } as Song;
}

/** El tono que llevaba un cantoral publicado, para reponerlo al editarlo. */
export function paterNosterDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): { libro: LibroGraduale; tono: string } | null {
  const canto = songs.find((s) => String(s.id) === `${PREFIJO}pater-${massDate}`);
  const m = /^\/kyriale\/(romanum|simplex)\/pater\/([^/.]+)\./.exec(canto?.gradualeImage ?? '');
  return m ? { libro: m[1] as LibroGraduale, tono: m[2] } : null;
}
