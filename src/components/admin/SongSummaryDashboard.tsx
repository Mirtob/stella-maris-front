import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, LayoutDashboard, Youtube, Loader2, Copy, ExternalLink,
  CheckCircle2, AlertTriangle, Link2Off, CircleSlash,
} from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { listSongs } from '../../services/songs';
import { listChannelVideos, lookupVideos, officialChannelIds } from '../../services/channelInventory';
import { buildSongReport } from '../../utils/songReport';
import {
  buildChannelInventory, instrumentCoverage, videosOutsideChannel, OUTSIDE_STATUS_LABEL,
  type ChannelVideo, type InstrumentCoverage, type VideoLookup,
} from '../../utils/channelInventory';
import { videoVersionLabel } from '../../utils/songVideo';

/**
 * Resumen de cantos: el tablero del catálogo.
 *
 * Los cantos se agregan y editan SOLO desde la app (Gestión de Cantos). El canal
 * de YouTube se lee aquí únicamente como inventario —qué videos del canal ya
 * están en la app y en qué versión, cuáles faltan por vincular y cuáles usa la
 * app sin estar en el canal—. Leer el canal no escribe nada en la base.
 */

// La última lectura del canal se recuerda en este navegador (comodidad: no hay
// que gastar cuota cada vez que se abre el tablero). Se recalcula contra el
// catálogo actual, así que un video recién vinculado deja de salir "sin vincular".
const STORAGE_KEY = 'stella-channel-reading-v1';
interface SavedReading {
  readAt: string;
  videos: ChannelVideo[];
  lookup: [string, VideoLookup | null][];
}
function loadReading(): SavedReading | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedReading) : null;
  } catch { return null; }
}
function saveReading(r: SavedReading): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch { /* sin almacenamiento: solo se pierde el recuerdo */ }
}

