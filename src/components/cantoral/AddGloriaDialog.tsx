import { createPortal } from 'react-dom';
import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { Song } from '../../types';
import { matchesSearch } from '../../utils/textSearch';

interface AddGloriaDialogProps {
  /** Gloria sugerido de la misma Misa (puede no haber). */
  suggestion: Song | null;
  /** Todos los Gloria disponibles para elegir manualmente. */
  gloriaSongs: Song[];
  /** Nombre de la Misa del Kyrie elegido (para el texto). */
  massName?: string;
  /** El usuario elige un Gloria concreto. */
  onSelect: (song: Song) => void;
  /** El usuario decide que la Misa NO lleva Gloria (o cierra). */
  onSkip: () => void;
}

export function AddGloriaDialog({ suggestion, gloriaSongs, massName, onSelect, onSkip }: AddGloriaDialogProps) {
  const [query, setQuery] = useState('');
  const misa = massName || 'esta Misa';

  // Filtro por AUTOR o por NOMBRE DE LA MISA (además del título, que es el nombre
  // del canto). Insensible a acentos vía matchesSearch.
  const q = query.trim();
  const filtered = (q
    ? gloriaSongs.filter(s =>
        matchesSearch(s.author, q) ||
        matchesSearch(s.massName, q) ||
        matchesSearch(s.title, q))
    : gloriaSongs
  ).slice(0, 30);

  const dialogContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn" onClick={onSkip} />

      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-blue-950 rounded-3xl shadow-2xl max-w-md w-full p-3 sm:p-5 border-4 border-brand-border animate-fadeInUp transition-colors max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl sm:text-3xl">🕊️</div>
            <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
              ¿La Misa lleva Gloria?
            </h2>
          </div>
          <button onClick={onSkip} className="p-2 hover:bg-white/30 rounded-lg transition-colors" aria-label="Cerrar diálogo">
            <X className="w-6 h-6 text-brand-ink-soft" />
          </button>
        </div>

        <p className="text-sm sm:text-base text-brand-ink-soft mb-4">
          Elegiste el Kyrie de <strong className="text-brand-ink">"{misa}"</strong>.
          Si esta Misa lleva Gloria, elígelo abajo. Si no (p. ej. Adviento o Cuaresma), salta este paso.
        </p>

        {/* Sugerencia de la misma Misa (si la hay) */}
        {suggestion && (
          <button
            onClick={() => onSelect(suggestion)}
            className="w-full text-left bg-blue-100 dark:bg-blue-900/30 rounded-2xl p-4 mb-4 border-2 border-blue-400 dark:border-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50 active:scale-[0.99] transition-all"
          >
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">
              Sugerido de esta Misa · tocar para agregar
            </p>
            <p className="text-base sm:text-lg font-bold text-brand-ink">{suggestion.title}</p>
            {suggestion.author && (
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">{suggestion.author}</p>
            )}
          </button>
        )}

        {/* Buscador por autor o nombre de la Misa */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar Gloria por autor o nombre de la Misa…"
            aria-label="Buscar Gloria por autor o nombre de la Misa"
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/80 dark:bg-white/10 text-brand-ink"
          />
        </div>

        {/* Lista de Gloria para elegir */}
        <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
          {filtered.length === 0 ? (
            <p className="text-sm text-blue-800/70 dark:text-blue-200/70 text-center py-4">
              {gloriaSongs.length === 0
                ? 'No hay cantos de Gloria en el catálogo.'
                : 'Ningún Gloria coincide con la búsqueda.'}
            </p>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className="w-full text-left bg-white/70 dark:bg-white/10 rounded-xl p-3 border-2 border-blue-200 dark:border-white/15 hover:border-blue-500 active:scale-[0.99] transition-all"
              >
                <p className="font-bold text-brand-ink">{s.title}</p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {[s.author, s.massName].filter(Boolean).join(' · ') || 'Sin autor'}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Acción: no lleva Gloria */}
        <button
          onClick={onSkip}
          className="w-full bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-700 text-brand-ink-soft py-3 px-3 sm:px-4 rounded-xl text-base font-bold hover:bg-white/70 dark:hover:bg-white/20 active:scale-95 transition-all"
        >
          No lleva Gloria
        </button>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
}
