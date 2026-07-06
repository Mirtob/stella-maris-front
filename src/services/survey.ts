import { getSupabaseClient } from './supabaseClient';

/**
 * Encuesta de satisfacción del PRE-LANZAMIENTO (Misa de la Asunción, 15-ago-2026).
 * Se dispara al Pueblo fiel que usó el cantoral de esa Misa; al responder, muestra la
 * invitación al lanzamiento oficial. Ver components/survey/PrelaunchSurvey y App.
 */
export const PRELAUNCH = {
  /** Fecha del cantoral pre-lanzamiento (detector). Cambiar aquí si se corre la fecha. */
  date: '2026-08-15',
  survey: 'prelaunch_2026_08',
  /** Fecha del lanzamiento oficial (para la invitación). */
  launchDate: '29 de agosto',
};

export type UsefulMode = 'radio' | 'folleto' | 'atril';

const ANSWERED_KEY = `sm_survey_answered_${PRELAUNCH.survey}`;
const ENGAGED_KEY = `sm_prelaunch_engaged_${PRELAUNCH.survey}`;

export function hasAnsweredSurvey(): boolean {
  try { return localStorage.getItem(ANSWERED_KEY) === '1'; } catch { return false; }
}
export function markSurveyAnswered(): void {
  try { localStorage.setItem(ANSWERED_KEY, '1'); } catch { /* modo privado */ }
}

/** ¿El usuario ya interactuó con el cantoral del pre-lanzamiento? (detector). */
export function isPrelaunchEngaged(): boolean {
  try { return localStorage.getItem(ENGAGED_KEY) === '1'; } catch { return false; }
}
/** Marca engagement SOLO si el cantoral es el del pre-lanzamiento (Asunción, 15-ago). */
export function markPrelaunchEngaged(cantoralDate?: string): void {
  if (cantoralDate !== PRELAUNCH.date) return;
  try { localStorage.setItem(ENGAGED_KEY, '1'); } catch { /* modo privado */ }
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
    markSurveyAnswered();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'No se pudo enviar la encuesta' };
  }
}
