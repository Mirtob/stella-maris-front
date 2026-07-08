-- =============================================================================
-- STELLA MARIS — Progreso de formación (módulo Cursos)
-- Migration: 20260708_course_progress
--
-- Guarda qué cápsulas completó cada usuario (con su puntaje de quiz). El currículo
-- (cápsulas) vive en el código; aquí solo el progreso por usuario. La racha y las
-- insignias se derivan en el cliente a partir de estas filas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.course_progress (
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capsule_id   TEXT NOT NULL,
  quiz_score   INT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, capsule_id)
);

ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona SOLO su progreso.
DROP POLICY IF EXISTS "course_progress_owner" ON public.course_progress;
CREATE POLICY "course_progress_owner" ON public.course_progress
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- El admin puede leer el progreso (estadísticas de formación).
DROP POLICY IF EXISTS "course_progress_admin_read" ON public.course_progress;
CREATE POLICY "course_progress_admin_read" ON public.course_progress
  FOR SELECT USING ((select public.is_admin()));
