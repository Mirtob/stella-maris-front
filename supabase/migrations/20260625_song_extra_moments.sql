-- =============================================================================
-- STELLA MARIS — Un canto puede servir en varias partes de la Misa
-- Migration: 20260625_song_extra_moments
--
-- `mass_moment` sigue siendo el momento PRINCIPAL (para orden del cantoral, PDF,
-- agrupación de ordinario). `extra_moments` agrega momentos ADICIONALES donde el
-- mismo canto también sirve (p. ej. un canto que vale para Ofertorio y Comunión).
-- =============================================================================

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS extra_moments TEXT[] NOT NULL DEFAULT '{}';

-- Solo valores válidos del mismo conjunto que mass_moment (subconjunto).
ALTER TABLE songs DROP CONSTRAINT IF EXISTS songs_extra_moments_valid;
ALTER TABLE songs ADD CONSTRAINT songs_extra_moments_valid
  CHECK (extra_moments <@ ARRAY[
    'entrada', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'ofertorio', 'santo', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ]::text[]);

-- GIN: containment instantáneo  →  WHERE 'comunion' = ANY(extra_moments)
CREATE INDEX IF NOT EXISTS songs_extra_moments_gin
  ON songs USING GIN (extra_moments);

-- ---------------------------------------------------------------------------
-- search_songs: un canto aparece bajo su momento principal O cualquiera de los
-- adicionales. El resto de la firma/comportamiento no cambia.
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
    AND (p_moment     IS NULL OR mass_moment = p_moment OR p_moment = ANY(extra_moments))
    AND (p_season     IS NULL OR p_season     = ANY(liturgical_seasons) OR liturgical_seasons = '{}')
    AND (p_instrument IS NULL OR p_instrument = ANY(instruments))
    AND (p_query      IS NULL OR to_tsvector('spanish', title) @@ plainto_tsquery('spanish', p_query))
  ORDER BY title ASC
  LIMIT  p_limit
  OFFSET p_offset;
$$;
