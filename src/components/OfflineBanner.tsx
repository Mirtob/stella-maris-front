import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * Q35 — Banner global de estado offline.
 *
 * Escucha los eventos `online` / `offline` del browser. Si el usuario pierde
 * conexión (LTE inestable, WiFi caído), aparece una barra discreta en la
 * parte superior avisando que las acciones (publicar, cargar cantorales)
 * pueden fallar. Desaparece sola al recuperar la red.
 *
 * z-index 100 para quedar siempre por encima del sidebar (z-70) y los modales.
 */
export function OfflineBanner() {
  const [online, setOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[100] bg-red-700 text-white px-4 py-2 text-sm font-bold shadow-lg flex items-center justify-center gap-2"
      style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>Sin conexión — algunas acciones pueden fallar</span>
    </div>
  );
}
