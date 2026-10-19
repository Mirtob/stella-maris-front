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
 *
 * Lo que SÍ puede reemplazar a una parte de la Misa es una pieza «ad libitum» del libro
 * (18-oct-2026): Kyries, Glorias, Sanctus y Agnus sueltos que el Romanum trae justamente
 * para eso. No es otra Misa, así que no rompe la regla. Y el Credo va aparte, como el
 * Padre Nuestro: el libro trae los Credos fuera de las Misas y sirven con cualquiera.
 */
import { Song } from '../types';
import {
  misaDelKyriale, kyrialeImageUrl, fuenteKyriale, tonosDelPaterNoster,
  paterNosterImageUrl, fuentePaterNoster, credoDelKyriale, credoImageUrl, fuenteCredo,
  piezaAdLibitum, adLibitumImageUrl, fuenteAdLibitum,
  CATEGORIA_DE_LA_PARTE, type ParteKyriale,
} from '../data/kyrialeIndex';
import type { LibroGraduale } from '../data/gradualeIndex';

const PREFIJO = 'kyriale-';

/** Una Misa (o, con `adLibitum`, una pieza suelta del Romanum): libro y número romano. */
export interface EleccionKyriale {
  libro: LibroGraduale;
  numero: string;
  /** Es una pieza «ad libitum», no una Misa (sólo vale para reemplazar UNA parte). */
  adLibitum?: boolean;
}

/** Con qué se reemplaza cada parte de la Misa, si se reemplaza. */
export type PartesKyriale = Partial<Record<ParteKyriale, EleccionKyriale | null>>;

/** Partes que siguen al Kyrie sin discusión, más el Gloria, que puede venir de otra. */
const ATADAS: ParteKyriale[] = ['kyrie', 'sanctus', 'agnus'];

/**
 * ¿Se acepta este reemplazo para esa parte? El Gloria, de cualquier Misa o ad libitum;
 * el Kyrie, el Santo y el Cordero, sólo por una pieza ad libitum (nunca de otra Misa).
 */
function reemplazoValido(
  parte: ParteKyriale, e: EleccionKyriale | null | undefined,
): e is EleccionKyriale {
  if (!e) return false;
  return parte === 'gloria' || !!e.adLibitum;
}

function cantoDe(
  massDate: string, eleccion: EleccionKyriale, parte: ParteKyriale, misaDelOrdinario?: string,
): Song | null {
  if (eleccion.adLibitum) {
    const pieza = piezaAdLibitum(parte, eleccion.numero);
    if (!pieza) return null;
    return {
      id: `${PREFIJO}${parte}-${massDate}`,
      title: `${CATEGORIA_DE_LA_PARTE[parte]} gregoriano`,
      category: CATEGORIA_DE_LA_PARTE[parte],
      youtubeId: '',
      duration: '',
      lyrics: '',
      isLiturgical: true,
      massName: misaDelOrdinario ?? pieza.rotulo,
      gradualeImage: adLibitumImageUrl(parte, pieza.numero),
      gradualeFuente: fuenteAdLibitum(pieza),
    } as Song;
  }
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
    massName: misaDelOrdinario ?? `${misa.rotulo} (gregoriana)`,
    gradualeImage: kyrialeImageUrl(misa.libro, misa.numero, parte),
    gradualeFuente: fuenteKyriale(misa),
  } as Song;
}

/**
 * Los cantos del ordinario gregoriano para el cantoral.
 *
 * @param partes   Reemplazos por parte: el Gloria de otra Misa (o ad libitum), y el
 *                 Kyrie, el Santo o el Cordero por una pieza ad libitum. Se acepta
 *                 también una Misa sola, que es la del Gloria (como antes).
 * @param sinKyrie Hay Rito de Aspersión (Pascua): reemplaza al acto penitencial y el
 *                 Kyrie se omite, así que la Misa aporta solo Gloria, Santo y Cordero.
 */
export function buildKyrialeSongs(
  massDate: string,
  eleccion: EleccionKyriale | null,
  partes?: PartesKyriale | EleccionKyriale | null,
  sinKyrie = false,
): Song[] {
  if (!eleccion) return [];
  const reemplazos: PartesKyriale = partes && 'libro' in partes
    ? { gloria: partes as EleccionKyriale } : (partes ?? {}) as PartesKyriale;
  const misa = misaDelKyriale(eleccion.libro, eleccion.numero);
  const misaDelOrdinario = misa ? `${misa.rotulo} (gregoriana)` : undefined;
  return ([...ATADAS, 'gloria'] as ParteKyriale[])
    .filter((p) => !(sinKyrie && p === 'kyrie'))
    .map((p) => {
      const r = reemplazos[p];
      // El Gloria prestado de otra Misa dice de cuál es; lo ad libitum va con la Misa.
      const prestado = p === 'gloria' && reemplazoValido(p, r) && !r.adLibitum;
      return cantoDe(massDate, reemplazoValido(p, r) ? r : eleccion, p,
        prestado ? undefined : misaDelOrdinario);
    })
    .filter((s): s is Song => s !== null);
}

