-- =============================================================================
-- STELLA MARIS — Performance: auth_rls_initplan
-- Migration: 20260612_rls_initplan_perf
--
-- El linter (Performance) marca "Auth RLS Initialization Plan": las policies que
-- llaman auth.uid() / auth.role() / is_admin() DIRECTO se reevaluan UNA VEZ POR
-- FILA. Envolviendo la llamada en `(select ...)`, el planner la evalua una sola
-- vez por query (como initPlan). Misma semantica, mejor rendimiento al crecer las
-- tablas.
--
-- Solo se reescriben las llamadas NO correlacionadas (sin columnas de la fila):
--   auth.uid()  -> (select auth.uid())
--   auth.role() -> (select auth.role())
--   is_admin()  -> (select public.is_admin())
--
-- `is_cantoral_pdf_owner(name)` NO se envuelve: depende de la columna `name` (es
-- correlacionada), el planner no puede hoistearla y el linter no la marca.
--
-- Se recrean idénticas salvo el wrap. No cambia ninguna regla de acceso.
-- =============================================================================

BEGIN;

-- ── songs ───────────────────────────────────────────────────────────────────
-- (songs_public_read no usa auth.*, no se toca)
DROP POLICY IF EXISTS "songs_admin_all" ON public.songs;
CREATE POLICY "songs_admin_all" ON public.songs
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ── admins ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "admins_select_admin" ON public.admins;
CREATE POLICY "admins_select_admin" ON public.admins
  FOR SELECT
  USING ((select public.is_admin()));

DROP POLICY IF EXISTS "admins_modify_admin" ON public.admins;
CREATE POLICY "admins_modify_admin" ON public.admins
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ── published_cantorals ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "cantorals_select" ON public.published_cantorals;
CREATE POLICY "cantorals_select" ON public.published_cantorals
  FOR SELECT
  USING (
    (select auth.uid()) IS NOT NULL AND (
      status = 'published'
      OR created_by IS NULL
      OR created_by = (select auth.uid())
      OR (select public.is_admin())
    )
  );

DROP POLICY IF EXISTS "cantorals_insert" ON public.published_cantorals;
CREATE POLICY "cantorals_insert" ON public.published_cantorals
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
  );

DROP POLICY IF EXISTS "cantorals_update" ON public.published_cantorals;
CREATE POLICY "cantorals_update" ON public.published_cantorals
  FOR UPDATE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin())
  )
  WITH CHECK (
    (created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin())
  );

DROP POLICY IF EXISTS "cantorals_delete" ON public.published_cantorals;
CREATE POLICY "cantorals_delete" ON public.published_cantorals
  FOR DELETE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin())
  );

-- ── user_profiles ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_profiles_self_select" ON public.user_profiles;
CREATE POLICY "user_profiles_self_select" ON public.user_profiles
  FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "user_profiles_self_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_self_insert" ON public.user_profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "user_profiles_self_update" ON public.user_profiles;
CREATE POLICY "user_profiles_self_update" ON public.user_profiles
  FOR UPDATE USING (id = (select auth.uid())) WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "user_profiles_admin_all" ON public.user_profiles;
CREATE POLICY "user_profiles_admin_all" ON public.user_profiles
  FOR ALL USING ((select public.is_admin())) WITH CHECK ((select public.is_admin()));

-- ── storage.objects (bucket cantorales-pdf) ─────────────────────────────────
-- Solo el INSERT tiene una llamada no correlacionada (auth.role()). El update y el
-- delete solo usan is_cantoral_pdf_owner(name) (correlacionada) — no se tocan.
DROP POLICY IF EXISTS "cantorales_pdf_owner_insert" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND (select auth.role()) = 'authenticated'
    AND public.is_cantoral_pdf_owner(name)
  );

COMMIT;
