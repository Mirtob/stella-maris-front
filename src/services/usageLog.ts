/**
 * Registro de uso de la app: qué módulos se abren y quién usa más la app.
 *
 * Escribe con la RPC `log_usage` (toma el usuario de la sesión en el servidor y
 * descarta la misma visita repetida en menos de un minuto) y lee con
 * `usage_summary` / `usage_recent`, que solo responden al administrador
 * principal. Migración: supabase/migrations/20261016_usage_events.sql.
 */
import { getSupabaseClient } from './supabaseClient';
import type { UserRole } from '../types';

// Mismo módulo dos veces seguidas en este teléfono: no se manda otra vez antes
// de este plazo (el servidor igual lo filtra; esto ahorra la llamada).
const LOCAL_DEDUPE_MS = 60_000;
let last: { module: string; at: number } | null = null;

/** Anota la visita a un módulo. Nunca lanza ni bloquea la navegación. */
export function logModuleVisit(module: string, role?: UserRole | null): void {
  const now = Date.now();
  if (last && last.module === module && now - last.at < LOCAL_DEDUPE_MS) return;
  last = { module, at: now };
  try {
    void getSupabaseClient()
      .rpc('log_usage', { p_module: module, p_role: role ?? null })
      .then(({ error }) => { if (error) console.debug('[uso] no se anotó la visita:', error.message); }, () => undefined);
  } catch { /* sin cliente (tests / sin config): no se anota */ }
}

export interface UsageModuleStat { module: string; visits: number; users: number }
export interface UsageUserStat {
  userId: string;
  name: string | null;
  email: string | null;
  role: UserRole | null;
  visits: number;
  activeDays: number;
  lastAt: string;
  topModule: string | null;
}
export interface UsageDayStat { day: string; visits: number; users: number }
export interface UsageSummary {
  days: number;
  totals: { visits: number; users: number };
  modules: UsageModuleStat[];
  users: UsageUserStat[];
  byDay: UsageDayStat[];
}
export interface UsageEvent {
  created_at: string;
  module: string;
  role: UserRole | null;
  user_id: string;
  name: string | null;
  email: string | null;
}

export async function getUsageSummary(days: number): Promise<UsageSummary> {
  const { data, error } = await getSupabaseClient().rpc('usage_summary', { p_days: days });
  if (error) throw new Error(error.message);
  return data as UsageSummary;
}

export async function getRecentUsage(limit = 200): Promise<UsageEvent[]> {
  const { data, error } = await getSupabaseClient().rpc('usage_recent', { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as UsageEvent[];
}
