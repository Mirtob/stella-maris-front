import { useEffect, useRef } from 'react';

/**
 * Mantiene la pantalla encendida mientras `active` sea true, usando la
 * Screen Wake Lock API.
 *
 * Pensado para músicos que tienen una partitura abierta durante la Misa: la
 * pantalla no debe apagarse sola mientras leen.
 *
 * Notas:
 * - Degrada silenciosamente en navegadores sin soporte (p. ej. iOS < 16.4):
 *   simplemente no hace nada, sin romper.
 * - El sistema LIBERA el lock al ocultar la pestaña/app, así que lo
 *   re-adquirimos cuando el documento vuelve a estar visible.
 * - Requiere contexto seguro (HTTPS) — la app ya corre sobre HTTPS en Vercel.
 */
export function useWakeLock(active: boolean): void {
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    if (!active) return;

    const wakeLock = (navigator as any).wakeLock;
    if (!wakeLock || typeof wakeLock.request !== 'function') return; // sin soporte → no-op

    let released = false;

    const request = async () => {
      // Solo se puede pedir con el documento visible
      if (document.visibilityState !== 'visible') return;
      try {
        const sentinel = await wakeLock.request('screen');
        if (released) {
          // El componente se desmontó mientras se resolvía la promesa
          sentinel.release?.().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        // Si el sistema lo suelta por su cuenta, limpiar la referencia
        sentinel.addEventListener?.('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        // Puede rechazarse por política del navegador o estado de la pestaña
        sentinelRef.current = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current && !released) {
        request();
      }
    };

    request();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      sentinel?.release?.().catch(() => {});
    };
  }, [active]);
}
