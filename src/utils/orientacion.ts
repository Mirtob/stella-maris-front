/**
 * Orientación de la pantalla.
 *
 * El manifest permite cualquier orientación ("any") para que el Modo Atril se pueda
 * leer en horizontal: una partitura a lo ancho de un teléfono o de una tablet acostada
 * se lee mucho mejor. El resto de la app está pensada en vertical, así que la app
 * INSTALADA se vuelve a fijar en vertical fuera del Atril.
 *
 * Todo es "mejor esfuerzo": `screen.orientation.lock()` solo funciona donde el
 * navegador lo permite (app instalada o pantalla completa en Android; en iPhone no
 * existe). Si no se puede, no pasa nada: la pantalla sigue al teléfono, que es lo que
 * ya hace la app abierta en una pestaña del navegador.
 */

type Orientacion = 'any' | 'portrait';

function orientacionApi(): { lock?: (o: string) => Promise<void>; unlock?: () => void } | null {
  if (typeof screen === 'undefined') return null;
  return (screen.orientation as unknown as { lock?: (o: string) => Promise<void>; unlock?: () => void }) ?? null;
}

function esAppInstalada(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

function fijar(o: Orientacion): void {
  const api = orientacionApi();
  try {
    api?.lock?.(o)?.catch?.(() => { /* no permitido aquí: la pantalla sigue al teléfono */ });
  } catch { /* navegador sin la API */ }
}

/** El Atril: que la pantalla gire con el teléfono. */
export function permitirGiro(): void {
  const api = orientacionApi();
  try { api?.unlock?.(); } catch { /* sin la API */ }
  // unlock() vuelve a lo que diga el manifest. Si el teléfono todavía tiene guardado el
  // manifest viejo (vertical), pedir 'any' explícitamente lo destraba — en pantalla
  // completa el navegador siempre lo acepta.
  fijar('any');
}

/** Fuera del Atril, la app instalada vuelve a vertical (como antes). */
export function fijarVertical(): void {
  if (!esAppInstalada()) return;
  fijar('portrait');
}
