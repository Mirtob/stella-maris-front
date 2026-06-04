import { X, Music } from 'lucide-react';
import { InstrumentType } from '../types';

interface SelectInstrumentModalProps {
  userInstruments?: InstrumentType[];
  selectedInstrument: InstrumentType;
  onSelect: (instrument: InstrumentType) => void;
  onClose: () => void;
}

export function SelectInstrumentModal({ userInstruments, selectedInstrument, onSelect, onClose }: SelectInstrumentModalProps) {
  const instruments = userInstruments || [selectedInstrument];

  const getInstrumentIcon = (instrument: InstrumentType) => {
    switch (instrument) {
      case 'Guitarra': return '🎶';
      case 'Órgano':   return '🎹';
      default:          return '🎵';
    }
  };

  const getInstrumentDescription = (instrument: InstrumentType) => {
    switch (instrument) {
      case 'Guitarra': return 'Versiones con acordes';
      case 'Órgano':   return 'Versiones con partitura';
      default:          return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md border-2 border-blue-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header compacto */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">Selecciona el instrumento</h2>
              <p className="text-xs opacity-80">¿Cuál usarás para esta Misa?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Botones de instrumento */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          {instruments.map((instrument) => (
            <button
              key={instrument}
              onClick={() => onSelect(instrument)}
              className="w-full bg-amber-50 dark:bg-white/10 hover:bg-amber-100 dark:hover:bg-white/20 border-2 border-amber-200 dark:border-white/20 hover:border-blue-600 rounded-xl p-3 transition-all active:scale-95 flex items-center gap-3"
            >
              <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">{getInstrumentIcon(instrument)}</span>
              </div>
              <div className="text-left flex-1">
                <div className="text-base sm:text-lg font-bold text-blue-950 dark:text-white">{instrument}</div>
                <div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">{getInstrumentDescription(instrument)}</div>
              </div>
              <span className="text-blue-600 dark:text-blue-400 text-lg flex-shrink-0">→</span>
            </button>
          ))}

          <p className="text-xs text-center text-gray-500 dark:text-gray-400 pt-1">
            Podés cambiar el instrumento para cada Misa
          </p>
        </div>
      </div>
    </div>
  );
}
