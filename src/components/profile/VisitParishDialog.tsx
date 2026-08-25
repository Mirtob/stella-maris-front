import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Compass, X, Clock } from 'lucide-react';
import { buildChapelParish, formatActiveParishLabel } from '../../utils/parish';
import { ParishPicker } from './ParishPicker';

interface VisitParishDialogProps {
  /** Parroquias visitadas antes (para volver en un toque). */
  recentVisits?: string[];
  /** Capillas por parroquia madre, para elegir a cuál se va. */
  chapelsByParish?: Record<string, { id: string; name: string }[]>;
  /** Parroquia propia a la que se puede volver (si ahora mismo se está de visita). */
  ownParish?: string;
  onSelect: (parish: string) => void;
  onClose: () => void;
}

/**
 * "Voy a otra parroquia" desde dentro de la app.
 *
 * El caso real: alguien ya está usando la app y ese domingo va a otra parroquia —
 * de viaje, a la Misa Crismal en la catedral, a la parroquia de la familia. Antes
 * había que cerrar sesión para poder elegirla; ahora se cambia sin salir.
 *
 * La visita dura lo que dure la sesión y no toca el perfil: sigues siendo del coro
 * de tu parroquia (ver utils/parishVisit).
 */
export function VisitParishDialog({
  recentVisits = [],
  chapelsByParish = {},
  ownParish,
  onSelect,
  onClose,
}: VisitParishDialogProps) {
  const [parishWithChapels, setParishWithChapels] = useState<string | null>(null);

  const chapelsOf = (parishFull: string) => chapelsByParish[parishFull] ?? [];

  const elegir = (parish: string) => {
    if (chapelsOf(parish).length > 0) {
      setParishWithChapels(parish);
      return;
    }
    onSelect(parish);
  };

  const handlePick = (next: string[]) => {
    const parish = next[next.length - 1];
    if (parish) elegir(parish);
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-6 border-4 border-brand-border max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center text-brand-ink-soft hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>

        <div className="mb-5 text-center">
          <Compass className="w-10 h-10 mx-auto text-blue-600 dark:text-blue-300 mb-2" strokeWidth={2} />
          <h2 className="text-xl font-bold text-brand-ink">
            {parishWithChapels ? '¿A cuál capilla vas?' : 'Voy a otra parroquia'}
          </h2>
          {!parishWithChapels && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Verás sus cantorales solo por esta sesión. Tu perfil y tu parroquia no cambian.
            </p>
          )}
        </div>

        {parishWithChapels ? (
          <div className="space-y-3">
            <button
              onClick={() => setParishWithChapels(null)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:opacity-70 transition-opacity"
            >
              ← Volver
            </button>
            <button
              onClick={() => onSelect(parishWithChapels)}
              className="w-full bg-white/60 dark:bg-white/10 border-2 border-blue-200 dark:border-blue-700 p-4 rounded-2xl text-left hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all"
            >
              <span className="text-sm sm:text-base font-semibold text-brand-ink-soft">⛪ Toda la parroquia</span>
            </button>
            {chapelsOf(parishWithChapels).map((chapel) => (
              <button
                key={chapel.id}
                onClick={() => onSelect(buildChapelParish(parishWithChapels, chapel.name))}
                className="w-full bg-white/60 dark:bg-white/10 border-2 border-blue-200 dark:border-blue-700 p-4 rounded-2xl text-left hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all"
              >
                <span className="text-sm sm:text-base font-semibold text-brand-ink-soft break-words">🏠 {chapel.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {ownParish && (
              <button
                onClick={() => onSelect(ownParish)}
                className="w-full mb-4 bg-brand text-white p-4 rounded-2xl text-left hover:opacity-90 active:scale-95 transition-all border-2 border-brand-border"
              >
                <p className="font-bold">🏠 Volver a mi parroquia</p>
                <p className="text-xs text-blue-100 break-words">{formatActiveParishLabel(ownParish)}</p>
              </button>
            )}

            {recentVisits.length > 0 && (
              <div className="mb-4">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-blue-300 mb-2">
                  <Clock className="w-3.5 h-3.5" /> Visitadas hace poco
                </p>
                <div className="space-y-2">
                  {recentVisits.map((parish) => (
                    <button
                      key={parish}
                      onClick={() => onSelect(parish)}
                      className="w-full bg-white/60 dark:bg-white/10 border-2 border-blue-200 dark:border-blue-700 p-3 rounded-2xl text-left hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all"
                    >
                      <span className="text-sm font-semibold text-brand-ink-soft break-words">
                        {formatActiveParishLabel(parish)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ParishPicker selected={[]} onChange={handlePick} />
          </>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
