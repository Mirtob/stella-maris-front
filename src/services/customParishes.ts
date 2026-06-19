import { getSupabaseClient } from './supabaseClient';

const TABLE = 'custom_parishes';

export interface CustomParish {
  id: string;
  name: string;
  dioceseId: string;
  dioceseName: string;
  city?: string;
  address?: string;
}

export interface NewCustomParish {
  name: string;
  dioceseId: string;
  dioceseName: string;
  city?: string;
  address?: string;
}

function rowToCustomParish(row: any): CustomParish {
  return {
    id: row.id,
    name: row.name,
    dioceseId: row.diocese_id,
    dioceseName: row.diocese_name,
    city: row.city ?? undefined,
    address: row.address ?? undefined,
  };
}

/** Lista las parroquias administradas (lectura pública). */
export async function listCustomParishes(): Promise<CustomParish[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).select('*').order('name', { ascending: true });
    if (error) { console.error('Error listando parroquias custom:', error.message); return []; }
    return (data ?? []).map(rowToCustomParish);
  } catch (err) {
    console.error('Excepción listando parroquias custom:', err);
    return [];
  }
}

/** Crea una parroquia administrada (solo admin por RLS). */
export async function addCustomParish(input: NewCustomParish): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).insert({
      name: input.name.trim(),
      diocese_id: input.dioceseId,
      diocese_name: input.dioceseName,
      city: input.city?.trim() || null,
      address: input.address?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error creando parroquia' };
  }
}

/** Edita una parroquia administrada (solo admin por RLS). */
export async function updateCustomParish(
  id: string,
  fields: { name?: string; city?: string; address?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const row: Record<string, unknown> = {};
    if (fields.name !== undefined) row.name = fields.name.trim();
    if (fields.city !== undefined) row.city = fields.city.trim() || null;
    if (fields.address !== undefined) row.address = fields.address.trim() || null;
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await sb.from(TABLE).update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error editando parroquia' };
  }
}

/** Elimina una parroquia administrada (solo admin por RLS). */
export async function deleteCustomParish(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error eliminando parroquia' };
  }
}
