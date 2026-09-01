/**
 * El "canto" Salmo responsorial que viaja al cantoral.
 *
 * El salmo no se elige del catálogo: sale del libro musicalizado según la celebración
 * de la fecha (página del PDF para el coro) y de la antífona, que el coro puede
 * escribir o corregir a mano.
 *
 * Las dos piezas son independientes, y esa es la regla que hay que respetar: **basta
 * con una**. Antes se exigía que la celebración estuviera en el índice, así que si el
 * libro todavía no la traía, el coro escribía la antífona y el salmo no llegaba al
 * cantoral igual. Ahora una antífona escrita a mano viaja sola (sin página, solo el
 * texto, que es justo lo que ve el pueblo).
 */
import { Song } from '../types';
import { getLiturgicalDateForDate } from './liturgicalCalendar';
import { getSundayCycle } from './liturgicalCycle';
import { resolvePsalm } from '../data/psalmIndex';

/**
 * @param massDate fecha de la Misa, 'YYYY-MM-DD'
 * @param antiphon lo que el coro tenga escrito en la caja de la antífona
 * @returns el canto del salmo, o `null` si no hay ni antífona ni página que mostrar
 */
export function buildPsalmSong(massDate: string, antiphon: string): Song | null {
  const celebracion = getLiturgicalDateForDate(massDate);
  const delLibro = celebracion ? resolvePsalm(getSundayCycle(massDate), celebracion) : null;
  const texto = (antiphon ?? '').trim();

  if (!texto && (!delLibro || delLibro.page == null)) return null;

  return {
    id: `psalm-${massDate}`,
    title: 'Salmo responsorial',
    category: 'Salmo',
    youtubeId: '',
    duration: '',
    lyrics: texto,
    massMoment: 'salmo',
    isLiturgical: true,
    psalmBookId: delLibro?.driveFileId,
    psalmPage: delLibro?.page,
    psalmPageEnd: delLibro?.pageEnd,
  } as Song;
}

/** ¿Este "canto" es el salmo del libro, armado a partir de la fecha de la Misa? */
export function isBookPsalm(song: Pick<Song, 'id' | 'category'>): boolean {
  return song.category === 'Salmo' && String(song.id).startsWith('psalm-');
}

/**
 * Cantos que se cargan al constructor al EDITAR o CLONAR un cantoral publicado.
 *
 * Deja fuera el salmo responsorial, que no es un canto del catálogo: se deriva de la
 * fecha de la Misa (página del libro + antífona de la celebración) y lleva esa fecha
 * en el id. Si viajaba en la copia, el constructor veía que "ya hay Salmo" y publicaba
 * el del domingo viejo. Sin él, se vuelve a derivar de la fecha nueva.
 */
export function songsForBuilder<T extends Pick<Song, 'id' | 'category'>>(songs: T[]): T[] {
  return songs.filter(s => !isBookPsalm(s));
}

/**
 * El repertorio REAL de una Misa: el borrador del constructor MÁS el salmo del libro.
 *
 * El salmo no se elige del catálogo —sale de la fecha, con la antífona que escriba el
 * coro—, así que nunca está en el borrador y hay que sumarlo aparte. Esta regla estaba
 * escrita suelta en cada sitio que la necesitaba, y en el que se olvidó (la vista previa
 * del folleto) salía un folleto SIN salmo: quien escribía la antífona a mano no la veía
 * por ningún lado y daba por hecho que no había viajado. Vive aquí para que sea una y
 * la misma en el folleto, en el Atril y en lo que se publica.
 *
 * Si el borrador ya trae un canto en la parte "Salmo" (uno del catálogo), ese manda: no
 * se le encima el del libro.
 */
export function conSalmoDelLibro<T extends Pick<Song, 'category'>>(
  cantoral: T[],
  salmo: T | null,
): T[] {
  if (!salmo) return cantoral;
  if (cantoral.some((s) => s.category === 'Salmo')) return cantoral;
  return [...cantoral, salmo];
}

/**
 * ¿Hay que reemplazar la antífona de la caja al cambiar la fecha de la Misa?
 *
 * La fecha se suele elegir DESPUÉS de escribir la antífona, y cada cambio de fecha la
 * reemplazaba por la del libro sin avisar: lo escrito a mano desaparecía. Y como la
 * caja quedaba con OTRO texto en vez de vacía, ni siquiera se notaba — se publicaba con
 * una antífona que no era la suya.
 *
 * Vaciar la caja cuenta como "no escrita": es la forma de volver a la del libro.
 */
export function debeReponerAntifona(escritaAMano: boolean): boolean {
  return !escritaAMano;
}

/** ¿Este texto cuenta como escrito a mano? (vacío = no, para poder volver al libro). */
export function esAntifonaEscritaAMano(texto: string): boolean {
  return texto.trim().length > 0;
}
