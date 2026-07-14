import { getSupabaseClient } from './supabaseClient';

/**
 * Favoritos de cantos ("Mis cantos"). La tabla `song_favorites` solo guarda la
 * referencia (song_id); los detalles se resuelven de la tabla pública `songs`.
 * RLS filtra por auth.uid(), así que las lecturas devuelven solo lo del usuario.
 */

export async function getFavoriteIds(): Promise<Set<string>> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from('song_favorites').select('song_id');
    if (error || !data) return new Set();
    return new Set(data.map((r: any) => String(r.song_id)));
  } catch {
    return new Set();
  }
}

export async function addFavorite(userId: string, songId: string): Promise<boolean> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb
      .from('song_favorites')
      .upsert({ user_id: userId, song_id: songId }, { onConflict: 'user_id,song_id' });
    return !error;
  } catch {
    return false;
  }
}

export async function removeFavorite(userId: string, songId: string): Promise<boolean> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb
      .from('song_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('song_id', songId);
    return !error;
  } catch {
    return false;
  }
}
