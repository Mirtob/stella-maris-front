import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronUp, Music, Cross, CheckCircle, Play, AlertCircle, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Song, InstrumentType } from '../../types';
import { useSongs } from '../../hooks/useSongs';
import { getCategoryColors } from '../../utils/colors';
import { getCurrentLiturgicalColor, getLiturgicalCrossColor } from '../../utils/liturgicalColors';
import { matchesSearch } from '../../utils/textSearch';
import { AddGloriaDialog } from '../cantoral/AddGloriaDialog';
import { AddPadreNuestroDialog, PadreNuestroLanguage } from '../cantoral/AddPadreNuestroDialog';
import { getSpecialLiturgicalDay, getCategoriesForSpecialDay, getSpecialDayName, getSpecialDayEmoji } from '../../utils/specialLiturgicalDays';
import { getCurrentLiturgicalSeason } from '../../utils/liturgicalSeason';
import { isOrdinary } from '../../utils/ordinary';
import { resolveOrdinarySheetMusic } from '../../utils/ordinarySheetMusic';
import { previousUseOf, type PreviousUsage } from '../../utils/previousUsage';
import { RepeatSongDialog } from '../cantoral/RepeatSongDialog';

interface CategorySearchProps {
  category: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAddToCantoral: (song: Song) => void;
  onRemoveFromCantoral: (songId: string) => void;
  cantoral: Song[];
  onPlaySong: (song: Song) => void;
  preferredInstrument?: InstrumentType;
  /** Uso de cantos en el cantoral anterior (la "semana pasada"), para avisar repeticiones. */
  previousUsage?: PreviousUsage | null;
}

