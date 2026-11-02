/**
 * Bronces y obras instrumentales (pedido del 2-nov-2026): los músicos que no cantan ni
 * tocan órgano tienen su material en el Modo Atril, y nada de eso llega al pueblo.
 *
 *  · Arreglo de bronces de un canto o aclamación → PDF por instrumento en la carpeta
 *    del canto. Lo ve el coro; al pueblo nunca se le cae a la partitura con bronces.
 *  · Obra instrumental (ofertorio para bronces, toque de la elevación) → fuera de todo
 *    lo que ve el Pueblo fiel.
 */
import type { Song } from '../../src/types';
import { esInstrumental, sinInstrumentales, cantoralParaElPueblo, ELEVACION } from '../../src/utils/instrumental';
import { esParteDeBronce, nombreDeParteDeBronce, detectSheets, hasPartSheet } from '../../src/utils/sheetParts';
import { partituraDelPueblo, pickOrdinarySheet, type DriveFile } from '../../src/utils/ordinarySheetMusic';
import { modoDelAtril, tacetDelBronce, type PerfilAtril } from '../../src/utils/atrilModo';
import { songMatchesInstrument } from '../../src/utils/instrument';
import { massRank } from '../../src/utils/ordinary';
import { categoryToMoment, normalizeCategory } from '../../src/utils/category';
import { construirAclamacion, obrasDeElevacion, construirElevacion } from '../../src/utils/padreNuestroYAclamaciones';
import { ACLAMACIONES } from '../../src/data/aclamaciones';
import { validateCantoral } from '../../src/utils/liturgicalValidation';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const canto = (o: Partial<Song>): Song => ({
  id: 'x', title: 'Canto', category: 'Ofertorio', youtubeId: '', duration: '', ...o,
});
const hoja = (part: string, fileName: string) => ({ part, fileId: fileName, fileName });

console.log('\n== Qué es una obra instrumental ==');
check('marcada en el catálogo', esInstrumental(canto({ instrumental: true })), true);
check('la elevación lo es siempre', esInstrumental(canto({ category: ELEVACION })), true);
check('un ofertorio cantado no', esInstrumental(canto({})), false);
check('un canto con arreglo de bronces sigue siendo del pueblo',
  esInstrumental(canto({ sheets: [hoja('Trompeta en Sib 1', 'O-Trompeta_en_Sib_1.pdf')] })), false);

console.log('\n== El pueblo no las ve ==');
const misa = [canto({ id: 'a', category: 'Entrada' }), canto({ id: 'b', instrumental: true }), canto({ id: 'c', category: ELEVACION })];
check('sinInstrumentales', sinInstrumentales(misa).map(s => s.id), ['a']);
const c = { id: 'k', songs: misa };
check('cantoralParaElPueblo saca las dos', cantoralParaElPueblo(c).songs.map(s => s.id), ['a']);
const soloCantos = { id: 'k', songs: [misa[0]] };
check('sin obras instrumentales devuelve el mismo objeto', cantoralParaElPueblo(soloCantos) === soloCantos, true);

console.log('\n== Partes de bronce ==');
check('Trompeta en Sib 1', esParteDeBronce('Trompeta en Sib 1'), true);
check('Trombón 2 (con tilde)', esParteDeBronce('Trombón 2'), true);
check('Tuba', esParteDeBronce('Tuba'), true);
check('Horn in F', esParteDeBronce('Horn in F'), true);
check('Soprano no', esParteDeBronce('Soprano'), false);
check('Órgano no', esParteDeBronce('Órgano'), false);
check('sin parte no', esParteDeBronce(undefined), false);
check('archivo de MuseScore', nombreDeParteDeBronce('Anunciamos tu muerte-Trompeta_en_Sib_1.pdf'), true);
check('archivo con tilde', nombreDeParteDeBronce('Santo-Trombón.pdf'), true);
check('obra titulada «Toque de trompeta» no es una parte', nombreDeParteDeBronce('Toque de trompeta.pdf'), false);
check('la Voz no', nombreDeParteDeBronce('Santo - Manzano-Voz.pdf'), false);

