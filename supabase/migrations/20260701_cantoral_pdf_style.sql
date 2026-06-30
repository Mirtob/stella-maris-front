-- =============================================================================
-- STELLA MARIS — Fuente y tamaño del folleto PDF por cantoral
-- Migration: 20260701_cantoral_pdf_style
--
-- Al publicar, el coro elige la fuente y el tamaño de letra del folleto del Pueblo
-- fiel. Se guardan los ids (ver src/data/pdfStyle.ts) para que cualquier descarga
-- posterior del PDF use el mismo estilo. NULL = valores por defecto.
-- =============================================================================

ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS pdf_font TEXT,
  ADD COLUMN IF NOT EXISTS pdf_size TEXT;
