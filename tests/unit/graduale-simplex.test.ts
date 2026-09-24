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
  misasDelTiempo, tiempoConMisasDelSimplex, rotuloMisaDelTiempo, alternativasDelDia,
  resolveGraduale, librosDisponibles, hayPropios, archivoDelCanto,
} from '../../src/data/gradualeIndex';
import { getSundayCycle } from '../../src/utils/liturgicalCycle';
import { buildGradualeSong, misasDelCantoral } from '../../src/utils/gradualeSong';

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
const conMisa = { tiempo: ORDINARIO, misaElegida: misaIII };
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
  misasDelCantoral([canto!], '2026-09-06'), { simplex: misaIII });
check('otra fecha no cuenta', misasDelCantoral([canto!], '2026-09-13'), {});

// ── El atajo del encabezado ────────────────────────────────────────────────
check('hay gregoriano ese domingo aunque no se elija Misa (por el Romanum)',
  hayPropios(DOMINGO_23, { tiempo: ORDINARIO }), true);

// ── Las varias Misas de una solemnidad ─────────────────────────────────────
// La Navidad tiene CUATRO Misas en el Romanum, con cantos distintos. El calendario de la
// app da un solo nombre por día, así que estaban en el índice pero nadie podía verlas:
// eran los cantos del día más importante del año, invisibles.
const NAVIDAD = 'Natividad del Señor';
const navidad = alternativasDelDia('romanum', NAVIDAD);
check('la Navidad trae cuatro Misas', navidad.length, 4);
check('y se nombran como en el libro',
  navidad.map((m) => m.rotuloCorto),
  ['Misa de la vigilia', 'Misa de la noche', 'Misa de la aurora', 'Misa del día']);
// TRES de las cuatro están completas. A la «Misa del día» le falta la comunión, y no es
// culpa del libro: la entrada del índice apunta a la línea de citación del salmo
// ("Ps. 97, 1 ab. 1 cd. 2…"), no al canto. Hasta el 24-sep-2026 esa línea se publicaba
// como si fuera la comunión —una tira de texto sin una sola nota— y esta prueba la
// contaba por buena. Ahora el render se niega a guardar un recorte de 32 px y el hueco
// queda a la vista, que es lo que corresponde. Se rellena con la planilla de huecos
// (scripts/planilla-huecos-graduale.py).
check('tres de las cuatro están completas',
  navidad.filter((m) => Object.keys(m.cantos).length === 5).length, 3);
check('y a la Misa del día le falta la comunión: es un hueco del índice, no del libro',
  navidad.find((m) => m.rotuloCorto === 'Misa del día')!.cantos.communio, undefined);
check('Pentecostés trae dos', alternativasDelDia('romanum', 'Pentecostés').length, 2);
check('un domingo corriente no trae varias',
  alternativasDelDia('romanum', DOMINGO_23), []);

// Son MÁS concretas que la entrada del día, así que la elegida manda sobre ella.
const laNoche = navidad.find((m) => m.rotuloCorto === 'Misa de la noche')!;
check('elegida la Misa de la noche, se canta la de la noche',
  resolveGraduale('romanum', NAVIDAD, 'Entrada', { misaElegida: laNoche.clave })?.pagina,
  laNoche.pagina);
check('y es distinta de la del día',
  laNoche.pagina === navidad.find((m) => m.rotuloCorto === 'Misa del día')!.pagina, false);
check('sin elegir, se usa la entrada general del día',
  resolveGraduale('romanum', NAVIDAD, 'Entrada')?.pagina !== laNoche.pagina, true);

// Lo mismo que con el Simplex: al editar un cantoral hay que recuperar cuál era, o el
// coro se encontraría con la Misa del día donde publicó la de la noche.
const deNoche = buildGradualeSong('2026-12-25', NAVIDAD, 'Entrada', 'romanum',
  { misaElegida: laNoche.clave });
check('la Misa de la noche viaja al cantoral',
  deNoche?.gradualeImage?.includes(laNoche.clave), true);
check('y se recupera al editarlo',
  misasDelCantoral([deNoche!], '2026-12-25'), { romanum: laNoche.clave });

