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

/** Columnas base (existen desde la primera migración) y las que agregó 20260904. */
const COLS_BASE = 'id,name,date,type,scope';
const COLS = `${COLS_BASE},replaces_default,color`;

/**
 * ¿El error es "esa columna no existe"? Pasa cuando una migración de las que se aplican
 * a mano todavía no se corrió en Supabase. Sin esto, el catálogo entero de celebraciones
 * personalizadas desaparecía en silencio (el SELECT fallaba y devolvía lista vacía) y
 * agregar una nueva se caía sin decir por qué.
 */
const faltaColumna = (err: { code?: string; message?: string } | null): boolean =>
  !!err && (err.code === '42703' || err.code === 'PGRST204' || /column .* does not exist/i.test(err.message ?? ''));

/** Aviso único y en cristiano para cuando falta la migración. */
export const AVISO_MIGRACION_PENDIENTE =
  'Falta aplicar la migración 20260904 en Supabase: por ahora no se guarda el color ni la opción de reemplazar al día.';

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
      .select(COLS)
      .in('scope', scopes);
    if (!error) return (data ?? []).map(rowToCustom);

    // Migración pendiente: se piden solo las columnas de siempre. Las celebraciones
    // se siguen viendo (sin color propio y sin desplazar al día), que es infinitamente
    // mejor que perderlas todas hasta que alguien corra el SQL.
    if (faltaColumna(error)) {
      console.warn(AVISO_MIGRACION_PENDIENTE);
      const { data: base, error: err2 } = await sb
        .from('custom_liturgical_dates')
        .select(COLS_BASE)
        .in('scope', scopes);
      if (err2) throw err2;
      return (base ?? []).map((r) => rowToCustom(r as Row));
    }
    throw error;
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
): Promise<{ ok: boolean; row?: CustomLiturgicalDate; error?: string; warning?: string }> {
  try {
    const sb = getSupabaseClient();
    const base = {
      name: input.name.trim(),
      date: input.date,
      type: input.type ?? 'solemnity',
      scope: input.scope || GLOBAL_SCOPE,
    };
    const { data, error } = await sb
      .from('custom_liturgical_dates')
      .insert({ ...base, replaces_default: input.replacesDefault === true, color: input.color ?? null })
      .select(COLS)
      .single();
    if (!error) return { ok: true, row: rowToCustom(data as Row) };

    // Migración pendiente: se guarda la celebración con lo que la tabla sí acepta y se
    // avisa. Antes esto era un "No se pudo guardar la celebración" a secas y no había
    // forma de agregar nada.
    if (faltaColumna(error)) {
      const { data: row2, error: err2 } = await sb
        .from('custom_liturgical_dates')
        .insert(base)
        .select(COLS_BASE)
        .single();
      if (err2) return { ok: false, error: err2.message };
      return { ok: true, row: rowToCustom(row2 as Row), warning: AVISO_MIGRACION_PENDIENTE };
    }
    return { ok: false, error: error.message };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
