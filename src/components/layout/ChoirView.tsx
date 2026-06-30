import { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Home } from './Home';
import { CategorySearch } from '../songs/CategorySearch';
import { PublishCantoralModal, PublishTarget } from '../cantoral/PublishCantoralModal';
import { LiturgicalSuggestions } from '../liturgy/LiturgicalSuggestions';
import { SelectInstrumentModal } from '../cantoral/SelectInstrumentModal';
import { AtrilMode } from '../atril/AtrilMode';
import { Tour } from '../tour/Tour';
import { constructorTips, hasSeenTip, markTipSeen } from '../tour/tours';
import { Song, InstrumentType, PublishedCantoral } from '../../types';
import { getGospelAcclamationName, getGospelAcclamationIcon, getCurrentLiturgicalSeason } from '../../utils/liturgicalSeason';
import { getSpecialLiturgicalDay, getCategoriesForSpecialDay, getSpecialDayName, getSpecialDayEmoji, getBuildableCelebrations, SpecialLiturgicalDay } from '../../utils/specialLiturgicalDays';
import { useSongs } from '../../hooks/useSongs';

interface ChoirViewProps {
  preferredInstrument: InstrumentType;
  userInstruments?: InstrumentType[]; // Array de todos los instrumentos que el usuario puede usar
  parishName: string;
  parishes?: string[]; // Conjunto completo de parroquias del coro (para publicar a varias)
  cantoral: Song[];
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onPublishCantoral: (cantorals: PublishedCantoral[]) => Promise<void> | void;
}

export function ChoirView({
  preferredInstrument,
  userInstruments,
  parishName,
  parishes,
  cantoral,
  onAddToCantoral,
  onRemoveFromCantoral,
  onPlaySong,
  onPublishCantoral,
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
  // Tip contextual del constructor (F4): 1ª vez que se abre una categoría.
  const [showConstructorTip, setShowConstructorTip] = useState(false);
  const { songs: allSongs } = useSongs();
  const currentSeason = getCurrentLiturgicalSeason();

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

  // La aspersión aplica en tiempo pascual; si se está preparando la Vigilia o el
  // Domingo de Resurrección, también (aunque hoy aún sea Cuaresma).
  const isEaster = currentSeason === 'Pascua'
    || selectedCelebration === 'DomingoResurreccion'
    || selectedCelebration === 'VigiliaPascual';

  // Obtener el nombre dinámico del Aleluya (cambia en Cuaresma)
  const gospelAcclamationName = getGospelAcclamationName();
  const gospelAcclamationIcon = getGospelAcclamationIcon();

  // Día litúrgico especial = la celebración elegida en el constructor.
  const specialDayName = getSpecialDayName(specialDay);
  const specialDayEmoji = getSpecialDayEmoji(specialDay);
  const categoryConfig = getCategoriesForSpecialDay(specialDay);

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
    toast.success(`Instrumento seleccionado: ${instrument}`, {
      description: 'Los cantos se filtrarán para este instrumento'
    });
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
      songs: cantoral,
      status: 'published',
      garland: t.garland,
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
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        <Home />

        {/* Modo Atril — leer el repertorio durante la Misa */}
        {cantoral.length > 0 && (
          <button
            onClick={() => setShowAtril(true)}
            data-tour="coro-atril"
            className="w-full mt-4 bg-gradient-to-br from-slate-800 to-slate-950 text-white py-3 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-slate-700 font-bold"
          >
            🎼 <span>Modo Atril</span>
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
        <div className="mt-2" data-tour="coro-sugerencias">
          <LiturgicalSuggestions
            onAddToCantoral={onAddToCantoral}
            onPlaySong={onPlaySong}
            cantoral={cantoral}
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
                <h3 className="text-lg font-bold text-blue-950 dark:text-white mb-1">Instrumento: {preferredInstrument}</h3>
                <p className="text-base text-blue-900 dark:text-blue-100">
                  Los cantos con {preferredInstrument} aparecen primero en las búsquedas
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

        {/* Category Searches - DINÁMICAS según el día litúrgico */}
        <div className="mt-8 space-y-6" data-tour="coro-categorias">
          {categoryConfig.categories.map((rawCategory) => {
            // En Pascua, el Kyrie puede convertirse en el Rito de Aspersión según
            // lo que elija el coro (se le pregunta al tocar el Kyrie).
            const category = (isEaster && rawCategory === 'Kyrie' && penitentialChoice === 'aspersion')
              ? 'Rito de Aspersión'
              : rawCategory;
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
              />
            );
          })}
        </div>

        {/* Spacer so the last category isn't covered by the sticky CTA */}
        {cantoral.length > 0 && <div aria-hidden className="h-24" />}
      </div>

      {/* Sticky Publish CTA — always visible at the bottom of the viewport
          while there is at least one song in the draft. Respects iOS safe area. */}
      {cantoral.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-amber-100 via-amber-100/95 to-amber-100/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0 px-3 sm:px-4 pt-6"
          style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-md md:max-w-2xl mx-auto">
            <button
              onClick={() => setShowPublishModal(true)}
              data-tour="coro-publicar"
              className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white py-4 px-3 sm:px-4 rounded-2xl shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 border-2 border-blue-800"
            >
              <Send className="w-6 h-6 flex-shrink-0" />
              <span className="text-base sm:text-lg font-bold min-w-0 leading-tight">
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
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          userInstruments={userInstruments}
        />
      )}

      {/* Modo Atril */}
      {showAtril && (
        <AtrilMode
          songs={cantoral}
          userRole="Coro"
          userInstrument={selectedInstrumentForMass}
          onClose={() => setShowAtril(false)}
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
      {showAspersionDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAspersionDialog(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-sky-700 dark:border-sky-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-sky-600 to-blue-700 text-white p-6 border-b-4 border-sky-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl flex-shrink-0">💧</span>
                <div className="min-w-0">
                  <h3 className="text-xl font-bold leading-tight">Tiempo Pascual</h3>
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
                className="w-full bg-white dark:bg-slate-700 text-blue-950 dark:text-white p-4 rounded-2xl flex items-center gap-3 border-2 border-blue-300 dark:border-slate-600 hover:bg-blue-50 dark:hover:bg-slate-600 active:scale-95 transition-all text-left"
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
          </div>
        </div>
      )}
    </>
  );
}