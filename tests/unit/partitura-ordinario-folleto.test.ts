/**
 * «Incluir la partitura del ordinario en el folleto» (src/utils/ordinary.ts).
 *
 * Pedido del 27-sep-2026: el coro elige en el constructor si el ordinario va con su
 * partitura o solo con la letra. La marca viaja en cada canto del ordinario, así que se
 * guarda con el cantoral y vuelve al editarlo.
 */
import { marcarPartituraOrdinario, llevaPartituraOrdinario } from '../../src/utils/ordinary';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const cantos = [
  { id: 'e', category: 'Entrada' },
  { id: 'k', category: 'Kyrie' },
  { id: 'g', category: 'Gloria' },
  { id: 'pn', category: 'Padre Nuestro' },
  { id: 'a', category: 'Amén (Doxología)' },
  { id: 'c', category: 'Comunión' },
];

const sinPartitura = marcarPartituraOrdinario(cantos, false);
check('solo el ordinario queda "solo letra"',
  sinPartitura.filter(s => s.folletoSoloLetra).map(s => s.id), ['k', 'g', 'pn', 'a']);
check('los demás cantos no se tocan', sinPartitura.find(s => s.id === 'e'), { id: 'e', category: 'Entrada' });
check('al editar se lee "sin partitura"', llevaPartituraOrdinario(sinPartitura), false);

const conPartitura = marcarPartituraOrdinario(sinPartitura, true);
check('volver a marcarla quita la marca', conPartitura.some(s => 'folletoSoloLetra' in s), false);
check('al editar se lee "con partitura"', llevaPartituraOrdinario(conPartitura), true);
check('un cantoral viejo (sin marca) lleva partitura', llevaPartituraOrdinario(cantos), true);
check('no cambia el largo ni el orden', conPartitura.map(s => s.id), cantos.map(s => s.id));

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
