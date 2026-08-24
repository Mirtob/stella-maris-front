/**
 * Sugerencias por tiempo litúrgico (src/utils/songSeason.ts).
 *
 * Regresión del fallo reportado el 24-ago-2026: estando en Tiempo Ordinario, el
 * carrusel de "cantos recomendados" ofrecía cantos de Navidad.
 *
 * Eran dos errores encadenados: filtraba por `song.tags` —campo que viene de YouTube y
 * que el catálogo real no llena— y, al no encontrar nada, RELLENABA la lista con los
 * primeros cantos del catálogo, fueran del tiempo que fueran.
 *
 * Las pruebas fijan la regla con las rarezas del catálogo de producción: 23 de 52
 * cantos no llevan temporada (sirven todo el año), las etiquetas se escriben a mano
 * ("Tiempo Ordinario" y "tiempo-ordinario" conviven) y hay etiquetas TEMÁTICAS
 * (Virgen María, Gregoriano) que no atan a ninguna época.
 */
import { songMatchesSeason, songSeasons, seasonOfTag } from '../../src/utils/songSeason';
import type { Song } from '../../src/types';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const canto = (over: Partial<Song> = {}): Song => ({
  id: 'x', title: 'Canto', category: 'Entrada', youtubeId: '', duration: '3:00', ...over,
} as Song);
const conTemporadas = (...t: string[]) => canto({ liturgicalSeasons: t as any });

console.log('\n== El caso reportado ==');
check('un canto de Navidad NO se sugiere en Tiempo Ordinario',
  songMatchesSeason(conTemporadas('Navidad'), 'Tiempo Ordinario'), false);
check('…y sí se sugiere en Navidad',
  songMatchesSeason(conTemporadas('Navidad'), 'Navidad'), true);

console.log('\n== Sin etiquetas = sirve para todo el año ==');
check('sin temporadas, en Tiempo Ordinario', songMatchesSeason(canto(), 'Tiempo Ordinario'), true);
check('sin temporadas, en Cuaresma', songMatchesSeason(canto(), 'Cuaresma'), true);
check('array vacío cuenta como sin temporadas', songMatchesSeason(conTemporadas(), 'Adviento'), true);

console.log('\n== Cómo se escriben de verdad las etiquetas ==');
check('"tiempo-ordinario" vale igual que "Tiempo Ordinario"',
  songMatchesSeason(conTemporadas('tiempo-ordinario'), 'Tiempo Ordinario'), true);
check('"Ordinario" a secas también',
  songMatchesSeason(conTemporadas('Ordinario'), 'Tiempo Ordinario'), true);
check('mayúsculas y acentos no importan',
  songMatchesSeason(conTemporadas('CUARESMA'), 'Cuaresma'), true);
check('espacios de sobra tampoco',
  songMatchesSeason(conTemporadas('  Pascua  '), 'Pascua'), true);

console.log('\n== Varias etiquetas por canto ==');
const marianoOrdinario = conTemporadas('Tiempo Ordinario', 'Virgen María');
check('basta con que una calce', songMatchesSeason(marianoOrdinario, 'Tiempo Ordinario'), true);
check('si ninguna calza, no se sugiere', songMatchesSeason(marianoOrdinario, 'Adviento'), false);
check('una fiesta de otro tiempo no cuela',
  songMatchesSeason(conTemporadas('Jueves Santo'), 'Pascua'), false);

console.log('\n== Temáticas: no atan a ninguna época ==');
// El error contrario al reportado: descartar un Ave María en Tiempo Ordinario por
// llevar "Virgen María", que es una temática y no un tiempo.
check('"Virgen María" se canta en Tiempo Ordinario',
  songMatchesSeason(conTemporadas('Virgen María'), 'Tiempo Ordinario'), true);
check('"Virgen María" también en Cuaresma',
  songMatchesSeason(conTemporadas('Virgen María'), 'Cuaresma'), true);
check('"Gregoriano" no ata', songMatchesSeason(conTemporadas('Gregoriano'), 'Adviento'), true);
check('"Funerales" no ata', songMatchesSeason(conTemporadas('Funerales'), 'Pascua'), true);
check('una etiqueta nueva del admin no esconde el canto',
  songMatchesSeason(conTemporadas('Aniversario de la parroquia'), 'Navidad'), true);
