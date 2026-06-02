/**
 * ?? Google Authentication Service - Stella Maris
 *
 * Servicio para manejar autenticaci�n con Google OAuth 2.0
 * usando Supabase Auth para producci�n.
 */

import { UserProfile } from '../types';
import {
  signInWithGoogle as supabaseSignInWithGoogle,
  getSession as supabaseGetSession,
  getSessionFromUrl as supabaseGetSessionFromUrl,
  signOut as supabaseSignOut,
} from './supabaseClient';

// ==========================================
// ?? TIPOS
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
// ?? FUNCIONES PRINCIPALES
// ==========================================

export async function loginWithGoogle(): Promise<void> {
  const { data, error } = await supabaseSignInWithGoogle();

  if (error) {
    console.error('? Error en login de Google:', error);
    throw error;
  }

  if (data?.url) {
    window.location.href = data.url;
    return new Promise(() => {
      // no resolver porque el navegador redirige.
    });
  }

  throw new Error('No se pudo iniciar el flujo de autenticaci�n con Google');
}

export async function logout(): Promise<void> {
  await supabaseSignOut();

  try {
    localStorage.removeItem('stella_maris_user_profile');
  } catch (error) {
    console.error('? Error limpiando user profile:', error);
  }
}

export async function signOutOnly(): Promise<void> {
  await supabaseSignOut();
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem('stella_maris_user_profile', JSON.stringify(profile));
    console.log('? Perfil guardado en sessionStorage');
  } catch (error) {
    console.error('? Error guardando perfil:', error);
  }
}

export function getStoredUserProfile(): UserProfile | null {
  try {
    const stored = localStorage.getItem('stella_maris_user_profile') || sessionStorage.getItem('stella_maris_user_profile');
    if (!stored) return null;
    return JSON.parse(stored) as UserProfile;
  } catch (error) {
    console.error('? Error recuperando perfil:', error);
    return null;
  }
}

export function clearUserProfile(): void {
  try {
    localStorage.removeItem('stella_maris_user_profile');
  } catch (error) {
    console.error('? Error limpiando perfil:', error);
  }
}

export async function getStoredSession(): Promise<GoogleAuthSession | null> {
  const { data, error } = await supabaseGetSession();
  if (error) {
    console.error('? Error recuperando sesi�n de Supabase:', error);
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
    console.error('? Error procesando callback de Supabase:', error);
    throw error;
  }

  const session = data?.session;
  if (!session) {
    return null;
  }

  return mapSupabaseSession(session);
}

export function getYouTubeAccessToken(): string | null {
  return getAccessToken();
}

export function getGoogleDriveAccessToken(): string | null {
  return getAccessToken();
}

export function sessionToUserProfile(session: GoogleAuthSession, role?: string): UserProfile {
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    photoUrl: session.user.photoUrl,
    role: (role as any) || 'Coro',
  };
}

function getAccessToken(): string | null {
  try {
    const storage = sessionStorage.getItem('supabase.auth.token');
    if (!storage) return null;

    const parsed = JSON.parse(storage);
    const session = parsed?.currentSession;
    if (!session) return null;

    // Prefer provider access token when available. Supabase stores the Google OAuth token
    // in provider_token, while access_token is the Supabase JWT session token.
    return session.provider_token || session.access_token || null;
  } catch (error) {
    console.error('? Error leyendo token desde storage:', error);
    return null;
  }
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
