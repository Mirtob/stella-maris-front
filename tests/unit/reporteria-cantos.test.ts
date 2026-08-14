/**
 * Reportería del catálogo (src/utils/songReport.ts).
 *
 * Cubre la regla del par órgano+guitarra, la excepción gregoriana, la detección
 * de acordes en la letra, el desglose por clasificación, el cruce con las
 * carpetas de Drive y la exportación de la planilla.
 */
import { Song } from '../../src/types';
import {
  lyricsHaveChords, isGregorianSong, songReportRow, buildSongReport,
  summarizeDrive, mergeDriveStats, folderToCategory, reportToCSV,
  matchesReportFilter, reportToWorkbook, reportFileName, DRIVE_REPORT_NAME,
} from '../../src/utils/songReport';
import { columnLetter, buildXlsx } from '../../src/utils/xlsx';
import { driveNameQuery, buildMultipartBody } from '../../src/services/driveUpload';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const ID_A = 'aaaaaaaaaaa';   // IDs de YouTube válidos: 11 caracteres
const ID_B = 'bbbbbbbbbbb';
const ID_C = 'ccccccccccc';

const song = (over: Partial<Song> = {}): Song => ({
  id: over.id ?? 'id-' + Math.random().toString(36).slice(2, 8),
  title: 'Canto',
  category: 'Entrada',
  youtubeId: '',
  duration: '',
  ...over,
});

console.log('\n== Acordes en la letra ==');
check('letra con [Sol] tiene acordes', lyricsHaveChords('[Sol]Santa Ma[Re]ría'), true);
check('acorde americano [G7]', lyricsHaveChords('[G7]Gloria a Dios'), true);
check('acorde con bajo [Re/Fa#]', lyricsHaveChords('[Re/Fa#]Aleluya'), true);
check('letra sin corchetes → sin acordes', lyricsHaveChords('Santa María, madre de Dios'), false);
check('acotación [Estribillo] NO es acorde', lyricsHaveChords('[Estribillo]\nCantad al Señor'), false);
check('acotación [bis] NO es acorde', lyricsHaveChords('Cantad al Señor [bis]'), false);
check('acotación [Coro] NO es acorde', lyricsHaveChords('[Coro] Aleluya'), false);
check('acorde menor [Lam]', lyricsHaveChords('[Lam]Kyrie'), true);
check('acorde [Fa#m7]', lyricsHaveChords('[Fa#m7]Gloria'), true);
check('acorde [Solsus4]', lyricsHaveChords('[Solsus4]Santo'), true);
check('formato **negrita** no confunde', lyricsHaveChords('**Estribillo**\nCantad'), false);
check('letra vacía', lyricsHaveChords(''), false);
check('letra ausente', lyricsHaveChords(undefined), false);

console.log('\n== Excepción gregoriana ==');
check('etiqueta Gregoriano', isGregorianSong(song({ liturgicalSeasons: ['Gregoriano'] as never })), true);
check('etiqueta sin tilde/minúscula', isGregorianSong(song({ liturgicalSeasons: ['gregoriano'] as never })), true);
check('título "Kyrie gregoriano"', isGregorianSong(song({ title: 'Kyrie gregoriano' })), true);
check('canto normal no es gregoriano', isGregorianSong(song({ title: 'Vienen con alegría' })), false);

console.log('\n== Regla del par órgano + guitarra ==');
const ambas = songReportRow(song({ youtubeIdOrgano: ID_A, youtubeIdGuitarra: ID_B }));
check('con ambas versiones → completo', [ambas.videoStatus, ambas.videoComplete], ['completo', true]);
check('con ambas → no falta video', ambas.missing.filter(m => m.startsWith('Versión')), []);

const soloOrgano = songReportRow(song({ youtubeIdOrgano: ID_A }));
check('solo órgano → falta guitarra', soloOrgano.videoStatus, 'falta-guitarra');
check('solo órgano → incompleto', soloOrgano.videoComplete, false);
check('solo órgano → lista qué falta', soloOrgano.missing.includes('Versión guitarra'), true);

