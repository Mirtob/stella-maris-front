import { useState, useEffect } from 'react';
import { Calendar, Church, ChevronDown, ChevronUp, Bell, Plus, BookOpen, X } from 'lucide-react';
import { liturgicalCalendar2026, LiturgicalEvent } from '../../data/liturgicalCalendar';
import { getLiturgicalCardClasses, getLiturgicalSolidColor } from '../../utils/liturgicalColors';
import { parseYmdLocal, formatYmdForDisplay, addDaysLocal } from '../../utils/dateLocal';
import {
  listCustomLiturgicalDates,
  addCustomLiturgicalDate,
  toLiturgicalDate,
  GLOBAL_SCOPE,
  type CustomLiturgicalDate,
} from '../../services/liturgicalDates';
import { setPersistedCustomDates, getPersistedCustomDates, getCelebrationsForDate } from '../../utils/liturgicalCalendar';

/** Para comparar "26° Domingo…" con "26.º Domingo…" sin que la ortografía estorbe. */
const normalizaNombre = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
import { toast } from 'sonner';

/** Convierte una celebración persistida (BD) en un evento del calendario visual. */
const persistedToEvent = (c: CustomLiturgicalDate): LiturgicalEvent => ({
  id: c.id ?? `persist_${c.date}_${c.name}`,
  name: c.name,
  date: c.date,
  type: c.type === 'feast' ? 'Fiesta' : 'Solemnidad',
  color: 'Blanco',
  season: 'Tiempo Ordinario',
  importance: 'medium',
});

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface LiturgicalCalendarProps {
  onCreateCantoral?: (liturgicalDate: string, date: string) => void;
  /** Rol efectivo: el Pueblo fiel ve "Ver cantoral" en vez de "Agregar Cantoral". */
  userRole?: 'Coro' | 'Pueblo fiel' | 'Admin';
  /** Admin verificado: sus celebraciones son globales (para todos los usuarios). */
  isAdmin?: boolean;
  /** Parroquias/capillas del perfil (alcance de las celebraciones del coro). */
  parishes?: string[];
  /** Cantorales publicados (para saber si hay uno en esa fecha/celebración). */
  publishedCantorals?: { date: string; liturgicalDate: string }[];
  /** Ir a ver el/los cantoral(es) publicados (Pueblo fiel). */
  onViewCantoral?: (liturgicalDate: string, date: string) => void;
}

