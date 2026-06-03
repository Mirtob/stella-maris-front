-- =============================================================================
-- STELLA MARIS — Security hardening: RLS on cantorales + admin table
-- Migration: 20260603_security_rls_admins
--
-- Fixes:
--   S2 — Admin authorization now lives in DB, not in client code.
--   S3 — Row Level Security on published_cantorals prevents IDOR
--        (insecure direct object reference) between users.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Admin registry table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        UNIQUE NOT NULL,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by    TEXT        DEFAULT 'manual'
);

-- Seed the first admin so the deploy is not locked out
INSERT INTO admins (email, added_by)
VALUES ('gustavus.tobar@gmail.com', 'initial_setup')
ON CONFLICT (email) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. is_admin() helper — used by every admin policy below
--    SECURITY DEFINER so policies on `admins` itself don't cause recursion.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE email = auth.email()
  );
$$;

-- Grant execute to the anonymous + authenticated roles so the RPC works
GRANT EXECUTE ON FUNCTION is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS on admins table (only admins can read/write it)
-- ---------------------------------------------------------------------------

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_admin" ON admins;
CREATE POLICY "admins_select_admin" ON admins
  FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "admins_modify_admin" ON admins;
CREATE POLICY "admins_modify_admin" ON admins
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 4. RLS on published_cantorals
--    Adds a created_by column populated automatically by trigger.
-- ---------------------------------------------------------------------------

-- Add ownership column (NULL allowed for backfill compat)
ALTER TABLE published_cantorals
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Index for fast RLS lookups by owner
CREATE INDEX IF NOT EXISTS published_cantorals_created_by_idx
  ON published_cantorals (created_by);

-- Trigger: auto-populate created_by with auth.uid() on INSERT
CREATE OR REPLACE FUNCTION set_cantoral_created_by()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS published_cantorals_set_created_by ON published_cantorals;
CREATE TRIGGER published_cantorals_set_created_by
  BEFORE INSERT ON published_cantorals
  FOR EACH ROW EXECUTE FUNCTION set_cantoral_created_by();

-- Enable RLS
ALTER TABLE published_cantorals ENABLE ROW LEVEL SECURITY;

-- SELECT: published cantorals are visible to all authenticated users.
-- Drafts only visible to the creator or an admin.
-- Legacy rows (created_by IS NULL) are treated as published-public so older
-- data doesn't disappear from the UI.
DROP POLICY IF EXISTS "cantorals_select" ON published_cantorals;
CREATE POLICY "cantorals_select" ON published_cantorals
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      status = 'published'
      OR created_by IS NULL
      OR created_by = auth.uid()
      OR is_admin()
    )
  );

-- INSERT: any authenticated user; created_by must match auth.uid() (or be NULL,
-- in which case the trigger fills it in).
DROP POLICY IF EXISTS "cantorals_insert" ON published_cantorals;
CREATE POLICY "cantorals_insert" ON published_cantorals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- UPDATE: only the creator or an admin.
-- Legacy rows (created_by IS NULL) can be updated by any admin only.
DROP POLICY IF EXISTS "cantorals_update" ON published_cantorals;
CREATE POLICY "cantorals_update" ON published_cantorals
  FOR UPDATE
  USING (
    (created_by IS NOT NULL AND created_by = auth.uid()) OR is_admin()
  )
  WITH CHECK (
    (created_by IS NOT NULL AND created_by = auth.uid()) OR is_admin()
  );

-- DELETE: only the creator or an admin.
DROP POLICY IF EXISTS "cantorals_delete" ON published_cantorals;
CREATE POLICY "cantorals_delete" ON published_cantorals
  FOR DELETE
  USING (
    (created_by IS NOT NULL AND created_by = auth.uid()) OR is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Refresh the songs admin policy to use is_admin()
--    (previously it had the email hardcoded; now it uses the admins table)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "songs_admin_all" ON songs;
CREATE POLICY "songs_admin_all" ON songs
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- 6. Verification queries (run manually in SQL editor after migration)
-- ---------------------------------------------------------------------------
--
-- SELECT email FROM admins;                            -- should list at least 1
-- SELECT is_admin();                                   -- true for the admin
-- SELECT rowsecurity FROM pg_tables WHERE tablename = 'published_cantorals';  -- true
--
