/**
 * Catálogo de etiquetas de canto (src/utils/songTags.ts).
 *
 * Cubre la lista por defecto (el respaldo cuando la migración todavía no está
 * aplicada), la detección de duplicados y la regla de "la 1ª etiqueta es la
 * principal", que es la misma que usan las partes de la Misa.
 *
 * Se importa de `utils/` y no de `services/` a propósito: el servicio abre el
 * cliente de Supabase al importarse y estas pruebas corren sin base de datos.
 */
import {
  DEFAULT_SONG_TAGS, defaultSongTagRows, isPersistedTag, findDuplicate, type SongTag,
} from '../../src/utils/songTags';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Etiquetas nuevas pedidas ==');
for (const t of ['Domingo de Ramos', 'Funerales', 'Otros sacramentos', 'Fiestas patronales']) {
  check(`"${t}" está en la lista`, DEFAULT_SONG_TAGS.includes(t), true);
}

console.log('\n== La lista por defecto conserva las de antes ==');
for (const t of ['Adviento', 'Navidad', 'Tiempo Ordinario', 'Cuaresma', 'Semana Santa',
                 'Pascua', 'Pentecostés', 'Corpus Christi', 'Gregoriano', 'Secuencias']) {
  check(`"${t}" sigue estando`, DEFAULT_SONG_TAGS.includes(t), true);
}
check('sin duplicados en la lista por defecto',
  DEFAULT_SONG_TAGS.length, new Set(DEFAULT_SONG_TAGS.map(t => t.toLowerCase())).size);

console.log('\n== Filas por defecto (respaldo sin tabla) ==');
const rows = defaultSongTagRows();
check('una fila por etiqueta', rows.length, DEFAULT_SONG_TAGS.length);
check('conservan el orden', rows[0].label, DEFAULT_SONG_TAGS[0]);
check('las de respaldo NO son editables', rows.every(r => !isPersistedTag(r)), true);
check('una fila de la BD sí es editable',
  isPersistedTag({ id: '5f9b8c2e-0000-4000-8000-000000000000', label: 'x', sortOrder: 1 }), true);

console.log('\n== Duplicados ==');
const catalogo: SongTag[] = [
  { id: 'a', label: 'Funerales', sortOrder: 10 },
  { id: 'b', label: 'Gregoriano', sortOrder: 20 },
];
check('mismo nombre exacto', findDuplicate(catalogo, 'Funerales')?.id, 'a');
check('distinta caja', findDuplicate(catalogo, 'funerales')?.id, 'a');
check('con acento sobrante', findDuplicate(catalogo, 'Fúnerales')?.id, 'a');
check('con espacios de más', findDuplicate(catalogo, '  Funerales  ')?.id, 'a');
check('nombre nuevo no choca', findDuplicate(catalogo, 'Fiestas patronales'), undefined);
// Al renombrar, la propia etiqueta no debe contarse como duplicada de sí misma.
check('se excluye a sí misma al renombrar', findDuplicate(catalogo, 'Funerales', 'a'), undefined);

console.log('\n== Regla de la etiqueta principal (misma que las partes de la Misa) ==');
// El orden del arreglo ES la jerarquía: liturgical_seasons[0] es la principal y
// es lo que la app muestra como "la" temporada del canto.
const toggle = (list: string[], tag: string) =>
  list.includes(tag) ? list.filter(x => x !== tag) : [...list, tag];
const promote = (list: string[], tag: string) => [tag, ...list.filter(x => x !== tag)];

let seasons: string[] = [];
seasons = toggle(seasons, 'Funerales');
seasons = toggle(seasons, 'Domingo de Ramos');
seasons = toggle(seasons, 'Gregoriano');
check('la 1ª marcada es la principal', seasons[0], 'Funerales');
check('el resto queda en orden de elección', seasons, ['Funerales', 'Domingo de Ramos', 'Gregoriano']);

seasons = promote(seasons, 'Gregoriano');
check('ascender cambia la principal', seasons[0], 'Gregoriano');
check('ascender no pierde ninguna', seasons.length, 3);
check('ascender no duplica', new Set(seasons).size, 3);

seasons = toggle(seasons, 'Gregoriano');
check('desmarcar la principal asciende a la siguiente', seasons[0], 'Funerales');
check('quedan las otras dos', seasons, ['Funerales', 'Domingo de Ramos']);

seasons = toggle(seasons, 'Funerales');
seasons = toggle(seasons, 'Domingo de Ramos');
check('sin etiquetas = sirve para todas las temporadas', seasons, []);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallas\n`);
if (fail > 0) process.exit(1);