/** ¿Este "canto" es una parte del ordinario gregoriano? */
export function isKyrialeSong(song: Pick<Song, 'id'>): boolean {
  return String(song.id).startsWith(PREFIJO);
}

function eleccionDeLaParte<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string, parte: ParteKyriale,
): EleccionKyriale | null {
  const canto = songs.find((s) => String(s.id) === `${PREFIJO}${parte}-${massDate}`);
  return canto ? desdeLaImagen(canto.gradualeImage) : null;
}

/**
 * La Misa que llevaba un cantoral publicado, para reponerla al editarlo.
 *
 * Se lee del Kyrie, que es el que manda: el Gloria puede ser de otra Misa, así que
 * mirarlo a él daría la respuesta equivocada cuando el coro lo cambió. Si el Kyrie es
 * ad libitum (o no hay, por la aspersión), se lee del Santo o del Cordero.
 */
export function misaDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): EleccionKyriale | null {
  for (const parte of ATADAS) {
    const e = eleccionDeLaParte(songs, massDate, parte);
    if (e && !e.adLibitum) return e;
  }
  return null;
}

/** Las partes que un cantoral publicado reemplazó por una pieza ad libitum. */
export function adLibitumDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): PartesKyriale {
  const salida: PartesKyriale = {};
  for (const parte of ATADAS) {
    const e = eleccionDeLaParte(songs, massDate, parte);
    if (e?.adLibitum) salida[parte] = e;
  }
  return salida;
}

/** El Gloria del cantoral publicado, que puede ser de otra Misa que el Kyrie. */
export function gloriaDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): EleccionKyriale | null {
  const gloria = songs.find((s) => String(s.id) === `${PREFIJO}gloria-${massDate}`);
  return gloria ? desdeLaImagen(gloria.gradualeImage) : null;
}

/**
 * De la ruta de la imagen a libro y número: /kyriale/romanum/XI/kyrie.webp es la Misa
 * XI; /kyriale/romanum/ad-libitum/kyrie/IV.webp, el Kyrie IV ad libitum.
 */
function desdeLaImagen(url?: string): EleccionKyriale | null {
  const suelta = /^\/kyriale\/romanum\/ad-libitum\/[a-z]+\/([^/.]+)\./.exec(url ?? '');
  if (suelta) return { libro: 'romanum', numero: suelta[1], adLibitum: true };
  const m = /^\/kyriale\/(romanum|simplex)\/([^/]+)\//.exec(url ?? '');
  return m ? { libro: m[1] as LibroGraduale, numero: m[2] } : null;
}

/** El Credo elegido: libro y número romano. */
export interface EleccionCredo {
  libro: LibroGraduale;
  numero: string;
}

/**
 * El Credo gregoriano. Va suelto, como el Padre Nuestro: el libro trae los Credos fuera
 * de las Misas y cualquiera sirve con cualquiera.
 */
export function buildCredoSong(massDate: string, eleccion: EleccionCredo | null): Song | null {
  if (!eleccion) return null;
  const credo = credoDelKyriale(eleccion.libro, eleccion.numero);
  if (!credo) return null;
  return {
    id: `${PREFIJO}credo-${massDate}`,
    title: 'Credo gregoriano',
    category: 'Credo',
    youtubeId: '',
    duration: '',
    lyrics: '',
    isLiturgical: true,
    massName: credo.rotulo,
    gradualeImage: credoImageUrl(credo.libro, credo.numero),
    gradualeFuente: fuenteCredo(credo),
  } as Song;
}

/** El Credo que llevaba un cantoral publicado, para reponerlo al editarlo. */
export function credoDelCantoral<T extends Pick<Song, 'id' | 'gradualeImage'>>(
  songs: T[], massDate: string,
): EleccionCredo | null {
  const canto = songs.find((s) => String(s.id) === `${PREFIJO}credo-${massDate}`);
  const m = /^\/kyriale\/(romanum|simplex)\/credo\/([^/.]+)\./.exec(canto?.gradualeImage ?? '');
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
