/**
 * Buscador de carpetas de partituras por voz (src/utils/sheetFolderSearch.ts).
 *
 * Lo que asegura: que con cientos de carpetas la del canto que se está cargando
 * aparezca arriba (por título y por momento), que el texto busque también dentro de
 * los nombres de los PDF, y que las carpetas que solo agrupan otras no estorben.
 */
import {
  buildFolderOptions, scoreByTitle, filterFolderOptions, momentCounts, suggestedFolder,
  buildFileOptions, filterOptions, momentCountsOf, suggestedMatch,
  titleMatchScore, makeMomentLabeler, TITLE_MATCH_THRESHOLD, NO_FOLDER,
  type DriveFile, type DriveFolder,
} from '../../src/utils/sheetFolderSearch';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const MOMENT_LABELS = [
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Ofertorio', 'Santo',
  'Cordero de Dios', 'Comunión', 'Final / Salida',
];

// Drive de ejemplo: carpetas de momento (contenedoras) + carpetas de canto.
const folders: DriveFolder[] = [
  { id: 'f-entrada', name: 'Entrada', path: 'Entrada' },
  { id: 'f-comunion', name: 'Comunion', path: 'Comunion' },
  { id: 'f-salida', name: 'Salida', path: 'Salida' },
  { id: 'f-ave', name: 'Ave María Arcadelt', path: 'Comunion/Ave Maria Arcadelt' },
  { id: 'f-vienen', name: 'Vienen con Alegría', path: 'Entrada/Vienen con Alegria' },
  { id: 'f-adviento', name: 'Adviento', path: 'Entrada/Adviento' },
  { id: 'f-alegres', name: 'Alegres Vamos', path: 'Entrada/Adviento/Alegres Vamos' },
  { id: 'f-vacia', name: 'Canto Nuevo', path: 'Entrada/Canto Nuevo' },
];

/** Un archivo tal como lo devuelve /api/sheets: `path` = carpeta que lo contiene. */
const pdf = (id: string, name: string, parentId: string, path: string): DriveFile =>
  ({ id, name, parentId, path });
const AVE = 'Comunion/Ave Maria Arcadelt';
const files: DriveFile[] = [
  pdf('a1', 'Ave Maria Arcadelt.pdf', 'f-ave', AVE),
  pdf('a2', 'Ave Maria Arcadelt-Soprano.pdf', 'f-ave', AVE),
  pdf('a3', 'Ave Maria Arcadelt-Alto.pdf', 'f-ave', AVE),
  pdf('a4', 'Ave Maria Arcadelt-Tenor.pdf', 'f-ave', AVE),
  pdf('a5', 'Ave Maria Arcadelt-Bajo.pdf', 'f-ave', AVE),
  pdf('a6', 'Ave Maria Arcadelt.mp3', 'f-ave', AVE),     // MuseScore deja el audio: no cuenta
  pdf('v1', 'Vienen con Alegria.pdf', 'f-vienen', 'Entrada/Vienen con Alegria'),
  pdf('g1', 'Alegres Vamos.pdf', 'f-alegres', 'Entrada/Adviento/Alegres Vamos'),
  pdf('g2', 'Alegres Vamos-Soprano.pdf', 'f-alegres', 'Entrada/Adviento/Alegres Vamos'),
  pdf('s1', 'Hoy Sale de Aqui.pdf', 'f-salida', 'Salida'), // suelta en la carpeta de momento
  { id: 'r1', name: 'Cantoral viejo.pdf' },                // suelto en la raíz, sin carpeta
];

const build = (title = '') => buildFolderOptions(folders, files, { momentLabels: MOMENT_LABELS, title });
const byId = (id: string) => build().find(o => o.id === id)!;
const ids = (list: { id: string }[]) => list.map(o => o.id);

console.log('\n== Rótulo de la carpeta → momento de la Misa ==');
const label = makeMomentLabeler(MOMENT_LABELS);
check('"Comunion" sin tilde es Comunión', label('Comunion'), 'Comunión');
check('"Salida" es Final / Salida', label('Salida'), 'Final / Salida');
check('"Misas" (ordinario) cae en Kyrie', label('Misas'), 'Kyrie');
check('una carpeta desconocida se rotula con su propio nombre', label('Adoración'), 'Adoración');

