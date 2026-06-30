import { CheckCircle, Smartphone, Download } from 'lucide-react';

interface PostPublishModalProps {
  onContinueInApp: () => void;
  onDownloadPDF: () => void;
}

export function PostPublishModal({ onContinueInApp, onDownloadPDF }: PostPublishModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-green-600 transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-800 text-white p-6 rounded-t-3xl border-b-4 border-green-600">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/40 backdrop-blur-sm">
              <CheckCircle className="w-12 h-12" strokeWidth={2.5} />
            </div>
            <div className="text-center">
              <h2 className="text-lg sm:text-base sm:text-lg font-bold mb-1">¡Cantoral Publicado!</h2>
              <p className="text-green-100 text-lg">
                Tu cantoral ha sido publicado exitosamente
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center mb-6">
            <p className="text-xl text-gray-800 dark:text-gray-200 font-semibold">
              ¿Qué deseas hacer ahora?
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-4">
            {/* Continuar en la App */}
            <button
              onClick={onContinueInApp}
              className="w-full bg-gradient-to-r from-brand to-brand-strong text-white py-5 px-3 sm:px-4 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all border-2 border-brand-border group"
            >
              <div className="flex items-center justify-center gap-3">
                <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>Continuar en la Aplicación</span>
              </div>
              <p className="text-sm text-blue-200 mt-2">
                Ver el cantoral publicado en la app
              </p>
            </button>

            {/* Descargar PDF */}
            <button
              onClick={onDownloadPDF}
              className="w-full bg-gradient-to-r from-green-700 to-green-800 text-white py-5 px-3 sm:px-4 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all border-2 border-green-600 group"
            >
              <div className="flex items-center justify-center gap-3">
                <Download className="w-6 h-6 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
                <span>Descargar Folleto PDF</span>
              </div>
              <p className="text-sm text-green-200 mt-2">
                Obtener el cantoral en formato PDF para imprimir
              </p>
            </button>
          </div>

          {/* Info adicional */}
          <div className="bg-white/50 dark:bg-white/10 rounded-xl p-4 border-2 border-white/60 dark:border-white/20 transition-colors">
            <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
              💡 <strong>Tip:</strong> Puedes descargar el folleto PDF en cualquier momento desde la sección de cantorales publicados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}