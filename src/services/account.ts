import { getSupabaseClient } from './supabaseClient';

/**
 * Elimina la cuenta del usuario ACTUAL (perfil + usuario de Auth) vía el endpoint
 * serverless, que valida con el token del propio usuario. Los cantorales publicados
 * (contenido de la comunidad) NO se borran.
 */
export async function deleteMyAccount(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return { ok: false, error: 'No encontramos tu sesión. Inicia sesión de nuevo e inténtalo otra vez.' };

    const res = await fetch('/api/delete-account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body?.error || 'No se pudo eliminar la cuenta.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error de red al eliminar la cuenta.' };
  }
}
