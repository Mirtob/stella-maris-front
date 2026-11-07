/**
 * Un canto con varias etiquetas de parte (src/utils/cantoralParts.ts).
 *
 * Pedido del 4-nov-2026 (reemplaza al del 24-ago, que lo dejaba libre en sus otras
 * partes): en UNA Misa un canto va una sola vez; elegido de Entrada, queda bloqueado
 * en el resto de esa Misa. De una Misa a la siguiente rota: lo que fue la Entrada no
 * vuelve a ser la Entrada, pero sí el Ofertorio o la Comunión. Además se sugiere
 * primero en su etiqueta principal.
 */
import type { Song } from '../../src/types';
import { estaEnParte, partesUsadas, rangoSugerencia, ordenarSugerencias, usadoEnLaMisa } from '../../src/utils/cantoralParts';
import { computeUsage, bloqueadoPorLaAnterior, previousUseOf } from '../../src/utils/previousUsage';
import type { PublishedCantoral } from '../../src/types';

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
check('usado ya en otra parte de la Misa, ya no se sugiere',
  ordenarSugerencias([akathistos, canto('otro', 'Comunión', 'comunion')], 'Comunión', 'comunion', enEntrada)
    .map(s => s.id),
  ['otro']);
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

console.log('\n== Una sola vez por Misa ==');
check('elegido de Entrada, queda usado en la Misa', usadoEnLaMisa(enEntrada, 'akathistos'), true);
check('otro canto no', usadoEnLaMisa(enEntrada, 'solo-entrada'), false);
check('la copia con sufijo («id::aclamacion») es el mismo canto',
  usadoEnLaMisa([canto('akathistos::elevacion-1', 'Elevación')], 'akathistos'), true);

console.log('\n== Rota de una Misa a la siguiente ==');
const misa = (id: string, date: string, songs: Song[]): PublishedCantoral =>
  ({ id, date, status: 'published', songs, liturgicalDate: '' } as unknown as PublishedCantoral);
const domingo1 = misa('d1', '2026-11-01', [EN_PARTE(akathistos, 'Entrada'), EN_PARTE(soloEntrada, 'Salida')]);
const uso = computeUsage([domingo1], { todayYmd: '2026-11-04', massYmd: '2026-11-08' });
check('fue la Entrada → bloqueado de Entrada', bloqueadoPorLaAnterior(uso, 'akathistos', 'Entrada'), true);
check('…pero libre de Comunión', bloqueadoPorLaAnterior(uso, 'akathistos', 'Comunión'), false);
check('…y de Ofertorio', bloqueadoPorLaAnterior(uso, 'akathistos', 'Ofertorio'), false);
check('fue la Salida → bloqueado de Salida', bloqueadoPorLaAnterior(uso, 'solo-entrada', 'Salida'), true);
check('el ordinario no rota (el Kyrie se mantiene)',
  bloqueadoPorLaAnterior(computeUsage([misa('k', '2026-11-01', [canto('kyrie-x', 'Kyrie')])],
    { todayYmd: '2026-11-04', massYmd: '2026-11-08' }), 'kyrie-x', 'Kyrie'), false);
check('el aviso ya no cuenta la Misa anterior',
  previousUseOf(uso, 'akathistos')?.occ.filter(o => !o.anterior).length, 0);
const dosAntes = misa('d0', '2026-10-25', [EN_PARTE(akathistos, 'Comunión')]);
const uso2 = computeUsage([dosAntes, domingo1], { todayYmd: '2026-11-04', massYmd: '2026-11-08' });
check('solo bloquea la Misa INMEDIATAMENTE anterior',
  bloqueadoPorLaAnterior(uso2, 'akathistos', 'Comunión'), false);
check('…la de hace dos semanas sigue solo avisando',
  previousUseOf(uso2, 'akathistos')?.occ.filter(o => !o.anterior).map(o => o.parts), [['Comunión']]);
const mismoDia = misa('d8', '2026-11-08', [EN_PARTE(akathistos, 'Comunión')]);
check('otra Misa del mismo día no cuenta como la anterior',
  bloqueadoPorLaAnterior(computeUsage([domingo1, mismoDia], { todayYmd: '2026-11-08', massYmd: '2026-11-08' }),
    'akathistos', 'Comunión'), false);
check('editando la Misa anterior, no se bloquea contra sí misma',
  bloqueadoPorLaAnterior(computeUsage([domingo1], { todayYmd: '2026-11-04', massYmd: '2026-11-01', excludeId: 'd1' }),
    'akathistos', 'Entrada'), false);
check('sin Misa anterior, nada bloqueado',
  bloqueadoPorLaAnterior(computeUsage([], { todayYmd: '2026-11-04', massYmd: '2026-11-08' }), 'akathistos', 'Entrada'), false);

console.log('\n== Cada parroquia rota por su cuenta ==');
const enParroquia = (c: PublishedCantoral, parishName: string) => ({ ...c, parishName }) as PublishedCantoral;
const pirque = enParroquia(misa('p1', '2026-11-07', [EN_PARTE(soloEntrada, 'Salida')]), 'Parroquia Pirque - Diócesis X');
const valdivia = enParroquia(misa('v1', '2026-11-01', [EN_PARTE(akathistos, 'Salida')]), 'Parroquia Valdivia - Diócesis X');
const usoValdivia = computeUsage([pirque, valdivia],
  { todayYmd: '2026-11-07', massYmd: '2026-11-08', parroquia: 'parroquia valdivia - diócesis x ' });
check('la Salida publicada en otra parroquia no bloquea',
  bloqueadoPorLaAnterior(usoValdivia, 'solo-entrada', 'Salida'), false);
check('la anterior es la de ESTA parroquia, aunque haya otra más reciente',
  bloqueadoPorLaAnterior(usoValdivia, 'akathistos', 'Salida'), true);
check('en la misma parroquia sí bloquea',
  bloqueadoPorLaAnterior(computeUsage([pirque, valdivia],
    { todayYmd: '2026-11-07', massYmd: '2026-11-08', parroquia: 'Parroquia Pirque - Diócesis X' }), 'solo-entrada', 'Salida'), true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
