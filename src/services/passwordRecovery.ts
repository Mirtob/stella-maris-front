// Recuperación de clave self-service (cuentas usuario/clave). Endpoint público.
async function call(action: string, payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string; needsEmail?: boolean; sent?: boolean; to?: string }> {
  try {
    const r = await fetch('/api/recover-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: (data as any)?.error || 'Error del servidor' };
    return { ok: true, ...(data as object) };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo conectar' };
  }
}

/** Pide el código de recuperación. Si no hay correo de respaldo, pide uno (needsEmail). */
export function requestPasswordReset(username: string, email?: string) {
  return call('request', email ? { username, email } : { username });
}

/** Confirma el código y fija la nueva clave. */
export function confirmPasswordReset(username: string, code: string, password: string) {
  return call('confirm', { username, code, password });
}

/**
 * Recuperar el USUARIO olvidado a partir del correo de respaldo. Por privacidad la
 * respuesta es genérica (no revela si el correo existe); el nombre se envía SOLO al
 * correo. Devuelve ok también cuando no hay coincidencias.
 */
export function recoverUsername(email: string) {
  return call('find-username', { email });
}
