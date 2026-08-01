-- =============================================================================
-- STELLA MARIS — Bitácora de corridas del cron
-- Migration: 20260731_cron_runs
--
-- El plan de Vercel es Hobby: los crons se disparan "dentro de la hora" y NO hay
-- retención de logs ni API de historial de corridas. Cuando un aviso no llega no
-- se puede saber a posteriori si el cron corrió o si el envío falló, y la
-- respuesta se vuelve deducción. Esta tabla deja el rastro: una fila por corrida
-- con la hora REAL, la fecha lógica usada y cuántos avisos salieron.
--
-- Escribe solo `api/cron/celebration-reminders.ts`; se lee desde el modo
-- diagnóstico de ese mismo endpoint (?dry=1 → `ultimasCorridas`).
--
-- La tabla NO se expone a clientes: RLS habilitada SIN policies (deniega a
-- anon/authenticated; el service role saltea RLS). Mismo criterio que
-- push_subscriptions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cron_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identificador del job, por si mañana hay más de un cron.
  job           TEXT NOT NULL DEFAULT 'celebration-reminders',
  -- Hora REAL de la corrida (en Hobby puede diferir hasta ~1h del horario pedido).
  ran_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Fecha lógica con la que trabajó la corrida (hoy en America/Santiago).
  logical_date  DATE,
  -- Avisos efectivamente aceptados por el push service en esta corrida.
  general_sent  INTEGER NOT NULL DEFAULT 0,
  coro_sent     INTEGER NOT NULL DEFAULT 0,
  course_sent   INTEGER NOT NULL DEFAULT 0,
  -- Suscripciones vivas al momento de correr (contexto para leer los envíos).
  subs_total    INTEGER,
  duration_ms   INTEGER,
  ok            BOOLEAN NOT NULL DEFAULT true,
  error         TEXT
);

-- La consulta natural es "las últimas corridas de este job".
CREATE INDEX IF NOT EXISTS cron_runs_job_ran_at_idx
  ON public.cron_runs (job, ran_at DESC);

ALTER TABLE public.cron_runs ENABLE ROW LEVEL SECURITY;
-- Sin policies a propósito: solo el service role (funciones api/*) accede.