export function LiturgicalCalendar({ onCreateCantoral, userRole, isAdmin = false, parishes = [], publishedCantorals = [], onViewCantoral }: LiturgicalCalendarProps = {}) {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [pendingEvent, setPendingEvent] = useState<LiturgicalEvent | null>(null);
  const [customEvents, setCustomEvents] = useState<LiturgicalEvent[]>([]);
  // Celebraciones PERSISTIDAS (BD): globales (de cualquier admin) + de las parroquias
  // del usuario. Se cargan al abrir el calendario para que aparezcan a TODOS los perfiles.
  const [persistedEvents, setPersistedEvents] = useState<LiturgicalEvent[]>([]);

  // Form state for new event
  const [newEventName, setNewEventName] = useState('');
  const [newEventDay, setNewEventDay] = useState('');
  const [newEventMonth, setNewEventMonth] = useState('');
  const [newEventType, setNewEventType] = useState<'Solemnidad' | 'Fiesta'>('Fiesta');
  const [newEventColor, setNewEventColor] = useState<'Blanco' | 'Rojo' | 'Verde' | 'Morado' | 'Rosa'>('Blanco');
  const [newEventDescription, setNewEventDescription] = useState('');
  // Alcance: Admin → 'global' (todos); Coro → una de sus parroquias/capillas.
  const [newEventScope, setNewEventScope] = useState<string>(
    isAdmin ? GLOBAL_SCOPE : (parishes.length === 1 ? parishes[0] : '')
  );

  // Alert configuration
  const [alertDaysBefore, setAlertDaysBefore] = useState<number>(7);

  const parishesKey = parishes.join('|');
  useEffect(() => {
    let cancelled = false;
    listCustomLiturgicalDates(parishes).then((rows) => {
      if (cancelled) return;
      setPersistedEvents(rows.map(persistedToEvent));
      // Mantener también el caché del calendario (usado por el selector al publicar).
      setPersistedCustomDates(rows.map(toLiturgicalDate));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parishesKey]);

  // Combinar el calendario oficial + persistidas (BD) + agregadas en esta sesión.
  const allEvents = [...liturgicalCalendar2026, ...persistedEvents, ...customEvents];

  // Agrupar eventos por mes y ORDENAR cronológicamente dentro de cada mes.
  // parseYmdLocal evita el corrimiento de día/mes de `new Date('YYYY-MM-DD')`,
  // que se interpreta como UTC y en Chile cae un día antes.
  const eventsByMonth = MONTHS.map((_, index) => {
    return allEvents
      .filter(event => parseYmdLocal(event.date).getMonth() === index)
      .sort((a, b) => a.date.localeCompare(b.date));
  });

  const formatDate = (dateStr: string) =>
    formatYmdForDisplay(dateStr, { day: 'numeric', month: 'short' });

  // El 8 de diciembre (Inmaculada Concepción) es la única celebración con estilo
  // especial: fondo blanco con letras celestes. El resto usa su color litúrgico.
  const cardClasses = (event: LiturgicalEvent) =>
    event.date.slice(5) === '12-08'
      ? 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-300'
      : getLiturgicalCardClasses(event.color);

  const getImportanceIcon = (importance: string) => {
    if (importance === 'high') return <Bell className="w-6 h-6 text-amber-500" strokeWidth={2.5} />;
    return null;
  };

  const handleAddEvent = () => {
    if (!puedeAgregarCelebracion) return;   // el botón no existe para el Pueblo fiel
    if (!newEventName || !newEventDay || !newEventMonth) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    if (!newEventScope) {
      alert('Elige para quién es la celebración (parroquia/capilla).');
      return;
    }

    const newEvent: LiturgicalEvent = {
      id: `custom_${Date.now()}`,
      name: newEventName,
      // Día con dos dígitos para una fecha válida ('2026-01-05', no '2026-01-5').
      date: `2026-${newEventMonth}-${String(newEventDay).padStart(2, '0')}`,
      type: newEventType,
      color: newEventColor,
      season: 'Tiempo Ordinario', // Por defecto
      importance: 'medium',
      description: newEventDescription || undefined,
    };

    // Guardar evento pendiente y mostrar diálogo de alertas
    setPendingEvent(newEvent);
    setShowAddEventModal(false);
    setShowAlertDialog(true);
  };

  const handleConfirmAlert = async (enableAlert: boolean) => {
    if (!pendingEvent) return;

    const finalEvent: LiturgicalEvent = {
      ...pendingEvent,
      alertEnabled: enableAlert,
      alertDaysBefore: enableAlert ? alertDaysBefore : undefined,
    };

    // Mostrarla de inmediato en esta sesión (con el color/estilo elegidos).
    setCustomEvents([...customEvents, finalEvent]);
    const scope = newEventScope;

    // Reset form
    setNewEventName('');
    setNewEventDay('');
    setNewEventMonth('');
    setNewEventType('Fiesta');
    setNewEventColor('Blanco');
    setNewEventDescription('');
    setNewEventScope(isAdmin ? GLOBAL_SCOPE : (parishes.length === 1 ? parishes[0] : ''));
    setAlertDaysBefore(7);
    setPendingEvent(null);
    setShowAlertDialog(false);

    // PERSISTIR: Admin → global (todos); Coro → su parroquia/capilla. Así aparece en
    // TODOS los perfiles (no solo en esta sesión). El caché del calendario se refresca
    // para que el selector al publicar también la vea sin recargar.
    const r = await addCustomLiturgicalDate({
      name: finalEvent.name,
      date: finalEvent.date,
      type: finalEvent.type === 'Fiesta' ? 'feast' : 'solemnity',
      scope,
    });
    if (r.ok && r.row) {
      setPersistedCustomDates([...getPersistedCustomDates(), toLiturgicalDate(r.row)]);
      toast.success('Celebración agregada', {
        description: (scope === GLOBAL_SCOPE
          ? 'Visible para todos los usuarios.'
          : `Guardada para ${scope}.`)
          + (enableAlert ? ` Alerta ${alertDaysBefore} ${alertDaysBefore === 1 ? 'día' : 'días'} antes.` : ''),
      });
    } else if (/row-level security|permission|42501|no autorizado|forbidden/i.test(r.error || '')) {
      // Rechazo por permisos: NO tiene sentido dejarla "solo en esta sesión", porque no
      // se va a guardar nunca. Se quita de la lista y se dice claro por qué.
      setCustomEvents(prev => prev.filter(e => e.id !== finalEvent.id));
      toast.error('No puedes agregar celebraciones', {
        description: 'Solo el coro y el administrador de la parroquia pueden hacerlo.',
      });
    } else {
      // Falla de red o del servidor: se conserva en pantalla, pero avisando que no quedó guardada.
      toast.warning('Se agregó solo en esta sesión', {
        description: r.error || 'No se pudo guardar en el servidor.',
      });
    }
  };

  const isPuebloFiel = userRole === 'Pueblo fiel';

  /**
   * Agregar celebraciones es cosa del coro y del administrador: son las que ve TODA la
   * parroquia. El Pueblo fiel ni siquiera ve el botón.
   *
   * Manda el rol con el que se ENTRÓ (`userRole`), no `isAdmin`. `isAdmin` dice que la
   * cuenta está en la tabla `admins`, no con qué rol se está actuando: incluyéndolo, el
   * administrador que entraba como Pueblo fiel seguía viendo el botón. `isAdmin` decide
   * otra cosa —si la celebración es global o de la parroquia—, y para eso se queda.
   *
   * La base ya lo impide (política `cld_insert`, migración 20260823), pero sin este
   * filtro el botón aparecía igual y, al fallar el guardado, la celebración se mostraba
   * "solo en esta sesión": el usuario creía haberla agregado para todos.
   */
  const puedeAgregarCelebracion = userRole === 'Coro' || userRole === 'Admin';

  // ¿Hay un cantoral publicado para esta celebración? Coincide por nombre litúrgico
  // o por fecha (incluida la víspera, que se guarda el día anterior en I Vísperas).
  const hasPublishedFor = (event: LiturgicalEvent) =>
    publishedCantorals.some(c =>
      c.liturgicalDate === event.name ||
      c.date === event.date ||
      c.date === addDaysLocal(event.date, -1)
    );

  /**
   * Lo demás que se celebra el mismo día que este evento.
   *
   * Se compara SIN el nombre, por fecha: el calendario visual escribe "26° Domingo…" y
   * el motor litúrgico "26.º Domingo…" — de 67 celebraciones, 54 se escriben distinto en
   * los dos sitios. Emparejar por nombre no funcionaría.
   */
  const otrasCelebraciones = (event: LiturgicalEvent): string[] => {
    const c = getCelebrationsForDate(event.date);
    const mismo = (a: string, b: string) => normalizaNombre(a) === normalizaNombre(b);
    return [c.principal, ...c.ademas].filter((n) => n && !mismo(n, event.name));
  };

  const handleAddCantoral = (event: LiturgicalEvent) => {
    if (onCreateCantoral) {
      onCreateCantoral(event.name, event.date);
    } else {
      alert(`Crear cantoral para: ${event.name} (${formatDate(event.date)})\n\nEsta funcionalidad te llevará a crear un nuevo cantoral.`);
      // Aquí se puede agregar la lógica para navegar a la creación de cantoral
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-indigo-950 dark:to-blue-950 transition-colors">
      <div className="max-w-4xl mx-auto pt-8 pb-24">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl">
              <Calendar className="w-14 h-14 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-2xl sm:text-3xl md:text-6xl font-bold text-purple-900 dark:text-purple-200 mb-4 leading-tight">
            Calendario Litúrgico 2026
          </h1>
          <p className="text-xl sm:text-2xl text-purple-700 dark:text-purple-300">
            Todas las celebraciones del año litúrgico
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-amber-50 dark:bg-amber-900/30 border-4 border-amber-300 dark:border-amber-700 rounded-3xl p-6 mb-8 transition-colors">
          <div className="flex gap-4">
            <Bell className="w-10 h-10 text-amber-600 dark:text-amber-400 flex-shrink-0" strokeWidth={2.5} />
            <div>
              <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                Alertas Automáticas
              </h3>
              <p className="text-lg text-amber-800 dark:text-amber-300 leading-relaxed">
                Recibirás notificaciones <strong>4 semanas antes</strong> de las solemnidades más importantes marcadas con <Bell className="w-5 h-5 inline text-amber-600" />
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border-4 border-purple-200 dark:border-purple-700 mb-8 transition-colors">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Colores Litúrgicos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-400 border-4 border-amber-600 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">Blanco</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">Rojo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">Verde</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">Morado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-pink-400 rounded-lg"></div>
              <span className="text-lg font-bold text-gray-800 dark:text-white">Rosa</span>
            </div>
          </div>
        </div>

        {/* Agregar celebración — solo coro y administrador */}
        {puedeAgregarCelebracion && (
          <button
            onClick={() => setShowAddEventModal(true)}
            className="w-full p-6 mb-8 flex items-center justify-center gap-3 bg-gradient-to-br from-purple-600 to-purple-700 border-4 border-purple-500 rounded-3xl shadow-xl hover:shadow-2xl active:scale-98 transition-all"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
            <span className="text-2xl font-bold text-white">Agregar celebración</span>
          </button>
        )}

        {/* Add Event Modal */}
        {puedeAgregarCelebracion && showAddEventModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddEventModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl border-4 border-purple-300 dark:border-purple-700 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl sm:text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Agregar celebración</h2>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Fiesta *</label>
                  <input
                    type="text"
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    placeholder="Ej: San Juan Bosco, Patrono de la Parroquia"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Día *</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={newEventDay}
                      onChange={(e) => setNewEventDay(e.target.value)}
                      placeholder="15"
                      className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Mes *</label>
                    <select
                      value={newEventMonth}
                      onChange={(e) => setNewEventMonth(e.target.value)}
                      className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                    >
                      <option value="">Selecciona</option>
                      <option value="01">Enero</option>
                      <option value="02">Febrero</option>
                      <option value="03">Marzo</option>
                      <option value="04">Abril</option>
                      <option value="05">Mayo</option>
                      <option value="06">Junio</option>
                      <option value="07">Julio</option>
                      <option value="08">Agosto</option>
                      <option value="09">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Tipo *</label>
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as 'Solemnidad' | 'Fiesta')}
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                  >
                    <option value="Fiesta">Fiesta</option>
                    <option value="Solemnidad">Solemnidad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Color Litúrgico *</label>
                  <select
                    value={newEventColor}
                    onChange={(e) => setNewEventColor(e.target.value as 'Blanco' | 'Rojo' | 'Verde' | 'Morado' | 'Rosa')}
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                  >
                    <option value="Blanco">Blanco</option>
                    <option value="Rojo">Rojo</option>
                    <option value="Verde">Verde</option>
                    <option value="Morado">Morado</option>
                    <option value="Rosa">Rosa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">Descripción (opcional)</label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Ej: Patrono de la Diócesis de..."
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                    rows={3}
                  />
                </div>

                {/* ¿Para quién? — Admin: global; Coro: su parroquia/capilla. */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">¿Para quién? *</label>
                  {isAdmin ? (
                    <>
                      <select
                        value={newEventScope}
                        onChange={(e) => setNewEventScope(e.target.value)}
                        className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                      >
                        <option value={GLOBAL_SCOPE}>Todos los usuarios (global)</option>
                        {parishes.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Como Administrador, «Todos los usuarios» la agrega al calendario de toda la app.
                      </p>
                    </>
                  ) : parishes.length > 1 ? (
                    <select
                      value={newEventScope}
                      onChange={(e) => setNewEventScope(e.target.value)}
                      className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400"
                    >
                      <option value="">Elige la parroquia/capilla…</option>
                      {parishes.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  ) : (
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium">
                      Se agregará para <strong>{newEventScope || 'tu parroquia'}</strong>.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Footer - Fixed */}
              <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 px-3 sm:px-4 py-4 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-xl text-lg font-bold hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="flex-1 px-3 sm:px-4 py-4 bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl text-lg font-bold hover:shadow-xl active:scale-98 transition-all"
                >
                  Agregar celebración
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Alert Dialog */}
        {showAlertDialog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAlertDialog(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl border-4 border-purple-300 dark:border-purple-700 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
              {/* Header - Fixed */}
              <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl sm:text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Configurar Alerta</h2>
                <button
                  onClick={() => setShowAlertDialog(false)}
                  className="w-10 h-10 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" strokeWidth={2.5} />
                </button>
              </div>
              
              {/* Content - Scrollable */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Descripción */}
                <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-5 transition-colors">
                  <div className="flex items-start gap-4">
                    <Bell className="w-8 h-8 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-1" strokeWidth={2.5} />
                    <div>
                      <h3 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-2">
                        ¿Deseas recibir alertas sobre esta celebración?
                      </h3>
                      <p className="text-base text-amber-800 dark:text-amber-300 leading-relaxed">
                        {pendingEvent && (
                          <>
                            Configuraremos una alerta para <strong>{pendingEvent.name}</strong> el <strong>{formatDate(pendingEvent.date)}</strong>.
                            <br />
                            Tanto coros como el pueblo fiel recibirán la notificación.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Opciones rápidas */}
                <div>
                  <label className="block text-xl font-bold text-gray-800 dark:text-white mb-4">
                    Selecciona cuándo deseas ser notificado:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => setAlertDaysBefore(1)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 1
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      📅 1 día antes
                    </button>
                    <button
                      onClick={() => setAlertDaysBefore(3)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 3
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      📅 3 días antes
                    </button>
                    <button
                      onClick={() => setAlertDaysBefore(7)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 7
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      🗓️ 1 semana antes
                    </button>
                    <button
                      onClick={() => setAlertDaysBefore(14)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 14
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      🗓️ 2 semanas antes
                    </button>
                    <button
                      onClick={() => setAlertDaysBefore(21)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 21
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      🗓️ 3 semanas antes
                    </button>
                    <button
                      onClick={() => setAlertDaysBefore(28)}
                      className={`p-5 rounded-2xl border-3 font-bold text-lg transition-all ${
                        alertDaysBefore === 28
                          ? 'bg-purple-600 text-white border-purple-700 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      🗓️ 4 semanas antes
                    </button>
                  </div>
                </div>

                {/* Personalizado */}
                <div>
                  <label className="block text-lg font-bold text-gray-700 dark:text-gray-300 mb-3">
                    O elige un valor personalizado:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={alertDaysBefore}
                    onChange={(e) => setAlertDaysBefore(parseInt(e.target.value) || 7)}
                    placeholder="7"
                    className="w-full p-4 border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded-xl text-lg focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Días antes de la celebración (1-365)
                  </p>
                </div>
              </div>
              
              {/* Footer - Fixed */}
              <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 flex gap-3 bg-gray-50 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => handleConfirmAlert(false)}
                  className="flex-1 px-3 sm:px-4 py-4 bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-xl text-lg font-bold hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  ❌ No, sin alertas
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmAlert(true)}
                  className="flex-1 px-3 sm:px-4 py-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-xl text-lg font-bold hover:shadow-xl active:scale-98 transition-all border-2 border-green-800"
                >
                  ✅ Sí, activar alerta
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Months */}
        <div className="space-y-4">
          {MONTHS.map((month, index) => {
            const events = eventsByMonth[index];
            const isExpanded = expandedMonth === index;
            
            if (events.length === 0) return null;

            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 border-purple-200 dark:border-purple-700 overflow-hidden transition-colors">
                <button
                  onClick={() => setExpandedMonth(isExpanded ? null : index)}
                  className="w-full p-6 flex items-center justify-between hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Church className="w-10 h-10 text-purple-600 dark:text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                    <div className="text-left">
                      <h3 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">{month}</h3>
                      <p className="text-lg text-gray-600 dark:text-gray-400">{events.length} celebraciones</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-10 h-10 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown className="w-10 h-10 text-purple-600 dark:text-purple-400" strokeWidth={2.5} />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-6 pt-0 space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`p-5 rounded-2xl border-4 ${cardClasses(event)} transition-colors`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-xl font-bold">{event.name}</h4>
                              {getImportanceIcon(event.importance)}
                            </div>
                            <p className="text-lg font-bold opacity-90">
                              {formatDate(event.date)} • {event.type}
                            </p>
                            {/* Lo que se celebra ADEMÁS ese día. Un domingo del Tiempo
                                Ordinario puede llevar encima una jornada o un aniversario
                                sin dejar de ser ese domingo, y hay que ver las dos cosas
                                antes de armar el cantoral. */}
                            {otrasCelebraciones(event).length > 0 && (
                              <p className="text-base opacity-80 mt-1">
                                También: <strong>{otrasCelebraciones(event).join(' · ')}</strong>
                              </p>
                            )}
                          </div>
                        </div>
                        {event.description && (
                          <p className="text-base opacity-80 mb-3">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-4 py-2 bg-white/50 dark:bg-black/20 rounded-xl text-sm font-bold">
                            {event.season}
                          </span>
                          <span className="px-4 py-2 bg-white/50 dark:bg-black/20 rounded-xl text-sm font-bold">
                            Color: {event.color}
                          </span>
                        </div>
                        {isPuebloFiel ? (
                          hasPublishedFor(event) ? (
                            <button
                              onClick={() => onViewCantoral?.(event.name, event.date)}
                              className="w-full p-3 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-98 shadow-lg border-2 border-green-800"
                            >
                              <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                              Ver cantoral
                            </button>
                          ) : (
                            <div className="w-full p-3 bg-white/40 dark:bg-black/20 rounded-xl text-center text-sm font-semibold text-gray-600 dark:text-gray-300 border border-white/40 dark:border-white/10">
                              Aún no hay cantoral publicado para esta fecha.
                            </div>
                          )
                        ) : (
                          <button
                            onClick={() => handleAddCantoral(event)}
                            className="w-full p-3 bg-gradient-to-br from-brand to-brand-strong hover:from-blue-800 hover:to-blue-900 text-white rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all active:scale-98 shadow-lg border-2 border-brand-border"
                          >
                            <BookOpen className="w-6 h-6" strokeWidth={2.5} />
                            Agregar Cantoral
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}