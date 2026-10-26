-- =============================================================================
-- STELLA MARIS — Sin parroquia declarada no se toca lo de nadie
-- Migration: 20261026_parroquia_obligatoria
--
-- EL AGUJERO (revisión de seguridad del 26-oct-2026)
--
-- `user_covers_parish()` (20260824) devolvía TRUE cuando el perfil NO declaraba
-- parroquia: "no se bloquea". Pero:
--   · el registro público (/api/signup-username) deja elegir el rol Coro y crea el
--     perfil SIN parroquia, a propósito;
--   · cada usuario puede vaciar su propia parroquia con un UPDATE a su perfil.
-- Con eso, una cuenta recién creada podía, con una sola llamada directa a PostgREST:
--   · BORRAR los cantorales de TODAS las parroquias (cantorals_delete),
--   · publicar a nombre de cualquier parroquia (cantorals_insert),
--   · contar como "invitada" a cualquier invitación aceptada (user_invited_to_parish).
--
-- 20260911 ya lo había cerrado para las invitaciones con user_covers_parish_strict,
-- pero los cantorales quedaron con la versión permisiva.
--
-- EL ARREGLO
--
-- `user_covers_parish()` pasa a ser estricta: delega en user_covers_parish_strict.
-- Misma firma, así que TODAS las policies y funciones que la usan quedan cerradas
-- sin tocarlas una por una — y cualquier policy futura que la use también. Es la
-- misma regla que 20260901 con is_admin(): cerrado por omisión.
--
-- EFECTO EN USUARIOS REALES
--
-- Un Coro que no declaró parroquia ya no puede publicar hasta completar su perfil
-- (la app lo manda al setup de parroquia en el primer ingreso, así que el caso
-- normal no cambia). Antes de aplicar, revisar cuántos hay:
--
--   SELECT id, email, role FROM user_profiles
--    WHERE role IN ('Coro', 'Admin')
--      AND COALESCE(array_length(parishes, 1), 0) = 0
--      AND COALESCE(btrim(parish_name), '') = '';
--
-- El admin principal no se ve afectado (is_admin() sigue cubriendo todo).
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.user_covers_parish(p_unidad TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.user_covers_parish_strict(p_unidad);
$$;
GRANT EXECUTE ON FUNCTION public.user_covers_parish(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.user_covers_parish(TEXT) IS
  'TRUE si esa parroquia/capilla es del usuario actual (o es admin). Desde 20261026 '
  'EXIGE que el perfil declare la parroquia: sin parroquia no cubre ninguna.';

COMMIT;

-- =============================================================================
-- VERIFICACIÓN (como cualquier usuario con sesión y SIN parroquia; debe dar false):
--   SELECT public.user_covers_parish('Cualquier Parroquia - Diócesis X');
--
-- Prueba de punta a punta (opt-in, escribe en producción y limpia):
--   node tests/security/parroquia-ajena.mjs
-- =============================================================================
