/**
 * Captura del evento `beforeinstallprompt` para sugerir instalar la PWA.
 *
 * El listener se registra a nivel módulo (al importar este archivo) porque el
 * evento se dispara temprano, antes de que monte el componente que muestra el
 * botón. Los componentes se suscriben con `subscribeInstall` para re-renderizar
 * cuando el prompt queda disponible o se consume.
 *
 * Caveat: en navegadores que exigen un Service Worker activo para la instalación,
 * el evento puede no dispararse (la app desregistra el SW en main.tsx). Por eso el
 * consumidor debe mostrar SIEMPRE instrucciones manuales como fallback, y el botón
 * de un toque solo cuando `getDeferredInstallPrompt()` no es null.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Evitar el mini-infobar automático; lo disparamos nosotros con un botón.
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

/** Devuelve el evento diferido si está disponible (botón "Instalar" de un toque). */
export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

/** Dispara el prompt nativo. Devuelve el resultado o 'unavailable' si no hay evento. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable';
  await deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  notify();
  return choice.outcome;
}

/** Suscribe a cambios de disponibilidad del prompt. Devuelve la función de cleanup. */
export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

/** iOS (Safari) no soporta beforeinstallprompt → se muestran instrucciones manuales. */
export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) ||
    // iPadOS 13+ se reporta como Mac; se detecta por touch.
    (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

/** True si la app ya está corriendo instalada (no tiene sentido sugerir instalar). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (navigator as any).standalone === true;
}
