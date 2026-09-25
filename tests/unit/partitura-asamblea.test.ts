/**
 * Qué partitura va al folleto del pueblo (src/utils/ordinarySheetMusic.ts).
 *
 * LA REGLA, fijada por el coro el 25-sep-2026: en el folleto va SOLO el archivo que
 * termina en "Voz" — «Santo - Manzano-Voz.pdf» —, que es el que lleva la línea melódica
 * sin cifrado de acordes. Todos los demás («-Hombres», «-Mujeres», «-SATB», «-Tenor»)
 * son del coro y se abren en el Modo Atril. Si no hay archivo de Voz para esa parte, el
 * folleto imprime la LETRA; no se cae a ninguna otra voz ni a la partitura que el canto
 * tenga vinculada, que es la del coro.
 *
 * Es un FILTRO, no una preferencia. Antes se elegía "la mejor disponible" y acababa
 * colándose la de Hombres cuando no había otra.
 */
import { esLaVoz, pickOrdinarySheet, type DriveFile } from '../../src/utils/ordinarySheetMusic';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const f = (name: string, path?: string): DriveFile => ({ id: name, name, path });
/** Lo que hace resolveSheetForFolleto: filtrar por Voz y recién entonces elegir. */
const paraElFolleto = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files.filter(esLaVoz))?.name ?? null;
const elegido = (cat: string, misa: string | undefined, files: DriveFile[]) =>
  pickOrdinarySheet(cat, misa, files)?.name ?? null;

const MANZANO = 'Misa M. Manzano';
const SUELTO = '/Partituras';

console.log('\n== Que archivo ES la Voz ==');
check('termina en Voz', esLaVoz(f('Santo - Manzano-Voz.pdf')), true);
check('con espacios alrededor del guion', esLaVoz(f('Santo - Manzano - Voz.pdf')), true);
check('el archivo llamado solo Voz', esLaVoz(f('Voz.pdf')), true);
check('una carpeta llamada Voz', esLaVoz(f('Gloria.pdf', '/Partituras/Misa X/Voz')), true);

console.log('\n== Y cuales NO ==');
check('Hombres no', esLaVoz(f('Santo - Manzano-Hombres.pdf')), false);
check('Mujeres no', esLaVoz(f('Santo - Manzano-Mujeres.pdf')), false);
check('SATB no', esLaVoz(f('Santo - Manzano-SATB.pdf')), false);
check('Tenor no', esLaVoz(f('Santo - Manzano-Tenor.pdf')), false);
check('sin sufijo tampoco: Voz tiene que decirlo', esLaVoz(f('Santo - Manzano.pdf')), false);
// "Voz" tiene que ser lo ULTIMO. Si sigue algo, ese algo manda.
check('Voz Hombres no es la Voz', esLaVoz(f('Santo - Manzano-Voz Hombres.pdf')), false);
check('Voces (plural) no', esLaVoz(f('Santo - Manzano-Voces.pdf')), false);

console.log('\n== Los nombres reales del coro (Misa de M. Manzano) ==');
const carpetaManzano = [
  f('Santo - Manzano-Voz.pdf', SUELTO),
  f('Santo - Manzano-Hombres.pdf', SUELTO),
  f('Santo - Manzano-Mujeres.pdf', SUELTO),
  f('Cordero de Dios - Manzano-Voz.pdf', SUELTO),
  f('Cordero de Dios - Manzano-Hombres.pdf', SUELTO),
  f('Señor ten piedad - Manzano-Voz.pdf', SUELTO),
  f('Gloria - Manzano-Mujeres.pdf', SUELTO),
];
check('el Santo trae la Voz, no la de Hombres',
  paraElFolleto('Santo', MANZANO, carpetaManzano), 'Santo - Manzano-Voz.pdf');
check('el Cordero de Dios igual',
  paraElFolleto('Cordero de Dios', MANZANO, carpetaManzano), 'Cordero de Dios - Manzano-Voz.pdf');
check('el Señor ten piedad, con ñ y acento',
  paraElFolleto('Kyrie', MANZANO, carpetaManzano), 'Señor ten piedad - Manzano-Voz.pdf');
// El Gloria solo tiene la de Mujeres: al folleto no va NADA, va la letra.
check('el Gloria, que solo tiene Mujeres, no trae partitura',
  paraElFolleto('Gloria', MANZANO, carpetaManzano), null);

