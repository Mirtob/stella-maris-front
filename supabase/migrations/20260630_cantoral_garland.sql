-- =============================================================================
-- STELLA MARIS — Guirnalda (adorno) elegida por cantoral
-- Migration: 20260630_cantoral_garland
--
-- Al publicar, el coro elige la guirnalda que adorna los títulos del folleto PDF
-- del Pueblo fiel. Se guarda el id de la guirnalda (ver src/data/garlands.ts) para
-- que cualquier descarga posterior del PDF use el mismo adorno. NULL = guirnalda
-- por defecto.
-- =============================================================================

ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS garland TEXT;
