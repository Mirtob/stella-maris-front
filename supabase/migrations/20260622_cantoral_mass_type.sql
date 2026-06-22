-- =============================================================================
-- STELLA MARIS — Tipo de horario litúrgico de la Misa
-- Migration: 20260622_cantoral_mass_type
--
-- Domingos y solemnidades de precepto tienen 3 tipos de Misa según el horario:
--   - 'visperas_i'  → I Vísperas: tarde del día ANTERIOR (15:00–23:59). date = día anterior.
--   - 'dia'         → Misa del día: mismo día, 00:00–15:00.
--   - 'visperas_ii' → II Vísperas: mismo día, 15:01–23:59.
--
-- `liturgical_date` siempre mantiene la celebración del día. El campo `vigil` queda
-- como legacy (equivale a mass_type = 'visperas_i').
-- =============================================================================

ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS mass_type text NOT NULL DEFAULT 'dia'
  CHECK (mass_type in ('visperas_i', 'dia', 'visperas_ii'));

-- Backfill: las vespertinas previas (vigil = true) eran I Vísperas.
UPDATE public.published_cantorals
  SET mass_type = 'visperas_i'
  WHERE vigil = true AND mass_type = 'dia';

COMMENT ON COLUMN public.published_cantorals.mass_type IS
  'Tipo de horario liturgico: visperas_i (dia anterior 15-23:59), dia (00-15), visperas_ii (15:01-23:59).';
