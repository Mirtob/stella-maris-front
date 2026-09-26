import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ACLAMACIONES, AclamacionId } from '../../data/aclamaciones';

/** Idioma/versión del Padre Nuestro: 'es' = español, 'la' = gregoriano (latín). */
export type PadreNuestroLanguage = 'es' | 'la';

interface AddPadreNuestroDialogProps {
  /** `language` null = sin Padre Nuestro, pero con las aclamaciones marcadas. */
  onConfirm: (language: PadreNuestroLanguage | null, aclamaciones: AclamacionId[]) => void;
  onCancel: () => void;
  /** Aclamaciones que el cantoral ya tiene: no se vuelven a ofrecer. */
  yaAgregadas?: AclamacionId[];
}

export function AddPadreNuestroDialog({ onConfirm, onCancel, yaAgregadas = [] }: AddPadreNuestroDialogProps) {
  const disponibles = ACLAMACIONES.filter((a) => !yaAgregadas.includes(a.id));
  const [marcadas, setMarcadas] = useState<AclamacionId[]>([]);
  const alternar = (id: AclamacionId) =>
    setMarcadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-3 sm:p-5 border-4 border-brand-border animate-fadeInUp transition-colors"
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

          {disponibles.length > 0 && (
            <fieldset className="mb-4">
              <legend className="text-sm sm:text-base font-bold text-brand-ink mb-2">
                ¿Agregar también estas aclamaciones cantadas?
              </legend>
              <div className="space-y-2">
                {disponibles.map((a) => (
                  <label
                    key={a.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/60 dark:bg-white/5 border-2 border-blue-200 dark:border-blue-800 cursor-pointer hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={marcadas.includes(a.id)}
                      onChange={() => alternar(a.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0 accent-blue-700"
                    />
                    <span className="text-sm sm:text-base text-brand-ink-soft">
                      <strong className="text-brand-ink">{a.titulo}</strong>
                      <br />
                      <span className="text-xs sm:text-sm">{a.resumen}</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-blue-700 dark:text-blue-300">
                Se busca su partitura en la carpeta de la Misa en Drive; si no está, va solo la letra.
              </p>
            </fieldset>
          )}

          <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 italic">
            💡 Podrás eliminarlo después desde la tarjeta de Padre Nuestro si lo deseas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onConfirm('es', marcadas)}
              className="flex-1 bg-gradient-to-br from-brand to-brand-strong text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-brand-border"
            >
              Español 🙏
            </button>
            <button
              onClick={() => onConfirm('la', marcadas)}
              className="flex-1 bg-gradient-to-br from-amber-700 to-amber-900 text-white py-3 sm:py-4 px-3 sm:px-4 rounded-xl text-base sm:text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-amber-800"
            >
              Gregoriano (latín) 🎼
            </button>
          </div>
          <button
            onClick={marcadas.length > 0 ? () => onConfirm(null, marcadas) : onCancel}
            className="w-full bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-700 text-brand-ink-soft py-3 px-3 sm:px-4 rounded-xl text-base font-bold hover:bg-white/70 dark:hover:bg-white/20 active:scale-95 transition-all"
          >
            {marcadas.length > 0 ? 'Sin Padre Nuestro, solo las aclamaciones' : 'No, gracias'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