console.log('\n== Qué trae cada carpeta ==');
check('cuenta solo los PDF (el .mp3 no)', byId('f-ave').pdfCount, 5);
check('detecta las voces sin la partitura general', byId('f-ave').parts, ['Soprano', 'Alto', 'Tenor', 'Bajo']);
check('la carpeta del canto hereda el momento de su ruta', byId('f-ave').moment, 'Comunión');
check('el tramo intermedio queda aparte', byId('f-alegres').subPath, 'Adviento');
check('la carpeta de momento se rotula sola', byId('f-entrada').moment, 'Entrada');
check('una carpeta de momento sabe cuántas agrupa', byId('f-entrada').childFolders, 3);
check('la carpeta de un canto no agrupa nada', byId('f-ave').childFolders, 0);

console.log('\n== Parecido con el título escrito ==');
check('mismo nombre = 1', titleMatchScore('Ave Maria Arcadelt', 'Ave María Arcadelt'), 1);
check('las muletillas no cuentan ("Vienen con Alegría")',
  titleMatchScore('Vienen con Alegria', 'Vienen con alegría'), 1);
check('un título más largo baja el parecido pero no a cero',
  titleMatchScore('Ave Maria Arcadelt', 'Ave María') >= TITLE_MATCH_THRESHOLD, true);
check('otro canto no se parece', titleMatchScore('Alegres Vamos', 'Ave María Arcadelt'), 0);
check('sin título no hay parecido', titleMatchScore('Ave Maria Arcadelt', ''), 0);

console.log('\n== Recalcular el parecido sin rehacer el catálogo ==');
check('scoreByTitle da lo mismo que construir con el título',
  scoreByTitle(build(), 'Ave María Arcadelt').map(o => o.titleScore),
  build('Ave María Arcadelt').map(o => o.titleScore));
check('con el título vacío todos vuelven a cero',
  scoreByTitle(build('Ave María Arcadelt'), '').every(o => o.titleScore === 0), true);

console.log('\n== Filtro por texto ==');
check('busca sin acentos', ids(filterFolderOptions(build(), { query: 'ave maria' })), ['f-ave']);
check('las palabras pueden ir en cualquier orden',
  ids(filterFolderOptions(build(), { query: 'arcadelt maria' })), ['f-ave']);
check('encuentra por el nombre de un PDF de adentro',
  ids(filterFolderOptions(build(), { query: 'alegres vamos soprano' })), ['f-alegres']);
check('sin coincidencias devuelve vacío',
  ids(filterFolderOptions(build(), { query: 'pentecostes' })), []);

console.log('\n== Filtro por momento y por "tiene PDF" ==');
check('solo las de Entrada que tienen PDF',
  ids(filterFolderOptions(build(), { moment: 'Entrada' })), ['f-alegres', 'f-vienen']);
check('la carpeta sin PDF se esconde por defecto',
  filterFolderOptions(build(), {}).some(o => o.id === 'f-vacia'), false);
check('destildando "solo con PDF" reaparece',
  filterFolderOptions(build(), { onlyWithPdf: false }).some(o => o.id === 'f-vacia'), true);

console.log('\n== Orden: primero lo que se está cargando ==');
check('la carpeta que se llama como el título va primera',
  ids(filterFolderOptions(build('Ave María Arcadelt'), {}))[0], 'f-ave');
check('sin título, primero las del momento del canto',
  ids(filterFolderOptions(build(), {}, 'Entrada')),
  ['f-alegres', 'f-vienen', 'f-ave', 'f-salida']);
check('las carpetas que solo agrupan quedan al final',
  ids(filterFolderOptions(build(), { onlyWithPdf: false })).slice(-3),
  ['f-comunion', 'f-entrada', 'f-adviento']);

console.log('\n== Chips de momento ==');
check('cuenta las carpetas de cada momento, en orden de la Misa',
  momentCounts(build(), MOMENT_LABELS),
  [{ moment: 'Entrada', count: 2 }, { moment: 'Comunión', count: 1 }, { moment: 'Final / Salida', count: 1 }]);

console.log('\n== Sugerencia por título ==');
check('sugiere la carpeta del canto', suggestedFolder(build('Ave María Arcadelt'))?.id, 'f-ave');
check('sin título no sugiere nada', suggestedFolder(build()), undefined);
check('un título que no está en Drive no sugiere nada',
  suggestedFolder(build('Cordero de Dios Gregoriano')), undefined);
