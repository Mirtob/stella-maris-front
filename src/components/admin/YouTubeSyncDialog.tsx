import { useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, GraduationCap } from 'lucide-react';
import { syncCourseVideos } from '../../services/courseVideoLoader';

interface YouTubeSyncDialogProps {
  onBack: () => void;
}

export function YouTubeSyncDialog({ onBack }: YouTubeSyncDialogProps) {
  const [courseState, setCourseState] = useState<'idle' | 'running' | 'done'>('idle');
  const [courseResult, setCourseResult] = useState<{ mapped: number; ignored: number; error?: string } | null>(null);

  const runCourseSync = async () => {
    setCourseState('running');
    setCourseResult(null);
    const r = await syncCourseVideos();
    setCourseResult(r);
    setCourseState('done');
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
            <div className="w-20 h-20 bg-gradient-to-br from-teal-600 to-cyan-800 rounded-full flex items-center justify-center shadow-lg border-4 border-teal-500">
              <GraduationCap className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-brand-ink mb-2">Videos de Cursos</h1>
          <p className="text-lg text-blue-800 dark:text-blue-200">
            Vincular las cápsulas de formación con su video
          </p>
        </div>

        {/* Los cantos ya NO se importan del canal: se agregan desde Gestión de Cantos,
            y el canal se lee solo como inventario en "Resumen de cantos". */}
        <p className="text-sm text-brand-ink-soft bg-white/50 dark:bg-white/10 rounded-xl p-3 mb-6 border border-blue-200 dark:border-blue-700">
          Los cantos se agregan desde <strong>Gestión de Cantos</strong>. Para ver qué videos del
          canal ya están en la app, usa <strong>Resumen de cantos</strong>.
        </p>

        {/* ── Videos de Cursos (Camino de formación) ── */}
        <div>
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
