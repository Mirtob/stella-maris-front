import { useState, useEffect } from 'react';
import { chileDioceses, getParishesByDiocese } from '../../data/chileDioceses';
import { listCustomParishes, CustomParish } from '../../services/customParishes';
import { listChapels, Chapel } from '../../services/chapels';

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
  const [customParishes, setCustomParishes] = useState<CustomParish[]>([]);
  const [chapels, setChapels] = useState<Chapel[]>([]);

  useEffect(() => {
    let cancelled = false;
    listCustomParishes().then((list) => { if (!cancelled) setCustomParishes(list); });
    listChapels().then((list) => { if (!cancelled) setChapels(list); });
    return () => { cancelled = true; };
  }, []);

  const norm = (s: string) => s.trim().toLowerCase();

  const staticParishes = selectedDiocese ? getParishesByDiocese(selectedDiocese) : [];
  // Parroquias administradas de esta diócesis (no duplicar nombres del catálogo).
  const customForDiocese = customParishes.filter(c => c.dioceseId === selectedDiocese);
  const availableParishes = [
    ...staticParishes.map(p => ({ id: p.id, name: p.name })),
    ...customForDiocese
      .filter(c => !staticParishes.some(p => p.name === c.name))
      .map(c => ({ id: c.id, name: c.name })),
  ];
  const dioceseName = chileDioceses.find(d => d.id === selectedDiocese)?.name ?? '';

  const fullName = (parishName: string) => `${parishName} - ${dioceseName}`;

  // Toggle genérico sobre el string completo (parroquia o "parroquia · capilla").
  const toggleFull = (full: string) => {
    if (alreadyAdded.includes(full)) return; // ya en el perfil → bloqueada
    onChange(
      selected.includes(full)
        ? selected.filter(p => p !== full)
        : [...selected, full]
    );
  };
  const toggle = (parishName: string) => toggleFull(fullName(parishName));

  // Capillas de una parroquia (match por "<Parroquia> - <Diócesis>").
  const chapelsFor = (parishFull: string) =>
    chapels.filter(ch => norm(ch.parishFull) === norm(parishFull));

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
              const parishChapels = chapelsFor(full);
              const hasChapels = parishChapels.length > 0;
              return (
                <div key={parish.id} className={hasChapels ? 'rounded-lg bg-white/40 dark:bg-white/5 p-2' : ''}>
                  {/* Nombre de la parroquia: cabecera del grupo cuando tiene capillas */}
                  {hasChapels && (
                    <div className="px-2 pt-1 pb-1 text-sm font-bold text-blue-950 dark:text-white">
                      {parish.name}
                    </div>
                  )}
                  <label
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
                      {hasChapels ? 'Sede parroquial' : parish.name}
                      {isAdded && <span className="text-sm text-blue-700 dark:text-blue-300"> (ya agregada)</span>}
                    </span>
                  </label>

                  {/* Capillas de esta parroquia (para coros que solo cantan en una capilla) */}
                  {parishChapels.map((ch) => {
                    const chFull = `${full} · ${ch.name}`;
                    const chAdded = alreadyAdded.includes(chFull);
                    const chChecked = chAdded || selected.includes(chFull);
                    return (
                      <label
                        key={ch.id}
                        className={`flex items-center gap-3 py-2 pl-10 pr-3 rounded-lg transition-colors ${
                          chAdded
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:bg-white/30 dark:hover:bg-white/10 cursor-pointer'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={chChecked}
                          disabled={chAdded}
                          onChange={() => toggleFull(chFull)}
                          className="w-5 h-5 rounded border-2 border-amber-600 dark:border-amber-400 bg-white dark:bg-white/10 cursor-pointer accent-amber-600 disabled:cursor-not-allowed"
                        />
                        <span className="text-sm sm:text-base text-amber-900 dark:text-amber-200">
                          ⛪ Capilla {ch.name}
                          {chAdded && <span className="text-xs text-amber-700 dark:text-amber-300"> (ya agregada)</span>}
                        </span>
                      </label>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
