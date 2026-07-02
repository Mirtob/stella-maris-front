-- =============================================================================
-- STELLA MARIS — Rol en las suscripciones push
-- Migration: 20260702_push_subscription_role
-- (aplicar DESPUÉS de 20260702_push_subscriptions)
--
-- Permite targetear notificaciones por perfil. En particular, el recordatorio de
-- "publica el cantoral" 3 días antes de cada celebración se envía SOLO al Coro.
-- =============================================================================

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS role TEXT;

CREATE INDEX IF NOT EXISTS push_subscriptions_role_idx
  ON public.push_subscriptions (role);
