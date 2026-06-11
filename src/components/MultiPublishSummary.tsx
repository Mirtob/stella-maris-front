import { X, Check, QrCode, Church } from 'lucide-react';
import { PublishedCantoral } from '../types';

interface MultiPublishSummaryProps {
  cantorals: PublishedCantoral[];
  /** Abre el QR/PDF de una parroquia puntual (reutiliza el CantoralQRDialog existente). */
  onViewQR: (cantoral: PublishedCantoral) => void;
  onClose: () => void;
}

/**
 * Resumen mostrado tras publicar el MISMO cantoral en varias parroquias. Lista cada
 * parroquia con su fecha/horario y un botón para ver su QR/PDF (cada parroquia tiene
 * su propio cantoral publicado, por eso QR independiente).
 */
export function MultiPublishSummary({ cantorals, onViewQR, onClose }: MultiPublishSummaryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border-4 border-blue-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 border-b-4 border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center border-2 border-green-400">
                <Check className="w-7 h-7 text-white" strokeWidth={3} />
              </div>
              <div>
                <h2 className="text-xl font-bold">¡Publicado!</h2>
                <p className="text-sm opacity-90">
                  {cantorals.length} parroquia{cantorals.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-7 h-7" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cantorals.map((c) => (
            <div
              key={c.id}
              className="bg-white/60 dark:bg-white/10 rounded-2xl p-4 border-2 border-white/50 dark:border-white/20"
            >
              <div className="flex items-start gap-3">
                <Church className="w-5 h-5 text-amber-600 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-blue-950 dark:text-white break-words">{c.parishName}</p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    {c.liturgicalDate} · {c.massTime}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onViewQR(c)}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-900 to-blue-950 text-white py-3 rounded-xl font-bold active:scale-95 transition-all border-2 border-blue-800"
              >
                <QrCode className="w-5 h-5" />
                Ver QR / PDF
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-t-4 border-blue-800 p-4" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button
            onClick={onClose}
            className="w-full bg-white/60 dark:bg-white/20 text-blue-950 dark:text-white py-3 rounded-xl font-bold border-2 border-white/60 dark:border-white/30 active:scale-95 transition-all"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
