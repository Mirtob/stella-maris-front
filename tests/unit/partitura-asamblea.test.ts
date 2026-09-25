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
