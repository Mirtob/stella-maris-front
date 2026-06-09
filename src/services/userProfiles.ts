import { UserProfile } from '../types';
import { getSupabaseClient } from './supabaseClient';

const TABLE = 'user_profiles';

interface UserProfileRow {
  id: string;
  email: string;
  name: string | null;
  role: 'Coro' | 'Pueblo fiel' | 'Admin';
  instruments: string[] | null;
  parishes: string[] | null;
  parish_name: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

function rowToProfile(row: UserProfileRow): UserProfile & { createdAt?: string; lastSeenAt?: string } {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? row.email,
    role: row.role,
    instruments: (row.instruments ?? []) as any,
    instrument: ((row.instruments ?? [])[0] ?? undefined) as any,
    parishes: row.parishes ?? undefined,
    parishName: row.parish_name ?? undefined,
    photoUrl: row.photo_url ?? undefined,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

/**
 * Inserta o actualiza el perfil del usuario actual en `user_profiles`.
 * Llamado cada vez que un usuario completa setup o cambia algo en su perfil.
 */
export async function upsertCurrentUserProfile(profile: UserProfile): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).upsert({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      instruments: profile.instruments ?? null,
      parishes: profile.parishes ?? null,
      parish_name: profile.parishName ?? null,
      photo_url: profile.photoUrl ?? null,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/** Lista todos los perfiles (solo accesible por admin gracias a la policy). */
export async function listUserProfiles(): Promise<(UserProfile & { createdAt?: string; lastSeenAt?: string })[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).select('*').order('last_seen_at', { ascending: false });
    if (error) {
      console.error('Error listando perfiles:', error.message);
      return [];
    }
    return ((data ?? []) as UserProfileRow[]).map(rowToProfile);
  } catch (err: any) {
    console.error('Excepción listando perfiles:', err?.message);
    return [];
  }
}

/** Cambia el rol de un usuario (solo admin). */
export async function updateUserRole(id: string, role: UserProfile['role']): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).update({ role }).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/** Elimina un perfil (solo admin). Nota: no borra auth.users, solo el row de profile. */
export async function deleteUserProfile(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}
