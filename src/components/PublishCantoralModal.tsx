import { useState, useEffect } from 'react';
import { X, Send, Calendar, Church, Clock, Plus } from 'lucide-react';
import { Song, InstrumentType } from '../types';
import { getTodayLocal, formatYmdForDisplay } from '../utils/dateLocal';
import { getLiturgicalDateForDate, getDateForLiturgicalName, isSunday, getLiturgicalDateNames } from '../utils/liturgicalCalendar';
import { AddSolemnityModal } from './AddSolemnityModal';
import { CantoralPDFPreview } from './CantoralPDFPreview';
import { PostPublishModal } from './PostPublishModal';
import { toast } from 'sonner';

/** Destino de publicación: una parroquia con su propia fecha/celebración/horario. */
export interface PublishTarget {
  parishName: string;
  date: string;
  liturgicalDate: string;
  massTime: string;
}

interface PublishCantoralModalProps {
  cantoral: Song[];
  /** Parroquia activa — usada como destino por defecto y en el modo de una sola parroquia. */
  parishName: string;
  /** Conjunto completo de parroquias del coro. Si tiene >1, se habilita el modo multi-parroquia. */
  parishes?: string[];
  onClose: () => void;
  onPublish: (targets: PublishTarget[]) => Promise<void> | void;
  userInstruments?: InstrumentType[];
}

interface CustomLiturgicalDate {
  name: string;
  date: string;
}

/** Estado por parroquia en el modo multi-parroquia. */
interface ParishSchedule {
  date: string;
  liturgicalDate: string;
  massTime: string;
}

