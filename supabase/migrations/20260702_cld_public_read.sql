-- =============================================================================
-- STELLA MARIS — Celebraciones personalizadas: lectura PÚBLICA
-- Migration: 20260702_cld_public_read
-- (aplicar DESPUÉS de 20260702_custom_liturgical_dates)
--
-- El Pueblo fiel navega muchas veces como ANÓNIMO (lectura pública de cantorales,
-- deep links, sin login). La policy de SELECT original exigía `auth.uid() IS NOT
-- NULL`, así que a los anónimos les OCULTABA las celebraciones globales del Admin.
-- Las celebraciones no son dato sensible (nombre + fecha litúrgica), igual que los
-- cantorales publicados: se habilita lectura pública. La escritura sigue restringida.
-- =============================================================================

DROP POLICY IF EXISTS "cld_select" ON public.custom_liturgical_dates;
CREATE POLICY "cld_select" ON public.custom_liturgical_dates
  FOR SELECT
  USING (true);
