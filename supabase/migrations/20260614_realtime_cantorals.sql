-- =============================================================================
-- STELLA MARIS — Realtime en published_cantorals (notificaciones in-app)
-- Migration: 20260614_realtime_cantorals
--
-- Habilita Supabase Realtime sobre published_cantorals para que el Pueblo fiel
-- reciba un aviso en vivo cuando el coro publica un cantoral de su parroquia.
-- RLS sigue aplicando: Realtime solo emite filas que el usuario puede leer
-- (las publicadas son legibles por todos). El filtro por parroquia se hace en
-- el cliente.
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'published_cantorals'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.published_cantorals;
  END IF;
END $$;
