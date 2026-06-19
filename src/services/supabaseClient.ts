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
