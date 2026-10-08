/**
 * Nombre de la feria (src/utils/feria.ts).
 *
 * 8-oct-2026: un cantoral de jueves terminó publicado en el domingo siguiente porque el
 * menú exigía una celebración y el día no tenía. Un día de semana tiene su nombre propio.
 */
import { nombreDeFeria, nombreDelDia } from '../../src/utils/feria';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Tiempo Ordinario ==');
check('el caso reportado: jueves 8 de octubre de 2026', nombreDeFeria('2026-10-08'), 'Jueves de la 27.ª semana del Tiempo Ordinario');
check('lunes tras el Bautismo = 1.ª semana', nombreDeFeria('2026-01-12'), 'Lunes de la 1.ª semana del Tiempo Ordinario');
check('lunes tras Pentecostés (2026) = 8.ª semana', nombreDeFeria('2026-05-25'), 'Lunes de la 8.ª semana del Tiempo Ordinario');
check('la semana sigue aunque el domingo sea Todos los Santos', nombreDeFeria('2026-11-03'), 'Martes de la 31.ª semana del Tiempo Ordinario');
check('después de Cristo Rey = 34.ª', nombreDeFeria('2026-11-27'), 'Viernes de la 34.ª semana del Tiempo Ordinario');

console.log('\n== Tiempos fuertes ==');
check('Adviento', nombreDeFeria('2026-12-03'), 'Jueves de la 1.ª semana de Adviento');
check('Navidad', nombreDeFeria('2026-12-28'), 'Lunes del Tiempo de Navidad');
check('Ceniza', nombreDeFeria('2026-02-18'), 'Miércoles de Ceniza');
check('después de Ceniza', nombreDeFeria('2026-02-19'), 'Jueves después de Ceniza');
check('Cuaresma', nombreDeFeria('2026-03-05'), 'Jueves de la 2.ª semana de Cuaresma');
check('Semana Santa', nombreDeFeria('2026-03-30'), 'Lunes Santo');
check('Octava de Pascua', nombreDeFeria('2026-04-09'), 'Jueves de la Octava de Pascua');
check('Tiempo Pascual', nombreDeFeria('2026-04-16'), 'Jueves de la 2.ª semana de Pascua');

console.log('\n== Domingos y celebraciones ==');
check('un domingo no es feria', nombreDeFeria('2026-10-11'), '');
check('el domingo se publica con su nombre del calendario', nombreDelDia('2026-10-04'), '27.º Domingo del Tiempo Ordinario');
check('un día de semana nunca queda sin nombre', nombreDelDia('2026-10-08') !== '', true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
