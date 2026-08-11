-- =============================================================================
-- STELLA MARIS — Video por versión de acompañamiento (órgano / guitarra)
-- Migration: 20260810_song_video_by_instrument
--
-- Cada canto se graba DOS veces: una versión con órgano y otra con guitarra.
-- Hasta ahora el canto guardaba un solo `youtube_id`, así que el guitarrista y
-- el organista veían el mismo video y uno de los dos ensayaba con el
-- acompañamiento equivocado. La alternativa —dos filas, una por versión— parte
-- en dos la letra, la partitura y los favoritos del MISMO canto.
--
-- Modelo: UN canto, dos videos. El instrumento elegido al iniciar sesión (o el
-- elegido para esta Misa en el constructor) decide cuál se reproduce. La
-- resolución vive en src/utils/songVideo.ts:
--
--   1. el video de TU instrumento (`youtube_id_organo` / `youtube_id_guitarra`)
--   2. si no está grabado aún, el video general (`youtube_id`)
--   3. si tampoco, el de la otra versión — con aviso en pantalla de qué versión
--      se está viendo, para que nadie ensaye a ciegas
--
-- `youtube_id` NO se toca: sigue siendo el video único/general y es lo que
-- tiene todo el catálogo actual, así que nada deja de funcionar. Las columnas
-- nuevas se llenan a medida que se graban las dos versiones.
-- =============================================================================

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS youtube_id_organo   TEXT,
  ADD COLUMN IF NOT EXISTS youtube_id_guitarra TEXT;

-- Mismo formato que `youtube_id` (11 caracteres). NULL = esa versión no existe.
-- NOT VALID: no revalida las filas viejas (todas tienen NULL) y evita bloquear
-- la tabla; las nuevas y las modificadas sí se validan.
DO $$
BEGIN
  ALTER TABLE public.songs
    ADD CONSTRAINT songs_youtube_id_organo_check
    CHECK (youtube_id_organo IS NULL OR youtube_id_organo ~ '^[a-zA-Z0-9_-]{11}$') NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.songs
    ADD CONSTRAINT songs_youtube_id_guitarra_check
    CHECK (youtube_id_guitarra IS NULL OR youtube_id_guitarra ~ '^[a-zA-Z0-9_-]{11}$') NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.songs.youtube_id_organo IS
  'Video de la versión con órgano. NULL = aún no grabada (se cae a youtube_id).';
COMMENT ON COLUMN public.songs.youtube_id_guitarra IS
  'Video de la versión con guitarra. NULL = aún no grabada (se cae a youtube_id).';

-- `search_songs` devuelve SETOF songs, así que las columnas nuevas viajan solas:
-- no hay que recrear la función.
--
-- RLS: sin cambios. Las policies de `songs` son de fila, no de columna.