check('temática + tiempo: manda el tiempo',
  songMatchesSeason(conTemporadas('Virgen María', 'Adviento'), 'Tiempo Ordinario'), false);

console.log('\n== Días y solemnidades: a qué tiempo pertenecen ==');
check('Domingo de Ramos es Cuaresma', seasonOfTag('Domingo de Ramos'), 'Cuaresma');
check('Vigilia Pascual ya es Pascua', seasonOfTag('Vigilia Pascual'), 'Pascua');
check('Pentecostés cierra la Pascua', seasonOfTag('Pentecostés'), 'Pascua');
check('Corpus Christi es del Tiempo Ordinario', seasonOfTag('Corpus Christi'), 'Tiempo Ordinario');
check('Cristo Rey también', seasonOfTag('Cristo Rey'), 'Tiempo Ordinario');
check('Inmaculada Concepción cae en Adviento', seasonOfTag('Inmaculada Concepción'), 'Adviento');
check('"Virgen María" no ata a ningún tiempo', seasonOfTag('Virgen María'), null);
check('un canto de Corpus se sugiere en Tiempo Ordinario',
  songMatchesSeason(conTemporadas('Corpus Christi'), 'Tiempo Ordinario'), true);
check('uno de Semana Santa, no',
  songMatchesSeason(conTemporadas('Semana Santa'), 'Tiempo Ordinario'), false);

console.log('\n== Campo antiguo (liturgicalSeason, en singular) ==');
check('el campo viejo se sigue leyendo',
  songMatchesSeason(canto({ liturgicalSeason: 'Adviento' }), 'Adviento'), true);
check('y separado por comas',
  songMatchesSeason(canto({ liturgicalSeason: 'Navidad, Adviento' }), 'Adviento'), true);
check('el array nuevo manda sobre el viejo',
  songMatchesSeason(canto({ liturgicalSeasons: ['Cuaresma'] as any, liturgicalSeason: 'Navidad' }), 'Navidad'), false);

console.log('\n== Lectura de las etiquetas ==');
check('songSeasons limpia espacios', songSeasons(conTemporadas(' Pascua ', 'Cuaresma')), ['Pascua', 'Cuaresma']);
check('songSeasons ignora vacíos', songSeasons(conTemporadas('Pascua', '', '  ')), ['Pascua']);
check('sin nada, lista vacía', songSeasons(canto()), []);

console.log('\n== Un catálogo como el real ==');
// 23 sin temporada + 18 de Tiempo Ordinario + 2 mal escritos + 1 de Navidad
// + 7 de Cuaresma + 6 marianos.
const catalogo: Song[] = [
  ...Array.from({ length: 23 }, (_, i) => canto({ id: `libre-${i}` })),
  ...Array.from({ length: 18 }, (_, i) => canto({ id: `to-${i}`, liturgicalSeasons: ['Tiempo Ordinario'] as any })),
  ...Array.from({ length: 2 }, (_, i) => canto({ id: `to-mal-${i}`, liturgicalSeasons: ['tiempo-ordinario'] as any })),
  canto({ id: 'navidad-1', title: 'Adeste fideles', liturgicalSeasons: ['Navidad'] as any }),
  ...Array.from({ length: 7 }, (_, i) => canto({ id: `cuar-${i}`, liturgicalSeasons: ['Cuaresma'] as any })),
  ...Array.from({ length: 6 }, (_, i) => canto({ id: `maria-${i}`, liturgicalSeasons: ['Virgen María'] as any })),
];
const enOrdinario = catalogo.filter(s => songMatchesSeason(s, 'Tiempo Ordinario'));
check('en Tiempo Ordinario se ofrecen 49 (23 libres + 20 del tiempo + 6 marianos)', enOrdinario.length, 49);
check('los marianos siguen disponibles', enOrdinario.filter(s => s.id.startsWith('maria-')).length, 6);
check('ninguno es de Navidad', enOrdinario.some(s => s.id === 'navidad-1'), false);
check('ninguno es de Cuaresma', enOrdinario.some(s => s.id.startsWith('cuar-')), false);
check('las cuatro primeras sugerencias son del tiempo correcto',
  enOrdinario.slice(0, 4).every(s => songMatchesSeason(s, 'Tiempo Ordinario')), true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
