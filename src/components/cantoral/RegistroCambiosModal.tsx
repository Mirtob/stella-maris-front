import { useEffect, useMemo, useState } from 'react';
import { X, ScrollText, Loader, Search, SearchX, Send, Pencil, Trash2, RotateCcw, XCircle, type LucideIcon } from 'lucide-react';
import { listRegistroCambios, type AccionCambio, type CambioCantoral } from '../../services/papelera';
import { formatYmdForDisplay } from '../../utils/dateLocal';

const ACCION: Record<AccionCambio, { texto: string; Icon: LucideIcon; color: string }> = {
  publicar:  { texto: 'publicó',                     Icon: Send,      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30' },
  editar:    { texto: 'editó',                       Icon: Pencil,    color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30' },
  papelera:  { texto: 'envió a la papelera',         Icon: Trash2,    color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30' },
  restaurar: { texto: 'restauró',                    Icon: RotateCcw, color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30' },
  borrar:    { texto: 'eliminó definitivamente',     Icon: XCircle,   color: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30' },
};

const cuandoLegible = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/**
 * Quién publicó, editó, borró o restauró cada cantoral. La base filtra lo que se ve:
 * cada coro, su parroquia; el admin principal, todas (y entonces se muestra la parroquia).
 */
export function RegistroCambiosModal({ onClose, mostrarParroquia }: { onClose: () => void; mostrarParroquia?: boolean }) {
  const [items, setItems] = useState<CambioCantoral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    listRegistroCambios().then((r) => {
      if (cancelled) return;
      if (!r.ok) setError(r.error || 'No se pudo leer el registro');
      setItems(r.items);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      [i.quien, i.parroquia, i.celebracion, i.fecha, ACCION[i.accion]?.texto].join(' ').toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registro-titulo"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-indigo-300 dark:border-indigo-800 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-5">
          <ScrollText className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <h2 id="registro-titulo" className="text-xl font-bold leading-tight">Registro de cambios</h2>
            <p className="text-indigo-100 text-sm">Quién publicó, editó o borró cada cantoral</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por persona, celebración o parroquia…"
              aria-label="Buscar en el registro"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="px-4 pb-4 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Loader className="w-7 h-7 animate-spin" />
              <p className="text-sm">Cargando el registro…</p>
            </div>
          ) : error ? (
            <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500 dark:text-gray-400 text-center">
              <SearchX className="w-10 h-10" />
              <p className="font-semibold">{items.length === 0 ? 'Todavía no hay cambios registrados' : 'Sin resultados'}</p>
            </div>
          ) : (
            <ol className="space-y-2">
              {filtrados.map((i) => {
                const a = ACCION[i.accion] ?? ACCION.editar;
                return (
                  <li key={i.id} className="flex gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.color}`}>
                      <a.Icon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0 text-sm">
                      <p className="text-gray-900 dark:text-white leading-snug">
                        <strong>{i.quien || 'El sistema'}</strong> {a.texto}{' '}
                        <strong>{i.celebracion || 'un cantoral'}</strong>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {[i.fecha && formatYmdForDisplay(i.fecha, { day: 'numeric', month: 'short', year: 'numeric' }), i.hora].filter(Boolean).join(' · ')}
                      </p>
                      {mostrarParroquia && i.parroquia && (
                        <p className="text-gray-500 dark:text-gray-400 truncate">{i.parroquia}</p>
                      )}
                      {i.accion === 'editar' && i.detalle.length > 0 && (
                        <p className="text-gray-500 dark:text-gray-400">Cambió: {i.detalle.join(', ')}</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cuandoLegible(i.cuando)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
