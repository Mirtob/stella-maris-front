import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronUp, ChevronDown, RotateCcw, Play, Pause, Maximize2, Minimize2, Music, List } from 'lucide-react';
import { Song, UserRole, InstrumentType } from '../../types';
import { transposeContent, getTransposedKey, formatTransposition, getChordNotation, setChordNotation, type ChordNotation } from '../../utils/chordTranspose';
import { LyricsWithChords } from '../songs/LyricsWithChords';
import { LyricsOnly } from '../songs/LyricsOnly';
import { useWakeLock } from '../../hooks/useWakeLock';
import { Tour } from '../tour/Tour';
import { atrilTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { isOrdinary, sortByMassOrder } from '../../utils/ordinary';
import { getDrivePdfProxyUrl } from '../../utils/driveProxy';
import { PDFViewer } from '../common/PDFViewer';

/** "3:45" → 225 (segundos). undefined si no se puede parsear. */
function durationToSeconds(d?: string): number | undefined {
  if (!d) return undefined;
  const parts = d.split(':').map(Number);
  if (parts.length === 2 && parts.every(n => Number.isFinite(n))) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts.every(n => Number.isFinite(n))) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return undefined;
}

interface AtrilModeProps {
  songs: Song[];
  userRole?: UserRole;
  userInstrument?: InstrumentType;
  onClose: () => void;
}

/**
 * Modo Atril (Fases A + B): repertorio en una barra lateral, lectura a pantalla
 * con modo concentración, zoom, transpositor y desplazamiento automático.
 * La pantalla se mantiene encendida (useWakeLock).
 */
