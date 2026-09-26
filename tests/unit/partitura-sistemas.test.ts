/**
 * Corte de una partitura por SISTEMAS para el folleto (src/utils/facsimilTrozos.ts).
 *
 * Pedido del 26-sep-2026: bajo el Señor, ten piedad quedaba mucho blanco porque el
 * Gloria entraba como un bloque del alto de una columna y saltaba entero a la siguiente.
 * Ahora cada sistema (pauta + su letra) es una pieza, en pentagrama y en tetragrama.
 *
 * Aquí se prueba la parte pura: dada la tinta por fila, dónde cortar. Se verificó
 * además a ojo sobre partituras reales (una «-Voz» de Aleluya, un gradual del Graduale
 * y un Gloria SATB) el mismo día.
 */
import { cortesPorSistema } from '../../src/utils/facsimilTrozos';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const W = 1000;
/** Arma un perfil de tinta a partir de tramos [filas, tipo]. */
type Tramo = [number, 'blanco' | 'pauta' | 'notas' | 'letra'];
function perfil(tramos: Tramo[]): number[] {
  const t: number[] = [];
  for (const [n, tipo] of tramos) {
    for (let i = 0; i < n; i++) {
      if (tipo === 'blanco') t.push(0);
      else if (tipo === 'letra') t.push(200);
      // Una pauta: línea de lado a lado, y entre líneas notas y clave.
      else if (tipo === 'pauta') t.push(i % 6 === 0 ? 950 : 60);
      else t.push(60);
    }
  }
  return t;
}
const MIN = 8;

/** Un sistema: pauta, un blanco chico y su renglón de letra. */
const sistema: Tramo[] = [[31, 'pauta'], [6, 'blanco'], [12, 'letra']];

console.log('\n== Corta entre sistemas, no entre la pauta y su letra ==');
{
  const t = perfil([[20, 'letra'], [15, 'blanco'], ...sistema, [30, 'blanco'], ...sistema, [30, 'blanco'], ...sistema]);
  const c = cortesPorSistema(t, W, MIN)!;
  check('tres sistemas → dos cortes', c.length, 2);
  // Primer sistema: título(20) + blanco(15) + 49 = fila 84; el hueco de 30 va de 84 a 113.
  check('el primer corte cae en el blanco grande', c[0] >= 84 && c[0] <= 113, true);
  check('el título del PDF va con el primer sistema', c[0] > 35, true);
}

console.log('\n== La indicación sobre una pauta va con ESA pauta ==');
{
  // letra de arriba — blanco grande — «Todos:» — blanco chico — pauta de abajo
  const t = perfil([...sistema, [30, 'blanco'], [10, 'letra'], [9, 'blanco'], [31, 'pauta']]);
  const c = cortesPorSistema(t, W, MIN)!;
  check('corta antes de la indicación, no después', c.length === 1 && c[0] < 49 + 30, true);
}

console.log('\n== Dos estrofas bajo la pauta siguen juntas ==');
{
  const t = perfil([[31, 'pauta'], [6, 'blanco'], [12, 'letra'], [9, 'blanco'], [12, 'letra'], [30, 'blanco'], [31, 'pauta']]);
  const c = cortesPorSistema(t, W, MIN)!;
  check('el corte va tras la segunda estrofa', c.length === 1 && c[0] > 31 + 6 + 12 + 9 + 12, true);
}

console.log('\n== Sistema de varias pautas unidas por la barra ==');
{
  // SATB: entre pautas no hay blanco (la barra de compás las une): un solo sistema.
  const t = perfil([[31, 'pauta'], [20, 'notas'], [31, 'pauta'], [30, 'blanco'], [31, 'pauta'], [20, 'notas'], [31, 'pauta']]);
  const c = cortesPorSistema(t, W, MIN)!;
  check('corta solo entre sistemas', c.length, 1);
}

console.log('\n== Sin pautas no se inventa ==');
check('solo texto → null (corte por columna, como antes)',
  cortesPorSistema(perfil([[12, 'letra'], [20, 'blanco'], [12, 'letra']]), W, MIN), null);
check('un solo sistema → ningún corte', cortesPorSistema(perfil(sistema), W, MIN), []);

console.log('\n== Un blanco corto no separa bloques ==');
{
  // Pauta partida por un blanco de 3 filas (menos que MIN): sigue siendo una.
  const t = perfil([[15, 'pauta'], [3, 'blanco'], [15, 'pauta'], [30, 'blanco'], ...sistema]);
  check('un solo corte', cortesPorSistema(t, W, MIN)!.length, 1);
}

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
