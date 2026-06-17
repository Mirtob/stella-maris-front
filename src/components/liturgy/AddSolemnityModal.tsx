import { useState } from 'react';
import { X, Plus, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { formatYmdForDisplay } from '../../utils/dateLocal';

interface AddSolemnityModalProps {
  selectedDate: string;
  onClose: () => void;
  onAdd: (name: string, date: string) => void;
}

export function AddSolemnityModal({ selectedDate, onClose, onAdd }: AddSolemnityModalProps) {
  const [solemnityName, setSolemnityName] = useState('');
  const [solemnityType, setSolemnityType] = useState<'solemnity' | 'feast'>('solemnity');

  const handleSave = () => {
    if (solemnityName.trim()) {
      onAdd(solemnityName.trim(), selectedDate);
      toast.success('Celebración agregada', {
        description: `${solemnityName} ha sido agregada al calendario litúrgico`
      });
      onClose();
    }
  };

  const formatDate = (dateStr: string) =>
    formatYmdForDisplay(dateStr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const canSave = solemnityName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-3xl z-10 border-b-4 border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                <Plus className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Agregar Celebración</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-8 h-8" strokeWidth={2.5} />
            </button>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/30">
            <span className="text-lg font-bold">
              Fecha no encontrada en el calendario litúrgico
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5 space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-5 border-2 border-blue-300 dark:border-blue-700 shadow-lg transition-colors">
            <div className="flex gap-3">
              <div className="text-3xl">📅</div>
              <div>
                <h3 className="text-xl font-bold text-blue-950 dark:text-blue-100 mb-2">
                  Fecha Seleccionada
                </h3>
                <p className="text-lg text-blue-900 dark:text-blue-200">
                  {formatDate(selectedDate)}
                </p>
                <p className="text-base text-blue-800 dark:text-blue-300 mt-2">
                  Esta fecha no corresponde a un domingo del calendario litúrgico ordinario. 
                  Agrega la celebración especial que se realizará este día.
                </p>
              </div>
            </div>
          </div>

          {/* Solemnity Type */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-blue-950 dark:text-white">Tipo de Celebración</span>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSolemnityType('solemnity')}
                className={`py-4 px-5 rounded-xl text-base font-bold transition-all ${
                  solemnityType === 'solemnity'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg border-2 border-purple-800'
                    : 'bg-white/60 dark:bg-white/20 text-blue-900 dark:text-blue-100 hover:bg-white/80 dark:hover:bg-white/30 border-2 border-white/40'
                }`}
              >
                ✨ Solemnidad
              </button>
              <button
                type="button"
                onClick={() => setSolemnityType('feast')}
                className={`py-4 px-5 rounded-xl text-base font-bold transition-all ${
                  solemnityType === 'feast'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg border-2 border-purple-800'
                    : 'bg-white/60 dark:bg-white/20 text-blue-900 dark:text-blue-100 hover:bg-white/80 dark:hover:bg-white/30 border-2 border-white/40'
                }`}
              >
                🎉 Fiesta
              </button>
            </div>
          </div>

          {/* Solemnity Name */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-blue-950 dark:text-white">Nombre de la Celebración</span>
            </label>
            <input
              type="text"
              value={solemnityName}
              onChange={(e) => setSolemnityName(e.target.value)}
              placeholder="Ej: Fiesta del Santo Patrono, Aniversario Parroquial..."
              className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
              Ejemplo: "Nuestra Señora de Guadalupe", "San José Obrero", "Aniversario de la Parroquia"
            </p>
          </div>

          {/* Examples */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/40 dark:border-white/20 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="text-base font-bold text-blue-950 dark:text-white mb-2">Ejemplos comunes</h4>
                <ul className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
                  <li>• Solemnidades de Santos Patronos de la parroquia</li>
                  <li>• Fiestas de la Virgen María (Guadalupe, Fátima, etc.)</li>
                  <li>• Aniversarios parroquiales</li>
                  <li>• Dedicación de la Iglesia</li>
                  <li>• Fiestas de Santos específicos de tu región</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/50 dark:bg-white/20 text-blue-950 dark:text-white py-3 px-4 rounded-xl font-bold text-lg hover:bg-white/70 dark:hover:bg-white/30 transition-colors border-2 border-white/60 dark:border-white/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all border-2 ${
                canSave
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg active:scale-95 border-purple-800'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5 flex-shrink-0" />
                Agregar celebración
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}