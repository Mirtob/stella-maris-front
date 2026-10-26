import { PublishedCantoral } from '../types';
import { getSupabaseClient } from './supabaseClient';
import { rowToCantoral } from './cantorals';
import { camposLegibles } from '../utils/papelera';

/**
 * Papelera de cantorales y registro de cambios (migración 20261028_papelera_y_registro).
 *
 * Borrar un cantoral no lo elimina: un trigger en la base lo manda a la papelera, donde
 * queda 30 días. Por eso `deleteCantoral` no cambió: la regla vive en la base y vale
 * también para cualquier llamada directa a la API.
 */

export { DIAS_PAPELERA, diasRestantes, camposLegibles } from '../utils/papelera';

export interface CantoralEnPapelera {
  cantoral: PublishedCantoral;
  borradoEn: string;
  borradoPor: string | null;
}

/** Lo que el usuario puede restaurar: su parroquia, lo suyo, o todo si es el admin principal. */
export async function listPapelera(): Promise<{ ok: boolean; items: CantoralEnPapelera[]; error?: string }> {
  try {
    const { data, error } = await getSupabaseClient().rpc('papelera_cantorales');
    if (error) return { ok: false, items: [], error: error.message };
    const items = (data ?? []).map((r: { cantoral: any; borrado_por: string | null }) => ({
      cantoral: rowToCantoral(r.cantoral),
      borradoEn: String(r.cantoral?.deleted_at ?? ''),
      borradoPor: r.borrado_por ?? null,
    }));
    return { ok: true, items };
  } catch (e: any) {
    return { ok: false, items: [], error: e?.message || 'No se pudo leer la papelera' };
  }
}

export type ResultadoRestaurar = 'ok' | 'ocupado' | 'no-permitido' | 'no-existe' | 'error';

export async function restaurarCantoral(id: string): Promise<{ resultado: ResultadoRestaurar; error?: string }> {
  try {
    const { data, error } = await getSupabaseClient().rpc('restaurar_cantoral', { p_id: id });
    if (error) return { resultado: 'error', error: error.message };
    const r = String(data) as ResultadoRestaurar;
    return { resultado: ['ok', 'ocupado', 'no-permitido', 'no-existe'].includes(r) ? r : 'error' };
  } catch (e: any) {
    return { resultado: 'error', error: e?.message };
  }
}

/** Solo el admin principal (la base lo comprueba). */
export async function borrarDefinitivo(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await getSupabaseClient().rpc('borrar_cantoral_definitivo', { p_id: id });
    if (error) return { ok: false, error: error.message };
    return data === true ? { ok: true } : { ok: false, error: 'No se pudo eliminar' };
  } catch (e: any) {
    return { ok: false, error: e?.message };
  }
}

// ── Registro de cambios ─────────────────────────────────────────────────────

export type AccionCambio = 'publicar' | 'editar' | 'papelera' | 'restaurar' | 'borrar';

export interface CambioCantoral {
  id: number;
  cantoralId: string;
  accion: AccionCambio;
  quien: string | null;
  parroquia: string;
  fecha: string;
  celebracion: string;
  hora: string;
  detalle: string[];
  cuando: string;
}

/** Lo más reciente primero. La base filtra: el admin principal ve todo; un coro, su parroquia. */
export async function listRegistroCambios(limite = 200): Promise<{ ok: boolean; items: CambioCantoral[]; error?: string }> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('cantoral_changes')
      .select('id, cantoral_id, action, actor_name, parish_name, cantoral_date, liturgical_date, mass_time, detalle, created_at')
      .order('created_at', { ascending: false })
      .limit(limite);
    if (error) return { ok: false, items: [], error: error.message };
    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      cantoralId: r.cantoral_id,
      accion: r.action,
      quien: r.actor_name ?? null,
      parroquia: r.parish_name ?? '',
      fecha: r.cantoral_date ?? '',
      celebracion: r.liturgical_date ?? '',
      hora: r.mass_time ?? '',
      detalle: camposLegibles(r.detalle),
      cuando: r.created_at,
    }));
    return { ok: true, items };
  } catch (e: any) {
    return { ok: false, items: [], error: e?.message || 'No se pudo leer el registro' };
  }
}
