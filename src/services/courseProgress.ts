import { getSupabaseClient } from './supabaseClient';

export interface CapsuleProgress {
  capsuleId: string;
  quizScore: number | null;
  completedAt: string; // ISO
}

export async function getMyProgress(userId: string): Promise<CapsuleProgress[]> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('course_progress')
      .select('capsule_id, quiz_score, completed_at')
      .eq('user_id', userId);
    if (error || !data) return [];
    return data.map((d: any) => ({ capsuleId: d.capsule_id, quizScore: d.quiz_score, completedAt: d.completed_at }));
  } catch {
    return [];
  }
}

export async function completeCapsule(userId: string, capsuleId: string, quizScore: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('course_progress').upsert(
      { user_id: userId, capsule_id: capsuleId, quiz_score: quizScore, completed_at: new Date().toISOString() },
      { onConflict: 'user_id,capsule_id' },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo guardar el avance' };
  }
}

// ── Racha (semanas consecutivas con al menos una cápsula completada) ──────────

/** Clave ISO-semana (lunes) de una fecha, p. ej. "2026-W28". */
function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7; // lunes=1 … domingo=7
  t.setUTCDate(t.getUTCDate() + 4 - day); // jueves de la semana
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
function weekIndex(d: Date): number {
  // Número absoluto de semana (para medir consecutividad) = días desde epoch / 7 (lunes).
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() - (day - 1)); // lunes de la semana
  return Math.floor(t.getTime() / (7 * 86400000));
}

/**
 * Racha de semanas consecutivas formándose. Se mantiene viva si hay actividad esta
 * semana o la pasada; cuenta hacia atrás mientras no haya huecos.
 */
export function computeStreakWeeks(completedAt: string[], now: Date = new Date()): number {
  if (!completedAt.length) return 0;
  const weeks = new Set(completedAt.map((s) => weekIndex(new Date(s))));
  const current = weekIndex(now);
  // Ancla: la semana actual si tiene actividad; si no, la pasada (gracia de 1 semana).
  let anchor: number;
  if (weeks.has(current)) anchor = current;
  else if (weeks.has(current - 1)) anchor = current - 1;
  else return 0;
  let streak = 0;
  let w = anchor;
  while (weeks.has(w)) { streak++; w--; }
  return streak;
}

export { isoWeekKey };
