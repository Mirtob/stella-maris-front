import { useState } from 'react';
import { Music, Search, ChevronDown, ChevronUp, Play, Calendar, FileText } from 'lucide-react';
import { Song } from '../../types';
import { useSongs } from '../../hooks/useSongs';
import { LyricsWithChords } from './LyricsWithChords';
import { matchesSearch } from '../../utils/textSearch';

interface SheetMusicLibraryProps {
  onPlaySong: (song: Song) => void;
}

const MASS_PARTS = [
  { id: 'Entrada', name: 'Entrada', icon: '⛪' },
  { id: 'Kyrie', name: 'Kyrie', icon: '🙏' },
  { id: 'Gloria', name: 'Gloria', icon: '✨' },
  { id: 'Salmo', name: 'Salmo', icon: '📖' },
  { id: 'Aleluya', name: 'Aleluya', icon: '🎺' },
  { id: 'Post Evangelio', name: 'Post Evangelio', icon: '📿' },
  { id: 'Ofertorio', name: 'Ofertorio', icon: '🍇' },
  { id: 'Santo', name: 'Santo', icon: '✝️' },
  { id: 'Cordero de Dios', name: 'Cordero de Dios', icon: '🐑' },
  { id: 'Comunión', name: 'Comunión', icon: '🫓' },
  { id: 'Salida', name: 'Salida', icon: '⛪' },
];

const LITURGICAL_SEASONS = [
  { id: 'Adviento', name: 'Adviento', icon: '🕯️', color: 'purple' },
  { id: 'Navidad', name: 'Navidad', icon: '⭐', color: 'gold' },
  { id: 'Cuaresma', name: 'Cuaresma', icon: '✝️', color: 'purple' },
  { id: 'Pascua', name: 'Pascua', icon: '🌅', color: 'white' },
  { id: 'Ordinario', name: 'Tiempo Ordinario', icon: '🌿', color: 'green' },
  { id: 'Todas las temporadas', name: 'Todas las temporadas', icon: '🎵', color: 'blue' },
];

const NON_LITURGICAL_CATEGORIES = [
  { id: 'Adoración', name: 'Adoración Eucarística', icon: '✨' },
  { id: 'Procesión', name: 'Procesiones', icon: '🕯️' },
  { id: 'Mariano', name: 'Cantos Marianos', icon: '🌹' },
  { id: 'Reflexión', name: 'Reflexión y Meditación', icon: '🙏' },
  { id: 'Evangelización', name: 'Evangelización', icon: '📖' },
  { id: 'Otro', name: 'Otros', icon: '🎶' },
];

