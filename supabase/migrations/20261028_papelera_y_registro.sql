-- =============================================================================
-- STELLA MARIS — Papelera de cantorales y registro de cambios
-- Migration: 20261028_papelera_y_registro
--
-- POR QUÉ
--
-- Cualquier coro nuevo puede registrarse y publicar sin pedir permiso: eso se quiere
-- así. El costo es que un Coro de la parroquia puede borrar cantorales de otros
-- (también se quiere: los miembros de un coro se reparten el trabajo). Para que un
-- error o una broma no le cueste a nadie su trabajo, sin agregar ninguna restricción:
--
--   1. PAPELERA. Borrar un cantoral ya no lo elimina: queda oculto 30 días y quien
--      podía borrarlo puede restaurarlo. Lo hace un trigger BEFORE DELETE, así que
--      vale para la app vieja, la nueva y una llamada directa a la API por igual.
--   2. REGISTRO. Cada publicación, edición, envío a la papelera, restauración y
--      borrado definitivo queda anotado con quién lo hizo (trigger AFTER). Lo ven el
--      admin principal (todo) y los coros de cada parroquia (lo suyo).
--
-- Solo se borra de verdad: lo vencido (>30 días en la papelera, se purga solo), lo
-- que el admin principal elimine desde la papelera, y lo que se borre con la service
-- key o desde el SQL Editor (auth.uid() NULL = servidor de confianza).
--
-- APLICAR A MANO en el SQL Editor de Supabase, ANTES de desplegar el código que la
-- usa (la app vieja sigue funcionando con esta migración: su "borrar" ya cae en la
-- papelera).
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Columnas de la papelera
-- ---------------------------------------------------------------------------
ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS published_cantorals_papelera_idx
  ON public.published_cantorals (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Un cantoral en la papelera no ocupa su Misa: se puede volver a publicar esa Misa.
-- (Al restaurar se comprueba que no choque con el nuevo.)
DROP INDEX IF EXISTS published_cantorals_mass_uk;
CREATE UNIQUE INDEX IF NOT EXISTS published_cantorals_mass_uk
  ON public.published_cantorals (parish_name, date, mass_time, mass_type)
  WHERE status = 'published' AND deleted_at IS NULL;

-- Lo que está en la papelera no lo ve nadie por la vía normal (ni el admin): todas
-- las pantallas, el buscador de duplicados y los conteos lo ignoran solos. La
-- papelera se lee con papelera_cantorales().
DROP POLICY IF EXISTS "cantorals_select" ON public.published_cantorals;
CREATE POLICY "cantorals_select" ON public.published_cantorals
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      status = 'published'
      OR (
        (select auth.uid()) IS NOT NULL AND (
          created_by IS NULL
          OR created_by = (select auth.uid())
          OR (select public.is_admin())
        )
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Quién puede gestionar un cantoral (la misma regla que cantorals_delete)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.puede_gestionar_cantoral(p_created_by UUID, p_parish TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
     AND (
       p_created_by = auth.uid()
       OR public.is_admin()
       OR (public.is_choir_or_admin() AND public.user_covers_parish(p_parish))
     );
$$;
REVOKE ALL ON FUNCTION public.puede_gestionar_cantoral(UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Purga de lo vencido (interna)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purgar_papelera()
RETURNS VOID
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- 'vencida' (y no 'si'): el registro lo anota como del sistema, no de quien
  -- disparó la purga con su borrado.
  PERFORM set_config('stella.purga', 'vencida', true);
  DELETE FROM public.published_cantorals
   WHERE deleted_at IS NOT NULL
     AND deleted_at < now() - interval '30 days';
  PERFORM set_config('stella.purga', '', true);
END;
$$;
REVOKE ALL ON FUNCTION public.purgar_papelera() FROM PUBLIC, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. DELETE → papelera
-- ---------------------------------------------------------------------------
-- La policy cantorals_delete ya decidió que quien borra PUEDE borrar; aquí solo se
-- cambia el "cómo". RETURN NULL cancela el DELETE de esa fila.
CREATE OR REPLACE FUNCTION public.cantoral_borrar_a_papelera()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Borrado definitivo: purga, admin desde la papelera, o servidor/SQL Editor.
  IF current_setting('stella.purga', true) IN ('si', 'vencida') OR auth.uid() IS NULL THEN
    RETURN OLD;
  END IF;
  IF OLD.deleted_at IS NOT NULL THEN
    RETURN NULL;
  END IF;

  PERFORM set_config('stella.papelera', 'si', true);
  UPDATE public.published_cantorals
     SET deleted_at = now(), deleted_by = auth.uid()
   WHERE id = OLD.id;
  PERFORM set_config('stella.papelera', '', true);

  PERFORM public.purgar_papelera();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cantoral_borrar_a_papelera ON public.published_cantorals;
CREATE TRIGGER cantoral_borrar_a_papelera
  BEFORE DELETE ON public.published_cantorals
  FOR EACH ROW EXECUTE FUNCTION public.cantoral_borrar_a_papelera();

-- Las columnas de la papelera no se tocan con un UPDATE normal: sin esto, el autor
-- podría poner deleted_at = 1970 y la purga se lo llevaría al instante, sin pasar
-- por los 30 días.
CREATE OR REPLACE FUNCTION public.cantoral_proteger_papelera()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND current_setting('stella.papelera', true) IS DISTINCT FROM 'si' THEN
    NEW.deleted_at := OLD.deleted_at;
    NEW.deleted_by := OLD.deleted_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cantoral_proteger_papelera ON public.published_cantorals;
CREATE TRIGGER cantoral_proteger_papelera
  BEFORE UPDATE ON public.published_cantorals
  FOR EACH ROW EXECUTE FUNCTION public.cantoral_proteger_papelera();

-- ---------------------------------------------------------------------------
-- 5. Papelera: listar, restaurar, eliminar definitivo
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.papelera_cantorales()
RETURNS TABLE (cantoral JSONB, borrado_por TEXT)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT to_jsonb(c),
         COALESCE(NULLIF(btrim(p.name), ''), split_part(p.email, '@', 1))
    FROM public.published_cantorals c
    LEFT JOIN public.user_profiles p ON p.id = c.deleted_by
   WHERE c.deleted_at IS NOT NULL
     AND c.deleted_at > now() - interval '30 days'
     AND public.puede_gestionar_cantoral(c.created_by, c.parish_name)
   ORDER BY c.deleted_at DESC
   LIMIT 200;
$$;
REVOKE ALL ON FUNCTION public.papelera_cantorales() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.papelera_cantorales() TO authenticated;

-- 'ok' | 'ocupado' (ya hay otro cantoral para esa Misa) | 'no-permitido' | 'no-existe'
CREATE OR REPLACE FUNCTION public.restaurar_cantoral(p_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c public.published_cantorals;
BEGIN
  SELECT * INTO c FROM public.published_cantorals
   WHERE id::text = p_id AND deleted_at IS NOT NULL;
  IF NOT FOUND THEN RETURN 'no-existe'; END IF;
  IF NOT public.puede_gestionar_cantoral(c.created_by, c.parish_name) THEN
    RETURN 'no-permitido';
  END IF;
  IF c.status = 'published' AND EXISTS (
    SELECT 1 FROM public.published_cantorals o
     WHERE o.deleted_at IS NULL
       AND o.status = 'published'
       AND o.id <> c.id
       AND o.parish_name = c.parish_name
       AND o.date = c.date
       AND o.mass_time = c.mass_time
       AND o.mass_type IS NOT DISTINCT FROM c.mass_type
  ) THEN
    RETURN 'ocupado';
  END IF;

  PERFORM set_config('stella.papelera', 'si', true);
  UPDATE public.published_cantorals
     SET deleted_at = NULL, deleted_by = NULL
   WHERE id = c.id;
  PERFORM set_config('stella.papelera', '', true);
  RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.restaurar_cantoral(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restaurar_cantoral(TEXT) TO authenticated;

-- Solo el admin principal, y solo lo que ya está en la papelera.
CREATE OR REPLACE FUNCTION public.borrar_cantoral_definitivo(p_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  n INT;
BEGIN
  IF NOT public.is_admin() THEN RETURN FALSE; END IF;
  PERFORM set_config('stella.purga', 'si', true);
  DELETE FROM public.published_cantorals
   WHERE id::text = p_id AND deleted_at IS NOT NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM set_config('stella.purga', '', true);
  RETURN n > 0;
END;
$$;
REVOKE ALL ON FUNCTION public.borrar_cantoral_definitivo(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.borrar_cantoral_definitivo(TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- 6. Registro de cambios
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cantoral_changes (
  id              BIGSERIAL PRIMARY KEY,
  cantoral_id     TEXT NOT NULL,
  action          TEXT NOT NULL
                  CHECK (action IN ('publicar', 'editar', 'papelera', 'restaurar', 'borrar')),
  actor           UUID,          -- NULL = servidor (purga, service key, SQL Editor)
  actor_name      TEXT,          -- foto del nombre: sobrevive aunque se borre la cuenta
  parish_name     TEXT,
  cantoral_date   TEXT,
  liturgical_date TEXT,
  mass_time       TEXT,
  detalle         TEXT,          -- en 'editar': columnas que cambiaron, separadas por coma
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cantoral_changes_parish_idx
  ON public.cantoral_changes (parish_name, created_at DESC);
CREATE INDEX IF NOT EXISTS cantoral_changes_created_idx
  ON public.cantoral_changes (created_at DESC);

ALTER TABLE public.cantoral_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cantoral_changes_read" ON public.cantoral_changes;
CREATE POLICY "cantoral_changes_read" ON public.cantoral_changes
  FOR SELECT USING (
    (select public.is_admin())
    OR ((select public.is_choir_or_admin()) AND public.user_covers_parish(parish_name))
  );

-- Nadie escribe a mano en el registro: solo el trigger.
REVOKE INSERT, UPDATE, DELETE ON public.cantoral_changes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.registrar_cambio_cantoral()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid     UUID := auth.uid();
  v_nombre  TEXT;
  v_accion  TEXT;
  v_fila    public.published_cantorals;
  v_detalle TEXT;
  v_old     JSONB;
  v_new     JSONB;
  -- Lo que cambia sin que nadie "edite": el PDF se sube después de publicar.
  v_ignorar CONSTANT TEXT[] := ARRAY['pdf_url', 'updated_at', 'published_at', 'created_at'];
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_accion := 'publicar';
    v_fila := NEW;
  ELSIF TG_OP = 'DELETE' THEN
    v_accion := 'borrar';
    v_fila := OLD;
    IF current_setting('stella.purga', true) = 'vencida' THEN
      v_uid := NULL;  -- venció en la papelera: lo hizo el sistema
    END IF;
  ELSE
    v_fila := NEW;
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      v_accion := 'papelera';
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      v_accion := 'restaurar';
    ELSE
      v_old := to_jsonb(OLD) - v_ignorar;
      v_new := to_jsonb(NEW) - v_ignorar;
      IF v_old = v_new THEN RETURN NULL; END IF;
      SELECT string_agg(n.key, ',' ORDER BY n.key) INTO v_detalle
        FROM jsonb_each(v_new) n
       WHERE n.value IS DISTINCT FROM v_old -> n.key;
      v_accion := 'editar';
    END IF;
  END IF;

  IF v_uid IS NOT NULL THEN
    SELECT COALESCE(NULLIF(btrim(p.name), ''), split_part(p.email, '@', 1))
      INTO v_nombre
      FROM public.user_profiles p
     WHERE p.id = v_uid;
  END IF;

  INSERT INTO public.cantoral_changes
    (cantoral_id, action, actor, actor_name, parish_name, cantoral_date,
     liturgical_date, mass_time, detalle)
  VALUES
    (v_fila.id::text, v_accion, v_uid, v_nombre, v_fila.parish_name, v_fila.date::text,
     v_fila.liturgical_date, v_fila.mass_time, v_detalle);

  -- Retención de 12 meses, sin cron (como usage_events).
  IF random() < 0.01 THEN
    DELETE FROM public.cantoral_changes WHERE created_at < now() - interval '12 months';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS cantoral_changes_log ON public.published_cantorals;
CREATE TRIGGER cantoral_changes_log
  AFTER INSERT OR UPDATE OR DELETE ON public.published_cantorals
  FOR EACH ROW EXECUTE FUNCTION public.registrar_cambio_cantoral();

-- Las funciones de trigger no se llaman por RPC.
REVOKE ALL ON FUNCTION public.cantoral_borrar_a_papelera() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cantoral_proteger_papelera() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.registrar_cambio_cantoral() FROM PUBLIC, anon, authenticated;

COMMIT;

-- =============================================================================
-- VERIFICACIÓN
--   -- Columnas y triggers:
--   SELECT tgname FROM pg_trigger
--    WHERE tgrelid = 'published_cantorals'::regclass AND NOT tgisinternal;
--   -- Debe listar cantoral_borrar_a_papelera, cantoral_proteger_papelera,
--   -- cantoral_changes_log (y los que ya había).
--
--   -- Después de borrar uno desde la app:
--   SELECT id, deleted_at, deleted_by FROM published_cantorals WHERE deleted_at IS NOT NULL;
--   SELECT * FROM cantoral_changes ORDER BY created_at DESC LIMIT 10;
--
-- NOTA: el PDF de un cantoral purgado queda en Storage (cantorales-pdf/<id>.pdf).
-- Son pocos KB por cantoral; se pueden limpiar a mano si algún día molestan.
-- =============================================================================
