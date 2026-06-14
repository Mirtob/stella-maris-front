import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Repeat, Music as MusicIcon, Radio } from 'lucide-react';
import { PublishedCantoral, Song } from '../types';
import { getCategoryColors } from '../utils/colors';

const CATEGORY_ORDER = [
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio',
  'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida',
];

// ── Loader singleton de la IFrame Player API de YouTube ─────────────────────
let ytApiPromise: Promise<any> | null = null;
function loadYouTubeApi(): Promise<any> {
  const w = window as any;
  if (w.YT && w.YT.Player) return Promise.resolve(w.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT);
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

interface PlaylistPlayerProps {
  cantoral: PublishedCantoral;
  onBack: () => void;
}

const isValidVideoId = (id?: string) => !!id && /^[a-zA-Z0-9_-]{11}$/.test(id);

export function PlaylistPlayer({ cantoral, onBack }: PlaylistPlayerProps) {
  // Pistas con video válido, en orden litúrgico.
  const tracks: Song[] = [...cantoral.songs]
    .filter((s) => isValidVideoId(s.youtubeId))
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category));

  const playerRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatAll, setRepeatAll] = useState(true);

  // Refs estables para el callback onStateChange (que captura closures viejos).
  const idxRef = useRef(0); idxRef.current = currentIndex;
  const repeatRef = useRef(true); repeatRef.current = repeatAll;
  const tracksRef = useRef(tracks); tracksRef.current = tracks;

  const playIndex = useCallback((i: number) => {
    const t = tracksRef.current[i];
    if (!t || !playerRef.current?.loadVideoById) return;
    setCurrentIndex(i);
    playerRef.current.loadVideoById(t.youtubeId);
  }, []);

  useEffect(() => {
    if (tracks.length === 0) return;
    let destroyed = false;

    loadYouTubeApi().then((YT) => {
      if (destroyed || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        host: 'https://www.youtube-nocookie.com',
        videoId: tracks[0].youtubeId,
        playerVars: { rel: 0, playsinline: 1, autoplay: 1, modestbranding: 1 },
        events: {
          onStateChange: (e: any) => {
            const S = (window as any).YT.PlayerState;
            if (e.data === S.PLAYING) setIsPlaying(true);
            else if (e.data === S.PAUSED) setIsPlaying(false);
            else if (e.data === S.ENDED) {
              const next = idxRef.current + 1;
              if (next < tracksRef.current.length) playIndex(next);
              else if (repeatRef.current) playIndex(0);
              else setIsPlaying(false);
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      try { playerRef.current?.destroy?.(); } catch { /* noop */ }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo?.(); else p.playVideo?.();
  };
  const goPrev = () => playIndex(currentIndex > 0 ? currentIndex - 1 : (repeatAll ? tracks.length - 1 : 0));
  const goNext = () => {
    if (currentIndex + 1 < tracks.length) playIndex(currentIndex + 1);
    else if (repeatAll) playIndex(0);
  };

  const current = tracks[currentIndex];

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="w-10 h-10 rounded-xl bg-white/50 dark:bg-white/10 border-2 border-white/60 dark:border-white/20 flex items-center justify-center text-blue-950 dark:text-white active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200">
              <Radio className="w-4 h-4" /> Modo radio
            </div>
            <h1 className="text-lg font-bold text-blue-950 dark:text-white truncate">
              {cantoral.liturgicalDate} · {cantoral.massTime}
            </h1>
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="bg-white/40 dark:bg-white/10 rounded-2xl p-6 text-center border-2 border-white/40 dark:border-white/20">
            <MusicIcon className="w-10 h-10 mx-auto mb-2 text-blue-400" />
            <p className="text-blue-950 dark:text-white font-bold mb-1">Sin cantos reproducibles</p>
            <p className="text-sm text-blue-900 dark:text-blue-200">
              Este cantoral no tiene cantos con video de YouTube asociado.
            </p>
          </div>
        ) : (
          <>
            {/* Player */}
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border-2 border-white/40 dark:border-white/20 mb-4">
              <div className="aspect-video bg-black min-h-[200px]">
                {/* YT.Player reemplaza este div por el iframe */}
                <div ref={mountRef} className="w-full h-full" />
              </div>

              {/* Now playing + controles */}
              <div className="p-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm">
                <div className="mb-3">
                  <div className="text-xs text-blue-700 dark:text-blue-300">{current?.category}</div>
                  <div className="text-base font-bold text-blue-950 dark:text-white truncate">{current?.title}</div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={goPrev} aria-label="Anterior" className="w-12 h-12 rounded-full bg-white/60 dark:bg-white/15 flex items-center justify-center text-blue-950 dark:text-white active:scale-95 transition-all">
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'} className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-900 to-blue-950 text-white flex items-center justify-center shadow-lg border-2 border-blue-800 active:scale-95 transition-all">
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-0.5" />}
                  </button>
                  <button onClick={goNext} aria-label="Siguiente" className="w-12 h-12 rounded-full bg-white/60 dark:bg-white/15 flex items-center justify-center text-blue-950 dark:text-white active:scale-95 transition-all">
                    <SkipForward className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setRepeatAll((v) => !v)}
                    aria-label="Repetir todo"
                    aria-pressed={repeatAll}
                    className={`w-12 h-12 rounded-full flex items-center justify-center active:scale-95 transition-all border-2 ${
                      repeatAll
                        ? 'bg-green-600 text-white border-green-700'
                        : 'bg-white/60 dark:bg-white/15 text-blue-950 dark:text-white border-transparent'
                    }`}
                  >
                    <Repeat className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de pistas */}
            <div className="space-y-2">
              {tracks.map((song, i) => {
                const colors = getCategoryColors(song.category);
                const active = i === currentIndex;
                return (
                  <button
                    key={song.id}
                    onClick={() => playIndex(i)}
                    className={`w-full rounded-xl p-3 flex items-center gap-3 text-left border-2 active:scale-98 transition-all ${
                      active
                        ? 'bg-blue-900 text-white border-blue-700 shadow-lg'
                        : 'bg-white/40 dark:bg-white/10 border-white/50 dark:border-white/20 text-blue-950 dark:text-white hover:bg-white/60 dark:hover:bg-white/20'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border-2 shadow"
                      style={{ background: colors.gradient, borderColor: colors.border }}
                    >
                      {active && isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs opacity-80">{song.category}</div>
                      <div className="font-bold truncate">{song.title}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-blue-800 dark:text-blue-300 text-center mt-4">
              Los cantos se reproducen seguidos. Con 🔁 activo, al terminar vuelven a empezar.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
