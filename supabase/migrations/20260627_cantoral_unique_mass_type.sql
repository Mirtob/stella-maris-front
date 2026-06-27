-- =============================================================================
-- STELLA MARIS — Unicidad de cantoral incluye el tipo de Misa
-- Migration: 20260627_cantoral_unique_mass_type
--
-- Ahora `date` guarda SIEMPRE la fecha propia de la celebración (también para el
-- I Vísperas; el ajuste de "se canta la víspera" lo resuelve la ventana de
-- vigencia en la app). Por eso I Vísperas y II Vísperas de un mismo domingo
-- comparten `date` y, si tuvieran el mismo horario, chocarían con el índice único
-- anterior (parish_name, date, mass_time).
--
-- Solución: incluir `mass_type` en el índice único parcial. Así puede haber un
-- cantoral por (parroquia, fecha, horario, tipo) — p. ej. la Vigilia del sábado
-- 19:00 y la Misa del domingo 19:00 coexisten.
--
-- ⚠️ Si existieran duplicados publicados bajo la NUEVA clave, la creación fallará.
-- Detectarlos:
--   SELECT parish_name, date, mass_time, mass_type, count(*)
--   FROM public.published_cantorals
--   WHERE status = 'published'
--   GROUP BY parish_name, date, mass_time, mass_type
--   HAVING count(*) > 1;
-- =============================================================================

DROP INDEX IF EXISTS published_cantorals_mass_uk;

CREATE UNIQUE INDEX IF NOT EXISTS published_cantorals_mass_uk
  ON public.published_cantorals (parish_name, date, mass_time, mass_type)
  WHERE status = 'published';
