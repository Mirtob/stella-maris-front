-- =============================================================================
-- STELLA MARIS — Un cantoral PUBLICADO por Misa
-- Migration: 20260616_cantoral_unique_mass
--
-- Evita que se publique más de un cantoral para la misma parroquia (o capilla),
-- la misma fecha y el mismo horario. Es la red de seguridad del backend; la app
-- además verifica antes de publicar (findDuplicate).
--
-- Índice PARCIAL (status = 'published'): los borradores NO cuentan, así que un
-- coro puede tener borradores sin chocar con el cantoral publicado.
--
-- Nota: parish_name incluye el string de la capilla cuando aplica
-- ("Parroquia - Diócesis · Capilla"), de modo que cada capilla es independiente.
--
-- ⚠️ Si ya existen DUPLICADOS publicados, la creación del índice FALLARÁ. En ese
-- caso, primero hay que deduplicar. Para detectarlos:
--   SELECT parish_name, date, mass_time, count(*)
--   FROM public.published_cantorals
--   WHERE status = 'published'
--   GROUP BY parish_name, date, mass_time
--   HAVING count(*) > 1;
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS published_cantorals_mass_uk
  ON public.published_cantorals (parish_name, date, mass_time)
  WHERE status = 'published';
