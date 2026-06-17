import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog rendered via React portal.
 * Replaces window.confirm() for a consistent PWA / mobile-friendly UX.
 *
 * Use the `danger` variant for destructive actions (delete) and `warning`
 * for non-destructive confirmations.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  details,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variantClasses = {
    danger: {
      icon: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-300 dark:border-red-700',
      confirmBtn: 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-800',
      border: 'border-red-400 dark:border-red-700',
    },
    warning: {
      icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border-amber-300 dark:border-amber-700',
      confirmBtn: 'bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 border-amber-700',
      border: 'border-amber-400 dark:border-amber-700',
    },
  };

  const v = variantClasses[variant];

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border-4 ${v.border} animate-fadeInUp transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon + Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 ${v.icon}`}>
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </div>
          <div className="flex-1 pt-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6 ml-1">
          <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
            {message}
          </p>
          {details && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300">{details}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 py-3 sm:py-4 px-4 rounded-xl text-base sm:text-lg font-bold hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-white py-3 sm:py-4 px-4 rounded-xl text-base sm:text-lg font-bold shadow-lg active:scale-95 transition-all border-2 ${v.confirmBtn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
