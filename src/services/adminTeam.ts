import { getSupabaseClient } from './supabaseClient';

/**
 * El equipo de administración: quién administra y con qué alcance.
 *
 * La tabla `admins` es la fuente de verdad del acceso (ver la migración
 * 20260901_admin_solo_cantos):
 *
 *   'principal' → acceso total. Uno solo.
 *   'songs'     → solo el catálogo de cantos.
 *
 * Leerla puede cualquier admin; ESCRIBIRLA solo el principal, y eso lo impone la RLS,
 * no esta capa. Hasta ahora dar de alta a alguien era un INSERT a mano en el SQL
 * Editor más un cambio de rol en la app: dos pasos, en dos sitios, fáciles de dejar a
 * medias. Aquí van juntos.
 */

const TABLE = 'admins';

export type AdminRole = 'principal' | 'songs';

export interface AdminRow {
  id: string;
  email: string;
  role: AdminRole;
  addedAt?: string;
  addedBy?: string;
}

function rowToAdmin(row: any): AdminRow {
  return {
    id: row.id,
    email: row.email,
    role: row.role === 'principal' ? 'principal' : 'songs',
    addedAt: row.added_at ?? undefined,
    addedBy: row.added_by ?? undefined,
  };
}

/** Quiénes administran hoy. El principal primero. */
export async function listAdmins(): Promise<AdminRow[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).select('*');
    if (error) {
      console.error('Error listando administradores:', error.message);
      return [];
    }
    return (data ?? [])
      .map(rowToAdmin)
      .sort((a, b) =>
        a.role === b.role ? a.email.localeCompare(b.email) : a.role === 'principal' ? -1 : 1);
  } catch (err: any) {
    console.error('Excepción listando administradores:', err?.message);
    return [];
  }
}

/**
 * Da de alta a un ayudante del catálogo.
 *
 * `.select()` no es decorativo: sin él PostgREST responde 200 aunque la RLS no haya
 * dejado tocar ninguna fila, y la pantalla cantaría "listo" sin haber hecho nada. Es
 * el mismo tropiezo que ya costó una vez en updateUserRole.
 */
export async function addSongAdmin(email: string): Promise<{ ok: boolean; error?: string }> {
  const limpio = email.trim().toLowerCase();
  if (!limpio) return { ok: false, error: 'Falta el correo' };
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from(TABLE)
      .upsert({ email: limpio, role: 'songs', added_by: 'panel' }, { onConflict: 'email' })
      .select();
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) {
      return { ok: false, error: 'La base no dejó guardarlo. Solo el administrador principal puede dar de alta.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}

/** Le quita el acceso de administración a alguien. */
export async function removeAdmin(email: string): Promise<{ ok: boolean; error?: string }> {
  const limpio = email.trim().toLowerCase();
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).delete().eq('email', limpio).select();
    if (error) return { ok: false, error: error.message };
    if (!data || data.length === 0) {
      return { ok: false, error: 'La base no dejó quitarlo. Solo el administrador principal puede hacerlo.' };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}
