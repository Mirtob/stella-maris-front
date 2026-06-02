-- =============================================================================
-- STELLA MARIS — Song Catalog
-- Migration: 20260602_songs_catalog
--
-- Replaces the YouTube API + local mock approach with a Supabase-backed catalog.
-- YouTube becomes a pure video player; Drive becomes a pure PDF store.
-- All metadata (title, moments, seasons, instruments) lives here.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUM-LIKE CHECK constraints
--    Using TEXT + CHECK is more flexible than PostgreSQL ENUMs for future
--    additions (no ALTER TYPE required, just update the CHECK constraint).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS songs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  title            TEXT        NOT NULL,
  youtube_id       TEXT        UNIQUE,          -- null allowed for non-YouTube sources

  -- ── Primary liturgical classification ────────────────────────────────────
  -- Single value: a song belongs to one primary moment of the Mass.
  mass_moment      TEXT        NOT NULL DEFAULT 'no-liturgico'
    CHECK (mass_moment IN (
      'entrada', 'kyrie', 'gloria', 'salmo', 'aleluya',
      'ofertorio', 'santo', 'cordero', 'comunion', 'final',
      'exposicion', 'no-liturgico'
    )),

  -- Multi-value: a song can be used in several liturgical seasons.
  -- Empty array = valid for any season ("todos los tiempos").
  liturgical_seasons TEXT[]    NOT NULL DEFAULT '{}',

  -- Multi-value: available instrument versions.
  instruments       TEXT[]     NOT NULL DEFAULT '{coro,guitarra,organo}',

  -- ── Sheet music ───────────────────────────────────────────────────────────
  drive_file_id    TEXT,                        -- Google Drive file ID only (not full URL)

  -- ── Song metadata ─────────────────────────────────────────────────────────
  artist           TEXT,
  author           TEXT,
  original_key     TEXT,                        -- e.g. 'G', 'Am', 'F#m'
  duration         TEXT,                        -- e.g. '3:45'
  mass_name        TEXT,                        -- groups Kyrie/Gloria/Santo/Cordero from one Mass
  lyrics           TEXT,

  -- ── Flags ────────────────────────────────────────────────────────────────
  is_liturgical    BOOLEAN     NOT NULL DEFAULT true,
  non_liturgical_category TEXT
    CHECK (non_liturgical_category IS NULL OR non_liturgical_category IN (
      'Adoración', 'Procesión', 'Mariano', 'Reflexión', 'Evangelización', 'Otro'
    )),

  -- ── Approval workflow ─────────────────────────────────────────────────────
  -- New songs submitted by admins start as 'approved'.
  -- Future: parish choirs could submit → 'pending' until super-admin approves.
  approval_status  TEXT        NOT NULL DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by      TEXT,
  approved_at      TIMESTAMPTZ,
  rejection_reason TEXT,

  -- ── Timestamps ───────────────────────────────────────────────────────────
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2. INDEXES
--    GIN indexes make array containment queries instant even with 10k+ rows.
--    Query pattern: WHERE 'entrada' = ANY(mass_moment) — becomes a GIN scan.
-- ---------------------------------------------------------------------------

-- Scalar index: most common single-value filter
CREATE INDEX IF NOT EXISTS songs_mass_moment_idx
  ON songs (mass_moment);

-- GIN index: array containment  →  WHERE 'adviento' = ANY(liturgical_seasons)
CREATE INDEX IF NOT EXISTS songs_liturgical_seasons_gin
  ON songs USING GIN (liturgical_seasons);

-- GIN index: array containment  →  WHERE 'guitarra' = ANY(instruments)
CREATE INDEX IF NOT EXISTS songs_instruments_gin
  ON songs USING GIN (instruments);

-- Scalar: filter approved songs only
CREATE INDEX IF NOT EXISTS songs_approval_status_idx
  ON songs (approval_status);

-- Full-text search on title (Spanish dictionary for proper stemming)
CREATE INDEX IF NOT EXISTS songs_title_fts_idx
  ON songs USING GIN (to_tsvector('spanish', title));

-- Composite: the most common query —  approved songs for a given moment
CREATE INDEX IF NOT EXISTS songs_moment_approved_idx
  ON songs (mass_moment, approval_status);

-- ---------------------------------------------------------------------------
-- 3. AUTO-UPDATE updated_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS songs_updated_at ON songs;
CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON songs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------------

ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read approved songs (no auth required for the catalog)
DROP POLICY IF EXISTS "songs_public_read" ON songs;
CREATE POLICY "songs_public_read" ON songs
  FOR SELECT
  USING (approval_status = 'approved');

-- Admin: full access to all rows (pending, rejected, approved)
-- Add admin emails here as the platform grows.
DROP POLICY IF EXISTS "songs_admin_all" ON songs;
CREATE POLICY "songs_admin_all" ON songs
  FOR ALL
  USING (auth.email() IN ('gustavus.tobar@gmail.com'))
  WITH CHECK (auth.email() IN ('gustavus.tobar@gmail.com'));

-- ---------------------------------------------------------------------------
-- 5. HELPER VIEW: songs with pre-computed display fields
--    Useful for joining with cantorals or building the admin dashboard.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW songs_with_labels AS
SELECT
  s.*,
  CASE s.mass_moment
    WHEN 'entrada'       THEN 'Entrada'
    WHEN 'kyrie'         THEN 'Kyrie / Acto Penitencial'
    WHEN 'gloria'        THEN 'Gloria'
    WHEN 'salmo'         THEN 'Salmo Responsorial'
    WHEN 'aleluya'       THEN 'Aleluya / Aclamación'
    WHEN 'ofertorio'     THEN 'Ofertorio'
    WHEN 'santo'         THEN 'Santo'
    WHEN 'cordero'       THEN 'Cordero de Dios'
    WHEN 'comunion'      THEN 'Comunión'
    WHEN 'final'         THEN 'Final / Salida'
    WHEN 'exposicion'    THEN 'Exposición y Adoración'
    ELSE                      'No litúrgico'
  END AS mass_moment_label
FROM songs s;

-- ---------------------------------------------------------------------------
-- 6. SEARCH FUNCTION
--    Single function called from the app for the song picker.
--    Returns approved songs filtered by moment, season(s), instrument, and
--    optional full-text search. All parameters are optional.
--
--    Usage from PostgREST / Supabase client:
--      supabase.rpc('search_songs', { p_moment: 'entrada', p_season: 'adviento' })
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION search_songs(
  p_moment     TEXT    DEFAULT NULL,
  p_season     TEXT    DEFAULT NULL,
  p_instrument TEXT    DEFAULT NULL,
  p_query      TEXT    DEFAULT NULL,
  p_limit      INT     DEFAULT 100,
  p_offset     INT     DEFAULT 0
)
RETURNS SETOF songs
LANGUAGE sql STABLE AS $$
  SELECT *
  FROM songs
  WHERE
    approval_status = 'approved'
    AND (p_moment     IS NULL OR mass_moment = p_moment)
    AND (p_season     IS NULL OR p_season     = ANY(liturgical_seasons) OR liturgical_seasons = '{}')
    AND (p_instrument IS NULL OR p_instrument = ANY(instruments))
    AND (p_query      IS NULL OR to_tsvector('spanish', title) @@ plainto_tsquery('spanish', p_query))
  ORDER BY title ASC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
