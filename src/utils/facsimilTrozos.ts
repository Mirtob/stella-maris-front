/**
 * Partir una partitura larga del Graduale en trozos que quepan en la hoja.
 *
 * Hay cantos —el gradual y el aleluya, sobre todo— que en el libro ocupan varias
 * páginas: los hay casi diez veces más altos que anchos. Dibujarlos de una pieza los
 * sacaba de la hoja y salían CORTADOS en el folleto; encogerlos hasta que quepan los
 * deja en veinticinco milímetros de ancho, que es ilegible. Un folleto impreso no hace
 * ninguna de las dos cosas: sigue en la columna (o en la página) siguiente.
 *
 * Vive aparte porque lo necesitan los dos PDF: el folleto del pueblo, que va a dos
 * columnas, y el cuadernillo del coro, que va a página entera.
 */
import { planDeCorte } from './pdfColumns';

/** Un trozo ya recortado, listo para `addImage`. */
export interface TrozoFacsimil {
  dataUrl: string;
  /** Alto en mm cuando se dibuja al ancho pedido. */
  h: number;
}

/** Gris por debajo del cual se considera que hay tinta. */
const UMBRAL_TINTA = 128;

/** Cuánto se acepta mover el corte para dar con un blanco, en fracción del trozo. */
const BUSQUEDA = 0.08;

/**
 * @param img        el facsímil ya cargado
 * @param anchoMM    ancho al que se va a dibujar
 * @param altoMaxMM  alto disponible para un trozo (la columna, o la página)
 * @param reservaMM  aire que hay que dejar en el PRIMER trozo (el título del canto)
 */
export function partirFacsimil(
  img: HTMLImageElement, anchoMM: number, altoMaxMM: number, reservaMM: number,
): TrozoFacsimil[] {
  const { naturalWidth: W, naturalHeight: H } = img;
  if (!W || !H) return [];
  const pxPorMM = W / anchoMM;
  const altoTotalMM = H / pxPorMM;

  const lienzo = document.createElement('canvas');
  const ctx = lienzo.getContext('2d');
  if (!ctx) return [];
  lienzo.width = W;
  lienzo.height = H;
  ctx.drawImage(img, 0, 0);

  const plan = planDeCorte(altoTotalMM, altoMaxMM, reservaMM);
  if (plan.length === 1) {
    return [{ dataUrl: lienzo.toDataURL('image/png'), h: altoTotalMM }];
  }

  // Tinta por fila, para poder cortar por un blanco.
  //
  // EL CORTE VA POR UN BLANCO: partir a ciegas cada tantos milímetros parte un
  // tetragrama por la mitad y deja media línea de canto arriba y media abajo. Como esto
  // es tinta negra sobre papel, las franjas sin tinta se ven de un vistazo.
  let tinta = new Uint32Array(H);
  try {
    const datos = ctx.getImageData(0, 0, W, H).data;
    for (let y = 0; y < H; y++) {
      let n = 0;
      const base = y * W * 4;
      for (let x = 0; x < W; x++) if (datos[base + x * 4] < UMBRAL_TINTA) n++;
      tinta[y] = n;
    }
  } catch {
    // Si el lienzo queda manchado no se puede leer; se corta igual, a ciegas.
    tinta = new Uint32Array(H);
  }

  const corteLimpio = (objetivo: number, margen: number): number => {
    for (let d = 0; d <= margen; d++) {
      if (objetivo - d > 0 && tinta[objetivo - d] === 0) return objetivo - d;
      if (objetivo + d < H && tinta[objetivo + d] === 0) return objetivo + d;
    }
    return objetivo;
  };

  const trozos: TrozoFacsimil[] = [];
  let desde = 0;
  plan.forEach((altoMM, i) => {
    const altoPx = Math.round(altoMM * pxPorMM);
    let hasta = i === plan.length - 1 ? H : desde + altoPx;
    if (hasta < H) {
      hasta = corteLimpio(hasta, Math.round(altoPx * BUSQUEDA));
      if (hasta <= desde) hasta = desde + altoPx;   // sin blanco útil, corte a ciegas
    }
    hasta = Math.min(hasta, H);
    if (hasta <= desde) return;
    const trozo = document.createElement('canvas');
    trozo.width = W;
    trozo.height = hasta - desde;
    trozo.getContext('2d')?.drawImage(img, 0, desde, W, hasta - desde, 0, 0, W, hasta - desde);
    trozos.push({ dataUrl: trozo.toDataURL('image/png'), h: (hasta - desde) / pxPorMM });
    desde = hasta;
  });
  return trozos;
}

/**
 * Dónde termina cada SISTEMA de una partitura (un pentagrama o tetragrama con su letra).
 *
 * Es la parte pura de `partirEnSistemas`, aparte para poder probarla sin navegador.
 * Recibe cuánta tinta hay en cada fila de píxeles y devuelve las filas por donde cortar.
 *
 * Cómo decide:
 *  · Una fila con tinta en casi todo el ancho es una LÍNEA DE PAUTA: ni la letra ni las
 *    notas llenan un renglón de lado a lado, las cinco (o cuatro) líneas sí.
 *  · Las franjas en blanco separan bloques: pautas, renglones de letra, indicaciones.
 *  · Entre dos pautas seguidas se corta UNA vez, por el blanco MÁS ANCHO que haya entre
 *    ellas. Ahí está la letra de la pauta de arriba y quizá una indicación de la de
 *    abajo; el hueco grande es el que separa un sistema del otro, y el chico, la letra
 *    de su pauta. Así la letra nunca queda en una columna y sus notas en otra.
 *  · Lo que está antes de la primera pauta (el título del PDF) va con la primera, y lo
 *    que está después de la última, con la última.
 *
 * Devuelve `null` si no encuentra pautas: entonces no se sabe dónde cortar sin partir
 * una línea de música, y quien llama sigue con el corte por alto de columna.
 *
 * @param tinta     píxeles oscuros por fila
 * @param W         ancho en píxeles
 * @param minHueco  filas en blanco seguidas que hacen falta para separar dos bloques
 */
