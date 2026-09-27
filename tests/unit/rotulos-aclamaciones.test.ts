/**
 * Rótulos de las aclamaciones y del Padre Nuestro (src/utils/ordinary.ts).
 *
 * Pedido del 27-sep-2026: las aclamaciones son universales, no pertenecen a una Misa
 * ("Reunidos en su nombre"…). Deben mostrarse con su nombre genérico, también en los
 * cantorales que ya se publicaron con el nombre de la Misa en el título.
 */
import { rotuloDeParte, tituloVisible } from '../../src/utils/ordinary';
import { construirAclamacion, construirPadreNuestro } from '../../src/utils/padreNuestroYAclamaciones';
import { ACLAMACIONES } from '../../src/data/aclamaciones';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Rótulo de la parte ==');
check('oración universal', rotuloDeParte('Respuesta a Oración Universal'), 'Oración universal');
check('consagración', rotuloDeParte('Aclamación Consagración'), 'Aclamación post consagración');
check('amén', rotuloDeParte('Amén (Doxología)'), 'Triple amén (Aclamación doxología)');
check('padre nuestro', rotuloDeParte('Padre Nuestro'), 'Padre nuestro');
check('las demás partes no cambian', rotuloDeParte('Kyrie'), 'Kyrie');

console.log('\n== Sin el nombre de la Misa ==');
const MISA = 'Misa Reunidos en su nombre Palazon';
for (const a of ACLAMACIONES) {
  const t = tituloVisible(construirAclamacion(a, MISA, []));
  check(`${a.id}: sin autor`, t.author, undefined);
  check(`${a.id}: no dice la Misa`, t.title.includes('Reunidos'), false);
}
// Un cantoral publicado antes del arreglo: el título y el autor guardados traían la Misa.
check('publicado antes: se corrige al mostrarlo',
  tituloVisible({ id: 'aclamacion-amen-1758900000000', title: 'Triple Amén', author: MISA, category: 'Amén (Doxología)' }),
  { title: 'Triple amén (Aclamación doxología)' });
check('Padre Nuestro viejo («Padre Nuestro (Misa)»)',
  tituloVisible({ id: 'padre-nuestro-es-1758900000000', title: 'Padre Nuestro', author: 'Misa', category: 'Padre Nuestro' }),
  { title: 'Padre nuestro' });
check('Pater noster', tituloVisible(construirPadreNuestro('la', [])), { title: 'Pater noster' });
check('un canto del catálogo conserva su autor',
  tituloVisible({ id: 'uuid-1', title: 'Señor, ten piedad', author: 'Nebreda', category: 'Kyrie' }),
  { title: 'Señor, ten piedad', author: 'Nebreda' });

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
