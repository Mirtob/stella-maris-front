-- =============================================================================
-- STELLA MARIS — Parroquias administradas (custom)
-- Migration: 20260619_custom_parishes
--
-- El catálogo base de parroquias es estático (src/data/chileDioceses.ts). Esta
-- tabla permite al admin AGREGAR/editar/borrar parroquias que no están en el
-- catálogo, y que los usuarios puedan seleccionarlas. Se asocian a una diócesis
-- existente del catálogo (diocese_id) para integrarlas en el selector.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_parishes (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  diocese_id    TEXT        NOT NULL,   -- id de la diócesis en chileDioceses
  diocese_name  TEXT        NOT NULL,   -- nombre de la diócesis (para el string canónico)
  city          TEXT,
  address       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_parishes_diocese_idx ON public.custom_parishes (diocese_id);

ALTER TABLE public.custom_parishes ENABLE ROW LEVEL SECURITY;

-- Lectura pública: los usuarios eligen su parroquia (incluso en flujos sin sesión).
DROP POLICY IF EXISTS "custom_parishes_read" ON public.custom_parishes;
CREATE POLICY "custom_parishes_read" ON public.custom_parishes
  FOR SELECT USING (true);

-- Escritura solo admin (is_admin() definido en 20260603_security_rls_admins).
DROP POLICY IF EXISTS "custom_parishes_write" ON public.custom_parishes;
CREATE POLICY "custom_parishes_write" ON public.custom_parishes
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());
