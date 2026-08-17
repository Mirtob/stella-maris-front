import { Search, X } from 'lucide-react';

/**
 * Los dos controles que comparten los buscadores de Drive (el de la carpeta con las voces
 * y el del PDF suelto): el campo de texto y los chips de momento de la Misa. Viven aparte
 * para que ambos selectores se vean y se comporten igual.
 */

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function SearchField({ value, onChange, placeholder }: SearchFieldProps) {
  return (
    <div className="relative">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2.5 rounded-xl text-base text-gray-900 bg-white border-2 border-gray-300 focus:outline-none focus:border-blue-500 font-medium"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          title="Borrar la búsqueda"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700"
        >
          <X className="w-4 h-4" strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

interface MomentChipsProps {
  counts: { moment: string; count: number }[];
  value: string;
  onChange: (moment: string) => void;
}

/** Filtro por momento de la Misa. Con un solo momento no aporta nada y no se dibuja. */
export function MomentChips({ counts, value, onChange }: MomentChipsProps) {
  if (counts.length < 2) return null;
  const chip = (active: boolean) =>
    `shrink-0 px-3 py-1 rounded-full text-xs font-bold border-2 ${
      active
        ? 'bg-blue-700 text-white border-brand-border'
        : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
    }`;
  return (
    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button type="button" onClick={() => onChange('')} className={chip(value === '')}>
        Todos
      </button>
      {counts.map(c => (
        <button
          key={c.moment}
          type="button"
          // Tocar el que ya está marcado lo suelta: un clic para filtrar, otro para volver.
          onClick={() => onChange(value === c.moment ? '' : c.moment)}
          className={chip(value === c.moment)}
        >
          {c.moment} <span className="opacity-70">{c.count}</span>
        </button>
      ))}
    </div>
  );
}
