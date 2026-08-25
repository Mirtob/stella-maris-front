import { formatActiveParishLabel } from '../../utils/parish';

interface VisitBannerProps {
  /** Parroquia ajena en la que se está esta sesión. */
  parish: string;
  /** Rol PERMANENTE del usuario: a un corista hay que explicarle por qué no publica. */
  role: 'Coro' | 'Pueblo fiel' | 'Admin';
  onReturn: () => void;
}

/**
 * Aviso de "estás de visita".
 *
 * Sin él, ver los cantorales de otra parroquia se confunde con un error de la app
 * ("¿por qué no salen los míos?"), y a un corista le desaparecen los botones de
 * publicar sin explicación. Se muestra en todas las pantallas mientras dure la visita.
 */
export function VisitBanner({ parish, role, onReturn }: VisitBannerProps) {
  return (
    <div className="px-3 sm:px-4 pt-3">
      <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 shadow-sm">
        <span className="text-xl flex-shrink-0" aria-hidden>🧭</span>
        <p className="flex-1 min-w-0 text-sm text-amber-900 dark:text-amber-100">
          Estás de visita en <strong className="break-words">{formatActiveParishLabel(parish)}</strong>
          {role === 'Coro' && (
            <span className="block text-xs opacity-80">
              Aquí participas como Pueblo fiel; tu coro sigue siendo el de tu parroquia.
            </span>
          )}
        </p>
        <button
          onClick={onReturn}
          className="flex-shrink-0 px-3 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 active:scale-95 transition-all"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
