import { useState, useEffect, useMemo } from 'react';
import { Send, AlertCircle, Music } from 'lucide-react';
import { toast } from 'sonner';
import { CategorySearch } from '../songs/CategorySearch';
import { Modal } from '../common/Modal';
import { PublishCantoralModal, PublishTarget } from '../cantoral/PublishCantoralModal';
import { LiturgicalSuggestions } from '../liturgy/LiturgicalSuggestions';
import { SelectInstrumentModal } from '../cantoral/SelectInstrumentModal';
import { AtrilMode } from '../atril/AtrilMode';
import { Tour } from '../tour/Tour';
import { constructorTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { Song, InstrumentType, PublishedCantoral, MassType } from '../../types';
import { PsalmFromBook } from '../songs/PsalmFromBook';
import { getLiturgicalDateForDate, getPersistedCustomDates, setPersistedCustomDates } from '../../utils/liturgicalCalendar';
import { getSundayCycle } from '../../utils/liturgicalCycle';
import { resolvePsalm } from '../../data/psalmIndex';
import { AddSolemnityModal } from '../liturgy/AddSolemnityModal';
import { addCustomLiturgicalDate, toLiturgicalDate } from '../../services/liturgicalDates';
import { computeUsage, resolveAnnualTarget } from '../../utils/previousUsage';
import { getTodayLocal, formatYmdForDisplay, parseYmdLocal } from '../../utils/dateLocal';
import { getGospelAcclamationName, getGospelAcclamationIcon, getCurrentLiturgicalSeason, displayCategoryForDate } from '../../utils/liturgicalSeason';
import { getSpecialLiturgicalDay, getCategoriesForSpecialDay, getSpecialDayName, getSpecialDayEmoji, getBuildableCelebrations, SpecialLiturgicalDay } from '../../utils/specialLiturgicalDays';
import { useSongs } from '../../hooks/useSongs';

interface ChoirViewProps {
  preferredInstrument: InstrumentType;
  userInstruments?: InstrumentType[]; // Array de todos los instrumentos que el usuario puede usar
  parishName: string;
  parishes?: string[]; // Conjunto completo de parroquias del coro (para publicar a varias)
  isAdmin?: boolean;   // Admin verificado (aunque actúe como Coro): sus celebraciones son globales
  cantoral: Song[];
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onPublishCantoral: (cantorals: PublishedCantoral[]) => Promise<void> | void;
  /** Cantorales publicados de la parroquia (para avisar cantos repetidos al armar). */
  parishCantorals?: PublishedCantoral[];
  /** Id del cantoral en edición (se excluye del cálculo de repeticiones). */
  editingCantoralId?: string | null;
}

// Horarios de Misa seleccionables cada 30 min (06:00–22:00). Valor 'HH:MM' (24h).
const MASS_TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let mins = 6 * 60; mins <= 22 * 60; mins += 30) {
    out.push(`${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`);
  }
  return out;
})();

