-- =============================================================================
-- STELLA MARIS — Catálogo editable de etiquetas de canto (temporadas/temáticas)
-- Migration: 20260814_song_tags
--
-- Antes la lista de etiquetas ("Adviento", "Gregoriano", …) estaba escrita a mano
-- en SongManager.tsx: agregar una exigía tocar el código y desplegar. Ahora vive
-- en esta tabla y el admin la administra desde la app (crear / renombrar /
-- borrar).
--
-- Las etiquetas se guardan en `songs.liturgical_seasons` como TEXTO, no como
-- claves foráneas. Es a propósito:
--   - el catálogo ya tiene cantos con etiquetas escritas antes de esta tabla y
--     no se pierden;
--   - borrar una etiqueta del catálogo NO altera los cantos que la tenían (la app
--     sigue mostrándola en la ficha de ese canto para poder quitarla a mano).
-- Por eso renombrar una etiqueta aquí no renombra la de los cantos: la app hace
-- ese reemplazo aparte, cuando el admin lo confirma.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.song_tags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label       TEXT NOT NULL,
  -- Orden de aparición de los chips. Los tiempos litúrgicos primero (10-99),
  -- luego días y solemnidades (100-199), al final las temáticas (200+).
  sort_order  INT  NOT NULL DEFAULT 500,
  created_by  UUID DEFAULT auth.uid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sin duplicados: "Gregoriano" y "gregoriano" son la misma etiqueta. Se compara
-- sin distinguir mayúsculas para que no queden dos chips que parecen iguales.
CREATE UNIQUE INDEX IF NOT EXISTS song_tags_label_uniq
  ON public.song_tags (lower(label));

CREATE INDEX IF NOT EXISTS song_tags_order_idx
  ON public.song_tags (sort_order, label);

ALTER TABLE public.song_tags ENABLE ROW LEVEL SECURITY;

-- ── SELECT: cualquiera puede leer las etiquetas (las ve el buscador de cantos,
--    que también usa el Pueblo fiel). No es dato sensible. ──
DROP POLICY IF EXISTS "song_tags_select" ON public.song_tags;
CREATE POLICY "song_tags_select" ON public.song_tags
  FOR SELECT
  USING (true);

-- ── INSERT / UPDATE / DELETE: solo administradores. La lista es del catálogo
--    completo, compartida por todas las parroquias. ──
DROP POLICY IF EXISTS "song_tags_insert" ON public.song_tags;
CREATE POLICY "song_tags_insert" ON public.song_tags
  FOR INSERT
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "song_tags_update" ON public.song_tags;
CREATE POLICY "song_tags_update" ON public.song_tags
  FOR UPDATE
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

DROP POLICY IF EXISTS "song_tags_delete" ON public.song_tags;
CREATE POLICY "song_tags_delete" ON public.song_tags
  FOR DELETE
  USING ((select public.is_admin()));

-- ── Semilla: las etiquetas que hasta ahora estaban en el código, más las nuevas
--    (Domingo de Ramos, Funerales, Otros sacramentos, Fiestas patronales). ──
INSERT INTO public.song_tags (label, sort_order) VALUES
  -- Tiempos litúrgicos
  ('Adviento', 10), ('Navidad', 20), ('Tiempo Ordinario', 30), ('Cuaresma', 40),
  ('Semana Santa', 50), ('Pascua', 60), ('Pentecostés', 70), ('Corpus Christi', 80),
  -- Días y solemnidades
  ('Miércoles de Ceniza', 100), ('Domingo de Ramos', 105), ('Jueves Santo', 110),
  ('Viernes Santo', 120), ('Sábado Santo', 130), ('Vigilia Pascual', 140),
  ('Domingo de Resurrección', 150), ('Ascensión del Señor', 160),
  ('Espíritu Santo', 170), ('Cristo Rey', 180), ('Asunción de la Virgen', 190),
  ('Inmaculada Concepción', 195), ('Misa Crismal', 196), ('Ordenaciones', 197),
  -- Celebraciones fuera del tiempo litúrgico
  ('Funerales', 200), ('Otros sacramentos', 210), ('Fiestas patronales', 220),
  -- Temáticas
  ('Sagrado Corazón', 300), ('Virgen María', 310), ('Santos', 320),
  ('Gregoriano', 330), ('Secuencias', 340)
ON CONFLICT DO NOTHING;
