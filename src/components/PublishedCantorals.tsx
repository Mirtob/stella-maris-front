import { useState } from 'react';
import { BookOpen, Calendar, Church, Play, Music as MusicIcon, Clock, BookText, ChevronDown, ChevronUp, Download, Filter, Search, Headphones } from 'lucide-react';
import { PublishedCantoral, Song } from '../types';
import { getCategoryColors } from '../utils/colors';
import { CantoralWithOrdinary } from './CantoralWithOrdinary';
import { generateCantoralPDF } from '../utils/cantoralPDFGenerator';
import { getTodayLocal, addDaysLocal, getWeekRangeLocal, isWithinInclusive, parseYmdLocal, formatYmdForDisplay } from '../utils/dateLocal';
import { parseParishChapel } from '../utils/parish';
import { LiturgicalColorBadge } from './LiturgicalColorBadge';
import { toast } from 'sonner';

interface PublishedCantoralsProps {
  cantorals: PublishedCantoral[];
  loading?: boolean;
  onPlaySong: (song: Song) => void;
  onListen?: (cantoral: PublishedCantoral) => void; // Abrir reproductor "modo radio"
  userRole?: 'Coro' | 'Pueblo fiel' | 'Admin';
  userParishName?: string; // Parroquia del usuario para filtrar
}

// Pueblo fiel solo ve hasta 2 semanas adelante en el dashboard.
const PUEBLO_FIEL_WINDOW_DAYS = 14;

