-- =============================================================================
-- STELLA MARIS — Misa vespertina / de primeras vísperas
-- Migration: 20260620_cantoral_vigil
--
-- Permite marcar un cantoral como Misa VESPERTINA (de primeras vísperas): la
-- víspera por la tarde que vale como Misa del día siguiente. El caso típico es el
-- coro que canta el sábado en la tarde: la celebración es la del domingo, pero la
-- Misa se canta el sábado.
--
-- Convención de datos:
--   • `date`            → la fecha real en que se canta (para una vespertina, la
--                         víspera; p. ej. el sábado).
--   • `liturgical_date` → la celebración del día siguiente (p. ej. el domingo).
--   • `vigil = true`    → indica que es la Misa vespertina/anticipada.
--
-- El índice único (parish_name, date, mass_time) sigue funcionando sin cambios:
-- como la vespertina usa la fecha de la víspera, no choca con la Misa del día.
-- =============================================================================

ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS vigil boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.published_cantorals.vigil IS
  'Misa vespertina/de primeras vísperas: la víspera por la tarde que vale como Misa del día siguiente. date = víspera; liturgical_date = celebración del día.';
