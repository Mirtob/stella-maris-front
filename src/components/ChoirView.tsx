import { useState, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Home } from './Home';
import { CategorySearch } from './CategorySearch';
import { CantoralPreview } from './CantoralPreview';
import { PublishCantoralModal } from './PublishCantoralModal';
import { LiturgicalSuggestions } from './LiturgicalSuggestions';
import { SelectInstrumentModal } from './SelectInstrumentModal';
import { Song, InstrumentType, PublishedCantoral } from '../types';
import { getGospelAcclamationName, getGospelAcclamationIcon, getCurrentLiturgicalSeason } from '../utils/liturgicalSeason';
import { getSpecialLiturgicalDay, getCategoriesForSpecialDay, getSpecialDayName, getSpecialDayEmoji } from '../utils/specialLiturgicalDays';
import { useSongs } from '../hooks/useSongs';

interface ChoirViewProps {
  preferredInstrument: InstrumentType;
  userInstruments?: InstrumentType[]; // Array de todos los instrumentos que el usuario puede usar
  parishName: string;
  cantoral: Song[];
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onPublishCantoral: (cantoral: PublishedCantoral) => Promise<void> | void;
}

export function ChoirView({
  preferredInstrument,
  userInstruments,
  parishName,
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
  const { songs: allSongs } = useSongs();
  const currentSeason = getCurrentLiturgicalSeason();

  // Obtener el nombre dinámico del Aleluya (cambia en Cuaresma)
  const gospelAcclamationName = getGospelAcclamationName();
  const gospelAcclamationIcon = getGospelAcclamationIcon();

  // **NUEVO: Detectar día litúrgico especial**
  const specialDay = getSpecialLiturgicalDay();
  const specialDayName = getSpecialDayName(specialDay);
  const specialDayEmoji = getSpecialDayEmoji(specialDay);
  const categoryConfig = getCategoriesForSpecialDay(specialDay);

  // Mostrar modal de selección de instrumento siempre al inicio
  useEffect(() => {
    if (userInstruments && userInstruments.length > 0 && cantoral.length === 0) {
      setShowInstrumentModal(true);
    }
  }, [userInstruments]);

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

  const handlePublish = async (date: string, liturgicalDate: string, massTime: string) => {
    // ID must be a real UUID — the Supabase Storage policy `is_cantoral_pdf_owner`
    // rejects any object name that doesn't match the UUID v4 shape, so the PDF
    // upload silently fails if we use a custom `pc_${timestamp}` prefix.
    const id = (crypto && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      // Fallback for very old browsers — generates a v4-shaped string
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });

    const newCantoral: PublishedCantoral = {
      id,
      choirId: 'current_user',
      choirName: 'Mi Coro',
      parishName: parishName,
      date: date,
      liturgicalDate: liturgicalDate,
      massTime: massTime,
      createdAt: new Date().toISOString(),
      publishedBy: 'Mi Coro',
      publishedAt: new Date().toISOString(),
      songs: cantoral,
      status: 'published',
    };

    // Delegate to App.handlePublishCantoral which:
    //   1. Inserts into Supabase (returns error if it fails)
    //   2. Shows toast.success only after DB confirms
    //   3. Generates PDF + uploads to Storage + shows QR dialog
    //   4. Refreshes the list
    // We deliberately do NOT show a toast here to avoid double toasts and to
    // avoid the bug where the toast appeared even when publish failed.
    await onPublishCantoral(newCantoral);

    // Cerrar modal solo después del flujo completo
    setShowPublishModal(false);
  };

  return (
    <>
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        <Home />

        {/* Cantoral Preview */}
        <CantoralPreview
          cantoral={cantoral}
          onRemove={onRemoveFromCantoral}
          onPlaySong={onPlaySong}
        />

        {/* Liturgical Suggestions */}
        <div className="mt-2">
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
        <div className="mt-8 space-y-6">
          {categoryConfig.categories.map((category) => {
            // Obtener el ícono según la categoría
            const getCategoryIcon = (cat: string): string => {
              const icons: Record<string, string> = {
                'Entrada': '⛪',
                'Kyrie': '🙏',
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

            return (
              <CategorySearch
                key={category}
                category={category}
                icon={icon}
                isExpanded={expandedCategories[category] || false}
                onToggle={() => handleToggleCategory(category)}
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
              className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white py-4 px-3 sm:px-4 rounded-2xl shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 border-2 border-blue-800"
            >
              <Send className="w-6 h-6" />
              <span className="text-base sm:text-lg font-bold">
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
          onClose={() => setShowPublishModal(false)}
          onPublish={handlePublish}
          userInstruments={userInstruments}
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
    </>
  );
}