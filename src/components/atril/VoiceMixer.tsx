import { useEffect } from 'react';
import { Play, Pause, X, Volume2, VolumeX, Headphones, Loader, Download } from 'lucide-react';
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

/**
 * Mezclador de voces del Modo Atril.
 *
 * Suena cada voz por separado, como el mezclador de MuseScore: el corista sube la suya
 * para aprendérsela y baja el resto, o pone «solo» y la oye limpia.
 *
 * La descarga NO empieza al abrir esta ventana: primero se dice cuánto pesa y se pide
 * permiso. Un canto son tres a ocho megas, y esto se abre a menudo con datos móviles
 * dentro de una iglesia.
 */
export function VoiceMixer({ titulo, tracks, vozPropia, onClose }: VoiceMixerProps) {
  const m = useVoiceMixer(tracks, vozPropia);
  const peso = pesoTotal(tracks);

  // Salir del mezclador tiene que dejar de sonar, siempre.
  useEffect(() => m.soltar, []); // eslint-disable-line react-hooks/exhaustive-deps

  const voces = m.niveles.filter((n) => n.part !== MEZCLA);
  const mezcla = m.niveles.find((n) => n.part === MEZCLA);

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-lg bg-slate-900 text-white rounded-t-3xl sm:rounded-3xl border-t-4 sm:border-4 border-amber-500 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-slate-950 border-b border-white/10">
          <Headphones className="w-6 h-6 flex-shrink-0 text-amber-400" strokeWidth={2.5} />
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight truncate">Mezclador</p>
            <p className="text-sm text-white/60 truncate">{titulo}</p>
          </div>
          <button
            onClick={() => { m.soltar(); onClose(); }}
            aria-label="Cerrar el mezclador"
            className="w-10 h-10 flex-shrink-0 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Antes de gastar datos, se dice cuánto y se pregunta. */}
          {m.estado === 'vacio' && (
            <>
              <p className="text-base text-white/80 leading-relaxed">
                Cada voz suena por separado: sube la tuya para aprenderte tu línea y baja
                las demás. Son <strong>{tracks.length} pistas</strong> y pesan{' '}
                <strong>{formatearPeso(peso)}</strong>.
              </p>
              <button
                onClick={m.cargar}
                className="w-full bg-gradient-to-br from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 border-2 border-orange-700 active:scale-95 transition-all"
              >
                <Download className="w-6 h-6" strokeWidth={2.5} />
                Descargar y abrir el mezclador
              </button>
              <p className="text-sm text-white/50">
                Con wifi es un momento; con datos móviles, tenlo en cuenta.
              </p>
            </>
          )}

          {m.estado === 'cargando' && (
            <div className="py-8 text-center space-y-3">
              <Loader className="w-8 h-8 animate-spin mx-auto text-amber-400" />
              <p className="text-base text-white/80">Bajando las pistas… {m.progresoCarga}%</p>
            </div>
          )}

          {m.estado === 'error' && (
            <p className="text-base text-red-300 py-6 text-center">
              No se pudieron cargar los audios de este canto. Revisa la conexión y vuelve a intentar.
            </p>
          )}

          {m.estado === 'listo' && (
            <>
              {/* Transporte */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => (m.sonando ? m.pausar() : m.reproducir())}
                  aria-label={m.sonando ? 'Pausar' : 'Reproducir'}
                  className="w-14 h-14 flex-shrink-0 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center active:scale-95 transition-all border-2 border-orange-700"
                >
                  {m.sonando
                    ? <Pause className="w-7 h-7" fill="currentColor" />
                    : <Play className="w-7 h-7 ml-0.5" fill="currentColor" />}
                </button>
                <div className="flex-1 min-w-0">
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
                  <div className="flex justify-between text-sm text-white/60 tabular-nums">
                    <span>{reloj(m.posicion)}</span>
                    <span>{reloj(m.duracion)}</span>
                  </div>
                </div>
              </div>

              {/* Un fader por voz */}
              <div className="space-y-3">
                {voces.map((n) => {
                  const esMia = vozPropia && n.part === vozPropia;
                  return (
                    <div
                      key={n.part}
                      className={`rounded-2xl p-3 border-2 ${
                        esMia ? 'bg-amber-500/15 border-amber-500' : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => m.alternarSilencio(n.part)}
                          aria-label={n.silenciada ? `Activar ${n.part}` : `Silenciar ${n.part}`}
                          className="w-9 h-9 flex-shrink-0 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-95 transition-all"
                        >
                          {n.silenciada
                            ? <VolumeX className="w-5 h-5 text-white/50" strokeWidth={2.5} />
                            : <Volume2 className="w-5 h-5 text-amber-400" strokeWidth={2.5} />}
                        </button>
                        <span className="font-bold flex-1 min-w-0 truncate">
                          {n.part}
                          {esMia && <span className="ml-2 text-xs font-bold text-amber-400">TU VOZ</span>}
                        </span>
                        <button
                          onClick={() => m.solo(n.part)}
                          className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white/10 hover:bg-white/20 active:scale-95 transition-all"
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
              </div>

              {/* La obra completa, por si se quiere oír de una vez */}
              {mezcla && (
                <div className="rounded-2xl p-3 border-2 border-white/10 bg-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold flex-1">Obra completa</span>
                    <span className="text-sm text-white/50">como la toca MuseScore</span>
                  </div>
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

              <p className="text-sm text-white/50">
                Los audios son la reproducción de MuseScore, no una grabación del coro.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
