import { useState } from 'react';
import { X, Plus, Calendar, Sparkles, Church, Palette } from 'lucide-react';
import { formatYmdForDisplay } from '../../utils/dateLocal';
import { GLOBAL_SCOPE } from '../../services/liturgicalDates';
import { getCelebrationsForDate } from '../../utils/liturgicalCalendar';
import { LITURGICAL_COLOR_OPTIONS, type LiturgicalColorId } from '../../utils/liturgicalColors';

interface AddSolemnityModalProps {
  selectedDate: string;
  /** Admin verificado: puede crear celebraciones GLOBALES (para todos los usuarios). */
  isAdmin?: boolean;
  /** Parroquias/capillas del perfil (para que el coro elija a cuál publica la celebración). */
  parishes?: string[];
  onClose: () => void;
  onAdd: (
    name: string, date: string, scope: string, type: 'solemnity' | 'feast',
    /** true = desplaza a la celebración del calendario ese día. */
    replacesDefault: boolean,
    /** Color litúrgico impuesto; `undefined` = el del calendario. */
    color?: LiturgicalColorId,
  ) => void;
}

export function AddSolemnityModal({ selectedDate, isAdmin = false, parishes = [], onClose, onAdd }: AddSolemnityModalProps) {
  const [solemnityName, setSolemnityName] = useState('');
  const [solemnityType, setSolemnityType] = useState<'solemnity' | 'feast'>('solemnity');
  // Alcance de la celebración:
  //  - Admin  → 'global' (todos los usuarios), o una parroquia concreta si lo prefiere.
  //  - Coro   → una de sus parroquias/capillas (obligatorio elegir si tiene varias).
  const [scope, setScope] = useState<string>(() => {
    if (isAdmin) return GLOBAL_SCOPE;
    return parishes.length === 1 ? parishes[0] : '';
  });
  // ¿Desplaza a lo que ya se celebra ese día? Por defecto NO: sumar es lo que no pierde
  // el domingo ni su salmo. Solo se pregunta si ese día ya tiene celebración.
  const [reemplaza, setReemplaza] = useState(false);
  // Color litúrgico. Sin elegir, el que corresponda a la fecha.
  const [color, setColor] = useState<LiturgicalColorId | undefined>(undefined);
  const yaSeCelebra = getCelebrationsForDate(selectedDate).principal;

  const handleSave = () => {
    if (solemnityName.trim() && scope) {
      onAdd(
        solemnityName.trim(), selectedDate, scope, solemnityType,
        yaSeCelebra ? reemplaza : false,
        color,
      );
      onClose();
    }
  };

  const formatDate = (dateStr: string) =>
    formatYmdForDisplay(dateStr, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const canSave = solemnityName.trim().length > 0 && scope.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div
        className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-purple-800 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-t-3xl z-10 border-b-4 border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                <Plus className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Agregar Celebración</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-8 h-8" strokeWidth={2.5} />
            </button>
          </div>
          <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/30">
            <span className="text-lg font-bold">
              Fecha no encontrada en el calendario litúrgico
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-5 space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-5 border-2 border-blue-300 dark:border-blue-700 shadow-lg transition-colors">
            <div className="flex gap-3">
              <div className="text-3xl">📅</div>
              <div>
                <h3 className="text-xl font-bold text-blue-950 dark:text-blue-100 mb-2">
                  Fecha Seleccionada
                </h3>
                <p className="text-lg text-blue-900 dark:text-blue-200">
                  {formatDate(selectedDate)}
                </p>
                <p className="text-base text-blue-800 dark:text-blue-300 mt-2">
                  Esta fecha no corresponde a un domingo del calendario litúrgico ordinario. 
                  Agrega la celebración especial que se realizará este día.
                </p>
              </div>
            </div>
          </div>

          {/* Solemnity Type */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-brand-ink">Tipo de Celebración</span>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSolemnityType('solemnity')}
                className={`py-4 px-5 rounded-xl text-base font-bold transition-all ${
                  solemnityType === 'solemnity'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg border-2 border-purple-800'
                    : 'bg-white/60 dark:bg-white/20 text-brand-ink-soft hover:bg-white/80 dark:hover:bg-white/30 border-2 border-white/40'
                }`}
              >
                ✨ Solemnidad
              </button>
              <button
                type="button"
                onClick={() => setSolemnityType('feast')}
                className={`py-4 px-5 rounded-xl text-base font-bold transition-all ${
                  solemnityType === 'feast'
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg border-2 border-purple-800'
                    : 'bg-white/60 dark:bg-white/20 text-brand-ink-soft hover:bg-white/80 dark:hover:bg-white/30 border-2 border-white/40'
                }`}
              >
                🎉 Fiesta
              </button>
            </div>
          </div>

          {/*
            La elección que no se puede deducir: una fiesta patronal o una solemnidad
            propia desplaza al domingo, pero una ordenación o una jornada en domingo no
            lo desplaza — sigue siendo ese domingo, con su salmo. Como el nombre no lo
            dice, lo elige quien la crea. Solo aparece si ese día ya tiene celebración.
          */}
          {yaSeCelebra && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-5 border-2 border-amber-300 dark:border-amber-700">
              <p className="text-base font-bold text-brand-ink mb-1">Ese día ya se celebra: {yaSeCelebra}</p>
              <p className="text-sm text-brand-ink-soft mb-3">¿Qué pasa con esa celebración?</p>
              <button
                type="button"
                onClick={() => setReemplaza(false)}
                className={`w-full text-left p-4 rounded-xl mb-2 border-2 transition-all ${
                  !reemplaza ? 'bg-white dark:bg-slate-800 border-purple-600 shadow' : 'bg-white/50 dark:bg-white/10 border-white/40'
                }`}
              >
                <span className="block font-bold text-brand-ink">Se celebra además</span>
                <span className="block text-sm text-brand-ink-soft">
                  El día sigue siendo {yaSeCelebra}, con su salmo, y se menciona también la
                  nueva. Es lo habitual en una ordenación, una jornada o un aniversario.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setReemplaza(true)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  reemplaza ? 'bg-white dark:bg-slate-800 border-purple-600 shadow' : 'bg-white/50 dark:bg-white/10 border-white/40'
                }`}
              >
                <span className="block font-bold text-brand-ink">Reemplaza a {yaSeCelebra}</span>
                <span className="block text-sm text-brand-ink-soft">
                  Ese día no se celebra {yaSeCelebra}: manda la nueva, con su propio salmo.
                  Es lo que corresponde a una fiesta patronal o a una solemnidad propia.
                </span>
              </button>
            </div>
          )}

          {/* Color litúrgico */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Palette className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-brand-ink">Color Litúrgico</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {/* Sin elegir = el del calendario. Es lo correcto casi siempre, así que va
                  primero y viene marcado. */}
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className={`py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all ${
                  color === undefined
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-800'
                    : 'bg-white/60 dark:bg-white/20 text-brand-ink-soft border-white/40'
                }`}
              >
                El del calendario
              </button>
              {LITURGICAL_COLOR_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border-2 flex items-center gap-2 transition-all ${
                    color === c.id
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-800'
                      : 'bg-white/60 dark:bg-white/20 text-brand-ink-soft border-white/40'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Solemnity Name */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-brand-ink">Nombre de la Celebración</span>
            </label>
            <input
              type="text"
              value={solemnityName}
              onChange={(e) => setSolemnityName(e.target.value)}
              placeholder="Ej: Fiesta del Santo Patrono, Aniversario Parroquial..."
              className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 bg-white/60 dark:bg-white/10 text-brand-ink font-bold shadow-lg transition-colors placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
              Ejemplo: "Nuestra Señora de Guadalupe", "San José Obrero", "Aniversario de la Parroquia"
            </p>
          </div>

          {/* Alcance: ¿para quién es esta celebración? */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Church className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-brand-ink">¿Para quién?</span>
            </label>

            {isAdmin ? (
              <>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 bg-white/70 dark:bg-white/10 text-brand-ink font-bold"
                >
                  <option value={GLOBAL_SCOPE}>Todos los usuarios (global)</option>
                  {parishes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-sm text-purple-900 dark:text-purple-200 mt-2">
                  Como Administrador, «Todos los usuarios» agrega la celebración al calendario de <strong>toda la app</strong>.
                </p>
              </>
            ) : parishes.length > 1 ? (
              <>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-4 py-3 text-base rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 bg-white/70 dark:bg-white/10 text-brand-ink font-bold"
                >
                  <option value="">Elige la parroquia/capilla…</option>
                  {parishes.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-sm text-blue-900 dark:text-blue-200 mt-2">
                  La celebración quedará disponible para la parroquia/capilla que elijas.
                </p>
              </>
            ) : (
              <p className="text-base text-blue-900 dark:text-blue-200 font-medium">
                Se agregará para <strong>{scope || 'tu parroquia'}</strong>.
              </p>
            )}
          </div>

          {/* Examples */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/40 dark:border-white/20 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <h4 className="text-base font-bold text-brand-ink mb-2">Ejemplos comunes</h4>
                <ul className="text-sm text-brand-ink-soft space-y-1">
                  <li>• Solemnidades de Santos Patronos de la parroquia</li>
                  <li>• Fiestas de la Virgen María (Guadalupe, Fátima, etc.)</li>
                  <li>• Aniversarios parroquiales</li>
                  <li>• Dedicación de la Iglesia</li>
                  <li>• Fiestas de Santos específicos de tu región</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-white/50 dark:bg-white/20 text-brand-ink py-3 px-4 rounded-xl font-bold text-lg hover:bg-white/70 dark:hover:bg-white/30 transition-colors border-2 border-white/60 dark:border-white/30"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-lg transition-all border-2 ${
                canSave
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg active:scale-95 border-purple-800'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Plus className="w-5 h-5 flex-shrink-0" />
                Agregar celebración
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}