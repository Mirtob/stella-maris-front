-- =============================================================================
-- STELLA MARIS — Lectura pública de cantorales publicados (deep link / QR)
-- Migration: 20260613_public_cantoral_read
-- (aplica DESPUÉS de las 20260612_*)
--
-- Al escanear el QR, cualquiera (incluido anon, sin login) debe poder ver el
-- cantoral en la vista Pueblo fiel. Hoy `cantorals_select` exige
-- `auth.uid() IS NOT NULL`, así que anon no lee ninguna fila.
--
-- Se recrea la policy para que los cantorales con `status='published'` sean
-- legibles por cualquiera, manteniendo los borradores (no publicados) visibles
-- SOLO para su dueño o un admin. Los datos publicados son letras de cantos, no
-- sensibles, y es justamente lo que el QR comparte con la comunidad.
--
-- Mantiene el wrap `(select ...)` del fix de auth_rls_initplan.
-- =============================================================================

DROP POLICY IF EXISTS "cantorals_select" ON public.published_cantorals;
CREATE POLICY "cantorals_select" ON public.published_cantorals
  FOR SELECT
  USING (
    status = 'published'
    OR (
      (select auth.uid()) IS NOT NULL AND (
        created_by IS NULL
        OR created_by = (select auth.uid())
        OR (select public.is_admin())
      )
    )
  );
