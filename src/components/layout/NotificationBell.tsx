import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Headphones, X } from 'lucide-react';
import { PublishedCantoral } from '../../types';
import { formatYmdForDisplay } from '../../utils/dateLocal';

const LS_KEY = 'notif_last_seen';

interface NotificationBellProps {
  /** Cantorales de la parroquia del usuario (ya filtrados + publicados). */
  cantorals: PublishedCantoral[];
  onListen: (cantoral: PublishedCantoral) => void;
}

function tsOf(c: PublishedCantoral): number {
  const t = new Date(c.publishedAt || c.createdAt || c.date).getTime();
  return Number.isNaN(t) ? 0 : t;
}

/** Campana de notificaciones para Pueblo fiel: avisa de cantorales nuevos de su
 *  parroquia y abre el reproductor "modo radio". */
export function NotificationBell({ cantorals, onListen }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(() => {
    const v = parseInt(localStorage.getItem(LS_KEY) || '', 10);
    return Number.isFinite(v) ? v : 0;
  });

  const recent = useMemo(
    () => [...cantorals].sort((a, b) => tsOf(b) - tsOf(a)).slice(0, 15),
    [cantorals]
  );
  const unread = useMemo(() => recent.filter((c) => tsOf(c) > lastSeen).length, [recent, lastSeen]);

  // Primera vez (sin marca previa): fijar "visto" a ahora para no marcar como no
  // leído todo el histórico; solo contarán los que lleguen después.
  useEffect(() => {
    if (localStorage.getItem(LS_KEY) == null && cantorals.length > 0) {
      const now = Date.now();
      localStorage.setItem(LS_KEY, String(now));
      setLastSeen(now);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cantorals.length]);

  const markAllSeen = () => {
    const now = Date.now();
    localStorage.setItem(LS_KEY, String(now));
    setLastSeen(now);
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) markAllSeen();
  };

  return (
    <>
      <button
        onClick={toggle}
        aria-label={`Notificaciones${unread > 0 ? ` (${unread} sin leer)` : ''}`}
        className="fixed top-3 right-16 sm:top-4 sm:right-20 z-50 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-600 shadow-lg flex items-center justify-center text-blue-950 dark:text-white active:scale-95 hover:scale-110 transition-all"
      >
        <Bell className="w-5 h-5" strokeWidth={2.5} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="absolute top-16 right-3 left-3 sm:left-auto sm:w-96 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-blue-200 dark:border-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-blue-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900">
                <h3 className="text-base font-bold text-blue-950 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notificaciones
                </h3>
                <button onClick={() => setOpen(false)} aria-label="Cerrar" className="p-1 text-gray-500 hover:text-gray-800 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {recent.length === 0 ? (
                <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay cantorales recientes para tu parroquia.
                </p>
              ) : (
                <div className="divide-y divide-blue-50 dark:divide-slate-800">
                  {recent.map((c) => (
                    <div key={c.id} className="p-4">
                      <div className="text-xs text-blue-700 dark:text-blue-300 capitalize mb-0.5">
                        {formatYmdForDisplay(c.date, { weekday: 'short', day: 'numeric', month: 'short' })} · {c.massTime}
                      </div>
                      <div className="text-sm font-bold text-blue-950 dark:text-white mb-2">{c.liturgicalDate}</div>
                      <button
                        onClick={() => { setOpen(false); onListen(c); }}
                        className="w-full bg-gradient-to-br from-rose-600 to-red-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold active:scale-95 transition-all"
                      >
                        <Headphones className="w-4 h-4" /> Escuchar cantos
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
