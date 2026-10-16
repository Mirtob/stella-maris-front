import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Activity, Loader2, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  getUsageSummary, getRecentUsage, type UsageSummary, type UsageEvent,
} from '../../services/usageLog';
import { usageModuleLabel, fillDays } from '../../utils/usageModules';
import { isUsernameAccount } from '../../services/supabaseClient';

/**
 * Uso de la app (solo administrador principal).
 *
 * Lee el registro de visitas por módulo (tabla usage_events, migración
 * 20261016_usage_events): módulos más usados, usuarios más frecuentes, actividad
 * diaria y el log de las últimas visitas, descargable en CSV.
 */

const PERIODS = [7, 30, 90, 365] as const;

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Nombre para mostrar: el nombre, o el usuario/correo si no hay. */
function quien(name: string | null, email: string | null): string {
  if (name?.trim()) return name;
  if (!email) return 'Usuario eliminado';
  return isUsernameAccount(email) ? email.split('@')[0] : email;
}

function Tile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl p-4 bg-white/70 dark:bg-white/10 border-2 border-white/80 dark:border-white/15 min-w-0">
      <div className="text-2xl sm:text-3xl font-bold leading-none text-brand-ink truncate">{value}</div>
      <div className="text-sm font-bold text-brand-ink-soft mt-1.5">{label}</div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl p-4 sm:p-5 bg-white/60 dark:bg-white/5 border-2 border-white/70 dark:border-white/10">
      <h2 className="text-lg font-bold text-brand-ink">{title}</h2>
      {subtitle ? <p className="text-sm text-brand-ink-soft mt-0.5 mb-3">{subtitle}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

/** CSV con separador `;` (Excel en español) y BOM para los acentos. */
function toCSV(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
}

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function UsageDashboard({ onBack }: { onBack: () => void }) {
  const [days, setDays] = useState<number>(30);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [recent, setRecent] = useState<UsageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    setError(null);
    try {
      const [s, r] = await Promise.all([getUsageSummary(d), getRecentUsage(200)]);
      setSummary(s);
      setRecent(r);
    } catch (err: any) {
      setError(err?.message ?? 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(days); }, [days, load]);

  const exportLog = () => {
    if (!summary) return;
    const hoy = new Date().toISOString().slice(0, 10);
    download(`registro-uso-${hoy}.csv`, toCSV([
      ['Fecha y hora', 'Usuario', 'Correo / usuario', 'Rol', 'Módulo'],
      ...recent.map((e) => [
        new Date(e.created_at).toLocaleString('es-CL'),
        quien(e.name, e.email), e.email ?? '', e.role ?? '', usageModuleLabel(e.module),
      ]),
      [],
      [`Módulos más usados (últimos ${summary.days} días)`],
      ['Módulo', 'Visitas', 'Usuarios distintos'],
      ...summary.modules.map((m) => [usageModuleLabel(m.module), m.visits, m.users]),
      [],
      [`Usuarios más frecuentes (últimos ${summary.days} días)`],
      ['Usuario', 'Correo / usuario', 'Rol', 'Visitas', 'Días activos', 'Última visita', 'Módulo favorito'],
      ...summary.users.map((u) => [
        quien(u.name, u.email), u.email ?? '', u.role ?? '', u.visits, u.activeDays,
        new Date(u.lastAt).toLocaleString('es-CL'), u.topModule ? usageModuleLabel(u.topModule) : '',
      ]),
    ]));
    toast.success('Registro descargado');
  };

  const maxModule = Math.max(1, ...(summary?.modules.map((m) => m.visits) ?? [1]));
  const serie = summary ? fillDays(summary.byDay, summary.days) : [];
  const maxDay = Math.max(1, ...serie.map((d) => d.visits));
  const promedio = summary && summary.totals.users
    ? (summary.totals.visits / summary.totals.users).toFixed(1) : '0';

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
              <Activity className="w-8 h-8 text-white" strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink mb-1">Uso de la app</h1>
          <p className="text-base text-brand-ink-soft">Módulos más usados y usuarios más frecuentes</p>
        </div>

        {/* Periodo */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-2" role="group" aria-label="Periodo">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              aria-pressed={days === p}
              className={`px-3 py-1.5 rounded-full text-sm font-bold border-2 transition-colors ${
                days === p
                  ? 'bg-brand text-white border-brand-border'
                  : 'bg-white/60 dark:bg-white/10 text-brand-ink border-white/70 dark:border-white/15'
              }`}
            >
              {p === 365 ? '1 año' : `${p} días`}
            </button>
          ))}
          <button onClick={() => load(days)} aria-label="Actualizar"
            className="p-2 rounded-full bg-white/60 dark:bg-white/10 text-brand-ink border-2 border-white/70 dark:border-white/15">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
            <p className="text-brand-ink-soft font-semibold">Cargando el registro…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-5 text-center">
            <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <p className="font-bold text-red-900 dark:text-red-100">No se pudo leer el registro de uso</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-2">
              Si es la primera vez, aplica la migración <code>20261016_usage_events.sql</code> en Supabase.
            </p>
          </div>
        )}

        {!loading && !error && summary && (
          <>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Tile value={summary.totals.visits} label="Visitas" />
              <Tile value={summary.totals.users} label="Usuarios activos" />
              <Tile value={promedio} label="Visitas por usuario" />
              <Tile value={summary.modules[0] ? usageModuleLabel(summary.modules[0].module) : '—'} label="Módulo más usado" />
            </div>

            {summary.totals.visits === 0 ? (
              <p className="text-center text-brand-ink-soft mt-8">
                Todavía no hay visitas registradas en este periodo. El registro empieza a llenarse
                a medida que los usuarios abren la app.
              </p>
            ) : (
              <>
                {/* Actividad diaria: una sola serie, sin leyenda */}
                <Section title="Visitas por día">
                  <div className={`flex items-end h-28 ${serie.length > 90 ? '' : 'gap-[2px]'}`} role="img"
                    aria-label={`Visitas por día en los últimos ${summary.days} días`}>
                    {serie.map((d) => (
                      <div key={d.day} className="flex-1 min-w-0 h-full flex items-end group"
                        title={`${fmtFecha(d.day + 'T12:00:00')}: ${d.visits} visitas, ${d.users} usuarios`}>
                        <div className="w-full rounded-t-[4px] bg-brand group-hover:opacity-80"
                          style={{ height: d.visits ? `${Math.max(3, (d.visits / maxDay) * 100)}%` : '0' }} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-brand-ink-soft mt-1">
                    <span>{serie[0] && fmtFecha(serie[0].day + 'T12:00:00')}</span>
                    <span>máx. {maxDay} visitas/día</span>
                    <span>{serie.length > 0 && fmtFecha(serie[serie.length - 1].day + 'T12:00:00')}</span>
                  </div>
                </Section>

                <Section title="Módulos más usados" subtitle="Visitas y cuántas personas distintas lo abrieron.">
                  <ul className="space-y-2.5">
                    {summary.modules.map((m) => (
                      <li key={m.module}>
                        <div className="flex justify-between gap-2 text-sm mb-1">
                          <span className="font-semibold text-brand-ink truncate">{usageModuleLabel(m.module)}</span>
                          <span className="text-brand-ink-soft flex-shrink-0">
                            {m.visits} visitas · {m.users} {m.users === 1 ? 'persona' : 'personas'}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div className="h-full rounded-full bg-brand" style={{ width: `${(m.visits / maxModule) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title="Usuarios más frecuentes" subtitle="Los 50 que más usan la app en el periodo.">
                  <ol className="space-y-2">
                    {summary.users.map((u, i) => (
                      <li key={u.userId} className="flex items-start gap-3 rounded-xl p-2.5 bg-white/70 dark:bg-white/10">
                        <span className="w-7 text-right font-bold text-brand-ink-soft flex-shrink-0">{i + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="font-bold text-brand-ink truncate">{quien(u.name, u.email)}</span>
                            {u.role && <span className="text-xs text-brand-ink-soft">{u.role}</span>}
                          </div>
                          <p className="text-xs text-brand-ink-soft">
                            {u.activeDays} {u.activeDays === 1 ? 'día activo' : 'días activos'}
                            {u.topModule && <> · más usa: {usageModuleLabel(u.topModule)}</>}
                            {' · '}última vez {fmtFechaHora(u.lastAt)}
                          </p>
                        </div>
                        <span className="text-right flex-shrink-0">
                          <span className="block text-lg font-bold text-brand-ink leading-none">{u.visits}</span>
                          <span className="text-[11px] text-brand-ink-soft">visitas</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </Section>
              </>
            )}

            {/* El log */}
            <Section title="Registro reciente" subtitle="Las últimas 200 visitas, de la más nueva a la más antigua.">
              <button
                onClick={exportLog}
                className="w-full mb-3 py-3 bg-gradient-to-br from-green-700 to-emerald-900 text-white border-2 border-green-600 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-5 h-5" /> Descargar registro (CSV)
              </button>
              {recent.length === 0 ? (
                <p className="text-sm text-brand-ink-soft">Sin visitas todavía.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto -mx-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-amber-50 dark:bg-slate-900">
                      <tr className="text-left text-xs uppercase tracking-wide text-brand-ink-soft">
                        <th className="py-1.5 px-1 font-semibold">Cuándo</th>
                        <th className="py-1.5 px-1 font-semibold">Usuario</th>
                        <th className="py-1.5 px-1 font-semibold">Módulo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((e, i) => (
                        <tr key={`${e.created_at}-${e.user_id}-${i}`} className="border-t border-slate-200 dark:border-slate-700 align-top">
                          <td className="py-1.5 px-1 text-brand-ink-soft whitespace-nowrap">{fmtFechaHora(e.created_at)}</td>
                          <td className="py-1.5 px-1 text-brand-ink">
                            <span className="block truncate max-w-[9rem] sm:max-w-none">{quien(e.name, e.email)}</span>
                            {e.role && <span className="text-xs text-brand-ink-soft">{e.role}</span>}
                          </td>
                          <td className="py-1.5 px-1 text-brand-ink">{usageModuleLabel(e.module)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
