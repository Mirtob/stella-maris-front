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
  recovery_email: string | null;
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
    recoveryEmail: row.recovery_email ?? undefined,
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
      recovery_email: profile.recoveryEmail ?? null,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/**
 * Lee el perfil PERMANENTE del usuario actual desde Supabase por su id.
 * La RLS (`user_profiles_self_select`) permite a cada usuario leer su propia fila.
 *
 * Se usa al iniciar sesión en un dispositivo nuevo: el localStorage está vacío,
 * pero el perfil ya existe en el servidor → lo recuperamos en vez de pedir el
 * setup inicial otra vez. Devuelve null si el usuario aún no tiene perfil.
 */
export async function getCurrentUserProfile(
  userId: string
): Promise<(UserProfile & { createdAt?: string; lastSeenAt?: string }) | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).select('*').eq('id', userId).maybeSingle();
    if (error || !data) return null;
    return rowToProfile(data as UserProfileRow);
  } catch {
    return null;
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

/**
 * Edita campos del perfil de cualquier usuario (solo admin).
 * La policy `user_profiles_admin_all` (is_admin()) permite el UPDATE server-side.
 */
export async function adminUpdateUserProfile(
  id: string,
  fields: { name?: string; instruments?: string[]; parishes?: string[]; parishName?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const row: Record<string, unknown> = {};
    if (fields.name !== undefined) row.name = fields.name;
    if (fields.instruments !== undefined) row.instruments = fields.instruments;
    if (fields.parishes !== undefined) row.parishes = fields.parishes;
    if (fields.parishName !== undefined) row.parish_name = fields.parishName;
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await sb.from(TABLE).update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
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

/**
 * Actualiza solo el recovery_email del usuario actual.
 * Llamado desde ProfileSettings cuando el usuario configura/cambia su email de respaldo.
 *
 * Pasarle `null` lo borra (quitarlo del perfil).
 *
 * El campo está validado con un CHECK constraint server-side (formato email),
 * pero validamos también acá para dar un error claro antes de hacer la roundtrip.
 */
export async function updateRecoveryEmail(
  userId: string,
  recoveryEmail: string | null
): Promise<{ ok: boolean; error?: string }> {
  // Validación client-side: formato email básico
  if (recoveryEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(recoveryEmail)) {
    return { ok: false, error: 'El email no tiene un formato válido' };
  }
  try {
    const sb = getSupabaseClient();
    const { error } = await sb
      .from(TABLE)
      .update({ recovery_email: recoveryEmail })
      .eq('id', userId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/**
 * Busca perfiles cuyo email PRINCIPAL o recovery_email coincide con la query.
 * Usado por el admin en el flujo de recovery cuando un usuario pide acceso
 * desde un email distinto al de su cuenta original.
 *
 * Solo accesible por admin (RLS lo enforza server-side).
 */
export async function findProfilesForRecovery(
  query: string
): Promise<(UserProfile & { createdAt?: string; lastSeenAt?: string })[]> {
  if (!query || query.trim().length < 3) return [];
  const q = query.trim().toLowerCase();
  try {
    const sb = getSupabaseClient();
    // Match en email O recovery_email (case-insensitive)
    const { data, error } = await sb
      .from(TABLE)
      .select('*')
      .or(`email.ilike.%${q}%,recovery_email.ilike.%${q}%`)
      .order('last_seen_at', { ascending: false })
      .limit(20);
    if (error) {
      console.error('Error buscando perfiles para recovery:', error.message);
      return [];
    }
    return ((data ?? []) as UserProfileRow[]).map(rowToProfile);
  } catch (err: any) {
    console.error('Excepción buscando perfiles para recovery:', err?.message);
    return [];
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
