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
  /**
   * «No me dejes solo al pie»: esta pieza arrastra a la siguiente.
   *
   * Es la regla del taller de toda la vida: un título nunca cierra una plana. Si la
   * pieza y la que viene detrás no caben juntas en lo que queda de columna, se salta
   * ANTES de empezarla y el hueco se deja en blanco.
   *
   * Encadenadas, resuelven los rótulos de un tirón: el encabezado de la parte tira de
   * su título y el título de su primera línea. Antes esto se pedía con un id de grupo
   * por bloque, y dos bloques solapados se pisaban el id — el título del primer canto
   * de cada parte quedaba atado al encabezado y suelto de su letra, que es justo lo que
   * se quería evitar. Una marca booleana por pieza no se puede pisar.
   */
  conSiguiente?: boolean;
  /** Aire de separación: se omite si cae justo al empezar una columna. */
  espacio?: boolean;
  /**
   * Ocupa el ancho de TODAS las columnas: las partituras (pedido del 4-oct-2026).
   *
   * A ancho de columna, y achicada otra vez al imponer el cuadernillo, una partitura
   * del Drive quedaba impresa a un tercio de su tamaño y no se podía leer. A todo el
   * ancho de la plana se lee como un cantoral impreso. La letra sigue a columnas.
   */
  anchoCompleto?: boolean;
}

