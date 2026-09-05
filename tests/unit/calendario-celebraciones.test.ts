/**
 * Un domingo no se pierde por agregarle una celebración (src/utils/liturgicalCalendar.ts).
 *
 * Reportado el 4-sep-2026: el 26.º Domingo del Tiempo Ordinario es también el Día de
 * Oración por Chile. Al agregar la jornada, el domingo DESAPARECÍA: la celebración
 * agregada se ponía EN LUGAR de la del calendario, no además.
 *
 * Y no era solo el rótulo. El salmo del libro se busca por (ciclo, celebración): con el
 * domingo renombrado, ese domingo se quedaba también sin su salmo. Lo mismo el tiempo
 * litúrgico, los avisos de cercanía y el emparejado con el historial.
 *
 * La regla que fijan estas pruebas: manda la del calendario, la agregada se SUMA; y solo
 * cuando el día no tiene ninguna, la agregada pasa a ser la principal — que es para lo
 * que se creó agregar celebraciones.
 */
import {
  getCelebrationsForDate,
  getLiturgicalDateForDate,
  setPersistedCustomDates,
} from '../../src/utils/liturgicalCalendar';
import { getLiturgicalColorId } from '../../src/utils/liturgicalColors';
import { resolvePsalm } from '../../src/data/psalmIndex';
import { getSundayCycle } from '../../src/utils/liturgicalCycle';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const cel = (n: string, f: string, extra: object = {}) =>
  ({ name: n, date: f, type: 'feast', season: 'Tiempo Ordinario', ...extra } as any);

// El 26.º Domingo del T.O. de 2026 cae el domingo 27 de septiembre (el 26 es sábado).
const domingo = '2026-09-27';
const NOMBRE_DOMINGO = '26.º Domingo del Tiempo Ordinario';

console.log('\n== Punto de partida ==');
setPersistedCustomDates([]);
check('el 27 es el 26.º Domingo del T.O.', getLiturgicalDateForDate(domingo), NOMBRE_DOMINGO);

console.log('\n== El caso reportado: jornada encima de un domingo ==');
setPersistedCustomDates([cel('Día de Oración por Chile', domingo)]);
const c = getCelebrationsForDate(domingo);
check('el domingo sigue siendo el domingo', c.principal, NOMBRE_DOMINGO);
check('y la jornada se celebra además', c.ademas, ['Día de Oración por Chile']);
check('la celebración del día no cambió', getLiturgicalDateForDate(domingo), NOMBRE_DOMINGO);

console.log('\n== Lo que se rompía sin verse: el salmo del libro ==');
// Se busca por (ciclo, celebración). Con el domingo renombrado, no había salmo.
const salmo = resolvePsalm(getSundayCycle(domingo), getLiturgicalDateForDate(domingo));
check('el domingo conserva su salmo', !!salmo, true);
check('con la jornada como clave, no hay salmo (por eso importaba)',
  !!resolvePsalm(getSundayCycle(domingo), 'Día de Oración por Chile'), false);

console.log('\n== Varias celebraciones el mismo día ==');
setPersistedCustomDates([
  cel('Día de Oración por Chile', domingo),
  cel('Aniversario de la parroquia', domingo),
]);
check('todas se suman, en orden', getCelebrationsForDate(domingo).ademas,
  ['Día de Oración por Chile', 'Aniversario de la parroquia']);
check('el domingo sigue mandando', getCelebrationsForDate(domingo).principal, NOMBRE_DOMINGO);

console.log('\n== Sin duplicar ==');
// La caché persistida y la de sesión se solapan justo después de crear una.
setPersistedCustomDates([cel('Día de Oración por Chile', domingo)]);
check('la misma celebración dos veces se nombra una',
  getCelebrationsForDate(domingo, [cel('Día de Oración por Chile', domingo)]).ademas,
  ['Día de Oración por Chile']);
setPersistedCustomDates([]);
check('agregar el propio domingo no lo repite',
  getCelebrationsForDate(domingo, [cel(NOMBRE_DOMINGO, domingo)]).ademas, []);

console.log('\n== Un día sin celebración: la agregada manda (no se rompió) ==');
// Es para lo que existe agregar celebraciones, y tiene que seguir funcionando igual.
const martes = '2026-09-01';
setPersistedCustomDates([cel('Misa de aniversario del coro', martes)]);
check('el martes no tenía nada propio', getCelebrationsForDate(martes).ademas, []);
check('la agregada pasa a ser la principal',
  getLiturgicalDateForDate(martes), 'Misa de aniversario del coro');

console.log('\n== Un día sin nada ==');
setPersistedCustomDates([]);
check('principal vacía', getCelebrationsForDate(martes).principal, '');
check('sin nada además', getCelebrationsForDate(martes).ademas, []);


console.log('\n== Elección del usuario: reemplazar al domingo ==');
// Una fiesta patronal o una solemnidad propia SÍ desplaza al domingo del T.O. No se
// puede deducir del nombre ni del tipo, así que lo marca quien crea la celebración.
setPersistedCustomDates([cel('San Alberto Hurtado, patrono', domingo, { replacesDefault: true })]);
const r = getCelebrationsForDate(domingo);
check('manda la agregada', r.principal, 'San Alberto Hurtado, patrono');
check('y se dice a quién desplazó', r.desplazada, NOMBRE_DOMINGO);
check('el domingo no figura como que se celebra además', r.ademas, []);
check('la celebración del día es la nueva', getLiturgicalDateForDate(domingo), 'San Alberto Hurtado, patrono');
check('y toma el salmo de la nueva, no el del domingo',
  !!resolvePsalm(getSundayCycle(domingo), getLiturgicalDateForDate(domingo)), false);

console.log('\n== Reemplazar y sumar el mismo día ==');
setPersistedCustomDates([
  cel('San Alberto Hurtado, patrono', domingo, { replacesDefault: true }),
  cel('Día de Oración por Chile', domingo),
]);
const r2 = getCelebrationsForDate(domingo);
check('manda la que reemplaza', r2.principal, 'San Alberto Hurtado, patrono');
check('la otra se suma', r2.ademas, ['Día de Oración por Chile']);
check('el domingo desplazado se conserva', r2.desplazada, NOMBRE_DOMINGO);

console.log('\n== Por defecto NO reemplaza ==');
// Es lo que no pierde nada: quien no marque nada, suma.
setPersistedCustomDates([cel('Ordenación diaconal', domingo)]);
check('sigue mandando el domingo', getCelebrationsForDate(domingo).principal, NOMBRE_DOMINGO);
check('sin desplazada', getCelebrationsForDate(domingo).desplazada, undefined);

console.log('\n== Color litúrgico elegido ==');
setPersistedCustomDates([]);
check('un domingo del T.O. es verde', getLiturgicalColorId(domingo), 'green');
// Una ordenación en domingo: se celebra el domingo, pero de rojo.
setPersistedCustomDates([cel('Ordenación diaconal', domingo, { color: 'red' })]);
check('la agregada impone el color', getLiturgicalColorId(domingo), 'red');
check('sin dejar de ser el domingo', getLiturgicalDateForDate(domingo), NOMBRE_DOMINGO);
setPersistedCustomDates([cel('Dedicación del templo', domingo, { replacesDefault: true, color: 'white' })]);
check('la que reemplaza impone su color', getLiturgicalColorId(domingo), 'white');
setPersistedCustomDates([cel('Algo', domingo, { color: 'fucsia' })]);
check('un color desconocido se ignora', getLiturgicalColorId(domingo), 'green');
setPersistedCustomDates([]);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
