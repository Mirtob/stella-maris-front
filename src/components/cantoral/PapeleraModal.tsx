import { useEffect, useState } from 'react';
import { X, Trash2, Loader, RotateCcw, Church, Calendar, Clock, User, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { PublishedCantoral } from '../../types';
import {
  listPapelera, restaurarCantoral, borrarDefinitivo, diasRestantes, DIAS_PAPELERA,
  type CantoralEnPapelera,
} from '../../services/papelera';
import { formatYmdForDisplay } from '../../utils/dateLocal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PapeleraModalProps {
  onClose: () => void;
  /** Tras restaurar: refrescar las listas que ya estaban cargadas. */
  onRestored?: (cantoral: PublishedCantoral) => void;
  /** Solo el admin principal ve "Eliminar definitivamente" (la base igual lo comprueba). */
  isAdmin?: boolean;
}

/**
 * Cantorales borrados en los últimos 30 días. Cada coro ve los de su parroquia (y los
 * que publicó); el admin principal, todos. Restaurar lo puede quien podía borrar.
 */
export function PapeleraModal({ onClose, onRestored, isAdmin }: PapeleraModalProps) {
  const [items, setItems] = useState<CantoralEnPapelera[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<CantoralEnPapelera | null>(null);

  useEffect(() => {
    let cancelled = false;
    listPapelera().then((r) => {
      if (cancelled) return;
      if (!r.ok) setError(r.error || 'No se pudo leer la papelera');
      setItems(r.items);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !porEliminar) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, porEliminar]);

  const quitar = (id: string) => setItems((prev) => prev.filter((x) => x.cantoral.id !== id));

  const handleRestore = async (it: CantoralEnPapelera) => {
    setTrabajando(it.cantoral.id);
    const { resultado, error: err } = await restaurarCantoral(it.cantoral.id);
    setTrabajando(null);
    switch (resultado) {
      case 'ok':
        quitar(it.cantoral.id);
        onRestored?.(it.cantoral);
        toast.success('Cantoral restaurado', { description: `${it.cantoral.liturgicalDate} · ${it.cantoral.massTime}` });
        return;
      case 'ocupado':
        toast.error('Ya hay otro cantoral para esa Misa', {
          description: 'Mismo lugar, fecha y hora. Elimina o edita el otro y vuelve a intentarlo.',
        });
        return;
      case 'no-existe':
        quitar(it.cantoral.id);
        toast.info('Ese cantoral ya no está en la papelera');
        return;
      case 'no-permitido':
        toast.error('No puedes restaurar este cantoral', { description: 'Es de una parroquia que no es la tuya.' });
        return;
      default:
        toast.error('No se pudo restaurar', { description: err });
    }
  };

  const handleDeleteForever = async () => {
    const it = porEliminar;
    setPorEliminar(null);
    if (!it) return;
    setTrabajando(it.cantoral.id);
    const r = await borrarDefinitivo(it.cantoral.id);
    setTrabajando(null);
    if (!r.ok) { toast.error('No se pudo eliminar', { description: r.error }); return; }
    quitar(it.cantoral.id);
    toast.success('Eliminado definitivamente');
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="papelera-titulo"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-slate-300 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-5">
          <Trash2 className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <h2 id="papelera-titulo" className="text-xl font-bold leading-tight">Papelera</h2>
            <p className="text-slate-200 text-sm">Lo borrado se guarda {DIAS_PAPELERA} días y se puede restaurar</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Loader className="w-7 h-7 animate-spin" />
              <p className="text-sm">Abriendo la papelera…</p>
            </div>
          ) : error ? (
            <div role="alert" className="p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500 dark:text-gray-400 text-center">
              <Inbox className="w-10 h-10" />
              <p className="font-semibold">La papelera está vacía</p>
              <p className="text-sm">Aquí aparecen los cantorales de tu parroquia que alguien borró.</p>
            </div>
          ) : (
            items.map((it) => {
              const c = it.cantoral;
              const dias = diasRestantes(it.borradoEn);
              const ocupado = trabajando === c.id;
              return (
                <div key={c.id} className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border-2 border-gray-100 dark:border-slate-700">
                  <div className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{c.liturgicalDate}</div>
                  <div className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 flex-shrink-0" /> {formatYmdForDisplay(c.date, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                    <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 flex-shrink-0" /> {c.massTime}</div>
                    <div className="flex items-center gap-1.5"><Church className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{c.parishName}</span></div>
                    <div className="flex items-center gap-1.5"><User className="w-4 h-4 flex-shrink-0" /> Lo borró {it.borradoPor || 'alguien sin nombre'}</div>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    {dias === 0 ? 'Se elimina hoy' : `Se elimina en ${dias} día${dias === 1 ? '' : 's'}`}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleRestore(it)}
                      disabled={!!trabajando}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {ocupado ? <Loader className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" strokeWidth={2.5} />}
                      Restaurar
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setPorEliminar(it)}
                        disabled={!!trabajando}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 active:scale-95 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar definitivamente
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!porEliminar}
        title="Eliminar definitivamente"
        message="Este cantoral se borrará para siempre y no se podrá recuperar."
        details={porEliminar ? `${porEliminar.cantoral.parishName} · ${porEliminar.cantoral.liturgicalDate} · ${porEliminar.cantoral.massTime}` : undefined}
        confirmLabel="Sí, eliminar para siempre"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteForever}
        onCancel={() => setPorEliminar(null)}
      />
    </div>
  );
}
