/**
 * El Graduale Simplex, que no está organizado como el Romanum.
 *
 * El Romanum da un propio para CADA domingo. El Simplex da Misas para un TIEMPO entero
 * —ocho para el Tiempo Ordinario, dos para Adviento, dos para Pascua— y deja que el coro
 * escoja cuál canta ese día. Mientras esas Misas no se pudieron elegir, el Simplex sólo
 * servía en las celebraciones que el libro nombra una por una, y entre ellas no había ni
 * un domingo del Tiempo Ordinario: el botón "Todo el Simplex" no daba casi nada.
 *
 * Lo que se fija aquí:
 *  · Las Misas por tiempo existen y se pueden elegir.
 *  · Elegir una hace que el Simplex sirva un domingo cualquiera del Ordinario.
 *  · Pero el propio del día MANDA sobre la Misa del tiempo: en Corpus se canta el de
 *    Corpus, que para eso lo escribieron.
 *  · La Misa elegida se recupera al editar un cantoral publicado.
 */
import {
  misasDelTiempo, tiempoConMisasDelSimplex, rotuloMisaDelTiempo,
  resolveGraduale, librosDisponibles, hayPropios,
} from '../../src/data/gradualeIndex';
import { buildGradualeSong, misaDelTiempoDelCantoral } from '../../src/utils/gradualeSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const ORDINARIO = 'Tiempo Ordinario';
const DOMINGO_23 = '23.º Domingo del Tiempo Ordinario';

// ── Las Misas por tiempo ───────────────────────────────────────────────────
check('el Simplex da ocho Misas para el Tiempo Ordinario',
  misasDelTiempo(ORDINARIO).length, 8);
check('dos para Adviento', misasDelTiempo('Adviento').length, 2);
check('dos para Pascua', misasDelTiempo('Pascua').length, 2);
check('en Cuaresma no hay Misas sueltas: el libro trae los domingos por su nombre',
  misasDelTiempo('Cuaresma').length, 0);
check('un tiempo inventado no ofrece nada', misasDelTiempo('Verano'), []);
check('y se pregunta con una función, no adivinando',
  [tiempoConMisasDelSimplex(ORDINARIO), tiempoConMisasDelSimplex('Cuaresma')], [true, false]);
check('el rótulo se dice en castellano',
  rotuloMisaDelTiempo(misasDelTiempo(ORDINARIO)[2]), 'Misa III');

// ── Un domingo cualquiera del Ordinario ────────────────────────────────────
// Sin elegir Misa, el Simplex no tiene nada que ofrecer ese día: no es un fallo, es que
// el libro no trae un propio para el 23.º domingo.
check('sin Misa elegida, el Simplex no ofrece el 23.º domingo',
  resolveGraduale('simplex', DOMINGO_23, 'Entrada', { tiempo: ORDINARIO }), null);
check('el Romanum sí, porque él sí trae ese domingo',
  resolveGraduale('romanum', DOMINGO_23, 'Entrada')?.canto, 'introitus');

const misaIII = misasDelTiempo(ORDINARIO)[2].clave;
const conMisa = { tiempo: ORDINARIO, misaDelTiempo: misaIII };
check('elegida la Misa III, el Simplex ya sirve ese domingo',
  resolveGraduale('simplex', DOMINGO_23, 'Entrada', conMisa)?.misa, 'Missa III');
check('y la partitura sale de la carpeta de esa Misa',
  resolveGraduale('simplex', DOMINGO_23, 'Entrada', conMisa)?.imagen.includes(misaIII), true);
check('ahora los dos libros están disponibles para esa parte',
  librosDisponibles(DOMINGO_23, 'Entrada', conMisa), ['romanum', 'simplex']);
check('sin elegir Misa, sólo el Romanum',
  librosDisponibles(DOMINGO_23, 'Entrada', { tiempo: ORDINARIO }), ['romanum']);

// ── El propio del día manda sobre la Misa del tiempo ───────────────────────
// Corpus tiene Misa propia en el Simplex. Aunque el coro haya elegido la Misa III para
// el tiempo, ese día se canta la de Corpus: para eso está escrita.
check('en Corpus manda el propio del día, no la Misa elegida',
  resolveGraduale('simplex', 'Corpus Christi', 'Entrada', conMisa)?.misa,
  'SS.mi Corporis et Sanguinis Christi');

// ── Lo que el libro comparte entre dos domingos ────────────────────────────
// El Simplex titula "Dominica II & III" una sola Misa para los dos domingos. Antes el
// 3.º de Cuaresma se quedaba sin Simplex, no por falta de música sino porque nadie le
// había dicho que era la misma.
check('el 2.º de Cuaresma tiene Simplex',
  resolveGraduale('simplex', '2.º Domingo de Cuaresma', 'Entrada') !== null, true);
check('y el 3.º también, con la misma Misa',
  resolveGraduale('simplex', '3.º Domingo de Cuaresma', 'Entrada')?.misa,
  resolveGraduale('simplex', '2.º Domingo de Cuaresma', 'Entrada')?.misa);

// ── El santoral ────────────────────────────────────────────────────────────
// Doce solemnidades que el Simplex trae completas y que no se emparejaban con nada.
check('la Asunción tiene propio en el Simplex',
  resolveGraduale('simplex', 'Asunción de la Virgen María', 'Entrada') !== null, true);
check('Todos los Santos también',
  resolveGraduale('simplex', 'Todos los Santos', 'Comunión') !== null, true);
check('y San Pedro y San Pablo',
  resolveGraduale('simplex', 'San Pedro y San Pablo, Apóstoles', 'Ofertorio') !== null, true);

// ── El canto que viaja al cantoral ─────────────────────────────────────────
const canto = buildGradualeSong('2026-09-06', DOMINGO_23, 'Entrada', 'simplex', conMisa);
check('se arma con la Misa elegida', canto?.gradualeFuente?.includes('Graduale Simplex'), true);
check('y se recupera al editar el cantoral publicado',
  misaDelTiempoDelCantoral([canto!], '2026-09-06'), misaIII);
check('otra fecha no cuenta', misaDelTiempoDelCantoral([canto!], '2026-09-13'), null);

// ── El atajo del encabezado ────────────────────────────────────────────────
check('hay gregoriano ese domingo aunque no se elija Misa (por el Romanum)',
  hayPropios(DOMINGO_23, { tiempo: ORDINARIO }), true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);
