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

console.log('\n== La del pueblo: la VOZ PRINCIPAL, sin cifrado ==');
// Orden fijado por el coro el 24-sep-2026: Voz > Organo > Soprano.
const carpeta = `/Partituras/${MISA}`;
check('la Voz le gana al Organo',
  elegido('Gloria', MISA, [f('Gloria organo.pdf', carpeta), f('Gloria voz.pdf', carpeta)]),
  'Gloria voz.pdf');
check('el Organo le gana a la Soprano',
  elegido('Gloria', MISA, [f('Gloria soprano.pdf', carpeta), f('Gloria organo.pdf', carpeta)]),
  'Gloria organo.pdf');
check('la Soprano le gana al Tenor',
  elegido('Santo', MISA, [f('Santo tenor.pdf', carpeta), f('Santo soprano.pdf', carpeta)]),
  'Santo soprano.pdf');
check('las tres juntas: manda la Voz',
  elegido('Santo', MISA, [f('Santo soprano.pdf', carpeta), f('Santo organo.pdf', carpeta),
                          f('Santo voz.pdf', carpeta)]),
  'Santo voz.pdf');
check('una preferida le gana a un nombre neutro',
  elegido('Kyrie', MISA, [f('Kyrie.pdf', carpeta), f('Kyrie organo.pdf', carpeta)]),
  'Kyrie organo.pdf');

console.log('\n== Y se esquiva lo que no es la melodia ==');
check('evita la cifrada aunque venga primero',
  elegido('Santo', MISA, [f('Santo cifrado.pdf', carpeta), f('Santo.pdf', carpeta)]),
  'Santo.pdf');
check('evita el arreglo a cuatro voces',
  elegido('Cordero de Dios', MISA, [f('Cordero SATB.pdf', carpeta), f('Cordero.pdf', carpeta)]),
  'Cordero.pdf');
check('evita la de guitarra',
  elegido('Gloria', MISA, [f('Gloria guitarra.pdf', carpeta), f('Gloria.pdf', carpeta)]),
  'Gloria.pdf');
// "contralto" contiene "alto": con comparacion por substring se habria colado donde no
// corresponde. Se compara por PALABRA.
check('la contralto se esquiva igual que el alto',
  elegido('Santo', MISA, [f('Santo contralto.pdf', carpeta), f('Santo.pdf', carpeta)]),
  'Santo.pdf');
check('los parentesis no rompen el calce',
  elegido('Gloria', MISA, [f('Gloria (tenor).pdf', carpeta), f('Gloria (voz).pdf', carpeta)]),
  'Gloria (voz).pdf');

console.log('\n== Da igual como se aniden las carpetas ==');
// Las tres formas razonables de guardar "la Voz del Gloria de esta Misa". Antes solo
// servia la primera: la parte tenia que estar en el NOMBRE del archivo, asi que
// "Misa X/Gloria/Voz.pdf" —la misma forma que ya se usa para los polifonicos— se
// quedaba sin partitura sin que nada lo dijera.
check('todo en el nombre del archivo',
  elegido('Gloria', MISA, [f('Gloria voz.pdf', carpeta)]), 'Gloria voz.pdf');
check('una carpeta por voz',
  elegido('Gloria', MISA, [f('Gloria.pdf', `${carpeta}/Voz`)]), 'Gloria.pdf');
check('una carpeta por parte',
  elegido('Gloria', MISA, [f('Voz.pdf', `${carpeta}/Gloria`)]), 'Voz.pdf');
check('y con carpeta por parte no se cruzan las partes',
  elegido('Santo', MISA, [f('Voz.pdf', `${carpeta}/Gloria`), f('Voz.pdf', `${carpeta}/Santo`)]),
  'Voz.pdf');
check('con carpeta por parte, la Voz le gana al Tenor',
  elegido('Santo', MISA, [f('Tenor.pdf', `${carpeta}/Santo`), f('Voz.pdf', `${carpeta}/Santo`)]),
  'Voz.pdf');
// Guardar la del tenor dentro de una carpeta "Voz" no la convierte en la melodia.
check('si el archivo dice que no es la melodia, manda el archivo',
  elegido('Gloria', MISA, [f('Gloria tenor.pdf', `${carpeta}/Voz`), f('Gloria.pdf', carpeta)]),
  'Gloria.pdf');
check('la Misa se reconoce en cualquier nivel del camino',
  elegido('Gloria', MISA, [f('Voz.pdf', `/Partituras/${MISA}/Gloria`)]), 'Voz.pdf');
check('y una Misa ajena sigue sin colarse',
  elegido('Gloria', MISA, [f('Voz.pdf', '/Partituras/Misa T. Aragues/Gloria')]), null);

console.log('\n== Pero acertar la Misa pesa mas que el sesgo ==');
// El sesgo desempata DENTRO de la misma calidad de coincidencia; no la atropella.
check('no trae el de otra Misa por decir "voz"',
  elegido('Santo', MISA, [f('Santo voz.pdf', '/Partituras/Misa T. Aragues'),
                          f('Santo tenor.pdf', carpeta)]),
  'Santo tenor.pdf');
check('si solo hay una, esa va aunque sea la cifrada',
  elegido('Gloria', MISA, [f('Gloria acordes.pdf', carpeta)]), 'Gloria acordes.pdf');
check('sin archivos no hay partitura', elegido('Gloria', MISA, []), null);

console.log('\n== Los nombres reales del coro (Misa de M. Manzano) ==');
// Reportado el 25-sep-2026 con estos archivos exactos. Dos cosas los dejaban fuera:
// el nombre no dice "misa" por ningun lado —y se exigia esa palabra, que esta en TODAS
// las Misas y por tanto no discrimina nada—, y el folleto ni siquiera llegaba a buscar
// porque el canto ya traia una partitura vinculada.
const MANZANO = 'Misa M. Manzano';
const suelto = '/Partituras';
check('el Santo, por el nombre del archivo y sin carpeta de Misa',
  elegido('Santo', MANZANO, [f('Santo - Manzano.pdf', suelto), f('Santo - Manzano-Voz.pdf', suelto)]),
  'Santo - Manzano-Voz.pdf');
check('el Cordero de Dios',
  elegido('Cordero de Dios', MANZANO,
          [f('Cordero de Dios - Manzano-SATB.pdf', suelto), f('Cordero de Dios - Manzano-Voz.pdf', suelto)]),
  'Cordero de Dios - Manzano-Voz.pdf');
check('el Señor ten piedad, con ñ y acento',
  elegido('Kyrie', MANZANO,
          [f('Señor ten piedad - Manzano.pdf', suelto), f('Señor ten piedad - Manzano-Voz.pdf', suelto)]),
  'Señor ten piedad - Manzano-Voz.pdf');
check('y el Gloria',
  elegido('Gloria', MANZANO, [f('Gloria - Manzano-Voz.pdf', suelto)]),
  'Gloria - Manzano-Voz.pdf');
check('sigue sin traer la Voz de OTRA Misa',
  elegido('Santo', MANZANO, [f('Santo - Aragues-Voz.pdf', suelto)]), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
