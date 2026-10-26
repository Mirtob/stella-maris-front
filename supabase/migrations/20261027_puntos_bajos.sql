-- =============================================================================
-- STELLA MARIS — Puntos bajos de la revisión de seguridad (26-oct-2026)
-- Migration: 20261027_puntos_bajos
--
-- Se puede aplicar en cualquier momento (no depende del deploy).
--
-- 1. songs.approved_by guardaba el CORREO de quien aprobó, y `songs` la lee
--    cualquiera, también sin sesión. Ahora la app guarda el id (SongManager); aquí se
--    convierten las filas viejas.
-- 2. Funciones pensadas solo para usuarios con sesión se podían llamar como anónimo:
--    Supabase da EXECUTE a anon por omisión, y el GRANT … TO authenticated de las
--    migraciones no lo quitaba (comprobado: course_ranking respondía 200 a anon).
-- 3. survey_responses aceptaba cualquier INSERT: textos de largo libre y un user_id
--    ajeno (la respuesta quedaba a nombre de otra persona).
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

-- ── 1. approved_by: correo → id ──────────────────────────────────────────────
UPDATE public.songs s
   SET approved_by = u.id::text
  FROM auth.users u
 WHERE s.approved_by LIKE '%@%'
   AND lower(u.email) = lower(s.approved_by);

-- Correos que ya no corresponden a ninguna cuenta: no hay id que poner.
UPDATE public.songs SET approved_by = NULL WHERE approved_by LIKE '%@%';

-- ── 2. Solo con sesión ───────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.course_ranking() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.course_ranking() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.rechazar_invitacion(UUID) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.rechazar_invitacion(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.responder_invitacion(UUID, BOOLEAN, TEXT) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.responder_invitacion(UUID, BOOLEAN, TEXT) TO authenticated;

-- ── 3. Encuesta: a nombre propio y con largo acotado ─────────────────────────
-- Sigue abierta sin sesión (la muestra /demo es pública), pero el user_id solo puede
-- ser el propio (o vacío) y los textos tienen tope.
DROP POLICY IF EXISTS "survey_insert" ON public.survey_responses;
CREATE POLICY "survey_insert" ON public.survey_responses
  FOR INSERT WITH CHECK (
    (user_id IS NULL OR user_id = (select auth.uid()))
    AND length(survey) <= 60
    AND COALESCE(length(role), 0) <= 40
    AND COALESCE(length(parish), 0) <= 300
  );

COMMIT;

-- =============================================================================
-- VERIFICACIÓN
--   SELECT count(*) FROM songs WHERE approved_by LIKE '%@%';          -- 0
--   Como anónimo: POST /rest/v1/rpc/course_ranking                    -- 401
-- =============================================================================
