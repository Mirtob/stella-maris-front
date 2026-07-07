import { useEffect, useState, type ChangeEvent } from 'react';
import { Users, Save, Loader, Mail, Phone, Church, Music } from 'lucide-react';
import { toast } from 'sonner';
import { getMyChoirContact, saveChoirContact, EMPTY_CHOIR_CONTACT, type ChoirContact } from '../../services/choirContacts';

interface Props {
  userId: string;
  defaultParish?: string;
}

/**
 * Ficha de contacto del coro (perfil Coro): nombre del coro, parroquia, correo, teléfono
 * y otros datos, para que los coros intercambien partituras/información. Visible para
 * cualquier usuario autenticado (directorio); cada coro edita solo la suya.
 */
export function ChoirContactCard({ userId, defaultParish }: Props) {
  const [c, setC] = useState<ChoirContact>({ ...EMPTY_CHOIR_CONTACT, parish: defaultParish || '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyChoirContact(userId).then((data) => {
      if (cancelled) return;
      if (data) setC({ ...data, parish: data.parish || defaultParish || '' });
      setLoading(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const set = (k: keyof ChoirContact) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setC((prev) => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    const r = await saveChoirContact(userId, c);
    setSaving(false);
    if (r.ok) toast.success('Datos de contacto guardados');
    else toast.error('No se pudo guardar', { description: r.error });
  };

  const inputCls =
    'w-full px-4 py-3 text-lg rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:border-teal-500 transition-colors';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 border-2 border-teal-200 dark:border-teal-800 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Datos de contacto del coro</h2>
      </div>
      <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
        Comparte cómo contactar a tu coro para intercambiar partituras, cantos o datos con otros coros.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <Loader className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-2"><Music className="w-4 h-4" /> Nombre del coro</label>
            <input value={c.choirName} onChange={set('choirName')} placeholder="Coro Stella Maris" className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-2"><Church className="w-4 h-4" /> Parroquia</label>
            <input value={c.parish} onChange={set('parish')} placeholder="Parroquia — Diócesis" className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-2"><Mail className="w-4 h-4" /> Correo de contacto</label>
            <input type="email" inputMode="email" value={c.email} onChange={set('email')} placeholder="coro@ejemplo.com" className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-2"><Phone className="w-4 h-4" /> Teléfono / WhatsApp</label>
            <input type="tel" inputMode="tel" value={c.phone} onChange={set('phone')} placeholder="+56 9 1234 5678" className={inputCls} />
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300 mb-1 block">Otros datos (redes, horarios de ensayo, etc.)</label>
            <textarea value={c.notes} onChange={set('notes')} rows={2} placeholder="Instagram @…, ensayamos jueves 20:00…" className={`${inputCls} resize-y`} />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-all disabled:opacity-60"
          >
            {saving ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Guardar contacto
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Estos datos quedan visibles para otros coros de la app. Deja en blanco lo que no quieras compartir.
          </p>
        </div>
      )}
    </div>
  );
}