export function SheetMusicLibrary({ onPlaySong }: SheetMusicLibraryProps) {
  const { songs } = useSongs();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPart, setExpandedPart] = useState<string | null>(null);
  const [expandedSeasons, setExpandedSeasons] = useState<Record<string, string | null>>({});
  const [expandedNonLiturgical, setExpandedNonLiturgical] = useState<string | null>(null);
  const [expandedLyrics, setExpandedLyrics] = useState<string | null>(null);

  // Agrupar cantos por parte de la Misa
  const getSongsByPart = (part: string): Song[] => {
    return songs.filter(song => song.category === part && song.isLiturgical !== false);
  };

  // Obtener cantos no litúrgicos
  const getNonLiturgicalSongs = (): Song[] => {
    return songs.filter(song => song.isLiturgical === false);
  };

  // Agrupar cantos no litúrgicos por categoría
  const groupNonLiturgicalByCategory = (songs: Song[]): Record<string, Song[]> => {
    const grouped: Record<string, Song[]> = {};
    
    NON_LITURGICAL_CATEGORIES.forEach(category => {
      grouped[category.id] = [];
    });

    songs.forEach(song => {
      // Usar nonLiturgicalCategory si existe, sino poner en "Otro"
      const categoryId = song.nonLiturgicalCategory || 'Otro';
      if (grouped[categoryId]) {
        grouped[categoryId].push(song);
      } else {
        grouped['Otro'].push(song);
      }
    });

    return grouped;
  };

  // Agrupar cantos de una parte por tiempo litúrgico
  const groupByLiturgicalSeason = (songs: Song[]): Record<string, Song[]> => {
    const grouped: Record<string, Song[]> = {};
    
    LITURGICAL_SEASONS.forEach(season => {
      grouped[season.id] = [];
    });

    songs.forEach(song => {
      // Si el canto tiene liturgicalSeason definido
      if (song.liturgicalSeason) {
        const seasons = song.liturgicalSeason.split(',').map(s => s.trim());
        seasons.forEach(season => {
          if (grouped[season]) {
            grouped[season].push(song);
          }
        });
      } else {
        // Si no tiene, ponerlo en "Todas las temporadas"
        grouped['Todas las temporadas'].push(song);
      }
    });

    return grouped;
  };

  const filteredParts = MASS_PARTS.filter(part => {
    const songs = getSongsByPart(part.id);
    if (songs.length === 0) return false;
    if (!searchTerm) return true;
    return songs.some(song =>
      matchesSearch(song.title, searchTerm) ||
      matchesSearch(song.artist, searchTerm) ||
      matchesSearch(song.author, searchTerm)
    );
  });

  const handleTogglePart = (partId: string) => {
    if (expandedPart === partId) {
      setExpandedPart(null);
      setExpandedSeasons({});
    } else {
      setExpandedPart(partId);
      setExpandedSeasons({});
    }
  };

  const handleToggleSeason = (partId: string, seasonId: string) => {
    setExpandedSeasons(prev => ({
      ...prev,
      [partId]: prev[partId] === seasonId ? null : seasonId
    }));
  };

  const handleToggleNonLiturgical = (categoryId: string) => {
    if (expandedNonLiturgical === categoryId) {
      setExpandedNonLiturgical(null);
    } else {
      setExpandedNonLiturgical(categoryId);
    }
  };

  const handleToggleLyrics = (songId: string) => {
    if (expandedLyrics === songId) {
      setExpandedLyrics(null);
    } else {
      setExpandedLyrics(songId);
    }
  };

  const filterSongsBySearch = (songs: Song[]): Song[] => {
    if (!searchTerm) return songs;
    return songs.filter(song =>
      matchesSearch(song.title, searchTerm) ||
      matchesSearch(song.artist, searchTerm) ||
      matchesSearch(song.author, searchTerm)
    );
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-slate-900 dark:via-purple-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center shadow-lg border-4 border-purple-500">
              <Music className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-900 dark:text-purple-200 mb-4 leading-tight">
            Banco de Partituras
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-purple-700 dark:text-purple-300">
            Organizados por partes de la Misa y tiempo litúrgico
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-purple-700 dark:text-purple-400" />
          <input
            type="text"
            placeholder="Buscar cantos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-4 text-lg rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-white dark:bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-400/30 focus:border-purple-600 dark:focus:border-purple-400 placeholder-purple-600/50 dark:placeholder-purple-400/50 transition-all"
          />
        </div>

        {/* Mass Parts List */}
        <div className="space-y-4">
          {filteredParts.map(part => {
            const songs = getSongsByPart(part.id);
            const groupedSeasons = groupByLiturgicalSeason(songs);
            const isExpanded = expandedPart === part.id;

            return (
              <div
                key={part.id}
                className="bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/60 dark:border-white/20 overflow-hidden transition-all hover:shadow-xl"
              >
                {/* Part Header */}
                <button
                  onClick={() => handleTogglePart(part.id)}
                  className="w-full bg-gradient-to-br from-purple-600 to-purple-800 text-white p-5 flex items-center justify-between active:opacity-90 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{part.icon}</span>
                    <div className="text-left">
                      <div className="text-2xl font-bold">{part.name}</div>
                      <div className="text-base opacity-90">
                        {songs.length} {songs.length === 1 ? 'canto' : 'cantos'}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-7 h-7" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown className="w-7 h-7" strokeWidth={2.5} />
                  )}
                </button>

                {/* Expanded Content: Liturgical Seasons */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white/20 dark:bg-white/5">
                    {LITURGICAL_SEASONS.map(season => {
                      const seasonSongs = filterSongsBySearch(groupedSeasons[season.id] || []);
                      if (seasonSongs.length === 0) return null;

                      const isSeasonExpanded = expandedSeasons[part.id] === season.id;

                      return (
                        <div
                          key={season.id}
                          className="bg-white/60 dark:bg-white/15 rounded-xl overflow-hidden border-2 border-white/70 dark:border-white/25"
                        >
                          {/* Season Header */}
                          <button
                            onClick={() => handleToggleSeason(part.id, season.id)}
                            className="w-full bg-gradient-to-br from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between active:opacity-90 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{season.icon}</span>
                              <div className="text-left">
                                <div className="text-lg font-bold">{season.name}</div>
                                <div className="text-sm opacity-90">
                                  {seasonSongs.length} {seasonSongs.length === 1 ? 'canto' : 'cantos'}
                                </div>
                              </div>
                            </div>
                            {isSeasonExpanded ? (
                              <ChevronUp className="w-6 h-6" strokeWidth={2.5} />
                            ) : (
                              <ChevronDown className="w-6 h-6" strokeWidth={2.5} />
                            )}
                          </button>

                          {/* Songs List */}
                          {isSeasonExpanded && (
                            <div className="p-3 space-y-2 bg-white/40 dark:bg-white/10">
                              {seasonSongs.map(song => (
                                <div
                                  key={song.id}
                                  className="bg-white/80 dark:bg-white/20 rounded-xl p-3 border-2 border-white/90 dark:border-white/30 hover:scale-[1.02] transition-all"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h4 className="text-base font-bold text-blue-950 dark:text-white leading-tight">
                                        {song.title}
                                      </h4>
                                      {song.author && (
                                        <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">
                                          {song.author}
                                        </p>
                                      )}
                                      {song.version && (
                                        <span className="inline-block bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold mt-1">
                                          {song.version}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <button
                                      onClick={() => onPlaySong(song)}
                                      className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold hover:from-green-700 hover:to-green-800"
                                    >
                                      <Play className="w-4 h-4" fill="currentColor" />
                                      Ver Partitura y Audio
                                    </button>
                                    {song.lyrics && (
                                      <button
                                        onClick={() => handleToggleLyrics(song.id)}
                                        className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold hover:from-blue-700 hover:to-blue-800"
                                      >
                                        <FileText className="w-4 h-4" />
                                        {expandedLyrics === song.id ? 'Ocultar Letra' : 'Ver Letra con Acordes'}
                                      </button>
                                    )}
                                    {expandedLyrics === song.id && song.lyrics && (
                                      <div className="mt-2">
                                        <LyricsWithChords lyrics={song.lyrics} />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredParts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                No se encontraron cantos
              </p>
              <p className="text-base text-purple-700 dark:text-purple-300">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>

        {/* Separator: Non-Liturgical Section */}
        <div className="my-12 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-4 border-amber-400 dark:border-amber-600"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-8 py-4 rounded-2xl border-4 border-amber-400 dark:border-amber-600 shadow-xl">
              <div className="flex items-center gap-3">
                <span className="text-4xl">⛪</span>
                <div>
                  <h3 className="text-2xl font-bold text-amber-950 dark:text-amber-100">
                    Cantos No Litúrgicos
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Para adoraciones, procesiones y celebraciones extra-litúrgicas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Non-Liturgical Songs */}
        <div className="space-y-4">{NON_LITURGICAL_CATEGORIES.map(category => {
            const songs = getNonLiturgicalSongs();
            const groupedSongs = groupNonLiturgicalByCategory(songs);
            const isExpanded = expandedNonLiturgical === category.id;

            return (
              <div
                key={category.id}
                className="bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/60 dark:border-white/20 overflow-hidden transition-all hover:shadow-xl"
              >
                {/* Category Header */}
                <button
                  onClick={() => handleToggleNonLiturgical(category.id)}
                  className="w-full bg-gradient-to-br from-purple-600 to-purple-800 text-white p-5 flex items-center justify-between active:opacity-90 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{category.icon}</span>
                    <div className="text-left">
                      <div className="text-2xl font-bold">{category.name}</div>
                      <div className="text-base opacity-90">
                        {groupedSongs[category.id]?.length || 0} {groupedSongs[category.id]?.length === 1 ? 'canto' : 'cantos'}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-7 h-7" strokeWidth={2.5} />
                  ) : (
                    <ChevronDown className="w-7 h-7" strokeWidth={2.5} />
                  )}
                </button>

                {/* Expanded Content: Songs */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white/20 dark:bg-white/5">
                    {groupedSongs[category.id]?.map(song => (
                      <div
                        key={song.id}
                        className="bg-white/80 dark:bg-white/20 rounded-xl p-3 border-2 border-white/90 dark:border-white/30 hover:scale-[1.02] transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="text-base font-bold text-blue-950 dark:text-white leading-tight">
                              {song.title}
                            </h4>
                            {song.author && (
                              <p className="text-sm text-blue-900 dark:text-blue-200 mt-1">
                                {song.author}
                              </p>
                            )}
                            {song.version && (
                              <span className="inline-block bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold mt-1">
                                {song.version}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => onPlaySong(song)}
                            className="w-full bg-gradient-to-br from-green-600 to-green-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold hover:from-green-700 hover:to-green-800"
                          >
                            <Play className="w-4 h-4" fill="currentColor" />
                            Ver Partitura y Audio
                          </button>
                          {song.lyrics && (
                            <button
                              onClick={() => handleToggleLyrics(song.id)}
                              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-sm font-bold hover:from-blue-700 hover:to-blue-800"
                            >
                              <FileText className="w-4 h-4" />
                              {expandedLyrics === song.id ? 'Ocultar Letra' : 'Ver Letra con Acordes'}
                            </button>
                          )}
                          {expandedLyrics === song.id && song.lyrics && (
                            <div className="mt-2">
                              <LyricsWithChords lyrics={song.lyrics} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 bg-blue-100 dark:bg-blue-900/40 p-4 rounded-xl border-2 border-blue-300 dark:border-blue-700">
          <div className="flex gap-3">
            <Calendar className="w-6 h-6 text-blue-700 dark:text-blue-300 flex-shrink-0" />
            <div>
              <h3 className="text-base font-bold text-blue-950 dark:text-blue-100 mb-1">
                Organización Litúrgica
              </h3>
              <p className="text-sm text-blue-900 dark:text-blue-200">
                Los cantos están organizados primero por su parte en la Misa y luego por el tiempo litúrgico recomendado.
              </p>
            </div>
          </div>
        </div>

        {/* Info Non-Liturgical */}
        <div className="mt-4 bg-amber-100 dark:bg-amber-900/40 p-4 rounded-xl border-2 border-amber-400 dark:border-amber-600">
          <div className="flex gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <h3 className="text-base font-bold text-amber-950 dark:text-amber-100 mb-1">
                Cantos No Litúrgicos
              </h3>
              <p className="text-sm text-amber-900 dark:text-amber-200">
                Estos cantos <strong>NO son apropiados para la Santa Misa</strong>, pero pueden usarse en celebraciones extra-litúrgicas como adoraciones eucarísticas, procesiones, vigilias, charlas y eventos de evangelización.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}