export function PublishedCantorals({ cantorals, loading = false, onPlaySong, onListen, userRole, userParishName }: PublishedCantoralsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewingOrdinary, setViewingOrdinary] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  // Filtros del archivo (solo Coro)
  const [archiveParish, setArchiveParish] = useState<string>('all');
  const [archiveChapel, setArchiveChapel] = useState<string>('all');
  const [archiveSearch, setArchiveSearch] = useState<string>('');

  const categoryOrder = ['Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio', 'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida'];

  // ── Filtrado base por rol + parroquia ──────────────────────────────────────
  let roleList = cantorals;

  // Pueblo fiel solo ve publicados (no borradores)
  if (userRole === 'Pueblo fiel') {
    roleList = roleList.filter(c => c.status === 'published');
  }

  // Filtrar por parroquia activa del usuario
  if (userParishName) {
    roleList = roleList.filter(c => c.parishName === userParishName);
  }

  // ── Ventanas temporales ────────────────────────────────────────────────────
  const today = getTodayLocal();
  const { end: endOfWeek } = getWeekRangeLocal();

  // Pueblo fiel: hoy → hoy+14 días (las pasadas desaparecen automáticamente)
  const puebloWindow = roleList.filter(c =>
    isWithinInclusive(c.date, today, addDaysLocal(today, PUEBLO_FIEL_WINDOW_DAYS))
  );

  // Coro: "Esta semana" = desde hoy hasta el domingo de esta semana.
  //       "Archivo" = todo lo demás (misas pasadas o futuras más allá del domingo).
  const estaSemana = roleList
    .filter(c => isWithinInclusive(c.date, today, endOfWeek))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const archivo = roleList
    .filter(c => !isWithinInclusive(c.date, today, endOfWeek))
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)); // más reciente primero

  // ── Filtros del archivo (parroquia → capilla → búsqueda) ───────────────────
  const archiveParishOptions = Array.from(
    new Set(archivo.map(c => parseParishChapel(c.parishName).parish).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const archiveChapelOptions = Array.from(
    new Set(
      archivo
        .filter(c => archiveParish === 'all' || parseParishChapel(c.parishName).parish === archiveParish)
        .map(c => parseParishChapel(c.parishName).chapel)
        .filter((x): x is string => Boolean(x))
    )
  ).sort((a, b) => a.localeCompare(b));

  const archivoFiltered = archivo.filter(c => {
    const { parish, chapel } = parseParishChapel(c.parishName);
    if (archiveParish !== 'all' && parish !== archiveParish) return false;
    if (archiveChapel !== 'all' && chapel !== archiveChapel) return false;
    const q = archiveSearch.trim().toLowerCase();
    if (q) {
      const haystack = [c.liturgicalDate, c.parishName, c.choirName, c.massTime, ...c.songs.map(s => s.title)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Lista usada para el empty-state y para resolver "viewingOrdinary"
  const allVisible = userRole === 'Pueblo fiel' ? puebloWindow : roleList;

  // ── Helpers de presentación ────────────────────────────────────────────────
  const groupSongsByCategory = (songs: Song[]) => {
    const grouped = songs.reduce((acc, song) => {
      if (!acc[song.category]) acc[song.category] = [];
      acc[song.category].push(song);
      return acc;
    }, {} as Record<string, Song[]>);

    return Object.keys(grouped).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));
  };

  const formatDateShort = (dateStr: string) =>
    formatYmdForDisplay(dateStr, { weekday: 'short', month: 'short', day: 'numeric' });

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Entrada': '⛪', 'Kyrie': '🙏', 'Gloria': '✨', 'Santo': '✝️', 'Cordero de Dios': '🐑',
      'Credo': '📿', 'Padre Nuestro': '🙏', 'Salmo': '📖', 'Aleluya': '🎺', 'Post Evangelio': '📿',
      'Ofertorio': '🍇', 'Comunión': '🫓', 'Salida': '⛪',
    };
    return icons[category] || '🎵';
  };

  // Agrupa una lista por fecha (más reciente primero)
  const groupByDate = (list: PublishedCantoral[]): [string, PublishedCantoral[]][] => {
    const grouped: Record<string, PublishedCantoral[]> = {};
    list.forEach(c => {
      if (!grouped[c.date]) grouped[c.date] = [];
      grouped[c.date].push(c);
    });
    return Object.entries(grouped).sort((a, b) => (a[0] > b[0] ? -1 : a[0] < b[0] ? 1 : 0));
  };

  // Agrupa una lista (ya ordenada por fecha desc) por "mes año"
  const groupByMonth = (list: PublishedCantoral[]): [string, PublishedCantoral[]][] => {
    const grouped: Record<string, PublishedCantoral[]> = {};
    list.forEach(c => {
      const key = parseYmdLocal(c.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(c);
    });
    return Object.entries(grouped); // insertion order = fecha desc (la lista ya viene ordenada)
  };

  // ── Tarjeta de un cantoral (header + acciones + cantos expandibles) ─────────
  const renderCantoralCard = (cantoral: PublishedCantoral, showDate = false) => {
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
                {showDate && (
                  <div className="text-xs opacity-90 mb-0.5 capitalize">
                    {formatDateShort(cantoral.date)} · {cantoral.liturgicalDate}
                  </div>
                )}
                <div className="text-lg sm:text-2xl font-bold mb-1">{cantoral.massTime}</div>
                <div className="text-sm opacity-90">{cantoral.parishName}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onListen && (
              <button
                onClick={() => onListen(cantoral)}
                className="bg-gradient-to-br from-rose-600 to-red-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-rose-800 col-span-1 sm:col-span-2"
              >
                <Headphones className="w-5 h-5" strokeWidth={2.5} />
                Escuchar cantos
              </button>
            )}
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
                  <div className="flex items-center gap-2 mb-3 text-lg font-bold" style={{ color: colors.text }}>
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                  </div>

                  <div className="space-y-2">
                    {songsInCategory.map((song) => (
                      <button
                        key={song.id}
                        onClick={() => onPlaySong(song)}
                        className="w-full bg-white/40 dark:bg-white/10 backdrop-blur-sm border-2 rounded-xl p-4 flex items-center justify-between active:scale-98 transition-all shadow-md hover:shadow-lg"
                        style={{ borderColor: colors.border }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2 shadow-md"
                            style={{ background: colors.gradient, borderColor: colors.border }}
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
                        <Play className="w-8 h-8 flex-shrink-0 ml-2" strokeWidth={2.5} style={{ color: colors.text }} />
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
  };

  // Renderiza una lista agrupada por fecha (Pueblo fiel y "Esta semana" del Coro)
  const renderDateGroups = (list: PublishedCantoral[]) => (
    <div className="space-y-3">
      {groupByDate(list).map(([date, cantoralsOnDate]) => {
        const isExpanded = expandedDate === date;
        const hasMultipleMasses = cantoralsOnDate.length > 1;

        return (
          <div key={date} className="space-y-3">
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
                    <div className="text-sm opacity-90 mb-1">{formatDateShort(date).toUpperCase()}</div>
                    <div className="text-xl font-bold">{cantoralsOnDate[0].liturgicalDate}</div>
                    <div className="mt-1"><LiturgicalColorBadge date={date} /></div>
                    {hasMultipleMasses && (
                      <div className="text-xs opacity-80">
                        {cantoralsOnDate.length} {cantoralsOnDate.length === 1 ? 'Misa' : 'Misas'}
                      </div>
                    )}
                  </div>
                </div>
                {hasMultipleMasses && (
                  isExpanded ? <ChevronUp className="w-5 h-5" strokeWidth={2.5} /> : <ChevronDown className="w-5 h-5" strokeWidth={2.5} />
                )}
              </div>
            </button>

            {(isExpanded || !hasMultipleMasses) && (
              <div className="space-y-3 pl-0">
                {[...cantoralsOnDate]
                  .sort((a, b) => a.massTime.localeCompare(b.massTime))
                  .map((cantoral) => renderCantoralCard(cantoral, false))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── Vista del ordinario de un cantoral ─────────────────────────────────────
  if (viewingOrdinary) {
    const cantoral = roleList.find(c => c.id === viewingOrdinary);
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

  // ── Empty / loading state ──────────────────────────────────────────────────
  if (allVisible.length === 0) {
    return (
      <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
        <div className="pt-8">
          <div className="text-center mb-3">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-950 rounded-full flex items-center justify-center shadow border-2 border-blue-800">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-blue-950 dark:text-white mb-1">
              {userRole === 'Pueblo fiel' ? 'Misas Programadas' : 'Cantorales Publicados'}
            </h1>
          </div>

          {loading ? (
            <div className="space-y-3" aria-live="polite" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white/40 dark:bg-white/10 rounded-2xl p-4 border-2 border-white/40 dark:border-white/20 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-200/60 dark:bg-blue-800/40" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-blue-200/60 dark:bg-blue-800/40 rounded w-3/4" />
                      <div className="h-2 bg-blue-200/40 dark:bg-blue-800/30 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-2 bg-blue-200/40 dark:bg-blue-800/30 rounded w-2/3" />
                </div>
              ))}
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center pt-2">Buscando cantorales…</p>
            </div>
          ) : (
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/40 dark:border-white/20 text-center transition-colors">
              <MusicIcon className="w-10 h-10 mx-auto mb-2 text-blue-400 dark:text-blue-300" />
              <h2 className="text-base font-bold text-blue-950 dark:text-white mb-2">
                {userRole === 'Pueblo fiel'
                  ? 'No hay misas programadas próximas'
                  : 'No hay cantorales publicados'}
              </h2>
              <p className="text-xs text-blue-900 dark:text-blue-100 mb-3">
                {userRole === 'Pueblo fiel' ? (
                  <>Las misas de las próximas dos semanas<br />aparecerán aquí cuando tu coro las publique</>
                ) : (
                  <>Los cantorales que publiquen los coros de tu parroquia<br />aparecerán aquí para que puedas verlos</>
                )}
              </p>
              {userParishName && (
                <div className="mt-6 bg-blue-100/60 dark:bg-blue-900/40 rounded-xl p-4 border-2 border-blue-300 dark:border-blue-700">
                  <p className="text-sm text-blue-950 dark:text-blue-100 font-semibold mb-2">📍 Tu parroquia:</p>
                  <p className="text-base text-blue-900 dark:text-blue-200">
                    {parseParishChapel(userParishName).parish}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render principal ───────────────────────────────────────────────────────
  // El bloque "Esta semana + Archivo" lo ven el Coro y el Admin; el Pueblo fiel
  // ve solo la lista ventanada a 2 semanas.
  const isCoro = userRole !== 'Pueblo fiel';

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
              : `${estaSemana.length} esta semana · ${archivo.length} en archivo`}
          </p>
        </div>

        {/* Info Card para Pueblo Fiel */}
        {userRole === 'Pueblo fiel' && (
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-xl p-3 mb-3 border border-blue-300 dark:border-blue-700 transition-colors">
            <div className="flex gap-3">
              <div className="text-xl">📅</div>
              <div>
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100 mb-1">Encuentra tu Misa</h3>
                <p className="text-xs text-blue-900 dark:text-blue-200">
                  Verás las misas de las próximas dos semanas. Consulta horarios y cantos de cada una.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Pueblo fiel: lista ventanada por fecha ── */}
        {userRole === 'Pueblo fiel' && renderDateGroups(puebloWindow)}

        {/* ── Coro: "Esta semana" + Archivo ── */}
        {isCoro && (
          <>
            <div className="flex items-center gap-2 mb-3 mt-1">
              <span className="text-xl">📅</span>
              <h2 className="text-lg font-bold text-blue-950 dark:text-white">Esta semana</h2>
            </div>
            {estaSemana.length > 0 ? (
              renderDateGroups(estaSemana)
            ) : (
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/40 dark:border-white/20 text-center text-sm text-blue-900 dark:text-blue-100 mb-2">
                No hay cantorales para lo que resta de esta semana.
              </div>
            )}

            {/* Archivo por meses */}
            <div className="flex items-center gap-2 mb-3 mt-8">
              <span className="text-xl">🗂️</span>
              <h2 className="text-lg font-bold text-blue-950 dark:text-white">Archivo</h2>
            </div>

            {/* Filtros: parroquia → capilla → búsqueda */}
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-4 border border-white/40 dark:border-white/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                    <Filter className="w-3.5 h-3.5" /> Parroquia
                  </label>
                  <select
                    value={archiveParish}
                    onChange={(e) => { setArchiveParish(e.target.value); setArchiveChapel('all'); }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">🌍 Todas</option>
                    {archiveParishOptions.map(p => <option key={p} value={p}>⛪ {p}</option>)}
                  </select>
                </div>
                {archiveParish !== 'all' && archiveChapelOptions.length > 0 && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                      <Church className="w-3.5 h-3.5" /> Capilla
                    </label>
                    <select
                      value={archiveChapel}
                      onChange={(e) => setArchiveChapel(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white font-semibold focus:outline-none focus:border-blue-600"
                    >
                      <option value="all">Todas las capillas</option>
                      {archiveChapelOptions.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 dark:text-blue-300" />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  placeholder="Buscar por fecha litúrgica, canto, horario…"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-blue-950 dark:text-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {archivoFiltered.length === 0 ? (
              <div className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/40 dark:border-white/20 text-center text-sm text-blue-900 dark:text-blue-100">
                {archivo.length === 0 ? 'Aún no hay cantorales archivados.' : 'Ningún cantoral coincide con los filtros.'}
              </div>
            ) : (
              <div className="space-y-6">
                {groupByMonth(archivoFiltered).map(([monthYear, list]) => (
                  <div key={monthYear}>
                    <h3 className="text-base font-bold text-blue-950 dark:text-white mb-3 capitalize">{monthYear}</h3>
                    <div className="space-y-3">
                      {list.map((cantoral) => renderCantoralCard(cantoral, true))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
