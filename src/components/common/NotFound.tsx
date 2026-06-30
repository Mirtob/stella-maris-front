import { Home, AlertTriangle } from 'lucide-react';

interface NotFoundProps {
  /** Si se pasa una `reason`, se muestra un texto más específico (ej. para deep links inválidos). */
  reason?: 'invalid-link' | 'unknown-route';
  /** Path original que intentó visitar el usuario. Para mostrar en el cuerpo. */
  attemptedPath?: string;
  onGoHome: () => void;
}

/**
 * V1+V2 — Pantalla mostrada para URLs desconocidas o deep links inválidos.
 *
 * Reemplaza el comportamiento previo de "caer al Login sin avisar". Eso confundía
 * a usuarios que escanearon QR rotos o tipearon mal la URL.
 *
 * `reason='invalid-link'` se usa cuando el path matcheó `/c/<algo>` pero el id no
 * era un UUID válido. `reason='unknown-route'` (default) para cualquier otra URL.
 */
export function NotFound({ reason = 'unknown-route', attemptedPath, onGoHome }: NotFoundProps) {
  const isInvalidLink = reason === 'invalid-link';

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="max-w-md w-full text-center">
        {/* Icono */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-400">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
        </div>

        {/* Título y descripción */}
        <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink mb-3">
          {isInvalidLink ? 'Este link de cantoral no es válido' : 'Página no encontrada'}
        </h1>

        <p className="text-base sm:text-lg text-brand-ink-soft mb-2 leading-relaxed">
          {isInvalidLink
            ? 'El código QR o el enlace que abriste no tiene el formato correcto. Puede que esté roto o sea de una versión vieja de la app.'
            : 'La página que buscás no existe o fue movida.'}
        </p>

        {attemptedPath && (
          <p className="text-sm text-blue-800/70 dark:text-blue-300/70 mb-6 font-mono break-all">
            {attemptedPath}
          </p>
        )}

        {/* Botón principal */}
        <button
          onClick={onGoHome}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-brand to-brand-strong text-white py-4 px-8 rounded-2xl text-lg font-bold shadow-2xl active:scale-95 hover:scale-[1.02] transition-all border-2 border-brand-border"
        >
          <Home className="w-5 h-5" strokeWidth={2.5} />
          Ir al inicio
        </button>

        {isInvalidLink && (
          <p className="mt-6 text-sm text-blue-800/80 dark:text-blue-300/80">
            Si recibiste este QR de un coro, pedile que lo regenere desde la sección "Cantorales publicados".
          </p>
        )}
      </div>
    </main>
  );
}
