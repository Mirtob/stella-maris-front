-- =============================================================================
-- STELLA MARIS — Avisos y promociones por push (registro de envíos)
-- Migration: 20260903_push_avisos
--
-- Se están sumando usuarios de diócesis cuyas parroquias todavía no están cargadas.
-- El administrador principal necesita poder hablarles: avisos, promociones, novedades.
--
-- Esta tabla es el REGISTRO de lo enviado. No es decorativa:
--   · Un push no se puede retirar. Saber qué se mandó, a quién y cuándo es lo único
--     que permite no repetir un aviso ni contradecir el anterior.
--   · Deja ver el desgaste: si en la lista hay tres avisos esta semana, la respuesta a
--     "¿mando otro?" es no. Sin registro esa pregunta no se puede ni plantear.
--   · `sent` frente a `subs_total` distingue "no había a quién avisar" de "había y
--     falló", que es la diferencia entre un problema de audiencia y uno de entrega.
--
-- ESCRIBE solo la función serverless (service role). LEE solo el admin principal:
-- `is_admin()` significa admin pleno desde 20260901_admin_solo_cantos.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.push_broadcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  -- A dónde lleva al tocarlo (ruta interna: '/', '/instalar', '/c/<id>'…).
  url         TEXT,
  -- A quién se dirigió: { todos } | { dioceses: [...] } | { roles: [...] }.
  -- Se guarda tal cual se eligió, para poder repetir o descartar un envío igual.
  audience    JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Destinatarios que CALZABAN con el filtro, hayan recibido o no.
  subs_total  INTEGER NOT NULL DEFAULT 0,
  sent        INTEGER NOT NULL DEFAULT 0,
  failed      INTEGER NOT NULL DEFAULT 0,
  sent_by     TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_broadcasts_sent_at_idx
  ON public.push_broadcasts (sent_at DESC);

ALTER TABLE public.push_broadcasts ENABLE ROW LEVEL SECURITY;

-- Leer: solo el administrador principal (el historial dice a quién se le escribió).
DROP POLICY IF EXISTS "push_broadcasts_read_admin" ON public.push_broadcasts;
CREATE POLICY "push_broadcasts_read_admin" ON public.push_broadcasts
  FOR SELECT
  USING ((select public.is_admin()));

-- Escribir: nadie desde el cliente. Lo hace la función serverless con service role,
-- que se salta la RLS. Sin policy de INSERT/UPDATE/DELETE, cualquier intento desde el
-- navegador queda bloqueado aunque alguien tenga sesión de admin.

COMMIT;

-- =============================================================================
-- CONSULTAS ÚTILES
--
-- Qué se ha mandado últimamente:
--   SELECT sent_at, title, audience, sent, subs_total
--     FROM push_broadcasts ORDER BY sent_at DESC LIMIT 20;
--
-- Cuánto se está avisando este mes (para no cansar a la gente):
--   SELECT date_trunc('week', sent_at) AS semana, count(*)
--     FROM push_broadcasts GROUP BY 1 ORDER BY 1 DESC;
-- =============================================================================
