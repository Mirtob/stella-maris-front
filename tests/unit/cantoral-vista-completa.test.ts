/**
 * Que el cantoral publicado muestre EXACTAMENTE lo que el coro seleccionó.
 *
 * Reportado el 29-ago-2026, día del lanzamiento: "publiqué un cantoral y no me mostró
 * los mismos cantos que había seleccionado". Dos causas, las dos aquí cubiertas:
 *
 *  1. La guía "Ver Ordinario" buscaba UN canto por parte (`.find`), así que de tres
 *     cantos de Comunión se veía uno solo.
 *  2. Cada vista (lista, QR, folleto PDF) tenía su propia lista de orden, incompleta.
 *     Al ordenar con `indexOf`, una parte que no estuviera en ella daba -1 y saltaba
 *     ARRIBA DE TODO: la Salida antes de la Entrada.
 *
 * Y de paso: el salmo del libro no debe viajar en una copia (lleva la fecha vieja).
 */
import type { Song } from '../../src/types';
import { groupSongsByMassPart, sortCategoriesByMassOrder, massRank } from '../../src/utils/ordinary';
import { songsForBuilder, isBookPsalm } from '../../src/utils/psalmSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const canto = (id: string, category: string): Song =>
  ({ id, title: id, category } as unknown as Song);

// ── 1. Ninguna parte pierde cantos ────────────────────────────────────────
console.log('\n== Todas las partes muestran TODOS sus cantos ==');

// El cantoral real del 30-ago-2026 (Santuario Inmaculada Concepción): dos comuniones.
const cantoralReal = [
  canto('entrada', 'Entrada'),
  canto('kyrie', 'Kyrie'),
  canto('santo', 'Santo'),
  canto('cordero', 'Cordero de Dios'),
  canto('gloria', 'Gloria'),
  canto('aleluya', 'Aleluya'),
  canto('ofertorio', 'Ofertorio'),
  canto('comunion-1', 'Comunión'),
  canto('comunion-2', 'Comunión'),
  canto('salida', 'Salida'),
  canto('salmo', 'Salmo'),
];

const agrupado = groupSongsByMassPart(cantoralReal);
const comunion = agrupado.find(g => g.category === 'Comunión');
check('las dos comuniones llegan a la vista', comunion?.songs.map(s => s.id), ['comunion-1', 'comunion-2']);
check('no se pierde ningún canto', agrupado.reduce((n, g) => n + g.songs.length, 0), cantoralReal.length);
check('tres comuniones también', groupSongsByMassPart([
  canto('c1', 'Comunión'), canto('c2', 'Comunión'), canto('c3', 'Comunión'),
])[0].songs.length, 3);

// ── 2. Orden litúrgico ────────────────────────────────────────────────────
console.log('\n== Orden de las partes ==');
check('Misa normal en orden', agrupado.map(g => g.category), [
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Ofertorio', 'Santo',
  'Cordero de Dios', 'Comunión', 'Salida',
]);

// El rótulo de Cuaresma ("Aclamación al Evangelio") no estaba en las listas locales.
check('Cuaresma: la Aclamación va en el lugar del Aleluya', sortCategoriesByMassOrder(
  ['Salida', 'Aclamación al Evangelio', 'Entrada', 'Comunión'],
), ['Entrada', 'Aclamación al Evangelio', 'Comunión', 'Salida']);

// Pascua: el Rito de Aspersión reemplaza al Kyrie, en su mismo lugar.
check('Pascua: la aspersión va tras la Entrada', sortCategoriesByMassOrder(
  ['Comunión', 'Rito de Aspersión', 'Entrada'],
), ['Entrada', 'Rito de Aspersión', 'Comunión']);

// Vigilia Pascual: el orden propio del oficio (Pregón → salmos AT → Gloria → Epístola).
check('Vigilia Pascual en su orden', sortCategoriesByMassOrder(
  ['Comunión', 'Aleluya Triple', 'Gloria', 'Salmo AT 2', 'Pregón Pascual', 'Salmo AT 1', 'Salmo Epistolar'],
), ['Pregón Pascual', 'Salmo AT 1', 'Salmo AT 2', 'Gloria', 'Salmo Epistolar', 'Aleluya Triple', 'Comunión']);

check('la Secuencia va antes del Aleluya', massRank('Secuencia de Pascua') < massRank('Aleluya'), true);
check('la Kalenda abre la Misa de Nochebuena', sortCategoriesByMassOrder(['Entrada', 'Kalenda Navideña'])[0], 'Kalenda Navideña');

// Lo que no se reconoce va AL FINAL, nunca antes de la Entrada (era el bug).
check('una parte desconocida va al final', sortCategoriesByMassOrder(
  ['Comunión', 'Parte Inventada', 'Entrada'],
), ['Entrada', 'Comunión', 'Parte Inventada']);
check('rango de una parte desconocida', massRank('Parte Inventada') > massRank('Salida'), true);

// ── 3. El salmo del libro no viaja en una copia ───────────────────────────
console.log('\n== Copiar un cantoral no arrastra el salmo del domingo viejo ==');
const publicado = [canto('entrada', 'Entrada'), canto('psalm-2026-08-30', 'Salmo')];
check('reconoce el salmo del libro', isBookPsalm(publicado[1]), true);
check('un salmo del catálogo NO se descarta', isBookPsalm(canto('abc-123', 'Salmo')), false);
check('la copia llega al constructor sin el salmo viejo', songsForBuilder(publicado).map(s => s.id), ['entrada']);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