console.log('\n== El Drive real de Manzano, en el orden que lo devuelve Drive ==');
// Reportado el 25-sep-2026: el Santo salia con letra y el Kyrie y el Cordero bien, con
// los tres archivos presentes. La causa no era el nombre sino el TIPO: cada carpeta trae
// el mp3 de ensayo de cada voz, y «Santo - Manzano-Voz.mp3» se llama igual que el PDF
// salvo la extension. Empataban en puntaje y ganaba el que Drive devolviera primero. En
// la carpeta del Santo los mp3 venian antes; en las otras dos, el PDF. Funcionaba de
// casualidad.
const dir = (parte: string) => `Misas/Misa M. Manzano/${parte} - M. Manzano`;
// Orden textual del listado de produccion: mp3 ANTES que pdf.
const santoReal = [
  f('Santo.mscz', dir('Santo')),
  f('Santo - Manzano-Hombres.mp3', dir('Santo')),
  f('Santo - Manzano-Mujeres.mp3', dir('Santo')),
  f('Santo - Manzano-Voz.mp3', dir('Santo')),
  f('Santo - Manzano.mp3', dir('Santo')),
  f('Santo - Manzano-Hombres.pdf', dir('Santo')),
  f('Santo - Manzano-Mujeres.pdf', dir('Santo')),
  f('Santo - Manzano-Voz.pdf', dir('Santo')),
  f('Santo - Manzano.pdf', dir('Santo')),
];
check('REGRESION: el Santo trae el PDF, no el mp3 que se llama igual',
  paraElFolleto('Santo', MANZANO, santoReal), 'Santo - Manzano-Voz.pdf');
check('y el .mscz de MuseScore tampoco se cuela',
  paraElFolleto('Santo', MANZANO, [f('Santo.mscz', dir('Santo')), f('Santo - Manzano-Voz.pdf', dir('Santo'))]),
  'Santo - Manzano-Voz.pdf');
// El Kyrie y el Cordero, que ya funcionaban, siguen funcionando.
check('el Señor ten piedad sigue bien',
  paraElFolleto('Kyrie', MANZANO, [
    f('Señor, ten piedad.mscz', dir('Señor, ten piedad')),
    f('Señor, ten piedad - Manzano-Voz.pdf', dir('Señor, ten piedad')),
    f('Señor, ten piedad - Manzano.pdf', dir('Señor, ten piedad')),
    f('Señor, ten piedad - Manzano-Voz.mp3', dir('Señor, ten piedad')),
  ]),
  'Señor, ten piedad - Manzano-Voz.pdf');
check('el Cordero de Dios tambien',
  paraElFolleto('Cordero de Dios', MANZANO, [
    f('Cordero de Dios - Manzano-Voz.pdf', dir('Cordero de Dios')),
    f('Cordero de Dios - Manzano-Voz.mp3', dir('Cordero de Dios')),
  ]),
  'Cordero de Dios - Manzano-Voz.pdf');
// El selector del coro sufria lo mismo: podia enlazarle un audio al Modo Atril.
check('y el selector general tampoco entrega audios',
  elegido('Santo', MANZANO, santoReal.filter((x) => !/-Voz\./.test(x.name)))?.endsWith('.pdf'),
  true);

console.log('\n== Sin archivo de Voz: letra, nunca otra voz ==');
check('aunque exista la partitura completa',
  paraElFolleto('Santo', MANZANO, [f('Santo - Manzano.pdf', SUELTO)]), null);
check('aunque exista la de organo',
  paraElFolleto('Santo', MANZANO, [f('Santo - Manzano-Organo.pdf', SUELTO)]), null);
check('aunque exista la soprano',
  paraElFolleto('Santo', MANZANO, [f('Santo - Manzano-Soprano.pdf', SUELTO)]), null);
check('el banco vacio no rompe nada', paraElFolleto('Santo', MANZANO, []), null);

console.log('\n== Y sigue sin cruzarse de Misa ==');
check('no trae la Voz de otra Misa',
  paraElFolleto('Santo', MANZANO, [f('Santo - Aragues-Voz.pdf', SUELTO)]), null);
check('con varias Misas, la suya',
  paraElFolleto('Santo', MANZANO,
    [f('Santo - Aragues-Voz.pdf', SUELTO), f('Santo - Manzano-Voz.pdf', SUELTO)]),
  'Santo - Manzano-Voz.pdf');
// "misa" esta en el nombre de TODAS, asi que no cuenta para el calce: exigirla dejaba
// fuera «Santo - Manzano-Voz.pdf», que no la dice por ningun lado.
check('la palabra "misa" no se exige',
  paraElFolleto('Santo', 'Misa M. Manzano', [f('Santo - Manzano-Voz.pdf', SUELTO)]),
  'Santo - Manzano-Voz.pdf');

