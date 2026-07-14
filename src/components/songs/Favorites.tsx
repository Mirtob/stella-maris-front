import { useEffect, useMemo, useState } from 'react';
import { Heart, Play, Loader, Music } from 'lucide-react';
import { Song } from '../../types';
import { useFavorites } from '../../hooks/useFavorites';
import { listSongsByIds } from '../../services/songs';
import { FavoriteButton } from './FavoriteButton';

/**
 * "Mis cantos" — la lista de favoritos del usuario. Resuelve los detalles desde la tabla
 * pública `songs` (solo se listan los que siguen en el catálogo). Tocar un canto lo abre
 * en el reproductor (letra + audio).
 */
export function Favorites({ userId, onPlaySong }: { userId?: string; onPlaySong: (song: Song) => void }) {
  const { ids, ready } = useFavorites(userId);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Clave estable del conjunto: evita recargar si el contenido no cambió.
  const idsKey = useMemo(() => Array.from(ids).sort().join(','), [ids]);

  useEffect(() => {
    let active = true;
    const list = idsKey ? idsKey.split(',') : [];
    if (list.length === 0) { setSongs([]); setLoading(false); return; }
    setLoading(true);
    listSongsByIds(list).then((fetched) => {
      if (!active) return;
      const set = new Set(list);
      setSongs(fetched.filter((s) => set.has(s.id)).sort((a, b) => a.title.localeCompare(b.title, 'es')));
      setLoading(false);
    });
    return () => { active = false; };
  }, [idsKey]);

  return (
    <div className="w-full max-w-md md:max-w-2xl mx-auto min-h-screen p-4 sm:p-6 pb-24 bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 transition-colors">
      <div className="pt-8">
        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Heart className="w-7 h-7 text-white fill-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-brand-ink leading-none">Mis cantos</h1>
            <p className="text-sm text-brand-ink-soft mt-1">Los cantos que guardaste para practicar o rezar</p>
          </div>
        </div>

        {(!ready || loading) ? (
          <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-brand" /></div>
        ) : songs.length === 0 ? (
          <div className="mt-10 text-center bg-white/60 dark:bg-white/10 rounded-2xl p-8 border-2 border-blue-200 dark:border-blue-800">
            <Heart className="w-12 h-12 text-rose-300 mx-auto mb-3" strokeWidth={2} />
            <p className="text-brand-ink font-bold text-lg mb-1">Aún no tienes cantos guardados</p>
            <p className="text-brand-ink-soft text-sm">Cuando abras un canto, toca el <span className="inline-flex items-center align-middle"><Heart className="w-4 h-4 text-rose-500 fill-rose-500 mx-1" /></span> para guardarlo aquí.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2.5">
            {songs.map((song) => (
              <div
                key={song.id}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 bg-white dark:bg-slate-800 border-blue-100 dark:border-slate-700 transition-all"
              >
                <button
                  onClick={() => onPlaySong(song)}
                  className="w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand to-brand-strong text-white flex items-center justify-center active:scale-95 transition-all shadow border-2 border-brand-border"
                  aria-label={`Abrir ${song.title}`}
                >
                  <Play className="w-5 h-5" fill="currentColor" strokeWidth={2} />
                </button>
                <button onClick={() => onPlaySong(song)} className="flex-1 min-w-0 text-left">
                  <div className="font-bold text-brand-ink leading-tight truncate">{song.title}</div>
                  <div className="text-xs text-brand-ink-soft flex items-center gap-1.5 truncate">
                    <Music className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{song.category}{song.author ? ` · ${song.author}` : ''}</span>
                  </div>
                </button>
                <FavoriteButton songId={song.id} userId={userId} className="text-rose-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
