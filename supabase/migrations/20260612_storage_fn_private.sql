-- =============================================================================
-- STELLA MARIS — Linter follow-ups: bucket listing + función interna a `private`
-- Migration: 20260612_storage_fn_private
-- (debe aplicarse DESPUÉS de 20260612_functions_search_path y _rls_initplan_perf)
--
-- Resuelve dos hallazgos del linter:
--   1) public_bucket_allows_listing (cantorales-pdf)
--   2) anon/authenticated_security_definer_function_executable (is_cantoral_pdf_owner)
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. public_bucket_allows_listing
--    El bucket `cantorales-pdf` es PÚBLICO: los PDFs se sirven por su URL pública
--    (la app usa getPublicUrl), que NO depende de RLS. La policy de SELECT amplia
--    solo habilitaba LISTAR todos los archivos del bucket (enumeración). La app no
--    lista ni descarga por cliente (el backup usa la service_role, que saltea RLS),
--    así que se elimina sin afectar el acceso por URL.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "cantorales_pdf_public_read" ON storage.objects;

-- ---------------------------------------------------------------------------
-- 2. is_cantoral_pdf_owner: sacarla del esquema expuesto (public) a `private`
--    El linter marca que una función SECURITY DEFINER en `public` es invocable como
--    RPC (/rest/v1/rpc/...) por anon y authenticated. Esta función NO la llama la app
--    por RPC: solo la usan las policies de Storage. PostgREST no expone el esquema
--    `private`, así que moverla ahí elimina la superficie de RPC manteniendo la RLS.
--    (is_admin SÍ se queda en public: la app la llama por rpc('is_admin').)
-- ---------------------------------------------------------------------------
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

-- La policy se evalúa como el rol que consulta: necesita USAGE en el esquema y
-- EXECUTE en la función. `private` NO está en el `db-schemas` de PostgREST, por lo
-- que esto NO la re-expone como RPC (el linter no marca funciones fuera del API).
GRANT USAGE ON SCHEMA private TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_cantoral_pdf_owner(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_cantoral_pdf_owner(TEXT) TO anon, authenticated;

-- Recrear las policies de Storage para que llamen a private.is_cantoral_pdf_owner.
-- (Mantienen el wrap (select auth.role()) del fix de auth_rls_initplan.)
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

-- Ya sin dependientes en public → eliminar la versión expuesta.
DROP FUNCTION IF EXISTS public.is_cantoral_pdf_owner(TEXT);

COMMIT;
