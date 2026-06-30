import type { LucideIcon } from 'lucide-react';
import logoStellaMaris from 'figma:asset/44767b9307cb7c59bba6fc5a03063ff51488551e.png';

interface EmptyStateProps {
  /** Emoji como ícono (compatibilidad). Si pasas `Icon`, se usa ese en su lugar. */
  icon?: string;
  /** Ícono lucide (preferido sobre el emoji). */
  Icon?: LucideIcon;
  title: string;
  description: string;
  /** Línea secundaria opcional, más pequeña (p. ej. la parroquia activa). */
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Muestra el logo grande arriba (vistas a pantalla completa). */
  showLogo?: boolean;
  /** Versión compacta para usar EN LÍNEA dentro de otra lista/sección. */
  compact?: boolean;
}

export function EmptyState({
  icon,
  Icon,
  title,
  description,
  hint,
  actionLabel,
  onAction,
  showLogo = false,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center animate-empty-rise ${
        compact ? 'py-10 px-3' : 'py-16 px-4'
      }`}
    >
      {showLogo && !compact && (
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-6">
          {/* Halo suave y estático (sin pulso). */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-400/15 via-amber-300/15 to-blue-600/15 blur-2xl" />
          <div className="w-full h-full rounded-full overflow-hidden relative z-10 ring-2 ring-blue-400/20 shadow-lg">
            <img src={logoStellaMaris} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Ícono en una pastilla suave y ESTÁTICA (sin rebote ni pulso). */}
      <div
        className={`flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 ring-1 ring-blue-300/50 dark:ring-blue-700/50 mb-5 ${
          compact ? 'w-14 h-14' : 'w-20 h-20'
        }`}
      >
        {Icon ? (
          <Icon className={compact ? 'w-7 h-7' : 'w-10 h-10'} strokeWidth={2} aria-hidden />
        ) : (
          <span className={compact ? 'text-3xl' : 'text-5xl'} aria-hidden>
            {icon}
          </span>
        )}
      </div>

      <h3
        className={`font-bold text-blue-950 dark:text-white mb-2 ${
          compact ? 'text-lg' : 'text-xl sm:text-2xl'
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-blue-900/80 dark:text-blue-100/80 max-w-md ${
          compact ? 'text-sm' : 'text-base sm:text-lg'
        } ${hint || (actionLabel && onAction) ? 'mb-4' : ''}`}
      >
        {description}
      </p>

      {hint && <p className="text-xs sm:text-sm text-blue-700/70 dark:text-blue-300/70 mb-4">{hint}</p>}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className={`bg-gradient-to-br from-blue-900 to-blue-950 text-white rounded-2xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all ${
            compact ? 'px-5 py-2.5 text-sm' : 'px-7 py-3.5 text-base'
          }`}
        >
          {actionLabel}
        </button>
      )}

      {/* Una sola animación de entrada suave; respeta prefers-reduced-motion (globals.css). */}
      <style>{`
        @keyframes empty-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-empty-rise { animation: empty-rise 0.4s ease-out both; }
      `}</style>
    </div>
  );
}
