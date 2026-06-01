import { useState, useEffect } from 'react';
import { Send, AlertCircle, Sparkles, Loader } from 'lucide-react';
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
import { useGeminiSuggestions } from '../hooks/useGeminiSuggestions';
import { useSongs } from '../hooks/useSongs';

interface ChoirViewProps {
  preferredInstrument: InstrumentType;
  userInstruments?: InstrumentType[]; // Array de todos los instrumentos que el usuario puede usar
  parishName: string;
  cantoral: Song[];
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  onPlaySong: (song: Song) => void;
  onPublishCantoral: (cantoral: PublishedCantoral) => void;
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
  const [showGeminiPanel, setShowGeminiPanel] = useState(false);
  const { getSuggestions, loading: geminiLoading, result: geminiResult, error: geminiError } = useGeminiSuggestions();
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

  const handlePublish = (date: string, liturgicalDate: string, massTime: string) => {
    const newCantoral: PublishedCantoral = {
      id: `pc_${Date.now()}`,
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
      status: 'published', // ✅ Marcar como publicado para que Pueblo Fiel lo vea
    };
    
    onPublishCantoral(newCantoral);
    toast.success('¡Cantoral publicado exitosamente! Los fieles recibirán una notificación.', {
      duration: 5000,
      description: `${liturgicalDate} - ${massTime}`
    });
    
    // Cerrar modal
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

        {/* Sugerencias con IA (Gemini) */}
        <div className="mt-2">
          <button
            onClick={() => { setShowGeminiPanel(v => !v); if (!showGeminiPanel) getSuggestions(allSongs, currentSeason, specialDayName || undefined); }}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg border-2 border-purple-600 text-sm sm:text-base font-bold"
          >
            {geminiLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {geminiLoading ? 'Consultando IA...' : '✨ Sugerir cantos con IA'}
          </button>

          {showGeminiPanel && (
            <div className="mt-3 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-purple-300 dark:border-purple-700 p-3 sm:p-4">
              {geminiError && (
                <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="font-bold mb-1">Error al conectar con Gemini</p>
                  <p>{geminiError}</p>
                </div>
              )}

              {geminiResult && (
                <>
                  {geminiResult.consejo && (
                    <div className="mb-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                      <p className="text-xs font-bold text-purple-700 dark:text-purple-300 mb-1">💡 Consejo litúrgico</p>
                      <p className="text-sm text-purple-900 dark:text-purple-100">{geminiResult.consejo}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {geminiResult.sugerencias.map((s, i) => {
                      const song = allSongs.find(song => song.title.toLowerCase() === s.titulo.toLowerCase());
                      return (
                        <div key={i} className="bg-white/60 dark:bg-white/10 rounded-xl p-3 border border-purple-200 dark:border-purple-700">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">{s.categoria}</span>
                              <p className="text-sm font-bold text-blue-950 dark:text-white truncate">{s.titulo}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.razon}</p>
                            </div>
                            {song && (
                              <button
                                onClick={() => { onAddToCantoral(song); toast.success(`${song.title} agregado al cantoral`); }}
                                className="flex-shrink-0 bg-purple-600 text-white text-xs px-2 py-1.5 rounded-lg font-bold active:scale-95 transition-all"
                              >
                                + Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => getSuggestions(allSongs, currentSeason, specialDayName || undefined)}
                    className="mt-3 w-full text-xs text-purple-600 dark:text-purple-400 py-2 border border-purple-300 dark:border-purple-600 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                  >
                    🔄 Generar nuevas sugerencias
                  </button>
                </>
              )}
            </div>
          )}
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
                'Aleluya': ' труба',
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
                'Aleluya Triple': ' труба',
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

        {/* Publish Button al final (evitar scroll innecesario) */}
        {cantoral.length > 0 && (
          <div className="mt-8 mb-6">
            <button
              onClick={() => setShowPublishModal(true)}
              className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white py-4 px-3 sm:px-4 rounded-2xl shadow-xl hover:shadow-2xl active:scale-98 transition-all flex items-center justify-center gap-3 border-2 border-blue-800"
            >
              <Send className="w-6 h-6" />
              <span className="text-xl font-bold">Publicar Cantoral para los Fieles</span>
            </button>
          </div>
        )}
      </div>

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