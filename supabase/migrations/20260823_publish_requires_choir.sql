-- =============================================================================
-- STELLA MARIS — Publicar exige ser Coro o Admin (no basta con tener cuenta)
-- Migration: 20260823_publish_requires_choir
--
-- HALLAZGO DEL AUTO-ATAQUE PREVIO AL LANZAMIENTO (23-ago-2026)
--
-- La política `cantorals_insert` solo pedía estar autenticado. La app impide
-- publicar a quien no es Coro (RoleGuard en la pantalla), pero la API de Supabase
-- es alcanzable directamente con el token de CUALQUIER cuenta. Se comprobó en
-- producción: una cuenta recién creada de "Pueblo fiel" publicó un cantoral con
-- parroquia inventada, y quedó visible **hasta para usuarios anónimos** (los
-- cantorales publicados son de lectura pública para los enlaces QR). La fila y la
-- cuenta de prueba se borraron enseguida.
--
-- Es la clase de agujero que no se nota hasta que alguien lo usa: no permite
-- editar ni borrar lo ajeno (esas políticas ya eran de dueño o admin), pero sí
-- ensuciar el archivo de todas las parroquias con cantorales falsos.
--
-- Aquí se exige el rol de verdad, del lado del servidor. Lo mismo para las
-- celebraciones del calendario, que tenían el mismo criterio.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

-- ── Helper: ¿quien llama es del coro o administrador? ────────────────────────
-- SECURITY DEFINER para que la política no dependa de las RLS de user_profiles,
-- y STABLE para que el planificador la evalúe una vez por consulta.
-- `search_path = ''` obliga a calificar los nombres (misma convención que
-- is_admin(), ver 20260612_functions_search_path.sql).
CREATE OR REPLACE FUNCTION public.is_choir_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.user_profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('Coro', 'Admin')
    );
$$;

-- También a `anon`: si un anónimo intenta el INSERT, la política evalúa la función
-- y sin permiso daría "permission denied for function" en vez de la negación
-- limpia de RLS. Da igual para la seguridad, pero el error confunde. (Misma
-- decisión que is_admin(), ver 20260612_functions_search_path.sql.)
GRANT EXECUTE ON FUNCTION public.is_choir_or_admin() TO anon, authenticated;

COMMENT ON FUNCTION public.is_choir_or_admin() IS
  'TRUE si el usuario actual es del coro o administrador. Se usa en las políticas '
  'de escritura de lo que se publica a la comunidad.';

-- ── published_cantorals: publicar es cosa del coro ───────────────────────────
DROP POLICY IF EXISTS "cantorals_insert" ON public.published_cantorals;
CREATE POLICY "cantorals_insert" ON public.published_cantorals
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
  );

-- ── custom_liturgical_dates: agregar celebraciones, también ──────────────────
-- (el 'global' sigue siendo exclusivo del admin, como antes)
DROP POLICY IF EXISTS "cld_insert" ON public.custom_liturgical_dates;
CREATE POLICY "cld_insert" ON public.custom_liturgical_dates
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (scope <> 'global' OR (select public.is_admin()))
    AND (select public.is_choir_or_admin())
  );

-- ── Comprobación (opcional, para correr después de aplicar) ──────────────────
-- Con una cuenta de Pueblo fiel, esto debe fallar con "row-level security":
--   INSERT INTO published_cantorals (id, choir_id, parish_name, date, status, songs)
--   VALUES (gen_random_uuid(), gen_random_uuid(), 'PRUEBA', current_date, 'published', '[]');
-- Con una cuenta de Coro, debe funcionar igual que siempre.
