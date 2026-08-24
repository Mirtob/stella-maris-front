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
