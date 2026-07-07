-- =============================================================================
-- STELLA MARIS — Alta de administrador
-- Migration: 20260708_add_admin_stellamaris
--
-- Agrega stellamarismusicacatolica@gmail.com como administrador. La función
-- is_admin() (SECURITY DEFINER) verifica auth.email() contra la tabla `admins`,
-- y las policies RLS de admin (songs, user_profiles, cantorales, parroquias,
-- celebraciones, etc.) le dan acceso completo a todos los CRUD.
-- =============================================================================

INSERT INTO admins (email, added_by)
VALUES ('stellamarismusicacatolica@gmail.com', 'manual')
ON CONFLICT (email) DO NOTHING;