const soloGuitarra = songReportRow(song({ youtubeIdGuitarra: ID_B }));
check('solo guitarra → falta órgano', soloGuitarra.videoStatus, 'falta-organo');

const soloGeneral = songReportRow(song({ youtubeId: ID_C }));
check('solo video único → solo-general', soloGeneral.videoStatus, 'solo-general');
check('video único NO cumple el par', soloGeneral.videoComplete, false);

const sinVideo = songReportRow(song({}));
check('sin video', [sinVideo.videoStatus, sinVideo.videoComplete], ['sin-video', false]);

const gregOrgano = songReportRow(song({ title: 'Adoro te devote (gregoriano)', youtubeIdOrgano: ID_A }));
check('gregoriano con un video → completo', gregOrgano.videoComplete, true);
check('gregoriano no exige guitarra', gregOrgano.missing.includes('Versión guitarra'), false);
const gregSinVideo = songReportRow(song({ liturgicalSeasons: ['Gregoriano'] as never }));
check('gregoriano sin video → incompleto', gregSinVideo.videoComplete, false);
check('gregoriano sin video → pide un video', gregSinVideo.missing.includes('Video (gregoriano)'), true);

console.log('\n== URL pegada en vez de ID ==');
const conUrl = songReportRow(song({
  youtubeIdOrgano: 'https://www.youtube.com/watch?v=' + ID_A,
  youtubeIdGuitarra: 'https://youtu.be/' + ID_B,
}));
check('la URL cuenta como versión grabada', conUrl.videoComplete, true);
// Ojo: 'no-es-un-id' tiene 11 caracteres válidos y YouTube lo daría por ID; el
// caso a cubrir es el texto que claramente no lo es (espacios, largo distinto).
const basura = songReportRow(song({ youtubeIdOrgano: 'pendiente de grabar' }));
check('texto inválido NO cuenta como video', basura.hasOrgano, false);

console.log('\n== Partitura, voces, letra y acordes en la fila ==');
const completo = songReportRow(song({
  youtubeIdOrgano: ID_A, youtubeIdGuitarra: ID_B,
  driveFileId: 'FILE_ID_DE_DRIVE_1234567890',
  sheets: [{ part: 'Soprano', fileId: 'x', fileName: 'a-Soprano.pdf' }],
  lyrics: '[Sol]Vienen con ale[Re]gría',
}));
check('canto completo no tiene faltantes', completo.missing, []);
check('cuenta las voces', completo.voices, 1);
check('marca partitura', completo.hasSheet, true);
check('marca acordes', completo.hasChords, true);
const sinAcordes = songReportRow(song({ lyrics: 'Vienen con alegría' }));
check('letra sin acordes → falta "Acordes"', sinAcordes.missing.includes('Acordes'), true);
check('letra sin acordes → NO falta "Letra"', sinAcordes.missing.includes('Letra'), false);
const sinLetra = songReportRow(song({}));
check('sin letra → falta "Letra" y no "Acordes"',
  [sinLetra.missing.includes('Letra'), sinLetra.missing.includes('Acordes')], [true, false]);

console.log('\n== Totales y desglose por clasificación ==');
const catalogo: Song[] = [
  song({ id: '1', title: 'Entrada A', category: 'Entrada', youtubeIdOrgano: ID_A, youtubeIdGuitarra: ID_B, lyrics: '[Sol]la' }),
  song({ id: '2', title: 'Entrada B', category: 'Entrada', youtubeIdOrgano: ID_A }),
  song({ id: '3', title: 'Comunión A', category: 'Comunión', youtubeIdGuitarra: ID_B }),
  song({ id: '4', title: 'Kyrie gregoriano', category: 'Kyrie', youtubeIdOrgano: ID_A }),
  song({ id: '5', title: 'Salida A', category: 'Salida' }),
];
const rep = buildSongReport(catalogo);
check('total', rep.totals.total, 5);
check('con versión órgano', rep.totals.organo, 3);
check('con versión guitarra', rep.totals.guitarra, 2);
check('con ambas versiones', rep.totals.ambas, 1);
check('completos (incluye el gregoriano)', rep.totals.completos, 2);
check('pendientes', rep.totals.pendientes, 3);
check('sin video', rep.totals.sinVideo, 1);
check('gregorianos', rep.totals.gregorianos, 1);
check('con acordes', rep.totals.conAcordes, 1);
check('clasificaciones en orden de la Misa',
  rep.byCategory.map(c => c.category), ['Entrada', 'Kyrie', 'Comunión', 'Salida']);
