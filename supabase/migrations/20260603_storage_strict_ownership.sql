-- =============================================================================
-- STELLA MARIS — Strict ownership on cantorales-pdf storage bucket
-- Migration: 20260603_storage_strict_ownership
--
-- Fixes S7: previously any authenticated user could overwrite any other
-- choir's PDF in the bucket. Now uploads/updates/deletes are restricted to
-- the cantoral's creator or an admin.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper: given a storage object name like '<uuid>.pdf', verify the
--    caller owns the matching cantoral.
--    SECURITY DEFINER so it can read published_cantorals regardless of the
--    caller's RLS scope (only returns a boolean — no row data is leaked).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_cantoral_pdf_owner(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  cantoral_id_text TEXT;
  cantoral_id      UUID;
  owner_id         UUID;
BEGIN
  -- Storage object names must be exactly '<uuid>.pdf'
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

  -- Cantoral must exist in the DB before its PDF can be uploaded
  IF owner_id IS NULL THEN
    RETURN public.is_admin();  -- admin can re-seed legacy rows
  END IF;

  RETURN owner_id = auth.uid() OR public.is_admin();
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_cantoral_pdf_owner(TEXT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Replace bucket policies with ownership-aware versions
--    SELECT stays public so the public URL keeps working without auth.
-- ---------------------------------------------------------------------------

-- Public read remains as before
DROP POLICY IF EXISTS "cantorales_pdf_public_read" ON storage.objects;
CREATE POLICY "cantorales_pdf_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cantorales-pdf');

-- INSERT: must be authenticated AND must own the matching cantoral
DROP POLICY IF EXISTS "cantorales_pdf_authed_insert" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND auth.role() = 'authenticated'
    AND public.is_cantoral_pdf_owner(name)
  );

-- UPDATE: only the owner (USING for the existing row, WITH CHECK for the new)
DROP POLICY IF EXISTS "cantorales_pdf_authed_update" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cantorales-pdf'
    AND public.is_cantoral_pdf_owner(name)
  )
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND public.is_cantoral_pdf_owner(name)
  );

-- DELETE: only the owner
DROP POLICY IF EXISTS "cantorales_pdf_authed_delete" ON storage.objects;
CREATE POLICY "cantorales_pdf_owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cantorales-pdf'
    AND public.is_cantoral_pdf_owner(name)
  );

-- ---------------------------------------------------------------------------
-- 3. Verification (run manually after migration)
-- ---------------------------------------------------------------------------
--
-- -- Should return TRUE only for cantorales owned by you
-- SELECT public.is_cantoral_pdf_owner('<your-cantoral-id>.pdf');
--
-- -- Should return FALSE for someone else's cantoral
-- SELECT public.is_cantoral_pdf_owner('<other-user-cantoral-id>.pdf');
--
-- -- Should return FALSE for invalid format
-- SELECT public.is_cantoral_pdf_owner('hacked.pdf');
-- SELECT public.is_cantoral_pdf_owner('../etc/passwd');
--
