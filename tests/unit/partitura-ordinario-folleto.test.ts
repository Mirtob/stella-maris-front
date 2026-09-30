/**
 * «Incluir la partitura en el folleto», por bloque del ordinario (src/utils/ordinary.ts).
 *
 * 27-sep-2026: el coro elige si el ordinario va con su partitura o solo con la letra.
 * 30-sep-2026: la elección se hace donde se elige cada bloque, y vale solo para él:
 *  · 'misa'         → Misa del catálogo (diálogo «Completar la Misa» del Kyrie).
 *  · 'gregoriano'   → Misa del Kyriale (su tarjeta).
 *  · 'padreNuestro' → Padre Nuestro y aclamaciones (su tarjeta).
 * La marca viaja en cada canto, así que se guarda con el cantoral y vuelve al editarlo.
 */
import { marcarPartituras, llevaPartitura, grupoDePartitura } from '../../src/utils/ordinary';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

type C = { id: string; category: string; lyrics?: string; folletoSoloLetra?: boolean };
const cantos: C[] = [
  { id: 'e', category: 'Entrada' },
  { id: 'k', category: 'Kyrie', lyrics: 'Señor, ten piedad' },
  { id: 'g', category: 'Gloria', lyrics: 'Gloria a Dios' },
  { id: 'kyriale-sanctus-2026-10-04', category: 'Santo', lyrics: '' },
  { id: 'kyriale-agnus-2026-10-04', category: 'Cordero de Dios', lyrics: '' },
  { id: 'pn', category: 'Padre Nuestro', lyrics: 'Padre nuestro' },
  { id: 'kyriale-pater-2026-10-04', category: 'Padre Nuestro', lyrics: '' },
  { id: 'a', category: 'Amén (Doxología)', lyrics: 'Amén' },
  { id: 'c', category: 'Comunión' },
];
const TODO = { misa: true, gregoriano: true, padreNuestro: true };
const soloLetra = (xs: C[]) => xs.filter(s => s.folletoSoloLetra).map(s => s.id);

console.log('\n== A qué bloque va cada parte ==');
check('Kyrie del catálogo → misa', grupoDePartitura(cantos[1]), 'misa');
check('Santo del Kyriale → gregoriano', grupoDePartitura(cantos[3]), 'gregoriano');
check('Padre Nuestro del Drive → padreNuestro', grupoDePartitura(cantos[5]), 'padreNuestro');
check('Padre Nuestro del Kyriale → padreNuestro (se elige en su tarjeta)', grupoDePartitura(cantos[6]), 'padreNuestro');
check('Amén → padreNuestro', grupoDePartitura(cantos[7]), 'padreNuestro');
check('la Entrada no es del ordinario', grupoDePartitura(cantos[0]), null);

console.log('\n== Cada casilla toca solo su bloque ==');
check('sin partitura de la Misa: solo Kyrie y Gloria',
  soloLetra(marcarPartituras(cantos, { ...TODO, misa: false })), ['k', 'g']);
check('sin partitura del gregoriano: solo el Kyriale',
  soloLetra(marcarPartituras(cantos, { ...TODO, gregoriano: false })),
  ['kyriale-sanctus-2026-10-04', 'kyriale-agnus-2026-10-04']);
check('sin partitura del Padre Nuestro: Padre Nuestro y aclamaciones',
  soloLetra(marcarPartituras(cantos, { ...TODO, padreNuestro: false })),
  ['pn', 'kyriale-pater-2026-10-04', 'a']);
check('los demás cantos no se tocan',
  marcarPartituras(cantos, { misa: false, gregoriano: false, padreNuestro: false }).find(s => s.id === 'e'),
  { id: 'e', category: 'Entrada' });

console.log('\n== El gregoriano sin partitura lleva el texto latino ==');
const greg = marcarPartituras(cantos, { ...TODO, gregoriano: false, padreNuestro: false });
check('el Sanctus tiene su texto', greg.find(s => s.id === 'kyriale-sanctus-2026-10-04')?.lyrics?.startsWith('Sanctus'), true);
check('el Pater del Kyriale tiene su texto', !!greg.find(s => s.id === 'kyriale-pater-2026-10-04')?.lyrics?.trim(), true);
check('la letra propia no se pisa', greg.find(s => s.id === 'pn')?.lyrics, 'Padre nuestro');

console.log('\n== Al editar se lee cada bloque ==');
const mezcla = marcarPartituras(cantos, { misa: false, gregoriano: true, padreNuestro: false });
check('misa: sin partitura', llevaPartitura(mezcla, 'misa'), false);
check('gregoriano: con partitura', llevaPartitura(mezcla, 'gregoriano'), true);
check('padreNuestro: sin partitura', llevaPartitura(mezcla, 'padreNuestro'), false);
const vuelta = marcarPartituras(mezcla, TODO);
check('volver a marcarla quita la marca', vuelta.some(s => 'folletoSoloLetra' in s), false);
check('un cantoral viejo (sin marca) lleva partitura', llevaPartitura(cantos, 'misa'), true);
check('no cambia el largo ni el orden', vuelta.map(s => s.id), cantos.map(s => s.id));

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
