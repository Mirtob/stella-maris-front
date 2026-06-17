import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Song } from '../../types';

interface AddGloriaDialogProps {
  gloria: Song;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AddGloriaDialog({ gloria, onConfirm, onCancel }: AddGloriaDialogProps) {
  const massName = gloria.massName || 'esta misa';

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div 
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-3 sm:p-5 border-4 border-blue-800 animate-fadeInUp transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl">🕊️</div>
            <h2 className="text-2xl sm:text-lg sm:text-2xl font-bold text-blue-950 dark:text-white">
              ¿Agregar Gloria?
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/30 rounded-lg transition-colors"
            aria-label="Cerrar diálogo"
          >
            <X className="w-6 h-6 text-blue-900 dark:text-blue-100" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-8">
          <p className="text-lg sm:text-xl text-blue-900 dark:text-blue-100 mb-4">
            Has seleccionado el <strong>Kyrie</strong> de la misa <strong className="text-blue-950 dark:text-white">"{massName}"</strong>.
          </p>
          
          <div className="bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-4 mb-4 border-2 border-blue-300 dark:border-blue-700">
            <p className="text-base sm:text-lg text-blue-800 dark:text-blue-200 mb-2">
              <strong>Sugerencia de Gloria:</strong>
            </p>
            <p className="text-lg font-bold text-blue-950 dark:text-white">
              {gloria.title}
            </p>
            {gloria.author && (
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                {gloria.author}
              </p>
            )}
          </div>
          
          <p className="text-base sm:text-lg text-blue-800 dark:text-blue-200 mb-2">
            ¿Deseas agregar el <strong>Gloria sugerido</strong> de esta misa?
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300 italic">
            💡 Podrás cambiarlo después desde la tarjeta de Gloria si lo deseas.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 py-4 px-3 sm:px-4 rounded-xl text-lg font-bold hover:bg-white/70 dark:hover:bg-white/20 active:scale-95 transition-all"
          >
            No, gracias
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-gradient-to-br from-blue-900 to-blue-950 text-white py-4 px-3 sm:px-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-2xl active:scale-95 transition-all border-2 border-blue-800"
          >
            Sí, agregar Gloria 🕊️
          </button>
        </div>
      </div>
    </div>
  );

  // Render dialog using portal to escape overflow-hidden containers
  return createPortal(dialogContent, document.body);
}