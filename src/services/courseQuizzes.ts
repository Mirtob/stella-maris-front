import { getSupabaseClient } from './supabaseClient';
import type { QuizQuestion } from '../data/courseCurriculum';

/** Quizzes EDITADOS (sobrescriben el base del código). capsuleId → preguntas. */
export async function getQuizOverrides(): Promise<Record<string, QuizQuestion[]>> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb.from('course_quizzes').select('capsule_id, quiz');
    if (error || !data) return {};
    const map: Record<string, QuizQuestion[]> = {};
    for (const r of data as { capsule_id: string; quiz: QuizQuestion[] }[]) {
      if (Array.isArray(r.quiz)) map[r.capsule_id] = r.quiz;
    }
    return map;
  } catch {
    return {};
  }
}

export async function saveQuizOverride(capsuleId: string, quiz: QuizQuestion[]): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('course_quizzes').upsert(
      { capsule_id: capsuleId, quiz, updated_at: new Date().toISOString() },
      { onConflict: 'capsule_id' },
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo guardar' };
  }
}

/** Borra la edición → la cápsula vuelve al quiz base del código. */
export async function resetQuizOverride(capsuleId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('course_quizzes').delete().eq('capsule_id', capsuleId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo restablecer' };
  }
}
