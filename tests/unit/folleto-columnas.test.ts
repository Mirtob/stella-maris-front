/**
 * Reparto del folleto en columnas (src/utils/pdfColumns.ts).
 *
 * Pedido el 26-ago-2026, con un folleto impreso de la parroquia como modelo: la
 * portada queda como está y el resto pasa a dos columnas que llenan la hoja de arriba
 * abajo, para que el cantoral entre en una sola hoja.
 */
import { repartirEnColumnas, planDeCorte, type Pieza } from '../../src/utils/pdfColumns';

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

console.log('\n== Nada de rotulos colgando: un titulo no cierra una plana ==');
// 9 lineas llenan hasta y=90; quedan 10 de aire. Un encabezado (6) cabria solo, pero
// arrastra su titulo (8): el bloque mide 14 y debe irse completo a la otra columna.
const conCadena: Pieza[] = [
  ...Array.from({ length: 9 }, () => linea()),
  { h: 6, conSiguiente: true },
  { h: 8 },
  linea(),
];
check('el encabezado se va con su titulo a la columna siguiente',
  mapa(conCadena).slice(9), ['1.1@0', '1.1@6', '1.1@14']);
check('sin la marca, el encabezado se habria quedado solo al pie',
  mapa([...Array.from({ length: 9 }, () => linea()), { h: 6 }, { h: 8 }]).slice(9),
  ['1.0@90', '1.1@0']);
check('si el bloque cabe entero, no se salta',
  mapa([...Array.from({ length: 8 }, () => linea()), { h: 6, conSiguiente: true }, { h: 8 }]).slice(8),
  ['1.0@80', '1.0@86']);

// REGRESION (24-sep-2026). El primer canto de cada parte de la Misa salia con el titulo
// colgando al pie: el encabezado lo arrastraba a el, pero el ya no arrastraba a su
// letra, porque los dos bloques solapados se pisaban el id de grupo. Encadenadas, las
// tres piezas se miden juntas y el hueco se deja en blanco.
const parteCompleta: Pieza[] = [
  ...Array.from({ length: 8 }, () => linea()),
  { h: 6, conSiguiente: true },   // ENTRADA
  { h: 8, conSiguiente: true },   // titulo del canto
  linea(),                        // su primera linea de letra
];
check('encabezado + titulo + primera linea viajan los tres juntos',
  mapa(parteCompleta).slice(8), ['1.1@0', '1.1@6', '1.1@14']);
check('y si caben los tres, no se salta nada',
  mapa([...Array.from({ length: 7 }, () => linea()),
        { h: 6, conSiguiente: true }, { h: 8, conSiguiente: true }, linea()]).slice(7),
  ['1.0@70', '1.0@76', '1.0@84']);
check('una cadena mas alta que la columna se coloca igual, sin perder piezas',
  mapa([{ h: 60, conSiguiente: true }, { h: 60, conSiguiente: true }, { h: 60 }]).length, 3);

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

console.log('\n== Partir una partitura larga ==');
// El reparto dibuja igual lo que no cabe (ver arriba: "una pieza más alta que la columna
// se dibuja igual"). Para la letra da lo mismo, pero una partitura del Graduale puede ser
// diez veces más alta que ancha: se salía de la hoja y salía CORTADA, justo en el gradual
// y el aleluya. De ahí que haya que partirla antes de entregársela al reparto.
const COLUMNA = 248;      // alto útil de una columna del folleto, en mm
const RESERVA = 22;       // lo que ocupan encima el título del canto y su pie

check('lo que cabe con su título no se parte',
  planDeCorte(200, COLUMNA, RESERVA), [200]);
check('justo en el límite, tampoco',
  planDeCorte(226, COLUMNA, RESERVA), [226]);
check('un pelo más alto ya se parte en dos',
  planDeCorte(227, COLUMNA, RESERVA), [226, 1]);
check('el primer trozo deja sitio al título; los demás usan la columna entera',
  planDeCorte(600, COLUMNA, RESERVA), [226, 248, 126]);

// El caso real que rompía: el aleluya del Commune Sanctarum, 9,84 veces más alto que
// ancho, sobre una columna de 91,5 mm.
const ALELUYA_LARGO = 91.5 * 9.84;
const trozosAleluya = planDeCorte(ALELUYA_LARGO, COLUMNA, RESERVA);
check('el aleluya más largo del libro cabe en cuatro columnas', trozosAleluya.length, 4);
check('ningún trozo se sale de la columna',
  trozosAleluya.every((t) => t <= COLUMNA), true);
check('el primero además deja sitio al título',
  trozosAleluya[0] <= COLUMNA - RESERVA, true);
check('y no se pierde ni un milímetro de canto',
  Math.round(trozosAleluya.reduce((a, b) => a + b, 0)), Math.round(ALELUYA_LARGO));

// Y una vez partida, el reparto ya la coloca sin que nada se salga.
const titulo = { h: 13, conSiguiente: true };
const piezas = [titulo, { h: trozosAleluya[0] },
                ...trozosAleluya.slice(1).map((h) => ({ h }))];
const colocadas = repartir(piezas, { top: 0, bottom: COLUMNA, columnas: 2 }).colocadas;
check('cada trozo queda dentro de su columna',
  colocadas.every((c, i) => c.y + piezas[c.pieza].h <= COLUMNA + 0.01)
    && colocadas.length === piezas.length, true);
check('el título no se queda solo: va con el primer trozo',
  colocadas[0].hoja === colocadas[1].hoja && colocadas[0].columna === colocadas[1].columna,
  true);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