export function cortesPorSistema(tinta: ArrayLike<number>, W: number, minHueco: number): number[] | null {
  const H = tinta.length;
  const blanca = (y: number) => tinta[y] <= Math.max(1, W * 0.004);
  const esPauta = (y: number) => tinta[y] >= W * 0.45;

  // Bloques de filas con tinta. Un blanco más corto que `minHueco` no separa: es el aire
  // entre dos letras con descendentes, o entre la plica y la cabeza de una nota.
  const bloques: { a: number; b: number; pauta: boolean }[] = [];
  let y = 0;
  while (y < H) {
    while (y < H && blanca(y)) y++;
    if (y >= H) break;
    const a = y;
    let b = y;
    let pauta = false;
    while (y < H) {
      if (!blanca(y)) { b = y; if (esPauta(y)) pauta = true; y++; continue; }
      let z = y;
      while (z < H && blanca(z)) z++;
      if (z >= H || z - y >= minHueco) break;
      y = z;
    }
    bloques.push({ a, b, pauta });
  }

  const pautas = bloques.map((bl, i) => (bl.pauta ? i : -1)).filter((i) => i >= 0);
  if (pautas.length === 0) return null;

  const cortes: number[] = [];
  for (let k = 1; k < pautas.length; k++) {
    let mejor = -1;
    let ancho = -1;
    for (let i = pautas[k - 1]; i < pautas[k]; i++) {
      const hueco = bloques[i + 1].a - bloques[i].b - 1;
      if (hueco > ancho) { ancho = hueco; mejor = i; }
    }
    cortes.push(Math.round((bloques[mejor].b + 1 + bloques[mejor + 1].a) / 2));
  }
  return cortes;
}

/**
 * Parte una partitura por SISTEMAS, para que cada uno sea una pieza del folleto.
 *
 * Con el corte por alto de columna (`partirFacsimil`) el primer trozo medía una columna
 * entera: si no cabía en lo que quedaba bajo el canto anterior, saltaba completo a la
 * columna siguiente y dejaba un hueco grande, casi siempre bajo el Señor, ten piedad
 * antes del Gloria. Pieza por sistema, la partitura empieza donde haya lugar y sigue
 * en la columna siguiente, como en un cantoral impreso. Vale igual para el pentagrama
 * de Drive que para el tetragrama del Graduale: los dos tienen líneas de lado a lado.
 *
 * Si no reconoce pautas, o algún sistema no cabe en una columna, vuelve al corte por
 * alto de columna, que es lo que se hacía antes.
 */
export function partirEnSistemas(
  img: HTMLImageElement, anchoMM: number, altoMaxMM: number, reservaMM: number,
): TrozoFacsimil[] {
  const { naturalWidth: W, naturalHeight: H } = img;
  if (!W || !H) return [];
  const pxPorMM = W / anchoMM;

  const lienzo = document.createElement('canvas');
  lienzo.width = W;
  lienzo.height = H;
  const ctx = lienzo.getContext('2d', { willReadFrequently: true });
  if (!ctx) return partirFacsimil(img, anchoMM, altoMaxMM, reservaMM);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, 0, 0);

  let cortes: number[] | null = null;
  try {
    const datos = ctx.getImageData(0, 0, W, H).data;
    const tinta = new Uint32Array(H);
    for (let fila = 0; fila < H; fila++) {
      let n = 0;
      const base = fila * W * 4;
      // Umbral más alto que el de `partirFacsimil`: al ancho de columna una línea de
      // pauta mide un píxel y el suavizado la deja gris, no negra.
      for (let x = 0; x < W; x++) {
        const i = base + x * 4;
        if (datos[i] + datos[i + 1] + datos[i + 2] < 3 * 200) n++;
      }
      tinta[fila] = n;
    }
    cortes = cortesPorSistema(tinta, W, Math.max(3, Math.round(0.8 * pxPorMM)));
  } catch {
    cortes = null;                     // lienzo manchado: no se puede leer
  }
  if (!cortes) return partirFacsimil(img, anchoMM, altoMaxMM, reservaMM);

  const limites = [0, ...cortes, H];
  const altos = limites.slice(1).map((b, i) => (b - limites[i]) / pxPorMM);
  if (altos[0] > altoMaxMM - reservaMM || altos.some((h) => h > altoMaxMM)) {
    return partirFacsimil(img, anchoMM, altoMaxMM, reservaMM);
  }

  const trozos: TrozoFacsimil[] = [];
  for (let i = 0; i < limites.length - 1; i++) {
    const desde = limites[i];
    const alto = limites[i + 1] - desde;
    if (alto <= 0) continue;
    const trozo = document.createElement('canvas');
    trozo.width = W;
    trozo.height = alto;
    trozo.getContext('2d')?.drawImage(lienzo, 0, desde, W, alto, 0, 0, W, alto);
    trozos.push({ dataUrl: trozo.toDataURL('image/png'), h: alto / pxPorMM });
  }
  return trozos;
}

/** Carga un facsímil (`/graduale/...`, `/kyriale/...`). `null` si no se pudo. */
export async function cargarFacsimil(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
