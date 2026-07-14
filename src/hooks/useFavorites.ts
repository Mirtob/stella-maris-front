import { useCallback, useEffect, useState } from 'react';
import { addFavorite, getFavoriteIds, removeFavorite } from '../services/favorites';

/**
 * Favoritos de cantos ("Mis cantos"). Cache en memoria + evento propio para que el
 * corazón (SongPlayer) y la lista ("Mis cantos") se mantengan sincronizados sin pasar
 * estado por App. Se recarga si cambia el usuario (cambio de cuenta sin recargar).
 */
let cache: Set<string> | null = null;
let cacheUser: string | undefined;
let loadingPromise: Promise<void> | null = null;
const EVT = 'sm-favorites';

function emit() { window.dispatchEvent(new Event(EVT)); }

function ensureLoaded(userId?: string): Promise<void> {
  if (cacheUser === userId && cache) return Promise.resolve();
  if (loadingPromise && cacheUser === userId) return loadingPromise;
  cacheUser = userId;
  loadingPromise = getFavoriteIds().then((set) => {
    cache = set;
    loadingPromise = null;
    emit();
  });
  return loadingPromise;
}

export function useFavorites(userId?: string) {
  const [, force] = useState(0);

  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(EVT, sync);
    ensureLoaded(userId);
    return () => window.removeEventListener(EVT, sync);
  }, [userId]);

  const ready = !!cache && cacheUser === userId;
  const ids = cache ?? new Set<string>();

  const isFavorite = useCallback((songId: string) => (cache ?? new Set()).has(songId), []);

  const toggle = useCallback(async (songId: string) => {
    if (!userId) return;
    const current = cache ?? new Set<string>();
    const on = !current.has(songId);
    // Optimista
    const next = new Set(current);
    if (on) next.add(songId); else next.delete(songId);
    cache = next; emit();
    const ok = on ? await addFavorite(userId, songId) : await removeFavorite(userId, songId);
    if (!ok) {
      const revert = new Set(cache ?? new Set());
      if (on) revert.delete(songId); else revert.add(songId);
      cache = revert; emit();
    }
  }, [userId]);

  return { ids, ready, isFavorite, toggle };
}
