import { getSupabaseClient } from './supabaseClient';

const TABLE = 'chapels';

export interface Chapel {
  id: string;
  name: string;
  parishFull: string; // "<Parroquia> - <Diócesis>" de la parroquia madre
  diocese?: string;
  address?: string;
}

export interface NewChapel {
  name: string;
  parishFull: string;
  diocese?: string;
  address?: string;
}

function rowToChapel(row: any): Chapel {
  return {
    id: row.id,
    name: row.name,
    parishFull: row.parish_full,
    diocese: row.diocese ?? undefined,
    address: row.address ?? undefined,
  };
}

/** Lista todas las capillas administradas. Vacío si no hay tabla/red. */
export async function listChapels(): Promise<Chapel[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from(TABLE).select('*').order('name', { ascending: true });
    if (error) {
      console.error('Error listando capillas:', error.message);
      return [];
    }
    return (data ?? []).map(rowToChapel);
  } catch (err) {
    console.error('Excepción listando capillas:', err);
    return [];
  }
}

/** Crea una capilla (solo admin por RLS). */
export async function addChapel(input: NewChapel): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).insert({
      name: input.name.trim(),
      parish_full: input.parishFull.trim(),
      diocese: input.diocese?.trim() || null,
      address: input.address?.trim() || null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error creando capilla' };
  }
}

/** Edita una capilla (nombre/dirección/diócesis) — solo admin por RLS. */
export async function updateChapel(
  id: string,
  fields: { name?: string; address?: string; diocese?: string }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const row: Record<string, unknown> = {};
    if (fields.name !== undefined) row.name = fields.name.trim();
    if (fields.address !== undefined) row.address = fields.address.trim() || null;
    if (fields.diocese !== undefined) row.diocese = fields.diocese.trim() || null;
    if (Object.keys(row).length === 0) return { ok: true };
    const { error } = await sb.from(TABLE).update(row).eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error editando capilla' };
  }
}

/** Elimina una capilla por ID (solo admin por RLS). */
export async function deleteChapel(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Error eliminando capilla' };
  }
}
