import { Music, Search, Trash2, FileText, Youtube, Loader, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Song } from '../../types';
import { listSongs, deleteSong } from '../../services/songs';
import { matchesSearch } from '../../utils/textSearch';
import { ConfirmDialog } from '../common/ConfirmDialog';

/**
 * Admin SongManager — conectado a la tabla `songs` de Supabase.
 * Lista, busca y elimina cantos del catálogo real (los mismos que ve el coro).
 *
 * Para agregar cantos: el admin sube el video a YouTube con el bloque
 * STELLA_MARIS_META y luego usa "Sincronizar YouTube" (YouTubeSyncDialog).
 */
export function SongManager() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteSong = pendingDeleteId ? songs.find(s => s.id === pendingDeleteId) : null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // No pasamos filtros — admin ve todo el catálogo.
      const data = await listSongs({ limit: 500 });
      setSongs(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categories = [
    'Todos',
    'Entrada',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Ofertorio',
    'Santo',
    'Cordero de Dios',
    'Comunión',
    'Salida',
  ];

  const filteredSongs = songs.filter(song => {
    const matchesText =
      matchesSearch(song.title, searchTerm) ||
      matchesSearch(song.artist, searchTerm) ||
      matchesSearch(song.author, searchTerm);
    const matchesCategory = filterCategory === 'Todos' || song.category === filterCategory;
    return matchesText && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Entrada': 'bg-purple-100 text-purple-700 border-purple-300',
      'Kyrie': 'bg-blue-100 text-blue-700 border-blue-300',
      'Gloria': 'bg-amber-100 text-amber-700 border-amber-300',
      'Salmo': 'bg-green-100 text-green-700 border-green-300',
      'Aleluya': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Ofertorio': 'bg-orange-100 text-orange-700 border-orange-300',
      'Santo': 'bg-red-100 text-red-700 border-red-300',
      'Cordero de Dios': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      'Comunión': 'bg-teal-100 text-teal-700 border-teal-300',
      'Salida': 'bg-gray-100 text-gray-700 border-gray-300',
    };
    return colors[category] ?? 'bg-slate-100 text-slate-700 border-slate-300';
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    // Optimistic
    setSongs(prev => prev.filter(s => s.id !== id));
    const r = await deleteSong(id);
    if (!r.ok) {
      toast.error('No se pudo eliminar el canto', { description: r.error });
      load();
    } else {
      toast.success('Canto eliminado');
    }
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-3 sm:p-4 md:p-6 pb-24 bg-gradient-to-br from-purple-50 via-blue-50 to-amber-50 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-16">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-3">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <Music className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 dark:text-white mb-1">Gestión de Cantos</h1>
          <p className="text-base sm:text-lg text-purple-700 dark:text-purple-200">
            {loading ? 'Cargando…' : `${songs.length} cantos en el catálogo`}
          </p>
        </div>

        {/* Refresh */}
        <button
          onClick={load}
          disabled={loading}
          className="w-full mb-4 py-2 bg-white dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-blue-700 dark:text-blue-200 font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refrescar desde Supabase
        </button>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título o autor (con o sin acentos)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-blue-400"
            aria-label="Buscar canto"
          />
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-3 text-base border-2 border-blue-200 dark:border-blue-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:border-blue-400 bg-white font-bold"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todos' ? 'Todas las categorías' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white/60 dark:bg-white/5 rounded-2xl p-5 animate-pulse h-32" />
            ))}
          </div>
        )}

        {/* Songs List */}
        {!loading && (
          <div className="space-y-3">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-4 sm:p-5 border-2 border-gray-200 dark:border-slate-700"
              >
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex-1 min-w-0 leading-tight line-clamp-2">
                      {song.title}
                    </h3>
                    <div className={`px-2 py-1 rounded-lg border-2 text-xs sm:text-sm font-bold flex-shrink-0 ${getCategoryColor(song.category)}`}>
                      {song.category}
                    </div>
                  </div>
                  {(song.author || song.artist) && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 truncate">
                      {song.author || song.artist}
                    </p>
                  )}
                  {song.massName && (
                    <div className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200 px-2 py-1 rounded-lg border border-purple-300 dark:border-purple-700 text-xs font-bold">
                      <Music className="w-3 h-3" />
                      {song.massName}
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-3 gap-2 mb-3 bg-gray-50 dark:bg-slate-900 rounded-xl p-3 border border-gray-200 dark:border-slate-700">
                  <div className="text-center min-w-0">
                    <Youtube className="w-5 h-5 text-red-600 mx-auto mb-1" />
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">YouTube</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white truncate" title={song.youtubeId}>
                      {song.youtubeId || '—'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-base mb-1">⏱️</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">Duración</div>
                    <div className="text-xs font-bold text-gray-800 dark:text-white">{song.duration || '—'}</div>
                  </div>
                  <div className="text-center">
                    <FileText className={`w-5 h-5 mx-auto mb-1 ${song.sheetMusicUrl ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="text-[10px] text-gray-600 dark:text-gray-400">Partitura</div>
                    <div className={`text-xs font-bold ${song.sheetMusicUrl ? 'text-green-600' : 'text-gray-400'}`}>
                      {song.sheetMusicUrl ? 'Sí' : 'No'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setPendingDeleteId(song.id)}
                    aria-label={`Eliminar ${song.title}`}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 active:scale-95 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Eliminar</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredSongs.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <p className="text-base text-gray-600 dark:text-gray-300">No se encontraron cantos</p>
                {songs.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Sube cantos al canal de YouTube y usa "Sincronizar YouTube" para poblar el catálogo.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {!loading && songs.length > 0 && (
          <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border-2 border-purple-200 dark:border-purple-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Estadísticas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 border-2 border-blue-200 dark:border-blue-700">
                <div className="text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-200">{songs.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Total cantos</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 border-2 border-green-200 dark:border-green-700">
                <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-green-200">
                  {songs.filter(s => !!s.sheetMusicUrl).length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">Con partitura</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDeleteSong}
        title="Eliminar canto del catálogo"
        message={`¿Eliminar "${pendingDeleteSong?.title}" del catálogo? Esta acción no se puede deshacer.`}
        details={pendingDeleteSong?.author || pendingDeleteSong?.artist}
        confirmLabel="Sí, eliminar"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
