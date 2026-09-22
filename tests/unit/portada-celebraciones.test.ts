/**
 * Lo que se celebra ese día, dicho en la portada del folleto
 * (src/utils/celebracionesPortada.ts).
 *
 * HU: si al cantoral se le agrega una celebración —una que se suma al día, o una que
 * REEMPLAZA a la del calendario— eso tiene que salir en la portada del folleto. Hasta
 * ahora la portada traía solo el nombre de la celebración principal: la fiesta patronal
 * no se nombraba, o el domingo desaparecía sin explicación (y un domingo que desaparece
 * se lee como un error de la app).
 *
 * El constructor ya lo decía en pantalla; esto es la misma regla, para el papel.
 */
import { celebracionesDePortada } from '../../src/utils/celebracionesPortada';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const DOMINGO = 'XXVII Domingo del Tiempo Ordinario';
const PATRONAL = 'San Francisco de Asís, patrono de la parroquia';
const JORNADA = 'Jornada Mundial de las Misiones';

console.log('\n== Un domingo normal no agrega nada a la portada ==');
check('nada que decir',
  celebracionesDePortada(DOMINGO, { principal: DOMINGO, ademas: [] }),
  { tambien: [], enLugarDe: undefined });

console.log('\n== Se celebra ADEMÁS ==');
check('la jornada se nombra',
  celebracionesDePortada(DOMINGO, { principal: DOMINGO, ademas: [JORNADA] }),
  { tambien: [JORNADA], enLugarDe: undefined });
check('varias, en orden',
  celebracionesDePortada(DOMINGO, { principal: DOMINGO, ademas: [JORNADA, 'Aniversario de la dedicación'] }),
  { tambien: [JORNADA, 'Aniversario de la dedicación'], enLugarDe: undefined });

console.log('\n== REEMPLAZA a la del día ==');
check('la patronal desplaza al domingo, y se dice cuál',
  celebracionesDePortada(PATRONAL, { principal: PATRONAL, ademas: [], desplazada: DOMINGO }),
  { tambien: [], enLugarDe: DOMINGO });
check('desplaza y además hay otra',
  celebracionesDePortada(PATRONAL, { principal: PATRONAL, ademas: [JORNADA], desplazada: DOMINGO }),
  { tambien: [JORNADA], enLugarDe: DOMINGO });
// Una Misa escrita al vuelo (difuntos, una ordenación) que no está en el calendario:
// el domingo que ocupaba ese día igual hay que nombrarlo.
check('una celebración escrita a mano reemplaza a la del calendario',
  celebracionesDePortada('Misa de difuntos', { principal: DOMINGO, ademas: [] }),
  { tambien: [], enLugarDe: DOMINGO });

console.log('\n== Nada se nombra dos veces ==');
check('la del cantoral no se repite abajo',
  celebracionesDePortada(JORNADA, { principal: DOMINGO, ademas: [JORNADA] }),
  { tambien: [DOMINGO], enLugarDe: undefined });
check('la desplazada no aparece también como "además"',
  celebracionesDePortada(PATRONAL, { principal: PATRONAL, ademas: [DOMINGO], desplazada: DOMINGO }),
  { tambien: [], enLugarDe: DOMINGO });
check('repetida en el calendario, una sola vez',
  celebracionesDePortada(DOMINGO, { principal: DOMINGO, ademas: [JORNADA, JORNADA] }),
  { tambien: [JORNADA], enLugarDe: undefined });

console.log('\n== Bordes ==');
check('espacios de más no crean celebraciones distintas',
  celebracionesDePortada(`  ${DOMINGO} `, { principal: DOMINGO, ademas: ['  '] }),
  { tambien: [], enLugarDe: undefined });
check('sin celebración en el cantoral, se nombra la del calendario',
  celebracionesDePortada('', { principal: DOMINGO, ademas: [] }),
  { tambien: [DOMINGO], enLugarDe: undefined });
check('una fecha sin nada en el calendario',
  celebracionesDePortada('Misa de difuntos', { principal: '', ademas: [] }),
  { tambien: [], enLugarDe: undefined });

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
