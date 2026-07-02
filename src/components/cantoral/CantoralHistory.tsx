import { useState } from 'react';
import { History, Calendar, Church, ChevronDown, ChevronUp, Play, Clock, Trash2, Filter, Download } from 'lucide-react';
import { PublishedCantoral, Song } from '../../types';
import { generateChoirBooklet } from '../../utils/atrilBookletPDF';
import { parseParishChapel, splitActiveParish } from '../../utils/parish';
import { parseYmdLocal, formatYmdForDisplay } from '../../utils/dateLocal';
import { massTypeBadge } from '../../utils/massType';
import { LiturgicalColorBadge } from '../liturgy/LiturgicalColorBadge';
import { EmptyState } from '../common/EmptyState';
import { toast } from 'sonner';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface CantoralHistoryProps {
  cantorals: PublishedCantoral[];
  onPlaySong: (song: Song) => void;
  onDeleteCantoral?: (cantoralId: string) => void;
}

export function CantoralHistory({ cantorals, onPlaySong, onDeleteCantoral }: CantoralHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedParish, setSelectedParish] = useState<string>('all');
  const [selectedChapel, setSelectedChapel] = useState<string>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Descarga el folleto del Coro con letras, acordes y las partituras embebidas
  // (intercaladas por canto). Puede tardar: baja cada partitura vía el proxy.
  const handleDownload = async (cantoral: PublishedCantoral) => {
    if (downloadingId) return;
    setDownloadingId(cantoral.id);
    try {
      // PDF del coro en formato LIBRO (cuadernillo): letra con acordes + partitura
      // por canto, carta horizontal. Se abre para imprimir (o descarga si el popup falla).
      const { url } = await generateChoirBooklet(cantoral.songs);
      const w = window.open(url, '_blank');
      if (!w) {
        const a = document.createElement('a');
        a.href = url; a.download = 'cantoral-coro-cuadernillo.pdf';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }
      toast.success('Cuadernillo del coro listo', {
        description: 'Imprime a doble faz y dobla al medio. Si no calzan, cambia el volteo a "borde corto".'
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al descargar el PDF', {
        description: 'Por favor intenta nuevamente'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const pendingDeleteCantoral = pendingDeleteId
    ? cantorals.find(c => c.id === pendingDeleteId)
    : null;

  // Opciones de parroquia (nivel 1 = parishFull) y capilla (nivel 2, separador ' · ')
  const parishOptions = Array.from(
    new Set(cantorals.map(c => splitActiveParish(c.parishName).parishFull).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const chapelOptions = Array.from(
    new Set(
      cantorals
        .filter(c => selectedParish === 'all' || splitActiveParish(c.parishName).parishFull === selectedParish)
        .map(c => splitActiveParish(c.parishName).chapel)
        .filter((x): x is string => Boolean(x))
    )
  ).sort((a, b) => a.localeCompare(b));

  // Filtrar por parroquia y capilla seleccionadas
  const filteredCantorals = cantorals.filter(c => {
    const { parishFull, chapel } = splitActiveParish(c.parishName);
    if (selectedParish !== 'all' && parishFull !== selectedParish) return false;
    if (selectedChapel !== 'all' && chapel !== selectedChapel) return false;
    return true;
  });

  // Ordenar cantorales por fecha (más reciente primero)
  const sortedCantorals = [...filteredCantorals].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  // Agrupar por parroquia y luego por mes (para el título de la descripción)
  const groupedByParish = sortedCantorals.reduce((acc, cantoral) => {
    const parish = cantoral.parishName;
    if (!acc[parish]) {
      acc[parish] = [];
    }
    acc[parish].push(cantoral);
    return acc;
  }, {} as Record<string, PublishedCantoral[]>);

  // Agrupar por año y mes (TZ-safe: parseYmdLocal evita el corrimiento de día)
  const groupedByMonth = sortedCantorals.reduce((acc, cantoral) => {
    const date = parseYmdLocal(cantoral.date);
    const monthYear = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(cantoral);
    return acc;
  }, {} as Record<string, PublishedCantoral[]>);

  const formatDate = (dateStr: string) =>
    formatYmdForDisplay(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const categoryOrder = ['Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio', 'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida'];

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

  if (cantorals.length === 0) {
    return (
      <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-indigo-950 dark:to-blue-950 transition-colors">
        <div className="max-w-4xl mx-auto pt-8 pb-24">
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl">
                <History className="w-14 h-14 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-2xl sm:text-3xl md:text-6xl font-bold text-purple-900 dark:text-purple-200 mb-4">
              Historial de Cantorales
            </h1>
          </div>

          <EmptyState
            Icon={History}
            title="No hay cantorales guardados"
            description="Los cantorales que publiques se guardarán aquí para que puedas consultarlos en cualquier momento."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 md:p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-indigo-950 dark:to-blue-950 transition-colors">
      <div className="max-w-4xl mx-auto pt-8 pb-24">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center shadow-2xl">
              <History className="w-14 h-14 sm:w-16 sm:h-16 text-white" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-4xl sm:text-2xl sm:text-3xl md:text-6xl font-bold text-purple-900 dark:text-purple-200 mb-4 leading-tight">
            Historial de Cantorales
          </h1>
          <p className="text-xl sm:text-2xl text-purple-700 dark:text-purple-300">
            {sortedCantorals.length} cantoral{sortedCantorals.length !== 1 ? 'es' : ''} guardado{sortedCantorals.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-5 mb-8 border-2 border-blue-300 dark:border-blue-700 shadow-lg transition-colors">
          <div className="flex gap-3">
            <div className="text-3xl">🌍</div>
            <div>
              <h3 className="text-xl font-bold text-blue-950 dark:text-blue-100 mb-2">
                Cantorales de Todas las Parroquias
              </h3>
              <p className="text-base text-blue-900 dark:text-blue-200 leading-relaxed">
                Este historial muestra todos los cantorales publicados por coros de diferentes parroquias. 
                Puedes filtrar por parroquia específica o explorar cantorales de otras comunidades para inspirarte.
              </p>
            </div>
          </div>
        </div>

        {/* Filter by Parish */}
        <div className="mb-8">
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl p-5 border-2 border-white/40 dark:border-white/20 transition-colors">
            <label className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-amber-500 rounded-xl flex items-center justify-center border-2 border-purple-800">
                <Filter className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold text-purple-900 dark:text-purple-200">
                Filtrar por Parroquia / Capilla
              </span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={selectedParish}
                onChange={(e) => { setSelectedParish(e.target.value); setSelectedChapel('all'); }}
                className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 bg-white/60 dark:bg-white/10 text-purple-950 dark:text-white font-bold shadow-lg transition-colors"
              >
                <option value="all">🌍 Todas las Parroquias</option>
                {parishOptions.map(parish => (
                  <option key={parish} value={parish}>⛪ {parseParishChapel(parish).parish}</option>
                ))}
              </select>
              {selectedParish !== 'all' && chapelOptions.length > 0 && (
                <select
                  value={selectedChapel}
                  onChange={(e) => setSelectedChapel(e.target.value)}
                  className="w-full px-4 py-4 text-lg rounded-xl border-2 border-white/60 dark:border-white/20 focus:outline-none focus:border-purple-600 dark:focus:border-purple-400 bg-white/60 dark:bg-white/10 text-purple-950 dark:text-white font-bold shadow-lg transition-colors"
                >
                  <option value="all">Todas las Capillas</option>
                  {chapelOptions.map(chapel => (
                    <option key={chapel} value={chapel}>⛪ {chapel}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Grouped Cantorals by Month */}
        <div className="space-y-8">
          {Object.entries(groupedByMonth).map(([monthYear, cantorals]) => (
            <div key={monthYear}>
              <h2 className="text-lg sm:text-2xl font-bold text-purple-900 dark:text-purple-200 mb-5 capitalize">
                {monthYear}
              </h2>
              <div className="space-y-4">
                {cantorals.map((cantoral) => {
                  const isExpanded = expandedId === cantoral.id;
                  const categories = groupSongsByCategory(cantoral.songs);

                  return (
                    <div
                      key={cantoral.id}
                      className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-4 border-purple-200 dark:border-purple-700 overflow-hidden transition-colors"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : cantoral.id)}
                        className="w-full p-6 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <Church className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                              <div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                                  {cantoral.parishName}
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-400">{cantoral.choirName}</p>
                              </div>
                            </div>
                            
                            {/* Fecha Calendario */}
                            <div className="flex items-center gap-2 text-lg text-gray-700 dark:text-gray-300 mb-2">
                              <Calendar className="w-6 h-6" strokeWidth={2.5} />
                              <span className="capitalize font-bold">{formatDate(cantoral.date)}</span>
                            </div>

                            {/* Calendario Litúrgico */}
                            <div className="flex items-center flex-wrap gap-2 text-lg text-purple-700 dark:text-purple-300 mb-2">
                              <span className="text-2xl">📖</span>
                              <span className="font-bold">{cantoral.liturgicalDate}</span>
                              <LiturgicalColorBadge date={cantoral.date} />
                            </div>

                            {/* Horario + tipo litúrgico */}
                            <div className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300 flex-wrap">
                              <Clock className="w-6 h-6" strokeWidth={2.5} />
                              <span className="font-bold">{cantoral.massTime}</span>
                              {massTypeBadge(cantoral) && (
                                <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 rounded-full px-2 py-0.5">
                                  🕯️ {massTypeBadge(cantoral)}
                                </span>
                              )}
                            </div>
                          </div>

                          {isExpanded ? (
                            <ChevronUp className="w-10 h-10 text-purple-600 dark:text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                          ) : (
                            <ChevronDown className="w-10 h-10 text-purple-600 dark:text-purple-400 flex-shrink-0" strokeWidth={2.5} />
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-base text-gray-600 dark:text-gray-400">
                          <span className="font-bold">{cantoral.songs.length} cantos</span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-6 pt-0 space-y-4">
                          {/* Delete Button */}
                          {onDeleteCantoral && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDeleteId(cantoral.id);
                              }}
                              className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-3 border-red-200 dark:border-red-700 py-4 px-3 sm:px-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="w-6 h-6" strokeWidth={2.5} />
                              Eliminar del Historial
                            </button>
                          )}

                          {/* Download PDF Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(cantoral);
                            }}
                            disabled={downloadingId === cantoral.id}
                            className="w-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-3 border-green-200 dark:border-green-700 py-4 px-3 sm:px-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            {downloadingId === cantoral.id ? (
                              <>
                                <svg className="w-6 h-6 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Generando con partituras…
                              </>
                            ) : (
                              <>
                                <Download className="w-6 h-6" strokeWidth={2.5} />
                                Descargar Cantoral PDF
                              </>
                            )}
                          </button>

                          {/* Songs by Category */}
                          {categories.map((category) => (
                            <div key={category} className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-5 border-3 border-purple-200 dark:border-purple-700 transition-colors">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-3xl">{getCategoryIcon(category)}</span>
                                <h4 className="text-2xl font-bold text-purple-900 dark:text-purple-200">{category}</h4>
                              </div>
                              <div className="space-y-3">
                                {cantoral.songs
                                  .filter(song => song.category === category)
                                  .map((song) => (
                                    <div
                                      key={song.id}
                                      className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-600 transition-colors"
                                    >
                                      <div className="flex items-start gap-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onPlaySong(song);
                                          }}
                                          className="w-12 h-12 flex-shrink-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-lg"
                                        >
                                          <Play className="w-6 h-6" fill="currentColor" strokeWidth={2} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                          <h5 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white leading-tight line-clamp-2">
                                            {song.title}
                                          </h5>
                                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
                                            {song.artist || 'Artista desconocido'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteCantoral}
        title="Eliminar del historial"
        message={`¿Estás seguro de eliminar este cantoral del historial?`}
        details={pendingDeleteCantoral ? `${pendingDeleteCantoral.parishName} · ${pendingDeleteCantoral.liturgicalDate} · ${pendingDeleteCantoral.massTime}` : undefined}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId && onDeleteCantoral) {
            onDeleteCantoral(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}