import { useEffect, useState } from 'react';
import { Bell, X, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import {
  pushSupported, notificationPermission, isPushEnabled,
  enablePush, isIos, isStandalone,
} from '../../services/push';

const DISMISS_KEY = 'stella_maris_push_banner_dismissed';

interface Props {
  parishes: string[];
  role?: string;
}

/**
 * Banner proactivo en la pantalla principal para invitar a ACTIVAR las notificaciones
 * (no se puede activar por el usuario: el permiso exige un gesto suyo). Se oculta si ya
 * están activas, si el permiso fue bloqueado, si el navegador no las admite, o si el
 * usuario lo descartó. En iOS invita a instalar la PWA primero.
 */
export function PushBanner({ parishes, role }: Props) {
  const supported = pushSupported();
  const [enabled, setEnabled] = useState(true);   // asumir activadas hasta comprobar → no parpadea
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });
  const perm = notificationPermission();
  const iosNeedsInstall = isIos() && !isStandalone();

  useEffect(() => {
    if (!supported) { setChecked(true); return; }
    isPushEnabled().then((v) => { setEnabled(v); setChecked(true); });
  }, [supported]);

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* modo privado */ }
  };

  const activate = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await enablePush(parishes, role);
      if (r.ok) {
        setEnabled(true);
        toast.success('¡Notificaciones activadas!', { description: 'Te enviamos una de prueba para confirmar.' });
      } else if (r.reason === 'denied') {
        dismiss();
        toast.error('Permiso bloqueado', { description: 'Habilítalas para este sitio en los ajustes del navegador.' });
      } else {
        toast.error('No se pudo activar', { description: 'Intenta de nuevo.' });
      }
    } finally {
      setBusy(false);
    }
  };

  // No mostrar: sin soporte, ya activas, permiso bloqueado, o descartado.
  if (!supported || !checked || enabled || dismissed || perm === 'denied') return null;

  return (
    // lg:ml-20 libra el botón de menú flotante (solo desktop, top-left).
    <div className="mx-3 sm:mx-4 mt-2 mb-1 lg:ml-20">
      <div className="relative flex items-start gap-3 rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-700 p-3 sm:p-4 shadow-sm">
        <div className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
          {iosNeedsInstall
            ? <Smartphone className="w-6 h-6 text-white" strokeWidth={2.5} />
            : <Bell className="w-6 h-6 text-white" strokeWidth={2.5} />}
        </div>

        <div className="min-w-0 flex-1 pr-6">
          {iosNeedsInstall ? (
            <>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Recibe avisos en tu iPhone</p>
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5">
                Instala la app: toca «Compartir» → «Agregar a inicio», y ábrela desde el ícono.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                Activa las notificaciones
              </p>
              <p className="text-xs text-amber-900 dark:text-amber-200 mt-0.5">
                Te avisamos de las celebraciones y de cada nuevo cantoral de tu parroquia.
              </p>
              <button
                onClick={activate}
                disabled={busy}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-bold px-3 py-1.5 active:scale-95 transition-all disabled:opacity-60"
              >
                <Bell className="w-4 h-4" strokeWidth={2.5} />
                {busy ? 'Activando…' : 'Activar'}
              </button>
            </>
          )}
        </div>

        <button
          onClick={dismiss}
          aria-label="Descartar"
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