check('con dos carpetas igual de parecidas no sugiere (elegir es del usuario)',
  suggestedFolder(buildFolderOptions(
    [
      { id: 'x1', name: 'Ave Maria', path: 'Comunion/Ave Maria' },
      { id: 'x2', name: 'Ave Maria', path: 'Ofertorio/Ave Maria' },
    ],
    [pdf('p1', 'Ave Maria.pdf', 'x1', 'Comunion/Ave Maria'),
     pdf('p2', 'Ave Maria.pdf', 'x2', 'Ofertorio/Ave Maria')],
    { momentLabels: MOMENT_LABELS, title: 'Ave María' },
  )),
  undefined);
check('no sugiere una carpeta vacía aunque se llame igual',
  suggestedFolder(build('Canto Nuevo')), undefined);

// ─────────────────────────────────────────────────────────────────────────────
// El otro selector: el PDF suelto de "Partitura (Google Drive)".
// ─────────────────────────────────────────────────────────────────────────────

const buildFiles = (title = '') => buildFileOptions(files, { momentLabels: MOMENT_LABELS, title });
const file = (id: string) => buildFiles().find(o => o.id === id)!;

console.log('\n== Partituras sueltas: qué se lista ==');
check('solo PDF (el .mp3 de MuseScore queda fuera)',
  buildFiles().some(o => o.fileName.endsWith('.mp3')), false);
check('el nombre se muestra sin la extensión', file('v1').name, 'Vienen con Alegria');
check('la ruta incluye el archivo', file('v1').path, 'Entrada/Vienen con Alegria/Vienen con Alegria.pdf');
check('el momento sale de la carpeta, con alias', file('a2').moment, 'Comunión');
check('lo que hay bajo el momento queda como subruta', file('g2').subPath, 'Adviento / Alegres Vamos');
check('un PDF suelto en la raíz se agrupa aparte', file('r1').moment, NO_FOLDER);

console.log('\n== Partituras sueltas: buscar y ordenar ==');
check('busca por la ruta completa, sin acentos',
  filterOptions(buildFiles(), { query: 'comunion soprano' }).map(o => o.id), ['a2']);
check('filtra por momento',
  filterOptions(buildFiles(), { moment: 'Final / Salida' }).map(o => o.id), ['s1']);
check('la partitura que se llama como el título va primera',
  filterOptions(buildFiles('Vienen con Alegría'), {}).map(o => o.id)[0], 'v1');
check('sin título, primero las del momento del canto',
  filterOptions(buildFiles(), {}, { currentMomentLabel: 'Final / Salida' }).map(o => o.id)[0], 's1');
check('los chips cuentan los PDF por momento y dejan lo suelto al final',
  momentCountsOf(buildFiles(), MOMENT_LABELS),
  [{ moment: 'Entrada', count: 3 }, { moment: 'Comunión', count: 5 },
   { moment: 'Final / Salida', count: 1 }, { moment: NO_FOLDER, count: 1 }]);
check('la partitura general va antes que sus voces (y las voces, alfabéticas)',
  filterOptions(buildFiles('Ave María Arcadelt'), {}).map(o => o.id).slice(0, 3),
  ['a1', 'a3', 'a5']);   // general, Alto, Bajo
check('cuando nada coincide manda el alfabeto, no el largo del nombre',
  filterOptions(buildFileOptions(
    [
      { id: 'n1', name: 'Aaa canto muy largo con varias palabras.pdf', path: 'Entrada' },
      { id: 'n2', name: 'Zzz.pdf', path: 'Entrada' },
    ],
    { momentLabels: MOMENT_LABELS, title: 'Ave María Arcadelt' },
  ), {}).map(o => o.id),
  ['n1', 'n2']);
check('sugiere la partitura que se llama como el título',
  suggestedMatch(buildFiles('Vienen con Alegría'))?.id, 'v1');
check('no sugiere cuando el título no está en Drive',
  suggestedMatch(buildFiles('Pescador de Hombres')), undefined);
check('entre las voces del mismo canto sugiere la partitura general, no una voz',
  suggestedMatch(buildFiles('Ave María Arcadelt'))?.id, 'a1');
check('dos archivos con el MISMO nombre en carpetas distintas no se sugieren',
  suggestedMatch(buildFileOptions(
    [
      { id: 'y1', name: 'Ave Maria.pdf', path: 'Comunion' },
      { id: 'y2', name: 'Ave Maria.pdf', path: 'Ofertorio' },
    ],
    { momentLabels: MOMENT_LABELS, title: 'Ave María' },
  )),
  undefined);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
