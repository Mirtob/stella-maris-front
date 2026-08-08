-- =============================================================================
-- STELLA MARIS — Partituras por voz / instrumento (polifonía)
-- Migration: 20260807_song_sheets
--
-- Hasta ahora cada canto enlazaba UNA sola partitura (`drive_file_id`), así que
-- un canto polifónico mostraba la misma hoja a todo el mundo. Los coros escriben
-- en MuseScore, que exporta un PDF por voz/instrumento MÁS el full score, así que
-- el material ya existe: faltaba dónde guardarlo.
--
-- Modelo: el canto apunta a la CARPETA del canto en Drive (`drive_folder_id`) y
-- guarda en `sheets` la lista de partituras detectadas dentro. La carpeta es la
-- fuente de verdad; `sheets` es una caché para no llamar a Drive cada vez que se
-- abre el Modo Atril. Se vuelve a detectar desde la ficha del canto cuando haga
-- falta (p. ej. al agregar la trompeta después).
--
-- Forma de `sheets` (array de objetos):
--   [{ "part": "Soprano",    "fileId": "1ab…", "fileName": "Ave verum-Soprano.pdf" },
--    { "part": "Full Score", "fileId": "1cd…", "fileName": "Ave verum.pdf" }]
--
-- `drive_file_id` NO se toca ni se deja de usar: sigue siendo la partitura por
-- defecto (el full score) y lo que ve quien no tiene voz asignada. Así todo lo
-- existente —Modo Atril, cuadernillo del coro, ordinario— sigue funcionando igual
-- para los cantos que no tengan partes.
-- =============================================================================

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS sheets          JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.songs.drive_folder_id IS
  'Carpeta del canto en Drive con un PDF por voz/instrumento. Fuente de verdad de `sheets`.';
COMMENT ON COLUMN public.songs.sheets IS
  'Caché de partituras detectadas: [{part, fileId, fileName}]. Se regenera desde la ficha del canto.';

-- Buscar los cantos que ya tienen partes (para el selector de voz y diagnósticos).
CREATE INDEX IF NOT EXISTS songs_sheets_idx
  ON public.songs USING GIN (sheets);

-- RLS: sin cambios. Las policies de `songs` ya existen y aplican a las columnas
-- nuevas automáticamente (son de fila, no de columna).