// ── El año NO se elige: lo pone la fecha ───────────────────────────────────
// Cuando el libro trae una comunión distinta para el año A, otra para el B y otra para
// el C, no son tres opciones entre las que escoger: es UNA PARA CADA AÑO. La del año que
// no toca sería, lisa y llanamente, otro canto.
check('una sola melodía sirve para los tres años',
  ['A', 'B', 'C'].map((a) => archivoDelCanto(1, 'communio', a as any)),
  ['communio', 'communio', 'communio']);
check('con una melodía por año, se canta la del año que toca',
  ['A', 'B', 'C'].map((a) => archivoDelCanto(['A', 'B', 'C'], 'communio', a as any)),
  ['communio-A', 'communio-B', 'communio-C']);

// El libro no siempre marca los tres. Si trae la del año A y además la general, en B y
// en C se canta la general — antes el canto desaparecía del cantoral esos dos años.
check('marcado sólo el año A, en A se canta la de A',
  archivoDelCanto(['*', 'A'], 'communio', 'A'), 'communio-A');
check('y en B y C, la general',
  ['B', 'C'].map((a) => archivoDelCanto(['*', 'A'], 'communio', a as any)),
  ['communio', 'communio']);
check('sin general y sin la del año, no hay canto: mejor nada que la melodía de otro año',
  archivoDelCanto(['A'], 'communio', 'B'), null);
check('un canto que el libro no trae, tampoco',
  archivoDelCanto(undefined, 'communio', 'A'), null);

// El año sale de la FECHA, y coincide con lo que dice el calendario de la app.
check('el 1.º de Adviento de 2026 abre el año litúrgico siguiente',
  getSundayCycle('2026-11-29'), getSundayCycle('2027-01-10'));
check('y el domingo anterior es todavía el año que termina',
  getSundayCycle('2026-11-22') !== getSundayCycle('2026-11-29'), true);

// ── Las variantes que el libro trae de verdad ──────────────────────────────
// Se leen del propio Graduale: el libro rotula los años en texto ("Dom. anno B :") y el
// escaneo lo conserva. Estas tres celebraciones son las que hoy salen con variante.
const TERCERO = '3.º Domingo del Tiempo Ordinario';
check('el 3.º domingo tiene una comunión para cada año',
  ['A', 'B', 'C'].map((a) =>
    resolveGraduale('romanum', TERCERO, 'Comunión', { ciclo: a as any })?.año),
  ['A', 'B', 'C']);
check('y son tres imágenes distintas',
  new Set(['A', 'B', 'C'].map((a) =>
    resolveGraduale('romanum', TERCERO, 'Comunión', { ciclo: a as any })?.imagen)).size, 3);

// En el 2.º domingo el libro sólo rotula B y C: el año A canta la versión general, que
// es la suya. Sin ese respaldo el canto desaparecía justo en el año que viene.
const SEGUNDO = '2.º Domingo del Tiempo Ordinario';
check('el 2.º domingo tiene comunión los tres años',
  ['A', 'B', 'C'].every((a) =>
    resolveGraduale('romanum', SEGUNDO, 'Comunión', { ciclo: a as any }) !== null), true);
check('B y C llevan la suya, y A la general',
  ['A', 'B', 'C'].map((a) =>
    resolveGraduale('romanum', SEGUNDO, 'Comunión', { ciclo: a as any })?.año),
  [undefined, 'B', 'C']);

// Sin saber el año no se puede elegir entre variantes: se devuelve la general, y si no
// la hay, nada. Nunca la de un año al azar.
check('sin año, el 3.º domingo no devuelve ninguna al azar',
  resolveGraduale('romanum', TERCERO, 'Comunión'), null);
check('un domingo sin variantes no dice año',
  resolveGraduale('romanum', DOMINGO_23, 'Comunión', { ciclo: 'A' })?.año, undefined);

// El pie del folleto sólo nombra el año donde de verdad cambia: es la única pista de
// por qué ese domingo no suena como el del año pasado.
check('el pie dice el año cuando hay variante',
  buildGradualeSong('2027-01-24', TERCERO, 'Comunión', 'romanum', { ciclo: 'C' })
    ?.gradualeFuente?.includes('Año C'), true);
check('y no lo dice cuando no la hay',
  buildGradualeSong('2026-09-06', DOMINGO_23, 'Comunión', 'romanum', { ciclo: 'A' })
    ?.gradualeFuente?.includes('Año'), false);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);
