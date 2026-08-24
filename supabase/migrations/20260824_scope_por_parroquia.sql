-- =============================================================================
-- STELLA MARIS — Publicar y agregar celebraciones, solo en la parroquia propia
-- Migration: 20260824_scope_por_parroquia
--
-- La migración anterior (20260823) exigió el ROL: solo Coro o Admin publican. Faltaba
-- el otro lado: **en qué parroquia**. Tal como está, un miembro del coro de la
-- parroquia A puede publicar un cantoral con `parish_name` de la parroquia B, o
-- agregarle una celebración a su calendario. Ninguna pantalla lo ofrece, pero la API
-- de Supabase es alcanzable directamente con el token de esa cuenta.
--
-- ALCANCE REAL DE ESTA MIGRACIÓN — leer antes de confiar en ella
--
-- La parroquia del usuario es **autodeclarada**: cada uno edita su propia fila de
-- `user_profiles` (política `user_profiles_self_update`). Así que esto es una
-- BARANDA, no un muro: frena el accidente y el abuso casual (que es lo que se
-- reportó), pero quien quiera saltárselo puede declararse de la parroquia ajena y
-- volver a intentarlo.
--
-- El muro de verdad sería una membresía verificada (una tabla `parish_members` que
-- solo el admin o el párroco puedan aprobar). Es una función nueva, no una policy;
-- queda anotada como el siguiente paso si algún día hace falta.
--
-- Además, a propósito: si el perfil **no declara ninguna parroquia** no se bloquea.
-- El perfil se sincroniza en segundo plano (`upsertCurrentUserProfile` es
-- fire-and-forget); si esa escritura falló alguna vez, bloquear dejaría a un coro
-- sin poder publicar un domingo por la mañana, y eso es peor que el riesgo que se
-- está cubriendo.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

-- ── ¿La unidad (parroquia o capilla) es del usuario? ─────────────────────────
-- Una capilla se identifica como "<Parroquia> - <Diócesis> · <Capilla>" (ver
-- src/utils/parish.ts, CHAPEL_SEP). Se compara por prefijo exacto, no con LIKE,
-- para no tener que escapar los `%` y `_` que pueda traer un nombre.
CREATE OR REPLACE FUNCTION public.user_covers_parish(p_unidad TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(btrim(p_unidad), '') <> ''
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.user_profiles p
        WHERE p.id = auth.uid()
          AND (
            -- Perfil sin parroquia declarada: no se bloquea (ver nota de arriba).
            (COALESCE(array_length(p.parishes, 1), 0) = 0
             AND COALESCE(btrim(p.parish_name), '') = '')
            -- La parroquia (o capilla) tal cual, en cualquiera de los dos campos.
            OR p_unidad = p.parish_name
            OR p_unidad = ANY (COALESCE(p.parishes, ARRAY[]::TEXT[]))
            -- Una capilla que cuelga de su parroquia.
            OR left(p_unidad, length(p.parish_name) + 3) = p.parish_name || ' · '
            OR EXISTS (
              SELECT 1
              FROM unnest(COALESCE(p.parishes, ARRAY[]::TEXT[])) AS q
              WHERE left(p_unidad, length(q) + 3) = q || ' · '
            )
          )
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_covers_parish(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.user_covers_parish(TEXT) IS
  'TRUE si esa parroquia/capilla es del usuario actual (o es admin). La parroquia es '
  'autodeclarada: sirve de baranda, no de muro. Ver 20260824_scope_por_parroquia.';

-- ── published_cantorals: solo en la parroquia propia ─────────────────────────
DROP POLICY IF EXISTS "cantorals_insert" ON public.published_cantorals;
CREATE POLICY "cantorals_insert" ON public.published_cantorals
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
    AND public.user_covers_parish(parish_name)
  );

-- El dueño ya era el único que podía editar el suyo; ahora tampoco puede MOVERLO
-- a otra parroquia editándolo.
DROP POLICY IF EXISTS "cantorals_update" ON public.published_cantorals;
CREATE POLICY "cantorals_update" ON public.published_cantorals
  FOR UPDATE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin())
  )
  WITH CHECK (
    ((created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin()))
    AND public.user_covers_parish(parish_name)
  );

-- ── custom_liturgical_dates: la celebración, en la parroquia propia ──────────
-- 'global' sigue siendo exclusivo del admin.
DROP POLICY IF EXISTS "cld_insert" ON public.custom_liturgical_dates;
CREATE POLICY "cld_insert" ON public.custom_liturgical_dates
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
    AND CASE
          WHEN scope = 'global' THEN (select public.is_admin())
          ELSE public.user_covers_parish(scope)
        END
  );

-- ── Comprobación (correr después de aplicar) ─────────────────────────────────
-- Con una cuenta de Coro de la parroquia X:
--   • publicar con parish_name = X            → funciona
--   • publicar con parish_name = 'X · Capilla Y' → funciona
--   • publicar con parish_name = otra parroquia  → falla con row-level security
-- Automatizado en tests/security/parroquia-ajena.mjs
