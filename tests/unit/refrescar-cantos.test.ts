/**
 * La letra del folleto es la de HOY (src/utils/refrescarCantos.ts).
 *
 * HU del 24-sep-2026: el coro corrigió la letra de varios cantos y el folleto ya
 * publicado seguía imprimiendo la vieja. La causa: `published_cantorals.songs` guarda una
 * COPIA de cada canto —para que el cantoral abra aunque el canto se borre del catálogo—,
 * y esa copia nunca se ponía al día.
 *
 * Lo que se refresca es solo lo que el folleto imprime. Lo que NO se toca:
 *  · la CATEGORÍA, que la decide el cantoral y no el catálogo;
 *  · los cantos SINTÉTICOS (salmo del libro, propios del Graduale, antífonas), que no
 *    están en el catálogo;
 *  · los cantos BORRADOS del catálogo, que conservan su copia — para eso se guardó.
 */
import { refrescarCantos, idDeCatalogo } from '../../src/utils/refrescarCantos';
import type { Song } from '../../src/types';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const canto = (extra: Partial<Song> = {}): Song => ({
  id: 's1', title: 'Hija de Sion', category: 'Entrada',
  youtubeId: 'abc', duration: '3:20', lyrics: 'letra vieja', ...extra,
});

console.log('\n== El id del catalogo ==');
check('un canto normal es su propio id', idDeCatalogo('s1'), 's1');
check('uno multi-parte pierde la parte', idDeCatalogo('s1::comunion'), 's1');
check('solo el primer separador cuenta', idDeCatalogo('s1::a::b'), 's1');
check('vacio no rompe', idDeCatalogo(''), '');

console.log('\n== Se pone al dia lo que se imprime ==');
const catalogo = [canto({ lyrics: 'letra corregida', title: 'Hija de Sion', author: 'L. Deiss' })];
check('la letra se actualiza',
  refrescarCantos([canto()], catalogo)[0].lyrics, 'letra corregida');
check('el titulo y el autor tambien',
  refrescarCantos([canto()], catalogo)[0].author, 'L. Deiss');
check('y de donde sale la partitura',
  refrescarCantos([canto()], [canto({ driveFileId: 'NUEVO' })])[0].driveFileId, 'NUEVO');
// Si se le quita el autor a un canto, el folleto tiene que dejar de imprimirlo.
check('vaciar un campo en el catalogo TAMBIEN se propaga',
  refrescarCantos([canto({ author: 'viejo' })], [canto({ author: undefined })])[0].author, undefined);

// Arreglar la grafia de una Misa tiene que llegar a los cantorales ya publicados: es
// con mass_name con lo que el folleto busca la partitura en Drive.
check('la Misa a la que pertenece la parte tambien se actualiza',
  refrescarCantos([canto({ massName: 'Nebreda (Do mayor)' })],
                  [canto({ massName: 'Misa Nebreda' })])[0].massName,
  'Misa Nebreda');

console.log('\n== Lo que no se toca ==');
check('la categoria la decide el cantoral, no el catalogo',
  refrescarCantos([canto({ category: 'Comunión' })], [canto({ category: 'Entrada' })])[0].category,
  'Comunión');
check('un canto multi-parte se refresca igual, conservando su parte',
  refrescarCantos([canto({ id: 's1::comunion', category: 'Comunión' })], catalogo)[0],
  { ...canto({ id: 's1::comunion', category: 'Comunión' }), lyrics: 'letra corregida',
    author: 'L. Deiss', artist: undefined, originalKey: undefined, driveFileId: undefined,
    driveFolderId: undefined, sheetMusicUrl: undefined, sheets: undefined });
check('un canto sintetico se queda como estaba',
  refrescarCantos([canto({ id: 'salmo-2026-09-27', lyrics: 'antifona del libro' })], catalogo)[0].lyrics,
  'antifona del libro');
check('un canto borrado del catalogo conserva su copia',
  refrescarCantos([canto({ id: 'ya-no-existe' })], catalogo)[0].lyrics, 'letra vieja');

console.log('\n== Nunca se pierde ni se reordena nada ==');
const tres = [canto({ id: 'a' }), canto({ id: 'salmo-x' }), canto({ id: 'b' })];
check('mismo largo y mismo orden',
  refrescarCantos(tres, catalogo).map((s) => s.id), ['a', 'salmo-x', 'b']);
check('sin catalogo se devuelve tal cual',
  refrescarCantos(tres, []).map((s) => s.lyrics), ['letra vieja', 'letra vieja', 'letra vieja']);
check('un cantoral vacio no rompe', refrescarCantos([], catalogo), []);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
