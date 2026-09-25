-- =============================================================================
-- STELLA MARIS — Una sola grafía para la Misa de Nebreda
-- Migration: 20260925_unificar_misa_nebreda
--
-- QUÉ PASA
-- Las cuatro partes de la misma Misa están escritas de tres formas distintas:
--
--   Gloria   → 'Nebreda'
--   Santo    → 'Nebreda (Do mayor)'
--   Kyrie    → 'Nebreda (Do mayor)'
--   Cordero  → 'Nebreda (Do Mayor)'     ← con M mayúscula
--
-- Para la app son TRES Misas, no una. Eso rompe el agrupado del Kyriale, el
-- "completar la Misa" al agregar un Kyrie, y la búsqueda de partituras en Drive (donde
-- la carpeta se llama 'Misa Nebreda' a secas).
--
-- POR QUÉ 'Misa Nebreda'
-- Es como se llama la carpeta en Drive (Misas/Misa Nebreda) y sigue la convención de
-- las demás del catálogo: 'Misa M. Manzano', 'Misa T. Aragues', 'Misa Guicochea
-- Arrondo'. El '(Do mayor)' se va porque el tono ya vive en su propia columna
-- (original_key) — y además ahí dice 'Lam' para el Kyrie y el Cordero, así que el
-- nombre estaba diciendo algo que no es cierto para la mitad de las partes.
--
-- APLICAR A MANO en el SQL Editor de Supabase. Es idempotente.
-- =============================================================================

BEGIN;

-- Qué se va a tocar, antes de tocarlo.
SELECT id, mass_moment, mass_name AS antes, original_key, title
  FROM public.songs
 WHERE mass_name ILIKE '%nebreda%'
   AND mass_name <> 'Misa Nebreda'
 ORDER BY mass_moment;

UPDATE public.songs
   SET mass_name = 'Misa Nebreda'
 WHERE mass_name ILIKE '%nebreda%'
   AND mass_name <> 'Misa Nebreda';

COMMIT;

-- =============================================================================
-- COMPROBACIÓN
--   SELECT mass_name, count(*) FROM songs WHERE mass_name ILIKE '%nebreda%'
--    GROUP BY mass_name;
--   → una sola fila: 'Misa Nebreda' | 4
--
-- Después, en la app: agregar el Kyrie de Nebreda debe ofrecer completar la Misa con
-- su Gloria, Santo y Cordero — que antes no encontraba por ser "otra" Misa.
-- =============================================================================
