-- =============================================================================
-- STELLA MARIS — Videos de las cápsulas de formación (leídos del canal)
-- Migration: 20260709_course_videos
--
-- Mapea cada cápsula (capsule_id del currículo) con el id del video de YouTube. Se
-- llena con "Sincronizar videos de Cursos": la app lee el canal y toma el bloque
-- STELLA_MARIS_CURSO de la descripción de cada video (con `capsula: <id>`). Así los
-- que graban solo suben el video con ese bloque, sin tocar el código.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.course_videos (
  capsule_id TEXT PRIMARY KEY,
  video_id   TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar el video de cada cápsula a cualquier usuario).
DROP POLICY IF EXISTS "course_videos_read" ON public.course_videos;
CREATE POLICY "course_videos_read" ON public.course_videos
  FOR SELECT USING (true);

-- Escritura solo admin (la sincronización).
DROP POLICY IF EXISTS "course_videos_admin_write" ON public.course_videos;
CREATE POLICY "course_videos_admin_write" ON public.course_videos
  FOR ALL USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));
