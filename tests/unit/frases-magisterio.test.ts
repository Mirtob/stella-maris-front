/**
 * Frases del Magisterio de las pantallas de carga (src/data/frasesMagisterio.ts).
 *
 * Pedido del 27-sep-2026: entre 30 y 40 frases, de Tra le sollecitudini a la IGMR,
 * cortas para que se lean con calma en los ocho segundos que dura cada una.
 */
import { FRASES_MAGISTERIO } from '../../src/data/frasesMagisterio';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const n = FRASES_MAGISTERIO.length;
check(`entre 30 y 40 frases (hay ${n})`, n >= 30 && n <= 40, true);

// ~25 palabras se leen en unos 6 segundos a ritmo tranquilo; cada frase dura 8.
const largas = FRASES_MAGISTERIO.filter(f => f.texto.split(/\s+/).length > 25).map(f => f.texto);
check('ninguna pasa de 25 palabras', largas, []);
check('todas tienen fuente', FRASES_MAGISTERIO.every(f => f.fuente.trim().length > 0), true);
check('ninguna repetida', new Set(FRASES_MAGISTERIO.map(f => f.texto)).size, n);

const de = (doc: string) => FRASES_MAGISTERIO.some(f => f.fuente.includes(doc));
for (const doc of ['Tra le sollecitudini', 'Divini cultus', 'Musicae sacrae disciplina', 'Sacrosanctum Concilium',
  'Musicam sacram', 'Catecismo', 'Sacramentum caritatis', 'IGMR']) {
  check(`incluye ${doc}`, de(doc), true);
}

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
