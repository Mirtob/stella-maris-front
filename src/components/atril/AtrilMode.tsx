import { useEffect, useMemo, useRef, useState } from 'react';
import { X, ZoomIn, ZoomOut, ChevronUp, ChevronDown, RotateCcw, Play, Pause, Maximize2, Minimize2, Music, List, Printer, Loader, Timer, Minus, Plus, MoreVertical, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { Song, UserRole, InstrumentType } from '../../types';
import { transposeContent, getTransposedKey, keyPrefersFlats, formatTransposition, getChordNotation, setChordNotation, type ChordNotation } from '../../utils/chordTranspose';
import { sheetForPart, hasPartSheet, FULL_SCORE } from '../../utils/sheetParts';
import { LyricsWithChords } from '../songs/LyricsWithChords';
import { LyricsOnly } from '../songs/LyricsOnly';
import { useWakeLock } from '../../hooks/useWakeLock';
import { useMetronome } from '../../hooks/useMetronome';
import { Tour } from '../tour/Tour';
import { atrilTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { isOrdinary, sortByMassOrder } from '../../utils/ordinary';
import { getDrivePdfProxyUrl } from '../../utils/driveProxy';
import { cycleForBookId } from '../../data/psalmIndex';
import { generateAtrilPrintable } from '../../utils/atrilBookletPDF';
import { PdfPages } from './PdfPages';
import { PsalmPageImage } from '../songs/PsalmPageImage';
import { FavoriteButton } from '../songs/FavoriteButton';
import { VoiceMixer } from './VoiceMixer';
import { getSongTracks, tieneMezclador, type AudioTrack } from '../../services/songAudio';

interface AtrilModeProps {
  songs: Song[];
  userRole?: UserRole;
  /** Voz/instrumento del corista, para elegir su partitura en cantos polifónicos. */
  userVoicePart?: string;
  userInstrument?: InstrumentType;
  onClose: () => void;
}

type ContentMode = 'score' | 'chords' | 'lyrics';

/**
 * ¿Tener los audios de ensayo a mano en este dispositivo?
 *
 * Se pregunta al abrir el Atril y se recuerda, porque la respuesta depende del plan de
 * datos de cada uno y no cambia de un día para otro. Decir que sí NO descarga ningún
 * audio: solo hace aparecer el botón «Mezclador» en los cantos que tienen pistas. La
 * descarga ocurre cuando se abre el mezclador de UN canto, y avisando cuánto pesa.
 */
const AUDIO_PREF_KEY = 'atril.audios';
const readAudioPref = (): '1' | '0' | null => {
  try { return (localStorage.getItem(AUDIO_PREF_KEY) as '1' | '0' | null) ?? null; } catch { return null; }
};
const writeAudioPref = (v: '1' | '0') => {
  try { localStorage.setItem(AUDIO_PREF_KEY, v); } catch { /* modo privado */ }
};

/** Si el repertorio queda abierto o cerrado se recuerda entre Misas (no es una preferencia de perfil). */
const LIST_PREF_KEY = 'atril.showList';
const readListPref = (): boolean => {
  try { return localStorage.getItem(LIST_PREF_KEY) === '1'; } catch { return false; }
};
const writeListPref = (open: boolean) => {
  try { localStorage.setItem(LIST_PREF_KEY, open ? '1' : '0'); } catch { /* modo privado */ }
};

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
export function AtrilMode({ songs, userRole, userInstrument, userVoicePart, onClose }: AtrilModeProps) {
  useWakeLock(true);

  // Voz efectiva: la del perfil, pero se puede cambiar aquí mismo para este ensayo
  // (el que hoy dobla en trompeta no debería tener que ir a Ajustes).
  const [voicePart, setVoicePart] = useState<string>(userVoicePart || '');

  // ── Audios de ensayo ──────────────────────────────────────────────────────
  // `null` = todavía no se ha preguntado en este dispositivo.
  const [audioPref, setAudioPref] = useState<'1' | '0' | null>(() => readAudioPref());
  // Pistas por canto, resueltas desde su carpeta de Drive. Solo el LISTADO (un JSON
  // pequeño); ningún audio se descarga hasta abrir el mezclador de un canto.
  const [tracksPorCanto, setTracksPorCanto] = useState<Record<string, AudioTrack[]>>({});
  const [mezclador, setMezclador] = useState<{ titulo: string; tracks: AudioTrack[] } | null>(null);
  // Partes disponibles en ESTE cantoral: no tiene sentido ofrecer "Bombardino" si
  // ninguno de los cantos de hoy lo trae.
  const partsInCantoral = useMemo(() => {
    const set = new Set<string>();
    for (const s of songs) for (const sh of s.sheets ?? []) if (sh.part !== FULL_SCORE) set.add(sh.part);
    return Array.from(set).sort();
  }, [songs]);

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
  // Repertorio: panel que se saca de la vista. En el teléfono tapaba la partitura y
  // dejaba los botones de arriba fuera de pantalla; en el computador tampoco hace falta
  // tenerlo fijo, porque los cantos ya vienen en el orden de la Misa. Arranca cerrado y
  // se recuerda la elección.
  const [showList, setShowList] = useState(readListPref);
  // Menú "más" de la barra superior: en pantallas chicas guarda lo secundario para que
  // Salir, Repertorio, Zoom y Pantalla completa entren siempre.
  const [menuOpen, setMenuOpen] = useState(false);
  const metro = useMetronome(90);

  const toggleList = () => setShowList((v) => { writeListPref(!v); return !v; });
  /** ¿El repertorio flota sobre el contenido? (en pantallas chicas sí, y hay que cerrarlo) */
  const listFloats = () => typeof window !== 'undefined' && window.innerWidth < 1024;

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

  /**
   * ¿Hay algún canto que PODRÍA traer audios? Es lo único que se mira para decidir si
   * vale la pena preguntar. No toca la red: solo mira si el canto tiene carpeta de
   * Drive. Preguntar cuando no hay nada que ofrecer sería ruido.
   */
  const puedeHaberAudios = orderedSongs.some((s2) => !!s2.driveFolderId);

  // Con el permiso dado, se piden los LISTADOS de pistas (JSON pequeño, uno por canto).
  // Esto es lo que hace aparecer el botón «Mezclador» solo donde hay algo que mezclar.
  useEffect(() => {
    if (audioPref !== '1') return;
    let cancelado = false;
    (async () => {
      for (const s2 of orderedSongs) {
        if (cancelado || !s2.driveFolderId) continue;
        const clave = `${s2.id}::${s2.category}`;
        if (tracksPorCanto[clave]) continue;
        const pistas = await getSongTracks(s2.driveFolderId);
        if (cancelado) return;
        setTracksPorCanto((prev) => ({ ...prev, [clave]: pistas }));
      }
    })();
    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPref, songs]);

  const responderAudios = (quiere: boolean) => {
    const v = quiere ? '1' : '0';
    setAudioPref(v);
    writeAudioPref(v);
  };

  /** Qué mostrar de cada canto según rol + instrumento. */
  const modeFor = (s: Song): ContentMode => {
    if (isPuebloFiel) return isOrdinary(s) && s.sheetMusicUrl ? 'score' : 'lyrics';
    // Polifonía: quien tiene voz asignada y el canto trae SU partitura, ve la partitura
    // aunque no sea organista — es justamente para lo que la subió el coro.
    if (hasPartSheet(s.sheets, voicePart)) return 'score';
    if (isOrgano) return s.sheetMusicUrl ? 'score' : 'chords';
    return 'chords'; // Guitarra u otro instrumento del coro
  };

  const setTransposition = (i: number, v: number) =>
    setTranspositions(prev => ({ ...prev, [i]: ((v % 12) + 12) % 12 }));

  const instrumentLabel = isPuebloFiel
    ? 'Letra'
    : voicePart
      ? `${voicePart} · Partituras`
      : isOrgano ? 'Órgano · Partituras' : 'Guitarra · Acordes';

  const zoomIn = () => {
    setFontScale(s => Math.min(3, +(s + 0.15).toFixed(2)));
    setPdfZoom(z => Math.min(3, +(z + 0.2).toFixed(2)));
  };
  const zoomOut = () => {
    setFontScale(s => Math.max(0.8, +(s - 0.15).toFixed(2)));
    setPdfZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2)));
  };

  // ESC: cerrar lo que esté abierto encima (menú, repertorio), luego el modo
  // concentración y, por último, el atril.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showTip) return;
      if (e.key !== 'Escape') return;
      if (menuOpen) setMenuOpen(false);
      else if (showList) toggleList();
      else if (focus) setFocus(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, onClose, showTip, menuOpen, showList]);

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
    // En pantalla chica el repertorio tapa la partitura: elegir un canto lo cierra.
    if (listFloats() && showList) toggleList();
  };

  const toggleFocus = () => {
    const next = !focus;
    setFocus(next);
    // Concentración = la mayor superficie posible para la partitura.
    if (next && showList) toggleList();
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
  const menuItem = 'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-white text-left hover:bg-white/10 active:scale-[0.98] transition-all';
  const activeSong = orderedSongs[activeIndex];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white">
      {/* Barra superior. En el teléfono solo queda lo imprescindible —Salir, Repertorio,
          Zoom y Pantalla completa—; el resto vive en el menú "⋮", para que ningún botón
          se salga de la pantalla. Desde `sm` se ve todo en línea, como siempre. */}
      <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 bg-slate-950 border-b border-white/10 flex-shrink-0">
        <button onClick={onClose} className={`${btn} w-10 h-10 sm:w-auto sm:h-11 sm:px-3 sm:gap-2 flex-shrink-0`} aria-label="Salir del atril">
          <X className="w-5 h-5" strokeWidth={2.5} />
          <span className="font-bold text-sm hidden sm:inline">Salir</span>
        </button>

        {/* Repertorio: abrir/cerrar. Es el botón que reemplaza a la barra lateral fija. */}
        <button
          data-tour="atril-repertorio"
          onClick={toggleList}
          aria-label={showList ? 'Ocultar repertorio' : 'Ver repertorio'}
          aria-expanded={showList}
          title="Repertorio de la Misa"
          className={`${btn} w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0 ${showList ? 'bg-amber-500/30 border-amber-400' : ''}`}
        >
          <List className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {/* El título solo desde `sm`: en el teléfono cada canto ya lo muestra en su
            cabecera pegajosa, y ese espacio hace falta para los botones. */}
        {!focus && (
          <div className="min-w-0 flex-1 hidden sm:block">
            <div className="font-bold truncate leading-tight">{activeSong?.title ?? 'Atril'}</div>
            <div className="text-xs text-amber-300/90 truncate">{instrumentLabel}</div>
          </div>
        )}
        <div className="flex-1 sm:hidden" />

        {/* Cambio rápido de voz: solo si algún canto de HOY trae partituras por voz.
            No toca el perfil — es para el que dobla en otra parte esta vez. */}
        {!isPuebloFiel && partsInCantoral.length > 0 && (
          <select
            value={voicePart}
            onChange={(e) => setVoicePart(e.target.value)}
            aria-label="Voz o instrumento"
            className="hidden sm:block flex-shrink-0 bg-white/10 border border-white/25 rounded-lg px-2 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
          >
            <option value="" className="text-black">Partitura general</option>
            {partsInCantoral.map(p => (
              <option key={p} value={p} className="text-black">{p}</option>
            ))}
            {/* La voz del perfil puede no estar en el cantoral de hoy: se ofrece igual
                para poder volver a ella sin salir del Atril. */}
            {voicePart && !partsInCantoral.includes(voicePart) && (
              <option value={voicePart} className="text-black">{voicePart}</option>
            )}
          </select>
        )}

        {/* Zoom global (letra y partitura) */}
        <button onClick={zoomOut} className={`${btn} w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0`} aria-label="Reducir"><ZoomOut className="w-6 h-6" strokeWidth={2.5} /></button>
        <button data-tour="atril-zoom" onClick={zoomIn} className={`${btn} w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0`} aria-label="Agrandar"><ZoomIn className="w-6 h-6" strokeWidth={2.5} /></button>

        {/* Cifrado de acordes global: latino (Do, Re…) ↔ americano (C, D…) */}
        {hasChords && (
          <button
            onClick={() => changeNotation(notation === 'latin' ? 'american' : 'latin')}
            className={`${btn} hidden sm:flex px-2 h-11 flex-shrink-0 text-xs font-bold`}
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
            className={`${btn} hidden sm:flex w-11 h-11 flex-shrink-0 ${showMetro || metro.running ? 'bg-amber-500/30 border-amber-400' : ''}`}
            aria-label="Metrónomo"
            aria-pressed={showMetro}
            title="Metrónomo"
          >
            <Timer className="w-6 h-6" strokeWidth={2.5} />
          </button>
        )}

        {/* Imprimir el atril (PDF vertical, tal cual se ve) */}
        <button onClick={handlePrint} disabled={printing} className={`${btn} hidden sm:flex w-11 h-11 flex-shrink-0 disabled:opacity-60`} aria-label="Imprimir" title="Imprimir (PDF vertical, tal cual se ve)">
          {printing ? <Loader className="w-6 h-6 animate-spin" /> : <Printer className="w-6 h-6" strokeWidth={2.5} />}
        </button>

        {/* Modo concentración */}
        <button data-tour="atril-concentracion" onClick={toggleFocus} className={`${btn} w-10 h-10 sm:w-11 sm:h-11 flex-shrink-0`} aria-label={focus ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          {focus ? <Minimize2 className="w-6 h-6" strokeWidth={2.5} /> : <Maximize2 className="w-6 h-6" strokeWidth={2.5} />}
        </button>

        {/* Menú "⋮" — solo en pantalla chica: lo que no cabe en la barra */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className={`${btn} sm:hidden w-10 h-10 flex-shrink-0 ${menuOpen ? 'bg-white/25' : ''}`}
          aria-label="Más opciones"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="w-6 h-6" strokeWidth={2.5} />
        </button>

        {menuOpen && (
          <>
            <button
              className="fixed inset-0 z-40 cursor-default sm:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar el menú"
              tabIndex={-1}
            />
            <div className="absolute right-2 top-full mt-1 z-50 w-60 rounded-2xl bg-slate-900 border border-white/20 shadow-2xl p-2 space-y-1 sm:hidden">
              <div className="px-2 pb-1">
                <div className="font-bold truncate leading-tight">{activeSong?.title ?? 'Atril'}</div>
                <div className="text-xs text-amber-300/90 truncate">{instrumentLabel}</div>
              </div>

              {!isPuebloFiel && partsInCantoral.length > 0 && (
                <label className="block px-2 py-1">
                  <span className="text-[11px] text-white/50 font-bold">Voz o instrumento</span>
                  <select
                    value={voicePart}
                    onChange={(e) => setVoicePart(e.target.value)}
                    className="w-full mt-1 bg-white/10 border border-white/25 rounded-lg px-2 py-2 text-sm font-bold text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="" className="text-black">Partitura general</option>
                    {partsInCantoral.map(p => (
                      <option key={p} value={p} className="text-black">{p}</option>
                    ))}
                    {voicePart && !partsInCantoral.includes(voicePart) && (
                      <option value={voicePart} className="text-black">{voicePart}</option>
                    )}
                  </select>
                </label>
              )}

              {/* El menú NO se cierra al tocar estas: son de las que se tocan varias veces
                  seguidas o dejan algo abierto abajo. */}
              {hasChords && (
                <button onClick={() => changeNotation(notation === 'latin' ? 'american' : 'latin')} className={menuItem}>
                  <Music className="w-5 h-5" strokeWidth={2.5} />
                  Cifrado: <span className="text-amber-300">{notation === 'latin' ? 'Do·Re' : 'C·D'}</span>
                </button>
              )}
              {hasChords && (
                <button
                  onClick={() => { setShowMetro(s => !s); setMenuOpen(false); }}
                  className={`${menuItem} ${showMetro || metro.running ? 'text-amber-300' : ''}`}
                  aria-pressed={showMetro}
                >
                  <Timer className="w-5 h-5" strokeWidth={2.5} />
                  Metrónomo
                </button>
              )}
              {puedeHaberAudios && (
                <button
                  onClick={() => { responderAudios(audioPref !== '1'); setMenuOpen(false); }}
                  className={`${menuItem} ${audioPref === '1' ? 'text-amber-300' : ''}`}
                  aria-pressed={audioPref === '1'}
                >
                  <Headphones className="w-5 h-5" strokeWidth={2.5} />
                  Audios de ensayo: <span className="text-amber-300">{audioPref === '1' ? 'sí' : 'no'}</span>
                </button>
              )}
              <button
                onClick={() => { setMenuOpen(false); handlePrint(); }}
                disabled={printing}
                className={`${menuItem} disabled:opacity-60`}
              >
                {printing ? <Loader className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" strokeWidth={2.5} />}
                Imprimir
              </button>
            </div>
          </>
        )}
      </div>

      <div className="relative flex flex-1 min-h-0">
        {/* Repertorio: cajón que se saca de la vista. Hasta `lg` FLOTA sobre la partitura
            (con fondo oscuro detrás) y se cierra al elegir un canto; desde `lg` se acopla
            como columna y se queda hasta que se cierre a mano. Nunca es permanente. */}
        {showList && (
          <>
            <button
              className="absolute inset-0 z-20 bg-black/60 lg:hidden cursor-default"
              onClick={toggleList}
              aria-label="Cerrar repertorio"
              tabIndex={-1}
            />
            <aside className="absolute inset-y-0 left-0 z-30 w-64 max-w-[80vw] shadow-2xl lg:static lg:w-56 lg:max-w-none lg:shadow-none flex-shrink-0 bg-slate-950 lg:bg-slate-950/60 border-r border-white/10 overflow-y-auto">
              <div className="sticky top-0 flex items-center gap-1.5 px-3 py-2 bg-slate-950 border-b border-white/10">
                <List className="w-4 h-4 text-white/50" />
                <span className="text-xs font-bold text-white/50 flex-1">Repertorio</span>
                <button onClick={toggleList} className={`${btn} w-8 h-8`} aria-label="Ocultar repertorio">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
              {orderedSongs.map((s, i) => (
                <button
                  key={`${s.id}::${s.category}::${i}`}
                  onClick={() => jumpTo(i)}
                  className={`w-full text-left px-3 py-3 border-b border-white/5 transition-colors ${i === activeIndex ? 'bg-amber-500/20 border-l-4 border-l-amber-400' : 'hover:bg-white/5'}`}
                >
                  <div className="text-xs text-amber-300/80">{s.category}</div>
                  <div className="text-sm font-bold leading-tight break-words">{s.title}</div>
                </button>
              ))}
            </aside>
          </>
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
              // Partitura que le toca a esta persona: la de su voz si el canto la trae,
              // y si no el full score (sheetForPart nunca deja sin partitura).
              const mySheet = sheetForPart(s.sheets ?? [], voicePart);
              const scoreUrl = mySheet
                ? `https://drive.google.com/file/d/${mySheet.fileId}/view`
                : s.sheetMusicUrl;
              const proxy = mode === 'score' ? getDrivePdfProxyUrl(scoreUrl) : null;
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
                  key={`${s.id}::${s.category}::${i}`}
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
                        {/* Forma corta (0, +1, −2): el texto largo de formatTransposition se
                            desbordaba sobre los botones en el teléfono. Queda en el title. */}
                        <span
                          className="text-sm font-bold w-8 text-center text-amber-300"
                          style={{ fontVariantNumeric: 'tabular-nums' }}
                          title={formatTransposition(t)}
                        >
                          {t === 0 ? '0' : t > 0 ? `+${t}` : `−${Math.abs(t)}`}
                        </span>
                        <button onClick={() => setTransposition(i, t + 1)} className={`${btn} w-9 h-9`} aria-label="Subir medio tono"><ChevronUp className="w-5 h-5" strokeWidth={2.5} /></button>
                        {t !== 0 && (
                          <button onClick={() => setTransposition(i, 0)} className={`${btn} w-9 h-9`} aria-label="Tono original"><RotateCcw className="w-4 h-4" strokeWidth={2.5} /></button>
                        )}
                      </div>
                    )}
                    {(() => {
                      // Solo aparece donde hay algo que mezclar: dos voces o más.
                      const pistas = tracksPorCanto[`${s.id}::${s.category}`] ?? [];
                      if (!tieneMezclador(pistas)) return null;
                      return (
                        <button
                          onClick={() => setMezclador({ titulo: s.title, tracks: pistas })}
                          aria-label={`Mezclador de voces de ${s.title}`}
                          title="Mezclador de voces"
                          className={`${btn} w-9 h-9 flex-shrink-0 text-amber-300`}
                        >
                          <Headphones className="w-5 h-5" strokeWidth={2.5} />
                        </button>
                      );
                    })()}
                    <FavoriteButton songId={s.id} className="text-white/70 hover:bg-white/10 flex-shrink-0" />
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
                        {!isPuebloFiel && cycleForBookId(s.psalmBookId) && s.psalmPage != null && (
                          <div className="mt-3">
                            <PsalmPageImage
                              cycle={cycleForBookId(s.psalmBookId)!}
                              page={s.psalmPage}
                              pageEnd={s.psalmPageEnd}
                              title={s.title}
                              driveViewUrl={`https://drive.google.com/file/d/${s.psalmBookId}/view`}
                              zoom={pdfZoom}
                              onDark
                            />
                          </div>
                        )}
                      </>
                    ) : showScore ? (
                      <PdfPages proxyUrl={proxy!} driveViewUrl={scoreUrl!} title={s.title} zoom={pdfZoom} />
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

      {/* En concentración la barra de velocidad se recoge en un botón flotante: en un
          teléfono esos ~70px de alto son partitura. La velocidad se deja elegida antes
          de entrar; tocar la pantalla sigue pausando. */}
      {focus && (
        <button
          onClick={() => setPlaying(p => !p)}
          // A la izquierda: la derecha de cada cabecera lleva transpositor y favorito.
          className={`${btn} fixed left-4 w-14 h-14 z-20 shadow-xl bg-slate-800/90`}
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
          aria-label={playing ? 'Pausar desplazamiento' : 'Iniciar desplazamiento'}
        >
          {playing ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
        </button>
      )}

      {/* Barra de autoscroll global (letra y partituras) */}
      {!focus && (
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

      {/* Audios de ensayo: se pregunta UNA vez por dispositivo, al abrir el atril.
          Decir que sí no descarga nada todavía — solo hace aparecer el botón del
          mezclador en los cantos que traen pistas. */}
      {audioPref === null && puedeHaberAudios && (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full sm:max-w-md bg-slate-900 text-white rounded-3xl border-4 border-amber-500 shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Headphones className="w-8 h-8 flex-shrink-0 text-amber-400" strokeWidth={2.5} />
              <h2 className="text-xl font-bold leading-tight">Audios de ensayo</h2>
            </div>
            <p className="text-base text-white/80 leading-relaxed">
              Varios cantos traen <strong>una pista por voz</strong>. Sirven para
              aprenderte tu línea: subes la tuya y bajas las demás.
            </p>
            <p className="text-base text-white/80 leading-relaxed">
              <strong>No se descarga nada ahora.</strong> Si dices que sí, aparece un
              botón en los cantos que las tienen, y bajas solo el que abras (son unos
              pocos megas por canto).
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => responderAudios(true)}
                className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg border-2 border-orange-700 active:scale-95 transition-all"
              >
                Sí, tenerlos a mano
              </button>
              <button
                onClick={() => responderAudios(false)}
                className="w-full bg-white/10 text-white py-3.5 rounded-2xl font-bold border-2 border-white/20 active:scale-95 transition-all"
              >
                No, ahorrar datos
              </button>
            </div>
            <p className="text-sm text-white/50">
              Puedes cambiarlo cuando quieras desde el menú del atril.
            </p>
          </div>
        </div>
      )}

      {mezclador && (
        <VoiceMixer
          titulo={mezclador.titulo}
          tracks={mezclador.tracks}
          vozPropia={voicePart || undefined}
          onClose={() => setMezclador(null)}
        />
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