/** Q38 — Normaliza horarios variados al formato 'HH:MM AM/PM' canónico. */
function normalizeMassTime(raw: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!trimmed) return raw;
  // Match HH:MM with optional AM/PM
  const m = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!m) return trimmed; // unknown format, leave as-is
  const h = parseInt(m[1], 10);
  const min = m[2].padStart(2, '0');
  const period = m[3] ?? (h >= 12 ? 'PM' : 'AM');
  const displayH = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${String(displayH).padStart(2, '0')}:${min} ${period}`;
}

const MASS_TIME_SUGGESTIONS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
];

export function PublishCantoralModal({ cantoral, parishName, parishes = [], onClose, onPublish, userInstruments = [] }: PublishCantoralModalProps) {
  // Lista efectiva de parroquias (con fallback a la activa). >1 ⇒ modo multi-parroquia.
  const allParishes = parishes.length > 0 ? parishes : (parishName ? [parishName] : []);
  const isMulti = allParishes.length > 1;

  // ── Estado modo una sola parroquia ────────────────────────────────────────
  // Use local-timezone today to avoid the user in a negative-offset TZ
  // (Chile, México, Argentina) publishing for "tomorrow" when it's 22:00.
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [liturgicalDate, setLiturgicalDate] = useState('');
  const [massTime, setMassTime] = useState('');
  const [dateChangeSource, setDateChangeSource] = useState<'calendar' | 'liturgical' | null>(null);

  // ── Estado modo multi-parroquia ───────────────────────────────────────────
  // Parroquias marcadas para publicar (por defecto, solo la activa).
  const [selectedParishes, setSelectedParishes] = useState<Set<string>>(
    () => new Set(parishName ? [parishName] : [])
  );
  // Fecha/celebración/horario por parroquia.
  const [schedules, setSchedules] = useState<Record<string, ParishSchedule>>(() => {
    const today = getTodayLocal();
    // Auto-derivar la celebración de hoy (si es domingo/solemnidad del calendario)
    // para no obligar a re-elegir la fecha cuando ya es la correcta.
    const todayLiturgical = getLiturgicalDateForDate(today) || '';
    const init: Record<string, ParishSchedule> = {};
    allParishes.forEach(p => { init[p] = { date: today, liturgicalDate: todayLiturgical, massTime: '' }; });
    return init;
  });

  // ── Estado compartido ─────────────────────────────────────────────────────
  const [showAddSolemnityModal, setShowAddSolemnityModal] = useState(false);
  const [showDownloadPDFModal, setShowDownloadPDFModal] = useState(false);
  const [showPostPublishModal, setShowPostPublishModal] = useState(false);
  const [customDates, setCustomDates] = useState<CustomLiturgicalDate[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  // ── Efectos de sincronización fecha ↔ celebración (solo modo una parroquia) ─
  useEffect(() => {
    if (dateChangeSource === 'calendar') {
      const liturgicalName = getLiturgicalDateForDate(selectedDate);

      if (liturgicalName) {
        setLiturgicalDate(liturgicalName);
        toast.success('Celebración encontrada', { description: liturgicalName });
      } else if (isSunday(selectedDate)) {
        toast.info('Domingo no encontrado', {
          description: 'Agrega la celebración para este domingo',
          action: { label: 'Agregar', onClick: () => setShowAddSolemnityModal(true) }
        });
        setLiturgicalDate('');
      } else {
        toast.warning('Fecha no litúrgica', {
          description: 'La fecha seleccionada no corresponde a un domingo. Agrega la celebración especial.',
          action: { label: 'Agregar', onClick: () => setShowAddSolemnityModal(true) }
        });
        setLiturgicalDate('');
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, selectedDate]);

  useEffect(() => {
    if (dateChangeSource === 'liturgical' && liturgicalDate) {
      const currentYear = new Date(selectedDate).getFullYear();
      const date = getDateForLiturgicalName(liturgicalDate, currentYear);

      if (date) {
        setSelectedDate(date);
        toast.success('Fecha encontrada', {
          description: formatYmdForDisplay(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        });
      } else {
        const customDate = customDates.find(cd => cd.name === liturgicalDate);
        if (customDate) setSelectedDate(customDate.date);
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, liturgicalDate, customDates]);

  // ── Helpers modo multi-parroquia ──────────────────────────────────────────
  const toggleParish = (parish: string) => {
    setSelectedParishes(prev => {
      const next = new Set(prev);
      if (next.has(parish)) next.delete(parish); else next.add(parish);
      return next;
    });
  };

  const allSelected = allParishes.length > 0 && allParishes.every(p => selectedParishes.has(p));
  const toggleSelectAll = () => {
    setSelectedParishes(allSelected ? new Set() : new Set(allParishes));
  };

  const updateSchedule = (parish: string, patch: Partial<ParishSchedule>) => {
    setSchedules(prev => ({ ...prev, [parish]: { ...prev[parish], ...patch } }));
  };

  // Cambiar la fecha de una parroquia auto-deriva su celebración litúrgica (si existe
  // en el calendario). Sin toasts para no spamear cuando hay varias parroquias.
  const setParishDate = (parish: string, date: string) => {
    const derived = getLiturgicalDateForDate(date);
    updateSchedule(parish, { date, liturgicalDate: derived || schedules[parish]?.liturgicalDate || '' });
  };

  // ── Publicar ──────────────────────────────────────────────────────────────
  const buildTargets = (): PublishTarget[] => {
    if (isMulti) {
      return Array.from(selectedParishes).map(parish => {
        const s = schedules[parish];
        return {
          parishName: parish,
          date: s.date,
          liturgicalDate: s.liturgicalDate.trim(),
          massTime: normalizeMassTime(s.massTime),
        };
      });
    }
    return [{
      parishName: allParishes[0] || parishName,
      date: selectedDate,
      liturgicalDate: liturgicalDate.trim(),
      massTime: normalizeMassTime(massTime),
    }];
  };

  const canPublish = (() => {
    if (isPublishing || cantoral.length === 0) return false;
    if (isMulti) {
      if (selectedParishes.size === 0) return false;
      return Array.from(selectedParishes).every(p => {
        const s = schedules[p];
        return !!s && !!s.date && !!s.liturgicalDate && !!s.massTime;
      });
    }
    return !!selectedDate && !!liturgicalDate && !!massTime;
  })();

  const handlePublish = async () => {
    if (!canPublish || isPublishing) return;
    setIsPublishing(true);
    try {
      // Await the full pipeline: DB insert(s) + PDF gen + Storage upload + QR dialog
      await onPublish(buildTargets());
    } finally {
      setIsPublishing(false);
    }
  };

  // Opciones de celebración litúrgica para un año dado (+ solemnidades custom).
  const liturgicalOptions = (year: number) => [
    ...getLiturgicalDateNames(year),
    ...customDates.map(cd => cd.name),
  ];

  return (
    <>
      {!showDownloadPDFModal && !showAddSolemnityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              // No permitir cerrar el modal accidentalmente mientras se está publicando —
              // el backend está procesando upload de PDF + DB insert y cerrar a medio
              // camino podría dejar al usuario sin ver el QR.
              if (!isPublishing) onClose();
            }}
          />
          <div
            className="relative bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border-4 border-blue-800 transition-colors overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header — fixed top of the flex column */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 z-10 border-b-4 border-blue-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Send className="w-10 h-10" strokeWidth={2.5} />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Publicar Cantoral</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-8 h-8" strokeWidth={2.5} />
                </button>
              </div>
              <div className="bg-white/20 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/30">
                <span className="text-lg font-bold">{cantoral.length} cantos listos para publicar</span>
              </div>
            </div>

            {/* Content — scrollable middle region of the flex column */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-6">
              {isMulti ? (
                /* ── Modo multi-parroquia: elegir parroquias + fecha/horario por cada una ── */
                <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-800 flex-shrink-0">
                      <Church className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xl font-bold text-blue-950 dark:text-white">¿A qué parroquias?</div>
                      <div className="text-sm text-blue-900 dark:text-blue-200">
                        Mismos cantos; indicá fecha y horario de cada misa.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleSelectAll}
                    className="mb-3 text-sm font-bold text-blue-800 dark:text-blue-200 underline"
                  >
                    {allSelected ? 'Quitar todas' : 'Seleccionar todas'}
                  </button>

                  <div className="space-y-3">
                    {allParishes.map((parish) => {
                      const checked = selectedParishes.has(parish);
                      const s = schedules[parish];
                      const year = new Date(s?.date || getTodayLocal()).getFullYear();
                      return (
                        <div
                          key={parish}
                          className={`rounded-xl border-2 transition-colors ${
                            checked
                              ? 'border-blue-600 dark:border-blue-400 bg-white/60 dark:bg-white/10'
                              : 'border-white/50 dark:border-white/20 bg-white/30 dark:bg-white/5'
                          }`}
                        >
                          <label className="flex items-center gap-3 p-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleParish(parish)}
                              className="w-5 h-5 rounded border-2 border-blue-600 dark:border-blue-400 accent-blue-600 cursor-pointer flex-shrink-0"
                            />
                            <span className="text-base font-bold text-blue-950 dark:text-white break-words">{parish}</span>
                          </label>

                          {checked && (
                            <div className="px-3 pb-4 pt-1 space-y-3 border-t-2 border-white/50 dark:border-white/10">
                              {/* Fecha */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-blue-950 dark:text-white">
                                  <Calendar className="w-4 h-4" /> Fecha de la Misa
                                </label>
                                <input
                                  type="date"
                                  value={s.date}
                                  onChange={(e) => setParishDate(parish, e.target.value)}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-bold"
                                />
                              </div>
                              {/* Celebración litúrgica */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-blue-950 dark:text-white">
                                  📖 Calendario Litúrgico
                                </label>
                                <select
                                  value={s.liturgicalDate}
                                  onChange={(e) => updateSchedule(parish, { liturgicalDate: e.target.value })}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-bold"
                                >
                                  <option value="">Seleccionar...</option>
                                  {liturgicalOptions(year).map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                  ))}
                                </select>
                              </div>
                              {/* Horario */}
                              <div>
                                <label className="flex items-center gap-2 mb-1 text-sm font-bold text-blue-950 dark:text-white">
                                  <Clock className="w-4 h-4" /> Horario de la Misa
                                </label>
                                <select
                                  value={s.massTime}
                                  onChange={(e) => updateSchedule(parish, { massTime: e.target.value })}
                                  className="w-full px-3 py-3 text-base rounded-lg border-2 border-blue-300 dark:border-white/20 focus:outline-none focus:border-blue-600 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-bold"
                                >
                                  <option value="">Seleccionar...</option>
                                  {MASS_TIME_SUGGESTIONS.map((time) => (
                                    <option key={time} value={time}>{time}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ── Modo una sola parroquia (comportamiento original) ── */
                <>
                  {/* Parish Name */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-800">
                        <Church className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-sm text-blue-900 dark:text-blue-200">Parroquia</div>
                        <div className="text-xl font-bold text-blue-950 dark:text-white">{parishName}</div>
                      </div>
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-800">
                        <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-bold text-blue-950 dark:text-white">Fecha de la Misa</span>
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setDateChangeSource('calendar');
                      }}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors"
                    />
                  </div>

                  {/* Liturgical Date Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-800">
                        <span className="text-xl">📖</span>
                      </div>
                      <span className="text-xl font-bold text-blue-950 dark:text-white">Calendario Litúrgico</span>
                    </label>
                    <select
                      value={liturgicalDate}
                      onChange={(e) => {
                        setLiturgicalDate(e.target.value);
                        setDateChangeSource('liturgical');
                      }}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors"
                    >
                      <option value="">Seleccionar...</option>
                      {liturgicalOptions(new Date(selectedDate).getFullYear()).map((date) => (
                        <option key={date} value={date}>
                          {date}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
                      Selecciona el tiempo litúrgico correspondiente
                    </p>
                    <button
                      onClick={() => setShowAddSolemnityModal(true)}
                      className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar solemnidad
                    </button>
                  </div>

                  {/* Mass Time Selection */}
                  <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
                    <label className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-950 rounded-xl flex items-center justify-center border-2 border-blue-800">
                        <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-bold text-blue-950 dark:text-white">Horario de la Misa</span>
                    </label>
                    <select
                      value={massTime}
                      onChange={(e) => setMassTime(e.target.value)}
                      className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 bg-white/60 dark:bg-white/10 text-blue-950 dark:text-white font-bold shadow-lg transition-colors"
                    >
                      <option value="">Seleccionar...</option>
                      {MASS_TIME_SUGGESTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
                      Indica la hora en que se celebrará la misa
                    </p>
                  </div>
                </>
              )}

              {/* Preview */}
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border-2 border-white/40 dark:border-white/20 transition-colors">
                <div className="flex gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h4 className="text-base font-bold text-blue-950 dark:text-white mb-1">Vista previa</h4>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      {isMulti
                        ? `Se publicará el mismo cantoral en ${selectedParishes.size} parroquia${selectedParishes.size === 1 ? '' : 's'}, con la fecha y horario de cada misa.`
                        : 'Este cantoral estará disponible para que los fieles de tu parroquia puedan seguir la liturgia con los cantos seleccionados.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Folleto PDF Info */}
              <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 rounded-2xl p-5 border-2 border-green-300 dark:border-green-700 shadow-lg transition-colors">
                <div className="flex gap-3">
                  <div className="text-3xl">📖</div>
                  <div>
                    <h4 className="text-xl font-bold text-green-950 dark:text-green-100 mb-2">
                      Folleto Digital para el Coro
                    </h4>
                    <p className="text-base text-green-900 dark:text-green-200 leading-relaxed">
                      Al publicar tu cantoral, podrás descargar un PDF con el esquema completo de cantos organizado por categorías litúrgicas.
                      Perfecto para compartir con los miembros del coro que prefieren tener el cantoral descargado
                      sin necesidad de entrar a la aplicación durante la Misa.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer — fixed bottom of the flex column. Stays visible even
                when the mobile virtual keyboard shrinks the viewport. */}
            <div className="flex-shrink-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-t-4 border-blue-800 p-3 sm:p-5" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isPublishing}
                  className="flex-1 bg-white/50 dark:bg-white/20 text-blue-950 dark:text-white py-4 px-4 rounded-xl font-bold text-lg hover:bg-white/70 dark:hover:bg-white/30 transition-colors border-2 border-white/60 dark:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePublish}
                  disabled={!canPublish}
                  className={`flex-1 py-4 px-4 rounded-xl font-bold text-lg transition-all border-2 ${
                    canPublish
                      ? 'bg-gradient-to-r from-blue-900 to-blue-950 text-white hover:shadow-lg active:scale-95 border-blue-800'
                      : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isPublishing ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Publicando…
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        {isMulti ? `Publicar en ${selectedParishes.size || ''} ${selectedParishes.size === 1 ? 'parroquia' : 'parroquias'}` : 'Publicar'}
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddSolemnityModal && (
        <AddSolemnityModal
          selectedDate={selectedDate}
          onClose={() => setShowAddSolemnityModal(false)}
          onAdd={(name, date) => {
            setCustomDates([...customDates, { name, date }]);
            setLiturgicalDate(name);
            setShowAddSolemnityModal(false);
            toast.success('Celebración agregada', {
              description: 'Ahora puedes publicar tu cantoral con esta celebración'
            });
          }}
        />
      )}
      {showDownloadPDFModal && (
        <CantoralPDFPreview
          cantoral={cantoral}
          parishName={parishName}
          date={selectedDate}
          celebration={liturgicalDate}
          massTime={massTime}
          userInstruments={userInstruments}
          onClose={() => {
            setShowDownloadPDFModal(false);
            onClose(); // Cerrar también el modal de publicación
          }}
        />
      )}
      {showPostPublishModal && (
        <PostPublishModal
          onContinueInApp={() => {
            setShowPostPublishModal(false);
            onClose(); // Cerrar todo y continuar en la app
          }}
          onDownloadPDF={() => {
            setShowPostPublishModal(false);
            setShowDownloadPDFModal(true); // Mostrar vista previa del folleto
          }}
        />
      )}
    </>
  );
}