export function CategorySearch({ 
  category, 
  icon, 
  isExpanded, 
  onToggle, 
  onClose, 
  onAddToCantoral, 
  onRemoveFromCantoral, 
  cantoral,
  onPlaySong,
  preferredInstrument,
  previousUsage,
}: CategorySearchProps) {
  const { songs } = useSongs();
  const [searchTerm, setSearchTerm] = useState('');
  const [showGloriaDialog, setShowGloriaDialog] = useState(false);
  const [pendingGloria, setPendingGloria] = useState<Song | null>(null);
  const [showSantoCordeloDialog, setShowSantoCordeloDialog] = useState(false);
  const [pendingKyrie, setPendingKyrie] = useState<Song | null>(null);
  const [pendingSanto, setPendingSanto] = useState<Song | null>(null);
  const [pendingCordero, setPendingCordero] = useState<Song | null>(null);
  const [showPadreNuestroDialog, setShowPadreNuestroDialog] = useState(false);
  // Canto que ya se usó en el cantoral anterior: se pide confirmación antes de agregarlo.
  const [pendingRepeat, setPendingRepeat] = useState<{ song: Song; parts: string[]; title: string } | null>(null);

  // Obtener el tiempo litúrgico actual
  const currentSeason = getCurrentLiturgicalSeason();

  // **FUNCIÓN AUXILIAR**: Verificar si un canto está en el cantoral
  const isInCantoral = (songId: string) => {
    return cantoral.some(s => s.id === songId);
  };

  const isMassPart = (category: string) => {
    return ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios'].includes(category);
  };

  // Un canto pertenece a una categoría si es su parte principal O una de las
  // partes adicionales donde también sirve (recommendedCategories).
  const songInCategory = (song: Song, cat: string) =>
    song.category === cat || (song.recommendedCategories?.includes(cat) ?? false);

  // **SUGERENCIAS LITÚRGICAS**: Filtrar cantos por categoría Y tiempo litúrgico
  const getSuggestedSongs = (): Song[] => {
    // Obtener todos los cantos de esta categoría
    const categorySongs = songs.filter(song => songInCategory(song, category));

    // Filtrar por tiempo litúrgico
    const suggestedSongs = categorySongs.filter(song => {
      // Considerar TODAS las etiquetas del canto (no solo la primera), porque un
      // canto puede tener varias (p. ej. "Tiempo Ordinario" + "Virgen María").
      const seasons = (song.liturgicalSeasons && song.liturgicalSeasons.length > 0
        ? (song.liturgicalSeasons as string[])
        : (song.liturgicalSeason ? song.liturgicalSeason.split(',') : [])
      ).map(s => s.trim()).filter(Boolean);

      // Sin etiquetas → sirve para todas las temporadas.
      if (seasons.length === 0) return true;

      // Mapear nombres de temporadas
      const seasonMapping: Record<string, string[]> = {
        'Adviento': ['Adviento'],
        'Navidad': ['Navidad'],
        'Cuaresma': ['Cuaresma'],
        'Pascua': ['Pascua'],
        'Tiempo Ordinario': ['Ordinario', 'Tiempo Ordinario'],
      };
      
      const currentSeasonVariants = seasonMapping[currentSeason] || [currentSeason];
      return seasons.some(s => currentSeasonVariants.includes(s));
    });
    
    // Excluir cantos que ya están en el cantoral
    const availableSongs = suggestedSongs.filter(song => !isInCantoral(song.id));
    
    // Ordenar por instrumento preferido si está definido
    if (preferredInstrument) {
      availableSongs.sort((a, b) => {
        const aMatch = a.version === preferredInstrument ? 1 : 0;
        const bMatch = b.version === preferredInstrument ? 1 : 0;
        return bMatch - aMatch;
      });
    }
    
    // Retornar solo los primeros 3 como sugerencias
    return availableSongs.slice(0, 3);
  };

  const suggestedSongs = getSuggestedSongs();

  let categorySongs = songs.filter(song => songInCategory(song, category));

  // Sort by preferred instrument if available
  if (preferredInstrument) {
    categorySongs = categorySongs.sort((a, b) => {
      const aMatch = a.version === preferredInstrument ? 1 : 0;
      const bMatch = b.version === preferredInstrument ? 1 : 0;
      return bMatch - aMatch;
    });
  }
  
  // Búsqueda insensible a acentos: "comunion" encuentra "Comunión",
  // "tu reino" encuentra "Tú Reinarás", etc.
  const filteredSongs = categorySongs.filter(song =>
    matchesSearch(song.title, searchTerm) ||
    matchesSearch(song.artist, searchTerm) ||
    matchesSearch(song.author, searchTerm) ||
    matchesSearch(song.massName, searchTerm)
  );

  // Agrega un canto al cantoral; si es parte del ordinario sin partitura vinculada,
  // intenta resolverla en Drive antes de agregarlo (best-effort, no bloquea la UI).
  const addSongEnriched = (song: Song) => {
    if (isOrdinary(song) && !song.sheetMusicUrl) {
      resolveOrdinarySheetMusic(song)
        .then(onAddToCantoral)
        .catch(() => onAddToCantoral(song));
    } else {
      onAddToCantoral(song);
    }
  };

  const handleAddSong = (rawSong: Song, skipRepeatCheck = false) => {
    // ¿Ya se usó este canto en el cantoral anterior (la "semana pasada")? Avisamos para
    // fomentar variedad antes de agregarlo. En Adviento/Cuaresma sugerimos otra parte.
    // OJO: no avisamos en el ORDINARIO (Kyrie/Gloria/Santo/Cordero/Padre Nuestro): esas
    // partes se mantienen a propósito durante un tiempo litúrgico.
    const ORDINARY_PARTS = ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios', 'Padre Nuestro', 'Credo'];
    if (!skipRepeatCheck && !ORDINARY_PARTS.includes(category)) {
      const prev = previousUseOf(previousUsage, rawSong.id);
      if (prev && prev.parts.length) {
        setPendingRepeat({ song: rawSong, parts: prev.parts, title: prev.title || rawSong.title });
        return;
      }
    }

    // Si el canto se agrega desde una parte distinta a su principal (porque sirve
    // para varias), fijar la categoría a la de esta tarjeta para que caiga en el
    // lugar correcto del cantoral.
    const song = rawSong.category === category ? rawSong : { ...rawSong, category };

    // Solo Comunión permite múltiples cantos
    if (category !== 'Comunión') {
      // Remover cualquier canto existente de esta categoría
      const existingInCategory = cantoral.filter(s => s.category === category);
      existingInCategory.forEach(s => onRemoveFromCantoral(s.id));
    }

    // Caso especial: Kyrie
    if (song.category === 'Kyrie' && song.massName) {
      // Guardar Kyrie pendiente
      setPendingKyrie(song);

      // Busca una parte fija de la MISMA Misa. Prefiere la misma versión del
      // Kyrie, pero cae a cualquier versión si no hay coincidencia exacta: la
      // version (= instruments[0]) puede diferir entre partes (p. ej. una marcada
      // solo como Guitarra), y antes eso dejaba sin agregar el Cordero / sin
      // preguntar por el Gloria. Tolera además partes que sirven en varias
      // categorías (songInCategory).
      // Misma Misa con comparación tolerante (sin acentos/mayúsculas/espacios),
      // por si el Cordero de la Misa quedó con una diferencia mínima en massName.
      const normMisa = (x?: string) =>
        (x ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      const sameMisa = (s: Song) => !!s.massName && normMisa(s.massName) === normMisa(song.massName);

      const findMassPart = (cat: string): Song | null =>
        songs.find(s => sameMisa(s) && songInCategory(s, cat) && s.version === song.version)
        ?? songs.find(s => sameMisa(s) && songInCategory(s, cat))
        ?? null;

      const santo = findMassPart('Santo');
      const cordero = findMassPart('Cordero de Dios');
      const gloria = findMassPart('Gloria');

      setPendingSanto(santo || null);
      setPendingCordero(cordero || null);
      setPendingGloria(gloria || null);
      
      // Primera pregunta: ¿Agregar Santo y Cordero de la misma misa?
      setShowSantoCordeloDialog(true);
    } else {
      // Para otros cantos, simplemente agregar (enriqueciendo si es ordinario)
      addSongEnriched(song);

      // Si es Ofertorio y aún no hay Padre Nuestro en el cantoral, preguntar
      if (song.category === 'Ofertorio' && !cantoral.some(s => s.category === 'Padre Nuestro')) {
        setTimeout(() => setShowPadreNuestroDialog(true), 300);
      } else {
        // Cerrar card automáticamente después de agregar
        setTimeout(() => { onClose(); }, 300);
      }
    }
  };

  // Busca en Drive la partitura del Padre Nuestro según el idioma:
  //  · 'es' → archivo «Padre nuestro»  · 'la' → archivo «Pater noster».
  // Prefiere coincidencia exacta de nombre; cae a "contiene" si no la encuentra.
  const fetchPadreNuestroSheet = async (language: PadreNuestroLanguage): Promise<string | undefined> => {
    try {
      const r = await fetch('/api/sheets');
      if (!r.ok) return undefined;
      const data = await r.json();
      const files = (data.files || []) as Array<{ id: string; name: string }>;
      const norm = (s: string) =>
        s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim();
      const wanted = language === 'la' ? 'pater noster' : 'padre nuestro';
      const baseName = (name: string) => norm(name.replace(/\.pdf$/i, ''));
      const match =
        files.find(f => baseName(f.name) === wanted) ||
        files.find(f => norm(f.name).includes(wanted));
      return match ? `https://drive.google.com/file/d/${match.id}/preview` : undefined;
    } catch {
      return undefined;
    }
  };

  // Texto buscable de un canto, sin acentos y en minúscula.
  const haystack = (s: Song) =>
    `${s.title} ${s.author ?? ''} ${s.artist ?? ''}`
      .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Busca en el CATÁLOGO el Padre Nuestro / Pater noster cargado manualmente.
  // Distingue idioma por el texto; tolera que la etiqueta de parte no sea exacta.
  const findCatalogPadreNuestro = (language: PadreNuestroLanguage): Song | undefined => {
    const isLatin = language === 'la';
    const isLatinSong = (s: Song) => /\bpater\b|latin|gregor/.test(haystack(s));
    const candidates = songs.filter(
      s => songInCategory(s, 'Padre Nuestro') || /padre nuestro|pater noster/.test(haystack(s)),
    );
    return candidates.find(s => (isLatin ? isLatinSong(s) : !isLatinSong(s))) ?? candidates[0];
  };

  // Confirma agregar el Padre Nuestro cantado, en español o en gregoriano (latín).
  // Prioridad de origen: (1) el canto del catálogo cargado manualmente (trae la
  // partitura desde su driveFileId y, si tiene, la letra); (2) respaldo: el PDF
  // por nombre en la carpeta de partituras de Drive.
  const handleConfirmPadreNuestro = async (language: PadreNuestroLanguage) => {
    const isLatin = language === 'la';

    const catalogSong = findCatalogPadreNuestro(language);
    const sheetMusicUrl =
      catalogSong?.sheetMusicUrl ?? (await fetchPadreNuestroSheet(language));

    const padreNuestroSong: Song = catalogSong
      ? {
          ...catalogSong,
          // id único por instancia (evita colisión con el dedup del cantoral) y
          // categoría/partitura fijadas para que se muestre como Padre Nuestro.
          id: `padre-nuestro-${language}-${Date.now()}`,
          category: 'Padre Nuestro',
          sheetMusicUrl,
        }
      : {
          id: `padre-nuestro-${language}-${Date.now()}`,
          title: isLatin ? 'Padre Nuestro (Gregoriano)' : 'Padre Nuestro',
          category: 'Padre Nuestro',
          youtubeId: '',
          duration: '0:00',
          author: isLatin ? 'Pater noster (latín)' : 'Misa',
          version: 'Coro',
          sheetMusicUrl,
          isLiturgical: true,
        };
    onAddToCantoral(padreNuestroSong);

    if (!sheetMusicUrl && !padreNuestroSong.lyrics) {
      toast.warning('No encontré la partitura', {
        description: `Agregué el Padre Nuestro, pero no hallé el «${isLatin ? 'Pater noster' : 'Padre nuestro'}» ni en el catálogo ni en Drive.`,
      });
    }

    setShowPadreNuestroDialog(false);
    setTimeout(() => onClose(), 300);
  };

  const handleCancelPadreNuestro = () => {
    setShowPadreNuestroDialog(false);
    setTimeout(() => onClose(), 300);
  };

  // Agrega un canto en una parte fija concreta. Si el canto es "prestado" de otra
  // parte (multi-parte: su categoría principal no es `part`), le fija la categoría
  // y un id único por parte; así el dedup por id de handleAddToCantoral no colapsa
  // Santo y Cordero cuando provienen del mismo canto.
  const addAsPart = (src: Song, part: string) => {
    if (src.category === part) {
      addSongEnriched(src);
    } else {
      const suffix = part.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
      addSongEnriched({ ...src, category: part, id: `${src.id}::${suffix}` });
    }
  };

  const handleConfirmSantoCordero = () => {
    // Remover Santo y Cordero existentes PRIMERO
    const existingSanto = cantoral.filter(s => s.category === 'Santo');
    const existingCordero = cantoral.filter(s => s.category === 'Cordero de Dios');
    existingSanto.forEach(s => onRemoveFromCantoral(s.id));
    existingCordero.forEach(s => onRemoveFromCantoral(s.id));

    // Guardar referencias locales antes de cerrar el modal
    const kyrieToAdd = pendingKyrie;
    const santoToAdd = pendingSanto;
    const corderoToAdd = pendingCordero;

    if (kyrieToAdd) addSongEnriched(kyrieToAdd);
    if (santoToAdd) addAsPart(santoToAdd, 'Santo');
    if (corderoToAdd) addAsPart(corderoToAdd, 'Cordero de Dios');

    setShowSantoCordeloDialog(false);

    // Siempre preguntar por el Gloria (aunque no haya un canto sugerido de esta
    // Misa): el usuario decide si lleva Gloria y lo elige con el buscador.
    setShowGloriaDialog(true);
  };

  const handleCancelSantoCordero = () => {
    // El usuario NO quiere el Santo y Cordero automático
    // Solo agregar el Kyrie
    if (pendingKyrie) {
      addSongEnriched(pendingKyrie);
    }

    setShowSantoCordeloDialog(false);

    // Igual preguntar por el Gloria.
    setShowGloriaDialog(true);
  };

  // El usuario eligió un Gloria concreto (sugerido o desde el buscador).
  const handleSelectGloria = (gloria: Song) => {
    // Remover Gloria existente si lo hay
    const existingGloria = cantoral.filter(s => s.category === 'Gloria');
    existingGloria.forEach(s => onRemoveFromCantoral(s.id));

    addAsPart(gloria, 'Gloria');

    setShowGloriaDialog(false);
    resetPendingState();
    setTimeout(() => onClose(), 300);
  };

  // El usuario decide que la Misa no lleva Gloria (o cierra el diálogo).
  const handleSkipGloria = () => {
    setShowGloriaDialog(false);
    resetPendingState();
    setTimeout(() => onClose(), 300);
  };

  const resetPendingState = () => {
    setPendingKyrie(null);
    setPendingSanto(null);
    setPendingCordero(null);
    setPendingGloria(null);
  };

  const colors = getCategoryColors(category);
  const liturgicalColor = getCurrentLiturgicalColor();
  const crossColor = getLiturgicalCrossColor(liturgicalColor);

  // Q31 — Scroll-into-view del header al expandir esta categoría.
  // Evita que el coro pierda referencia visual cuando la lista expandida
  // empuja contenido hacia abajo.
  const containerRef = useRef<HTMLDivElement>(null);
  const wasExpandedRef = useRef(false);
  useEffect(() => {
    if (isExpanded && !wasExpandedRef.current && containerRef.current) {
      // Delay 1 frame so the expansion animation comienza y el scroll
      // queda alineado con el contenido final.
      requestAnimationFrame(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    wasExpandedRef.current = isExpanded;
  }, [isExpanded]);

  return (
    <div
      ref={containerRef}
      className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border-2 border-white/40 dark:border-white/20 transition-all hover:shadow-xl scroll-mt-4"
      // Q29 — contain: layout aísla el reflow de esta categoría del resto
      // de la lista cuando expande/colapsa, reduciendo jank de scroll en
      // dispositivos medios.
      style={{ contain: 'layout' }}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full ${colors.gradient} text-white p-3 sm:p-4 flex items-center justify-between active:opacity-90 border-2 border-brand-border transition-all hover:scale-[1.01] group`}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Cerrar' : 'Abrir'} categoría ${category}`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="text-2xl sm:text-3xl flex-shrink-0 transform group-hover:scale-110 transition-transform">{icon}</span>
          <div className="text-left min-w-0">
            <div className="text-base sm:text-xl font-bold leading-tight break-words">{category}</div>
            <div className="text-base opacity-90">
              {categorySongs.length} {categorySongs.length === 1 ? 'canto disponible' : 'cantos disponibles'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {filteredSongs.length > 0 && cantoral.filter(s => categorySongs.some(cs => cs.id === s.id)).length > 0 && (
            <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold border border-white/30">
              {cantoral.filter(s => categorySongs.some(cs => cs.id === s.id)).length} añadido{cantoral.filter(s => categorySongs.some(cs => cs.id === s.id)).length !== 1 ? 's' : ''}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-7 h-7 transform group-hover:translate-y-[-2px] transition-transform" strokeWidth={2.5} />
          ) : (
            <ChevronDown className="w-7 h-7 transform group-hover:translate-y-[2px] transition-transform" strokeWidth={2.5} />
          )}
        </div>
      </button>

      {/* Cantos ya agregados a este momento (siempre visibles, reemplaza a "Mi Cantoral") */}
      {cantoral.filter(s => s.category === category).length > 0 && (
        <div className="px-3 sm:px-4 py-3 bg-green-50/80 dark:bg-green-900/20 border-t-2 border-green-200 dark:border-green-800 space-y-2">
          {cantoral.filter(s => s.category === category).map((s) => (
            <div key={s.id} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-green-200 dark:border-green-700">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" strokeWidth={2.5} />
              <span className="flex-1 min-w-0 text-sm sm:text-base font-bold text-brand-ink truncate">{s.title}</span>
              <button
                onClick={() => onPlaySong(s)}
                aria-label={`Ver ${s.title}`}
                className="w-9 h-9 flex-shrink-0 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg flex items-center justify-center active:scale-95 transition-all"
              >
                <Play className="w-4 h-4" fill="currentColor" />
              </button>
              <button
                onClick={() => onRemoveFromCantoral(s.id)}
                aria-label={`Quitar ${s.title}`}
                className="w-9 h-9 flex-shrink-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white/40 dark:bg-white/5 backdrop-blur-sm animate-slideDown">
          {/* Sugerencias Litúrgicas */}
          {suggestedSongs.length > 0 && (
            <div className="mb-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl p-4 border-2 border-amber-300 dark:border-amber-700">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-100">
                  Sugerencias para {currentSeason}
                </h3>
              </div>
              <div className="space-y-2">
                {suggestedSongs.map((song) => (
                  <div
                    key={song.id}
                    className="bg-white/70 dark:bg-white/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800 hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-brand-ink leading-tight">
                          {song.title}
                        </h4>
                        {song.author && (
                          <p className="text-xs text-blue-900 dark:text-blue-200 mt-1">
                            {song.author}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {song.version && (
                            <span className="inline-flex items-center bg-amber-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                              {song.version === 'Coro' && '👥'}
                              {song.version === 'Guitarra' && '🎶'}
                              {song.version === 'Órgano' && '🎹'}
                              {' '}{song.version}
                            </span>
                          )}
                          {song.liturgicalSeason && (
                            <span className="text-xs text-amber-700 dark:text-amber-300 bg-white/50 dark:bg-white/10 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                              {song.liturgicalSeason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onPlaySong(song)}
                        className="flex-1 bg-gradient-to-br from-blue-600 to-blue-700 text-white py-2 px-3 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold hover:from-blue-700 hover:to-blue-800"
                      >
                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                        Ver
                      </button>
                      <button
                        onClick={() => handleAddSong(song)}
                        className="bg-gradient-to-br from-green-600 to-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-all text-xs font-bold hover:from-green-700 hover:to-green-800"
                      >
                        <Cross className="w-3.5 h-3.5" strokeWidth={3} />
                        Agregar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-4" data-tour="constructor-buscar">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-900 dark:text-blue-300 pointer-events-none" />
            <input
              type="text"
              role="searchbox"
              aria-label={`Buscar cantos en categoría ${category}`}
              placeholder="Buscar por título, autor o misa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl text-lg text-brand-ink bg-white/70 dark:bg-white/15 border-2 border-white/60 dark:border-white/20 focus:outline-none focus:ring-4 focus:ring-blue-400/30 focus:border-blue-600 dark:focus:border-blue-400 placeholder-blue-700/70 dark:placeholder-blue-300/70 transition-all"
            />
          </div>

          {/* Songs List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                {/* Distinguir 'catálogo vacío' (Supabase sin cantos) de 'sin resultados'.
                    Si la categoría entera no tiene cantos disponibles, el problema no
                    es el filtro de búsqueda — el catálogo está vacío y hay que
                    sincronizar con YouTube primero. */}
                {categorySongs.length === 0 ? (
                  <>
                    <p className="text-xl font-bold text-brand-ink-soft mb-2">
                      Aún no hay cantos sincronizados
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Pídele al administrador que sincronice el canal de YouTube
                      para cargar el catálogo.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-brand-ink-soft mb-2">No se encontraron cantos</p>
                    <p className="text-base text-blue-800 dark:text-blue-200">Intentá con otros términos de búsqueda</p>
                  </>
                )}
              </div>
            ) : (
              filteredSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="bg-white/60 dark:bg-white/15 backdrop-blur-sm rounded-xl p-4 border-2 border-white/70 dark:border-white/25 transition-all hover:scale-[1.02] hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 group"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationName: 'fadeInUp',
                    animationDuration: '0.3s',
                    animationTimingFunction: 'ease-out',
                    animationFillMode: 'forwards',
                    opacity: 0
                  }}
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    {/* min-w-0 lets the flex child shrink below its content's
                        natural width, which lets the title truncate instead of
                        forcing horizontal overflow on narrow phones. */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-brand-ink leading-tight mb-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
                        {song.title}
                      </h3>
                      
                      {/* Mass Name Badge */}
                      {song.massName && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1.5 bg-gradient-to-br from-brand to-brand-strong text-white px-3 py-1.5 rounded-lg text-sm font-bold border-2 border-brand-border shadow-md">
                            <Music className="w-3.5 h-3.5" />
                            {song.massName}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {song.author && (
                          <span className="text-sm text-blue-900 dark:text-blue-200 bg-white/40 dark:bg-white/10 px-2 py-0.5 rounded border border-white/40">
                            <strong>Autor:</strong> {song.author}
                          </span>
                        )}
                        {song.version && (
                          <span className="inline-flex items-center bg-gradient-to-br from-gold to-gold-strong text-white px-2.5 py-1 rounded-lg text-sm font-semibold border border-amber-700 shadow-sm">
                            {song.version === 'Coro' && '👥'}
                            {song.version === 'Guitarra' && '🎶'}
                            {song.version === 'Órgano' && '🎹'}
                            {' '}{song.version}
                          </span>
                        )}
                      </div>

                      <p className="text-base text-blue-800 dark:text-blue-200 flex items-center gap-1.5">
                        <span className="text-sm">⏱️</span>
                        {song.duration}
                      </p>
                    </div>
                    {isInCantoral(song.id) && (
                      <div className="flex-shrink-0 flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm rounded-full pl-2 pr-3 py-1 border-2 border-green-500" aria-label="Agregado al cantoral">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
                        <span className="text-xs font-bold text-green-700 dark:text-green-300">Agregado</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onPlaySong(song)}
                      className={`flex-1 ${colors.gradient} text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold border-2 border-brand-border shadow-md hover:shadow-lg`}
                      aria-label={`Ver detalles de ${song.title}`}
                    >
                      <Play className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
                      Ver Detalles
                    </button>
                    
                    {!isInCantoral(song.id) && (
                      <button
                        onClick={() => handleAddSong(song)}
                        className="bg-gradient-to-br from-green-600 to-green-700 text-white py-3 px-5 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold border-2 border-green-800 shadow-md hover:shadow-lg hover:from-green-700 hover:to-green-800"
                        aria-label={`Añadir ${song.title} al cantoral`}
                      >
                        <Cross className="w-5 h-5" strokeWidth={3} />
                        {song.massName && isMassPart(song.category) ? 'Agregar Misa' : 'Agregar'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Aviso de canto repetido respecto al cantoral anterior (la "semana pasada") */}
      {pendingRepeat && (
        <RepeatSongDialog
          title={pendingRepeat.title}
          prevParts={pendingRepeat.parts}
          currentPart={category}
          season={currentSeason}
          label={previousUsage?.label || 'la semana pasada'}
          onCancel={() => setPendingRepeat(null)}
          onConfirm={() => {
            const s = pendingRepeat.song;
            setPendingRepeat(null);
            handleAddSong(s, true); // ya confirmado: se salta la comprobación
          }}
        />
      )}

      {/* Add Gloria Dialog — siempre pregunta; permite elegir con buscador */}
      {showGloriaDialog && (
        <AddGloriaDialog
          suggestion={pendingGloria}
          gloriaSongs={songs.filter(s => songInCategory(s, 'Gloria'))}
          massName={pendingKyrie?.massName}
          onSelect={handleSelectGloria}
          onSkip={handleSkipGloria}
        />
      )}

      {/* Add Padre Nuestro Dialog */}
      {showPadreNuestroDialog && (
        <AddPadreNuestroDialog
          onConfirm={handleConfirmPadreNuestro}
          onCancel={handleCancelPadreNuestro}
        />
      )}

      {/* Add Santo y Cordero Dialog */}
      {showSantoCordeloDialog && pendingKyrie && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border-4 border-blue-900 dark:border-blue-700 animate-scaleIn transition-colors">
            {/* Header */}
            <div className="bg-gradient-to-br from-brand to-brand-strong p-6 border-b-4 border-brand-border">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white leading-tight">
                    Completar la Misa
                  </h3>
                  <p className="text-base text-blue-100 mt-1">
                    {pendingKyrie.massName}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-xl font-bold text-brand-ink mb-4 leading-relaxed">
                  ¿Deseas agregar el <span className="text-blue-700 dark:text-blue-400">Santo</span> y el <span className="text-blue-700 dark:text-blue-400">Cordero de Dios</span> de la misma Misa?
                </p>
                
                {/* Detalles de los cantos */}
                <div className="space-y-3 bg-blue-50 dark:bg-slate-700/50 rounded-2xl p-4 border-2 border-blue-200 dark:border-brand-border transition-colors">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">✝️</span>
                    <div className="flex-1">
                      <div className="font-bold text-brand-ink text-lg">Santo</div>
                      {pendingSanto && (
                        <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          {pendingSanto.title}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">🙏</span>
                    <div className="flex-1">
                      <div className="font-bold text-brand-ink text-lg">Cordero de Dios</div>
                      {pendingCordero && (
                        <div className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                          {pendingCordero.title}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleConfirmSantoCordero}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-3 sm:px-4 rounded-2xl font-bold text-lg active:scale-95 transition-all border-2 border-green-800 shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800"
                >
                  ✓ Sí, agregar Santo y Cordero
                </button>
                
                <button
                  onClick={handleCancelSantoCordero}
                  className="w-full bg-white dark:bg-slate-700 text-brand-ink py-4 px-3 sm:px-4 rounded-2xl font-bold text-lg active:scale-95 transition-all border-2 border-gray-300 dark:border-slate-600 shadow-md hover:bg-gray-50 dark:hover:bg-slate-600"
                >
                  No, elegiré después
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}