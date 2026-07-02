import { getSupabaseClient } from './supabaseClient';
import type { LiturgicalDate } from '../utils/liturgicalCalendar';

/**
 * Celebraciones personalizadas persistidas (solemnidades/fiestas que no están en el
 * calendario general). Las del Administrador son 'global' (para todos); las del coro
 * llevan el scope de su parroquia/capilla. Ver migración 20260702_custom_liturgical_dates
 * y el caché en utils/liturgicalCalendar (setPersistedCustomDates).
 */

export const GLOBAL_SCOPE = 'global';

export interface CustomLiturgicalDate {
  id?: string;
  name: string;
  date: string;            // 'YYYY-MM-DD'
  type: 'solemnity' | 'feast';
  scope: string;           // 'global' | nombre de parroquia/capilla
}

interface Row {
  id: string;
  name: string;
  date: string;
  type: string;
  scope: string;
}

const rowToCustom = (r: Row): CustomLiturgicalDate => ({
  id: r.id,
  name: r.name,
  date: r.date,
  type: r.type === 'feast' ? 'feast' : 'solemnity',
  scope: r.scope,
});

/** Convierte una celebración persistida en LiturgicalDate (para fusionar en el calendario). */
export const toLiturgicalDate = (c: CustomLiturgicalDate): LiturgicalDate => ({
  name: c.name,
  date: c.date,
  type: c.type,
  season: '',
});

/**
 * Trae las celebraciones visibles para el usuario: las globales (de cualquier admin)
 * + las de las parroquias/capillas indicadas (las suyas). Si `parishes` está vacío,
 * devuelve solo las globales.
 */
export async function listCustomLiturgicalDates(parishes: string[] = []): Promise<CustomLiturgicalDate[]> {
  try {
    const sb = getSupabaseClient();
    const scopes = [GLOBAL_SCOPE, ...parishes.filter(Boolean)];
    const { data, error } = await sb
      .from('custom_liturgical_dates')
      .select('id,name,date,type,scope')
      .in('scope', scopes);
    if (error) throw error;
    return (data ?? []).map(rowToCustom);
  } catch (err) {
    console.error('Error listando celebraciones personalizadas:', err);
    return [];
  }
}

/** Crea una celebración personalizada. El admin puede usar scope 'global'. */
export async function addCustomLiturgicalDate(
  input: { name: string; date: string; type?: 'solemnity' | 'feast'; scope: string }
): Promise<{ ok: boolean; row?: CustomLiturgicalDate; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('custom_liturgical_dates')
      .insert({
        name: input.name.trim(),
        date: input.date,
        type: input.type ?? 'solemnity',
        scope: input.scope || GLOBAL_SCOPE,
      })
      .select('id,name,date,type,scope')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, row: rowToCustom(data as Row) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
