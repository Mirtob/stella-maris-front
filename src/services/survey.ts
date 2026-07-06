import { getSupabaseClient } from './supabaseClient';

/**
 * Encuesta de satisfacción del PRE-LANZAMIENTO (Misa de la Asunción, 15-ago-2026).
 * Se usa en la pantalla de MUESTRA pública (sin login) — ver components/survey/
 * PrelaunchDemo: tras recorrer los 3 modos, encuesta → invitación al lanzamiento.
 */
export const PRELAUNCH = {
  /** Fecha del cantoral de la muestra. Cambiar aquí si se corre la fecha. */
  date: '2026-08-15',
  survey: 'prelaunch_2026_08',
  /** Fecha del lanzamiento oficial (para la invitación). */
  launchDate: '29 de agosto',
};

export type UsefulMode = 'radio' | 'folleto' | 'atril';

/** Id del primer cantoral publicado para la fecha de la muestra (para `/demo` sin id). */
export async function findPrelaunchCantoralId(): Promise<string | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('published_cantorals')
      .select('id')
      .eq('date', PRELAUNCH.date)
      .eq('status', 'published')
      .limit(1);
    if (error) return null;
    return (data && data[0]?.id) || null;
  } catch {
    return null;
  }
}

export interface SurveyResults {
  total: number;
  interestingYes: number;
  interestingNo: number;
  modes: Record<UsefulMode, number>;
}

/** Resultados agregados de la encuesta (solo admin puede leer, por RLS). */
export async function getSurveyResults(): Promise<SurveyResults | null> {
  try {
    const sb = getSupabaseClient();
    const { data, error } = await sb
      .from('survey_responses')
      .select('interesting, useful_mode')
      .eq('survey', PRELAUNCH.survey);
    if (error || !data) return null;
    const res: SurveyResults = {
      total: data.length,
      interestingYes: 0,
      interestingNo: 0,
      modes: { radio: 0, folleto: 0, atril: 0 },
    };
    for (const r of data as { interesting: boolean | null; useful_mode: string | null }[]) {
      if (r.interesting === true) res.interestingYes++;
      else if (r.interesting === false) res.interestingNo++;
      if (r.useful_mode && r.useful_mode in res.modes) res.modes[r.useful_mode as UsefulMode]++;
    }
    return res;
  } catch {
    return null;
  }
}

export async function submitSurvey(input: {
  interesting: boolean;
  usefulMode: UsefulMode;
  role?: string;
  parish?: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getSupabaseClient();
    const { error } = await sb.from('survey_responses').insert({
      survey: PRELAUNCH.survey,
      interesting: input.interesting,
      useful_mode: input.usefulMode,
      role: input.role ?? null,
      parish: input.parish ?? null,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo enviar la encuesta' };
  }
}