check('Entrada: 2 cantos, 1 completo',
  [rep.byCategory[0].total, rep.byCategory[0].completos], [2, 1]);

console.log('\n== Filtros de la planilla ==');
const rowsDe = (f: Parameters<typeof matchesReportFilter>[1]) =>
  rep.rows.filter(r => matchesReportFilter(r, f)).map(r => r.title);
check('filtro pendientes', rowsDe('pendientes'), ['Entrada B', 'Comunión A', 'Salida A']);
check('filtro falta guitarra (excluye gregoriano)', rowsDe('falta-guitarra'), ['Entrada B', 'Salida A']);
check('filtro falta órgano (excluye gregoriano)', rowsDe('falta-organo'), ['Comunión A', 'Salida A']);
check('filtro sin video', rowsDe('sin-video'), ['Salida A']);
check('filtro video sin clasificar',
  buildSongReport([song({ title: 'Solo general', youtubeId: ID_C })]).rows
    .filter(r => matchesReportFilter(r, 'solo-general')).map(r => r.title), ['Solo general']);
check('filtro sin acordes', rowsDe('sin-acordes').length, 4);
check('filtro gregorianos', rowsDe('gregorianos'), ['Kyrie gregoriano']);

console.log('\n== Carpetas de Drive → clasificación ==');
check('"Comunion" (sin tilde) → Comunión', folderToCategory('Comunion'), 'Comunión');
check('"Salida" → Salida', folderToCategory('Salida'), 'Salida');
check('"Final" → Salida', folderToCategory('Final'), 'Salida');
check('"Rito de Aspersion" → con tilde', folderToCategory('Rito de Aspersion'), 'Rito de Aspersión');
check('"Misas" es el ordinario, fila propia', folderToCategory('Misas'), 'Misas (ordinario)');
check('carpeta desconocida se muestra tal cual', folderToCategory('Cantos varios'), 'Cantos varios');

console.log('\n== Cruce con Drive ==');
const driveFiles = [
  { id: 'f1', name: 'Vienen con alegria.pdf', mimeType: 'application/pdf', path: 'Entrada', parentId: 'ENT' },
  { id: 'f2', name: 'Ave Maria-Soprano.pdf', mimeType: 'application/pdf', path: 'Entrada/Ave Maria', parentId: 'AVE' },
  { id: 'f3', name: 'Ave Maria-Alto.pdf', mimeType: 'application/pdf', path: 'Entrada/Ave Maria', parentId: 'AVE' },
  { id: 'f4', name: 'Ave Maria.mp3', mimeType: 'audio/mpeg', path: 'Entrada/Ave Maria', parentId: 'AVE' },
  { id: 'f5', name: 'Pan de vida.pdf', mimeType: 'application/pdf', path: 'Comunion', parentId: 'COM' },
];
const driveFolders = [
  { id: 'ENT', name: 'Entrada', path: 'Entrada' },
  { id: 'AVE', name: 'Ave Maria', path: 'Entrada/Ave Maria' },
  { id: 'COM', name: 'Comunion', path: 'Comunion' },
  { id: 'VAC', name: 'Ofertorio', path: 'Ofertorio' },
];
const drive = summarizeDrive(driveFiles, driveFolders);
check('PDF por clasificación (el mp3 no cuenta)',
  drive.map(d => [d.category, d.pdfs]), [['Comunión', 1], ['Entrada', 3]]);
