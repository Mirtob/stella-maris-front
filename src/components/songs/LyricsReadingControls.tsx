import { Contrast } from 'lucide-react';
import { useReadingPrefs } from '../../hooks/useReadingPrefs';

/**
 * Controles de lectura para la letra del Pueblo fiel: A− / A+ (tamaño) y alto contraste.
 * La preferencia es global (localStorage) y se aplica a todos los `LyricsOnly` abiertos.
 */
export function LyricsReadingControls({ className = '' }: { className?: string }) {
  const { prefs, inc, dec, toggleContrast, canInc, canDec } = useReadingPrefs();
  const pct = Math.round(prefs.scale * 100);
  const base = 'flex items-center justify-center rounded-lg border-2 transition-all active:scale-95 disabled:opacity-40 bg-white dark:bg-slate-800 border-blue-200 dark:border-slate-600 text-brand-ink';

  return (
    <div className={`flex items-center gap-1 flex-shrink-0 ${className}`} role="group" aria-label="Tamaño y contraste de la letra">
      <button onClick={dec} disabled={!canDec} className={`${base} w-8 h-8 text-sm font-bold`} aria-label="Reducir el tamaño de la letra" title="Letra más chica">A<span className="text-[10px]">−</span></button>
      <span className="text-[11px] font-bold text-brand-ink-soft w-9 text-center" style={{ fontVariantNumeric: 'tabular-nums' }} aria-live="polite">{pct}%</span>
      <button onClick={inc} disabled={!canInc} className={`${base} w-8 h-8 text-base font-bold`} aria-label="Aumentar el tamaño de la letra" title="Letra más grande">A<span className="text-xs">+</span></button>
      <button
        onClick={toggleContrast}
        aria-pressed={prefs.highContrast}
        className={`flex items-center justify-center rounded-lg border-2 transition-all active:scale-95 w-8 h-8 ${prefs.highContrast ? 'bg-brand text-white border-brand-border' : `${base}`}`}
        aria-label="Alto contraste"
        title="Alto contraste"
      >
        <Contrast className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}
