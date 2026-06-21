import { useEffect, useState, useCallback, useLayoutEffect } from 'react';
import { X } from 'lucide-react';

export interface TourStep {
  id: string;
  /** data-tour del elemento a resaltar. Sin target = tarjeta centrada. */
  target?: string;
  title: string;
  body: string;
  /** Si el elemento no está en pantalla, saltar este paso (en vez de mostrarlo centrado). */
  skipIfMissing?: boolean;
}

interface TourProps {
  steps: TourStep[];
  onClose: () => void;
}

const PAD = 8;

/**
 * Motor de tour guiado: resalta elementos reales por `[data-tour="..."]` con un
 * spotlight + tooltip. Robusto: salta pasos cuyo elemento no exista (skipIfMissing).
 */
export function Tour({ steps, onClose }: TourProps) {
  const [i, setI] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Encuentra el próximo paso "mostrable" desde `start` en dirección `dir`.
  const findRenderable = useCallback((start: number, dir: number): number => {
    let idx = start;
    while (idx >= 0 && idx < steps.length) {
      const s = steps[idx];
      if (!s.target) return idx;
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) return idx;
      if (!s.skipIfMissing) return idx; // se muestra centrado como respaldo
      idx += dir;
    }
    return -1;
  }, [steps]);

  // Paso inicial
  useEffect(() => {
    const first = findRenderable(0, 1);
    if (first === -1) { onClose(); return; }
    setI(first);
  }, [findRenderable, onClose]);

  const step = i >= 0 ? steps[i] : undefined;

  // Solo recalcula la posición del recorte (NO hace scroll). Se usa en
  // scroll/resize para reposicionar sin "pelear" con el scroll del usuario.
  const measure = useCallback(() => {
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    setRect(el.getBoundingClientRect());
  }, [step]);

  // Lleva el objetivo a la vista UNA sola vez por paso (al cambiar de paso). Si el
  // elemento es más alto que la pantalla, lo alinea arriba (no al centro) para que
  // el tooltip con los controles quede visible.
  useEffect(() => {
    if (!step?.target) { setRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) { setRect(null); return; }
    const vhNow = window.innerHeight;
    const tall = el.getBoundingClientRect().height > vhNow * 0.7;
    el.scrollIntoView({ block: tall ? 'start' : 'center', inline: 'nearest', behavior: 'auto' });
    requestAnimationFrame(measure);
  }, [i, step, measure]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const onChange = () => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('scroll', onChange, true);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('scroll', onChange, true);
    };
  }, [measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!step) return null;

  const next = () => {
    const n = findRenderable(i + 1, 1);
    if (n === -1) onClose(); else setI(n);
  };
  const prev = () => {
    const p = findRenderable(i - 1, -1);
    if (p !== -1) setI(p);
  };
  const isLast = findRenderable(i + 1, 1) === -1;
  const hasPrev = findRenderable(i - 1, -1) !== -1;

  // Posición del tooltip. Usa el espacio VISIBLE arriba/abajo del recorte. Si el
  // objetivo no deja hueco suficiente a ningún lado (p. ej. ocupa casi toda la
  // pantalla), el tooltip se fija abajo, siempre encima del spotlight y visible.
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const MIN_GAP = 170; // alto mínimo razonable para el tooltip
  const visTop = rect ? Math.max(rect.top, 0) : 0;
  const visBottom = rect ? Math.min(rect.bottom, vh) : 0;
  const spaceAbove = rect ? visTop : 0;
  const spaceBelow = rect ? vh - visBottom : 0;
  let tooltipStyle: React.CSSProperties;
  if (!rect) {
    tooltipStyle = { position: 'fixed', left: 12, right: 12, top: '50%', transform: 'translateY(-50%)' };
  } else if (spaceBelow >= MIN_GAP) {
    tooltipStyle = { position: 'fixed', left: 12, right: 12, top: visBottom + PAD + 8 };
  } else if (spaceAbove >= MIN_GAP) {
    tooltipStyle = { position: 'fixed', left: 12, right: 12, bottom: vh - visTop + PAD + 8 };
  } else {
    // Sin hueco a ningún lado → fijar abajo (objetivo muy alto).
    tooltipStyle = { position: 'fixed', left: 12, right: 12, bottom: 12 };
  }

  return (
    <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label="Tutorial">
      {/* Captura de clics + atenuado cuando NO hay spotlight */}
      <div className="absolute inset-0" style={{ background: rect ? 'transparent' : 'rgba(2,6,23,0.78)' }} />

      {/* Spotlight: el box-shadow gigante crea el atenuado y deja el "hueco".
          Se recorta a la parte VISIBLE para que un objetivo muy alto no genere un
          borde gigante fuera de pantalla. */}
      {rect && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            top: visTop - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: (visBottom - visTop) + PAD * 2,
            borderRadius: 14,
            boxShadow: '0 0 0 9999px rgba(2,6,23,0.78)',
            border: '3px solid #fbbf24',
            transition: 'all 0.2s ease',
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} className="mx-auto max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border-2 border-amber-400 p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 24px)' }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-bold text-blue-950 dark:text-white leading-tight">{step.title}</h3>
            <button onClick={onClose} aria-label="Saltar tutorial" className="p-1 -m-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0">
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="text-base text-gray-700 dark:text-gray-200 leading-relaxed mb-4">{step.body}</p>
          <div className="flex items-center justify-between gap-2">
            <button onClick={onClose} className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:underline">
              Saltar
            </button>
            <div className="flex items-center gap-2">
              {hasPrev && (
                <button onClick={prev} className="px-4 py-2 rounded-xl text-sm font-bold bg-gray-200 dark:bg-slate-600 text-gray-800 dark:text-white active:scale-95">
                  Anterior
                </button>
              )}
              <button onClick={next} className="px-5 py-2 rounded-xl text-sm font-bold bg-gradient-to-br from-blue-700 to-blue-900 text-white active:scale-95">
                {isLast ? 'Listo' : 'Siguiente'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
