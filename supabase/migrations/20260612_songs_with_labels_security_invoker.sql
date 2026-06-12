-- =============================================================================
-- STELLA MARIS — songs_with_labels: SECURITY INVOKER
-- Migration: 20260612_songs_with_labels_security_invoker
--
-- El linter de Supabase marca `public.songs_with_labels` como "Security Definer
-- View". Por defecto una vista corre con los privilegios de SU DUEÑO (postgres),
-- que saltea RLS. Como la vista es `SELECT s.* FROM songs s`, eso permitiría leer
-- TODAS las canciones —incluidas las `pending`/`rejected`— ignorando la política
-- `songs_public_read` (USING approval_status = 'approved') de la tabla `songs`.
--
-- Fix: recrear la vista con `security_invoker = on` (Postgres 15+, soportado por
-- Supabase). Así enforca la RLS del USUARIO que consulta, igual que leer `songs`
-- directo: los no-admin ven solo aprobadas y el admin ve todo.
--
-- No cambia el comportamiento de la app (que ni siquiera usa esta vista hoy):
-- los roles anon/authenticated ya tienen SELECT sobre `songs`, así que la RLS por
-- fila sigue gobernando lo visible.
-- =============================================================================

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
    WHEN 'cordero'       THEN 'Cordero de Dios'
    WHEN 'comunion'      THEN 'Comunión'
    WHEN 'final'         THEN 'Final / Salida'
    WHEN 'exposicion'    THEN 'Exposición y Adoración'
    ELSE                      'No litúrgico'
  END AS mass_moment_label
FROM songs s;
