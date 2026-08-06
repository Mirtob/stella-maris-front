import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, GOOGLE_OAUTH_CONFIG } from '../config/api';

const supabaseClient: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export function getSupabaseClient(): SupabaseClient {
  return supabaseClient;
}

export async function signInWithGoogle() {
  return supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: SUPABASE_CONFIG.auth.redirectTo,
      scopes: GOOGLE_OAUTH_CONFIG.scopes.join(' '),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
}

// ── Cuentas de usuario + clave (alternativa a Google) ──────────────────────
// El usuario solo escribe un nombre de usuario; por debajo se mapea a un email
// SINTÉTICO interno (no se envía ningún correo). El correo real es opcional y se
// usa solo para recuperación de clave (recovery_email, asistida por admin).
export const USERNAME_EMAIL_DOMAIN = 'usuario.stellamaris.app';

/** Normaliza un nombre de usuario a su email sintético interno. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${USERNAME_EMAIL_DOMAIN}`;
}

/** ¿El email corresponde a una cuenta de usuario/clave (no Google)? */
export function isUsernameAccount(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`);
}

/** Login con usuario + clave (mapeado al email sintético). */
export async function signInWithUsernamePassword(username: string, password: string) {
  return supabaseClient.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });
}

/**
 * Registro AUTOSERVICIO de una cuenta usuario/clave (para quien no usa Google).
 * Va por el endpoint serverless /api/signup-username, que crea la cuenta con la
 * service-role y `email_confirm: true` (un signUp desde el cliente quedaría sin
 * confirmar y no podría entrar). No inicia sesión: el llamador hace login después.
 *
 * Devuelve `{ ok: true }` o `{ ok: false, error }` con un mensaje humano
 * (nombre ya en uso, clave débil, etc.).
 */
export async function signUpUsernameAccount(
  username: string,
  password: string,
  opts?: { name?: string; email?: string; role?: string; instruments?: string[] },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const r = await fetch('/api/signup-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
        name: opts?.name,
        email: opts?.email?.trim() || undefined,
        role: opts?.role,
        instruments: opts?.instruments,
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: data?.error || 'No se pudo crear la cuenta.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Sin conexión. Revisa tu red e inténtalo de nuevo.' };
  }
}

/**
 * ¿Está libre ese nombre de usuario? Solo para avisar EN VIVO mientras escribe.
 * `available: null` = no se pudo determinar (red o consulta caída) → no mostrar nada.
 * La comprobación definitiva la hace la creación de la cuenta, que devuelve 409.
 */
export async function checkUsernameAvailable(
  username: string,
): Promise<{ valid: boolean; available: boolean | null }> {
  try {
    const r = await fetch('/api/signup-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check', username: username.trim().toLowerCase() }),
    });
    if (!r.ok) return { valid: true, available: null };
    const data = await r.json().catch(() => ({}));
    return { valid: data?.valid !== false, available: data?.available ?? null };
  } catch {
    return { valid: true, available: null };
  }
}

/** Cambia la contraseña del usuario actual. Requiere sesión activa. */
export async function changePassword(newPassword: string) {
  return supabaseClient.auth.updateUser({ password: newPassword });
}

export async function getSession() {
  return supabaseClient.auth.getSession();
}

export async function getSessionFromUrl() {
  if (typeof supabaseClient.auth.getSessionFromUrl === 'function') {
    return supabaseClient.auth.getSessionFromUrl({ storeSession: true });
  }

  // Fallback para algunas versiones/entornos donde Supabase ya detectó la sesión
  // en la URL y no expone el helper getSessionFromUrl.
  return supabaseClient.auth.getSession();
}

export async function signOut() {
  return supabaseClient.auth.signOut();
}
