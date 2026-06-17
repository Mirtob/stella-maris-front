import { useState } from 'react';
import { chileDioceses, getParishesByDiocese } from '../../data/chileDioceses';

interface ParishPickerProps {
  /** Parroquias seleccionadas, en formato canónico "<Nombre> - <Diócesis>". */
  selected: string[];
  onChange: (next: string[]) => void;
  /**
   * Parroquias que ya están en el perfil. Se muestran marcadas y bloqueadas para
   * evitar duplicados (útil en el flujo "Agregar parroquia" de Configuración).
   */
  alreadyAdded?: string[];
}

/**
 * Selector reutilizable de parroquias: diócesis (select) + parroquias (checkboxes).
 * Emite los nombres en formato "<Nombre> - <Diócesis>" — el mismo que ya usa el
 * perfil (ver ProfileSetup) y con el que se publican los cantorales.
 *
 * La selección se acumula entre diócesis: cambiar de diócesis no pierde lo ya
 * marcado, porque el estado vive como strings completos en el padre. Esto permite
 * que un coro pertenezca a parroquias de distintas diócesis.
 */
export function ParishPicker({ selected, onChange, alreadyAdded = [] }: ParishPickerProps) {
  const [selectedDiocese, setSelectedDiocese] = useState('');

  const availableParishes = selectedDiocese ? getParishesByDiocese(selectedDiocese) : [];
  const dioceseName = chileDioceses.find(d => d.id === selectedDiocese)?.name ?? '';

  const fullName = (parishName: string) => `${parishName} - ${dioceseName}`;

  const toggle = (parishName: string) => {
    const full = fullName(parishName);
    if (alreadyAdded.includes(full)) return; // ya en el perfil → bloqueada
    onChange(
      selected.includes(full)
        ? selected.filter(p => p !== full)
        : [...selected, full]
    );
  };

  return (
    <div>
      <select
        value={selectedDiocese}
        onChange={(e) => setSelectedDiocese(e.target.value)}
        className="w-full px-3 py-3 sm:px-4 sm:py-4 text-sm sm:text-base rounded-xl border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors"
      >
        <option value="" className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">
          Elige una diócesis...
        </option>
        {chileDioceses.map((diocese) => (
          <option key={diocese.id} value={diocese.id} className="bg-white dark:bg-slate-800 text-blue-950 dark:text-white">
            {diocese.name}
          </option>
        ))}
      </select>

      {selectedDiocese && availableParishes.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100">
            Parroquias disponibles:
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto bg-white/50 dark:bg-white/5 rounded-xl p-4">
            {availableParishes.map((parish) => {
              const full = fullName(parish.name);
              const isAdded = alreadyAdded.includes(full);
              const checked = isAdded || selected.includes(full);
              return (
                <label
                  key={parish.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isAdded
                      ? 'opacity-60 cursor-not-allowed'
                      : 'hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isAdded}
                    onChange={() => toggle(parish.name)}
                    className="w-5 h-5 rounded border-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-white/10 cursor-pointer accent-blue-600 disabled:cursor-not-allowed"
                  />
                  <span className="text-base sm:text-lg font-medium text-blue-900 dark:text-blue-100">
                    {parish.name}
                    {isAdded && <span className="text-sm text-blue-700 dark:text-blue-300"> (ya agregada)</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
