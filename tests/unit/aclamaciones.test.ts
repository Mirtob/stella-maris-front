/**
 * Aclamaciones que se agregan junto al Padre Nuestro (src/data/aclamaciones.ts):
 * respuesta a la Oración Universal, aclamación de la consagración y triple Amén.
 *
 * Pedido del 26-sep-2026: su partitura se busca con el MISMO criterio que el Kyrie, el
 * Gloria, el Santo y el Cordero (carpeta de la Misa en Drive; al folleto solo la Voz) y,
 * si no hay, va solo la letra.
 */
import { esLaVoz, esDelPueblo, pickOrdinarySheet, type DriveFile } from '../../src/utils/ordinarySheetMusic';
import { isOrdinary, sortCategoriesByMassOrder } from '../../src/utils/ordinary';
import { ACLAMACIONES } from '../../src/data/aclamaciones';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const f = (name: string, path?: string): DriveFile => ({ id: name, name, path });
const elegido = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files)?.name ?? null;
const paraElFolleto = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files.filter(esLaVoz))?.name ?? null;

const ORACION = 'Respuesta a Oración Universal';
const CONSAGRACION = 'Aclamación Consagración';
const AMEN = 'Amén (Doxología)';
const MANZANO = 'Misa M. Manzano';

console.log('\n== Son partes del ordinario (partitura en folleto y Atril) ==');
for (const a of ACLAMACIONES) check(`${a.category} es ordinario`, isOrdinary({ category: a.category }), true);

console.log('\n== Letra de respaldo, tal como la pidió el coro ==');
const letra = (id: string) => ACLAMACIONES.find(a => a.id === id)?.letra;
check('oración universal', letra('oracion-universal'), 'V/ Roguemos al Señor.\nR/ Señor, escúchanos.');
check('consagración', letra('consagracion'),
  'V/ Este es el misterio de la fe.\nR/ Anunciamos tu muerte, proclamamos tu Resurrección: ¡Ven, Señor Jesús!');
check('triple amén', letra('amen'), 'Amén, Amén, Amén.');

console.log('\n== Orden en la Misa ==');
check('cada una en su lugar',
  sortCategoriesByMassOrder(['Cordero de Dios', AMEN, 'Padre Nuestro', CONSAGRACION, 'Santo', 'Ofertorio', ORACION, 'Credo']),
  ['Credo', ORACION, 'Ofertorio', 'Santo', CONSAGRACION, AMEN, 'Padre Nuestro', 'Cordero de Dios']);

console.log('\n== Se encuentran por su nombre en Drive ==');
check('Señor, escúchanos', elegido(ORACION, undefined, [f('Señor, escúchanos.pdf')]), 'Señor, escúchanos.pdf');
check('Oración universal', elegido(ORACION, undefined, [f('Oracion Universal - Voz.pdf')]), 'Oracion Universal - Voz.pdf');
check('Anunciamos tu muerte', elegido(CONSAGRACION, undefined, [f('Anunciamos tu muerte.pdf')]), 'Anunciamos tu muerte.pdf');
check('Misterio de la fe', elegido(CONSAGRACION, undefined, [f('Este es el misterio de la fe.pdf')]), 'Este es el misterio de la fe.pdf');
check('Triple Amén', elegido(AMEN, undefined, [f('Triple Amén.pdf')]), 'Triple Amén.pdf');
check('Amen a secas', elegido(AMEN, undefined, [f('Amen - Manzano-Voz.pdf')]), 'Amen - Manzano-Voz.pdf');

console.log('\n== Y no se confunden ==');
// "amen" está dentro de «sacramento» y «examen»: sin exigir palabra completa, el Amén
// se quedaba con la partitura de un canto al Santísimo.
check('Sacramento no es un Amén', elegido(AMEN, undefined, [f('Adoro te al Santisimo Sacramento.pdf')]), null);
check('Examen tampoco', elegido(AMEN, undefined, [f('Examen de conciencia.pdf')]), null);
check('el Santo no es la aclamación', elegido(CONSAGRACION, undefined, [f('Santo - Manzano-Voz.pdf')]), null);

console.log('\n== Mismo criterio que el Kyrie y el Santo ==');
const carpeta = [
  f('Amen - Aragues-Voz.pdf', '/P/Misa T. Aragues'),
  f('Amen - Manzano-Hombres.pdf', '/P/Misa M. Manzano'),
  f('Amen - Manzano-Voz.pdf', '/P/Misa M. Manzano'),
];
check('la carpeta de la Misa manda', elegido(AMEN, MANZANO, carpeta.slice(0, 1).concat(carpeta.slice(2))), 'Amen - Manzano-Voz.pdf');
check('al folleto solo la Voz', paraElFolleto(AMEN, MANZANO, carpeta), 'Amen - Manzano-Voz.pdf');
check('sin partitura de esa Misa no inventa (va la letra)',
  elegido(CONSAGRACION, MANZANO, [f('Anunciamos tu muerte-Voz.pdf', '/P/Misa T. Aragues')]), null);
check('la parte puede venir en la carpeta',
  elegido(ORACION, MANZANO, [f('Voz.pdf', '/P/Misa M. Manzano/Oracion universal')]), 'Voz.pdf');

console.log('\n== Carpeta común «Aclamaciones y respuestas» ==');
const comun = [
  f('Señor escúchanos.pdf', '/P/Aclamaciones y respuestas'),
  f('Anunciamos tu muerte.pdf', '/P/Aclamaciones y respuestas'),
  f('Triple Amén - SATB.pdf', '/P/Aclamaciones y respuestas'),
  f('Triple Amén.pdf', '/P/Aclamaciones y respuestas'),
];
const folletoComun = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files.filter(esDelPueblo))?.name ?? null;
check('sin la de la Misa, toma la de la carpeta común', elegido(ORACION, MANZANO, comun), 'Señor escúchanos.pdf');
check('también sin Misa', elegido(CONSAGRACION, undefined, comun), 'Anunciamos tu muerte.pdf');
check('la de la Misa gana a la común',
  elegido(AMEN, MANZANO, [...comun, f('Amen - Manzano-Voz.pdf', '/P/Misa M. Manzano')]), 'Amen - Manzano-Voz.pdf');
check('el Kyrie no cae a la carpeta común',
  elegido('Kyrie', MANZANO, [f('Kyrie.pdf', '/P/Aclamaciones y respuestas')]), null);
check('al folleto va aunque no diga Voz', folletoComun(ORACION, MANZANO, comun), 'Señor escúchanos.pdf');
check('pero no la de otra voz (SATB)', folletoComun(AMEN, MANZANO, comun), 'Triple Amén.pdf');
check('fuera de la carpeta común, sigue exigiendo la Voz',
  folletoComun(AMEN, MANZANO, [f('Amen - Manzano.pdf', '/P/Misa M. Manzano')]), null);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
