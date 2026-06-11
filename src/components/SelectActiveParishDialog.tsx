import { useState } from 'react';
import { createPortal } from 'react-dom';
import { UserRole } from '../types';

interface SelectActiveParishDialogProps {
  parishes: string[];
  defaultParish?: string;          // fallback for profiles without parishes array
  userRole: UserRole;              // permanent role — determines if Admin option is shown
  lastSessionRole?: UserRole;      // role chosen in the previous session (for "Último uso" badge)
  lastSessionParish?: string;      // parish chosen in the previous session
  onSelect: (parish: string, role: UserRole) => void;
  onSignOut: () => void;           // for full Google sign-out
}

/**
 * Session setup dialog — shown after every logout so the user can choose
 * how they participate today. Any user can switch between Coro and Pueblo fiel;
 * Admin users additionally see the Admin option.
 *
 * Two-step flow:
 *   Step 1: pick role  (Coro / Pueblo fiel / Admin)
 *   Step 2: pick parish (only when multiple parishes exist; otherwise auto-selected)
 */
export function SelectActiveParishDialog({
  parishes,
  defaultParish,
  userRole,
  lastSessionRole,
  lastSessionParish,
  onSelect,
  onSignOut,
}: SelectActiveParishDialogProps) {
  const [chosenRole, setChosenRole] = useState<UserRole | null>(null);

  // Render a small "Último uso" badge when this option matches the previous session
  const LastUseBadge = () => (
    <span className="ml-auto px-2 py-0.5 bg-amber-400 text-amber-950 text-xs font-bold rounded-full whitespace-nowrap">
      Último uso
    </span>
  );

  const isAdmin = userRole === 'Admin';
  const effectiveParishes = parishes.length > 0 ? parishes : (defaultParish ? [defaultParish] : []);
  const multiParish = effectiveParishes.length > 1;
  const hasNoParish = effectiveParishes.length === 0;

  const handleRoleSelect = (role: UserRole) => {
    if (!multiParish) {
      // Single or no parish: confirm immediately with whatever parish is available
      onSelect(effectiveParishes[0] ?? '', role);
    } else {
      setChosenRole(role);
    }
  };

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-4 border-blue-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-7 text-center">
          <div className="text-5xl mb-3">✝️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-blue-950 dark:text-white">
            {!chosenRole ? '¿Cómo participas hoy?' : '¿A cuál parroquia vas?'}
          </h2>
          {!chosenRole && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Puedes cambiar tu rol en cada sesión
            </p>
          )}
        </div>

        {/* ── No parish configured (safety fallback) ──────────────────────
            No aplica para Admin: legítimamente no tiene parroquia (CRUD global). */}
        {hasNoParish && !isAdmin && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-400 dark:border-amber-600 rounded-2xl p-4 text-center">
            <p className="text-base font-semibold text-amber-800 dark:text-amber-200 mb-1">
              Sin parroquia configurada
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Para continuar necesitas completar tu perfil con una parroquia.
            </p>
            <button
              onClick={onSignOut}
              className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 active:scale-95 transition-all"
            >
              Configurar perfil
            </button>
          </div>
        )}

        {/* ── Step 1: Role selection ─────────────────────────────────────── */}
        {!chosenRole && (
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleRoleSelect('Coro')}
              className={`w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white p-4 rounded-2xl flex items-center gap-4 hover:opacity-90 active:scale-95 transition-all border-2 shadow-lg ${
                lastSessionRole === 'Coro' ? 'border-amber-400 ring-2 ring-amber-300' : 'border-blue-800'
              }`}
            >
              <span className="text-3xl">🎵</span>
              <div className="text-left">
                <p className="font-bold text-lg">Como Coro</p>
                <p className="text-sm text-blue-200">Preparar y publicar cantorales</p>
              </div>
              {lastSessionRole === 'Coro' && <LastUseBadge />}
            </button>

            <button
              onClick={() => handleRoleSelect('Pueblo fiel')}
              className={`w-full bg-white/60 dark:bg-white/10 border-2 text-blue-900 dark:text-blue-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all ${
                lastSessionRole === 'Pueblo fiel'
                  ? 'border-amber-400 ring-2 ring-amber-300'
                  : 'border-blue-300 dark:border-blue-600'
              }`}
            >
              <span className="text-3xl">🙏</span>
              <div className="text-left">
                <p className="font-bold text-lg">Como Pueblo fiel</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Ver cantorales publicados</p>
              </div>
              {lastSessionRole === 'Pueblo fiel' && <LastUseBadge />}
            </button>

            {isAdmin && (
              <button
                onClick={() => handleRoleSelect('Admin')}
                className={`w-full bg-white/60 dark:bg-white/10 border-2 text-blue-900 dark:text-blue-100 p-4 rounded-2xl flex items-center gap-4 hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all ${
                  lastSessionRole === 'Admin'
                    ? 'border-amber-400 ring-2 ring-amber-300'
                    : 'border-blue-300 dark:border-blue-600'
                }`}
              >
                <span className="text-3xl">🛡️</span>
                <div className="text-left">
                  <p className="font-bold text-lg">Como Administrador</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Gestionar cantos y usuarios</p>
                </div>
                {lastSessionRole === 'Admin' && <LastUseBadge />}
              </button>
            )}
          </div>
        )}

        {/* ── Step 2: Parish selection (multi-parish only) ───────────────── */}
        {chosenRole && multiParish && (
          <div className="mb-4">
            <button
              onClick={() => setChosenRole(null)}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-4 hover:opacity-70 transition-opacity"
            >
              ← Cambiar rol
            </button>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Sort parishes: last-used first */}
              {[...effectiveParishes]
                .sort((a, b) => {
                  if (a === lastSessionParish) return -1;
                  if (b === lastSessionParish) return 1;
                  return 0;
                })
                .map((parish) => {
                  const isLast = parish === lastSessionParish;
                  return (
                    <button
                      key={parish}
                      onClick={() => onSelect(parish, chosenRole)}
                      className={`w-full bg-white/60 dark:bg-white/10 border-2 p-4 rounded-2xl text-left hover:bg-white/80 dark:hover:bg-white/20 active:scale-95 transition-all ${
                        isLast
                          ? 'border-amber-400 ring-2 ring-amber-300'
                          : 'border-blue-200 dark:border-blue-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100 flex-1">{parish}</span>
                        {isLast && <LastUseBadge />}
                        <span className="text-blue-500 dark:text-blue-400 text-lg">→</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Footer — full sign-out option */}
        <div className="mt-4 text-center">
          <button
            onClick={onSignOut}
            className="text-xs text-blue-500 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors"
          >
            Cerrar sesión de Google
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