export function AtrilMode({ songs, userRole, userInstrument, onClose }: AtrilModeProps) {
  useWakeLock(true);

  const [index, setIndex] = useState(0);
  const [transposition, setTransposition] = useState(0);
  const [fontScale, setFontScale] = useState(1.3);
  const [focus, setFocus] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1..10
  // Notación de los acordes: latino (Do, Re…) o americano (C, D…). Elección del usuario.
  const [notation, setNotation] = useState<ChordNotation>(() => getChordNotation());
  const changeNotation = (n: ChordNotation) => { setNotation(n); setChordNotation(n); };
  // Tip contextual la 1ª vez que se abre el atril (F4).
  const [showTip, setShowTip] = useState(() => !hasSeenTip('atril'));

  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const accRef = useRef(0);

  const isPuebloFiel = userRole === 'Pueblo fiel';
  // El coro ve los acordes encima de la letra con cualquier instrumento (Guitarra u Órgano).
  const showChords = !isPuebloFiel;

  // Repertorio en orden de la Misa (Entrada → Kyrie → … → Salida).
  const orderedSongs = sortByMassOrder(songs);
  const song: Song | undefined = orderedSongs[index];

  // Cuándo mostrar la partitura en vez de la letra:
  //  - Coro: TODOS los cantos que tengan partitura (la letra con acordes queda de
  //    respaldo para los que no la tienen).
  //  - Pueblo fiel: solo las partes fijas del ordinario.
  const scoreEligible = !isPuebloFiel || isOrdinary(song);
  const scoreProxy = scoreEligible ? getDrivePdfProxyUrl(song?.sheetMusicUrl) : null;
  const showScore = !!scoreProxy;
  const canTranspose = !showScore && showChords && !!song?.lyrics;
  // Convierte la notación (latino/americano) y aplica la transposición SOLO a los
  // acordes entre corchetes. La letra queda intacta.
  const displayedLyrics = song?.lyrics
    ? transposeContent(song.lyrics, transposition, notation)
    : '';
  const displayedKey = song?.originalKey
    ? getTransposedKey(song.originalKey, transposition, notation)
    : undefined;

  // Al cambiar de canto: resetear scroll, transposición y autoscroll.
  useEffect(() => {
    setTransposition(0);
    setPlaying(false);
    accRef.current = 0;
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [index]);

  // ESC: salir del modo concentración o cerrar el atril.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Mientras el tip está abierto, ESC lo gestiona el propio Tour (no salir del atril).
      if (showTip) return;
      if (e.key === 'Escape') { if (focus) setFocus(false); else onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, onClose, showTip]);

  // Motor de autoscroll (Fase B).
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      const el = scrollRef.current;
      if (el) {
        // px/seg = speed * 12  (speed 1..10 → 12..120 px/s)
        accRef.current += (speed * 12 * dt) / 1000;
        if (accRef.current >= 1) {
          const add = Math.floor(accRef.current);
          el.scrollTop += add;
          accRef.current -= add;
          if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) { setPlaying(false); return; }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, speed]);

  const toggleFocus = () => {
    const next = !focus;
    setFocus(next);
    try {
      if (next) document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) document.exitFullscreen?.();
    } catch { /* iOS u otros sin soporte → no-op */ }
  };

  const btn = 'flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all border border-white/20 text-white';

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border-b border-white/10 flex-shrink-0">
        <button onClick={onClose} className={`${btn} px-3 py-2 gap-2 flex-shrink-0`} aria-label="Salir del atril">
          <X className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-bold text-sm hidden sm:inline">Salir</span>
        </button>

        {!focus && (
          <div className="min-w-0 flex-1">
            <div className="font-bold truncate leading-tight">{song?.title ?? 'Atril'}</div>
            {displayedKey && <div className="text-xs text-amber-300">Tono: {displayedKey}</div>}
          </div>
        )}

        {/* Zoom de fuente — solo para la letra (la partitura tiene su propio zoom) */}
        {!showScore && (
          <>
            <button onClick={() => setFontScale(s => Math.max(0.8, +(s - 0.15).toFixed(2)))} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Reducir letra"><ZoomOut className="w-6 h-6" strokeWidth={2.5} /></button>
            <button data-tour="atril-zoom" onClick={() => setFontScale(s => Math.min(3, +(s + 0.15).toFixed(2)))} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Agrandar letra"><ZoomIn className="w-6 h-6" strokeWidth={2.5} /></button>
          </>
        )}

        {/* Cifrado de acordes: latino (Do, Re…) ↔ americano (C, D…) */}
        {canTranspose && (
          <button
            onClick={() => changeNotation(notation === 'latin' ? 'american' : 'latin')}
            className={`${btn} px-2 h-11 flex-shrink-0 text-xs font-bold`}
            aria-label="Cambiar cifrado de acordes (latino/americano)"
            title="Cifrado latino / americano"
          >
            {notation === 'latin' ? 'Do·Re' : 'C·D'}
          </button>
        )}

        {/* Transpositor (solo con acordes) */}
        {canTranspose && (
          <>
            <button onClick={() => setTransposition(t => (t - 1 + 12) % 12)} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Bajar medio tono"><ChevronDown className="w-6 h-6" strokeWidth={2.5} /></button>
            <span data-tour="atril-transpositor" className="text-sm font-bold w-12 text-center text-amber-300 flex-shrink-0">{formatTransposition(transposition)}</span>
            <button onClick={() => setTransposition(t => (t + 1) % 12)} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Subir medio tono"><ChevronUp className="w-6 h-6" strokeWidth={2.5} /></button>
            {transposition !== 0 && (
              <button onClick={() => setTransposition(0)} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Tono original"><RotateCcw className="w-5 h-5" strokeWidth={2.5} /></button>
            )}
          </>
        )}

        {/* Modo concentración */}
        <button data-tour="atril-concentracion" onClick={toggleFocus} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label={focus ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          {focus ? <Minimize2 className="w-6 h-6" strokeWidth={2.5} /> : <Maximize2 className="w-6 h-6" strokeWidth={2.5} />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar de repertorio (oculta en modo concentración) */}
        {!focus && (
          <aside data-tour="atril-repertorio" className="w-44 sm:w-56 flex-shrink-0 bg-slate-950/60 border-r border-white/10 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-bold text-white/50 flex items-center gap-1.5"><List className="w-4 h-4" /> Repertorio</div>
            {orderedSongs.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => setIndex(i)}
                className={`w-full text-left px-3 py-3 border-b border-white/5 transition-colors ${i === index ? 'bg-amber-500/20 border-l-4 border-l-amber-400' : 'hover:bg-white/5'}`}
              >
                <div className="text-xs text-amber-300/80">{s.category}</div>
                <div className="text-sm font-bold leading-tight break-words">{s.title}</div>
              </button>
            ))}
          </aside>
        )}

        {/* Panel de lectura */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-900" onPointerDown={() => { if (!showScore && playing) setPlaying(false); }}>
          {!song ? (
            <div className="h-full flex items-center justify-center text-white/50">Selecciona un canto</div>
          ) : showScore ? (
            // Partitura del ordinario (Kyrie/Gloria/Santo/Cordero/Padre Nuestro).
            <div className="p-2 sm:p-4">
              <PDFViewer
                proxyUrl={scoreProxy!}
                driveViewUrl={song.sheetMusicUrl!}
                title={song.title}
                durationSeconds={durationToSeconds(song.duration)}
              />
            </div>
          ) : !displayedLyrics ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50 gap-3 p-6 text-center">
              <Music className="w-12 h-12" />
              <p>{isOrdinary(song) ? 'Esta parte aún no tiene partitura ni letra en el catálogo.' : 'Este canto aún no tiene letra cargada en el catálogo.'}</p>
            </div>
          ) : (
            <div className="p-4 sm:p-8 pb-40" style={{ zoom: fontScale } as any}>
              {showChords ? <LyricsWithChords lyrics={displayedLyrics} /> : <LyricsOnly lyrics={displayedLyrics} />}
            </div>
          )}
        </main>

        {/* Botón flotante para reabrir el repertorio en modo concentración */}
        {focus && (
          <button onClick={() => setFocus(false)} className={`${btn} fixed bottom-24 left-4 w-12 h-12 z-10`} aria-label="Mostrar repertorio"><List className="w-6 h-6" strokeWidth={2.5} /></button>
        )}
      </div>

      {/* Barra de autoscroll de la LETRA (Fase B). La partitura usa el autoscroll
          propio del visor de PDF, así que aquí se oculta. */}
      {!showScore && (
        <div data-tour="atril-autoscroll" className="flex items-center gap-3 px-4 py-3 bg-slate-950 border-t border-white/10 flex-shrink-0" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={() => setPlaying(p => !p)} className={`${btn} w-12 h-12 flex-shrink-0`} aria-label={playing ? 'Pausar desplazamiento' : 'Iniciar desplazamiento'}>
            {playing ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
          </button>
          <span className="text-xs text-white/60 flex-shrink-0">Velocidad</span>
          <input
            type="range" min={1} max={10} step={1} value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="flex-1 accent-amber-400 h-2"
            aria-label="Velocidad de desplazamiento"
          />
          <span className="text-sm font-bold w-6 text-center text-amber-300 flex-shrink-0">{speed}</span>
        </div>
      )}

      {/* Tip contextual (F4): se muestra la 1ª vez que se abre el atril */}
      {showTip && (
        <Tour
          steps={atrilTips}
          onClose={() => { markTipSeen('atril'); setShowTip(false); }}
        />
      )}
    </div>
  );
}
