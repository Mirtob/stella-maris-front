-- =============================================================================
-- Registro de uso de la app (16-oct-2026)
--
-- Cada vez que alguien con sesión abre un módulo (Cantorales, Liturgia, Atril,
-- reproductor, etc.) se anota UNA fila: quién, qué módulo, con qué rol y cuándo.
-- Sirve para el panel "Uso de la app": módulos más usados y usuarios más
-- frecuentes.
--
-- Seguridad:
--  · Nadie inserta directo en la tabla: se escribe solo con log_usage(), que toma
--    el usuario de la sesión (auth.uid()), valida el módulo y descarta la misma
--    visita repetida dentro de 60 s (un botón "atrás/adelante" o un spam no infla
--    el registro).
--  · Solo el administrador PRINCIPAL (is_admin()) puede leerla, y solo a través
--    de usage_summary() / usage_recent().
--  · Retención: se borra lo de más de 12 meses (limpieza oportunista en log_usage).
--
-- APLICAR A MANO: Supabase → SQL Editor → pegar este archivo.
-- =============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.usage_events (
  id          BIGSERIAL   PRIMARY KEY,
  user_id     UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  module      TEXT        NOT NULL CHECK (module ~ '^[a-z0-9-]{1,40}$'),
  role        TEXT        CHECK (role IN ('Coro', 'Pueblo fiel', 'Admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS usage_events_created_idx ON public.usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS usage_events_user_idx    ON public.usage_events (user_id, created_at DESC);

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Lectura directa solo del principal. Sin policies de INSERT/UPDATE/DELETE:
-- la escritura va únicamente por log_usage() (SECURITY DEFINER).
DROP POLICY IF EXISTS "usage_events_admin_read" ON public.usage_events;
CREATE POLICY "usage_events_admin_read" ON public.usage_events
  FOR SELECT USING ((select public.is_admin()));

REVOKE INSERT, UPDATE, DELETE ON public.usage_events FROM anon, authenticated;

-- -----------------------------------------------------------------------------
-- log_usage(): anota la visita del usuario de la sesión
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_usage(p_module TEXT, p_role TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;
  IF p_module IS NULL OR p_module !~ '^[a-z0-9-]{1,40}$' THEN RETURN; END IF;
  IF p_role IS NOT NULL AND p_role NOT IN ('Coro', 'Pueblo fiel', 'Admin') THEN
    p_role := NULL;
  END IF;

  -- La misma visita repetida en menos de un minuto no cuenta dos veces.
  IF EXISTS (
    SELECT 1 FROM public.usage_events
     WHERE user_id = v_uid AND module = p_module
       AND created_at > now() - interval '60 seconds'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.usage_events (user_id, module, role) VALUES (v_uid, p_module, p_role);

  -- Retención de 12 meses, sin cron: de vez en cuando una visita limpia lo viejo.
  IF random() < 0.01 THEN
    DELETE FROM public.usage_events WHERE created_at < now() - interval '12 months';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.log_usage(TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.log_usage(TEXT, TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- usage_summary(): módulos más usados y usuarios más frecuentes (solo principal)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.usage_summary(p_days INT DEFAULT 30)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_since TIMESTAMPTZ;
  v_out   JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el administrador principal' USING ERRCODE = '42501';
  END IF;
  v_since := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 366)));

  WITH ev AS (
    SELECT * FROM public.usage_events WHERE created_at >= v_since
  ),
  modules AS (
    SELECT module,
           count(*)                 AS visits,
           count(DISTINCT user_id)  AS users
      FROM ev GROUP BY module
  ),
  per_user_module AS (
    SELECT user_id, module, count(*) AS n,
           row_number() OVER (PARTITION BY user_id ORDER BY count(*) DESC, module) AS rk
      FROM ev GROUP BY user_id, module
  ),
  users AS (
    SELECT e.user_id,
           count(*)                                AS visits,
           count(DISTINCT (e.created_at AT TIME ZONE 'America/Santiago')::date) AS active_days,
           max(e.created_at)                       AS last_at
      FROM ev e GROUP BY e.user_id
  ),
  by_day AS (
    SELECT (created_at AT TIME ZONE 'America/Santiago')::date AS day,
           count(*) AS visits, count(DISTINCT user_id) AS users
      FROM ev GROUP BY 1
  )
  SELECT jsonb_build_object(
    'days',   greatest(1, least(coalesce(p_days, 30), 366)),
    'totals', jsonb_build_object(
                'visits', (SELECT count(*) FROM ev),
                'users',  (SELECT count(DISTINCT user_id) FROM ev)),
    'modules', coalesce((SELECT jsonb_agg(jsonb_build_object(
                  'module', module, 'visits', visits, 'users', users)
                  ORDER BY visits DESC, module) FROM modules), '[]'::jsonb),
    'users', coalesce((SELECT jsonb_agg(jsonb_build_object(
                  'userId',     u.user_id,
                  'name',       p.name,
                  'email',      p.email,
                  'role',       p.role,
                  'visits',     u.visits,
                  'activeDays', u.active_days,
                  'lastAt',     u.last_at,
                  'topModule',  m.module)
                  ORDER BY u.visits DESC, u.last_at DESC)
                FROM (SELECT * FROM users ORDER BY visits DESC, last_at DESC LIMIT 50) u
                LEFT JOIN public.user_profiles p ON p.id = u.user_id
                LEFT JOIN per_user_module m ON m.user_id = u.user_id AND m.rk = 1), '[]'::jsonb),
    'byDay', coalesce((SELECT jsonb_agg(jsonb_build_object(
                  'day', day, 'visits', visits, 'users', users) ORDER BY day) FROM by_day), '[]'::jsonb)
  ) INTO v_out;

  RETURN v_out;
END;
$$;
REVOKE ALL ON FUNCTION public.usage_summary(INT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.usage_summary(INT) TO authenticated;

-- -----------------------------------------------------------------------------
-- usage_recent(): el registro (log) de las últimas visitas (solo principal)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.usage_recent(p_limit INT DEFAULT 100)
RETURNS TABLE (created_at TIMESTAMPTZ, module TEXT, role TEXT, user_id UUID, name TEXT, email TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el administrador principal' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT e.created_at, e.module, e.role, e.user_id, p.name, p.email
      FROM public.usage_events e
      LEFT JOIN public.user_profiles p ON p.id = e.user_id
     ORDER BY e.created_at DESC
     LIMIT greatest(1, least(coalesce(p_limit, 100), 1000));
END;
$$;
REVOKE ALL ON FUNCTION public.usage_recent(INT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.usage_recent(INT) TO authenticated;

COMMIT;