check('carpetas con partituras', drive.map(d => [d.category, d.folders]), [['Comunión', 1], ['Entrada', 2]]);

const merged = mergeDriveStats(rep.byCategory, drive);
check('Entrada cruza catálogo y Drive',
  [merged[0].category, merged[0].total, merged[0].drivePdfs], ['Entrada', 2, 3]);
check('clasificación sin PDF en Drive queda sin columna',
  merged.find(c => c.category === 'Salida')?.drivePdfs, undefined);

console.log('\n== Planilla CSV ==');
const csv = reportToCSV(rep.rows);
const lineas = csv.split('\r\n');
check('una fila por canto + cabecera', lineas.length, 6);
check('cabecera con las columnas pedidas',
  lineas[0].startsWith('﻿Canto;Clasificación;Gregoriano;Versión órgano;Versión guitarra'), true);
check('fila de "Entrada B" marca lo que falta', lineas[2].includes('Versión guitarra'), true);
const conPuntoYComa = reportToCSV([songReportRow(song({ title: 'Gloria; y paz' }))]);
check('el título con ";" va entrecomillado', conPuntoYComa.includes('"Gloria; y paz"'), true);

console.log('\n== Libro Excel: todos los KPI en un archivo ==');
const wb = reportToWorkbook(rep, merged, new Date('2026-08-12T12:00:00Z'));
check('tres hojas', wb.map(s => s.name), ['Resumen', 'Por clasificación', 'Planilla']);
check('los nombres de pestaña caben en 31 caracteres', wb.every(s => s.name.length <= 31), true);
const resumen = new Map(
  wb[0].rows.filter(r => typeof r[0] === 'string' && r.length > 1).map(r => [r[0] as string, r[1]]),
);
check('KPI total', resumen.get('Cantos en el catálogo'), 5);
check('KPI órgano', resumen.get('🎹 Con versión órgano'), 3);
check('KPI guitarra', resumen.get('🎶 Con versión guitarra'), 2);
check('KPI completos', resumen.get('Con las dos versiones (completos)'), 2);
check('KPI acordes', resumen.get('Con letra y acordes'), 1);
check('los valores van como número, no texto', typeof resumen.get('Cantos en el catálogo'), 'number');

const hojaCat = wb[1];
check('la hoja de clasificación trae fila por categoría + total',
  hojaCat.rows.length, rep.byCategory.length + 2);
check('la última fila es el Total con los mismos números',
  hojaCat.rows[hojaCat.rows.length - 1].slice(1, 6), [5, 3, 2, 1, 2]);
check('los PDF de Drive llegan a la hoja',
  hojaCat.rows[1].slice(0, 2).concat(hojaCat.rows[1][10] as never), ['Entrada', 2, 3]);

const hojaPlanilla = wb[2];
check('la planilla trae todos los cantos + cabecera', hojaPlanilla.rows.length, rep.rows.length + 1);
check('cabecera de la planilla en negrita',
  (hojaPlanilla.rows[0][0] as { bold?: boolean }).bold, true);

check('nombre del archivo con la fecha',
  reportFileName(new Date('2026-08-12T12:00:00Z')), 'reporteria-cantos-2026-08-12.xlsx');

console.log('\n== Escritura del .xlsx ==');
check('columna 0 → A', columnLetter(0), 'A');
check('columna 25 → Z', columnLetter(25), 'Z');
check('columna 26 → AA', columnLetter(26), 'AA');
check('columna 27 → AB', columnLetter(27), 'AB');

