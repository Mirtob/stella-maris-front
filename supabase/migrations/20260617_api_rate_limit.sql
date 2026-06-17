-- =============================================================================
-- STELLA MARIS — Rate limit distribuido para endpoints serverless (QA-1)
-- Migration: 20260617_api_rate_limit
--
-- Problema: api/{pdf,sheets,suggest}.ts limitaban con un Map en memoria, que en
-- Vercel es por instancia → el límite real era 20×nº instancias y nunca disparaba
-- 429 bajo carga distribuida.
--
-- Solución: contador compartido en Postgres. La función es SECURITY DEFINER y la
-- llama la anon key vía PostgREST RPC. La tabla queda privada (sin policies), solo
-- accesible a través de la función. El endpoint hace fail-open si esto no responde.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  key       TEXT        PRIMARY KEY,           -- 'endpoint:ip'
  count     INT         NOT NULL DEFAULT 0,
  reset_at  TIMESTAMPTZ NOT NULL
);

-- RLS activa y SIN policies → ningún rol (anon/authenticated) accede directo.
-- Solo la función SECURITY DEFINER (owner) puede leer/escribir.
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Función atómica: incrementa el contador de `p_key` dentro de su ventana y
-- devuelve si la petición está permitida y cuántas quedan.
-- El INSERT ... ON CONFLICT ... toma lock de fila → seguro ante concurrencia.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.api_rate_limit(
  p_key            TEXT,
  p_limit          INT,
  p_window_seconds INT
)
RETURNS TABLE (allowed BOOLEAN, remaining INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now   TIMESTAMPTZ := now();
  v_count INT;
BEGIN
  -- Limpieza oportunista (prob. baja) para que la tabla no crezca sin límite.
  IF random() < 0.01 THEN
    DELETE FROM public.api_rate_limits WHERE reset_at < v_now - INTERVAL '1 hour';
  END IF;

  INSERT INTO public.api_rate_limits AS t (key, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_seconds))
  ON CONFLICT (key) DO UPDATE
    SET count    = CASE WHEN t.reset_at < v_now THEN 1 ELSE t.count + 1 END,
        reset_at = CASE WHEN t.reset_at < v_now
                        THEN v_now + make_interval(secs => p_window_seconds)
                        ELSE t.reset_at END
  RETURNING t.count INTO v_count;

  allowed   := v_count <= p_limit;
  remaining := GREATEST(0, p_limit - v_count);
  RETURN NEXT;
END;
$$;

-- Solo ejecutable por los roles del API (no por public anónimo del internet).
REVOKE ALL ON FUNCTION public.api_rate_limit(TEXT, INT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.api_rate_limit(TEXT, INT, INT) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Verificación rápida (correr en SQL Editor):
--   SELECT * FROM public.api_rate_limit('test:1.2.3.4', 3, 60);  -- allowed=t remaining=2
--   SELECT * FROM public.api_rate_limit('test:1.2.3.4', 3, 60);  -- allowed=t remaining=1
--   SELECT * FROM public.api_rate_limit('test:1.2.3.4', 3, 60);  -- allowed=t remaining=0
--   SELECT * FROM public.api_rate_limit('test:1.2.3.4', 3, 60);  -- allowed=f remaining=0
-- ---------------------------------------------------------------------------
