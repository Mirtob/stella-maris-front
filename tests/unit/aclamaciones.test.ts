/**
 * Aclamaciones que se agregan junto al Padre Nuestro (src/data/aclamaciones.ts):
 * respuesta a la Oración Universal, aclamación de la consagración y triple Amén.
 *
 * Pedido del 26-sep-2026: su partitura se busca con el MISMO criterio que el Kyrie, el
 * Gloria, el Santo y el Cordero (carpeta de la Misa en Drive; al folleto solo la Voz) y,
 * si no hay, va solo la letra.
 */
import { esLaVoz, pickOrdinarySheet, elegirParaElFolleto, type DriveFile } from '../../src/utils/ordinarySheetMusic';
import type { Song } from '../../src/types';
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

console.log('\n== Carpeta «Aclamaciones» del Drive (nombres reales, 26-sep-2026) ==');
const A = '/Partituras/Aclamaciones';
const drive = [
  f('Triple amen voces-Voz.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces-Bajo.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces-Soprano.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces-Voz.mp3', `${A}/Triple amen voces`),
  f('Oración universal-Voz_2.pdf', `${A}/Roguemos al Señor`),
  f('Oración universal-Voz_1.pdf', `${A}/Roguemos al Señor`),
  f('Oración universal.pdf', `${A}/Roguemos al Señor`),
  f('Anunciaremos tu Reino-Tenor.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciaremos tu Reino.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciamos tu muerte-Voz_2.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciamos tu muerte.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciamos tu muerte-Voz.pdf', `${A}/Anunciamos tu muerte`),
  f('Alabado sea el Santísimo sacramento del altar.pdf', '/Partituras/Comunion/Alabado sea el santísimo'),
];
check('Voz 1 es la Voz', esLaVoz(f('Oración universal-Voz_1.pdf')), true);
check('Voz 2 no', esLaVoz(f('Oración universal-Voz_2.pdf')), false);
check('folleto: Amén → la Voz', paraElFolleto(AMEN, MANZANO, drive), 'Triple amen voces-Voz.pdf');
check('folleto: Oración universal → la Voz 1', paraElFolleto(ORACION, MANZANO, drive), 'Oración universal-Voz_1.pdf');
check('folleto: Consagración → la Voz, no la Voz 2', paraElFolleto(CONSAGRACION, MANZANO, drive), 'Anunciamos tu muerte-Voz.pdf');
check('también sin Misa', paraElFolleto(CONSAGRACION, undefined, drive), 'Anunciamos tu muerte-Voz.pdf');
check('tarjeta: nunca «Anunciaremos tu Reino»', /Anunciamos/.test(elegido(CONSAGRACION, MANZANO, drive) ?? ''), true);
check('tarjeta: nunca el MP3', /\.pdf$/.test(elegido(AMEN, MANZANO, drive) ?? ''), true);
check('el Santísimo Sacramento no es un Amén',
  elegido(AMEN, undefined, drive.filter(x => /Alabado/.test(x.name))), null);
check('la de la Misa gana a la común',
  paraElFolleto(AMEN, MANZANO, [...drive, f('Amen - Manzano-Voz.pdf', '/P/Misa M. Manzano')]), 'Amen - Manzano-Voz.pdf');
check('el Kyrie no cae a la carpeta común',
  elegido('Kyrie', MANZANO, [f('Kyrie-Voz.pdf', A)]), null);

console.log('\n== Padre Nuestro: cada idioma su partitura ==');
const PN = '/Partituras/Padre Nuestro';
const padre = [
  f('Pater noster.pdf', PN),
  f('Pater noster-Voz.pdf', PN),
  f('Padre nuestro-Voz_2.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro-Voz.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro, recibid.pdf', '/Partituras/Ofertorio'),
].filter(esLaVoz);
const pn = (o: Partial<Song>) =>
  elegirParaElFolleto({ id: 'padre-nuestro-es-1', title: 'Padre Nuestro', category: 'Padre Nuestro', ...o } as Song, padre)?.name ?? null;
const LATIN = { id: 'padre-nuestro-la-1', title: 'Padre Nuestro (Gregoriano)', author: 'Pater noster (latín)' };
check('español → Padre nuestro-Voz', pn({}), 'Padre nuestro-Voz.pdf');
check('gregoriano → Pater noster, nunca el español', pn(LATIN), 'Pater noster-Voz.pdf');
check('gregoriano sin su Voz → nada (va la letra), no el español',
  elegirParaElFolleto({ ...LATIN, category: 'Padre Nuestro' } as Song, padre.filter(x => !/Pater/.test(x.name)))?.name ?? null, null);
check('con Misa sin Padre Nuestro propio, toma el de su carpeta', pn({ massName: MANZANO }), 'Padre nuestro-Voz.pdf');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