const carpeta = detectSheets([
  { id: '1', name: 'Fanfarria.pdf' },
  { id: '2', name: 'Fanfarria-Trompeta_en_Sib_1.pdf' },
  { id: '3', name: 'Fanfarria-Trombón.pdf' },
]);
check('detectSheets deduce los bronces', carpeta.map(s => s.part), ['Full Score', 'Trombón', 'Trompeta en Sib 1']);
check('el trompetista tiene su parte', hasPartSheet(carpeta, 'Trompeta'), true);

console.log('\n== La partitura del pueblo nunca trae bronces ==');
const conVoz = canto({
  category: 'Aclamación Consagración', sheetMusicUrl: 'FULL',
  sheets: [hoja('Full Score', 'A.pdf'), hoja('Voz', 'A-Voz.pdf'), hoja('Trompeta', 'A-Trompeta.pdf')],
});
check('con Voz → la Voz', partituraDelPueblo(conVoz), 'https://drive.google.com/file/d/A-Voz.pdf/preview');
const sinVoz = canto({
  category: 'Aclamación Consagración', sheetMusicUrl: 'FULL',
  sheets: [hoja('Full Score', 'A.pdf'), hoja('Trompeta', 'A-Trompeta.pdf')],
});
check('con bronces y sin Voz → nada (va la letra)', partituraDelPueblo(sinVoz), undefined);
const coral = canto({
  category: 'Santo', sheetMusicUrl: 'FULL',
  sheets: [hoja('Full Score', 'S.pdf'), hoja('Soprano', 'S-Soprano.pdf')],
});
check('sin bronces sigue igual que antes', partituraDelPueblo(coral), 'FULL');

console.log('\n== La partitura completa gana a la parte de bronce ==');
const f = (name: string, path?: string): DriveFile => ({ id: name, name, path });
check('aclamación: la general, no la de trompeta',
  pickOrdinarySheet('Aclamación Consagración', undefined, [
    f('Aclamacion Consagracion-Trompeta_en_Sib_1.pdf', 'Aclamaciones/Consagración'),
    f('Aclamacion Consagracion.pdf', 'Aclamaciones/Consagración'),
  ])?.name, 'Aclamacion Consagracion.pdf');

console.log('\n== La aclamación lleva también sus bronces ==');
const consagracion = ACLAMACIONES.find(a => a.id === 'consagracion')!;
const archivos = [
  f('Anunciamos tu muerte.pdf', 'Aclamaciones/Consagración'),
  f('Anunciamos tu muerte-Voz.pdf', 'Aclamaciones/Consagración'),
  f('Anunciamos tu muerte-Trompeta_en_Sib_1.pdf', 'Aclamaciones/Consagración'),
  f('Anunciamos tu muerte-Trombón.pdf', 'Aclamaciones/Consagración'),
];
const armada = construirAclamacion(consagracion, undefined, archivos);
check('trae las partes de bronce', armada.sheets?.map(s => s.part).sort(),
  ['Full Score', 'Trombón', 'Trompeta en Sib 1', 'Voz']);
check('y el pueblo sigue con la Voz', partituraDelPueblo(armada),
  'https://drive.google.com/file/d/Anunciamos tu muerte-Voz.pdf/preview');

console.log('\n== Toques de elevación (catálogo + carpeta «Elevación» del Drive) ==');
const drive = [
  f('Toque de elevación.pdf', 'Elevación/Toque de elevación'),
  f('Toque de elevación-Trompeta_en_Sib_1.pdf', 'Elevación/Toque de elevación'),
  f('Toque de elevación-Trombón.pdf', 'Elevación/Toque de elevación'),
  f('Fanfarria breve.pdf', 'Elevación'),
  f('Fanfarria breve.mp3', 'Elevación'),
  f('Santo - Manzano-Voz.pdf', 'Misas/Manzano'),
];
const obras = obrasDeElevacion(drive);
check('una obra por carpeta/obra, en orden', obras.map(o => o.title), ['Fanfarria breve', 'Toque de elevación']);
const toqueDrive = obras.find(o => o.title === 'Toque de elevación')!;
check('su partitura es la general', toqueDrive.sheetMusicUrl, 'https://drive.google.com/file/d/Toque de elevación.pdf/preview');
check('trae las partes de bronce', toqueDrive.sheets?.map(s => s.part), ['Full Score', 'Trombón', 'Trompeta en Sib 1']);
check('es instrumental (el pueblo no la ve)', esInstrumental(toqueDrive), true);
const delCatalogo = canto({ id: 'uuid-1', title: 'Toque de Elevación', category: ELEVACION });
check('el del catálogo va primero y no se repite el del Drive',
  obrasDeElevacion(drive, [delCatalogo, canto({ id: 'otro' })]).map(o => o.id),
  ['uuid-1', `elevacion-Fanfarria breve.pdf`]);
