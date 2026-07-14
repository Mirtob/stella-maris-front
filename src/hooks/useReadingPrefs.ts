import { useCallback, useEffect, useState } from 'react';

/**
 * Preferencia de lectura de la letra (Pueblo fiel): tamaño de fuente y alto contraste.
 * Se guarda en localStorage y se sincroniza entre componentes por un evento propio, así
 * el control (en "Ver Cantos") y cada `LyricsOnly` abierto reaccionan juntos.
 */
export interface ReadingPrefs {
  scale: number;        // 0.85 – 1.6 (1 = tamaño normal)
  highContrast: boolean;
}

const KEY = 'sm_reading_prefs';
const EVT = 'sm-reading-prefs';
const MIN = 0.85;
const MAX = 1.6;
const STEP = 0.1;

const clampScale = (n: number) => {
  const v = Math.round(n * 100) / 100;
  return Math.min(MAX, Math.max(MIN, isFinite(v) ? v : 1));
};

function read(): ReadingPrefs {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '');
    return { scale: clampScale(raw.scale ?? 1), highContrast: !!raw.highContrast };
  } catch {
    return { scale: 1, highContrast: false };
  }
}

function write(next: ReadingPrefs) {
  const clean: ReadingPrefs = { scale: clampScale(next.scale), highContrast: !!next.highContrast };
  try { localStorage.setItem(KEY, JSON.stringify(clean)); } catch { /* modo privado */ }
  window.dispatchEvent(new Event(EVT));
}

export function useReadingPrefs() {
  const [prefs, setPrefs] = useState<ReadingPrefs>(read);

  useEffect(() => {
    const sync = () => setPrefs(read());
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const inc = useCallback(() => write({ ...read(), scale: read().scale + STEP }), []);
  const dec = useCallback(() => write({ ...read(), scale: read().scale - STEP }), []);
  const reset = useCallback(() => write({ ...read(), scale: 1 }), []);
  const toggleContrast = useCallback(() => write({ ...read(), highContrast: !read().highContrast }), []);

  return { prefs, inc, dec, reset, toggleContrast, canInc: prefs.scale < MAX, canDec: prefs.scale > MIN };
}
