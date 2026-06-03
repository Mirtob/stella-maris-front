/**
 * Google Authentication Service — Stella Maris
 *
 * Maneja autenticación con Google OAuth 2.0 usando Supabase Auth.
 *
 * Convención de logging: nunca pasar el objeto `error` completo a console;
 * sólo `error?.message`. Los objetos de error de Supabase a veces incluyen
 * tokens y stack traces internos que podrían leakear info sensible.
 */

import { UserProfile } from '../types';
import {
  signInWithGoogle as supabaseSignInWithGoogle,
  getSession as supabaseGetSession,
  getSessionFromUrl as supabaseGetSessionFromUrl,
  signOut as supabaseSignOut,
} from './supabaseClient';

// ==========================================
// Tipos
// ==========================================

export interface GoogleAuthSession {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    name: string;
    photoUrl?: string;
  };
}

// ==========================================
// Login / Logout
// ==========================================

export async function loginWithGoogle(): Promise<void> {
  const { data, error } = await supabaseSignInWithGoogle();

  if (error) {
    console.error('Login con Google falló:', error?.message);
    throw error;
  }

  if (data?.url) {
    window.location.href = data.url;
    return new Promise(() => {
      // no resolver porque el navegador redirige.
    });
  }

  throw new Error('No se pudo iniciar el flujo de autenticación con Google');
}

export async function logout(): Promise<void> {
  await supabaseSignOut();

  try {
    localStorage.removeItem('stella_maris_user_profile');
  } catch (error: any) {
    console.error('Error limpiando perfil:', error?.message);
  }
}

export async function signOutOnly(): Promise<void> {
  await supabaseSignOut();
}

// ==========================================
// Profile persistence (localStorage)
// ==========================================

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem('stella_maris_user_profile', JSON.stringify(profile));
  } catch (error: any) {
    console.error('Error guardando perfil:', error?.message);
  }
}

export function getStoredUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem('stella_maris_user_profile') || sessionStorage.getItem('stella_maris_user_profile');
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch (error: any) {
    console.error('Error recuperando perfil:', error?.message);
    return null;
  }
}

export function clearUserProfile(): void {
  try {
    localStorage.removeItem('stella_maris_user_profile');
  } catch (error: any) {
    console.error('Error limpiando perfil:', error?.message);
  }
}

// ==========================================
// Session lookup
// ==========================================

export async function getStoredSession(): Promise<GoogleAuthSession | null> {
  const { data, error } = await supabaseGetSession();
  if (error) {
    console.error('Error recuperando sesión:', error?.message);
    return null;
  }

  const session = data?.session;
  if (!session) {
    return null;
  }

  const now = Date.now();
  const expiresAt = (session.expires_at || Math.floor(now / 1000) + 3600) * 1000;
  if (expiresAt < now) {
    await logout();
    return null;
  }

  return mapSupabaseSession(session);
}

export async function getSessionFromUrl(): Promise<GoogleAuthSession | null> {
  const { data, error } = await supabaseGetSessionFromUrl();
  if (error) {
    console.error('Error procesando callback:', error?.message);
    throw error;
  }

  const session = data?.session;
  if (!session) {
    return null;
  }

  return mapSupabaseSession(session);
}

// ==========================================
// Provider tokens — DEPRECATED (S4 mitigation)
//
// Las funciones getYouTubeAccessToken / getGoogleDriveAccessToken fueron
// eliminadas del export público. Permitían a un atacante con XSS leer el
// provider_token de Google desde sessionStorage y suplantar a la cuenta
// `stellamarismusicacatolica@gmail.com` durante hasta 1h.
//
// Estado actual:
//   - Los scopes OAuth solo son identity (email/profile/openid), por lo que
//     el provider_token NO sirve para upload a YouTube/Drive de todas formas.
//   - Los uploads admin se hacen ahora vía YouTube Studio + Sincronización.
//
// TODO post-demo: implementar /api/upload-song con Google service account.
// ==========================================

// ==========================================
// Session → profile mapping
// ==========================================

export function sessionToUserProfile(session: GoogleAuthSession, role?: string): UserProfile {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    photoUrl: session.user.photoUrl,
    role: (role as any) || 'Coro',
  };
}

function mapSupabaseSession(supabaseSession: any): GoogleAuthSession {
  const accessToken = supabaseSession.provider_token || supabaseSession.access_token || '';
  const idToken = supabaseSession.provider_token || supabaseSession.access_token;
  const refreshToken = supabaseSession.provider_refresh_token || supabaseSession.refresh_token || undefined;
  const expiresAt = (supabaseSession.expires_at || Math.floor(Date.now() / 1000) + 3600) * 1000;
  const user = supabaseSession.user || {};
  const userMetadata = user.user_metadata || {};

  return {
    accessToken,
    idToken,
    refreshToken,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: userMetadata.full_name || userMetadata.name || user.email || 'Usuario',
      photoUrl: userMetadata.avatar_url || userMetadata.picture,
    },
  };
}
