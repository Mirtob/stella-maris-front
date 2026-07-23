import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, BarChart3, RefreshCw, Loader, Radio, BookOpen, Music, ThumbsUp, ThumbsDown } from 'lucide-react';
import { getSurveyResults, type SurveyResults as Results, type UsefulMode, PRELAUNCH } from '../../services/survey';

const MODE_META: { id: UsefulMode; label: string; icon: typeof Radio; bar: string }[] = [
  { id: 'radio', label: 'Modo radio', icon: Radio, bar: 'bg-rose-500' },
  { id: 'folleto', label: 'Folleto PDF', icon: BookOpen, bar: 'bg-purple-600' },
  { id: 'atril', label: 'Modo atril', icon: Music, bar: 'bg-amber-500' },
];

export function SurveyResults({ onBack }: { onBack: () => void }) {
  const [data, setData] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    const r = await getSurveyResults();
    if (!r) setError(true);
    else setData(r);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const total = data?.total ?? 0;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const topMode = data
    ? MODE_META.reduce((best, m) => (data.modes[m.id] > data.modes[best.id] ? m : best), MODE_META[0])
    : null;

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-brand font-bold active:opacity-70">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Volver
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-brand to-brand-strong rounded-2xl flex items-center justify-center shadow-lg border-2 border-brand-border flex-shrink-0">
            <BarChart3 className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-brand-ink leading-tight">Resultados de la encuesta</h1>
            <p className="text-brand-ink-soft text-sm">Muestra pre-lanzamiento · {PRELAUNCH.launchDate}</p>
          </div>
        </div>

        <button
          onClick={load}
          disabled={loading}
          className="mb-6 inline-flex items-center gap-2 bg-white dark:bg-slate-800 text-brand-ink font-bold px-4 py-2 rounded-xl border-2 border-blue-200 dark:border-slate-700 active:scale-95 transition-all disabled:opacity-60"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-brand-ink-soft">
            <Loader className="w-8 h-8 animate-spin" />
            <p>Cargando resultados…</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-2xl p-6 text-center text-red-800 dark:text-red-200 font-semibold">
            No se pudieron cargar los resultados. Verifica que la migración esté aplicada y que tu sesión sea de administrador.
          </div>
        ) : total === 0 ? (
          <div className="bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700 rounded-2xl p-8 text-center text-brand-ink-soft">
            <p className="text-lg font-bold text-brand-ink mb-1">Aún no hay respuestas</p>
            <p className="text-sm">Cuando los asistentes usen la muestra <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">/demo</code> y respondan, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Total */}
            <div className="bg-gradient-to-br from-brand to-brand-strong text-white rounded-2xl p-6 shadow-xl border-4 border-brand-border text-center">
              <p className="text-5xl font-extrabold">{total}</p>
              <p className="text-blue-100 font-semibold mt-1">{total === 1 ? 'respuesta' : 'respuestas'}</p>
            </div>

            {/* ¿Interesante? */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-blue-100 dark:border-slate-700">
              <h2 className="font-bold text-brand-ink mb-4">¿La app te resultó interesante?</h2>
              <div className="space-y-4">
                <StatBar
                  icon={<ThumbsUp className="w-5 h-5 text-green-600" strokeWidth={2.5} />}
                  label="Sí" value={data!.interestingYes} pct={pct(data!.interestingYes)} bar="bg-green-500"
                />
                <StatBar
                  icon={<ThumbsDown className="w-5 h-5 text-red-500" strokeWidth={2.5} />}
                  label="No" value={data!.interestingNo} pct={pct(data!.interestingNo)} bar="bg-red-400"
                />
              </div>
            </div>

            {/* Modo más útil */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border-2 border-amber-100 dark:border-slate-700">
              <h2 className="font-bold text-brand-ink mb-1">¿Qué modo fue más útil?</h2>
              {topMode && data!.modes[topMode.id] > 0 && (
                <p className="text-sm text-brand-ink-soft mb-4">
                  Más elegido: <strong className="text-brand-ink">{topMode.label}</strong>
                </p>
              )}
              <div className="space-y-4 mt-2">
                {MODE_META.map(({ id, label, icon: Icon, bar }) => (
                  <StatBar
                    key={id}
                    icon={<Icon className="w-5 h-5 text-brand" strokeWidth={2.5} />}
                    label={label} value={data!.modes[id]} pct={pct(data!.modes[id])} bar={bar}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBar({ icon, label, value, pct, bar }: { icon: ReactNode; label: string; value: number; pct: number; bar: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="font-semibold text-brand-ink">{label}</span>
        <span className="ml-auto font-bold text-brand-ink">{value}</span>
        <span className="text-brand-ink-soft text-sm w-12 text-right">{pct}%</span>
      </div>
      <div className="h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
