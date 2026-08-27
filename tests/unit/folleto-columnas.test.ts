/**
 * Reparto del folleto en columnas (src/utils/pdfColumns.ts).
 *
 * Pedido el 26-ago-2026, con un folleto impreso de la parroquia como modelo: la
 * portada queda como está y el resto pasa a dos columnas que llenan la hoja de arriba
 * abajo, para que el cantoral entre en una sola hoja.
 */
import { repartirEnColumnas, type Pieza } from '../../src/utils/pdfColumns';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Caja de 100 de alto y dos columnas: los números salen redondos. */
const CAJA = { top: 0, bottom: 100, columnas: 2 };
const linea = (h = 10): Pieza => ({ h });
const repartir = (piezas: Pieza[], caja = CAJA) => repartirEnColumnas(piezas, caja);
/** Resumen legible: una entrada "hoja.columna@y" por pieza colocada. */
const mapa = (piezas: Pieza[], caja = CAJA) =>
  repartir(piezas, caja).colocadas.map(c => `${c.hoja}.${c.columna}@${c.y}`);

console.log('\n== Se baja por la columna y se sigue en la de al lado ==');
check('todo cabe en la primera columna',
  mapa([linea(), linea(), linea()]), ['1.0@0', '1.0@10', '1.0@20']);
// En una columna de 100 entran 10 líneas de 10 (la última arranca en 90).
check('lo que no cabe pasa a la columna derecha, no a otra hoja',
  mapa(Array.from({ length: 12 }, () => linea())).slice(9),
  ['1.0@90', '1.1@0', '1.1@10']);
check('llenas las dos columnas, recién ahí se abre otra hoja',
  mapa(Array.from({ length: 21 }, () => linea())).slice(20), ['2.0@0']);
check('una sola hoja para 20 líneas de 10', repartir(Array.from({ length: 20 }, () => linea())).hojas, 1);
check('dos hojas para 21', repartir(Array.from({ length: 21 }, () => linea())).hojas, 2);
check('sin piezas, una hoja y nada colocado',
  [repartir([]).hojas, repartir([]).colocadas.length], [1, 0]);

console.log('\n== El aire no se arrastra al principio de una columna ==');
check('un espacio al empezar la primera columna se descarta',
  mapa([{ h: 8, espacio: true }, linea()]), ['1.0@0']);
check('el espacio que queda justo en el corte tampoco abre la columna siguiente',
  mapa([...Array.from({ length: 10 }, () => linea()), { h: 8, espacio: true }, linea()]).slice(10),
  ['1.1@0']);
check('un espacio en medio de la columna sí ocupa su lugar',
  mapa([linea(), { h: 5, espacio: true }, linea()]), ['1.0@0', '1.0@10', '1.0@15']);

console.log('\n== Nada de rótulos colgando: los grupos no se parten ==');
// 9 líneas llenan hasta y=90; quedan 10 de aire. Un encabezado (6) cabría solo, pero
// arrastra su título (8): el grupo entero mide 14 y debe irse completo a la otra columna.
const conGrupo: Pieza[] = [
  ...Array.from({ length: 9 }, () => linea()),
  { h: 6, grupo: 'parte' },
  { h: 8, grupo: 'parte' },
  linea(),
];
check('el encabezado se va con su título a la columna siguiente',
  mapa(conGrupo).slice(9), ['1.1@0', '1.1@6', '1.1@14']);
check('sin grupo, el encabezado se habría quedado solo al pie',
  mapa([...Array.from({ length: 9 }, () => linea()), { h: 6 }, { h: 8 }]).slice(9),
  ['1.0@90', '1.1@0']);
check('si el grupo cabe entero, no se salta',
  mapa([...Array.from({ length: 8 }, () => linea()), { h: 6, grupo: 'g' }, { h: 8, grupo: 'g' }]).slice(8),
  ['1.0@80', '1.0@86']);
check('dos grupos distintos no se confunden entre sí',
  mapa([{ h: 50, grupo: 'a' }, { h: 30, grupo: 'b' }, { h: 30, grupo: 'b' }]),
  ['1.0@0', '1.1@0', '1.1@30']);

console.log('\n== Casos límite ==');
check('una pieza más alta que la columna se dibuja igual (no se pierde letra)',
  mapa([{ h: 150 }]), ['1.0@0']);
check('y la siguiente arranca en una columna nueva',
  mapa([{ h: 150 }, linea()]), ['1.0@0', '1.1@0']);
check('una columna por hoja también funciona',
  mapa([linea(), ...Array.from({ length: 10 }, () => linea())], { top: 0, bottom: 100, columnas: 1 }).slice(10),
  ['2.0@0']);
check('la caja puede no empezar en cero',
  mapa([linea(), linea()], { top: 17, bottom: 100, columnas: 2 }), ['1.0@17', '1.0@27']);
check('el índice devuelto apunta a la pieza original (los espacios saltados no corren la cuenta)',
  repartir([{ h: 8, espacio: true }, linea(), linea()]).colocadas.map(c => c.pieza), [1, 2]);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
