-- =============================================================================
-- STELLA MARIS — Quizzes editables de las cápsulas de formación
-- Migration: 20260709_course_quizzes
--
-- Guarda una versión EDITADA del quiz de una cápsula (sobrescribe el quiz base del
-- código). Así quien graba/edita los cursos puede modificar el texto o el enfoque de
-- las preguntas desde el Panel Admin, sin tocar el código. Lectura pública; escritura
-- de admin.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.course_quizzes (
  capsule_id TEXT PRIMARY KEY,
  quiz       JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_quizzes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_quizzes_read" ON public.course_quizzes;
CREATE POLICY "course_quizzes_read" ON public.course_quizzes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "course_quizzes_admin_write" ON public.course_quizzes;
CREATE POLICY "course_quizzes_admin_write" ON public.course_quizzes
  FOR ALL USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
