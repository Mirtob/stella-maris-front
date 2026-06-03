-- =============================================================================
-- STELLA MARIS — PDF storage for published cantorals
-- Migration: 20260603_cantoral_pdf_storage
--
-- Adds a public Supabase Storage bucket for cantoral PDFs and a column on
-- published_cantorals to track the URL of each one.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add pdf_url column
-- ---------------------------------------------------------------------------

ALTER TABLE published_cantorals
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- ---------------------------------------------------------------------------
-- 2. Create public storage bucket for cantoral PDFs
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('cantorales-pdf', 'cantorales-pdf', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Storage policies
--    Public read (anyone can fetch the PDF via the public URL)
--    Authenticated write (any logged-in user can upload — restrict further
--    by cantoral ownership later if needed)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "cantorales_pdf_public_read" ON storage.objects;
CREATE POLICY "cantorales_pdf_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cantorales-pdf');

DROP POLICY IF EXISTS "cantorales_pdf_authed_insert" ON storage.objects;
CREATE POLICY "cantorales_pdf_authed_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cantorales-pdf'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "cantorales_pdf_authed_update" ON storage.objects;
CREATE POLICY "cantorales_pdf_authed_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cantorales-pdf'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "cantorales_pdf_authed_delete" ON storage.objects;
CREATE POLICY "cantorales_pdf_authed_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cantorales-pdf'
    AND auth.role() = 'authenticated'
  );