const blob = buildXlsx(wb);
check('es un xlsx (tipo MIME)',
  blob.type, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
const bytes = new Uint8Array(await blob.arrayBuffer());
// 'PK\x03\x04' — un .xlsx es un ZIP, así que empieza por la firma local del ZIP.
check('empieza por la firma ZIP', Array.from(bytes.slice(0, 4)), [0x50, 0x4b, 0x03, 0x04]);
const texto = new TextDecoder().decode(bytes);
check('lleva el manifiesto de tipos', texto.includes('[Content_Types].xml'), true);
check('lleva una hoja por pestaña',
  ['sheet1.xml', 'sheet2.xml', 'sheet3.xml'].every(n => texto.includes(`xl/worksheets/${n}`)), true);
check('el título del canto viaja dentro del XML', texto.includes('Kyrie gregoriano'), true);

// El "&" de un título rompería el XML si no se escapara.
const conAmpersand = buildXlsx([{ name: 'Hoja', rows: [['Cristo & la Iglesia <3']] }]);
const textoAmp = new TextDecoder().decode(new Uint8Array(await conAmpersand.arrayBuffer()));
check('escapa & y <', textoAmp.includes('Cristo &amp; la Iglesia &lt;3'), true);
check('no deja el & crudo', /Cristo & la/.test(textoAmp), false);

// Dos pestañas con el mismo nombre invalidan el libro entero en Excel.
const dupes = buildXlsx([{ name: 'Datos', rows: [['a']] }, { name: 'Datos', rows: [['b']] }]);
const textoDup = new TextDecoder().decode(new Uint8Array(await dupes.arrayBuffer()));
check('renombra la pestaña duplicada', textoDup.includes('name="Datos 2"'), true);

console.log('\n== Guardar en Drive ==');
check('el nombre en Drive es fijo (mismo enlace siempre)',
  DRIVE_REPORT_NAME, 'Reportería de cantos — Stella Maris.xlsx');
check('el nombre de la descarga sí lleva fecha',
  reportFileName(new Date('2026-08-12T12:00:00Z')).includes('2026-08-12'), true);
check('consulta por nombre', driveNameQuery('Informe.xlsx'),
  "name = 'Informe.xlsx' and trashed = false");
// Un apóstrofo sin escapar cierra el literal y rompe (o inyecta en) la consulta.
check('escapa el apóstrofo del nombre', driveNameQuery("Cantos d'Ávila.xlsx"),
  "name = 'Cantos d\\'Ávila.xlsx' and trashed = false");
check('escapa la barra invertida', driveNameQuery('a\\b.xlsx'),
  "name = 'a\\\\b.xlsx' and trashed = false");

const multi = buildMultipartBody(
  { name: 'Informe.xlsx', mimeType: 'application/vnd.ms-excel' },
  new Blob(['DATOS'], { type: 'application/vnd.ms-excel' }),
  'limite',
);
const cuerpoTexto = await multi.body.text();
check('el header declara el boundary', multi.contentType, 'multipart/related; boundary=limite');
check('lleva la metadata primero', cuerpoTexto.includes('{"name":"Informe.xlsx"'), true);
check('lleva el contenido después', cuerpoTexto.includes('\r\n\r\nDATOS\r\n'), true);
check('cierra el multipart', cuerpoTexto.trimEnd().endsWith('--limite--'), true);
// El header y el cuerpo tienen que coincidir: si no, Drive responde 400 sin explicar.
check('header y cuerpo usan el mismo boundary',
  cuerpoTexto.startsWith(`--${multi.contentType.split('boundary=')[1]}`), true);
// Blob normaliza el MIME a minúsculas; por eso el boundary se genera ya en minúsculas.
const conMayusculas = buildMultipartBody({}, new Blob(['x']), 'LIMITE');
check('un boundary en mayúsculas no desalinea el cuerpo',
  (await conMayusculas.body.text()).startsWith(`--${conMayusculas.body.type.split('boundary=')[1]}`), true);
check('boundary autogenerado cuando no se pasa',
  buildMultipartBody({}, new Blob(['x'])).contentType.startsWith('multipart/related; boundary=stella'), true);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallas\n`);
if (fail > 0) process.exit(1);
