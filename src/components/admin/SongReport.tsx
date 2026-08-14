import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ClipboardList, CloudUpload, Download, ExternalLink, FileSpreadsheet,
  Loader, AlertTriangle, CheckCircle2, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { matchesSearch } from '../../utils/textSearch';
import {
  buildSongReport, mergeDriveStats, summarizeDrive, reportToCSV,
  reportToWorkbook, reportFileName, DRIVE_REPORT_NAME,
  matchesReportFilter, REPORT_FILTER_LABEL, VIDEO_STATUS_LABEL,
  type ReportFilter, type SongReportRow, type DriveEntryFile, type DriveEntryFolder,
} from '../../utils/songReport';
import { buildXlsx } from '../../utils/xlsx';
import { saveToDrive, isDriveSaveConfigured } from '../../services/driveUpload';

/**
 * Reportería del catálogo de cantos (dentro de Gestión de Cantos).
 *
 * Sirve para ORDENAR LA SUBIDA: muestra cuántos cantos hay por clasificación
 * (las carpetas de Drive), cuántos tienen versión órgano y cuántos guitarra —el
 * canal debe tener el mismo canto en ambos instrumentos, salvo el gregoriano—,
 * cuáles tienen partitura y cuáles tienen la letra con acordes.
 *
 * La planilla se completa sola: se calcula sobre el catálogo que ya está en
 * pantalla (`songs`), así que cada canto que se sube aparece al refrescar. Lo
 * único que se consulta aparte es Drive (`/api/sheets`), para contrastar cuántos
 * PDF hay en cada carpeta con cuántos cantos hay cargados.
 */

const FILTERS: ReportFilter[] = [
  'todos', 'pendientes', 'falta-organo', 'falta-guitarra', 'solo-general',
  'sin-video', 'sin-partitura', 'sin-acordes', 'gregorianos',
];

/** Tarjeta de un número grande del resumen. */
function StatCard({ value, label, hint, tone }: {
  value: number | string; label: string; hint?: string; tone: 'blue' | 'green' | 'amber' | 'purple' | 'rose';
}) {
  const tones: Record<string, string> = {
    blue:   'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200',
    green:  'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-700 dark:text-green-200',
    amber:  'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-200',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-200',
    rose:   'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-200',
  };
  return (
    <div className={`rounded-xl p-3 border-2 ${tones[tone]}`}>
      <div className="text-2xl font-bold leading-none">{value}</div>
      <div className="text-xs text-gray-700 dark:text-gray-200 mt-1 font-bold">{label}</div>
      {hint && <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{hint}</div>}
    </div>
  );
}

/** Marca ✓/✗ de una columna de la planilla. */
function Mark({ on, title }: { on: boolean; title: string }) {
  return (
    <span
      title={title}
      className={`text-xs font-bold ${on ? 'text-green-600 dark:text-green-400' : 'text-gray-300 dark:text-slate-600'}`}
    >
      {on ? '✓' : '—'}
    </span>
  );
}

