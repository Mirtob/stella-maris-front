/**
 * Reparto del folleto en columnas.
 *
 * El cuerpo del cantoral es un flujo continuo de piezas (un encabezado de parte, un
 * título, UNA línea de letra, un separador…) que se va llenando por columnas: se baja
 * por la izquierda, se sigue por la derecha y solo entonces se abre otra hoja, como en
 * un folleto impreso. Aquí vive solo el reparto —sin jsPDF— para poder probarlo.
 */

export interface Pieza {
  /** Alto que ocupa, en las mismas unidades que `top`/`bottom`. */
  h: number;
  /** Piezas contiguas con el mismo grupo no se separan: si el grupo entero no cabe en
   *  lo que resta de columna, se salta antes de empezarlo. Así un rótulo nunca queda
   *  colgando solo al pie de una columna. */
  grupo?: string;
  /** Aire de separación: se omite si cae justo al empezar una columna. */
  espacio?: boolean;
}

export interface Colocada {
  /** Índice de la pieza en el arreglo de entrada. */
  pieza: number;
  /** Hoja (1 en adelante) y columna (0 = izquierda) donde cae. */
  hoja: number;
  columna: number;
  /** Coordenada del borde superior de la pieza. */
  y: number;
}

export interface Caja {
  /** Borde superior e inferior del área de texto. */
  top: number;
  bottom: number;
  /** Cuántas columnas tiene cada hoja. */
  columnas: number;
}

/**
 * En cuántos trozos hay que partir una partitura para que quepa por columnas.
 *
 * Devuelve el alto de cada trozo, en las mismas unidades que la caja. El PRIMERO va más
 * corto porque encima lleva el título del canto; los demás pueden ocupar la columna
 * entera.
 *
 * Existe porque el reparto NO descarta lo que no cabe: lo dibuja igual y se sale de la
 * hoja (ver `repartirEnColumnas`). Para la letra da igual —un renglón nunca es más alto
 * que una columna—, pero una partitura del Graduale puede ser diez veces más alta que
 * ancha, y entonces se salía de la hoja y aparecía cortada. Partirla y que siga en la
 * columna siguiente es lo que hace un folleto impreso.
 */
export function planDeCorte(alto: number, columna: number, reserva: number): number[] {
  const primera = Math.max(1, columna - reserva);
  if (alto <= primera) return [alto];

  const trozos = [primera];
  let resto = alto - primera;
  while (resto > columna) {
    trozos.push(columna);
    resto -= columna;
  }
  if (resto > 0) trozos.push(resto);
  return trozos;
}

/** Alto del grupo que empieza en `i`; para una pieza suelta, su propio alto. */
function altoDesde(piezas: Pieza[], i: number): number {
  const g = piezas[i].grupo;
  if (!g || (i > 0 && piezas[i - 1].grupo === g)) return piezas[i].h;
  let h = 0;
  for (let k = i; k < piezas.length && piezas[k].grupo === g; k++) h += piezas[k].h;
  return h;
}

/**
 * Coloca las piezas y dice cuántas hojas hicieron falta. No descarta nada: una pieza
 * más alta que la columna entera se dibuja igual (y se sale), porque perder letra de
 * un canto sería peor que un renglón fuera de caja.
 */
export function repartirEnColumnas(piezas: Pieza[], caja: Caja): { colocadas: Colocada[]; hojas: number } {
  const { top, bottom, columnas } = caja;
  const colocadas: Colocada[] = [];
  let col = 0;
  let hoja = 1;
  let y = top;

  for (let i = 0; i < piezas.length; i++) {
    const p = piezas[i];
    if (p.espacio && y === top) continue;         // no empezar una columna con aire

    if (y > top && y + altoDesde(piezas, i) > bottom) {
      col++;
      if (col >= columnas) { col = 0; hoja++; }
      y = top;
      if (p.espacio) continue;
    }

    colocadas.push({ pieza: i, hoja, columna: col, y });
    y += p.h;
  }

  return { colocadas, hojas: hoja };
}
