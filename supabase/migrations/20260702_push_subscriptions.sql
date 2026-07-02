-- =============================================================================
-- STELLA MARIS — Suscripciones de notificaciones push (Web Push / PWA)
-- Migration: 20260702_push_subscriptions
--
-- Guarda la suscripción PushManager de cada dispositivo para enviarle avisos al
-- teléfono aunque la app esté cerrada:
--   - Celebraciones próximas (global o de su parroquia) — cron diario.
--   - "Nuevo cantoral publicado" para su parroquia — al publicar.
--
-- La tabla NO se expone a clientes: solo las funciones serverless (service role)
-- leen/escriben aquí. Por eso RLS queda habilitada SIN policies (deniega a
-- anon/authenticated; el service role saltea RLS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_id     UUID,
  -- Parroquias/capillas para las que este dispositivo quiere avisos de cantoral.
  parishes    TEXT[] NOT NULL DEFAULT '{}',
  -- Tipos de aviso habilitados: 'celebrations' | 'cantorals'.
  topics      TEXT[] NOT NULL DEFAULT '{celebrations,cantorals}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para el targeting (contiene parroquia / contiene topic).
CREATE INDEX IF NOT EXISTS push_subscriptions_parishes_idx
  ON public.push_subscriptions USING GIN (parishes);
CREATE INDEX IF NOT EXISTS push_subscriptions_topics_idx
  ON public.push_subscriptions USING GIN (topics);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: solo el service role (funciones api/*) accede.