console.log('\n== La Misa de Nebreda, con el Drive real ==');
// Reportado el 25-sep-2026. En el catalogo la misma Misa esta escrita de tres formas
// —"Nebreda", "Nebreda (Do mayor)", "Nebreda (Do Mayor)"— y en Drive la carpeta se llama
// "Misa Nebreda" a secas. Al partir el nombre en palabras quedaban los tokens
// ['nebreda','(do','mayor)'] CON LOS PARENTESIS PEGADOS, que no estan en ningun lado, y
// el Kyrie se rechazaba de plano aunque su partitura estuviera ahi.
const kyrieNebreda = 'Misas/Misa Nebreda/Señor, ten piedad - Nebreda';
const gloriaNebreda = 'Misas/Misa Nebreda/Gloria -Nebreda';
const nebreda = [
  f('Señor, ten piedad - Nebreda-Voz.mp3', kyrieNebreda),
  f('Señor, ten piedad - Nebreda-Soprano.pdf', kyrieNebreda),
  f('Señor, ten piedad - Nebreda-Voz.pdf', kyrieNebreda),
  f('Señor, ten piedad - Nebreda.pdf', kyrieNebreda),
  f('Gloria -Nebreda-Voz.pdf', gloriaNebreda),
  f('Gloria -Nebreda-Soprano.pdf', gloriaNebreda),
  f('Gloria -Nebreda-Voz.mp3', gloriaNebreda),
  f('Santo - Nebreda.pdf', 'Misas/Misa Nebreda'),
  f('Cordero de Dios - Nebreda.pdf', 'Misas/Misa Nebreda'),
];
check('REGRESION: el Kyrie con "(Do mayor)" en el nombre de la Misa',
  paraElFolleto('Kyrie', 'Nebreda (Do mayor)', nebreda), 'Señor, ten piedad - Nebreda-Voz.pdf');
check('y con la otra grafia, "(Do Mayor)"',
  paraElFolleto('Cordero de Dios', 'Nebreda (Do Mayor)',
    [...nebreda, f('Cordero de Dios - Nebreda-Voz.pdf', 'Misas/Misa Nebreda')]),
  'Cordero de Dios - Nebreda-Voz.pdf');
check('el Gloria, que se escribe "Nebreda" a secas',
  paraElFolleto('Gloria', 'Nebreda', nebreda), 'Gloria -Nebreda-Voz.pdf');
// Santo y Cordero de Nebreda no tienen archivo -Voz: va la letra, no la version completa.
check('el Santo de Nebreda, sin -Voz, no trae partitura',
  paraElFolleto('Santo', 'Nebreda (Do mayor)', nebreda), null);
// La coma de "Señor, ten piedad" ya no depende del sinonimo corto para salvarse.
check('la coma del nombre no rompe el sinonimo largo',
  paraElFolleto('Kyrie', 'Nebreda', [f('Señor, ten piedad - Nebreda-Voz.pdf', kyrieNebreda)]),
  'Señor, ten piedad - Nebreda-Voz.pdf');
// El parentesis no decide, pero desempata si dos variantes conviven.
check('entre dos variantes, el matiz del parentesis desempata',
  paraElFolleto('Gloria', 'Nebreda (Fa mayor)', [
    f('Gloria - Nebreda-Voz.pdf', 'Misas/Misa Nebreda Do mayor'),
    f('Gloria - Nebreda-Voz.pdf', 'Misas/Misa Nebreda Fa mayor'),
  ].map((x, i) => ({ ...x, id: `v${i}` })))!,
  'Gloria - Nebreda-Voz.pdf');

console.log('\n== El selector general (el del coro) sigue como estaba ==');
// Este alimenta la partitura del Atril, que SI es la completa: no se le puso sesgo.
check('encuentra la parte por el nombre',
  elegido('Santo', undefined, [f('Santo.pdf'), f('Gloria.pdf')]), 'Santo.pdf');
check('la carpeta de la Misa manda',
  elegido('Santo', MANZANO, [f('Santo.pdf', '/P/Misa T. Aragues'), f('Santo.pdf', '/P/Misa M. Manzano')]),
  'Santo.pdf');
check('sin coincidencia de Misa, no inventa',
  elegido('Santo', MANZANO, [f('Santo.pdf', '/P/Misa T. Aragues')]), null);
check('reconoce los sinonimos en español',
  elegido('Kyrie', undefined, [f('Senor ten piedad.pdf')]), 'Senor ten piedad.pdf');
check('y el Cordero por Agnus', elegido('Cordero de Dios', undefined, [f('Agnus Dei.pdf')]), 'Agnus Dei.pdf');
check('la parte puede venir en la carpeta',
  elegido('Gloria', MANZANO, [f('Voz.pdf', '/P/Misa M. Manzano/Gloria')]), 'Voz.pdf');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
