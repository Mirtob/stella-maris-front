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
  /** Desplaza a la celebración del calendario ese día (fiesta patronal, dedicación…).
   *  Por defecto false: se SUMA, que es lo que no pierde el domingo ni su salmo. */
  replacesDefault?: boolean;
  /** Color litúrgico del día: 'red', 'white'… `undefined` = el del calendario. */
  color?: string;
}

interface Row {
  id: string;
  name: string;
  date: string;
  type: string;
  scope: string;
  replaces_default?: boolean | null;
  color?: string | null;
}

const rowToCustom = (r: Row): CustomLiturgicalDate => ({
  id: r.id,
  name: r.name,
  date: r.date,
  type: r.type === 'feast' ? 'feast' : 'solemnity',
  scope: r.scope,
  replacesDefault: r.replaces_default === true,
  color: r.color ?? undefined,
});

/** Convierte una celebración persistida en LiturgicalDate (para fusionar en el calendario). */
export const toLiturgicalDate = (c: CustomLiturgicalDate): LiturgicalDate => ({
  name: c.name,
  date: c.date,
  type: c.type,
  season: '',
  replacesDefault: c.replacesDefault === true,
  color: c.color,
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
      .select('id,name,date,type,scope,replaces_default,color')
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
  input: {
    name: string; date: string; type?: 'solemnity' | 'feast'; scope: string;
    /** true = desplaza a la del calendario ese día. Por defecto se suma. */
    replacesDefault?: boolean;
    /** Color litúrgico; sin él, el del calendario. */
    color?: string;
  }
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
        replaces_default: input.replacesDefault === true,
        color: input.color ?? null,
      })
      .select('id,name,date,type,scope,replaces_default,color')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, row: rowToCustom(data as Row) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
