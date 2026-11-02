-- =============================================================================
-- STELLA MARIS — Bronces y obras instrumentales
-- Migration: 20261102_bronces_e_instrumentales
--
-- Pedido del 2-nov-2026: que los músicos que no cantan ni tocan órgano (bronces)
-- tengan su material en el Modo Atril.
--
--  · songs.instrumental  → la obra no tiene letra ni la canta la asamblea (un
--    ofertorio para bronces, el toque de la elevación). Solo la ve el coro: no sale
--    en el folleto ni en lo que ve el Pueblo fiel.
--  · mass_moment 'elevacion' → el toque de la elevación, entre el Santo y la
--    aclamación de la consagración. Es siempre instrumental.
--
-- Los ARREGLOS de bronces de un canto o una aclamación no necesitan nada aquí: son
-- PDF por instrumento dentro de la carpeta del canto en Drive (songs.sheets).
--
-- Aditiva e idempotente. Aplicar a mano en el SQL Editor de Supabase.
-- =============================================================================

ALTER TABLE public.songs
  ADD COLUMN IF NOT EXISTS instrumental BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.songs.instrumental IS
  'Obra solo instrumental (bronces, órgano solo): la ve el coro, nunca el Pueblo fiel ni el folleto.';

-- mass_moment: mismo procedimiento que 20260629 (el CHECK puede no tener nombre fijo).
DO $$
DECLARE
  c_name text;
BEGIN
  FOR c_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.songs'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%mass_moment%'
      AND pg_get_constraintdef(oid) ILIKE '%entrada%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%extra_moments%'
  LOOP
    EXECUTE format('ALTER TABLE public.songs DROP CONSTRAINT %I', c_name);
  END LOOP;
END $$;

ALTER TABLE public.songs ADD CONSTRAINT songs_mass_moment_valid
  CHECK (mass_moment IN (
    'entrada', 'rito_aspersion', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'post_evangelio', 'respuesta_oracion_universal', 'ofertorio', 'santo',
    'elevacion',
    'aclamacion_consagracion', 'amen_doxologia', 'padre_nuestro',
    'tuyo_es_el_reino', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ));

ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_extra_moments_valid;
ALTER TABLE public.songs ADD CONSTRAINT songs_extra_moments_valid
  CHECK (extra_moments <@ ARRAY[
    'entrada', 'rito_aspersion', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'post_evangelio', 'respuesta_oracion_universal', 'ofertorio', 'santo',
    'elevacion',
    'aclamacion_consagracion', 'amen_doxologia', 'padre_nuestro',
    'tuyo_es_el_reino', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ]::text[]);

-- La vista se rehace: `s.*` se expande al crearla, así que sin esto no traería la
-- columna nueva. Se agrega además el rótulo de la elevación.
DROP VIEW IF EXISTS public.songs_with_labels;
CREATE VIEW public.songs_with_labels
WITH (security_invoker = on) AS
SELECT
  s.*,
  CASE s.mass_moment
    WHEN 'entrada'                     THEN 'Entrada'
    WHEN 'rito_aspersion'              THEN 'Rito de Aspersión'
    WHEN 'kyrie'                       THEN 'Kyrie / Acto Penitencial'
    WHEN 'gloria'                      THEN 'Gloria'
    WHEN 'salmo'                       THEN 'Salmo Responsorial'
    WHEN 'aleluya'                     THEN 'Aleluya / Aclamación'
    WHEN 'post_evangelio'              THEN 'Post Evangelio'
    WHEN 'respuesta_oracion_universal' THEN 'Respuesta a Oración Universal'
    WHEN 'ofertorio'                   THEN 'Ofertorio'
    WHEN 'santo'                       THEN 'Santo'
    WHEN 'elevacion'                   THEN 'Elevación'
    WHEN 'aclamacion_consagracion'     THEN 'Aclamación Consagración'
    WHEN 'amen_doxologia'              THEN 'Amén (Doxología)'
    WHEN 'padre_nuestro'               THEN 'Padre Nuestro'
    WHEN 'tuyo_es_el_reino'            THEN 'Tuyo es el Reino'
    WHEN 'cordero'                     THEN 'Cordero de Dios'
    WHEN 'comunion'                    THEN 'Comunión'
    WHEN 'final'                       THEN 'Final / Salida'
    WHEN 'exposicion'                  THEN 'Exposición y Adoración'
    ELSE                                    'No litúrgico'
  END AS mass_moment_label
FROM songs s;
