import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, X, Volume2, VolumeX, Headphones, Loader, Download, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { useVoiceMixer } from '../../hooks/useVoiceMixer';
import { AudioTrack, MEZCLA, pesoTotal, formatearPeso } from '../../services/songAudio';

interface VoiceMixerProps {
  titulo: string;
  tracks: AudioTrack[];
  /** Voz del corista: entra al máximo y el resto a la mitad. */
  vozPropia?: string;
  onClose: () => void;
}

const reloj = (s: number) => {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

const ANCHO = 320;
const POS_KEY = 'atril.mezclador.pos';
const ABIERTO_KEY = 'atril.mezclador.abierto';

/** Que el panel no se quede fuera de la pantalla al girar el teléfono o cambiar de canto. */
const dentroDePantalla = (p: { x: number; y: number }) => ({
  x: Math.min(Math.max(8, p.x), Math.max(8, window.innerWidth - ANCHO - 8)),
  y: Math.min(Math.max(8, p.y), Math.max(8, window.innerHeight - 120)),
});

const posInicial = () => {
  // Abajo a la DERECHA: abajo a la izquierda está el botón flotante de autoscroll, y
  // arriba la cabecera con el título del canto y el transpositor.
  const porDefecto = {
    x: Math.max(8, window.innerWidth - ANCHO - 12),
    // A media pantalla hacia abajo: deja la partitura visible arriba y sitio de sobra
    // para el panel abierto. En una pantalla baja se sube para que quepa.
    y: Math.max(8, Math.min(window.innerHeight - 320, Math.round(window.innerHeight * 0.42))),
  };
  try {
    const guardada = localStorage.getItem(POS_KEY);
    return guardada ? dentroDePantalla(JSON.parse(guardada)) : porDefecto;
  } catch {
    return porDefecto;
  }
};

/**
 * Mezclador de voces del Modo Atril, como VENTANA FLOTANTE.
 *
 * Empezó siendo un modal a pantalla completa y estaba mal pensado: tapaba justo lo que
 * el corista necesita mirar mientras ensaya su voz. Ahora es un panel que se puede
 * arrastrar, plegar y dejar en una esquina, con la partitura visible y desplazándose
 * detrás. Nada de fondo oscuro ni de capturar el resto de la pantalla: el atril sigue
 * respondiendo con el mezclador abierto.
 *
 * La descarga sigue sin empezar sola. Un canto son tres a ocho megas, y esto se abre a
 * menudo con datos móviles dentro de una iglesia.
 */
export function VoiceMixer({ titulo, tracks, vozPropia, onClose }: VoiceMixerProps) {
  const m = useVoiceMixer(tracks, vozPropia);
  const peso = pesoTotal(tracks);

  const [pos, setPos] = useState(posInicial);
  const [abierto, setAbierto] = useState(() => {
    try { return localStorage.getItem(ABIERTO_KEY) !== '0'; } catch { return true; }
  });
  const arrastre = useRef<{ dx: number; dy: number } | null>(null);

  // Salir del mezclador tiene que dejar de sonar, siempre.
  useEffect(() => m.soltar, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const alRedimensionar = () => setPos((p) => dentroDePantalla(p));
    window.addEventListener('resize', alRedimensionar);
    window.addEventListener('orientationchange', alRedimensionar);
    return () => {
      window.removeEventListener('resize', alRedimensionar);
      window.removeEventListener('orientationchange', alRedimensionar);
    };
  }, []);

  const alternarPliegue = () => {
    setAbierto((v) => {
      try { localStorage.setItem(ABIERTO_KEY, v ? '0' : '1'); } catch { /* modo privado */ }
      return !v;
    });
  };

  // Arrastre con Pointer Events: el mismo código sirve para dedo y ratón.
  const empezarArrastre = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    arrastre.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
  }, [pos]);

  const moverArrastre = useCallback((e: React.PointerEvent) => {
    if (!arrastre.current) return;
    e.preventDefault();
    setPos(dentroDePantalla({ x: e.clientX - arrastre.current.dx, y: e.clientY - arrastre.current.dy }));
  }, []);

  const terminarArrastre = useCallback(() => {
    if (!arrastre.current) return;
    arrastre.current = null;
    setPos((p) => {
      try { localStorage.setItem(POS_KEY, JSON.stringify(p)); } catch { /* modo privado */ }
      return p;
    });
  }, []);

  const voces = m.niveles.filter((n) => n.part !== MEZCLA);
  const mezcla = m.niveles.find((n) => n.part === MEZCLA);

  return (
    // `fixed` sin fondo y sin `inset-0`: solo ocupa su propio recuadro, así que la
    // partitura de detrás se sigue viendo, se desplaza y se puede tocar.
    <div
      className="fixed z-[70] w-[320px] max-w-[calc(100vw-16px)] rounded-2xl bg-slate-900/95 backdrop-blur border-2 border-amber-500 shadow-2xl text-white overflow-hidden flex flex-col"
      style={{
        left: pos.x,
        top: pos.y,
        touchAction: 'none',
        // El alto se ata a lo que queda de pantalla POR DEBAJO del panel: si no, al
        // arrastrarlo hacia abajo los últimos faders quedaban fuera y no había forma
        // de llegar a ellos. `dvh` porque en el móvil la barra del navegador entra y
        // sale y `vh` se queda con el alto de antes.
        maxHeight: `calc(100dvh - ${pos.y + 12}px)`,
      }}
      role="dialog"
      aria-label={`Mezclador de voces de ${titulo}`}
    >
      {/* Cabecera: es el asa para arrastrar y lleva lo imprescindible cuando está plegado */}
      <div
        onPointerDown={empezarArrastre}
        onPointerMove={moverArrastre}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
        className="flex items-center gap-2 px-2 py-2 bg-slate-950 border-b border-white/10 cursor-grab active:cursor-grabbing select-none flex-shrink-0"
      >
        <GripHorizontal className="w-4 h-4 flex-shrink-0 text-white/40" />
        {m.estado === 'listo' ? (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => (m.sonando ? m.pausar() : m.reproducir())}
            aria-label={m.sonando ? 'Pausar' : 'Reproducir'}
            className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center active:scale-95 transition-all"
          >
            {m.sonando
              ? <Pause className="w-5 h-5" fill="currentColor" />
              : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
          </button>
        ) : (
          <Headphones className="w-5 h-5 flex-shrink-0 text-amber-400" strokeWidth={2.5} />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight truncate">{titulo}</p>
          <p className="text-xs text-white/50 leading-tight tabular-nums">
            {m.estado === 'listo' ? `${reloj(m.posicion)} / ${reloj(m.duracion)}` : 'Mezclador'}
          </p>
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={alternarPliegue}
          aria-label={abierto ? 'Plegar el mezclador' : 'Desplegar el mezclador'}
          aria-expanded={abierto}
          className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
        >
          {abierto ? <ChevronDown className="w-4 h-4" strokeWidth={2.5} /> : <ChevronUp className="w-4 h-4" strokeWidth={2.5} />}
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { m.soltar(); onClose(); }}
          aria-label="Cerrar el mezclador"
          className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      </div>

      {abierto && (
        <div className="p-3 space-y-3 overflow-y-auto min-h-0">
          {m.estado === 'vacio' && (
            <>
              <p className="text-sm text-white/80 leading-relaxed">
                Cada voz suena por separado: sube la tuya y baja las demás.{' '}
                <strong>{tracks.length} pistas</strong>, <strong>{formatearPeso(peso)}</strong>.
              </p>
              <button
                onClick={m.cargar}
                className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-orange-700 active:scale-95 transition-all"
              >
                <Download className="w-5 h-5" strokeWidth={2.5} />
                Descargar
              </button>
            </>
          )}

          {m.estado === 'cargando' && (
            <div className="py-6 text-center space-y-2">
              <Loader className="w-6 h-6 animate-spin mx-auto text-amber-400" />
              <p className="text-sm text-white/80">Bajando las pistas… {m.progresoCarga}%</p>
            </div>
          )}

          {m.estado === 'error' && (
            <p className="text-sm text-red-300 py-4 text-center">
              No se pudieron cargar los audios. Revisa la conexión y vuelve a intentar.
            </p>
          )}

          {m.estado === 'listo' && (
            <>
              <input
                type="range"
                min={0}
                max={Math.max(m.duracion, 0.1)}
                step={0.1}
                value={m.posicion}
                onChange={(e) => m.irA(Number(e.target.value))}
                aria-label="Posición"
                className="w-full accent-amber-500"
              />

              {voces.map((n) => {
                const esMia = vozPropia && n.part === vozPropia;
                return (
                  <div
                    key={n.part}
                    className={`rounded-xl p-2 border ${
                      esMia ? 'bg-amber-500/15 border-amber-500' : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <button
                        onClick={() => m.alternarSilencio(n.part)}
                        aria-label={n.silenciada ? `Activar ${n.part}` : `Silenciar ${n.part}`}
                        className="w-8 h-8 flex-shrink-0 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
                      >
                        {n.silenciada
                          ? <VolumeX className="w-4 h-4 text-white/50" strokeWidth={2.5} />
                          : <Volume2 className="w-4 h-4 text-amber-400" strokeWidth={2.5} />}
                      </button>
                      <span className="text-sm font-bold flex-1 min-w-0 truncate">
                        {n.part}
                        {esMia && <span className="ml-1.5 text-[10px] font-bold text-amber-400">TU VOZ</span>}
                      </span>
                      <button
                        onClick={() => m.solo(n.part)}
                        className="px-2 py-1 rounded-md text-xs font-bold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
                      >
                        Solo
                      </button>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={n.silenciada ? 0 : n.volumen}
                      onChange={(e) => m.cambiarVolumen(n.part, Number(e.target.value))}
                      aria-label={`Volumen de ${n.part}`}
                      className="w-full accent-amber-500"
                    />
                  </div>
                );
              })}

              {mezcla && (
                <div className="rounded-xl p-2 border border-white/10 bg-white/5">
                  <span className="text-sm font-bold block mb-1.5">Obra completa</span>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={mezcla.silenciada ? 0 : mezcla.volumen}
                    onChange={(e) => m.cambiarVolumen(MEZCLA, Number(e.target.value))}
                    aria-label="Volumen de la obra completa"
                    className="w-full accent-amber-500"
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
