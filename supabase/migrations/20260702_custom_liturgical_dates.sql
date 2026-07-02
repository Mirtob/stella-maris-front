-- =============================================================================
-- STELLA MARIS — Celebraciones personalizadas persistidas (solemnidades/fiestas)
-- Migration: 20260702_custom_liturgical_dates
--
-- Antes, las celebraciones agregadas al publicar eran solo LOCALES de la sesión
-- (no se guardaban ni se compartían). Ahora se persisten:
--   - Las del ADMINISTRADOR (scope='global') aparecen para TODOS los usuarios.
--   - Las del CORO se guardan con scope = su parroquia/capilla y aparecen para los
--     usuarios de esa parroquia.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.custom_liturgical_dates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  date        DATE NOT NULL,
  -- 'solemnity' | 'feast' (informativo; el calendario base ya trae domingos).
  type        TEXT NOT NULL DEFAULT 'solemnity'
                CHECK (type IN ('solemnity', 'feast')),
  -- 'global' (admin, para todos) o el nombre de la parroquia/capilla (coro).
  scope       TEXT NOT NULL DEFAULT 'global',
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Evita duplicados exactos (misma celebración, fecha y alcance).
CREATE UNIQUE INDEX IF NOT EXISTS custom_liturgical_dates_uniq
  ON public.custom_liturgical_dates (name, date, scope);

-- Búsqueda por alcance (global + parroquia del usuario).
CREATE INDEX IF NOT EXISTS custom_liturgical_dates_scope_idx
  ON public.custom_liturgical_dates (scope);

ALTER TABLE public.custom_liturgical_dates ENABLE ROW LEVEL SECURITY;

-- ── SELECT: cualquier autenticado (no es dato sensible; el cliente filtra por scope
--    para mostrar solo 'global' + la parroquia activa). ──
DROP POLICY IF EXISTS "cld_select" ON public.custom_liturgical_dates;
CREATE POLICY "cld_select" ON public.custom_liturgical_dates
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- ── INSERT: autenticado; solo el admin puede crear 'global'; el coro crea con el
--    scope de su parroquia. created_by debe ser el propio usuario (o el default). ──
DROP POLICY IF EXISTS "cld_insert" ON public.custom_liturgical_dates;
CREATE POLICY "cld_insert" ON public.custom_liturgical_dates
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (scope <> 'global' OR (select public.is_admin()))
  );

-- ── UPDATE / DELETE: el autor o un admin. ──
DROP POLICY IF EXISTS "cld_update" ON public.custom_liturgical_dates;
CREATE POLICY "cld_update" ON public.custom_liturgical_dates
  FOR UPDATE
  USING (created_by = (select auth.uid()) OR (select public.is_admin()))
  WITH CHECK (created_by = (select auth.uid()) OR (select public.is_admin()));

DROP POLICY IF EXISTS "cld_delete" ON public.custom_liturgical_dates;
CREATE POLICY "cld_delete" ON public.custom_liturgical_dates
  FOR DELETE
  USING (created_by = (select auth.uid()) OR (select public.is_admin()));
