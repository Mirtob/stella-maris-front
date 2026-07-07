import { type RefObject } from 'react';
import { Bold, Italic, Underline, AlignCenter } from 'lucide-react';

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
}

/**
 * Barra de formato básico para el editor de letra: **negrita**, *cursiva*, __subrayado__
 * y centrado de línea (prefijo ">> "). Inserta marcadores sobre la selección del textarea.
 * El formato se ve en la letra del Pueblo (LyricsOnly); en acordes/PDF se muestra limpio.
 */
export function LyricsToolbar({ textareaRef, value, onChange }: Props) {
  const wrap = (marker: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || 'texto';
    const next = value.slice(0, start) + marker + sel + marker + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + marker.length, start + marker.length + sel.length);
    });
  };

  const toggleCenter = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
    const centered = value.slice(lineStart).startsWith('>> ');
    const next = centered
      ? value.slice(0, lineStart) + value.slice(lineStart + 3)
      : value.slice(0, lineStart) + '>> ' + value.slice(lineStart);
    onChange(next);
    const delta = centered ? -3 : 3;
    requestAnimationFrame(() => {
      ta.focus();
      const pos = Math.max(lineStart, start + delta);
      ta.setSelectionRange(pos, pos);
    });
  };

  const btn = 'w-9 h-9 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95 transition-all';

  return (
    <div className="flex gap-1.5 mb-1.5" role="toolbar" aria-label="Formato de la letra">
      <button type="button" onClick={() => wrap('**')} className={btn} title="Negrita" aria-label="Negrita"><Bold className="w-4 h-4" strokeWidth={2.5} /></button>
      <button type="button" onClick={() => wrap('*')} className={btn} title="Cursiva" aria-label="Cursiva"><Italic className="w-4 h-4" strokeWidth={2.5} /></button>
      <button type="button" onClick={() => wrap('__')} className={btn} title="Subrayado" aria-label="Subrayado"><Underline className="w-4 h-4" strokeWidth={2.5} /></button>
      <span className="w-px bg-gray-300 dark:bg-slate-600 mx-0.5" aria-hidden />
      <button type="button" onClick={toggleCenter} className={btn} title="Centrar línea" aria-label="Centrar línea"><AlignCenter className="w-4 h-4" strokeWidth={2.5} /></button>
    </div>
  );
}
