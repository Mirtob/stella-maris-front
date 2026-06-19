import { getSupabaseClient } from './supabaseClient';

// Llama al endpoint admin (/api/admin-users) con el token del admin actual.
async function callAdmin(action: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; [k: string]: unknown }> {
  const sb = getSupabaseClient();
  const { data: { session } } = await sb.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: 'No autenticado' };

  try {
    const r = await fetch('/api/admin-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (data as any)?.error || 'Error del servidor' };
    return { ok: true, ...(data as object) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo conectar' };
  }
}

/** Crea una cuenta usuario/clave (solo admin). */
export function createUserAccount(username: string, password: string, name?: string) {
  return callAdmin('create', { username, password, name });
}

/** Restablece la clave de una cuenta usuario/clave (solo admin). */
export function resetUserPassword(username: string, password: string) {
  return callAdmin('reset-password', { username, password });
}