export interface Colocada {
  /** Índice de la pieza en el arreglo de entrada. */
  pieza: number;
  /** Hoja (1 en adelante) y columna (0 = izquierda) donde cae. */
  hoja: number;
  columna: number;
  /** Coordenada del borde superior de la pieza. */
  y: number;
  /** Va a todo el ancho (ver Pieza.anchoCompleto); `columna` es 0. */
  anchoCompleto?: boolean;
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

/**
 * Alto del bloque que empieza en `i`: la pieza más todas las que se exigen detrás.
 *
 * Para una pieza suelta es su propio alto. Estando en mitad de una cadena ya medida al
 * empezarla, también: medirla de nuevo entera haría que el bloque no cupiera nunca.
 */
function altoDesde(piezas: Pieza[], i: number): number {
  if (i > 0 && piezas[i - 1].conSiguiente) return piezas[i].h;
  let h = 0;
  for (let k = i; k < piezas.length; k++) {
    h += piezas[k].h;
    if (!piezas[k].conSiguiente) break;
  }
  return h;
}

/** Cómo quedó un tramo de piezas a columnas: dónde cayó cada una y dónde terminó. */
interface Tramo {
  colocadas: Colocada[];
  hoja: number;
  /** Borde inferior más bajo de la última hoja (el fondo de la columna más larga). */
  fondo: number;
}

/**
 * Llena columnas con `indices` empezando en (`hoja`, `y0`). En la primera hoja las
 * columnas arrancan en `y0` (debajo de lo que ya hay); en las siguientes, en `top`.
 */
function fluir(
  piezas: Pieza[], indices: number[], hoja: number, y0: number,
  top: number, bottom: number, columnas: number,
): Tramo {
  const colocadas: Colocada[] = [];
  let col = 0;
  let inicio = y0;
  let y = y0;
  let fondo = y0;
  for (const i of indices) {
    const p = piezas[i];
    if (p.espacio && y === inicio) continue;         // no empezar una columna con aire

    const alto = altoDesde(piezas, i);
    if (y > inicio && y + alto > bottom) {
      col++;
      if (col >= columnas) { col = 0; hoja++; inicio = top; fondo = top; }
      y = inicio;
      if (p.espacio) continue;
    }
    // Franja que empieza debajo de una partitura, casi al pie: si ni la columna vacía
    // alcanza, las demás tampoco (empiezan a la misma altura). Se sigue en otra hoja; si
    // no, el encabezado quedaba montado sobre el pie de página.
    if (y === inicio && inicio > top && y + alto > bottom) {
      col = 0; hoja++; inicio = top; fondo = top; y = top;
      if (p.espacio) continue;
    }

    colocadas.push({ pieza: i, hoja, columna: col, y });
    y += p.h;
    fondo = Math.max(fondo, y);
  }
  return { colocadas, hoja, fondo };
}

/**
 * Las columnas de la última hoja de un tramo, parejas: antes de una partitura a todo el
 * ancho, la letra de arriba se reparte a la misma altura en las dos columnas en vez de
 * bajar por la izquierda y dejar la derecha vacía. Busca el fondo más alto con el que
 * esas piezas siguen cabiendo en esa misma hoja.
 */
function equilibrar(
  piezas: Pieza[], tramo: Tramo, y0Primera: number, top: number, bottom: number, columnas: number,
): Tramo {
  if (columnas < 2 || tramo.colocadas.length === 0) return tramo;
  const ultima = tramo.hoja;
  const enLaUltima = tramo.colocadas.filter((c) => c.hoja === ultima);
  if (!enLaUltima.some((c) => c.columna > 0) && enLaUltima.length < 2) return tramo;
  const previas = tramo.colocadas.filter((c) => c.hoja !== ultima);
  const inicio = previas.length ? top : y0Primera;
  const indices = enLaUltima.map((c) => c.pieza);

  let lo = inicio;
  let hi = bottom;
  let mejor: Tramo | null = null;
  for (let k = 0; k < 24 && hi - lo > 0.25; k++) {
    const medio = (lo + hi) / 2;
    const prueba = fluir(piezas, indices, ultima, inicio, top, medio, columnas);
    if (prueba.hoja === ultima) { mejor = prueba; hi = medio; } else { lo = medio; }
  }
  if (!mejor) return tramo;
  return { colocadas: [...previas, ...mejor.colocadas], hoja: ultima, fondo: mejor.fondo };
}

/**
 * Coloca las piezas y dice cuántas hojas hicieron falta. No descarta nada: una pieza
 * más alta que la columna entera se dibuja igual (y se sale), porque perder letra de
 * un canto sería peor que un renglón fuera de caja.
 */
export function repartirEnColumnas(piezas: Pieza[], caja: Caja): { colocadas: Colocada[]; hojas: number } {
  const { top, bottom, columnas } = caja;
  const colocadas: Colocada[] = [];
  let hoja = 1;
  /** Dónde empieza la franja a columnas en curso (debajo de la última partitura). */
  let y = top;
  /** Piezas a columnas que esperan la próxima pieza a todo el ancho (o el final). */
  let pendientes: number[] = [];

  const volcar = (antesDeAnchoCompleto: boolean) => {
    if (!pendientes.length) return;
    let tramo = fluir(piezas, pendientes, hoja, y, top, bottom, columnas);
    if (antesDeAnchoCompleto) tramo = equilibrar(piezas, tramo, y, top, bottom, columnas);
    colocadas.push(...tramo.colocadas);
    hoja = tramo.hoja;
    y = tramo.fondo;
    pendientes = [];
  };

  for (let i = 0; i < piezas.length; i++) {
    const p = piezas[i];
    if (!p.anchoCompleto) { pendientes.push(i); continue; }

    // Lo que viene atado a la partitura (el encabezado de la parte, el título del canto)
    // va con ella, también a todo el ancho: si no, quedaría arriba en una columna y la
    // partitura debajo, separada de su título.
    const atadas: number[] = [];
    while (pendientes.length && piezas[pendientes[pendientes.length - 1]].conSiguiente) {
      atadas.unshift(pendientes.pop()!);
    }
    volcar(true);

    for (const k of [...atadas, i]) {
      const q = piezas[k];
      if (q.espacio && y === top) continue;
      // El bloque atado se mide entero UNA vez, al empezarlo (ver altoDesde).
      if (y > top && y + altoDesde(piezas, k) > bottom) {
        hoja++;
        y = top;
        if (q.espacio) continue;
      }
      colocadas.push({ pieza: k, hoja, columna: 0, y, anchoCompleto: true });
      y += q.h;
    }
  }
  volcar(false);

  colocadas.sort((a, b) => a.pieza - b.pieza);
  return { colocadas, hojas: hoja };
}
