/**
 * Los propios gregorianos en el cantoral (src/data/gradualeIndex + utils/gradualeSong).
 *
 * Lo que se fija aquí:
 *  · Cada parte de la Misa mira el canto que le toca del libro, y sólo ese.
 *  · Gradual y tracto no son un capricho: el gradual ocupa el lugar del salmo y el
 *    tracto el del aleluya en Cuaresma. Si esa correspondencia se rompe, el coro canta
 *    el canto equivocado en el momento equivocado.
 *  · No se ofrece un libro que ese día no trae nada: un botón muerto es peor que la
 *    ausencia del botón.
 *  · El propio lleva la fecha en el id, como el salmo y las antífonas, para que al
 *    editar un cantoral no se arrastre el del domingo anterior.
 *  · La comunión va PRIMERA de su parte (acompaña el comienzo de la procesión), igual
 *    que la antífona del Misal.
 */
import {
  resolveGraduale, librosDisponibles, parteTienePropio, hayPropios,
  gradualeImageUrl, PARTES_CON_PROPIO,
} from '../../src/data/gradualeIndex';
import { buildGradualeSong, isGradualeSong, libroDelCantoral } from '../../src/utils/gradualeSong';
import { conAntifonas } from '../../src/utils/antiphonSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const ADVIENTO = '1.º Domingo de Adviento';

// ── Qué canto mira cada parte ──────────────────────────────────────────────
check('la Entrada mira el introito',
  resolveGraduale('romanum', ADVIENTO, 'Entrada')?.canto, 'introitus');
check('el Salmo mira el gradual (es el canto interleccional)',
  resolveGraduale('romanum', ADVIENTO, 'Salmo')?.canto, 'graduale');
check('el Ofertorio mira el ofertorio',
  resolveGraduale('romanum', ADVIENTO, 'Ofertorio')?.canto, 'offertorium');
check('la Comunión mira la comunión',
  resolveGraduale('romanum', ADVIENTO, 'Comunión')?.canto, 'communio');
check('una parte sin propio no devuelve nada',
  resolveGraduale('romanum', ADVIENTO, 'Salida'), null);
check('una celebración que el libro no trae no devuelve nada',
  resolveGraduale('romanum', 'Fiesta inventada', 'Entrada'), null);

// En Cuaresma el libro trae el TRACTO en el sitio del aleluya, y el importador lo
// guarda en ese mismo hueco. El coro no debe leer "Aleluya" en Cuaresma: el rótulo lo
// pone la parte, que la app ya llama "Aclamación al Evangelio" en ese tiempo.
check('en Cuaresma el hueco del aleluya sigue teniendo canto',
  resolveGraduale('romanum', '1.º Domingo de Cuaresma', 'Aclamación al Evangelio')?.canto,
  'alleluia');
check('y el rótulo lo pone la parte, no el latín',
  buildGradualeSong('2027-02-14', '1.º Domingo de Cuaresma', 'Aclamación al Evangelio', 'romanum')?.title,
  'Aclamación al Evangelio gregoriano');
check('fuera de Cuaresma el introito sí se llama por su nombre latino',
  buildGradualeSong('2026-11-29', ADVIENTO, 'Entrada', 'romanum')?.title,
  'Introito gregoriano');

// ── Qué se ofrece ──────────────────────────────────────────────────────────
check('las cinco partes con propio', PARTES_CON_PROPIO.length, 6);
check('la Entrada tiene propio', parteTienePropio('Entrada'), true);
check('la Salida no', parteTienePropio('Salida'), false);
check('en Adviento el Romanum ofrece entrada',
  librosDisponibles(ADVIENTO, 'Entrada'), ['romanum']);
check('no se ofrece libro para una celebración desconocida',
  librosDisponibles('Fiesta inventada', 'Entrada'), []);
check('hay propios en Adviento', hayPropios(ADVIENTO), true);
check('no hay propios para una fecha sin celebración', hayPropios(''), false);

check('la imagen vive donde la deja el renderizador',
  gradualeImageUrl('romanum', 'hebdomada-prima-adventus', 'introitus'),
  '/graduale/romanum/hebdomada-prima-adventus/introitus.webp');

// ── El canto sintético ─────────────────────────────────────────────────────
const entrada = buildGradualeSong('2026-11-29', ADVIENTO, 'Entrada', 'romanum');
check('se arma el canto del introito', entrada?.title, 'Introito gregoriano');
check('queda en su parte', entrada?.category, 'Entrada');
check('lleva la partitura', entrada?.gradualeImage,
  '/graduale/romanum/hebdomada-prima-adventus/introitus.webp');
check('dice de dónde sale', (entrada?.gradualeFuente ?? '').startsWith('Graduale Romanum · p.'), true);
check('el id lleva la fecha, para no arrastrarlo al editar',
  entrada?.id, 'graduale-romanum-Entrada-2026-11-29');
check('se reconoce como propio gregoriano', isGradualeSong(entrada!), true);
check('un canto del catálogo no', isGradualeSong({ id: '42' }), false);

check('sin libro elegido no se arma nada',
  buildGradualeSong('2026-11-29', ADVIENTO, 'Entrada', null), null);
check('sin celebración tampoco',
  buildGradualeSong('2026-11-29', '', 'Entrada', 'romanum'), null);
check('si el libro no trae esa parte ese día, tampoco',
  buildGradualeSong('2026-11-29', ADVIENTO, 'Salida', 'romanum'), null);

// ── Reponerlo al editar un cantoral publicado ──────────────────────────────
check('se recupera el libro que llevaba la parte',
  libroDelCantoral([entrada!], 'Entrada', '2026-11-29'), 'romanum');
check('otra fecha no cuenta (el propio es del domingo que era)',
  libroDelCantoral([entrada!], 'Entrada', '2026-12-06'), null);
check('otra parte tampoco',
  libroDelCantoral([entrada!], 'Comunión', '2026-11-29'), null);

// ── Dónde cae dentro de la parte ───────────────────────────────────────────
const comunion = buildGradualeSong('2026-11-29', ADVIENTO, 'Comunión', 'romanum');
const cantoral = [
  { id: 'c1', category: 'Entrada' },
  { id: 'c2', category: 'Comunión' },
  { id: 'c3', category: 'Comunión' },
];
const conPropios = conAntifonas(cantoral as any, [entrada as any, comunion as any]);
check('la comunión gregoriana va PRIMERA de su parte',
  conPropios.map((s: any) => s.id),
  ['c1', 'graduale-romanum-Comunión-2026-11-29', 'c2', 'c3',
   'graduale-romanum-Entrada-2026-11-29']);
check('no se duplica si ya venía en el cantoral',
  conAntifonas(conPropios as any, [comunion as any]).length, conPropios.length);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);
