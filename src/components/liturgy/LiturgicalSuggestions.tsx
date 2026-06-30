import { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { useSongs } from '../../hooks/useSongs';
import { getCurrentLiturgicalSeason } from '../../utils/liturgicalSeason';
import { matchesSearch } from '../../utils/textSearch';

interface LiturgicalSuggestionsProps {
  onAddToCantoral?: (song: Song) => void;
  onPlaySong?: (song: Song) => void;
  cantoral?: Song[];
}

export function LiturgicalSuggestions({ onAddToCantoral, onPlaySong, cantoral = [] }: LiturgicalSuggestionsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoScroll, setAutoScroll] = useState(true);

  // Catálogo real desde Supabase (mismo origen que CategorySearch).
  // Antes usaba mockSongs, lo que armaba 'cantorales aparte' con cantos
  // que no existían en el canal real.
  const { songs: realSongs } = useSongs();

  /**
   * Si el canto es un Kyrie con massName (ej. "Misa de los Ángeles"),
   * intercepta el agregado y replica el flujo de CategorySearch:
   * agrega el Kyrie + automáticamente Santo, Cordero y Gloria del
   * mismo autor (mismo massName y misma version). Si no encuentra
   * alguno, agrega los que sí existen.
   *
   * Para no mantener el dialog acá (CategorySearch ya lo tiene), el
   * comportamiento es directo: si el coro elige un Kyrie sugerido,
   * recibe la Misa completa sin preguntar, con toast informativo.
   */
  const handleAddWithMassFlow = (song: Song) => {
    if (!onAddToCantoral) return;

    if (song.category === 'Kyrie' && song.massName) {
      onAddToCantoral(song);

      const santo = realSongs.find(s =>
        s.massName === song.massName &&
        s.category === 'Santo' &&
        s.version === song.version
      );
      const cordero = realSongs.find(s =>
        s.massName === song.massName &&
        s.category === 'Cordero de Dios' &&
        s.version === song.version
      );
      const gloria = realSongs.find(s =>
        s.massName === song.massName &&
        s.category === 'Gloria' &&
        s.version === song.version
      );

      const added: string[] = [];
      if (santo)  { onAddToCantoral(santo);  added.push('Santo'); }
      if (cordero){ onAddToCantoral(cordero);added.push('Cordero'); }
      if (gloria) { onAddToCantoral(gloria); added.push('Gloria'); }

      if (added.length > 0) {
        toast.success(`Misa "${song.massName}" agregada`, {
          description: `+ ${added.join(', ')} del mismo autor`,
        });
      }
      return;
    }

    onAddToCantoral(song);
  };

  // Obtener sugerencias según el tiempo litúrgico actual
  const liturgicalSeason = getCurrentLiturgicalSeason();

  // Filtrar cantos que tengan tags relacionados con el tiempo litúrgico
  // Y que NO estén ya agregados al cantoral.
  // matchesSearch hace la búsqueda insensible a acentos.
  const getSuggestedSongs = (): Song[] => {
    let filteredSongs: Song[] = [];

    switch (liturgicalSeason) {
      case 'Adviento':
        filteredSongs = realSongs.filter(song =>
          song.tags?.includes('Adviento') ||
          song.tags?.includes('Preparación') ||
          song.tags?.includes('Espera') ||
          matchesSearch(song.title, 'adviento') ||
          matchesSearch(song.title, 'prepara')
        );
        break;
      
      case 'Navidad':
        filteredSongs = realSongs.filter(song =>
          song.tags?.includes('Navidad') ||
          song.tags?.includes('Nacimiento') ||
          matchesSearch(song.title, 'navidad') ||
          matchesSearch(song.title, 'nació')
        );
        break;

      case 'Cuaresma':
        filteredSongs = realSongs.filter(song =>
          song.tags?.includes('Cuaresma') ||
          song.tags?.includes('Penitencia') ||
          song.tags?.includes('Conversión') ||
          matchesSearch(song.title, 'cuaresma') ||
          matchesSearch(song.title, 'perdón')
        );
        break;

      case 'Pascua':
        filteredSongs = realSongs.filter(song =>
          song.tags?.includes('Pascua') ||
          song.tags?.includes('Resurrección') ||
          song.tags?.includes('Aleluya') ||
          matchesSearch(song.title, 'pascua') ||
          matchesSearch(song.title, 'resucitó') ||
          matchesSearch(song.title, 'aleluya')
        );
        break;
      
      case 'Tiempo Ordinario':
      default:
        // Para Tiempo Ordinario, mostrar los más populares o recientes
        filteredSongs = realSongs.filter(song =>
          song.tags?.includes('Ordinario') || 
          song.tags?.includes('Popular')
        );
        break;
    }
    
    // **IMPORTANTE: Filtrar cantos que YA estén en el cantoral**
    // Si un canto ya fue elegido para alguna parte de la misa, no aparecerá como sugerencia
    filteredSongs = filteredSongs.filter(song => 
      !cantoral.some(cantoralSong => cantoralSong.id === song.id)
    );
    
    // Si no hay suficientes cantos con tags, tomar los primeros cantos disponibles (que no estén en el cantoral)
    if (filteredSongs.length < 4) {
      const remainingSongs = realSongs
        .filter(song => !cantoral.some(cs => cs.id === song.id))
        .slice(0, 4 - filteredSongs.length);
      filteredSongs = [...filteredSongs, ...remainingSongs];
    }
    
    // Limitar a 4 sugerencias únicas
    return filteredSongs.slice(0, 4).filter((song, index, self) => 
      index === self.findIndex(s => s.id === song.id)
    );
  };

  const suggestedSongs = getSuggestedSongs();

  // Auto-scroll cada 5 segundos
  useEffect(() => {
    if (!autoScroll || suggestedSongs.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % suggestedSongs.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoScroll, suggestedSongs.length]);

  const handleNext = () => {
    setAutoScroll(false);
    setCurrentIndex((prev) => (prev + 1) % suggestedSongs.length);
  };

  const handlePrev = () => {
    setAutoScroll(false);
    setCurrentIndex((prev) => (prev - 1 + suggestedSongs.length) % suggestedSongs.length);
  };

  const isInCantoral = (songId: string) => {
    return cantoral.some(s => s.id === songId);
  };

  if (suggestedSongs.length === 0) {
    return null;
  }

  // El carrusel auto-avanza currentIndex, pero suggestedSongs se ACHICA cada vez
  // que el coro agrega un canto (queda filtrado en getSuggestedSongs). Si el índice
  // quedaba apuntando más allá del nuevo final, currentSong era undefined y el
  // render crasheaba al leer currentSong.title ("Algo salió mal"). Clampear con
  // módulo lo mantiene válido sin un useEffect extra. Acá length >= 1 (return null arriba).
  const safeIndex = currentIndex % suggestedSongs.length;
  const currentSong = suggestedSongs[safeIndex];

  // Obtener color según el tiempo litúrgico
  const getSeasonColor = () => {
    switch (liturgicalSeason) {
      case 'Adviento':
        return 'from-purple-600 to-purple-800';
      case 'Navidad':
        return 'from-yellow-500 to-orange-600';
      case 'Cuaresma':
        return 'from-purple-700 to-purple-900';
      case 'Pascua':
        return 'from-white to-yellow-300';
      default:
        return 'from-green-600 to-green-800';
    }
  };

  const getSeasonIcon = () => {
    switch (liturgicalSeason) {
      case 'Adviento':
        return '🕯️';
      case 'Navidad':
        return '⭐';
      case 'Cuaresma':
        return '✝️';
      case 'Pascua':
        return '🌅';
      default:
        return '🌿';
    }
  };

  return (
    <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg border-2 border-white/40 dark:border-white/20 overflow-hidden transition-colors">
      {/* Header */}
      <div className={`bg-gradient-to-br ${getSeasonColor()} text-white p-2 border-b border-white/30`}>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-xs font-bold uppercase tracking-wide"> {liturgicalSeason}</h3>
          <span className="text-2xl ml-auto">{getSeasonIcon()}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm opacity-90">
            Cantos recomendados según el tiempo litúrgico
          </p>
          <div className="flex gap-1">
            {suggestedSongs.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === safeIndex
                    ? 'w-6 bg-white'
                    : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative p-2 bg-white/40 dark:bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            className="flex-shrink-0 p-2 bg-white/60 dark:bg-white/10 rounded-full hover:bg-white/80 dark:hover:bg-white/20 transition-all active:scale-95"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5 text-brand-ink-soft" />
          </button>

          {/* Song Card */}
          <div className="flex-1 bg-gradient-to-br from-white/70 to-white/50 dark:from-white/15 dark:to-white/10 rounded-xl p-2 border border-white/80 dark:border-white/25 transition-all">
            <div className="flex items-start justify-between mb-1">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-brand-ink mb-0.5 line-clamp-1">
                  {currentSong.title}
                </h4>
                {currentSong.artist && (
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-0.5">
                    {currentSong.artist}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-brand-ink-soft px-2 py-1 rounded-lg text-xs font-bold">
                    {currentSong.category}
                  </span>
                  {currentSong.version && (
                    <span className="inline-block bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100 px-2 py-1 rounded-lg text-xs font-bold">
                      {currentSong.version}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {onPlaySong && (
                <button
                  onClick={() => onPlaySong(currentSong)}
                  className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg text-sm font-bold hover:from-blue-700 hover:to-blue-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Escuchar
                </button>
              )}
              {onAddToCantoral && (
                <button
                  onClick={() => handleAddWithMassFlow(currentSong)}
                  disabled={isInCantoral(currentSong.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    isInCantoral(currentSong.id)
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 cursor-not-allowed'
                      : 'bg-gradient-to-br from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 active:scale-95'
                  }`}
                >
                  {isInCantoral(currentSong.id) ? (
                    <>
                      <span>✓</span>
                      Agregado
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Agregar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            className="flex-shrink-0 p-2 bg-white/60 dark:bg-white/10 rounded-full hover:bg-white/80 dark:hover:bg-white/20 transition-all active:scale-95"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5 text-brand-ink-soft" />
          </button>
        </div>

        {/* Counter */}
        <div className="text-center mt-1">
          <p className="text-xs text-blue-800 dark:text-blue-200 font-bold">
            {safeIndex + 1} de {suggestedSongs.length}
          </p>
        </div>
      </div>
    </div>
  );
}