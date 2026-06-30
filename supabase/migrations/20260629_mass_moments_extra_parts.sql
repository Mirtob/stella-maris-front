-- =============================================================================
-- STELLA MARIS — Nuevas partes de la Misa (momentos adicionales)
-- Migration: 20260629_mass_moments_extra_parts
--
-- Habilita en la BD seis momentos nuevos para poder etiquetar cantos cargados
-- manualmente desde el panel de administración:
--   · rito_aspersion               → "Rito de Aspersión"
--   · post_evangelio               → "Post Evangelio"  (antes colapsaba a 'aleluya')
--   · respuesta_oracion_universal  → "Respuesta a Oración Universal"
--   · aclamacion_consagracion      → "Aclamación Consagración"
--   · amen_doxologia               → "Amén (Doxología)"
--   · tuyo_es_el_reino             → "Tuyo es el Reino"
--
-- Solo habilita los valores en los CHECK (mass_moment y extra_moments) y agrega
-- sus rótulos a la vista songs_with_labels. El orden canónico ya está en la app.
-- =============================================================================

-- mass_moment: el CHECK puede ser inline (sin nombre) o el nombrado en 20260627.
-- Localizamos cualquier CHECK de mass_moment (que NO sea el de extra_moments) y lo
-- reemplazamos por uno con el conjunto ampliado.
DO $$
DECLARE
  c_name text;
BEGIN
  SELECT conname INTO c_name
  FROM pg_constraint
  WHERE conrelid = 'public.songs'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%mass_moment%'
    AND pg_get_constraintdef(oid) ILIKE '%entrada%'
    AND pg_get_constraintdef(oid) NOT ILIKE '%extra_moments%';

  IF c_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.songs DROP CONSTRAINT %I', c_name);
  END IF;
END $$;

ALTER TABLE public.songs ADD CONSTRAINT songs_mass_moment_valid
  CHECK (mass_moment IN (
    'entrada', 'rito_aspersion', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'post_evangelio', 'respuesta_oracion_universal', 'ofertorio', 'santo',
    'aclamacion_consagracion', 'amen_doxologia', 'padre_nuestro',
    'tuyo_es_el_reino', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ));

-- extra_moments: nombre conocido.
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_extra_moments_valid;
ALTER TABLE public.songs ADD CONSTRAINT songs_extra_moments_valid
  CHECK (extra_moments <@ ARRAY[
    'entrada', 'rito_aspersion', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'post_evangelio', 'respuesta_oracion_universal', 'ofertorio', 'santo',
    'aclamacion_consagracion', 'amen_doxologia', 'padre_nuestro',
    'tuyo_es_el_reino', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ]::text[]);

-- Vista de etiquetas: mapear los nuevos momentos a su rótulo legible.
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