const puesta = construirElevacion(toqueDrive);
check('al ponerla lleva id propio que conserva el de la obra', puesta.id.startsWith(`${toqueDrive.id}::`), true);
check('sin carpeta Elevación no hay toques', obrasDeElevacion(drive.slice(5)).length, 0);

console.log('\n== Modo Atril ==');
const coro = (o: Partial<PerfilAtril> = {}): PerfilAtril => ({ puebloFiel: false, organo: false, ...o });
const toque = canto({ category: ELEVACION, sheetMusicUrl: 'FULL', sheets: [] });
check('guitarrista: la obra instrumental en partitura, no en acordes', modoDelAtril(toque, coro()), 'score');
check('trompetista: idem', modoDelAtril(toque, coro({ voicePart: 'Trompeta' })), 'score');
check('obra instrumental sin partitura → acordes (no queda en blanco)',
  modoDelAtril(canto({ instrumental: true }), coro()), 'chords');
const himno = canto({ category: 'Entrada', lyrics: '[Sol]Canto', sheetMusicUrl: 'FULL', sheets: [hoja('Full Score', 'H.pdf'), hoja('Soprano', 'H-Soprano.pdf')] });
check('tacet: el canto no trae parte de trompeta', tacetDelBronce(himno, coro({ voicePart: 'Trompeta' })), true);
const conTrompeta = canto({ sheets: [hoja('Full Score', 'O.pdf'), hoja('Trompeta en Sib 1', 'O-Trompeta_en_Sib_1.pdf')] });
check('no tacet: trae su parte', tacetDelBronce(conTrompeta, coro({ voicePart: 'Trompeta' })), false);
check('no tacet: la obra instrumental de un solo PDF es suya', tacetDelBronce(toque, coro({ voicePart: 'Trompeta' })), false);
check('no tacet: la soprano', tacetDelBronce(himno, coro({ voicePart: 'Soprano' })), false);
check('no tacet: el pueblo', tacetDelBronce(himno, { puebloFiel: true, organo: false, voicePart: 'Trompeta' }), false);

console.log('\n== Constructor ==');
check('la obra instrumental sirve con guitarra', songMatchesInstrument(canto({ instrumental: true, instruments: ['Órgano'] }), 'Guitarra'), true);
check('un canto de órgano sigue sin servir con guitarra', songMatchesInstrument(canto({ instruments: ['Órgano'] }), 'Guitarra'), false);
check('Elevación va entre el Santo y la aclamación',
  massRank('Santo') < massRank(ELEVACION) && massRank(ELEVACION) < massRank('Aclamación Consagración'), true);
check('rótulo ↔ momento', [categoryToMoment(ELEVACION), normalizeCategory('elevacion')], ['elevacion', ELEVACION]);

console.log('\n== Aviso de Cuaresma (IGMR 313) ==');
const avisos = (date: string, songs: Song[]) => validateCantoral(songs, { date }).map(w => w.code);
// 2027: Miércoles de Ceniza 10-feb; 2.º domingo de Cuaresma 21-feb; Laetare 7-mar.
check('2.º domingo de Cuaresma con toque → aviso', avisos('2027-02-21', [toque]).includes('instrumental-lent'), true);
check('Laetare → sin aviso', avisos('2027-03-07', [toque]).includes('instrumental-lent'), false);
check('Tiempo Ordinario → sin aviso', avisos('2027-01-17', [toque]).includes('instrumental-lent'), false);
check('Cuaresma sin obras instrumentales → sin aviso', avisos('2027-02-21', [himno]).includes('instrumental-lent'), false);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
