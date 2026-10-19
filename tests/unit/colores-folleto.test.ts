/**
 * Colores del folleto (utils/coloresFolleto).
 *
 * Mandan los de la CELEBRACIÓN, no los del tiempo litúrgico. Reportado el 19-oct-2026:
 * Todos los Santos (solemnidad, blanco) salía con cenefas y líneas verdes porque cae en
 * el Tiempo Ordinario. El blanco se imprime en dorado: blanco sobre papel no se ve.
 */
import { coloresDelFolleto } from '../../src/utils/coloresFolleto';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    esperado: ${JSON.stringify(expected)}\n    obtenido: ${JSON.stringify(actual)}`}`);
}

const VERDE = [21, 128, 61];
const DORADO = [180, 130, 32];

check('Todos los Santos va en dorado', coloresDelFolleto('2026-11-01').primary, DORADO);
check('pero el tiempo sigue siendo el Ordinario',
  coloresDelFolleto('2026-11-01').seasonName, 'Tiempo Ordinario');
check('un domingo del Tiempo Ordinario sigue verde', coloresDelFolleto('2026-10-18').primary, VERDE);
check('Cristo Rey (solemnidad) también en dorado', coloresDelFolleto('2026-11-22').primary, DORADO);
check('Pentecostés en rojo', coloresDelFolleto('2026-05-24').primary, [185, 28, 28]);
check('Adviento en morado', coloresDelFolleto('2026-11-29').primary, [91, 33, 182]);
check('Navidad en dorado', coloresDelFolleto('2026-12-25').primary, DORADO);

console.log(`\n${pass} ok, ${fail} con error`);
if (fail > 0) process.exit(1);
