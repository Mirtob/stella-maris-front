import { useState } from 'react';
import { BookOpen, Calendar, Church, Play, Music as MusicIcon, Clock, BookText, ChevronDown, ChevronUp, Download, Filter, Search, Headphones, Edit2, Trash2, QrCode, Archive, SearchX } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { ParishQRDialog } from './ParishQRDialog';
import { AtrilMode } from '../atril/AtrilMode';
import { PublishedCantoral, Song } from '../../types';
import { getCategoryColors } from '../../utils/colors';
import { CantoralWithOrdinary } from './CantoralWithOrdinary';
import { generateCantoralBooklet } from '../../utils/atrilBookletPDF';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { addDaysLocal, getWeekRangeLocal, isWithinInclusive, parseYmdLocal, formatYmdForDisplay } from '../../utils/dateLocal';
import { massTypeBadge, cantoralYaPaso } from '../../utils/massType';
import { parseParishChapel, splitActiveParish } from '../../utils/parish';
import { LiturgicalColorBadge } from '../liturgy/LiturgicalColorBadge';
import { toast } from 'sonner';

interface PublishedCantoralsProps {
  cantorals: PublishedCantoral[];
  loading?: boolean;
  onPlaySong: (song: Song) => void;
  onListen?: (cantoral: PublishedCantoral) => void; // Abrir reproductor "modo radio"
  userRole?: 'Coro' | 'Pueblo fiel' | 'Admin';
  userInstrument?: 'Guitarra' | 'Órgano'; // Para mostrar acordes/partitura según corresponda
  userParishName?: string; // Parroquia del usuario para filtrar
  /** Editar un cantoral publicado (solo Coro/Admin). */
  onEdit?: (cantoralId: string) => void;
  /** Eliminar un cantoral publicado (solo Coro/Admin). */
  onDelete?: (cantoralId: string) => void;
  /** Mostrar el QR del cantoral para compartir/imprimir (solo Coro/Admin). */
  onShare?: (cantoral: PublishedCantoral) => void;
}

// Pueblo fiel solo ve hasta 2 semanas adelante en el dashboard.
const PUEBLO_FIEL_WINDOW_DAYS = 14;

