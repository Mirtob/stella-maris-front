import { useState, useEffect } from 'react';
import { Song } from '../types';
import { SongFilters, listSongs } from '../services/songs';

interface UseSongsResult {
  songs: Song[];
  loading: boolean;
}

/**
 * Returns the song catalog from Supabase with optional filters.
 *
 * IMPORTANTE — sin fallback a mockSongs:
 *   En desarrollo manteníamos mockSongs como fallback para no mostrar pantalla
 *   vacía. Pero en producción eso es un bug serio: el coro podría agregar al
 *   cantoral cantos con youtubeId ficticio (de mocks), publicarlos, y los
 *   pueblos fieles abren el reproductor y nada funciona.
 *   Ahora si Supabase devuelve vacío, devolvemos array vacío — los componentes
 *   muestran su empty state real ("Aún no hay cantos sincronizados").
 */
export function useSongs(filters?: SongFilters): UseSongsResult {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Destructure filter primitives to avoid stale closure / infinite re-render
  const massMoment       = filters?.massMoment;
  const liturgicalSeason = filters?.liturgicalSeason;
  const instrument       = filters?.instrument;
  const search           = filters?.search;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listSongs({ massMoment, liturgicalSeason, instrument, search })
      .then(result => {
        if (cancelled) return;
        // No fallback: si Supabase está vacío, mostramos vacío real.
        setSongs(result);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Error cargando catálogo de cantos:', err?.message);
        setSongs([]);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [massMoment, liturgicalSeason, instrument, search]);

  return { songs, loading };
}
