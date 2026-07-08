import { useEffect, useMemo, useState } from 'react';
import { X, Users, Loader, Mail, Phone, Church, Search, MessageCircle, SearchX } from 'lucide-react';
import { listChoirContacts, type ChoirContact } from '../../services/choirContacts';

type Entry = ChoirContact & { userId: string };

/** Solo dígitos, para el enlace de WhatsApp. */
const waLink = (phone: string) => {
  const digits = phone.replace(/[^\d]/g, '');
  return digits.length >= 7 ? `https://wa.me/${digits}` : null;
};

/**
 * Directorio de coros: lista las fichas de contacto publicadas por los coros para que
 * puedan buscarse e intercambiar partituras/datos. Lectura para cualquier autenticado.
 */
export function ChoirDirectoryModal({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    listChoirContacts().then((list) => {
      if (cancelled) return;
      // Ocultar fichas totalmente vacías.
      setEntries(list.filter((e) => e.choirName || e.parish || e.email || e.phone || e.notes));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return entries;
    return entries.filter((e) => [e.choirName, e.parish, e.notes].join(' ').toLowerCase().includes(s));
  }, [entries, q]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full border-4 border-teal-300 dark:border-teal-800 overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center gap-3 bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-5">
          <Users className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold leading-tight">Directorio de coros</h2>
            <p className="text-teal-100 text-sm">Contacta a otros coros para intercambiar partituras y datos</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por coro o parroquia…"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="px-4 pb-4 overflow-y-auto space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
              <Loader className="w-7 h-7 animate-spin" />
              <p className="text-sm">Cargando coros…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-500 dark:text-gray-400 text-center">
              <SearchX className="w-10 h-10" />
              <p className="font-semibold">{entries.length === 0 ? 'Aún no hay coros en el directorio' : 'Sin resultados'}</p>
              {entries.length === 0 && <p className="text-sm">Sé el primero: completa tus datos de contacto.</p>}
            </div>
          ) : (
            filtered.map((e) => {
              const wa = e.phone ? waLink(e.phone) : null;
              return (
                <div key={e.userId} className="bg-gray-50 dark:bg-slate-800 rounded-2xl p-4 border-2 border-gray-100 dark:border-slate-700">
                  <div className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{e.choirName || 'Coro'}</div>
                  {e.parish && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      <Church className="w-4 h-4 flex-shrink-0" /> {e.parish}
                    </div>
                  )}
                  {e.notes && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-line">{e.notes}</p>}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {e.email && (
                      <a href={`mailto:${e.email}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        <Mail className="w-4 h-4" /> Correo
                      </a>
                    )}
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    ) : e.phone ? (
                      <a href={`tel:${e.phone}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                        <Phone className="w-4 h-4" /> {e.phone}
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
