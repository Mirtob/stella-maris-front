-- =============================================================================
-- STELLA MARIS — La celebración agregada: ¿reemplaza al domingo, o se suma?
-- Migration: 20260904_celebracion_reemplazo_color
--
-- Hasta ahora una celebración agregada a mano SIEMPRE se ponía en lugar de la del
-- calendario, y desde 20260904 (código) SIEMPRE se suma. Ninguna de las dos reglas
-- sirve sola, porque las dos cosas pasan de verdad:
--
--   · Una fiesta patronal o una solemnidad SÍ desplaza al domingo del Tiempo
--     Ordinario. Ese día no se celebra el domingo: se celebra la solemnidad, con su
--     salmo y su color.
--   · Una ordenación, una jornada o un aniversario en domingo NO lo desplaza. Sigue
--     siendo el 26.º Domingo del Tiempo Ordinario, con su salmo, y la celebración se
--     menciona además.
--
-- No hay forma de deducir cuál es cuál desde el nombre ni desde el tipo, así que lo
-- elige quien la crea. Por eso `replaces_default` no tiene un valor "inteligente":
-- por defecto se SUMA, que es lo que no pierde información.
--
-- `color` permite además fijar el color litúrgico del día (rojo en una ordenación o
-- en un mártir patrono, blanco en una dedicación…). NULL = el que corresponda al
-- calendario, que es lo normal.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

ALTER TABLE public.custom_liturgical_dates
  ADD COLUMN IF NOT EXISTS replaces_default BOOLEAN NOT NULL DEFAULT false;

-- Color litúrgico: 'green' | 'violet' | 'white' | 'red' | 'rose' | 'gold' | 'black'.
-- NULL = el del calendario para esa fecha. Se valida en la app (utils/liturgicalColors);
-- aquí se deja TEXT para no tener que migrar la tabla si algún día se suma un color.
ALTER TABLE public.custom_liturgical_dates
  ADD COLUMN IF NOT EXISTS color TEXT;

COMMIT;

-- =============================================================================
-- COMPROBACIÓN
--
-- Las que desplazan al día del calendario:
--   SELECT date, name, color FROM custom_liturgical_dates
--    WHERE replaces_default ORDER BY date;
--
-- Dos celebraciones el mismo día (una manda y la otra se suma):
--   SELECT date, count(*), bool_or(replaces_default) AS alguna_reemplaza
--     FROM custom_liturgical_dates GROUP BY date HAVING count(*) > 1;
-- =============================================================================
