import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Idioma/versión del Padre Nuestro: 'es' = español, 'la' = gregoriano (latín). */
export type PadreNuestroLanguage = 'es' | 'la';

interface AddPadreNuestroDialogProps {
  onConfirm: (language: PadreNuestroLanguage) => void;
  onCancel: () => void;
}

export function AddPadreNuestroDialog({ onConfirm, onCancel }: AddPadreNuestroDialogProps) {
  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-3 sm:p-5 border-4 border-brand-border animate-fadeInUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl">🙏</div>
            <h2 className="text-base sm:text-xl font-bold text-brand-ink">
              ¿Padre Nuestro cantado?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/30 rounded-lg transition-colors"
            aria-label="Cerrar diálogo"
          >
            <X className="w-6 h-6 text-brand-ink-soft" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-base sm:text-lg text-brand-ink-soft mb-4">
            ¿En esta Misa se cantará el <strong>Padre Nuestro</strong>? Elige la versión:
          </p>

          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-4 mb-4 border-2 border-blue-300 dark:border-blue-700">
            <p className="text-sm sm:text-base text-blue-800 dark:text-blue-200">
              Aparecerá como una tarjeta en el cantoral y se incluirá su partitura en el PDF:
              <strong> Español</strong> usa la partitura «Padre nuestro»; <strong>Gregoriano</strong> usa «Pater noster» (latín).
            </p>
          </div>

          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 italic">
            💡 Podrás eliminarlo después desde la tarjeta de Padre Nuestro si lo deseas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onConfirm('es')}
              className="flex-1 bg-gradient-to-br from-brand to-brand-strong text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-brand-border"
            >
              Español 🙏
            </button>
            <button
              onClick={() => onConfirm('la')}
              className="flex-1 bg-gradient-to-br from-amber-700 to-amber-900 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-amber-800"
            >
              Gregoriano (latín) 🎼
            </button>
          </div>
          <button
            onClick={onCancel}
            className="w-full bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-700 text-brand-ink-soft py-3 px-3 sm:px-4 rounded-xl text-base font-bold hover:bg-white/70 dark:hover:bg-white/20 active:scale-95 transition-all"
          >
            No, gracias
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
