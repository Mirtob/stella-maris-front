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
