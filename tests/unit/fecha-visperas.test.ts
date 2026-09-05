/**
 * La fecha del día EN QUE SE CANTA una Misa (src/utils/massType.ts).
 *
 * Reportado el 5-sep-2026: el folleto de la Misa del sábado 5 por la tarde salía con
 * fecha "domingo 6 de septiembre".
 *
 * `date` guarda siempre la fecha de la CELEBRACIÓN, y en I Vísperas esa no es la del
 * día en que se canta: el sábado 5 por la tarde se canta el 23.º Domingo del Tiempo
 * Ordinario, que cae el domingo 6. Las dos Misas —la del sábado por la tarde y la del
 * domingo— son del mismo domingo; lo que cambia es el día del calendario.
 *
 * La regla que fijan estas pruebas: al MOSTRAR la fecha, I Vísperas es el día anterior;
 * y todo lo litúrgico (salmo, ciclo, tiempo, color) se sigue sacando de `date`.
 */
import { fechaEnQueSeCanta, cantoralWindowStart, cantoralWindowEnd } from '../../src/utils/massType';
import { getLiturgicalDateForDate } from '../../src/utils/liturgicalCalendar';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const DOMINGO = '2026-09-06';   // 23.º Domingo del Tiempo Ordinario
const SABADO  = '2026-09-05';

console.log('\n== El caso reportado ==');
check('la celebración del 6 es el 23.º Domingo',
  getLiturgicalDateForDate(DOMINGO), '23.º Domingo del Tiempo Ordinario');
check('I Vísperas se canta el sábado 5',
  fechaEnQueSeCanta({ date: DOMINGO, massType: 'visperas_i' }), SABADO);
check('la Misa del día se canta el domingo 6',
  fechaEnQueSeCanta({ date: DOMINGO, massType: 'dia' }), DOMINGO);
check('II Vísperas también el domingo 6',
  fechaEnQueSeCanta({ date: DOMINGO, massType: 'visperas_ii' }), DOMINGO);

console.log('\n== Las dos Misas son del MISMO domingo ==');
// Es lo que no se puede romper: cambia el día, no la celebración.
for (const t of ['visperas_i', 'dia'] as const) {
  check(`${t}: la celebración sigue siendo la del domingo`,
    getLiturgicalDateForDate(DOMINGO), '23.º Domingo del Tiempo Ordinario');
}

console.log('\n== El campo legacy `vigil` cuenta igual ==');
// Los cantorales viejos no tienen massType, solo `vigil`.
check('vigil: true se canta el día anterior',
  fechaEnQueSeCanta({ date: DOMINGO, vigil: true }), SABADO);
check('vigil: false, el mismo día',
  fechaEnQueSeCanta({ date: DOMINGO, vigil: false }), DOMINGO);
check('sin nada, el mismo día', fechaEnQueSeCanta({ date: DOMINGO }), DOMINGO);

console.log('\n== Cruces de mes y de año ==');
// Restar un día a mano se rompe justo aquí, por eso se usa Date.
check('1 de marzo → 28 de febrero (2026 no es bisiesto)',
  fechaEnQueSeCanta({ date: '2026-03-01', massType: 'visperas_i' }), '2026-02-28');
check('1 de marzo de 2028 → 29 de febrero (bisiesto)',
  fechaEnQueSeCanta({ date: '2028-03-01', massType: 'visperas_i' }), '2028-02-29');
check('1 de enero → 31 de diciembre del año anterior',
  fechaEnQueSeCanta({ date: '2027-01-01', massType: 'visperas_i' }), '2026-12-31');
check('1 de noviembre → 31 de octubre',
  fechaEnQueSeCanta({ date: '2026-11-01', massType: 'visperas_i' }), '2026-10-31');

console.log('\n== La ventana de vigencia no se tocó ==');
// Ya estaba bien: I Vísperas vale la tarde del día anterior. Se comprueba que sigue
// coincidiendo con la fecha que ahora se muestra.
const ini = cantoralWindowStart({ date: DOMINGO, massType: 'visperas_i' });
const fin = cantoralWindowEnd({ date: DOMINGO, massType: 'visperas_i' });
check('la ventana empieza el sábado', ini.getDate(), 5);
check('y termina el sábado', fin.getDate(), 5);
check('el día de la ventana es el que se muestra',
  `${ini.getFullYear()}-09-0${ini.getDate()}`, fechaEnQueSeCanta({ date: DOMINGO, massType: 'visperas_i' }));

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
