import { useState } from 'react';
import { ArrowLeft, Play, ChevronDown, ChevronUp, X, Music, FileText } from 'lucide-react';
import { PublishedCantoral, Song } from '../types';
import { massOrdinary, postureIcons, postureLabels, postureColors, MassSection } from '../data/massOrdinary';

interface CantoralWithOrdinaryProps {
  cantoral: PublishedCantoral;
  onBack: () => void;
  onPlaySong: (song: Song) => void;
}

export function CantoralWithOrdinary({ cantoral, onBack, onPlaySong }: CantoralWithOrdinaryProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const toggleSection = (id: string) => {
    if (expandedSections.includes(id)) {
      setExpandedSections(expandedSections.filter(s => s !== id));
    } else {
      setExpandedSections([...expandedSections, id]);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Encontrar canción por categoría
  const findSongByCategory = (category: string): Song | undefined => {
    return cantoral.songs.find(song => song.category === category);
  };

  // Renderizar sección de la misa
  const renderSection = (section: MassSection) => {
    const isExpanded = expandedSections.includes(section.id);

    // Si es una sección de canto, buscar el canto correspondiente
    if (section.type === 'song' && section.category) {
      const song = findSongByCategory(section.category);
      
      if (!song) {
        return null; // No renderizar si no hay canto para esta categoría
      }

      return (
        <div key={section.id} className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40 rounded-3xl p-6 border-4 border-purple-300 dark:border-purple-600 transition-colors">
          {/* Posture Indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`px-3 sm:px-4 py-3 rounded-2xl border-4 ${postureColors[section.posture]} font-bold text-xl`}>
              <span className="text-3xl mr-2">{postureIcons[section.posture]}</span>
              {postureLabels[section.posture]}
            </div>
          </div>

          {/* Song Title */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{section.icon}</span>
            <h3 className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-200">
              {section.title}
            </h3>
          </div>

          {/* Song Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border-4 border-purple-200 dark:border-purple-700 shadow-xl transition-colors">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedSong(song)}
                className="w-16 h-16 flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg"
              >
                <Music className="w-8 h-8" strokeWidth={2.5} />
              </button>
              <div className="flex-1 min-w-0">
                <h4 className="text-2xl sm:text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">
                  {song.title}
                </h4>
                <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
                  {song.artist || 'Artista desconocido'}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Si es una instrucción postural
    if (section.type === 'instruction') {
      return (
        <div key={section.id} className={`rounded-3xl p-6 border-4 ${section.color} transition-colors`}>
          <div className="flex items-center gap-4">
            <div className={`px-3 sm:px-4 py-3 rounded-2xl border-4 ${postureColors[section.posture]} font-bold text-xl sm:text-2xl`}>
              <span className="text-4xl mr-3">{postureIcons[section.posture]}</span>
              {postureLabels[section.posture]}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{section.icon}</span>
              <h3 className="text-2xl sm:text-lg sm:text-2xl font-bold">
                {section.title}
              </h3>
            </div>
          </div>
        </div>
      );
    }

    // Si es liturgia (textos)
    if (section.type === 'liturgy') {
      return (
        <div key={section.id} className={`rounded-3xl border-4 overflow-hidden ${section.color} transition-colors`}>
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full p-6 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{section.icon}</span>
                <h3 className="text-2xl sm:text-lg sm:text-2xl font-bold">
                  {section.title}
                </h3>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-10 h-10 flex-shrink-0" strokeWidth={2.5} />
              ) : (
                <ChevronDown className="w-10 h-10 flex-shrink-0" strokeWidth={2.5} />
              )}
            </div>
            
            {/* Posture Indicator */}
            <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl border-3 ${postureColors[section.posture]} font-bold text-lg`}>
              <span className="text-3xl">{postureIcons[section.posture]}</span>
              {postureLabels[section.posture]}
            </div>
          </button>

          {isExpanded && section.text && (
            <div className="px-3 sm:px-4 pb-6">
              <div className="bg-white/50 dark:bg-black/20 rounded-2xl p-3 sm:p-4 border-3 border-black/10 dark:border-white/10">
                <p className="text-lg sm:text-xl leading-relaxed whitespace-pre-line font-medium">
                  {section.text}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="max-w-5xl mx-auto pt-8 pb-24">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-3 bg-gradient-to-br from-blue-900 to-blue-950 text-white px-3 sm:px-4 py-4 rounded-2xl border-2 border-blue-800 hover:border-blue-600 transition-all shadow-lg text-xl font-bold"
        >
          <ArrowLeft className="w-7 h-7" strokeWidth={2.5} />
          Volver
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-3xl p-8 shadow-2xl mb-4 sm:mb-6 border-4 border-blue-800">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-2xl sm:text-3xl">⛪</span>
            <div>
              <h1 className="text-4xl sm:text-2xl sm:text-lg sm:text-base sm:text-lg font-bold mb-1">Santa Misa</h1>
              <h2 className="text-2xl sm:text-3xl opacity-90">{cantoral.parishName}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm border-2 border-white/30">
              <div className="text-base opacity-80 mb-1">📅 Fecha</div>
              <div className="text-lg font-bold capitalize">{formatDate(cantoral.date)}</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm border-2 border-white/30">
              <div className="text-base opacity-80 mb-1">📖 Celebración</div>
              <div className="text-lg font-bold">{cantoral.liturgicalDate}</div>
            </div>
            <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm border-2 border-white/30">
              <div className="text-base opacity-80 mb-1">🕐 Horario</div>
              <div className="text-lg font-bold">{cantoral.massTime}</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-3xl p-6 mb-8 transition-colors">
          <div className="flex gap-4">
            <div className="text-4xl">👨‍👩‍👧‍👦</div>
            <div>
              <h3 className="text-2xl sm:text-lg sm:text-2xl font-bold text-blue-950 dark:text-white mb-3">
                Guía para seguir la Misa
              </h3>
              <p className="text-lg sm:text-xl text-blue-900 dark:text-blue-100 leading-relaxed mb-4">
                Sigue esta guía paso a paso durante la celebración. Los íconos te indican cuándo estar <strong>de pie 🧍</strong>, <strong>sentado 🪑</strong> o <strong>de rodillas 🧎</strong>.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className={`px-5 py-3 rounded-xl border-3 ${postureColors['standing']} font-bold text-base`}>
                  🧍 De pie
                </div>
                <div className={`px-5 py-3 rounded-xl border-3 ${postureColors['sitting']} font-bold text-base`}>
                  🪑 Sentado
                </div>
                <div className={`px-5 py-3 rounded-xl border-3 ${postureColors['kneeling']} font-bold text-base`}>
                  🧎 De rodillas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mass Ordinary with Songs */}
        <div className="space-y-6">
          {massOrdinary.map(section => renderSection(section))}
        </div>

        {/* Footer */}
        <div className="mt-4 sm:mt-6 bg-gradient-to-br from-blue-900 to-blue-950 text-white border-4 border-blue-800 rounded-3xl p-8 text-center transition-colors">
          <div className="text-2xl sm:text-3xl mb-4">✝️</div>
          <h3 className="text-lg sm:text-2xl font-bold mb-3">
            ¡Demos gracias a Dios!
          </h3>
          <p className="text-xl opacity-90">
            {cantoral.choirName}
          </p>
        </div>
      </div>

      {/* Modal de Canto Seleccionado */}
      {selectedSong && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in duration-200"
            onClick={() => setSelectedSong(null)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900 dark:to-orange-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-4 border-blue-800 transition-colors">
              {/* Header del Modal */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 rounded-t-3xl border-b-4 border-blue-800 z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Music className="w-10 h-10" strokeWidth={2.5} />
                    <h2 className="text-lg sm:text-2xl font-bold">Detalles del Canto</h2>
                  </div>
                  <button
                    onClick={() => setSelectedSong(null)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-8 h-8" strokeWidth={2.5} />
                  </button>
                </div>
                <div className="bg-white/20 rounded-xl px-4 py-2 inline-block">
                  <span className="text-lg font-bold">{selectedSong.category}</span>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6 space-y-6">
                {/* Información del Canto */}
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-white/40 transition-colors">
                  <h3 className="text-lg sm:text-2xl font-bold text-blue-950 dark:text-white mb-2">
                    {selectedSong.title}
                  </h3>
                  <p className="text-xl text-blue-900 dark:text-blue-100 mb-4">
                    {selectedSong.artist || 'Artista desconocido'}
                  </p>
                  {selectedSong.duration && (
                    <div className="flex items-center gap-2 text-lg text-blue-900 dark:text-blue-100">
                      <span>⏱️</span>
                      <span>Duración: {selectedSong.duration}</span>
                    </div>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Reproducir Audio */}
                  <button
                    onClick={() => {
                      onPlaySong(selectedSong);
                      setSelectedSong(null);
                    }}
                    className="bg-gradient-to-br from-blue-900 to-blue-950 text-white p-6 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-lg border-2 border-blue-800"
                  >
                    <Play className="w-8 h-8" fill="currentColor" strokeWidth={2} />
                    <span className="text-2xl font-bold">Reproducir Audio</span>
                  </button>

                  {/* Ver Partitura */}
                  {selectedSong.sheetMusicUrl && (
                    <a
                      href={selectedSong.sheetMusicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-gradient-to-br from-blue-900 to-blue-950 text-white p-6 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-transform shadow-lg border-2 border-blue-800"
                    >
                      <FileText className="w-8 h-8" strokeWidth={2.5} />
                      <span className="text-2xl font-bold">Ver Partitura</span>
                    </a>
                  )}
                </div>

                {/* Instrucciones */}
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 border-2 border-white/40 transition-colors">
                  <div className="flex gap-3">
                    <span className="text-3xl">💡</span>
                    <div>
                      <h4 className="text-xl font-bold text-blue-950 dark:text-white mb-2">
                        Cómo usar
                      </h4>
                      <p className="text-lg text-blue-900 dark:text-blue-100">
                        Toca <strong>"Reproducir Audio"</strong> para escuchar el canto desde YouTube. 
                        {selectedSong.sheetMusicUrl && ' Toca "Ver Partitura" para ver la partitura en línea.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botón para Cerrar */}
                <button
                  onClick={() => setSelectedSong(null)}
                  className="w-full bg-gradient-to-br from-blue-900 to-blue-950 text-white p-5 rounded-2xl font-bold text-xl hover:border-blue-600 transition-all border-2 border-blue-800"
                >
                  Cerrar y Volver al Ordinario
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}