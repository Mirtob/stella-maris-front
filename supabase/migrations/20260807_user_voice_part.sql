-- =============================================================================
-- STELLA MARIS — Voz / instrumento de cada corista
-- Migration: 20260807_user_voice_part
--
-- Complementa 20260807_song_sheets: si un canto ya trae una partitura por voz,
-- hay que saber QUÉ voz canta cada persona para mostrarle la suya.
--
-- Columna aparte y no dentro de `instruments` a propósito: `instruments` guarda
-- con qué instrumentos SIRVE el material ('guitarra','organo','coro') y lo usa el
-- filtro p_instrument del RPC search_songs. Meter ahí 'Tenor' mezclaría dos cosas
-- distintas y ensuciaría ese filtro.
--
-- Texto libre y no un enum: los coros usan partes que ninguna lista cerrada cubre
-- ('Trompeta en Sib', 'Bombardino 2', 'Viola da gamba'). La detección de partituras
-- tampoco inventa etiquetas (ver utils/sheetParts.ts), así que ambos lados hablan
-- el mismo idioma: el que escribió el músico en MuseScore.
--
-- NULL = sin voz asignada → esa persona ve la partitura general (full score).
-- =============================================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS voice_part TEXT;

COMMENT ON COLUMN public.user_profiles.voice_part IS
  'Voz o instrumento del corista (Soprano, Tenor, Trompeta…). NULL = ve el full score.';

-- RLS: sin cambios. Las policies de user_profiles son de fila y ya cubren la columna.
