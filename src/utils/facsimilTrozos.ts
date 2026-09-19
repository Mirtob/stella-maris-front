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

/** Carga un facsímil (`/graduale/...`, `/kyriale/...`). `null` si no se pudo. */
export async function cargarFacsimil(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth ? img : null);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