export function ChoirView({
  preferredInstrument,
  userInstruments,
  parishName,
  parishes,
  isAdmin,
  cantoral,
  onAddToCantoral,
  onRemoveFromCantoral,
  onPlaySong,
  onPublishCantoral,
  parishCantorals,
  editingCantoralId,
}: ChoirViewProps) {
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showInstrumentModal, setShowInstrumentModal] = useState(false);
  const [selectedInstrumentForMass, setSelectedInstrumentForMass] = useState<InstrumentType>(preferredInstrument);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  // Tiempo Pascual: en lugar del acto penitencial puede hacerse el rito de
  // aspersión (IGMR 51), que cambia el canto de ese momento (y omite el Kyrie).
  // 'null' = aún no se preguntó; al tocar el Kyrie en Pascua preguntamos.
  const [penitentialChoice, setPenitentialChoice] = useState<'kyrie' | 'aspersion' | null>(null);
  const [showAspersionDialog, setShowAspersionDialog] = useState(false);
  const [showAtril, setShowAtril] = useState(false);
  const [showAddSolemnity, setShowAddSolemnity] = useState(false);
  const [celebTick, setCelebTick] = useState(0);
  // Fecha de la Misa para la que se arma el cantoral: fija la celebración/ciclo desde el
  // inicio (para cargar el salmo del libro) y pre-llena la fecha al publicar.
  const [massDate, setMassDate] = useState(getTodayLocal());
  // Todo lo litúrgico (tiempo, rótulo del Aleluya, aspersión) se decide contra la
  // fecha de la MISA, no contra la de hoy: el cantoral se arma con anticipación y
  // puede cruzar de un tiempo litúrgico a otro.
  const massDateObj = useMemo(() => parseYmdLocal(massDate), [massDate]);
  const [massTime, setMassTime] = useState('10:00');
  const [massType, setMassType] = useState<MassType>('dia');
  // Antífona del salmo (editable): por defecto la del índice de la celebración; el coro
  // puede cambiarla si no usa la misma. Viaja al cantoral publicado (y al PDF/pueblo).
  const [psalmAntiphon, setPsalmAntiphon] = useState('');
  useEffect(() => {
    const cel = getLiturgicalDateForDate(massDate);
    const p = cel ? resolvePsalm(getSundayCycle(massDate), cel) : null;
    setPsalmAntiphon(p?.antiphon ?? '');
  }, [massDate]);

  // Canto "Salmo" sintético: antífona (letra) + referencia a la página del libro. Viaja al
  // cantoral publicado, al PDF y al Modo Atril. `null` si no hay salmo para la fecha.
  const psalmSong = useMemo<Song | null>(() => {
    const cel = getLiturgicalDateForDate(massDate);
    const p = cel ? resolvePsalm(getSundayCycle(massDate), cel) : null;
    if (!p) return null;
    const antiphon = psalmAntiphon.trim();
    if (!antiphon && p.page == null) return null;
    return {
      id: `psalm-${massDate}`,
      title: 'Salmo responsorial',
      category: 'Salmo',
      youtubeId: '',
      duration: '',
      lyrics: antiphon,
      massMoment: 'salmo',
      isLiturgical: true,
      psalmBookId: p.driveFileId,
      psalmPage: p.page,
      psalmPageEnd: p.pageEnd,
    } as Song;
  }, [massDate, psalmAntiphon]);
  // Tip contextual del constructor (F4): 1ª vez que se abre una categoría.
  const [showConstructorTip, setShowConstructorTip] = useState(false);
  const { songs: allSongs } = useSongs();
  const currentSeason = getCurrentLiturgicalSeason(massDateObj);

  // Celebraciones que se pueden armar ahora. En Cuaresma/Semana Santa surgen los
  // oficios del Triduo para prepararlos con anticipación. El constructor se
  // adapta (orden y categorías) a la celebración elegida; por defecto la de hoy.
  const celebrations = getBuildableCelebrations();
  // Por defecto, la celebración de hoy solo si está entre las ofrecidas
  // (Misa normal u oficios de Semana Santa); si no, Misa normal.
  const [selectedCelebration, setSelectedCelebration] = useState<SpecialLiturgicalDay | 'normal'>(() => {
    const todaySpecial = getSpecialLiturgicalDay();
    return todaySpecial && celebrations.some(c => c.key === todaySpecial) ? todaySpecial : 'normal';
  });
  const specialDay = selectedCelebration === 'normal' ? null : selectedCelebration;

  // Uso previo de cantos para avisar repeticiones: últimas 4 semanas + la MISMA
  // celebración anual (Cristo Rey, Navidad, oficios de Semana Santa…) en años previos.
  const previousUsage = useMemo(() => {
    const today = getTodayLocal();
    const selDate = selectedCelebration !== 'normal'
      ? celebrations.find(c => c.key === selectedCelebration)?.date
      : undefined;
    const annual = resolveAnnualTarget(today, selDate);
    return computeUsage(parishCantorals ?? [], {
      excludeId: editingCantoralId,
      todayYmd: today,
      weeks: 4,
      annualName: annual?.name ?? null,
    });
    // `celebrations` es estable durante la sesión (depende solo de hoy).
  }, [parishCantorals, editingCantoralId, selectedCelebration]);

  // La aspersión aplica en tiempo pascual; si se está preparando la Vigilia o el
  // Domingo de Resurrección, también (aunque hoy aún sea Cuaresma).
  const isEaster = currentSeason === 'Pascua'
    || selectedCelebration === 'DomingoResurreccion'
    || selectedCelebration === 'VigiliaPascual';

  // Nombre dinámico del Aleluya: "Aclamación al Evangelio" si la Misa cae en Cuaresma.
  const gospelAcclamationName = getGospelAcclamationName(massDateObj);
  const gospelAcclamationIcon = getGospelAcclamationIcon(massDateObj);

  // Día litúrgico especial = la celebración elegida en el constructor.
  const specialDayName = getSpecialDayName(specialDay);
  const specialDayEmoji = getSpecialDayEmoji(specialDay);
  const categoryConfig = getCategoriesForSpecialDay(specialDay);

  // ── Vigilia Pascual: número de lecturas del Antiguo Testamento ──────────────
  // El Misal prevé 7 lecturas del AT, pero por razones pastorales se pueden
  // reducir (el mínimo son 3, y siempre debe leerse la del Éxodo). El coro elige
  // cuántas se harán y el constructor muestra solo esos salmos.
  const isVigil = specialDay === 'VigiliaPascual';
  const [atReadings, setAtReadings] = useState(7);

  const visibleCategories = useMemo(() => {
    if (!isVigil) return categoryConfig.categories;
    return categoryConfig.categories.filter((cat) => {
      const m = /^Salmo AT (\d+)$/.exec(cat);
      return m ? Number(m[1]) <= atReadings : true;
    });
  }, [isVigil, categoryConfig.categories, atReadings]);

  // Al reducir el número de lecturas, sacar del cantoral los cantos de los salmos
  // que dejan de mostrarse: si se quedaran, irían al cantoral publicado sin tener
  // una tarjeta donde verlos ni editarlos.
  const handleChangeAtReadings = (n: number) => {
    const dropped = cantoral.filter((s) => {
      const m = /^Salmo AT (\d+)$/.exec(s.category);
      return m ? Number(m[1]) > n : false;
    });
    dropped.forEach((s) => onRemoveFromCantoral(s.id));
    setAtReadings(n);
    if (dropped.length > 0) {
      toast.info(
        dropped.length === 1
          ? 'Se quitó 1 canto de las lecturas eliminadas'
          : `Se quitaron ${dropped.length} cantos de las lecturas eliminadas`,
      );
    }
  };

  // Celebración y ciclo (A/B/C) derivados de la fecha de la Misa, para el salmo del libro.
  // `celebTick` fuerza recomputar tras agregar una celebración custom.
  const massCelebration = useMemo(() => getLiturgicalDateForDate(massDate), [massDate, celebTick]);
  const massCycle = getSundayCycle(massDate);

  // Mostrar modal de selección de instrumento siempre al inicio
  useEffect(() => {
    if (userInstruments && userInstruments.length > 0 && cantoral.length === 0) {
      setShowInstrumentModal(true);
    }
  }, [userInstruments]);

  // Tip del constructor: la 1ª vez que el coro abre una categoría para agregar cantos.
  const anyCategoryExpanded = Object.values(expandedCategories).some(Boolean);
  useEffect(() => {
    if (anyCategoryExpanded && !hasSeenTip('constructor')) {
      setShowConstructorTip(true);
    }
  }, [anyCategoryExpanded]);

  // Actualizar instrumento cuando se selecciona
  const handleSelectInstrument = (instrument: InstrumentType) => {
    setSelectedInstrumentForMass(instrument);
    setShowInstrumentModal(false);
    // Sin toast: la tarjeta persistente "Instrumento: X" ya comunica la elección
    // (evitamos el triple aviso modal + toast + tarjeta).
  };

  // 'HH:MM' (24h del input time) → 'HH:MM AM/PM' (formato que usa el modal de publicación).
  const to12h = (hhmm: string): string => {
    const [h, m] = (hhmm || '10:00').split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${String(dh).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  const handleToggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCloseCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: false
    }));
  };

  // Respuesta a la pregunta de Pascua: acto penitencial (Kyrie) o rito de aspersión.
  const handleChoosePenitential = (mode: 'kyrie' | 'aspersion') => {
    setPenitentialChoice(mode);
    setShowAspersionDialog(false);
    const cat = mode === 'aspersion' ? 'Rito de Aspersión' : 'Kyrie';
    setExpandedCategories(prev => ({ ...prev, [cat]: true }));
  };

  // Genera un UUID v4 real. La policy de Storage `is_cantoral_pdf_owner` rechaza
  // nombres de objeto que no tengan forma de UUID v4, así que el PDF no se sube si
  // usamos un prefijo custom tipo `pc_${timestamp}`.
  const newCantoralId = () =>
    (crypto && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

  const handlePublish = async (targets: PublishTarget[]) => {
    // Un PublishedCantoral por destino (parroquia + fecha + horario), todos con los
    // MISMOS cantos del draft. Cada uno con su propio UUID para PDF/QR independientes.
    const now = new Date().toISOString();

    // Incluir el salmo del libro (canto "Salmo": antífona = letra + página del libro) para
    // que viaje al PDF y a la vista publicada. Solo si hay salmo y el draft no trae ya uno.
    const songsForPublish: Song[] = psalmSong && !cantoral.some((s) => s.category === 'Salmo')
      ? [...cantoral, psalmSong]
      : cantoral;

    const cantorals: PublishedCantoral[] = targets.map((t) => ({
      id: newCantoralId(),
      choirId: 'current_user',
      choirName: 'Mi Coro',
      parishName: t.parishName,
      date: t.date,
      liturgicalDate: t.liturgicalDate,
      massTime: t.massTime,
      massType: t.massType,
      vigil: t.vigil,
      createdAt: now,
      publishedBy: 'Mi Coro',
      publishedAt: now,
      songs: songsForPublish,
      status: 'published',
      garland: t.garland,
      pdfFont: t.pdfFont,
      pdfSize: t.pdfSize,
    }));

    // Delegate to App.handlePublishCantoral which:
    //   1. Inserts into Supabase (returns error if it fails)
    //   2. Shows toast.success only after DB confirms
    //   3. Generates PDF + uploads to Storage + shows QR dialog
    //   4. Refreshes the list
    // We deliberately do NOT show a toast here to avoid double toasts and to
    // avoid the bug where the toast appeared even when publish failed.
    await onPublishCantoral(cantorals);

    // Cerrar modal solo después del flujo completo
    setShowPublishModal(false);
  };

  return (
    <>
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-5 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        {/* Encabezado compacto del constructor: el hero de bienvenida sobra en la
            pantalla de trabajo del coro (publica cada semana). Mostramos parroquia
            para dar contexto y dejamos el foco en "Datos de la Misa". */}
        <div className="pt-14 pb-1 flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center shadow border-2 border-brand-border">
            <Music className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-brand-ink leading-tight">Armar cantoral</h1>
            <p className="text-sm text-brand-ink-soft truncate">{parishName}</p>
          </div>
        </div>

        {/* Datos de la Misa — al inicio: fecha + hora + tipo. Fijan la celebración/ciclo
            (cargan el salmo del libro) y pre-llenan el menú de publicación. */}
        <div className="mt-4 bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-blue-300/60 dark:border-blue-700/60 transition-colors">
          <h3 className="text-base font-bold text-brand-ink flex items-center gap-2 mb-3">
            <span className="text-xl flex-shrink-0">📅</span>
            <span>Datos de la Misa</span>
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="mass-date" className="text-xs font-bold text-brand-ink-soft mb-1 block">Fecha</label>
              <input
                id="mass-date"
                type="date"
                value={massDate}
                onChange={(e) => setMassDate(e.target.value || getTodayLocal())}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="mass-time" className="text-xs font-bold text-brand-ink-soft mb-1 block">Hora</label>
              <select
                id="mass-time"
                value={massTime}
                onChange={(e) => setMassTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand"
              >
                {MASS_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{to12h(t)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="mass-type" className="text-xs font-bold text-brand-ink-soft mb-1 block">Tipo de Misa</label>
            <select
              id="mass-type"
              value={massType}
              onChange={(e) => setMassType(e.target.value as MassType)}
              className="w-full px-3 py-2.5 rounded-xl border-2 border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-brand-ink font-semibold focus:outline-none focus:border-brand"
            >
              <option value="dia">Misa del día</option>
              <option value="visperas_i">I Vísperas (sábado por la tarde)</option>
              <option value="visperas_ii">II Vísperas (domingo por la tarde)</option>
            </select>
          </div>
          <p className="text-sm text-brand-ink-soft mt-3">
            {massCelebration
              ? <>{formatYmdForDisplay(massDate, { weekday: 'long', day: 'numeric', month: 'long' })} · <strong className="text-brand-ink">{massCelebration}</strong> · Año {massCycle}</>
              : <>{formatYmdForDisplay(massDate, { weekday: 'long', day: 'numeric', month: 'long' })} — esta fecha no tiene una celebración en el calendario.</>}
          </p>
          {!massCelebration && (
            <button
              onClick={() => setShowAddSolemnity(true)}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-purple-800 dark:text-purple-200 active:opacity-70"
            >
              <span className="text-base">➕</span> Agregar celebración para esta fecha
            </button>
          )}
        </div>

        {/* Modo Atril — leer el repertorio durante la Misa */}
        {cantoral.length > 0 && (
          <button
            onClick={() => setShowAtril(true)}
            data-tour="coro-atril"
            className="w-full mt-4 bg-gradient-to-br from-slate-800 to-slate-950 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-slate-700 font-bold"
          >
            <Music className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
            <span>Modo Atril</span>
          </button>
        )}

        {/* Selector de celebración — el constructor se adapta a la liturgia elegida.
            En Cuaresma/Semana Santa aparecen los oficios del Triduo para prepararlos. */}
        {celebrations.length > 1 && (
          <div data-tour="coro-celebracion" className="mt-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-purple-300/60 dark:border-purple-700/60 transition-colors">
            <h3 className="text-base font-bold text-purple-950 dark:text-purple-100 mb-1 flex items-center gap-2">
              <span className="text-xl flex-shrink-0">📅</span>
              <span className="min-w-0">¿Para qué celebración armas el cantoral?</span>
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              El orden de la Misa y los cantos se ajustan a la liturgia que elijas.
            </p>
            <div className="flex flex-wrap gap-2">
              {celebrations.map((c) => {
                const active = c.key === selectedCelebration;
                return (
                  <button
                    key={c.key}
                    onClick={() => {
                      setSelectedCelebration(c.key);
                      setExpandedCategories({});
                      setPenitentialChoice(null);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                      active
                        ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white border-purple-800 shadow-lg'
                        : 'bg-white/70 dark:bg-white/10 text-purple-900 dark:text-purple-100 border-purple-300 dark:border-purple-700 hover:bg-white dark:hover:bg-white/20'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Liturgical Suggestions */}
        <div className="mt-4" data-tour="coro-sugerencias">
          <LiturgicalSuggestions
            onAddToCantoral={onAddToCantoral}
            onPlaySong={onPlaySong}
            cantoral={cantoral}
            preferredInstrument={preferredInstrument}
          />
        </div>

        {/* Info about preferred instrument */}
        {preferredInstrument && (
          <div className="mt-6 bg-white/30 backdrop-blur-sm border-2 border-white/40 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">
                {preferredInstrument === 'Guitarra' && '🎶'}
                {preferredInstrument === 'Órgano' && '🎹'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-brand-ink mb-1">Instrumento: {preferredInstrument}</h3>
                <p className="text-base text-brand-ink-soft">
                  Solo se muestran cantos con versión de {preferredInstrument}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de Cuaresma */}
        {gospelAcclamationName === 'Aclamación al Evangelio' && (
          <div className="mt-6 bg-purple-100/60 dark:bg-purple-900/30 backdrop-blur-sm border-2 border-purple-400/50 dark:border-purple-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">📿</div>
              <div>
                <h3 className="text-lg font-bold text-purple-950 dark:text-purple-100 mb-1">Tiempo de Cuaresma</h3>
                <p className="text-base text-purple-900 dark:text-purple-200">
                  Durante la Cuaresma, el Aleluya es omitido y se canta una Aclamación al Evangelio
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso de Día Litúrgico Especial */}
        {specialDay && categoryConfig.notes.length > 0 && (
          <div className="mt-6 bg-amber-100/60 dark:bg-amber-900/30 backdrop-blur-sm border-2 border-amber-400/50 dark:border-amber-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-3xl">{specialDayEmoji}</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-950 dark:text-amber-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {specialDayName}
                </h3>
                <div className="space-y-1">
                  {categoryConfig.notes.map((note, index) => (
                    <p key={index} className="text-sm text-amber-900 dark:text-amber-200">
                      • {note}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vigilia Pascual — número de lecturas del Antiguo Testamento */}
        {isVigil && (
          <div className="mt-6 bg-indigo-100/60 dark:bg-indigo-900/30 backdrop-blur-sm border-2 border-indigo-400/50 dark:border-indigo-600/50 rounded-xl p-4 transition-colors">
            <div className="flex gap-3">
              <div className="text-2xl">📖</div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-indigo-950 dark:text-indigo-100 mb-1">
                  Lecturas del Antiguo Testamento
                </h3>
                <p className="text-sm text-indigo-900 dark:text-indigo-200 mb-3">
                  El Misal prevé 7 lecturas con su salmo. Por razones pastorales se pueden reducir;
                  la del Éxodo (paso del Mar Rojo) nunca se omite.
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Número de lecturas del Antiguo Testamento">
                  {[3, 4, 5, 6, 7].map((n) => {
                    const active = n === atReadings;
                    return (
                      <button
                        key={n}
                        onClick={() => handleChangeAtReadings(n)}
                        aria-pressed={active}
                        className={`min-w-[3rem] px-4 py-2.5 rounded-xl font-bold text-base border-2 transition-all active:scale-95 ${
                          active
                            ? 'bg-gradient-to-br from-brand to-brand-strong text-white border-brand-border shadow-lg'
                            : 'bg-white/70 dark:bg-white/10 text-indigo-950 dark:text-indigo-100 border-indigo-300/60 dark:border-indigo-600/40 hover:bg-white'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Searches - DINÁMICAS según el día litúrgico */}
        <div className="mt-8 space-y-6" data-tour="coro-categorias">
          {visibleCategories.map((rawCategory) => {
            // En Pascua, el Kyrie puede convertirse en el Rito de Aspersión según
            // lo que elija el coro (se le pregunta al tocar el Kyrie).
            const afterPenitential = (isEaster && rawCategory === 'Kyrie' && penitentialChoice === 'aspersion')
              ? 'Rito de Aspersión'
              : rawCategory;
            // En Cuaresma el Aleluya se omite y la tarjeta pasa a llamarse
            // "Aclamación al Evangelio". Solo cambia el rótulo: el canto sigue
            // perteneciendo al momento 'aleluya' de la BD.
            const category = displayCategoryForDate(afterPenitential, massDateObj);
            // Obtener el ícono según la categoría
            const getCategoryIcon = (cat: string): string => {
              const icons: Record<string, string> = {
                'Entrada': '⛪',
                'Kyrie': '🙏',
                'Rito de Aspersión': '💧',
                'Gloria': '✨',
                'Salmo': '📖',
                'Aleluya': '🎺',
                'Aclamación al Evangelio': '📯',
                'Post Evangelio': '📿',
                'Ofertorio': '🍇',
                'Santo': '✝️',
                'Cordero de Dios': '🐑',
                'Comunión': '🫓',
                'Salida': '⛪',
                // Categorías especiales
                'Exposición y Procesión': '🕯️',
                'Pregón Pascual': '🕯️',
                'Salmo AT 1': '📜',
                'Salmo AT 2': '📜',
                'Salmo AT 3': '📜',
                'Salmo AT 4': '📜',
                'Salmo AT 5': '📜',
                'Salmo AT 6': '📜',
                'Salmo AT 7': '📜',
                'Salmo Epistolar': '📖',
                'Aleluya Triple': '🎺',
                'Secuencia de Pascua': '🌅',
                'Secuencia de Pentecostés': '🔥',
                'Secuencia de Corpus': '🍞',
                'Kalenda Navideña': '⭐',
              };
              return icons[cat] || '🎵';
            };

            const icon = getCategoryIcon(category);

            // Al tocar el Kyrie en Pascua, preguntar primero: acto penitencial o aspersión.
            const askFirst = isEaster && rawCategory === 'Kyrie' && penitentialChoice === null;

            // El Salmo NO se elige del catálogo: viene del libro musicalizado según la
            // fecha (partitura para el coro + antífona editable). Reemplaza a la tarjeta.
            if (category === 'Salmo') {
              return (
                <div key={rawCategory}>
                  <PsalmFromBook
                    date={massDate}
                    role="Coro"
                    antiphon={psalmAntiphon}
                    onAntiphonChange={setPsalmAntiphon}
                    editable
                    hideScore
                  />
                </div>
              );
            }

            return (
              <CategorySearch
                key={rawCategory}
                category={category}
                icon={icon}
                isExpanded={expandedCategories[category] || false}
                onToggle={askFirst ? () => setShowAspersionDialog(true) : () => handleToggleCategory(category)}
                onClose={() => handleCloseCategory(category)}
                onAddToCantoral={onAddToCantoral}
                onRemoveFromCantoral={onRemoveFromCantoral}
                cantoral={cantoral}
                onPlaySong={onPlaySong}
                preferredInstrument={preferredInstrument}
                previousUsage={previousUsage}
                massDate={massDate}
              />
            );
          })}
        </div>

        {/* Spacer so the last category isn't covered by the sticky CTA (que en
            móvil/tablet va por encima de la BottomNav → necesita más aire). */}
        {cantoral.length > 0 && <div aria-hidden className="h-40 lg:h-28" />}
      </div>

      {/* Sticky Publish CTA — always visible at the bottom of the viewport
          while there is at least one song in the draft. Respects iOS safe area. */}
      {cantoral.length > 0 && (
        <div
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-amber-100 via-amber-100/95 to-amber-100/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0 px-3 sm:px-4 pt-6 pb-3 lg:pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
        >
          <div className="max-w-md md:max-w-2xl mx-auto">
            <button
              onClick={() => setShowPublishModal(true)}
              data-tour="coro-publicar"
              className="w-full bg-gradient-to-br from-brand to-brand-strong text-white py-4 px-3 sm:px-4 rounded-2xl shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 border-2 border-brand-border"
            >
              <Send className="w-6 h-6 flex-shrink-0" />
              <span className="text-base sm:text-lg font-bold min-w-0 leading-tight text-center break-words">
                Publicar Cantoral · {cantoral.length} {cantoral.length === 1 ? 'canto' : 'cantos'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <PublishCantoralModal
          cantoral={cantoral}
          parishName={parishName}
          parishes={parishes}
          isAdmin={isAdmin}
          initialDate={massDate}
          initialMassTime={to12h(massTime)}
          initialMassType={massType}
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          userInstruments={userInstruments}
        />
      )}

      {/* Modo Atril */}
      {showAtril && (
        <AtrilMode
          songs={psalmSong && !cantoral.some((s) => s.category === 'Salmo') ? [...cantoral, psalmSong] : cantoral}
          userRole="Coro"
          userInstrument={selectedInstrumentForMass}
          onClose={() => setShowAtril(false)}
        />
      )}

      {/* Agregar celebración para una fecha sin celebración en el calendario */}
      {showAddSolemnity && (
        <AddSolemnityModal
          selectedDate={massDate}
          isAdmin={isAdmin}
          parishes={parishes}
          onClose={() => setShowAddSolemnity(false)}
          onAdd={async (name, date, scope, type) => {
            setShowAddSolemnity(false);
            const r = await addCustomLiturgicalDate({ name, date, type, scope });
            if (r.ok && r.row) {
              setPersistedCustomDates([...getPersistedCustomDates(), toLiturgicalDate(r.row)]);
              toast.success('Celebración agregada', { description: name });
            } else {
              toast.warning('No se pudo guardar la celebración', { description: r.error });
            }
            setCelebTick((t) => t + 1);
          }}
        />
      )}

      {/* Tip contextual del constructor (F4) */}
      {showConstructorTip && !showAtril && (
        <Tour
          steps={constructorTips}
          onClose={() => { markTipSeen('constructor'); setShowConstructorTip(false); }}
        />
      )}

      {/* Select Instrument Modal */}
      {showInstrumentModal && (
        <SelectInstrumentModal
          userInstruments={userInstruments}
          selectedInstrument={selectedInstrumentForMass}
          onClose={() => setShowInstrumentModal(false)}
          onSelect={handleSelectInstrument}
        />
      )}

      {/* Pregunta de Pascua: acto penitencial vs rito de aspersión (IGMR 51) */}
      <Modal
        open={showAspersionDialog}
        onClose={() => setShowAspersionDialog(false)}
        labelledById="aspersion-title"
        panelClassName="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-sky-700 dark:border-sky-600"
      >
        <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white p-6 border-b-4 border-sky-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl flex-shrink-0">💧</span>
            <div className="min-w-0">
              <h3 id="aspersion-title" className="text-xl font-bold leading-tight">Tiempo Pascual</h3>
              <p className="text-sm text-sky-100 mt-1">¿Cómo será el inicio de la Misa?</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-base text-blue-950 dark:text-blue-100 mb-2 leading-relaxed">
            En Pascua puede hacerse el <strong>Rito de Aspersión</strong> en lugar del acto
            penitencial. Eso cambia el canto de este momento (y se omite el Kyrie).
          </p>
          <button
            onClick={() => handleChoosePenitential('kyrie')}
            className="w-full bg-white dark:bg-slate-700 text-brand-ink p-4 rounded-2xl flex items-center gap-3 border-2 border-blue-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-left"
          >
            <span className="text-2xl flex-shrink-0">🙏</span>
            <span className="min-w-0">
              <span className="block font-bold">Acto penitencial (Kyrie)</span>
              <span className="block text-sm text-blue-700 dark:text-blue-300">Señor, ten piedad</span>
            </span>
          </button>
          <button
            onClick={() => handleChoosePenitential('aspersion')}
            className="w-full bg-gradient-to-br from-sky-600 to-blue-700 text-white p-4 rounded-2xl flex items-center gap-3 border-2 border-sky-800 hover:opacity-90 active:scale-95 transition-all text-left"
          >
            <span className="text-2xl flex-shrink-0">💧</span>
            <span className="min-w-0">
              <span className="block font-bold">Rito de aspersión</span>
              <span className="block text-sm text-sky-100">Canto de aspersión (memoria del Bautismo)</span>
            </span>
          </button>
        </div>
      </Modal>
    </>
  );
}