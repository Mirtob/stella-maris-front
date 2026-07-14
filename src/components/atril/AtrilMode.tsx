import { useEffect, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronUp, ChevronDown, RotateCcw, Play, Pause, Maximize2, Minimize2, Music, List, Printer, Loader, Timer, Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Song, UserRole, InstrumentType } from '../../types';
import { transposeContent, getTransposedKey, keyPrefersFlats, formatTransposition, getChordNotation, setChordNotation, type ChordNotation } from '../../utils/chordTranspose';
import { LyricsWithChords } from '../songs/LyricsWithChords';
import { LyricsOnly } from '../songs/LyricsOnly';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useMetronome } from '../../hooks/useMetronome';
import { Tour } from '../tour/Tour';
import { atrilTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { isOrdinary, sortByMassOrder } from '../../utils/ordinary';
import { getDrivePdfProxyUrl } from '../../utils/driveProxy';
import { generateAtrilPrintable } from '../../utils/atrilBookletPDF';
import { PdfPages } from './PdfPages';

interface AtrilModeProps {
  songs: Song[];
  userRole?: UserRole;
  userInstrument?: InstrumentType;
  onClose: () => void;
}

type ContentMode = 'score' | 'chords' | 'lyrics';

/**
 * Modo Atril — DOCUMENTO CONTINUO. Todos los cantos de la Misa en orden, apilados como
 * un solo archivo: el instrumentista baja de Entrada → Kyrie → Gloria → … sin salir de
 * pantalla completa ni cambiar de archivo. El contenido depende del instrumento:
 *  - Órgano → partituras (páginas de cada PDF); si un canto no tiene, cae a acordes.
 *  - Guitarra (u otro del coro) → letra con acordes encima.
 *  - Pueblo fiel → solo letra (partitura en las partes fijas del ordinario).
 * La transposición es POR CANTO; la notación (latino/americano) y el zoom son globales.
 * La pantalla se mantiene encendida (useWakeLock).
 */
export function AtrilMode({ songs, userRole, userInstrument, onClose }: AtrilModeProps) {
  useWakeLock(true);

  const [transpositions, setTranspositions] = useState<Record<number, number>>({});
  const [fontScale, setFontScale] = useState(1.3);
  const [pdfZoom, setPdfZoom] = useState(1);
  const [focus, setFocus] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(3); // 1..10
  const [notation, setNotation] = useState<ChordNotation>(() => getChordNotation());
  const changeNotation = (n: ChordNotation) => { setNotation(n); setChordNotation(n); };
  const [showTip, setShowTip] = useState(() => !hasSeenTip('atril'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [printing, setPrinting] = useState(false);
  const [showMetro, setShowMetro] = useState(false);
  const metro = useMetronome(90);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const rafRef = useRef<number | undefined>(undefined);
  const accRef = useRef(0);

  const isPuebloFiel = userRole === 'Pueblo fiel';
  const isOrgano = userInstrument === 'Órgano';
  // Hay acordes (y por tanto notación/transposición) para cualquier instrumento del coro.
  const hasChords = !isPuebloFiel;

  // Repertorio en orden de la Misa (Entrada → Kyrie → … → Salida).
  const orderedSongs = sortByMassOrder(songs);

  /** Qué mostrar de cada canto según rol + instrumento. */
  const modeFor = (s: Song): ContentMode => {
    if (isPuebloFiel) return isOrdinary(s) && s.sheetMusicUrl ? 'score' : 'lyrics';
    if (isOrgano) return s.sheetMusicUrl ? 'score' : 'chords';
    return 'chords'; // Guitarra u otro instrumento del coro
  };

  const setTransposition = (i: number, v: number) =>
    setTranspositions(prev => ({ ...prev, [i]: ((v % 12) + 12) % 12 }));

  const instrumentLabel = isPuebloFiel ? 'Letra' : isOrgano ? 'Órgano · Partituras' : 'Guitarra · Acordes';

  const zoomIn = () => {
    setFontScale(s => Math.min(3, +(s + 0.15).toFixed(2)));
    setPdfZoom(z => Math.min(3, +(z + 0.2).toFixed(2)));
  };
  const zoomOut = () => {
    setFontScale(s => Math.max(0.8, +(s - 0.15).toFixed(2)));
    setPdfZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2)));
  };

  // ESC: salir del modo concentración o cerrar el atril.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showTip) return;
      if (e.key === 'Escape') { if (focus) setFocus(false); else onClose(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus, onClose, showTip]);

  // Sección activa (para resaltar el repertorio y mostrar el título en la barra).
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.idx);
            if (Number.isFinite(idx)) setActiveIndex(idx);
          }
        }
      },
      // Banda fina cerca del borde superior: la sección que la cruza es la "activa".
      { root, rootMargin: '-8% 0px -88% 0px', threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [orderedSongs.length]);

  // Motor de autoscroll — desplaza el documento completo (letra y/o partituras).
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last; last = now;
      const el = scrollRef.current;
      if (el) {
        accRef.current += (speed * 12 * dt) / 1000; // speed 1..10 → 12..120 px/s
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

  const jumpTo = (i: number) => {
    setActiveIndex(i);
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFocus = () => {
    const next = !focus;
    setFocus(next);
    try {
      if (next) document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) document.exitFullscreen?.();
    } catch { /* iOS u otros sin soporte → no-op */ }
  };

  // Imprimir: genera un PDF VERTICAL (carta) tal cual se ve el atril — documento
  // continuo con cada canto apilado (partitura / letra con acordes / solo letra según
  // instrumento y rol), respetando las transposiciones y la notación actuales. Lo abre
  // para imprimir; si el popup se bloquea, lo descarga.
  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    toast.info('Preparando el PDF para imprimir…');
    try {
      const { url } = await generateAtrilPrintable({
        songs: orderedSongs,
        instrument: userInstrument,
        role: userRole,
        transpositions,
        notation,
      });
      const w = window.open(url, '_blank');
      if (!w) {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cantoral-atril.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      toast.success('PDF listo para imprimir', {
        description: 'Sale en vertical (carta), tal cual se ve en el atril.',
      });
    } catch (err: any) {
      toast.error('No se pudo generar el PDF', { description: err?.message });
    } finally {
      setPrinting(false);
    }
  };

  const btn = 'flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all border border-white/20 text-white';
  const activeSong = orderedSongs[activeIndex];

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
            <div className="font-bold truncate leading-tight">{activeSong?.title ?? 'Atril'}</div>
            <div className="text-xs text-amber-300/90 truncate">{instrumentLabel}</div>
          </div>
        )}

        {/* Zoom global (letra y partitura) */}
        <button onClick={zoomOut} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Reducir"><ZoomOut className="w-6 h-6" strokeWidth={2.5} /></button>
        <button data-tour="atril-zoom" onClick={zoomIn} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label="Agrandar"><ZoomIn className="w-6 h-6" strokeWidth={2.5} /></button>

        {/* Cifrado de acordes global: latino (Do, Re…) ↔ americano (C, D…) */}
        {hasChords && (
          <button
            onClick={() => changeNotation(notation === 'latin' ? 'american' : 'latin')}
            className={`${btn} px-2 h-11 flex-shrink-0 text-xs font-bold`}
            aria-label="Cambiar cifrado de acordes (latino/americano)"
            title="Cifrado latino / americano"
          >
            {notation === 'latin' ? 'Do·Re' : 'C·D'}
          </button>
        )}

        {/* Metrónomo (solo músicos del coro) */}
        {hasChords && (
          <button
            onClick={() => setShowMetro((s) => !s)}
            className={`${btn} w-11 h-11 flex-shrink-0 ${showMetro || metro.running ? 'bg-amber-500/30 border-amber-400' : ''}`}
            aria-label="Metrónomo"
            aria-pressed={showMetro}
            title="Metrónomo"
          >
            <Timer className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}

        {/* Imprimir el atril (PDF vertical, tal cual se ve) */}
        <button onClick={handlePrint} disabled={printing} className={`${btn} w-11 h-11 flex-shrink-0 disabled:opacity-60`} aria-label="Imprimir" title="Imprimir (PDF vertical, tal cual se ve)">
          {printing ? <Loader className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6" strokeWidth={2.5} />}
        </button>

        {/* Modo concentración */}
        <button data-tour="atril-concentracion" onClick={toggleFocus} className={`${btn} w-11 h-11 flex-shrink-0`} aria-label={focus ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          {focus ? <Minimize2 className="w-6 h-6" strokeWidth={2.5} /> : <Maximize2 className="w-6 h-6" strokeWidth={2.5} />}
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar de repertorio (salta a la sección; oculta en concentración) */}
        {!focus && (
          <aside data-tour="atril-repertorio" className="w-44 sm:w-56 flex-shrink-0 bg-slate-950/60 border-r border-white/10 overflow-y-auto">
            <div className="px-3 py-2 text-xs font-bold text-white/50 flex items-center gap-1.5"><List className="w-4 h-4" /> Repertorio</div>
            {orderedSongs.map((s, i) => (
              <button
                key={s.id || i}
                onClick={() => jumpTo(i)}
                className={`w-full text-left px-3 py-3 border-b border-white/5 transition-colors ${i === activeIndex ? 'bg-amber-500/20 border-l-4 border-l-amber-400' : 'hover:bg-white/5'}`}
              >
                <div className="text-xs text-amber-300/80">{s.category}</div>
                <div className="text-sm font-bold leading-tight break-words">{s.title}</div>
              </button>
            ))}
          </aside>
        )}

        {/* Documento continuo: TODOS los cantos apilados */}
        <main
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-slate-900 pb-40"
          onPointerDown={() => { if (playing) setPlaying(false); }}
        >
          {orderedSongs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/50">No hay cantos en el cantoral</div>
          ) : (
            orderedSongs.map((s, i) => {
              // Salmo del libro: se muestra la página del PDF del libro (coro) + antífona.
              const isPsalm = s.psalmPage != null && !!s.psalmBookId;
              const mode = modeFor(s);
              const proxy = mode === 'score' ? getDrivePdfProxyUrl(s.sheetMusicUrl) : null;
              const showScore = mode === 'score' && !!proxy;
              // Respaldo si se pedía partitura pero no hay proxy válido.
              const fallbackChords = mode === 'score' && !proxy && hasChords;
              const showChordsHere = mode === 'chords' || fallbackChords;
              const t = transpositions[i] ?? 0;
              const preferFlats = keyPrefersFlats(s.originalKey || '', t);
              const lyrics = s.lyrics ? transposeContent(s.lyrics, t, notation, preferFlats) : '';
              const key = showChordsHere && s.originalKey ? getTransposedKey(s.originalKey, t, notation) : undefined;

              return (
                <section
                  key={s.id || i}
                  data-idx={i}
                  ref={(el) => { sectionRefs.current[i] = el; }}
                  className="scroll-mt-0 border-b-4 border-slate-800"
                >
                  {/* Cabecera de la sección: momento + título (+ tono/transpositor si hay acordes) */}
                  <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2 bg-slate-950/95 backdrop-blur border-b border-white/10">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wide truncate">{s.category}</div>
                      <div className="font-bold leading-tight truncate">{s.title}</div>
                    </div>
                    {showChordsHere && s.lyrics && (
                      <div className="flex items-center gap-1 flex-shrink-0" {...(i === activeIndex ? { 'data-tour': 'atril-transpositor' } : {})}>
                        {key && <span className="text-xs text-amber-300 mr-1 hidden sm:inline">Tono: {key}</span>}
                        <button onClick={() => setTransposition(i, t - 1)} className={`${btn} w-9 h-9`} aria-label="Bajar medio tono"><ChevronDown className="w-5 h-5" strokeWidth={2.5} /></button>
                        <span className="text-xs font-bold w-9 text-center text-amber-300">{formatTransposition(t)}</span>
                        <button onClick={() => setTransposition(i, t + 1)} className={`${btn} w-9 h-9`} aria-label="Subir medio tono"><ChevronUp className="w-5 h-5" strokeWidth={2.5} /></button>
                        {t !== 0 && (
                          <button onClick={() => setTransposition(i, 0)} className={`${btn} w-9 h-9`} aria-label="Tono original"><RotateCcw className="w-4 h-4" strokeWidth={2.5} /></button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contenido de la sección */}
                  <div className="px-3 sm:px-6 py-4">
                    {isPsalm ? (
                      <>
                        {s.lyrics && (
                          <div style={{ zoom: fontScale } as any}>
                            <LyricsOnly lyrics={s.lyrics} applyReadingPrefs={false} />
                          </div>
                        )}
                        {!isPuebloFiel && (
                          <div className="mt-3">
                            <PdfPages
                              proxyUrl={`/api/pdf?id=${s.psalmBookId}`}
                              driveViewUrl={`https://drive.google.com/file/d/${s.psalmBookId}/view`}
                              title={s.title}
                              zoom={pdfZoom}
                              fromPage={s.psalmPage}
                              toPage={s.psalmPageEnd ?? s.psalmPage}
                            />
                          </div>
                        )}
                      </>
                    ) : showScore ? (
                      <PdfPages proxyUrl={proxy!} driveViewUrl={s.sheetMusicUrl!} title={s.title} zoom={pdfZoom} />
                    ) : lyrics ? (
                      <div style={{ zoom: fontScale } as any}>
                        {showChordsHere ? <LyricsWithChords lyrics={lyrics} /> : <LyricsOnly lyrics={lyrics} applyReadingPrefs={false} />}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-white/40 gap-2 py-10 text-center">
                        <Music className="w-10 h-10" />
                        <p className="text-sm">{isOrdinary(s) ? 'Esta parte aún no tiene partitura ni letra en el catálogo.' : 'Este canto aún no tiene letra cargada en el catálogo.'}</p>
                      </div>
                    )}
                  </div>
                </section>
              );
            })
          )}
        </main>

        {/* Botón flotante para reabrir el repertorio en modo concentración */}
        {focus && (
          <button onClick={() => setFocus(false)} className={`${btn} fixed bottom-24 left-4 w-12 h-12 z-10`} aria-label="Mostrar repertorio"><List className="w-6 h-6" strokeWidth={2.5} /></button>
        )}
      </div>

      {/* Panel del metrónomo (músicos): play/stop, BPM ± y slider, tap tempo y pulso visual */}
      {showMetro && hasChords && (
        <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-slate-950 border-t border-white/10 flex-shrink-0">
          <button onClick={metro.toggle} className={`${btn} w-11 h-11 flex-shrink-0 ${metro.running ? 'bg-amber-500/30 border-amber-400' : ''}`} aria-label={metro.running ? 'Detener metrónomo' : 'Iniciar metrónomo'}>
            {metro.running ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0" aria-hidden="true">
            {Array.from({ length: metro.beatsPerBar }).map((_, i) => (
              <span key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${metro.running && metro.beat === i ? (i === 0 ? 'bg-amber-400 scale-125' : 'bg-white') : 'bg-white/25'}`} />
            ))}
          </div>
          <button onClick={() => metro.setBpm(metro.bpm - 1)} className={`${btn} w-9 h-9 flex-shrink-0`} aria-label="Menos BPM"><Minus className="w-5 h-5" strokeWidth={2.5} /></button>
          <div className="text-center flex-shrink-0 w-14">
            <div className="text-2xl font-extrabold text-amber-300 leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>{metro.bpm}</div>
            <div className="text-[10px] text-white/50 -mt-0.5">BPM</div>
          </div>
          <button onClick={() => metro.setBpm(metro.bpm + 1)} className={`${btn} w-9 h-9 flex-shrink-0`} aria-label="Más BPM"><Plus className="w-5 h-5" strokeWidth={2.5} /></button>
          <input
            type="range" min={40} max={240} step={1} value={metro.bpm}
            onChange={(e) => metro.setBpm(Number(e.target.value))}
            className="flex-1 min-w-0 accent-amber-400 h-2"
            aria-label="Tempo (BPM)"
          />
          <button onClick={metro.tap} className={`${btn} px-3 h-9 flex-shrink-0 text-xs font-bold`} title="Tap tempo: toca al ritmo">TAP</button>
        </div>
      )}

      {/* Barra de autoscroll global (letra y partituras) */}
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
