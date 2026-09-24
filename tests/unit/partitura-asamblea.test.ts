/**
 * Qué partitura del ordinario va al folleto (src/utils/ordinarySheetMusic.ts).
 *
 * HU del 24-sep-2026: las partes fijas de la Misa —Kyrie, Gloria, Santo, Cordero,
 * Padre Nuestro— tienen que salir en el folleto CON PARTITURA aunque estén en español.
 * Y cuando la carpeta de la Misa trae varias, la que va al pueblo es la de la línea
 * melódica principal, SIN cifrado de acordes: el fiel canta la melodía, y los acordes
 * son del que acompaña (solo perfil Coro y Modo Atril).
 *
 * Lo que NO se negocia: el desempate por asamblea pesa menos que acertar la Misa. Traer
 * el Santo de otra Misa porque su archivo dice "pueblo" sería peor que traer el del
 * tenor de la Misa correcta.
 */
import { pickOrdinarySheet, type DriveFile } from '../../src/utils/ordinarySheetMusic';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const MISA = 'Reunidos en su nombre';
const f = (name: string, path?: string): DriveFile => ({ id: name, name, path });
const elegido = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files)?.name ?? null;

console.log('\n== Lo de siempre sigue igual ==');
check('encuentra la parte por el nombre del archivo',
  elegido('Santo', undefined, [f('Santo.pdf'), f('Gloria.pdf')]), 'Santo.pdf');
check('la carpeta de la Misa manda sobre el nombre suelto',
  elegido('Santo', MISA, [f('Santo.pdf', '/Partituras/Misa T. Aragues'),
                          f('Santo.pdf', `/Partituras/${MISA}`)]),
  'Santo.pdf');
check('sin coincidencia de Misa, no inventa',
  elegido('Santo', MISA, [f('Santo.pdf', '/Partituras/Misa T. Aragues')]), null);
check('reconoce los sinonimos en español',
  elegido('Kyrie', undefined, [f('Senor ten piedad.pdf')]), 'Senor ten piedad.pdf');
check('y el Cordero por Agnus',
  elegido('Cordero de Dios', undefined, [f('Agnus Dei.pdf')]), 'Agnus Dei.pdf');

console.log('\n== La del pueblo: melodia, sin cifrado ==');
const carpeta = `/Partituras/${MISA}`;
check('prefiere la de melodia sobre la de acordes',
  elegido('Gloria', MISA, [f('Gloria acordes.pdf', carpeta), f('Gloria melodia.pdf', carpeta)]),
  'Gloria melodia.pdf');
check('prefiere la del pueblo sobre la del tenor',
  elegido('Santo', MISA, [f('Santo tenor.pdf', carpeta), f('Santo pueblo.pdf', carpeta)]),
  'Santo pueblo.pdf');
check('evita la cifrada aunque venga primero',
  elegido('Santo', MISA, [f('Santo cifrado.pdf', carpeta), f('Santo.pdf', carpeta)]),
  'Santo.pdf');
check('evita el arreglo a cuatro voces',
  elegido('Cordero de Dios', MISA, [f('Cordero SATB.pdf', carpeta), f('Cordero.pdf', carpeta)]),
  'Cordero.pdf');
check('evita la reduccion de organo',
  elegido('Kyrie', MISA, [f('Kyrie organo.pdf', carpeta), f('Kyrie.pdf', carpeta)]),
  'Kyrie.pdf');
check('la de asamblea le gana a la neutra',
  elegido('Gloria', MISA, [f('Gloria.pdf', carpeta), f('Gloria asamblea.pdf', carpeta)]),
  'Gloria asamblea.pdf');

console.log('\n== Pero acertar la Misa pesa mas que el sesgo ==');
// El sesgo desempata DENTRO de la misma calidad de coincidencia; no la atropella.
check('no trae el de otra Misa por decir "pueblo"',
  elegido('Santo', MISA, [f('Santo pueblo.pdf', '/Partituras/Misa T. Aragues'),
                          f('Santo tenor.pdf', carpeta)]),
  'Santo tenor.pdf');
check('si solo hay una, esa va aunque sea la cifrada',
  elegido('Gloria', MISA, [f('Gloria acordes.pdf', carpeta)]), 'Gloria acordes.pdf');
check('sin archivos no hay partitura', elegido('Gloria', MISA, []), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
