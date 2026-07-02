-- =============================================================================
-- STELLA MARIS — Fix 42883 al subir el PDF del cantoral (undefined_function)
-- Migration: 20260701_storage_pdf_owner_fix
-- (aplicar DESPUÉS de todas las 20260612_*)
--
-- SÍNTOMA: al publicar, la subida del PDF a Storage falla con
--   "database error, code: 42883" (undefined_function) y el toast
--   "Cantoral publicado, pero no pudimos generar el PDF compartible.".
--
-- CAUSA: la policy de INSERT del bucket `cantorales-pdf` quedó apuntando a
--   `public.is_cantoral_pdf_owner(name)`, pero esa función fue ELIMINADA por
--   `20260612_storage_fn_private` (que la movió al esquema `private`). Esto ocurre
--   si `20260612_rls_initplan_perf` (que recrea el INSERT usando `public.`) se
--   aplica/reaplica DESPUÉS de `20260612_storage_fn_private`. El resto de policies
--   (SELECT/UPDATE/DELETE) ya usaban `private.`; solo el INSERT (la subida) quedó roto.
--
-- FIX: dejar el estado consistente y self-healing —
--   1) garantizar que `private.is_cantoral_pdf_owner` exista,
--   2) recrear las 3 policies de escritura para que TODAS usen `private.`,
--   3) eliminar la versión `public` (si quedó) para que nadie vuelva a apuntarla.
--
-- ⚠️ No re-ejecutar `20260612_rls_initplan_perf` de forma aislada: volvería a
--    apuntar el INSERT a `public.is_cantoral_pdf_owner`. Si pasa, re-correr ESTA.
-- =============================================================================

BEGIN;

-- 1. Garantizar la función de ownership en `private` (idempotente).
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_cantoral_pdf_owner(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cantoral_id_text TEXT;
  cantoral_id      UUID;
  owner_id         UUID;
BEGIN
  IF object_name !~ '^[0-9a-fA-F-]{36}\.pdf$' THEN
    RETURN FALSE;
  END IF;

  cantoral_id_text := regexp_replace(object_name, '\.pdf$', '');

  BEGIN
    cantoral_id := cantoral_id_text::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  SELECT created_by INTO owner_id
  FROM public.published_cantorals
  WHERE id = cantoral_id;

  IF owner_id IS NULL THEN
    RETURN public.is_admin();  -- admin can re-seed legacy rows
  END IF;

  RETURN owner_id = auth.uid() OR public.is_admin();
END;
$$;

GRANT USAGE ON SCHEMA private TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_cantoral_pdf_owner(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_cantoral_pdf_owner(TEXT) TO anon, authenticated;

-- 2. Recrear TODAS las policies de escritura apuntando a `private.` (mantienen el
--    wrap (select auth.role()) del fix auth_rls_initplan).
DROP POLICY IF EXISTS "cantorales_pdf_owner_insert" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND (select auth.role()) = 'authenticated'
    AND private.is_cantoral_pdf_owner(name)
  );

DROP POLICY IF EXISTS "cantorales_pdf_owner_update" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cantorales-pdf'
    AND private.is_cantoral_pdf_owner(name)
  )
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND private.is_cantoral_pdf_owner(name)
  );

DROP POLICY IF EXISTS "cantorales_pdf_owner_delete" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cantorales-pdf'
    AND private.is_cantoral_pdf_owner(name)
  );

-- 3. Eliminar la versión `public` (si quedó) — ya no la referencia ninguna policy.
DROP FUNCTION IF EXISTS public.is_cantoral_pdf_owner(TEXT);

COMMIT;

-- ---------------------------------------------------------------------------
-- Verificación (correr manualmente tras aplicar):
--   -- Debe listar 4 policies del bucket, todas con `private.is_cantoral_pdf_owner`:
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects'
--     AND policyname LIKE 'cantorales_pdf%';
--
--   -- Debe existir en `private` y NO en `public`:
--   SELECT n.nspname, p.proname
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE p.proname = 'is_cantoral_pdf_owner';
-- ---------------------------------------------------------------------------
