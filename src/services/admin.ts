import { getSupabaseClient } from './supabaseClient';

/**
 * Server-authoritative admin check via Supabase RPC `is_admin()`.
 * Replaces the previous client-side ADMIN_EMAILS array which was trivially
 * bypassable from DevTools.
 *
 * The actual permission to perform admin operations (modify songs, see drafts
 * of other users, etc.) is enforced by Row Level Security on the database —
 * this function is used only to decide whether to *show* the admin UI.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('is_admin');
    if (error) {
      console.error('Error verificando rol admin:', error.message);
      return false;
    }
    return data === true;
  } catch (err: any) {
    console.error('Excepción verificando rol admin:', err?.message);
    return false;
  }
}
