/**
 * Fechas locales (src/utils/dateLocal.ts).
 *
 * Regresión del fallo reportado el 24-ago-2026: se publicó un cantoral para el
 * **domingo 23** y el folleto salió fechado el **sábado 22**.
 *
 * La causa no era la publicación sino cómo se leía la fecha: `new Date('2026-08-23')`
 * se parsea como **medianoche UTC**, que en Chile (UTC-4) es el 22 a las 20:00. Al
 * formatear con la zona local, el día retrocede uno. Le pasaba a la portada del
 * folleto del Pueblo y del Coro, al nombre del archivo, a la vista previa, al gestor
 * de cantorales, al ordinario, a los avisos de solemnidades y al calendario.
 *
 * Toda la app tiene que leer 'YYYY-MM-DD' con `parseYmdLocal`. Estas pruebas fijan
 * ese contrato en una zona horaria negativa, que es donde el error se ve.
 */
process.env.TZ = 'America/Santiago';   // antes de tocar Date

import {
  parseYmdLocal, formatYmdLocal, formatYmdForDisplay, getTodayLocal,
  addDaysLocal, isWithinInclusive, getWeekRangeLocal,
} from '../../src/utils/dateLocal';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log(`\n== Zona horaria de la prueba: ${Intl.DateTimeFormat().resolvedOptions().timeZone} ==`);

console.log('\n== El caso reportado: cantoral del domingo 23-ago-2026 ==');
const MISA = '2026-08-23';
check('el día no retrocede', parseYmdLocal(MISA).getDate(), 23);
check('el mes es agosto (0-based)', parseYmdLocal(MISA).getMonth(), 7);
check('la portada dice domingo 23', formatYmdForDisplay(MISA), 'domingo, 23 de agosto de 2026');
check('el nombre del archivo lleva la fecha de la Misa',
  formatYmdForDisplay(MISA, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
  '23-08-2026');

console.log('\n== Y así se veía el error (lo que NO hay que usar) ==');
check('new Date() en UTC sí retrocede un día', new Date(MISA).getDate(), 22);
check('…y por eso mostraba sábado',
  new Date(MISA).toLocaleDateString('es-ES', { weekday: 'long' }), 'sábado');

console.log('\n== Bordes: primero de mes, fin de año, bisiesto ==');
check('1 de enero no se va a diciembre', parseYmdLocal('2026-01-01').getMonth(), 0);
check('1 de enero conserva el año', parseYmdLocal('2026-01-01').getFullYear(), 2026);
check('1 de marzo no se va a febrero', parseYmdLocal('2026-03-01').getDate(), 1);
check('29 de febrero bisiesto (2028)', formatYmdForDisplay('2028-02-29', { day: 'numeric', month: 'long' }), '29 de febrero');
check('31 de diciembre no salta de año', parseYmdLocal('2026-12-31').getFullYear(), 2026);

console.log('\n== Ida y vuelta ==');
for (const ymd of ['2026-01-01', '2026-08-23', '2026-12-31', '2026-06-15']) {
  check(`${ymd} sobrevive al ciclo parse→format`, formatYmdLocal(parseYmdLocal(ymd)), ymd);
}

console.log('\n== Aritmética de días (avisos "¡Hoy!" / "Mañana") ==');
check('sumar un día al sábado da domingo', addDaysLocal('2026-08-22', 1), '2026-08-23');
check('restar un día al domingo da sábado', addDaysLocal('2026-08-23', -1), '2026-08-22');
check('cruzar el fin de mes', addDaysLocal('2026-08-31', 1), '2026-09-01');
check('cruzar el fin de año', addDaysLocal('2026-12-31', 1), '2027-01-01');
const diasEntre = (a: string, b: string) =>
  Math.round((parseYmdLocal(b).getTime() - parseYmdLocal(a).getTime()) / 86_400_000);
check('hoy = 0 días', diasEntre(MISA, MISA), 0);
check('mañana = 1 día', diasEntre(MISA, '2026-08-24'), 1);
// El cambio de hora en Chile (primer domingo de septiembre de 2026) no debe romper
// la cuenta: entre dos medianoches locales hay un día aunque una dure 23 horas.
check('el cambio de hora no descuadra la cuenta', diasEntre('2026-09-05', '2026-09-06'), 1);

console.log('\n== Semana y rangos ==');
check('la semana del domingo 23 va de lunes 17 a domingo 23',
  getWeekRangeLocal(parseYmdLocal(MISA)), { start: '2026-08-17', end: '2026-08-23' });
check('la fecha de la Misa entra en su semana', isWithinInclusive(MISA, '2026-08-17', '2026-08-23'), true);
check('el lunes siguiente ya no', isWithinInclusive('2026-08-24', '2026-08-17', '2026-08-23'), false);

console.log('\n== Hoy ==');
check('getTodayLocal tiene formato YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(getTodayLocal()), true);
check('getTodayLocal coincide con el reloj de pared',
  getTodayLocal(), formatYmdLocal(new Date()));

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
