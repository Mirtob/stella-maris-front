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

/**
 * Nivel de administración de quien está conectado.
 *
 *   'principal' → acceso total al panel (un solo correo).
 *   'songs'     → SOLO la gestión de cantos. Es el perfil de quien ayuda a subir y
 *                 transcribir el catálogo: ve el panel, pero con una sola puerta.
 *   null        → no es admin.
 *
 * Igual que `isCurrentUserAdmin`, esto decide únicamente QUÉ SE MUESTRA. Lo que de
 * verdad manda son las policies de la base (migración 20260901_admin_solo_cantos):
 * aunque alguien fuerce este valor desde el navegador, la base le va a rechazar todo
 * lo que no sea el catálogo.
 */
export type AdminLevel = 'principal' | 'songs' | null;

export async function getAdminLevel(): Promise<AdminLevel> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.rpc('admin_level');
    if (error) {
      // La migración todavía no está aplicada: se cae al chequeo antiguo para no
      // dejar al administrador fuera de su propio panel.
      console.error('Error leyendo el nivel de admin:', error.message);
      return (await isCurrentUserAdmin()) ? 'principal' : null;
    }
    return data === 'principal' || data === 'songs' ? data : null;
  } catch (err: any) {
    console.error('Excepción leyendo el nivel de admin:', err?.message);
    return null;
  }
}
