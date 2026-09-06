/**
 * Hasta cuándo un cantoral sigue a la vista (src/utils/massType.ts).
 *
 * Reportado el 6-sep-2026: un coro tenía publicado el cantoral de una Misa del sábado
 * 5 a las 18:00 y el cantoral DESAPARECIÓ antes de la Misa.
 *
 * La causa: la ventana de vigencia no miraba la hora de la Misa. La "Misa del día"
 * cerraba a las 15:00 fijas, así que un cantoral de las 18:00 se esfumaba TRES HORAS
 * ANTES de empezar. (Lo de "las 17:52" fue solo cuándo el usuario volvió a abrir la
 * app y lo notó: la lista calcula la vigencia al dibujarse.)
 *
 * La regla ahora es una sola y mira la hora: vigente hasta 4 horas después de que
 * empieza la Misa.
 */
import {
  cantoralYaPaso, cantoralWindowEnd, cantoralWindowStart, inicioDeLaMisa,
  HORAS_VIGENTE_TRAS_LA_MISA,
} from '../../src/utils/massType';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const en = (y: number, m: number, d: number, h: number, min = 0) => new Date(y, m - 1, d, h, min);

console.log('\n== El caso reportado: Misa del sábado 5 a las 18:00 ==');
const misa6pm = { date: '2026-09-05', massType: 'dia' as const, massTime: '06:00 PM' };
check('a las 15:00 (cuando antes se borraba) SIGUE a la vista',
  cantoralYaPaso(misa6pm, en(2026, 9, 5, 15, 0)), false);
check('a las 17:52 (cuando el usuario lo notó) SIGUE a la vista',
  cantoralYaPaso(misa6pm, en(2026, 9, 5, 17, 52)), false);
check('durante la Misa, a las 18:30, sigue', cantoralYaPaso(misa6pm, en(2026, 9, 5, 18, 30)), false);
check('a las 21:59 todavía', cantoralYaPaso(misa6pm, en(2026, 9, 5, 21, 59)), false);
check('a las 22:01 ya pasó (4 h después)', cantoralYaPaso(misa6pm, en(2026, 9, 5, 22, 1)), true);

console.log('\n== Son 4 horas, contadas desde el inicio ==');
check('la Misa empieza a las 18:00', inicioDeLaMisa(misa6pm)?.getHours(), 18);
check('la ventana cierra a las 22:00', cantoralWindowEnd(misa6pm).getHours(), 22);
check('la constante dice 4', HORAS_VIGENTE_TRAS_LA_MISA, 4);

console.log('\n== Una Misa de mañana ==');
const misa1030 = { date: '2026-09-06', massType: 'dia' as const, massTime: '10:30 AM' };
check('a las 11:00, durante la Misa, sigue', cantoralYaPaso(misa1030, en(2026, 9, 6, 11, 0)), false);
check('a las 14:29 sigue', cantoralYaPaso(misa1030, en(2026, 9, 6, 14, 29)), false);
check('a las 14:31 ya pasó', cantoralYaPaso(misa1030, en(2026, 9, 6, 14, 31)), true);

console.log('\n== I Vísperas: la Misa es la TARDE ANTERIOR ==');
// El cantoral dice domingo 6, pero se canta el sábado 5 a las 19:00 → cierra el sábado a las 23:00.
const visperas = { date: '2026-09-06', massType: 'visperas_i' as const, massTime: '07:00 PM' };
check('el sábado a las 19:30, durante la Misa, sigue',
  cantoralYaPaso(visperas, en(2026, 9, 5, 19, 30)), false);
check('el sábado a las 22:59 sigue', cantoralYaPaso(visperas, en(2026, 9, 5, 22, 59)), false);
check('el sábado a las 23:01 ya pasó', cantoralYaPaso(visperas, en(2026, 9, 5, 23, 1)), true);
check('cierra el sábado, no el domingo', cantoralWindowEnd(visperas).getDate(), 5);

console.log('\n== Pasada la medianoche ==');
// Una Misa de Nochebuena a las 22:00 tiene que seguir a la vista a las 00:30.
const nochebuena = { date: '2026-12-25', massType: 'visperas_i' as const, massTime: '10:00 PM' };
check('a las 00:30 del 25 sigue a la vista',
  cantoralYaPaso(nochebuena, en(2026, 12, 25, 0, 30)), false);
check('a las 02:01 del 25 ya pasó', cantoralYaPaso(nochebuena, en(2026, 12, 25, 2, 1)), true);
check('la ventana cruza al día siguiente', cantoralWindowEnd(nochebuena).getDate(), 25);

console.log('\n== Sin hora legible no se adivina ==');
// Antes que un cantoral se esfume en mitad de la Misa, se deja hasta el final del día.
const sinHora = { date: '2026-09-05', massType: 'dia' as const };
check('sin hora, no se sabe cuándo empieza', inicioDeLaMisa(sinHora), null);
check('vigente a las 20:00', cantoralYaPaso(sinHora, en(2026, 9, 5, 20, 0)), false);
check('y hasta el final del día', cantoralWindowEnd(sinHora).getHours(), 23);
check('al día siguiente ya no', cantoralYaPaso(sinHora, en(2026, 9, 6, 0, 30)), true);

console.log('\n== Desde el comienzo del día en que se canta ==');
// Quien va a la Misa de las 8 tiene que poder abrir el cantoral al levantarse.
check('empieza a las 00:00', cantoralWindowStart(misa6pm).getHours(), 0);
check('del día en que se canta', cantoralWindowStart(visperas).getDate(), 5);
// OJO con el 6 de septiembre de 2026: en Chile empieza el horario de verano y ese día
// LA MEDIANOCHE NO EXISTE (el reloj salta de 00:00 a 01:00). El comienzo de la ventana
// es la 01:00, el primer instante real de ese día. No es un fallo del cálculo.
check('el día del cambio de hora, el primer instante real', cantoralWindowStart(misa1030).getHours(), 1);
check('y sigue siendo ese mismo día', cantoralWindowStart(misa1030).getDate(), 6);

console.log('\n== El horario de verano ==');
// Se suman horas REALES: contar números de reloj daría 3 o 5 esa noche.
const laNocheDelCambio = { date: '2026-09-06', massType: 'visperas_i' as const, massTime: '11:00 PM' };
const dur = cantoralWindowEnd(laNocheDelCambio).getTime() - inicioDeLaMisa(laNocheDelCambio)!.getTime();
check('son 4 horas exactas', dur / 3600000, 4);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
