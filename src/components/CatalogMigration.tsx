import { useState } from 'react';
import { ArrowLeft, Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { migrateMockSongsToSupabase, MigrationResult } from '../scripts/migrateSongsToSupabase';

interface CatalogMigrationProps {
  onBack: () => void;
}

export function CatalogMigration({ onBack }: CatalogMigrationProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async () => {
    setStatus('running');
    try {
      const r = await migrateMockSongsToSupabase();
      setResult(r);
      setStatus(r.errors > 0 ? 'error' : 'done');
    } catch (err) {
      setResult(null);
      setStatus('error');
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
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
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-600">
              <Database className="w-10 h-10 text-white" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-950 dark:text-white mb-2">
            Migrar Catálogo a Supabase
          </h1>
          <p className="text-lg text-blue-800 dark:text-blue-200">
            Importación única desde datos locales
          </p>
        </div>

        {/* Info card */}
        <div className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-blue-200 dark:border-blue-700 p-5 mb-6 space-y-3">
          <p className="text-base text-blue-900 dark:text-blue-100 font-semibold">
            ¿Qué hace esta migración?
          </p>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex gap-2"><span>✔</span><span>Inserta las canciones del catálogo local en la tabla <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">songs</code> de Supabase.</span></li>
            <li className="flex gap-2"><span>✔</span><span>Normaliza categorías ("Entrada" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">entrada</code>) y tiempos litúrgicos.</span></li>
            <li className="flex gap-2"><span>✔</span><span>Es segura de re-ejecutar: omite canciones que ya existen (por <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">youtube_id</code>).</span></li>
            <li className="flex gap-2"><span>✔</span><span>No modifica ni borra datos existentes en Supabase.</span></li>
          </ul>
        </div>

        {/* Run button */}
        {status === 'idle' && (
          <button
            onClick={runMigration}
            className="w-full py-5 bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl text-xl font-bold shadow-2xl hover:shadow-3xl active:scale-95 transition-all border-2 border-emerald-600"
          >
            Ejecutar Migración
          </button>
        )}

        {status === 'running' && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="w-14 h-14 text-emerald-600 animate-spin" />
            <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
              Migrando canciones…
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Esto puede tomar unos segundos.
            </p>
          </div>
        )}

        {/* Results */}
        {(status === 'done' || status === 'error') && result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className={`rounded-2xl border-2 p-5 ${
              status === 'done'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-700'
                : 'bg-red-50 dark:bg-red-950/30 border-red-400 dark:border-red-700'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {status === 'done'
                  ? <CheckCircle className="w-7 h-7 text-emerald-600" />
                  : <AlertCircle className="w-7 h-7 text-red-600" />
                }
                <span className="text-lg font-bold text-blue-950 dark:text-white">
                  {status === 'done' ? 'Migración completada' : 'Migración con errores'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-blue-950 dark:text-white">{result.inserted}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Insertadas</p>
                </div>
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{result.skipped}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Ya existían</p>
                </div>
                <div className="bg-white/60 dark:bg-white/10 rounded-xl p-3">
                  <p className={`text-2xl font-bold ${result.errors > 0 ? 'text-red-600' : 'text-blue-950 dark:text-white'}`}>
                    {result.errors}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Errores</p>
                </div>
              </div>
            </div>

            {/* Detail log */}
            <div className="bg-white/40 dark:bg-white/5 rounded-xl border border-blue-200 dark:border-blue-800 p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
                Detalle por batch
              </p>
              {result.details.map((line, i) => (
                <p key={i} className="text-xs text-blue-800 dark:text-blue-200 font-mono">{line}</p>
              ))}
            </div>

            <button
              onClick={runMigration}
              className="w-full py-4 bg-white/50 dark:bg-white/10 border-2 border-blue-300 dark:border-blue-600 text-blue-900 dark:text-blue-100 rounded-2xl text-base font-bold hover:bg-white/70 active:scale-95 transition-all"
            >
              Volver a ejecutar
            </button>
          </div>
        )}

        {status === 'error' && !result && (
          <div className="rounded-2xl border-2 border-red-400 bg-red-50 dark:bg-red-950/30 p-5 text-center">
            <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
            <p className="text-lg font-bold text-red-900 dark:text-red-100">Error inesperado</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              Verifica tu conexión y que la tabla <code>songs</code> exista en Supabase.
            </p>
            <button
              onClick={runMigration}
              className="mt-4 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 active:scale-95 transition-all"
            >
              Reintentar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
