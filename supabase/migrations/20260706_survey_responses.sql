-- =============================================================================
-- STELLA MARIS — Respuestas de encuesta (pre-lanzamiento)
-- Migration: 20260706_survey_responses
--
-- Encuesta de satisfacción del PRE-LANZAMIENTO (Misa de la Asunción, 15-ago-2026):
-- ¿te resultó interesante? y ¿qué modo de ver los cantos te fue más útil?
-- La responde el Pueblo fiel (puede ser anónimo). Solo el admin lee los resultados.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey      TEXT NOT NULL DEFAULT 'prelaunch_2026_08',
  interesting BOOLEAN,
  -- 'radio' | 'folleto' | 'atril'
  useful_mode TEXT CHECK (useful_mode IN ('radio', 'folleto', 'atril')),
  role        TEXT,
  parish      TEXT,
  user_id     UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS survey_responses_survey_idx ON public.survey_responses (survey);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- INSERT: cualquiera (el Pueblo fiel puede estar anónimo). El cliente limita a 1 por
-- dispositivo (localStorage); es una encuesta, no dato sensible.
DROP POLICY IF EXISTS "survey_insert" ON public.survey_responses;
CREATE POLICY "survey_insert" ON public.survey_responses
  FOR INSERT WITH CHECK (true);

-- SELECT: solo admin (para ver los resultados).
DROP POLICY IF EXISTS "survey_admin_read" ON public.survey_responses;
CREATE POLICY "survey_admin_read" ON public.survey_responses
  FOR SELECT USING ((select public.is_admin()));
