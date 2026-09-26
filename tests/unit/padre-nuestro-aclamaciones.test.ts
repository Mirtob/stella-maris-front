/**
 * Padre Nuestro y aclamaciones: de dónde sale cada partitura y quién ve cuál.
 * (src/utils/padreNuestroYAclamaciones.ts, src/utils/atrilModo.ts)
 *
 * Reportado el 26-sep-2026: "está enredado el CRUD del Padre Nuestro". La regla que
 * fijó el coro:
 *  · Gregoriano → «Padre Nuestro/Pater noster.pdf» (tetragrama, un solo PDF).
 *  · Español    → «Padre Nuestro/Padre Nuestro/Padre nuestro-Voz.pdf» (pentagrama).
 *  · Cada parte nueva se ve según el perfil en el Modo Atril y en el folleto.
 *
 * Los nombres de archivo son los del Drive real de ese día.
 */
import {
  construirPadreNuestro, construirAclamacion, idiomaEnElCantoral, aclamacionesEnElCantoral,
  esPadreNuestroDelCantoral,
} from '../../src/utils/padreNuestroYAclamaciones';
import { elegirParaElFolleto, type DriveFile } from '../../src/utils/ordinarySheetMusic';
import { modoDelAtril, partituraDelAtril } from '../../src/utils/atrilModo';
import { ACLAMACIONES } from '../../src/data/aclamaciones';
import type { Song } from '../../src/types';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const f = (name: string, path: string): DriveFile => ({ id: name, name, path });
const PN = 'Padre Nuestro';
const A = 'Aclamaciones';
const drive: DriveFile[] = [
  f('Pater noster.pdf', PN),
  f('Padre nuestro-Voz_2.mp3', `${PN}/Padre Nuestro`),
  f('Padre nuestro-Voz_2.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro-Voz.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro.pdf', `${PN}/Padre Nuestro`),
  f('Padre nuestro.mscz', `${PN}/Padre Nuestro`),
  // El canto de Ofertorio que antes se colaba como Padre Nuestro en español.
  f('Padre nuestro, recibid.pdf', 'Ofertorio'),
  f('Oración universal-Voz_2.pdf', `${A}/Roguemos al Señor`),
  f('Oración universal-Voz_1.pdf', `${A}/Roguemos al Señor`),
  f('Oración universal.pdf', `${A}/Roguemos al Señor`),
  f('Anunciamos tu muerte.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciamos tu muerte-Voz.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciamos tu muerte-Voz_2.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciaremos tu Reino.pdf', `${A}/Anunciamos tu muerte`),
  f('Anunciaremos tu Reino-Bajo.pdf', `${A}/Anunciamos tu muerte`),
  f('Triple amen voces-Voz.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces-Bajo.pdf', `${A}/Triple amen voces`),
  f('Triple amen voces.pdf', `${A}/Triple amen voces`),
];
const idDe = (url?: string) => url?.match(/\/d\/([^/]+)\//)?.[1] ?? null;

console.log('\n== Padre Nuestro gregoriano ==');
const la = construirPadreNuestro('la', drive);
check('partitura: el Pater noster en tetragrama', idDe(la.sheetMusicUrl), 'Pater noster.pdf');
check('sin voces (es un solo PDF)', la.sheets, []);
check('letra de respaldo en latín', /^Pater noster/.test(la.lyrics ?? ''), true);
check('el folleto lleva el Pater noster aunque no diga Voz', elegirParaElFolleto(la, drive)?.name, 'Pater noster.pdf');

console.log('\n== Padre Nuestro en español ==');
const es = construirPadreNuestro('es', drive);
check('partitura: la que termina en Voz', idDe(es.sheetMusicUrl), 'Padre nuestro-Voz.pdf');
check('nunca el «Padre nuestro, recibid» del Ofertorio', /recibid/.test(es.sheetMusicUrl ?? ''), false);
check('trae las voces de su carpeta (sin el MP3)', es.sheets?.map(s => s.fileName).sort(),
  ['Padre nuestro-Voz.pdf', 'Padre nuestro-Voz_2.pdf', 'Padre nuestro.pdf']);
check('letra de respaldo en español', /^Padre nuestro, que estás/.test(es.lyrics ?? ''), true);
check('el folleto lleva la Voz', elegirParaElFolleto(es, drive)?.name, 'Padre nuestro-Voz.pdf');
check('sin su Voz, el español NO toma el Pater noster (va la letra)',
  elegirParaElFolleto(es, drive.filter(x => x.name !== 'Padre nuestro-Voz.pdf')) ?? null, null);

console.log('\n== Lo que el cantoral ya trae ==');
check('idioma: ninguno', idiomaEnElCantoral([]), null);
check('idioma: español', idiomaEnElCantoral([es]), 'es');
check('idioma: gregoriano', idiomaEnElCantoral([la]), 'la');
check('el tono del Kyriale no cuenta como el del Drive',
  esPadreNuestroDelCantoral({ id: 'kyriale-pater-2026-09-27', category: 'Padre Nuestro' }), false);

console.log('\n== Aclamaciones ==');
const [oracion, consagracion, amen] = ACLAMACIONES.map(a => construirAclamacion(a, 'Misa M. Manzano', drive));
check('oración universal: partitura completa para el coro', idDe(oracion.sheetMusicUrl), 'Oración universal.pdf');
check('consagración: nunca «Anunciaremos tu Reino»', idDe(consagracion.sheetMusicUrl), 'Anunciamos tu muerte.pdf');
check('amén: con sus voces', amen.sheets?.length, 3);
check('consagración: solo las voces de SU obra, no las de «Anunciaremos tu Reino»',
  consagracion.sheets?.map(s => s.fileName).sort(),
  ['Anunciamos tu muerte-Voz.pdf', 'Anunciamos tu muerte-Voz_2.pdf', 'Anunciamos tu muerte.pdf']);
check('las tres se reconocen en el cantoral',
  aclamacionesEnElCantoral([oracion, consagracion, amen]), ['oracion-universal', 'consagracion', 'amen']);
check('sin Drive: solo la letra', construirAclamacion(ACLAMACIONES[2], undefined, []).sheetMusicUrl, undefined);
check('…y la letra está', construirAclamacion(ACLAMACIONES[2], undefined, []).lyrics, 'Amén, Amén, Amén.');

console.log('\n== Modo Atril según el perfil ==');
const pueblo = { puebloFiel: true, organo: false };
const guitarra = { puebloFiel: false, organo: false };
const organo = { puebloFiel: false, organo: true };
const bajo = { puebloFiel: false, organo: false, voicePart: 'Bajo' };
check('Pueblo: partitura', modoDelAtril(oracion, pueblo), 'score');
check('Pueblo: la Voz 1, no la coral', idDe(partituraDelAtril(oracion, pueblo)), 'Oración universal-Voz_1.pdf');
check('Pueblo: Padre Nuestro en su Voz', idDe(partituraDelAtril(es, pueblo)), 'Padre nuestro-Voz.pdf');
check('Pueblo: Pater noster en tetragrama', idDe(partituraDelAtril(la, pueblo)), 'Pater noster.pdf');
check('Pueblo sin partitura: la letra',
  modoDelAtril(construirAclamacion(ACLAMACIONES[2], undefined, []), pueblo), 'lyrics');
check('Organista: la completa', idDe(partituraDelAtril(amen, organo)), 'Triple amen voces.pdf');
check('Bajo: su voz', idDe(partituraDelAtril(amen, bajo)), 'Triple amen voces-Bajo.pdf');
check('Guitarra: partitura (la letra no trae acordes)', modoDelAtril(la, guitarra), 'score');
const conAcordes: Song = { ...amen, lyrics: '[Do]Amén, [Sol]Amén, [Do]Amén.' };
check('Guitarra: si la letra trae acordes, acordes', modoDelAtril(conAcordes, guitarra), 'chords');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
