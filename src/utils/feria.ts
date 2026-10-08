/**
 * El nombre litúrgico de un día de semana sin celebración propia (una feria).
 *
 * Pedido del 8-oct-2026: un coro publicó el cantoral de una Misa de jueves y, como el
 * menú exigía una celebración y el día no tenía ninguna, eligió una de la lista — la del
 * domingo siguiente — y el cantoral se fue a ese domingo, pegado al del fin de semana.
 * Un día de semana no necesita una solemnidad para tener Misa: tiene su nombre propio,
 * «Jueves de la 27.ª semana del Tiempo Ordinario», y con ese se publica.
 *
 * La semana se calcula por FECHAS, no leyendo el nombre del domingo: cuando una
 * solemnidad cae en domingo (Todos los Santos, el 1 de noviembre) ese domingo pierde su
 * número, y la semana sigue contando igual.
 */
import { calculateEaster, getFirstSundayOfAdvent, getDateForLiturgicalName, getLiturgicalDateForDate } from './liturgicalCalendar';
import { parseYmdLocal, formatYmdLocal, addDaysLocal } from './dateLocal';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/** Días entre dos fechas 'YYYY-MM-DD' (b − a). */
const dias = (a: string, b: string) =>
  Math.round((parseYmdLocal(b).getTime() - parseYmdLocal(a).getTime()) / 86_400_000);

/** El Bautismo del Señor de ese año: el del calendario, o el domingo después del 6 de enero. */
function bautismo(year: number): string {
  const delCalendario = getDateForLiturgicalName('Bautismo del Señor', year);
  if (delCalendario?.startsWith(`${year}-`)) return delCalendario;
  const d = new Date(year, 0, 7);
  while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  return formatYmdLocal(d);
}

/**
 * «Jueves de la 27.ª semana del Tiempo Ordinario», «Lunes Santo», «Viernes después de
 * Ceniza»… Para un DOMINGO devuelve '' (los domingos ya tienen nombre en el calendario).
 */
export function nombreDeFeria(fecha: string): string {
  const d = parseYmdLocal(fecha);
  const dow = d.getDay();
  if (dow === 0) return '';
  const dia = DIAS[dow];
  const year = d.getFullYear();

  const pascua = formatYmdLocal(calculateEaster(year));
  const ceniza = addDaysLocal(pascua, -46);
  const cuaresma1 = addDaysLocal(pascua, -42);
  const ramos = addDaysLocal(pascua, -7);
  const pentecostes = addDaysLocal(pascua, 49);
  const adviento1 = formatYmdLocal(getFirstSundayOfAdvent(year));
  const cristoRey = addDaysLocal(adviento1, -7);
  const semana = (desde: string) => Math.floor(dias(desde, fecha) / 7) + 1;

  // Adviento → 24 de diciembre.
  if (fecha >= adviento1 && fecha < `${year}-12-25`) return `${dia} de la ${semana(adviento1)}.ª semana de Adviento`;
  // Tiempo de Navidad: del 25 de diciembre al Bautismo del Señor.
  if (fecha >= `${year}-12-25` || fecha <= bautismo(year)) return `${dia} del Tiempo de Navidad`;
  // Tiempo Ordinario, antes de Cuaresma: la semana 1 empieza el lunes tras el Bautismo.
  if (fecha < ceniza) return `${dia} de la ${semana(bautismo(year))}.ª semana del Tiempo Ordinario`;
  // De Ceniza al sábado siguiente.
  if (fecha < cuaresma1) return fecha === ceniza ? 'Miércoles de Ceniza' : `${dia} después de Ceniza`;
  // Cuaresma.
  if (fecha < ramos) return `${dia} de la ${semana(cuaresma1)}.ª semana de Cuaresma`;
  // Semana Santa (el Triduo lo nombra el calendario; esto es solo por si falta).
  if (fecha < pascua) return `${dia} Santo`;
  // Octava de Pascua y Tiempo Pascual.
  if (fecha < addDaysLocal(pascua, 7)) return `${dia} de la Octava de Pascua`;
  if (fecha < pentecostes) return `${dia} de la ${semana(pascua)}.ª semana de Pascua`;
  // Tiempo Ordinario tras Pentecostés: se cuenta hacia atrás desde Cristo Rey (34.ª).
  const domingo = addDaysLocal(fecha, -dow);
  const numero = fecha > cristoRey ? 34 : 34 - Math.round(dias(domingo, cristoRey) / 7);
  return `${dia} de la ${numero}.ª semana del Tiempo Ordinario`;
}

/**
 * El nombre con el que se publica un día: la celebración del calendario (o la agregada
 * por la parroquia) si la hay; si no, el de la feria. Nunca vacío para un día de semana,
 * así que publicar un jueves no exige inventar una celebración.
 */
export function nombreDelDia(fecha: string): string {
  return getLiturgicalDateForDate(fecha) || nombreDeFeria(fecha);
}
