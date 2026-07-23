import { useState } from 'react';
import { ArrowLeft, Youtube, CheckCircle, AlertCircle, Loader2, RefreshCw, GraduationCap } from 'lucide-react';
import { syncYouTubeToSupabase, MigrationResult } from '../../scripts/migrateSongsToSupabase';
import { syncCourseVideos } from '../../services/courseVideoLoader';

interface YouTubeSyncDialogProps {
  onBack: () => void;
}

export function YouTubeSyncDialog({ onBack }: YouTubeSyncDialogProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [courseState, setCourseState] = useState<'idle' | 'running' | 'done'>('idle');
  const [courseResult, setCourseResult] = useState<{ mapped: number; ignored: number; error?: string } | null>(null);

  const runCourseSync = async () => {
    setCourseState('running');
    setCourseResult(null);
    const r = await syncCourseVideos();
    setCourseResult(r);
    setCourseState('done');
  };

  const runSync = async () => {
    setStatus('running');
    setResult(null);
    try {
      const r = await syncYouTubeToSupabase();
      setResult(r);
      setStatus(r.errors > 0 ? 'error' : 'done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Back */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-900 dark:text-blue-200 mb-6 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Volver al Panel</span>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg border-4 border-red-500">
              <Youtube className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink mb-2">
            Sincronizar con YouTube
          </h1>
          <p className="text-lg text-blue-800 dark:text-blue-200">
            Importar canciones nuevas del canal
          </p>
        </div>

        {/* Info */}
        <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-blue-200 dark:border-blue-700 p-5 mb-6 space-y-3">
          <p className="text-base text-brand-ink-soft font-semibold">¿Cómo funciona?</p>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>Sube el video a YouTube con el bloque <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded font-mono">STELLA_MARIS_META</code> en la descripción.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>Toca <strong>"Sincronizar ahora"</strong> — el app lee el canal, agrega los videos nuevos y <strong>actualiza</strong> los existentes con la metadata actual.</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Refresca partes, temporadas, letra, etc. desde el canal. <strong>Ojo:</strong> sobrescribe esos campos si los editaste a mano en la app (no toca la partitura ni la letra si la metadata no las trae).</span>
            </li>
          </ul>

          {/* Metadata reference */}
          <div className="mt-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-300 dark:border-slate-600">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 uppercase tracking-wide">
              Bloque de metadatos (descripción del video)
            </p>
            <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{`STELLA_MARIS_META
categoria: Entrada
autor: Alejandro Mejía
version: Guitarra
temporada: Adviento
tonalidad: G
misa: Misa de los Ángeles
partitura: 1ABC123XYZ
liturgico: si

--- LETRA ---
[Coro]
Letra del canto...`}</pre>
          </div>
        </div>

        {/* Action */}
        {status === 'idle' && (
          <button
            onClick={runSync}
            className="w-full py-5 bg-gradient-to-br from-red-600 to-red-700 text-white rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-2 border-red-500 flex items-center justify-center gap-3"
          >
            <RefreshCw className="w-6 h-6" />
            Sincronizar ahora
          </button>
        )}

        {status === 'running' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-14 h-14 text-red-500 animate-spin" />
            <p className="text-lg font-semibold text-brand-ink-soft">
              Leyendo canal de YouTube…
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Esto puede tardar unos segundos.
            </p>
          </div>
        )}

        {/* Results */}
        {(status === 'done' || status === 'error') && result && (
          <div className="space-y-4">
            <div className={`rounded-2xl border-2 p-5 ${
              result.inserted > 0 || result.updated > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                : status === 'error'
                ? 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700'
                : 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {status === 'error'
                  ? <AlertCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
                  : <CheckCircle className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                }
                <span className="text-lg font-bold text-brand-ink">
                  {result.inserted > 0 || result.updated > 0
                    ? [
                        result.inserted > 0 ? `${result.inserted} nueva${result.inserted > 1 ? 's' : ''}` : null,
                        result.updated > 0 ? `${result.updated} actualizada${result.updated > 1 ? 's' : ''}` : null,
                      ].filter(Boolean).join(' · ')
                    : result.errors > 0
                    ? 'Sincronización con errores'
                    : 'Canal ya estaba al día'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-brand-ink">{result.total}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">En YouTube</p>
                </div>
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-emerald-600">{result.inserted}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Nuevas</p>
                </div>
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-amber-600">{result.updated}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Actualizadas</p>
                </div>
              </div>
            </div>

            {result.details.length > 0 && (
              <div className="bg-white/40 dark:bg-white/5 rounded-xl border border-blue-200 dark:border-brand-border p-4 max-h-48 overflow-y-auto">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                  Detalle
                </p>
                {result.details.map((line, i) => (
                  <p key={i} className="text-xs text-blue-800 dark:text-blue-200 font-mono">{line}</p>
                ))}
              </div>
            )}

            <button
              onClick={runSync}
              className="w-full py-4 bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-600 text-brand-ink-soft rounded-2xl text-base font-bold hover:bg-white/70 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Sincronizar de nuevo
            </button>
          </div>
        )}

        {status === 'error' && !result && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-5 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-red-900 dark:text-red-100">Error inesperado</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Verifica que las variables <code>VITE_YOUTUBE_API_KEY</code> y <code>VITE_YOUTUBE_CHANNEL_ID</code> estén configuradas en Vercel.
            </p>
            <button
              onClick={runSync}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Videos de Cursos (Camino de formación) ── */}
        <div className="mt-8 pt-6 border-t-2 border-blue-200 dark:border-brand-border">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-7 h-7 text-brand" strokeWidth={2.2} />
            <h2 className="text-xl font-bold text-brand-ink">Videos de Cursos</h2>
          </div>
          <p className="text-sm text-brand-ink-soft mb-3">
            Lee el canal y vincula cada cápsula de formación con su video. En la descripción del
            video incluye el bloque:
          </p>
          <pre className="text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-xl p-3 border border-slate-300 dark:border-slate-600 mb-3 whitespace-pre-wrap">{`STELLA_MARIS_CURSO
capsula: y1-t1-c1`}</pre>

          <button
            onClick={runCourseSync}
            disabled={courseState === 'running'}
            className="w-full py-4 bg-gradient-to-br from-brand to-brand-strong text-white rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-all border-2 border-brand-border flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {courseState === 'running' ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
            Sincronizar videos de Cursos
          </button>

          {courseResult && (
            <div className={`mt-3 rounded-2xl border-2 p-4 ${courseResult.error ? 'bg-red-50 dark:bg-red-950/30 border-red-400' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400'}`}>
              {courseResult.error ? (
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">{courseResult.error}</p>
              ) : (
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {courseResult.mapped} cápsula{courseResult.mapped !== 1 ? 's' : ''} vinculada{courseResult.mapped !== 1 ? 's' : ''} a su video.
                  {courseResult.ignored > 0 && ` (${courseResult.ignored} con id de cápsula inexistente, ignorada${courseResult.ignored !== 1 ? 's' : ''}.)`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
