-- =============================================================================
-- STELLA MARIS — "Padre Nuestro" como momento de la Misa
-- Migration: 20260627_mass_moment_padre_nuestro
--
-- Se agrega `padre_nuestro` al conjunto válido de `mass_moment` (y por ende a
-- `extra_moments`) para poder etiquetar cantos del Padre Nuestro / Pater noster
-- cargados manualmente. El orden canónico (Santo → Padre Nuestro → Cordero) ya
-- existe en la app; aquí solo se habilita el valor en la BD.
-- =============================================================================

-- mass_moment: el CHECK es inline (sin nombre garantizado). Lo localizamos por
-- su definición y lo reemplazamos por uno con el nuevo valor.
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
    'entrada', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'ofertorio', 'santo', 'padre_nuestro', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ));

-- extra_moments: este sí tiene nombre conocido.
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_extra_moments_valid;
ALTER TABLE public.songs ADD CONSTRAINT songs_extra_moments_valid
  CHECK (extra_moments <@ ARRAY[
    'entrada', 'kyrie', 'gloria', 'salmo', 'aleluya',
    'ofertorio', 'santo', 'padre_nuestro', 'cordero', 'comunion', 'final',
    'exposicion', 'no-liturgico'
  ]::text[]);

-- Vista de etiquetas: mapear el nuevo momento a su rótulo legible.
CREATE OR REPLACE VIEW public.songs_with_labels
WITH (security_invoker = on) AS
SELECT
  s.*,
  CASE s.mass_moment
    WHEN 'entrada'       THEN 'Entrada'
    WHEN 'kyrie'         THEN 'Kyrie / Acto Penitencial'
    WHEN 'gloria'        THEN 'Gloria'
    WHEN 'salmo'         THEN 'Salmo Responsorial'
    WHEN 'aleluya'       THEN 'Aleluya / Aclamación'
    WHEN 'ofertorio'     THEN 'Ofertorio'
    WHEN 'santo'         THEN 'Santo'
    WHEN 'padre_nuestro' THEN 'Padre Nuestro'
    WHEN 'cordero'       THEN 'Cordero de Dios'
    WHEN 'comunion'      THEN 'Comunión'
    WHEN 'final'         THEN 'Final / Salida'
    WHEN 'exposicion'    THEN 'Exposición y Adoración'
    ELSE                      'No litúrgico'
  END AS mass_moment_label
FROM songs s;
