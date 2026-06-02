import { useState, useEffect } from 'react';
import { Song } from '../types';
import { SongFilters, listSongs } from '../services/songs';
import { mockSongs } from '../data/songs';

interface UseSongsResult {
  songs: Song[];
  loading: boolean;
}

/**
 * Returns the song catalog from Supabase with optional filters.
 * Falls back to local mock data if Supabase is unreachable or returns nothing.
 *
 * Step 4 note: YouTube API (songLoader.ts) is no longer the data source.
 * songLoader.ts is kept as a standalone import tool for admins.
 */
export function useSongs(filters?: SongFilters): UseSongsResult {
  // Start with mockSongs so components always have data on first render
  // (before the Supabase fetch completes or if it fails)
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [loading, setLoading] = useState(true);

  // Destructure filter primitives to avoid stale closure / infinite re-render
  const massMoment      = filters?.massMoment;
  const liturgicalSeason = filters?.liturgicalSeason;
  const instrument      = filters?.instrument;
  const search          = filters?.search;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listSongs({ massMoment, liturgicalSeason, instrument, search })
      .then(result => {
        if (cancelled) return;
        // If Supabase returns data, use it; otherwise fall back to mock
        setSongs(result.length > 0 ? result : mockSongs);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setSongs(mockSongs);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [massMoment, liturgicalSeason, instrument, search]);

  return { songs, loading };
}
