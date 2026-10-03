/**
 * Celebraciones personalizadas: solo las de la parroquia ACTIVA (src/utils/parish.ts).
 *
 * Reporte del 3-oct-2026: un coro de Pintue y Pirque abrió el constructor como Pintue y
 * le salió el «Aniversario de la Capilla de Adoración perpetua», guardado solo para
 * Pirque. La celebración estaba bien guardada; la app juntaba las de todas las
 * parroquias del perfil.
 */
import { ambitosDeCelebraciones } from '../../src/utils/parish';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const PINTUE = 'Parroquia San Juan (Pintue) - Diócesis de San Bernardo';
const PIRQUE = 'Parroquia Santisímo Sacramento (Pirque) - Diócesis de San Bernardo';
const CAPILLA = `${PIRQUE} · San José`;

console.log('\n== Se ve solo lo de la unidad activa ==');
check('como Pintue no se ve Pirque', ambitosDeCelebraciones(PINTUE, [PINTUE, PIRQUE]), [PINTUE]);
check('como Pirque no se ve Pintue', ambitosDeCelebraciones(PIRQUE, [PINTUE, PIRQUE]), [PIRQUE]);
check('de visita, se ve lo de la parroquia visitada', ambitosDeCelebraciones(PIRQUE, [PINTUE]), [PIRQUE]);

console.log('\n== Capillas ==');
check('una capilla ve lo suyo y lo de su parroquia', ambitosDeCelebraciones(CAPILLA, [PIRQUE]), [CAPILLA, PIRQUE]);
check('la parroquia no ve lo de sus capillas', ambitosDeCelebraciones(PIRQUE, [PIRQUE, CAPILLA]), [PIRQUE]);

console.log('\n== Sin unidad activa (Admin en su panel) ==');
check('se ven todas las del perfil, sin repetir', ambitosDeCelebraciones(undefined, [PINTUE, PIRQUE, PINTUE]), [PINTUE, PIRQUE]);
check('sin nada, nada (quedan solo las globales)', ambitosDeCelebraciones('', []), []);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
