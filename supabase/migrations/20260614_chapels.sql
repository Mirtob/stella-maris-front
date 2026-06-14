-- =============================================================================
-- STELLA MARIS — Capillas administradas por el admin
-- Migration: 20260614_chapels
-- (aplica DESPUÉS de 20260603_security_rls_admins, que define is_admin())
--
-- Una capilla pertenece a una parroquia (parish_full = "<Parroquia> - <Diócesis>")
-- pero funciona como unidad independiente: su coro, pueblo fiel y cantorales se
-- identifican por el string de parroquia activa "<parish_full> · <Capilla>".
--
-- Las capillas NO son sensibles (solo metadatos para armar el selector), así que
-- cualquier usuario autenticado las lee. Solo los admins las crean/editan/borran.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.chapels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  parish_full TEXT        NOT NULL,   -- "<Parroquia> - <Diócesis>" de la parroquia madre
  diocese     TEXT,
  address     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chapels_parish_full_idx ON public.chapels (parish_full);

ALTER TABLE public.chapels ENABLE ROW LEVEL SECURITY;

-- SELECT: cualquier usuario autenticado.
DROP POLICY IF EXISTS "chapels_select" ON public.chapels;
CREATE POLICY "chapels_select" ON public.chapels
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- INSERT/UPDATE/DELETE: solo admins (tabla `admins` vía is_admin()).
DROP POLICY IF EXISTS "chapels_write" ON public.chapels;
CREATE POLICY "chapels_write" ON public.chapels
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Verificación (manual en el SQL editor tras aplicar):
--   SELECT rowsecurity FROM pg_tables WHERE tablename = 'chapels';  -- true
--   INSERT INTO chapels (name, parish_full) VALUES ('Capilla de prueba', 'X - Y'); -- solo admin
-- ---------------------------------------------------------------------------
