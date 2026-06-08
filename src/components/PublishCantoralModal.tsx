import { useState, useEffect } from 'react';
import { X, Send, Calendar, Church, Clock, Plus, Download, ChevronDown } from 'lucide-react';
import { Song, InstrumentType } from '../types';
import { getTodayLocal, formatYmdForDisplay } from '../utils/dateLocal';
import { getLiturgicalDateForDate, getDateForLiturgicalName, isSunday, getLiturgicalDateNames } from '../utils/liturgicalCalendar';
import { AddSolemnityModal } from './AddSolemnityModal';
import { CantoralPDFPreview } from './CantoralPDFPreview';
import { PostPublishModal } from './PostPublishModal';
import { toast } from 'sonner';

interface PublishCantoralModalProps {
  cantoral: Song[];
  parishName: string;
  onClose: () => void;
  onPublish: (date: string, liturgicalDate: string, massTime: string) => Promise<void> | void;
  userInstruments?: InstrumentType[];
}

interface CustomLiturgicalDate {
  name: string;
  date: string;
}

type VoiceSelection = 'Soprano' | 'Contralto' | 'Tenor' | 'Bajo' | 'Full Score';

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

export function PublishCantoralModal({ cantoral, parishName, onClose, onPublish, userInstruments = [] }: PublishCantoralModalProps) {
  // Use local-timezone today to avoid the user in a negative-offset TZ
  // (Chile, México, Argentina) publishing for "tomorrow" when it's 22:00.
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [liturgicalDate, setLiturgicalDate] = useState('');
  const [massTime, setMassTime] = useState('');
  const [showAddSolemnityModal, setShowAddSolemnityModal] = useState(false);
  const [showDownloadPDFModal, setShowDownloadPDFModal] = useState(false);
  const [showPostPublishModal, setShowPostPublishModal] = useState(false);
  const [customDates, setCustomDates] = useState<CustomLiturgicalDate[]>([]);
  const [dateChangeSource, setDateChangeSource] = useState<'calendar' | 'liturgical' | null>(null);
  const [voiceSelection, setVoiceSelection] = useState<VoiceSelection>('Full Score');
  const [isPublishing, setIsPublishing] = useState(false);

  // Efecto para sincronizar fecha con celebración litúrgica
  useEffect(() => {
    if (dateChangeSource === 'calendar') {
      // Usuario cambió la fecha del calendario
      const currentYear = new Date(selectedDate).getFullYear();
      const liturgicalName = getLiturgicalDateForDate(selectedDate);
      
      if (liturgicalName) {
        // Se encontró la celebración litúrgica
        setLiturgicalDate(liturgicalName);
        toast.success('Celebración encontrada', {
          description: liturgicalName
        });
      } else if (isSunday(selectedDate)) {
        // Es domingo pero no está en el calendario
        toast.info('Domingo no encontrado', {
          description: 'Agrega la celebración para este domingo',
          action: {
            label: 'Agregar',
            onClick: () => setShowAddSolemnityModal(true)
          }
        });
        setLiturgicalDate('');
      } else {
        // No es domingo
        toast.warning('Fecha no litúrgica', {
          description: 'La fecha seleccionada no corresponde a un domingo. Agrega la celebración especial.',
          action: {
            label: 'Agregar',
            onClick: () => setShowAddSolemnityModal(true)
          }
        });
        setLiturgicalDate('');
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, selectedDate]);
  
  // Efecto para sincronizar celebración litúrgica con fecha
  useEffect(() => {
    if (dateChangeSource === 'liturgical' && liturgicalDate) {
      // Usuario cambió la celebración litúrgica
      const currentYear = new Date(selectedDate).getFullYear();
      const date = getDateForLiturgicalName(liturgicalDate, currentYear);
      
      if (date) {
        setSelectedDate(date);
        toast.success('Fecha encontrada', {
          description: formatYmdForDisplay(date, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
      } else {
        // Buscar en fechas personalizadas
        const customDate = customDates.find(cd => cd.name === liturgicalDate);
        if (customDate) {
          setSelectedDate(customDate.date);
        }
      }
    }
    setDateChangeSource(null);
  }, [dateChangeSource, liturgicalDate, customDates]);

  const massTimeSuggestions = [
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

  const handlePublish = async () => {
    if (!selectedDate || !liturgicalDate || !massTime || cantoral.length === 0) return;
    if (isPublishing) return; // prevent double-click

    // Q37 — Normalizar liturgicalDate y massTime antes de mandar a DB.
    // Evita inconsistencias entre filas (mismas celebraciones con distinto
    // whitespace o tipeo) que rompen el agrupamiento en CantoralHistory.
    const cleanLiturgicalDate = liturgicalDate.trim();
    // Q38 — Normalizar massTime: '08:00' -> '08:00 AM', '8:30 am' -> '08:30 AM'.
    const cleanMassTime = normalizeMassTime(massTime);

    setIsPublishing(true);
    try {
      // Await the full pipeline: DB insert + PDF gen + Storage upload + QR dialog
      await onPublish(selectedDate, cleanLiturgicalDate, cleanMassTime);
    } finally {
      setIsPublishing(false);
    }
  };

  const canPublish = !isPublishing && !!selectedDate && !!liturgicalDate && !!massTime && cantoral.length > 0;

  // Detectar si el coro tiene instrumento "Coro" (polifónico)
  const isPolyChoirMode = userInstruments.includes('Coro');
  const isGuitarMode = userInstruments.includes('Guitarra');

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
                  {getLiturgicalDateNames(new Date(selectedDate).getFullYear()).map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                  {customDates.map((customDate) => (
                    <option key={customDate.name} value={customDate.name}>
                      {customDate.name}
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
                  {massTimeSuggestions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-blue-900 dark:text-blue-200 mt-2 transition-colors">
                  Indica la hora en que se celebrará la misa
                </p>
              </div>

              {/* Preview */}
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border-2 border-white/40 dark:border-white/20 transition-colors">
                <div className="flex gap-3">
                  <div className="text-2xl">ℹ️</div>
                  <div>
                    <h4 className="text-base font-bold text-blue-950 dark:text-white mb-1">Vista previa</h4>
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      Este cantoral estará disponible para que los fieles de tu parroquia puedan seguir la liturgia con los cantos seleccionados.
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
                        Publicar
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