/** Trae TODO el catálogo (search_songs pagina). */
async function listAllSongs(): Promise<Song[]> {
  const PAGE = 500;
  const all: Song[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const page = await listSongs({ limit: PAGE, offset });
    all.push(...page);
    if (page.length < PAGE) break;
  }
  return all;
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Tile({ value, label, hint }: { value: number | string; label: string; hint?: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/10 border-2 border-white/80 dark:border-white/15">
      <div className="text-3xl font-bold leading-none text-brand-ink">{value}</div>
      <div className="text-sm font-bold text-brand-ink-soft mt-1.5">{label}</div>
      {hint && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl p-4 sm:p-5 bg-white/60 dark:bg-white/5 border-2 border-white/70 dark:border-white/10">
      <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      {subtitle && <p className="text-sm text-brand-ink-soft mt-0.5 mb-3">{subtitle}</p>}
      {!subtitle && <div className="mb-3" />}
      {children}
    </section>
  );
}

// Segmentos de la barra "qué ve cada instrumento". Son estados (bien / aceptable /
// con aviso / falta), por eso cada uno lleva además su rótulo y su número.
const COVERAGE_SEGMENTS: { key: keyof InstrumentCoverage; label: string; color: string }[] = [
  { key: 'propia',   label: 'Su versión',                  color: 'bg-emerald-600 dark:bg-emerald-500' },
  { key: 'unica',    label: 'Versión única',               color: 'bg-sky-600 dark:bg-sky-400' },
  { key: 'otra',     label: 'La del otro instrumento',     color: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'sinVideo', label: 'Sin video',                   color: 'bg-slate-300 dark:bg-slate-600' },
];

function CoverageBar({ title, coverage, total }: { title: string; coverage: InstrumentCoverage; total: number }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-bold text-brand-ink">{title}</span>
        <span className="text-sm text-brand-ink-soft">
          {pct(coverage.propia, total)}% con su versión
        </span>
      </div>
      <div
        className="flex h-4 w-full gap-[2px] rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800"
        role="img"
        aria-label={COVERAGE_SEGMENTS.map((s) => `${s.label}: ${coverage[s.key]}`).join(', ')}
      >
        {COVERAGE_SEGMENTS.filter((s) => coverage[s.key] > 0).map((s) => (
          <div
            key={s.key}
            className={`${s.color} h-full`}
            style={{ width: `${(coverage[s.key] / Math.max(total, 1)) * 100}%` }}
            title={`${s.label}: ${coverage[s.key]} (${pct(coverage[s.key], total)}%)`}
          />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-brand-ink-soft">
        {COVERAGE_SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`inline-block w-2.5 h-2.5 rounded-sm ${s.color}`} aria-hidden />
            <span>{s.label}: <strong className="text-brand-ink">{coverage[s.key]}</strong></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressRow({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-semibold text-brand-ink">{label}</span>
        <span className="text-brand-ink-soft">{value} de {total} · {pct(value, total)}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct(value, total)}%` }} />
      </div>
    </div>
  );
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export function SongSummaryDashboard({ onBack }: { onBack: () => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [reading, setReading] = useState<SavedReading | null>(() => loadReading());
  const [readingChannel, setReadingChannel] = useState(false);

  useEffect(() => {
    let alive = true;
    listAllSongs()
      .then((s) => { if (alive) setSongs(s); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const report = useMemo(() => buildSongReport(songs), [songs]);
  const organ = useMemo(() => instrumentCoverage(songs, 'Órgano'), [songs]);
  const guitar = useMemo(() => instrumentCoverage(songs, 'Guitarra'), [songs]);
  const inventory = useMemo(
    () => reading && buildChannelInventory(
      songs, reading.videos, new Map(reading.lookup), officialChannelIds(), new Date(reading.readAt),
    ),
    [songs, reading],
  );

  const readChannel = useCallback(async () => {
    setReadingChannel(true);
    try {
      const videos = await listChannelVideos();
      // Lo que la app usa y no aparece entre los públicos: preguntar qué es.
      const lookup = await lookupVideos(videosOutsideChannel(songs, videos)).catch(() => new Map());
      const r: SavedReading = { readAt: new Date().toISOString(), videos, lookup: Array.from(lookup.entries()) };
      setReading(r);
      saveReading(r);
      toast.success(`Canal leído: ${videos.length} videos`, { description: 'No se modificó ningún canto.' });
    } catch (err: any) {
      toast.error('No se pudo leer el canal', { description: err?.message });
    } finally {
      setReadingChannel(false);
    }
  }, [songs]);

  const copyLink = (id: string) => {
    const url = `https://www.youtube.com/watch?v=${id}`;
    navigator.clipboard?.writeText(url)
      .then(() => toast.success('Enlace copiado', { description: 'Pégalo en la ficha del canto, en la versión que corresponda.' }))
      .catch(() => toast.error('No se pudo copiar', { description: url }));
  };

  const t = report.totals;
  const conVideo = t.total - t.sinVideo;

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-900 dark:text-blue-200 mb-6 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver al Panel</span>
        </button>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow-lg border-4 border-brand-border">
              <LayoutDashboard className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink mb-1">Resumen de cantos</h1>
          <p className="text-base text-brand-ink-soft">
            Los cantos se agregan desde Gestión de Cantos. El canal solo se lee.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-brand-ink-soft font-semibold">Cargando el catálogo…</p>
          </div>
        ) : (
          <>
            {/* Números principales */}
            <div className="grid grid-cols-2 gap-3">
              <Tile value={t.total} label="Cantos en la app" />
              <Tile value={conVideo} label="Con video" hint={`${pct(conVideo, t.total)}% del catálogo`} />
              <Tile value={t.ambas} label="Órgano y guitarra" hint="Las dos versiones grabadas" />
              <Tile value={t.sinVideo} label="Sin video" hint="Aún no se pueden escuchar" />
            </div>

            {/* Qué ve cada instrumento: misma regla que el reproductor (pickSongVideo) */}
            <Section
              title="Qué video escucha cada instrumento"
              subtitle="Según el instrumento del perfil. Si falta su versión, suena la versión única o, si no, la del otro instrumento (con aviso)."
            >
              <CoverageBar title="🎹 Organistas" coverage={organ} total={t.total} />
              <CoverageBar title="🎶 Guitarristas" coverage={guitar} total={t.total} />
            </Section>

            <Section title="Material de cada canto">
              <ProgressRow label="Partitura" value={t.conPartitura} total={t.total} />
              <ProgressRow label="Letra" value={t.conLetra} total={t.total} />
              <ProgressRow label="Letra con acordes" value={t.conAcordes} total={t.total} />
            </Section>

            {/* Desglose por parte de la Misa (tabla: es también la vista accesible) */}
            <Section title="Por parte de la Misa" subtitle="Cuántos cantos tienen cada versión de video.">
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-brand-ink-soft">
                      <th className="py-1.5 px-1 font-semibold">Parte</th>
                      <th className="py-1.5 px-1 font-semibold text-right">Cantos</th>
                      <th className="py-1.5 px-1 font-semibold text-right" title="Versión órgano">🎹</th>
                      <th className="py-1.5 px-1 font-semibold text-right" title="Versión guitarra">🎶</th>
                      <th className="py-1.5 px-1 font-semibold text-right" title="Solo video único">Única</th>
                      <th className="py-1.5 px-1 font-semibold text-right">Sin video</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byCategory.map((c) => (
                      <tr key={c.category} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="py-1.5 px-1 font-semibold text-brand-ink">{c.category}</td>
                        <td className="py-1.5 px-1 text-right text-brand-ink">{c.total}</td>
                        <td className="py-1.5 px-1 text-right text-brand-ink-soft">{c.organo}</td>
                        <td className="py-1.5 px-1 text-right text-brand-ink-soft">{c.guitarra}</td>
                        <td className="py-1.5 px-1 text-right text-brand-ink-soft">{c.soloGeneral}</td>
                        <td className={`py-1.5 px-1 text-right ${c.sinVideo ? 'font-bold text-rose-700 dark:text-rose-300' : 'text-brand-ink-soft'}`}>
                          {c.sinVideo}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Canal de YouTube — inventario de solo lectura */}
            <Section
              title="Canal de YouTube"
              subtitle="Léelo después de subir videos para ver qué ya está en la app y qué falta vincular. No agrega ni modifica cantos."
            >
              <button
                onClick={readChannel}
                disabled={readingChannel}
                className="w-full py-3.5 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-xl text-base font-bold shadow-lg border-2 border-red-500 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
              >
                {readingChannel ? <Loader2 className="w-5 h-5 animate-spin" /> : <Youtube className="w-5 h-5" />}
                {readingChannel ? 'Leyendo el canal…' : reading ? 'Volver a leer el canal' : 'Leer el canal'}
              </button>

              {inventory && (
                <>
                  <p className="text-xs text-brand-ink-soft text-center mt-2">
                    Última lectura: {new Date(inventory.readAt).toLocaleString('es-CL')}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Tile value={inventory.channelTotal} label="Videos en el canal" />
                    <Tile value={inventory.linked.length} label="Ya en la app" />
                    <Tile value={inventory.unlinked.length} label="Sin vincular" hint="En el canal, sin canto" />
                    <Tile value={inventory.outside.length} label="Fuera del canal" hint="La app los usa, el canal no los lista" />
                  </div>

                  {/* Pendiente de vincular: lo más útil después de subir */}
                  <details className="mt-4 group" open={inventory.unlinked.length > 0}>
                    <summary className="cursor-pointer font-bold text-brand-ink flex items-center gap-2 py-1">
                      <Link2Off className="w-4 h-4" /> Sin vincular ({inventory.unlinked.length})
                    </summary>
                    <p className="text-xs text-brand-ink-soft mb-2">
                      Copia el enlace y pégalo en la ficha del canto (Gestión de Cantos), en la versión Órgano, Guitarra o Video único.
                    </p>
                    <ul className="space-y-2">
                      {inventory.unlinked.map((v) => (
                        <li key={v.id} className="flex items-center gap-3 rounded-xl p-2 bg-white/70 dark:bg-white/10">
                          {v.thumbnail && <img src={v.thumbnail} alt="" className="w-16 h-9 rounded object-cover flex-shrink-0" loading="lazy" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-brand-ink truncate">{v.title}</p>
                            <p className="text-xs text-brand-ink-soft">{fmtDate(v.publishedAt)}</p>
                          </div>
                          <button onClick={() => copyLink(v.id)} aria-label={`Copiar enlace de ${v.title}`}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-brand-ink">
                            <Copy className="w-4 h-4" />
                          </button>
                          <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"
                            aria-label={`Abrir ${v.title} en YouTube`}
                            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-brand-ink">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </li>
                      ))}
                      {inventory.unlinked.length === 0 && (
                        <li className="text-sm text-brand-ink-soft">Todos los videos del canal ya están en la app.</li>
                      )}
                    </ul>
                  </details>

                  {/* Ya en la app, con su versión */}
                  <details className="mt-3">
                    <summary className="cursor-pointer font-bold text-brand-ink flex items-center gap-2 py-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Ya en la app ({inventory.linked.length})
                    </summary>
                    <ul className="space-y-2 mt-2">
                      {inventory.linked.map(({ video, uses }) => (
                        <li key={video.id} className="rounded-xl p-2 bg-white/70 dark:bg-white/10">
                          <p className="text-sm font-semibold text-brand-ink truncate">{video.title}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {uses.map((u) => (
                              <span key={`${u.songId}-${u.version}`}
                                className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-ink-soft">
                                {videoVersionLabel(u.version)} · {u.songTitle}
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </details>

                  {/* Lo que usa la app y el canal no lista */}
                  {inventory.outside.length > 0 && (
                    <details className="mt-3" open={inventory.outside.some((o) => o.status === 'no-disponible')}>
                      <summary className="cursor-pointer font-bold text-brand-ink flex items-center gap-2 py-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" /> Fuera del canal ({inventory.outside.length})
                      </summary>
                      <ul className="space-y-2 mt-2">
                        {inventory.outside.map((o) => (
                          <li key={`${o.videoId}-${o.songId}-${o.version}`} className="rounded-xl p-2 bg-white/70 dark:bg-white/10">
                            <p className="text-sm font-semibold text-brand-ink truncate">{o.songTitle}</p>
                            <p className="text-xs text-brand-ink-soft flex items-center gap-1">
                              {o.status === 'no-disponible' && <CircleSlash className="w-3.5 h-3.5 text-rose-600" />}
                              {videoVersionLabel(o.version)} · {OUTSIDE_STATUS_LABEL[o.status]}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
