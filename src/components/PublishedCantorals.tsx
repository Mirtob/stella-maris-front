import { useState } from 'react';
import { BookOpen, Calendar, Church, Play, Music as MusicIcon, Clock, BookText, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { PublishedCantoral, Song } from '../types';
import { getCategoryColors } from '../utils/colors';
import { CantoralWithOrdinary } from './CantoralWithOrdinary';
import { generateCantoralPDF } from '../utils/cantoralPDFGenerator';
import { toast } from 'sonner';

interface PublishedCantoralsProps {
  cantorals: PublishedCantoral[];
  onPlaySong: (song: Song) => void;
  userRole?: 'Coro' | 'Pueblo fiel' | 'Admin';
  userParishName?: string; // Parroquia del usuario para filtrar
}

export function PublishedCantorals({ cantorals, onPlaySong, userRole, userParishName }: PublishedCantoralsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewingOrdinary, setViewingOrdinary] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const categoryOrder = ['Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio', 'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida'];

  // Filtrar cantorales según el rol del usuario Y la parroquia
  let visibleCantorals = cantorals;
  
  console.log('🔍 PublishedCantorals - Filtrado de cantorales:');
  console.log('  Total cantorales:', cantorals.length);
  console.log('  userRole:', userRole);
  console.log('  userParishName:', userParishName);
  
  // Filtrar por estado (Pueblo fiel solo ve publicados)
  if (userRole === 'Pueblo fiel') {
    visibleCantorals = visibleCantorals.filter(c => c.status === 'published');
    console.log('  Después de filtrar por status=published:', visibleCantorals.length);
  }
  
  // Filtrar por parroquia (solo cantorales de la parroquia del usuario)
  if (userParishName) {
    visibleCantorals = visibleCantorals.filter(c => c.parishName === userParishName);
    console.log('  Después de filtrar por parishName:', visibleCantorals.length);
    console.log('  Cantorales visibles:', visibleCantorals.map(c => ({
      id: c.id,
      parishName: c.parishName,
      status: c.status,
      date: c.date
    })));
  }

  const groupSongsByCategory = (songs: Song[]) => {
    const grouped = songs.reduce((acc, song) => {
      if (!acc[song.category]) {
        acc[song.category] = [];
      }
      acc[song.category].push(song);
      return acc;
    }, {} as Record<string, Song[]>);

    return Object.keys(grouped).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Entrada': '⛪',
      'Kyrie': '🙏',
      'Gloria': '✨',
      'Santo': '✝️',
      'Cordero de Dios': '🐑',
      'Credo': '📿',
      'Padre Nuestro': '🙏',
      'Salmo': '📖',
      'Aleluya': '🎺',
      'Post Evangelio': '📿',
      'Ofertorio': '🍇',
      'Comunión': '🫓',
      'Salida': '⛪',
    };
    return icons[category] || '🎵';
  };

  // Agrupar cantorales por fecha
  const groupByDate = () => {
    const grouped: Record<string, PublishedCantoral[]> = {};
    
    visibleCantorals.forEach(cantoral => {
      if (!grouped[cantoral.date]) {
        grouped[cantoral.date] = [];
      }
      grouped[cantoral.date].push(cantoral);
    });

    // Ordenar por fecha (más reciente primero)
    return Object.entries(grouped).sort((a, b) => {
      return new Date(b[0]).getTime() - new Date(a[0]).getTime();
    });
  };

  // Si estamos viendo el ordinario de un cantoral
  if (viewingOrdinary) {
    const cantoral = visibleCantorals.find(c => c.id === viewingOrdinary);
    if (cantoral) {
      return (
        <CantoralWithOrdinary
          cantoral={cantoral}
          onBack={() => setViewingOrdinary(null)}
          onPlaySong={onPlaySong}
        />
      );
    }
  }

  if (visibleCantorals.length === 0) {
    return (
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        <div className="pt-8">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow border-2 border-blue-800">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-blue-950 dark:text-white mb-1">Cantorales Publicados</h1>
          </div>

          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/40 dark:border-white/20 text-center transition-colors">
            <MusicIcon className="w-10 h-10 mx-auto mb-2 text-blue-400 dark:text-blue-300" />
            <h2 className="text-base font-bold text-blue-950 dark:text-white mb-2">No hay cantorales publicados</h2>
            <p className="text-xs text-blue-900 dark:text-blue-100 mb-3">
              Los cantorales que publiquen los coros de tu parroquia<br />
              aparecerán aquí para que puedas verlos
            </p>
            {userParishName && (
              <div className="mt-6 bg-blue-100/60 dark:bg-blue-900/40 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700">
                <p className="text-sm text-blue-950 dark:text-blue-100 font-semibold mb-2">
                  📍 Tu parroquia:
                </p>
                <p className="text-base text-blue-900 dark:text-blue-200">
                  {userParishName.split(' - ')[0]}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const groupedByDate = groupByDate();

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow border-2 border-blue-800">
              <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-blue-950 dark:text-white mb-1">
            {userRole === 'Pueblo fiel' ? 'Misas Programadas' : 'Cantorales Publicados'}
          </h1>
          <p className="text-sm text-blue-900 dark:text-blue-100">
            {userRole === 'Pueblo fiel' 
              ? 'Elige el horario de tu Misa' 
              : `${visibleCantorals.length} ${visibleCantorals.length === 1 ? 'cantoral' : 'cantorales'}`}
          </p>
        </div>

        {/* Info Card para Pueblo Fiel */}
        {userRole === 'Pueblo fiel' && (
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-xl p-3 mb-3 border border-blue-300 dark:border-blue-700 transition-colors">
            <div className="flex gap-3">
              <div className="text-xl">📅</div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100 mb-1">
                  Encuentra tu Misa
                </h3>
                <p className="text-xs text-blue-900 dark:text-blue-200">Consulta los horarios y cantos de cada Misa.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Card para Coro - Cantorales de su parroquia */}
        {userRole === 'Coro' && userParishName && (
          <div className="bg-gradient-to-br from-green-100 to-green-50 dark:from-green-950 dark:to-green-900 rounded-xl p-3 mb-3 border border-green-300 dark:border-green-700 transition-colors">
            <div className="flex gap-3">
              <div className="text-xl">⛪</div>
              <div>
                <h3 className="text-sm font-bold text-green-950 dark:text-green-100 mb-1">
                  Cantorales de {userParishName.split(' - ')[0]}
                </h3>
                <p className="text-xs text-green-900 dark:text-green-200">
                  Aquí puedes ver los cantorales publicados para tu parroquia. 
                  Para ver cantorales de otras comunidades, visita el "Historial de Cantorales" en el menú.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cantorales agrupados por fecha */}
        <div className="space-y-3">
          {groupedByDate.map(([date, cantoralsOnDate]) => {
            const isExpanded = expandedDate === date;
            const hasMultipleMasses = cantoralsOnDate.length > 1;

            return (
              <div key={date} className="space-y-3">
                {/* Fecha Header */}
                <button
                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                  className="w-full bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-xl p-3 shadow border-2 border-blue-800 active:scale-98 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                        <Calendar className="w-4 h-4" strokeWidth={2.5} />
                      </div>
                      <div className="text-left">
                        <div className="text-sm opacity-90 mb-1">
                          {formatDateShort(date).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold">
                          {cantoralsOnDate[0].liturgicalDate}
                        </div>
                        {hasMultipleMasses && (
                          <div className="text-xs opacity-80">
                            {cantoralsOnDate.length} {cantoralsOnDate.length === 1 ? 'Misa' : 'Misas'}
                          </div>
                        )}
                      </div>
                    </div>
                    {hasMultipleMasses && (
                      isExpanded ? 
                        <ChevronUp className="w-5 h-5" strokeWidth={2.5} /> :
                        <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                    )}
                  </div>
                </button>

                {/* Misas de esa fecha */}
                {(isExpanded || !hasMultipleMasses) && (
                  <div className="space-y-3 pl-0">
                    {cantoralsOnDate
                      .sort((a, b) => a.massTime.localeCompare(b.massTime))
                      .map((cantoral) => {
                        const isExpandedCantoral = expandedId === cantoral.id;
                        const categories = groupSongsByCategory(cantoral.songs);

                        return (
                          <div
                            key={cantoral.id}
                            className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/40 dark:border-white/20 overflow-hidden transition-colors"
                          >
                            {/* Cantoral Header */}
                            <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-3 border-b border-green-800">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                                    <Clock className="w-4 h-4" strokeWidth={2.5} />
                                  </div>
                                  <div>
                                    <div className="text-lg sm:text-2xl font-bold mb-1">
                                      {cantoral.massTime}
                                    </div>
                                    <div className="text-sm opacity-90">
                                      {cantoral.parishName}
                                    </div>
                                  </div>
                                </div>
                                {cantoral.status === 'draft' && (
                                  <div className="bg-amber-500 text-white px-3 py-1 rounded-lg text-sm font-bold border border-amber-600">
                                    Borrador
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-sm opacity-90">
                                <Church className="w-4 h-4" strokeWidth={2.5} />
                                <span>{cantoral.choirName}</span>
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="p-4 bg-white/40 dark:bg-white/10 backdrop-blur-sm border-b border-white/30 transition-colors">
                              <div className="grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => setViewingOrdinary(cantoral.id)}
                                  className="bg-gradient-to-br from-blue-900 to-blue-950 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-blue-800"
                                >
                                  <BookText className="w-5 h-5" strokeWidth={2.5} />
                                  Ver Ordinario
                                </button>
                                <button
                                  onClick={() => setExpandedId(isExpandedCantoral ? null : cantoral.id)}
                                  className="bg-gradient-to-br from-green-600 to-green-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-green-800"
                                >
                                  <BookOpen className="w-5 h-5" strokeWidth={2.5} />
                                  {isExpandedCantoral ? 'Ocultar' : 'Ver'} Cantos
                                </button>
                                <button
                                  onClick={() => {
                                    generateCantoralPDF({ cantoral });
                                    toast.success('Generando PDF...', {
                                      description: 'Tu cantoral se descargará en unos momentos'
                                    });
                                  }}
                                  className="bg-gradient-to-br from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-purple-800 col-span-2"
                                >
                                  <Download className="w-5 h-5" strokeWidth={2.5} />
                                  Descargar Cantoral PDF
                                </button>
                              </div>
                            </div>

                            {/* Lista de cantos (expandible) */}
                            {isExpandedCantoral && (
                              <div className="p-4 space-y-4 bg-white/20 dark:bg-white/5 transition-colors">
                                {categories.map(category => {
                                  const songsInCategory = cantoral.songs.filter(s => s.category === category);
                                  const colors = getCategoryColors(category);

                                  return (
                                    <div key={category}>
                                      <div className={`flex items-center gap-2 mb-3 text-lg font-bold`} style={{ color: colors.text }}>
                                        <span className="text-2xl">{getCategoryIcon(category)}</span>
                                        <span>{category}</span>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        {songsInCategory.map((song) => (
                                          <button
                                            key={song.id}
                                            onClick={() => onPlaySong(song)}
                                            className={`w-full bg-white/40 dark:bg-white/10 backdrop-blur-sm border-2 rounded-xl p-4 flex items-center justify-between active:scale-98 transition-all shadow-md hover:shadow-lg`}
                                            style={{ borderColor: colors.border }}
                                          >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                              <div 
                                                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 shadow-md"
                                                style={{ 
                                                  background: colors.gradient,
                                                  borderColor: colors.border 
                                                }}
                                              >
                                                <MusicIcon className="w-6 h-6 text-white" strokeWidth={2.5} />
                                              </div>
                                              <div className="text-left flex-1 min-w-0">
                                                <div className="font-bold text-base text-blue-950 dark:text-white truncate">
                                                  {song.title}
                                                </div>
                                                {song.version && (
                                                  <div className="text-sm text-blue-800 dark:text-blue-200 opacity-90">
                                                    {song.version}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            <Play 
                                              className="w-8 h-8 flex-shrink-0 ml-2" 
                                              strokeWidth={2.5}
                                              style={{ color: colors.text }}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
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
        </div>
      </div>
    </div>
  );
}