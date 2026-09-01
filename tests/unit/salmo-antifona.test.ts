/**
 * El salmo que viaja al cantoral (src/utils/psalmSong.ts).
 *
 * Pedido del 24-ago-2026: cuando el libro no trae la antífona, el coro tiene que poder
 * escribirla a mano en el constructor. Faltaba la mitad del camino: la caja aparecía
 * solo si la celebración estaba en el índice, y aunque el coro escribiera algo, el
 * salmo NO llegaba al cantoral si el índice no la tenía.
 *
 * La regla que fijan estas pruebas: **basta con una de las dos piezas**, la antífona
 * escrita o la página del libro.
 */
import { buildPsalmSong } from '../../src/utils/psalmSong';
import { getLiturgicalDateForDate } from '../../src/utils/liturgicalCalendar';
import { resolvePsalm } from '../../src/data/psalmIndex';
import { getSundayCycle } from '../../src/utils/liturgicalCycle';
import { conSalmoDelLibro } from '../../src/utils/psalmSong';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Una fecha que el índice SÍ tiene (domingo) y otra que no (día de semana). */
const enElLibro = '2026-08-30';
const fueraDelLibro = '2026-09-02';

console.log('\n== Punto de partida: qué trae el índice en cada fecha ==');
const celDom = getLiturgicalDateForDate(enElLibro);
const salmoDom = celDom ? resolvePsalm(getSundayCycle(enElLibro), celDom) : null;
check(`${enElLibro} está en el índice`, !!salmoDom, true);
// Ojo: para una fecha sin celebración devuelve '' (cadena vacía), no null.
check(`${fueraDelLibro} no tiene celebración`, !getLiturgicalDateForDate(fueraDelLibro), true);

console.log('\n== El caso pedido: antífona escrita a mano, sin libro ==');
const aMano = buildPsalmSong(fueraDelLibro, 'El Señor es mi pastor, nada me falta');
check('el salmo SÍ viaja al cantoral', aMano !== null, true);
check('lleva la antífona escrita', aMano?.lyrics, 'El Señor es mi pastor, nada me falta');
check('se ubica en el momento del salmo', aMano?.massMoment, 'salmo');
check('la categoría es Salmo', aMano?.category, 'Salmo');
check('sin página del libro', aMano?.psalmPage, undefined);
check('sin libro de Drive', aMano?.psalmBookId, undefined);

console.log('\n== Sin nada que mostrar, no se inventa un salmo ==');
check('sin antífona y sin libro → null', buildPsalmSong(fueraDelLibro, ''), null);
check('solo espacios en blanco tampoco cuenta', buildPsalmSong(fueraDelLibro, '   \n  '), null);

console.log('\n== Con el libro, todo sigue igual que antes ==');
const conLibro = buildPsalmSong(enElLibro, '');
check('viaja aunque no se escriba antífona', conLibro !== null, true);
check('lleva la página del libro', typeof conLibro?.psalmPage, 'number');
check('lleva el id del libro en Drive', typeof conLibro?.psalmBookId, 'string');

const corregida = buildPsalmSong(enElLibro, 'Antífona corregida por el coro');
check('lo que escribe el coro manda sobre el índice',
  corregida?.lyrics, 'Antífona corregida por el coro');
check('…y la página del libro se conserva', corregida?.psalmPage, conLibro?.psalmPage);

console.log('\n== Detalles del canto sintético ==');
check('el id depende de la fecha', buildPsalmSong(enElLibro, 'x')?.id, `psalm-${enElLibro}`);
check('el título es fijo', buildPsalmSong(enElLibro, 'x')?.title, 'Salmo responsorial');
check('es litúrgico', buildPsalmSong(enElLibro, 'x')?.isLiturgical, true);
check('la antífona se guarda sin espacios de sobra',
  buildPsalmSong(fueraDelLibro, '  Aleluya, aleluya  ')?.lyrics, 'Aleluya, aleluya');

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);

// ─────────────────────────────────────────────────────────────────────────────
// La antífona escrita a mano tiene que llegar al FOLLETO
//
// Reportado el 2-sep-2026: "si agrego manualmente la antífona del salmo en una
// celebración agregada, no la muestra en el folleto". Comprobado contra los datos
// reales: la antífona SÍ llegaba al cantoral publicado y SÍ salía en el folleto final.
// Lo que no la mostraba era la VISTA PREVIA de antes de publicar — que es donde el
// coro mira. La previa armaba el folleto con el borrador, y el salmo no está en el
// borrador: se sumaba aparte, en cada sitio que lo necesitaba, y ahí se olvidó.
// ─────────────────────────────────────────────────────────────────────────────

{
  const canto = (id: string, category: string) => ({ id, category, title: id } as any);
  const salmo = (texto: string) => ({ id: 'psalm-2026-09-05', category: 'Salmo', lyrics: texto } as any);

  console.log('\n== El salmo del libro se suma al borrador ==');
  const borrador = [canto('entrada', 'Entrada'), canto('comunion', 'Comunión')];
  const conSalmo = conSalmoDelLibro(borrador, salmo('Ojalá escuchen hoy la voz del Señor'));
  check('se agrega al repertorio', conSalmo.length, 3);
  check('en la parte Salmo', conSalmo.map((s: any) => s.category), ['Entrada', 'Comunión', 'Salmo']);
  check('con la antífona escrita a mano', (conSalmo[2] as any).lyrics, 'Ojalá escuchen hoy la voz del Señor');

  console.log('\n== Y no se estorba con lo que ya haya ==');
  // Un canto del catálogo puesto en la parte Salmo manda: no se le encima el del libro.
  const conCantoPropio = [canto('entrada', 'Entrada'), canto('mi-salmo', 'Salmo')];
  check('no se duplica la parte', conSalmoDelLibro(conCantoPropio, salmo('x')).length, 2);
  check('gana el del coro', (conSalmoDelLibro(conCantoPropio, salmo('x'))[1] as any).id, 'mi-salmo');

  console.log('\n== Sin salmo, el borrador queda intacto ==');
  // Sin antífona y sin página del libro, buildPsalmSong devuelve null.
  check('mismo repertorio', conSalmoDelLibro(borrador, null).length, 2);
  check('es el mismo arreglo', conSalmoDelLibro(borrador, null) === borrador, true);
  check('un borrador vacío sigue vacío', conSalmoDelLibro([], null).length, 0);
  check('salmo solo, sin más cantos', conSalmoDelLibro([], salmo('sola')).length, 1);
}

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