export function PublishedCantorals({ cantorals, loading = false, onPlaySong, onListen, userRole, userInstrument, userParishName, onEdit, onDelete, onShare }: PublishedCantoralsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewingOrdinary, setViewingOrdinary] = useState<string | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // QR permanente de la parroquia (para imprimir y pegar en la iglesia).
  const [showParishQR, setShowParishQR] = useState(false);
  // Cantoral abierto en Modo Atril (solo Coro) — leer el repertorio durante la Misa.
  const [atrilCantoral, setAtrilCantoral] = useState<PublishedCantoral | null>(null);
  // Coro y Admin pueden gestionar (editar/eliminar); el Pueblo fiel solo ve.
  const canManage = userRole !== 'Pueblo fiel';
  const pendingDeleteCantoral = pendingDeleteId ? cantorals.find(c => c.id === pendingDeleteId) : null;
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

  // Filtrar por parroquia activa del usuario (tolerante a espacios y mayúsculas,
  // igual que listCantorals — evita que un cantoral "no aparezca" por diferencias
  // de formato entre la parroquia guardada y la activa).
  if (userParishName) {
    const norm = (s?: string) => (s ?? '').trim().toLowerCase();
    const target = norm(userParishName);
    roleList = roleList.filter(c => norm(c.parishName) === target);
  }

  // ── Ventanas temporales ────────────────────────────────────────────────────
  // Un cantoral está VIGENTE hasta el FIN de su ventana horaria según el tipo de
  // Misa: I Vísperas hasta 23:59 de la víspera; Misa del día hasta las 15:00;
  // II Vísperas hasta 23:59. Pasado ese momento va al archivo. Así, una tarde de
  // domingo la "Misa del día" cede su lugar a las II Vísperas. (Aplica igual a
  // domingos y a solemnidades agregadas manualmente.)
  const now = new Date();
  const esVigente = (c: PublishedCantoral) => !cantoralYaPaso(c, now);

  // Pueblo fiel y la lista principal del Coro: cantorales vigentes (hoy → fecha de la Misa).
  const vigentes = roleList
    .filter(esVigente)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const puebloWindow = vigentes;

  // Coro: "Archivo" = misas ya pasadas (fecha < hoy).
  const archivo = roleList
    .filter(c => !esVigente(c))
    .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)); // más reciente primero

  // ── Filtros del archivo (parroquia → capilla → búsqueda) ───────────────────
  // Nivel 1 = parishFull ("Parroquia - Diócesis"); nivel 2 = capilla real (sep. ' · ').
  const archiveParishOptions = Array.from(
    new Set(archivo.map(c => splitActiveParish(c.parishName).parishFull).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const archiveChapelOptions = Array.from(
    new Set(
      archivo
        .filter(c => archiveParish === 'all' || splitActiveParish(c.parishName).parishFull === archiveParish)
        .map(c => splitActiveParish(c.parishName).chapel)
        .filter((x): x is string => Boolean(x))
    )
  ).sort((a, b) => a.localeCompare(b));

  const archivoFiltered = archivo.filter(c => {
    const { parishFull, chapel } = splitActiveParish(c.parishName);
    if (archiveParish !== 'all' && parishFull !== archiveParish) return false;
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
        data-tour="pf-misas"
        className="bg-white/30 dark:bg-white/10 backdrop-blur-sm rounded-2xl shadow-xl border-2 border-white/40 dark:border-white/20 overflow-hidden transition-colors"
      >
        {/* Cantoral Header */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-3 border-b border-green-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 flex-shrink-0 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <Clock className="w-4 h-4" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                {showDate && (
                  <div className="text-xs opacity-90 mb-0.5 capitalize">
                    {formatDateShort(cantoral.date)} · {cantoral.liturgicalDate}
                  </div>
                )}
                <div className="text-lg sm:text-2xl font-bold mb-1 flex items-center gap-2 flex-wrap">
                  <span>{cantoral.massTime}</span>
                  {massTypeBadge(cantoral) && (
                    <span className="text-[11px] font-bold bg-white/25 border border-white/40 rounded-full px-2 py-0.5 normal-case">
                      🕯️ {massTypeBadge(cantoral)}
                    </span>
                  )}
                </div>
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
          {/* Mismo acomodo en celular y tablet: 2 por fila (las de fila completa
              llevan col-span-2). Íconos flex-shrink-0 y texto que ajusta para que
              no se desborde aunque queden angostos en móvil. */}
          <div className="grid grid-cols-2 gap-3">
            {onListen && (
              <button
                onClick={() => onListen(cantoral)}
                data-tour="pf-escuchar"
                className="bg-gradient-to-br from-rose-600 to-red-700 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-rose-800 col-span-2"
              >
                <Headphones className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                Escuchar cantos
              </button>
            )}

            {/* Modo Atril — solo Coro: leer el repertorio de esta Misa como un solo
                documento (partituras si es Órgano, letra con acordes si es Guitarra). */}
            {userRole === 'Coro' && (
              <button
                onClick={() => setAtrilCantoral(cantoral)}
                className="bg-gradient-to-br from-slate-700 to-slate-900 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-slate-600 col-span-2"
              >
                <MusicIcon className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                Modo Atril
              </button>
            )}
            <button
              onClick={() => setViewingOrdinary(cantoral.id)}
              className="bg-gradient-to-br from-brand to-brand-strong text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm sm:text-base font-bold shadow-lg border-2 border-brand-border leading-tight text-center"
            >
              <BookText className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
              Ver Ordinario
            </button>
            <button
              onClick={() => setExpandedId(isExpandedCantoral ? null : cantoral.id)}
              data-tour="pf-ver-cantos"
              className="bg-gradient-to-br from-green-600 to-green-700 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm sm:text-base font-bold shadow-lg border-2 border-green-800 leading-tight text-center"
            >
              <BookOpen className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
              {isExpandedCantoral ? 'Ocultar' : 'Ver'} Cantos
            </button>
            <button
              onClick={async () => {
                toast.info('Preparando el cuadernillo…');
                try {
                  const { url } = await generateCantoralBooklet(cantoral.songs);
                  const w = window.open(url, '_blank');
                  if (!w) {
                    const a = document.createElement('a');
                    a.href = url; a.download = 'cantoral-cuadernillo.pdf';
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                  }
                  toast.success('Cuadernillo listo', {
                    description: 'Imprime a doble faz y dobla al medio. Si no calzan, cambia el volteo a "borde corto".',
                  });
                } catch {
                  toast.error('No se pudo generar el cuadernillo');
                }
              }}
              className="bg-gradient-to-br from-purple-600 to-purple-700 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-purple-800 col-span-2"
            >
              <Download className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
              Descargar cantoral (libro)
            </button>
          </div>

          {/* Compartir (QR) — disponible para todos los perfiles, incluido Pueblo fiel.
              Editar/Eliminar — solo Coro/Admin, sobre los cantorales de la parroquia activa. */}
          {(onShare || (canManage && (onEdit || onDelete))) && (
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/40 dark:border-white/20">
              {onShare && (
                <button
                  onClick={() => onShare(cantoral)}
                  className="col-span-2 bg-gradient-to-br from-green-600 to-green-700 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-green-800"
                >
                  <QrCode className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                  Compartir (QR)
                </button>
              )}
              {canManage && onEdit && (
                <button
                  onClick={() => onEdit(cantoral.id)}
                  className="bg-gradient-to-br from-blue-700 to-blue-900 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-brand-border"
                >
                  <Edit2 className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                  Editar
                </button>
              )}
              {canManage && onDelete && (
                <button
                  onClick={() => setPendingDeleteId(cantoral.id)}
                  className="bg-gradient-to-br from-red-600 to-red-700 text-white py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all text-base font-bold shadow-lg border-2 border-red-800"
                >
                  <Trash2 className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />
                  Eliminar
                </button>
              )}
            </div>
          )}
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
                            <div className="font-bold text-base text-brand-ink truncate">
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
              className="w-full bg-gradient-to-r from-brand to-brand-strong text-white rounded-xl p-3 shadow border-2 border-brand-border active:scale-98 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-8 h-8 flex-shrink-0 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                    <Calendar className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div className="text-left min-w-0">
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
          userRole={userRole}
          userInstrument={userInstrument}
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
              <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow border-2 border-brand-border">
                <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-xl font-bold text-brand-ink mb-1">
              {userRole === 'Pueblo fiel' ? 'Misas Programadas' : 'Cantorales Publicados'}
            </h1>
            {/* QR permanente disponible desde ya (aunque aún no haya cantorales). */}
            {canManage && userParishName && !loading && (
              <button
                onClick={() => setShowParishQR(true)}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white text-sm font-bold shadow-lg active:scale-95 border-2 border-brand-border"
              >
                <QrCode className="w-4 h-4" strokeWidth={2.5} />
                QR permanente de la parroquia
              </button>
            )}
          </div>

          {canManage && userParishName && (
            <ParishQRDialog
              open={showParishQR}
              parish={userParishName}
              onClose={() => setShowParishQR(false)}
            />
          )}

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
              <h2 className="text-base font-bold text-brand-ink mb-2">
                {userRole === 'Pueblo fiel'
                  ? 'No hay misas programadas próximas'
                  : 'No hay cantorales publicados'}
              </h2>
              <p className="text-xs text-brand-ink-soft mb-3">
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
      {/* Modo Atril de un cantoral publicado (solo Coro). Overlay a pantalla completa. */}
      {atrilCantoral && userRole === 'Coro' && (
        <AtrilMode
          songs={atrilCantoral.songs}
          userRole="Coro"
          userInstrument={userInstrument}
          onClose={() => setAtrilCantoral(null)}
        />
      )}
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-3">
          <div className="flex items-center justify-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-brand to-brand-strong rounded-full flex items-center justify-center shadow border-2 border-brand-border">
              <BookOpen className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-xl font-bold text-brand-ink mb-1">
            {userRole === 'Pueblo fiel' ? 'Misas Programadas' : 'Cantorales Publicados'}
          </h1>
          <p className="text-sm text-brand-ink-soft">
            {userRole === 'Pueblo fiel'
              ? 'Elige el horario de tu Misa'
              : `${vigentes.length} vigente${vigentes.length === 1 ? '' : 's'} · ${archivo.length} en archivo`}
          </p>

          {/* QR PERMANENTE de la parroquia (Coro/Admin): un solo QR estable para
              imprimir y pegar en la iglesia; siempre lleva al cantoral vigente. */}
          {canManage && userParishName && (
            <button
              onClick={() => setShowParishQR(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white text-sm font-bold shadow-lg active:scale-95 border-2 border-brand-border"
            >
              <QrCode className="w-4 h-4" strokeWidth={2.5} />
              QR permanente de la parroquia
            </button>
          )}
        </div>

        {canManage && userParishName && (
          <ParishQRDialog
            open={showParishQR}
            parish={userParishName}
            onClose={() => setShowParishQR(false)}
          />
        )}

        {/* Info Card para Pueblo Fiel */}
        {userRole === 'Pueblo fiel' && (
          <div className="bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-950 dark:to-blue-900 rounded-xl p-3 mb-3 border border-blue-300 dark:border-blue-700 transition-colors">
            <div className="flex gap-3 items-start">
              <div className="text-xl flex-shrink-0 leading-none mt-0.5">📅</div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100 mb-1">Encuentra tu Misa</h3>
                <p className="text-sm text-blue-900 dark:text-blue-200 leading-relaxed">
                  Verás las misas disponibles hasta el día de cada celebración. Consulta horarios y cantos de cada una.
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
              <h2 className="text-lg font-bold text-brand-ink">Vigentes</h2>
            </div>
            {vigentes.length > 0 ? (
              renderDateGroups(vigentes)
            ) : (
              <EmptyState
                compact
                Icon={Calendar}
                title="No hay cantorales vigentes"
                description={
                  userRole === 'Pueblo fiel'
                    ? 'Cuando tu coro publique una misa próxima, aparecerá aquí.'
                    : 'Arma y publica un cantoral desde el Inicio para que aparezca aquí.'
                }
              />
            )}

            {/* Archivo por meses */}
            <div className="flex items-center gap-2 mb-3 mt-8">
              <span className="text-xl">🗂️</span>
              <h2 className="text-lg font-bold text-brand-ink">Archivo</h2>
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
                    className="w-full px-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-brand-ink font-semibold focus:outline-none focus:border-blue-600"
                  >
                    <option value="all">🌍 Todas</option>
                    {archiveParishOptions.map(p => <option key={p} value={p}>⛪ {parseParishChapel(p).parish}</option>)}
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
                      className="w-full px-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-brand-ink font-semibold focus:outline-none focus:border-blue-600"
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
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 text-brand-ink focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {archivoFiltered.length === 0 ? (
              <EmptyState
                compact
                Icon={archivo.length === 0 ? Archive : SearchX}
                title={archivo.length === 0 ? 'Aún no hay cantorales archivados' : 'Sin coincidencias'}
                description={
                  archivo.length === 0
                    ? 'Los cantorales pasados se guardarán aquí automáticamente.'
                    : 'Ningún cantoral coincide con los filtros. Prueba con otros términos.'
                }
              />
            ) : (
              <div className="space-y-6">
                {groupByMonth(archivoFiltered).map(([monthYear, list]) => (
                  <div key={monthYear}>
                    <h3 className="text-base font-bold text-brand-ink mb-3 capitalize">{monthYear}</h3>
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

      <ConfirmDialog
        open={!!pendingDeleteCantoral}
        title="Eliminar cantoral"
        message="¿Eliminar este cantoral publicado? Esta acción no se puede deshacer."
        details={pendingDeleteCantoral ? `${pendingDeleteCantoral.parishName} · ${pendingDeleteCantoral.liturgicalDate} · ${pendingDeleteCantoral.massTime}` : undefined}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId && onDelete) onDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
