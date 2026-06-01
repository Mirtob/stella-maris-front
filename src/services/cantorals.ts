import { PublishedCantoral } from '../types';
import { getSupabaseClient } from './supabaseClient';

const TABLE = 'published_cantorals';

// Map de DB row → PublishedCantoral (snake_case → camelCase)
function rowToCantoral(row: any): PublishedCantoral {
  return {
    id: row.id,
    choirId: row.choir_id,
    choirName: row.choir_name,
    parishName: row.parish_name,
    date: row.date,
    liturgicalDate: row.liturgical_date,
    massTime: row.mass_time,
    songs: row.songs ?? [],
    status: row.status,
    publishedBy: row.published_by,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function cantoralToRow(c: PublishedCantoral): any {
  return {
    id: c.id,
    choir_id: c.choirId,
    choir_name: c.choirName,
    parish_name: c.parishName,
    date: c.date,
    liturgical_date: c.liturgicalDate,
    mass_time: c.massTime,
    songs: c.songs,
    status: c.status,
    published_by: c.publishedBy,
    published_at: c.publishedAt,
    created_at: c.createdAt,
  };
}

/** Lista cantorales — opcionalmente filtra por parroquia. */
export async function listCantorals(parishName?: string): Promise<PublishedCantoral[]> {
  try {
    const sb = getSupabaseClient();
    let query = sb.from(TABLE).select('*').order('date', { ascending: false });
    if (parishName) query = query.eq('parish_name', parishName);

    const { data, error } = await query;
    if (error) {
      console.error('Error listando cantorales:', error);
      return [];
    }
    return (data ?? []).map(rowToCantoral);
  } catch (err) {
    console.error('Excepción listando cantorales:', err);
    return [];
  }
}

/** Publica (inserta) un cantoral nuevo. */
export async function publishCantoral(cantoral: PublishedCantoral): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).insert(cantoralToRow(cantoral));
    if (error) {
      console.error('Error publicando cantoral:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err: any) {
    console.error('Excepción publicando:', err);
    return { ok: false, error: err.message };
  }
}

/** Elimina un cantoral por ID (solo el creador puede). */
export async function deleteCantoral(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from(TABLE).delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}
