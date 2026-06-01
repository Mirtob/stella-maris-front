import { useState, useEffect } from 'react';
import { Song } from '../types';
import { mockSongs } from '../data/songs';
import { getSongs } from '../services/songLoader';

interface UseSongsResult {
  songs: Song[];
  loading: boolean;
}

export function useSongs(): UseSongsResult {
  const [songs, setSongs] = useState<Song[]>(mockSongs);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSongs().then(result => {
      if (!cancelled) {
        setSongs(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { songs, loading };
}
