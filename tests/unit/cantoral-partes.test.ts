/**
 * Un canto con varias etiquetas de parte (src/utils/cantoralParts.ts).
 *
 * Pedido el 24-ago-2026: si un canto sirve para Entrada, Comunión y Salida y se elige
 * como Entrada, debe quedar bloqueado SOLO en Entrada y seguir disponible en las demás,
 * hasta usarlo en todas. Además se sugiere primero en su etiqueta principal.
 */
import type { Song } from '../../src/types';
import { estaEnParte, partesUsadas, rangoSugerencia, ordenarSugerencias } from '../../src/utils/cantoralParts';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Canto mínimo: lo que mira la regla es id, category y massMoment. */
const canto = (id: string, category: string, massMoment?: string): Song =>
  ({ id, title: id, category, massMoment } as unknown as Song);

const EN_PARTE = (s: Song, parte: string): Song => ({ ...s, category: parte });

// Akathistos, el caso real: principal Comunión, además Entrada y Ofertorio.
const akathistos = canto('akathistos', 'Comunión', 'comunion');
// Canto que solo sirve para Entrada.
const soloEntrada = canto('solo-entrada', 'Entrada', 'entrada');

console.log('\n== Ocupado por parte, no por canto ==');
const enEntrada = [EN_PARTE(akathistos, 'Entrada')];
check('bloqueado en la parte donde se usó', estaEnParte(enEntrada, 'akathistos', 'Entrada'), true);
check('libre en Comunión', estaEnParte(enEntrada, 'akathistos', 'Comunión'), false);
check('libre en Ofertorio', estaEnParte(enEntrada, 'akathistos', 'Ofertorio'), false);
check('un canto ajeno no se ve afectado', estaEnParte(enEntrada, 'solo-entrada', 'Entrada'), false);
check('cantoral vacío: nada bloqueado', estaEnParte([], 'akathistos', 'Entrada'), false);

console.log('\n== El ciclo se recorre hasta agotar las etiquetas ==');
const enDos = [EN_PARTE(akathistos, 'Entrada'), EN_PARTE(akathistos, 'Comunión')];
check('las dos usadas quedan bloqueadas',
  [estaEnParte(enDos, 'akathistos', 'Entrada'), estaEnParte(enDos, 'akathistos', 'Comunión')], [true, true]);
check('la que queda sigue libre', estaEnParte(enDos, 'akathistos', 'Ofertorio'), false);

console.log('\n== Aviso «Ya en …» ==');
check('sin usar en ninguna otra parte', partesUsadas(enEntrada, 'akathistos', 'Entrada'), []);
check('visto desde Comunión, avisa Entrada', partesUsadas(enEntrada, 'akathistos', 'Comunión'), ['Entrada']);
check('visto desde Ofertorio con dos usos',
  partesUsadas(enDos, 'akathistos', 'Ofertorio'), ['Entrada', 'Comunión']);
check('no se avisa a sí mismo', partesUsadas(enDos, 'akathistos', 'Entrada'), ['Comunión']);

console.log('\n== Sugerencia preferente en la etiqueta principal ==');
check('principal y sin usar: primero', rangoSugerencia(akathistos, 'Comunión', 'comunion', []), 0);
check('principal pero ya usado en otra parte', rangoSugerencia(akathistos, 'Comunión', 'comunion', enEntrada), 1);
check('secundaria y sin usar', rangoSugerencia(akathistos, 'Ofertorio', 'ofertorio', []), 2);
check('secundaria y ya usado en otra', rangoSugerencia(akathistos, 'Ofertorio', 'ofertorio', enEntrada), 3);
check('la parte principal se reconoce por el momento aunque el rótulo cambie',
  rangoSugerencia(canto('x', 'Aclamación al Evangelio', 'aleluya'), 'Aleluya', 'aleluya', []), 0);

console.log('\n== Orden de las sugerencias ==');
const catalogo = [akathistos, soloEntrada];
check('en Entrada se ofrece antes el canto propio de Entrada',
  ordenarSugerencias(catalogo, 'Entrada', 'entrada', []).map(s => s.id),
  ['solo-entrada', 'akathistos']);
check('el ya usado en esta parte desaparece de las sugerencias',
  ordenarSugerencias(catalogo, 'Entrada', 'entrada', [EN_PARTE(soloEntrada, 'Entrada')]).map(s => s.id),
  ['akathistos']);
check('en Comunión manda su etiqueta principal',
  ordenarSugerencias(catalogo, 'Comunión', 'comunion', []).map(s => s.id),
  ['akathistos', 'solo-entrada']);
check('usado ya en otra parte, cede el turno a los que no se han usado',
  ordenarSugerencias([akathistos, canto('otro', 'Comunión', 'comunion')], 'Comunión', 'comunion', enEntrada)
    .map(s => s.id),
  ['otro', 'akathistos']);
check('estable: mismo rango conserva el orden de entrada',
  ordenarSugerencias(
    [canto('a', 'Comunión', 'comunion'), canto('b', 'Comunión', 'comunion'), canto('c', 'Comunión', 'comunion')],
    'Comunión', 'comunion', []).map(s => s.id),
  ['a', 'b', 'c']);
check('catálogo vacío', ordenarSugerencias([], 'Entrada', 'entrada', []), []);

console.log('\n== Comunión admite varios cantos distintos ==');
const dosEnComunion = [EN_PARTE(canto('a', 'Comunión', 'comunion'), 'Comunión'), EN_PARTE(akathistos, 'Comunión')];
check('cada uno bloquea solo lo suyo',
  [estaEnParte(dosEnComunion, 'a', 'Comunión'), estaEnParte(dosEnComunion, 'akathistos', 'Comunión'),
   estaEnParte(dosEnComunion, 'akathistos', 'Entrada')],
  [true, true, false]);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
