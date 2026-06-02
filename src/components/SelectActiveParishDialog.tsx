import { createPortal } from 'react-dom';
import { UserRole } from '../types';

interface SelectActiveParishDialogProps {
  parishes: string[];
  userRole: UserRole;
  onSelect: (parish: string, role: UserRole) => void;
}

export function SelectActiveParishDialog({ parishes, userRole, onSelect }: SelectActiveParishDialogProps) {
  const isChoir = userRole === 'Coro';

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn" />

      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-4 border-blue-800 animate-fadeInUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl sm:text-4xl">🏘️</div>
            <h2 className="text-lg sm:text-2xl font-bold text-blue-950 dark:text-white">
              ¿A cuál vas hoy?
            </h2>
          </div>
          <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200 ml-12">
            {isChoir
              ? 'Elige la parroquia y cómo participarás en la Misa de hoy.'
              : '¿Para cuál parroquia vas a la Misa hoy?'}
          </p>
        </div>

        {/* Parishes List */}
        <div className="space-y-4 mb-6 max-h-[55vh] overflow-y-auto">
          {parishes.map((parish) => (
            <div
              key={parish}
              className="bg-white/50 dark:bg-white/10 border-2 border-blue-200 dark:border-blue-700 rounded-2xl overflow-hidden"
            >
              {/* Parish name */}
              <div className="px-4 py-3 border-b border-blue-100 dark:border-blue-800">
                <p className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100 truncate">
                  {parish}
                </p>
              </div>

              {/* Role buttons — shown only for Coro users */}
              {isChoir ? (
                <div className="flex">
                  <button
                    onClick={() => onSelect(parish, 'Coro')}
                    className="flex-1 flex flex-col items-center gap-1 px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 active:scale-95 transition-all border-r border-blue-100 dark:border-blue-800"
                  >
                    <span className="text-xl">🎵</span>
                    <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Preparar cantoral
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Modo Coro</span>
                  </button>
                  <button
                    onClick={() => onSelect(parish, 'Pueblo fiel')}
                    className="flex-1 flex flex-col items-center gap-1 px-3 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 active:scale-95 transition-all"
                  >
                    <span className="text-xl">🙏</span>
                    <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Solo participar
                    </span>
                    <span className="text-xs text-blue-600 dark:text-blue-400">Ver cantoral</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onSelect(parish, userRole)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/40 active:scale-95 transition-all"
                >
                  <span className="text-sm sm:text-base text-blue-800 dark:text-blue-200">
                    Ir a esta parroquia
                  </span>
                  <span className="text-lg">→</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-300 text-center italic">
          Podrás cambiar de parroquia en cualquier momento desde el menú.
        </p>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