export function SongReport({ songs, loading, onBack }: {
  songs: Song[];
  loading: boolean;
  onBack: () => void;
}) {
  const [filter, setFilter] = useState<ReportFilter>('todos');
  const [search, setSearch] = useState('');
  const [drive, setDrive] = useState<{ files: DriveEntryFile[]; folders: DriveEntryFolder[] } | null>(null);
  const [driveError, setDriveError] = useState(false);
  const [loadingDrive, setLoadingDrive] = useState(true);
  // Guardado del Excel en "Mi unidad" (OAuth drive.file).
  const [savingDrive, setSavingDrive] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);

  // Conteo de PDF por carpeta de Drive. Si Drive no responde, el informe del
  // catálogo se muestra igual: solo se pierde la columna de contraste.
  useEffect(() => {
    let alive = true;
    fetch('/api/sheets')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('sheets'))))
      .then(d => { if (alive) setDrive({ files: d.files || [], folders: d.folders || [] }); })
      .catch(() => { if (alive) setDriveError(true); })
      .finally(() => { if (alive) setLoadingDrive(false); });
    return () => { alive = false; };
  }, []);

  const report = useMemo(() => buildSongReport(songs), [songs]);
  const byCategory = useMemo(
    () => (drive ? mergeDriveStats(report.byCategory, summarizeDrive(drive.files, drive.folders)) : report.byCategory),
    [report.byCategory, drive],
  );

  const t = report.totals;
  const pct = t.total ? Math.round((t.completos / t.total) * 100) : 0;

  const counts = useMemo(() => {
    const c = {} as Record<ReportFilter, number>;
    for (const f of FILTERS) c[f] = report.rows.filter(r => matchesReportFilter(r, f)).length;
    return c;
  }, [report.rows]);

  const visibleRows = useMemo(
    () => report.rows
      .filter(r => matchesReportFilter(r, filter))
      .filter(r => matchesSearch(r.title, search) || matchesSearch(r.category, search))
      .sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title)),
    [report.rows, filter, search],
  );

  /** Dispara la descarga de un Blob con el nombre dado. */
  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Excel con TODOS los KPI en un solo archivo (Resumen + Por clasificación +
   * Planilla). A diferencia del CSV, no depende del filtro en pantalla: es la
   * foto completa del catálogo, que es lo que se comparte con los demás admins.
   */
  const downloadXlsx = () => {
    if (report.rows.length === 0) { toast.error('No hay cantos que exportar'); return; }
    const now = new Date();
    download(buildXlsx(reportToWorkbook(report, byCategory, now)), reportFileName(now));
    toast.success('Excel descargado', {
      description: `${report.rows.length} cantos · 3 hojas (Resumen, Por clasificación, Planilla)`,
    });
  };

  /**
   * Guarda el mismo Excel en "Mi unidad" del admin. La primera vez crea el
   * archivo; después reemplaza su contenido, para que el enlace compartido con
   * los demás admins siempre muestre la última versión.
   */
  const saveDrive = async () => {
    if (report.rows.length === 0) { toast.error('No hay cantos que exportar'); return; }
    setSavingDrive(true);
    setDriveLink(null);
    const file = buildXlsx(reportToWorkbook(report, byCategory, new Date()));
    const r = await saveToDrive(file, DRIVE_REPORT_NAME);
    setSavingDrive(false);
    if (!r.ok) {
      toast.error('No se pudo guardar en Drive', { description: r.error });
      return;
    }
    setDriveLink(r.link ?? null);
    toast.success(r.updated ? 'Actualizado en tu Drive' : 'Guardado en tu Drive', {
      description: r.updated
        ? 'Se reemplazó el archivo anterior: el enlace compartido sigue sirviendo.'
        : `"${DRIVE_REPORT_NAME}" quedó en Mi unidad. Compártelo con los demás admins.`,
    });
  };

  /** CSV de lo que está a la vista: útil para trabajar un filtro puntual. */
  const downloadCSV = () => {
    if (visibleRows.length === 0) { toast.error('No hay cantos que exportar'); return; }
    download(
      new Blob([reportToCSV(visibleRows)], { type: 'text/csv;charset=utf-8' }),
      `planilla-cantos-${new Date().toISOString().slice(0, 10)}.csv`,
    );
    toast.success(`Planilla descargada (${visibleRows.length} cantos)`);
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        <button onClick={onBack} className="mb-4 flex items-center gap-2 text-brand font-bold active:opacity-70">
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} /> Volver a Gestión de Cantos
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 bg-gradient-to-br from-brand to-brand-strong rounded-2xl flex items-center justify-center shadow-lg border-2 border-brand-border flex-shrink-0">
            <ClipboardList className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-purple-900 dark:text-white leading-tight">Reportería de cantos</h1>
            <p className="text-sm text-purple-700 dark:text-purple-200">
              {loading ? 'Cargando catálogo…' : `${t.total} cantos · ${pct}% con las dos versiones`}
            </p>
          </div>
        </div>

        {/* ── Resumen ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border-2 border-purple-200 dark:border-purple-700 mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Resumen</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard tone="blue"   value={t.total}       label="Cantos en el catálogo" />
            <StatCard tone="green"  value={t.completos}   label="Par completo" hint={`${t.pendientes} pendientes`} />
            <StatCard tone="purple" value={t.organo}      label="🎹 Versión órgano" />
            <StatCard tone="amber"  value={t.guitarra}    label="🎶 Versión guitarra" />
            <StatCard tone="green"  value={t.conPartitura} label="Con partitura" hint={`${t.conVoces} con voces`} />
            <StatCard tone="purple" value={t.conAcordes}  label="Letra con acordes" hint={`${t.conLetra} con letra`} />
            <StatCard tone="rose"   value={t.sinVideo}    label="Sin ningún video" />
            <StatCard tone="blue"   value={t.gregorianos} label="Gregorianos" hint="No requieren guitarra" />
          </div>

          {/* Avance de la regla del par */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">
              <span>Avance del par órgano + guitarra</span>
              <span>{t.completos}/{t.total}</span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {t.soloGeneral > 0 && (
            <button
              onClick={() => setFilter('solo-general')}
              className="mt-3 w-full text-left flex items-start gap-2 bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-3 active:scale-98"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <span className="text-xs text-amber-900 dark:text-amber-100">
                <strong>{t.soloGeneral}</strong> {t.soloGeneral === 1 ? 'canto tiene' : 'cantos tienen'} solo el
                video único, sin indicar el instrumento. Conviene moverlo al campo de órgano o de guitarra
                para que cada corista vea la versión que le toca. <u>Ver la lista</u>.
              </span>
            </button>
          )}
        </div>

        {/* ── Por clasificación (carpetas de Drive) ───────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border-2 border-blue-200 dark:border-blue-700 mb-4">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Por clasificación</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Cada clasificación es la carpeta del momento en Drive. Un canto cuenta en su parte
            principal (★). La columna <strong>PDF</strong> es lo que hay en esa carpeta de Drive.
          </p>

          {loadingDrive && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
              <Loader className="w-3 h-3 animate-spin" /> Consultando las carpetas de Drive…
            </p>
          )}
          {driveError && (
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
              No se pudo consultar Drive: se muestra solo lo que hay en el catálogo.
            </p>
          )}

          <div className="overflow-x-auto -mx-1 px-1">
            {/* Entra completa en un teléfono de 390 px; si el nombre de una carpeta
                es muy largo, el contenedor permite arrastrar de lado. */}
            {/* Las 6 columnas numéricas van a ancho fijo y angosto para que la tabla
                entre completa en un teléfono de 390 px; el nombre de la carpeta se
                queda con el resto y, si hace falta, parte en dos líneas. */}
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-left text-[10px] text-gray-500 dark:text-gray-400 border-b-2 border-gray-200 dark:border-slate-700">
                  <th className="py-2 pr-1 font-bold">Clasificación</th>
                  <th className="py-2 px-0 w-9 text-center font-bold">Cantos</th>
                  <th className="py-2 px-0 w-8 text-center font-bold" title="Con versión órgano">🎹</th>
                  <th className="py-2 px-0 w-8 text-center font-bold" title="Con versión guitarra">🎶</th>
                  <th className="py-2 px-0 w-8 text-center font-bold" title="Con las dos versiones">✅</th>
                  <th className="py-2 px-0 w-8 text-center font-bold" title="Letra con acordes">♯</th>
                  <th className="py-2 px-0 w-9 text-center font-bold" title="PDF en la carpeta de Drive">PDF</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map((c) => (
                  <tr key={c.category} className="border-b border-gray-100 dark:border-slate-700/60">
                    <td className="py-2 pr-1 font-bold text-gray-800 dark:text-white text-[13px] leading-tight">{c.category}</td>
                    <td className="py-2 px-0 text-center text-gray-800 dark:text-gray-100 font-bold">{c.total}</td>
                    <td className="py-2 px-0 text-center text-gray-600 dark:text-gray-300">{c.organo}</td>
                    <td className="py-2 px-0 text-center text-gray-600 dark:text-gray-300">{c.guitarra}</td>
                    <td className={`py-2 px-0 text-center font-bold ${
                      c.total > 0 && c.completos === c.total ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>{c.completos}</td>
                    <td className="py-2 px-0 text-center text-gray-600 dark:text-gray-300">{c.conAcordes}</td>
                    <td className="py-2 px-0 text-center text-gray-500 dark:text-gray-400">
                      {c.drivePdfs === undefined ? '—' : c.drivePdfs}
                    </td>
                  </tr>
                ))}
                {byCategory.length > 0 && (
                  <tr className="border-t-2 border-gray-300 dark:border-slate-600">
                    <td className="py-2 pr-1 font-bold text-gray-800 dark:text-white">Total</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-800 dark:text-white">{t.total}</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-700 dark:text-gray-200">{t.organo}</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-700 dark:text-gray-200">{t.guitarra}</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-700 dark:text-gray-200">{t.completos}</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-700 dark:text-gray-200">{t.conAcordes}</td>
                    <td className="py-2 px-0 text-center font-bold text-gray-600 dark:text-gray-300">
                      {drive ? byCategory.reduce((n, c) => n + (c.drivePdfs ?? 0), 0) : '—'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading && byCategory.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Todavía no hay cantos en el catálogo.</p>
          )}
        </div>

        {/* ── Planilla ────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 border-2 border-green-200 dark:border-green-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-1">Planilla de subida</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Un canto está listo cuando tiene sus dos versiones en el canal (órgano y guitarra),
            partitura y letra con acordes. El <strong>gregoriano</strong> es la excepción: no lleva
            versión de guitarra, así que le basta un video — márcalo con la etiqueta “Gregoriano”.
          </p>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-3">
            {FILTERS.map((fl) => (
              <button
                key={fl}
                onClick={() => setFilter(fl)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 active:scale-95 transition-all ${
                  filter === fl
                    ? 'bg-blue-700 text-white border-brand-border'
                    : 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-slate-600'
                }`}
              >
                {REPORT_FILTER_LABEL[fl]} ({counts[fl]})
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en la planilla"
              aria-label="Buscar en la planilla"
              className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-blue-200 dark:border-blue-700 dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={downloadXlsx}
            className="w-full mb-2 py-3 bg-gradient-to-br from-green-700 to-emerald-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95"
          >
            <FileSpreadsheet className="w-5 h-5" strokeWidth={2.5} />
            Descargar Excel — todos los KPI
          </button>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 text-center">
            Un solo archivo con las hojas <strong>Resumen</strong>, <strong>Por clasificación</strong> y{' '}
            <strong>Planilla</strong> ({report.rows.length} cantos).
          </p>

          {/* Guardar en Drive: mismo Excel, en "Mi unidad" del admin */}
          {isDriveSaveConfigured() && (
            <>
              <button
                onClick={saveDrive}
                disabled={savingDrive}
                className="w-full mb-2 py-3 bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {savingDrive
                  ? <Loader className="w-5 h-5 animate-spin" />
                  : <CloudUpload className="w-5 h-5" strokeWidth={2.5} />}
                {savingDrive ? 'Guardando en Drive…' : 'Guardar en mi Drive'}
              </button>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 text-center">
                Queda como <strong>{DRIVE_REPORT_NAME}</strong> en <strong>Mi unidad</strong>. Cada vez que lo
                guardes se reemplaza ese mismo archivo, así el enlace que compartas con los demás admins
                siempre muestra la última versión. Google te pedirá permiso: la app solo puede ver y
                modificar los archivos que ella misma crea.
              </p>
              {driveLink && (
                <a
                  href={driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mb-2 py-2 bg-white dark:bg-slate-700 border-2 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" strokeWidth={2.5} />
                  Abrir en Drive y compartir
                </a>
              )}
            </>
          )}
          <button
            onClick={downloadCSV}
            className="w-full mb-3 py-2 bg-white dark:bg-slate-700 border-2 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95"
          >
            <Download className="w-4 h-4" strokeWidth={2.5} />
            CSV de la lista filtrada ({visibleRows.length})
          </button>

          {/* Cabecera de columnas */}
          <div className="grid grid-cols-[1fr_auto] gap-2 px-1 pb-1 text-[11px] uppercase font-bold text-gray-500 dark:text-gray-400 border-b-2 border-gray-200 dark:border-slate-700">
            <span>Canto</span>
            <span className="flex gap-2">
              <span title="Versión órgano" className="w-5 text-center">🎹</span>
              <span title="Versión guitarra" className="w-5 text-center">🎶</span>
              <span title="Partitura" className="w-5 text-center">📄</span>
              <span title="Letra con acordes" className="w-5 text-center">♯</span>
            </span>
          </div>

          <ul className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {visibleRows.map((r) => (
              <PlanillaRow key={r.id} row={r} />
            ))}
          </ul>

          {visibleRows.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              {loading ? 'Cargando…' : 'Ningún canto en este filtro. 🎉'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Fila de la planilla: el canto y qué le falta. */
function PlanillaRow({ row }: { row: SongReportRow }) {
  return (
    <li className="py-2 grid grid-cols-[1fr_auto] gap-2 items-start">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {row.videoComplete
            ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" strokeWidth={2.5} />
            : <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={2.5} />}
          <span className="text-sm font-bold text-gray-800 dark:text-white truncate">{row.title}</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1 pl-5">
          <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold">
            {row.category}
          </span>
          {row.gregorian && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-200 font-bold">
              Gregoriano
            </span>
          )}
          {row.voices > 0 && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-200 font-bold">
              {row.voices} voces
            </span>
          )}
          {!row.videoComplete && (
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-bold">
              {VIDEO_STATUS_LABEL[row.videoStatus]}
            </span>
          )}
          {row.missing.length > 0 && (
            <span className="text-[11px] text-gray-500 dark:text-gray-400">Falta: {row.missing.join(', ')}</span>
          )}
        </div>
      </div>
      <div className="flex gap-2 pt-0.5">
        <span className="w-5 text-center"><Mark on={row.hasOrgano} title="Versión órgano" /></span>
        <span className="w-5 text-center"><Mark on={row.hasGuitarra} title="Versión guitarra" /></span>
        <span className="w-5 text-center"><Mark on={row.hasSheet} title="Partitura" /></span>
        <span className="w-5 text-center"><Mark on={row.hasChords} title="Letra con acordes" /></span>
      </div>
    </li>
  );
}
