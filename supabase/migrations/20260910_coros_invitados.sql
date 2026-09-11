-- =============================================================================
-- STELLA MARIS — Coros invitados: publicar en la parroquia que te invita
-- Migration: 20260910_coros_invitados
--
-- EL CASO REAL
-- En la fiesta patronal, una parroquia invita al coro de otra. El 10 de octubre el
-- coro de Pirque canta en Valdivia de Paine. Ese coro tiene que poder publicar el
-- cantoral de ESA Misa, para que el pueblo fiel de Valdivia lo vea como el cantoral
-- de su parroquia.
--
-- Hasta ahora era imposible por diseño: la migración 20260824 cerró la publicación a
-- la parroquia propia (`user_covers_parish`), y la app baja a Pueblo fiel a quien
-- está de visita. Esta migración NO abre esa puerta para todos: abre una rendija
-- nominativa y con fecha.
--
-- QUIÉN AUTORIZA
-- La parroquia ANFITRIONA. Su coro (o un admin) registra la invitación: «Coro de
-- Pirque, 10 de octubre». Nadie se auto-invita: crear la fila exige cubrir la
-- parroquia anfitriona, que es la misma regla que ya gobierna publicar ahí.
--
-- HASTA CUÁNDO
-- Solo esa fecha. El permiso se apaga solo — no hay que acordarse de revocarlo, que
-- es como se acumulan los permisos que nadie limpia. La fecha que manda es la de la
-- CELEBRACIÓN (columna `date` de published_cantorals), así que un sábado por la
-- tarde se invita al DOMINGO con tipo I Vísperas: la invitación lleva la fecha del
-- domingo y el `mass_type`, y el cantoral que se publique lleva esa misma fecha.
--
-- QUIÉN LA DESHACE
-- La invitación la RETIRA quien invitó (la parroquia anfitriona) y la RECHAZA el coro
-- invitado — cada parte deshace su lado, ninguna el del otro. Rechazar no borra la
-- fila: queda marcada (`rejected_at`), para que el anfitrión vea que no van a ir en
-- vez de encontrarse con que la invitación desapareció sola.
--
-- HEREDA LA MISMA BARANDA
-- La parroquia del usuario sigue siendo autodeclarada (ver la nota larga de
-- 20260824): esto frena el accidente y el abuso casual, no al que se declare de
-- otra parroquia a propósito. Se apoya en `user_covers_parish` para no tener dos
-- reglas distintas sobre lo mismo.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

-- ── La invitación ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.choir_invitations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Dónde se canta: la parroquia (o capilla) anfitriona, con el mismo formato que
  -- `published_cantorals.parish_name` — "<Parroquia> - <Diócesis>[ · <Capilla>]".
  host_parish  TEXT NOT NULL,
  -- Quién viene: la parroquia (o capilla) del coro invitado. Se invita a un CORO, no a
  -- una persona: el que publica puede ser cualquiera de ese coro. Una capilla puede
  -- invitar al coro de otra parroquia o de otra capilla, y al revés.
  guest_parish TEXT NOT NULL,
  -- Fecha de la CELEBRACIÓN (no la del día en que se canta).
  date         DATE NOT NULL,
  -- I Vísperas (se canta la tarde anterior), Misa del día, o II Vísperas. Es parte de
  -- la invitación: «el domingo 11, I Vísperas» significa el sábado por la tarde.
  mass_type    TEXT NOT NULL DEFAULT 'dia'
                 CHECK (mass_type IN ('visperas_i', 'dia', 'visperas_ii')),
  -- Rechazo del coro invitado. NULL = sigue en pie.
  rejected_at  TIMESTAMPTZ,
  rejected_by  UUID,
  -- Para qué ("Fiesta patronal de San Francisco"). Se muestra a las dos partes.
  note         TEXT,
  created_by   UUID DEFAULT auth.uid(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La misma invitación dos veces es un accidente de doble toque, no una segunda misa.
CREATE UNIQUE INDEX IF NOT EXISTS choir_invitations_uniq
  ON public.choir_invitations (host_parish, guest_parish, date);

-- El coro invitado pregunta "¿dónde me toca?"; la anfitriona, "¿a quién invité?".
CREATE INDEX IF NOT EXISTS choir_invitations_guest_idx
  ON public.choir_invitations (guest_parish, date);
CREATE INDEX IF NOT EXISTS choir_invitations_host_idx
  ON public.choir_invitations (host_parish, date);

ALTER TABLE public.choir_invitations ENABLE ROW LEVEL SECURITY;

-- ── SELECT: cualquier autenticado ────────────────────────────────────────────
-- No es dato sensible (quién canta dónde es público el domingo igual) y las dos
-- partes necesitan verla: el invitado para saber que puede publicar, la anfitriona
-- para saber a quién invitó. El cliente filtra por parroquia.
DROP POLICY IF EXISTS "choir_inv_select" ON public.choir_invitations;
CREATE POLICY "choir_inv_select" ON public.choir_invitations
  FOR SELECT
  USING ((select auth.uid()) IS NOT NULL);

-- ── INSERT: solo la parroquia ANFITRIONA invita ──────────────────────────────
-- Es la clave de todo el diseño: nadie se auto-invita. Se exige cubrir
-- `host_parish` — exactamente lo que se exige para publicar ahí.
DROP POLICY IF EXISTS "choir_inv_insert" ON public.choir_invitations;
CREATE POLICY "choir_inv_insert" ON public.choir_invitations
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
    AND public.user_covers_parish(host_parish)
  );

-- ── DELETE: RETIRAR la invitación — solo quien invitó ────────────────────────
-- El coro invitado no puede borrarla: lo suyo es RECHAZARLA (más abajo), que deja
-- constancia. Sin UPDATE abierto a propósito: cambiarle la fecha o el coro por debajo
-- dejaría al invitado con un permiso que ya no reconoce. El único cambio posible es
-- el rechazo, y va por una función que solo toca esa columna.
DROP POLICY IF EXISTS "choir_inv_delete" ON public.choir_invitations;
CREATE POLICY "choir_inv_delete" ON public.choir_invitations
  FOR DELETE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid()))
    OR public.user_covers_parish(host_parish)
    OR (select public.is_admin())
  );

-- ── RECHAZAR: el coro invitado dice que no puede ────────────────────────────
-- Va por función y no por una policy de UPDATE porque la RLS no sabe de columnas: con
-- UPDATE abierto, el invitado podría además moverse la fecha. Aquí lo único que se
-- puede escribir es el rechazo, y solo sobre la invitación propia.
CREATE OR REPLACE FUNCTION public.rechazar_invitacion(p_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  UPDATE public.choir_invitations i
     SET rejected_at = now(),
         rejected_by = auth.uid()
   WHERE i.id = p_id
     AND i.rejected_at IS NULL
     AND public.user_covers_parish(i.guest_parish)
  RETURNING TRUE INTO v_ok;
  RETURN COALESCE(v_ok, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rechazar_invitacion(UUID) TO authenticated;

COMMENT ON FUNCTION public.rechazar_invitacion(UUID) IS
  'El coro invitado rechaza la invitación (no la borra: queda marcada). Solo la suya. '
  'Ver 20260910_coros_invitados.';

-- ── ¿Estoy invitado a esa parroquia ese día? ─────────────────────────────────
-- `user_covers_parish(guest_parish)` reutiliza la regla de "ser de esa parroquia"
-- (incluye capillas y admin) en vez de escribir una segunda versión que se desvíe.
-- El anfitrión se compara igual que allá: exacto, o una capilla que cuelga de él,
-- para que invitar a la parroquia alcance a sus capillas.
--
-- OJO CON EL TIPO DE `p_fecha`: es TEXT, no DATE. `published_cantorals.date` es una
-- columna de TEXTO (así se creó), y desde una policy de esa tabla se pasa tal cual;
-- declararla DATE hacía fallar la migración entera con
--   42883: function public.user_invited_to_parish(text, text) does not exist
-- Se compara `i.date::text` en vez de castear el parámetro a DATE, para que ninguna
-- fila con una fecha mal escrita pueda reventar la evaluación de la policy.
-- Por si quedó colgando la versión con DATE de un intento anterior: dos sobrecargas
-- harían ambigua cualquier llamada futura.
DROP FUNCTION IF EXISTS public.user_invited_to_parish(TEXT, DATE);

CREATE OR REPLACE FUNCTION public.user_invited_to_parish(p_unidad TEXT, p_fecha TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(btrim(p_unidad), '') <> ''
    AND COALESCE(btrim(p_fecha), '') <> ''
    AND EXISTS (
      SELECT 1
      FROM public.choir_invitations i
      -- to_char y no `::text` para no depender del DateStyle del servidor.
      WHERE to_char(i.date, 'YYYY-MM-DD') = left(btrim(p_fecha), 10)
        -- Rechazada = como si no existiera.
        AND i.rejected_at IS NULL
        AND (
          p_unidad = i.host_parish
          OR left(p_unidad, length(i.host_parish) + 3) = i.host_parish || ' · '
        )
        AND public.user_covers_parish(i.guest_parish)
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_invited_to_parish(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.user_invited_to_parish(TEXT, TEXT) IS
  'TRUE si el coro del usuario está invitado a cantar en esa parroquia/capilla ESE '
  'día (tabla choir_invitations). Ver 20260910_coros_invitados.';

-- ── published_cantorals: la parroquia propia, O la que te invitó ese día ─────
DROP POLICY IF EXISTS "cantorals_insert" ON public.published_cantorals;
CREATE POLICY "cantorals_insert" ON public.published_cantorals
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
    AND (
      public.user_covers_parish(parish_name)
      OR public.user_invited_to_parish(parish_name, published_cantorals.date)
    )
  );

-- Editarlo después (corregir la hora, cambiar un canto) es parte de publicarlo.
DROP POLICY IF EXISTS "cantorals_update" ON public.published_cantorals;
CREATE POLICY "cantorals_update" ON public.published_cantorals
  FOR UPDATE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin())
  )
  WITH CHECK (
    ((created_by IS NOT NULL AND created_by = (select auth.uid())) OR (select public.is_admin()))
    AND (
      public.user_covers_parish(parish_name)
      OR public.user_invited_to_parish(parish_name, published_cantorals.date)
    )
  );

-- ── DELETE: la parroquia anfitriona manda en su propia casa ──────────────────
-- Si se le abre la puerta a un coro invitado, la parroquia tiene que poder sacar lo
-- que se publicó en su nombre sin depender de que el invitado lo borre. Además
-- alinea la BD con lo que la app ya ofrece: el coro de una parroquia administra los
-- cantorales de su parroquia.
DROP POLICY IF EXISTS "cantorals_delete" ON public.published_cantorals;
CREATE POLICY "cantorals_delete" ON public.published_cantorals
  FOR DELETE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid()))
    OR (select public.is_admin())
    OR ((select public.is_choir_or_admin()) AND public.user_covers_parish(parish_name))
  );

COMMIT;

-- =============================================================================
-- COMPROBACIÓN (correr después de aplicar)
--
-- Con una cuenta del coro de Pirque, sin invitación:
--   INSERT ... parish_name = 'Valdivia de Paine - …'  → falla (row-level security)
--
-- Con el coro de Valdivia, registrar la invitación (sábado por la tarde = domingo,
-- I Vísperas):
--   INSERT INTO choir_invitations (host_parish, guest_parish, date, mass_type, note)
--   VALUES ('Valdivia de Paine - …', 'Pirque - …', '2026-10-11', 'visperas_i',
--           'Fiesta patronal');
--
-- Y ahora, de nuevo con la cuenta de Pirque:
--   INSERT ... parish_name='Valdivia de Paine - …', date='2026-10-11' → funciona
--   INSERT ... parish_name='Valdivia de Paine - …', date='2026-10-18' → falla
--
-- Una capilla invita, y a otra capilla:
--   host_parish = 'Valdivia de Paine - … · Capilla San Luis'
--   guest_parish = 'Pirque - … · Capilla El Llano'   → el coro de Pirque queda cubierto
--
-- Auto-invitarse (cuenta de Pirque):
--   INSERT INTO choir_invitations (host_parish, guest_parish, date)
--   VALUES ('Valdivia de Paine - …', 'Pirque - …', '2026-10-11');  → falla
--
-- Rechazar (cuenta de Pirque) y comprobar que el permiso se apaga:
--   SELECT public.rechazar_invitacion('<id>');        → true
--   INSERT ... parish_name='Valdivia de Paine - …'    → vuelve a fallar
--   SELECT public.rechazar_invitacion('<id de otro>');→ false (no es su invitación)
--
-- Retirar: solo la anfitriona.
--   DELETE FROM choir_invitations WHERE id = '<id>';  → 0 filas desde Pirque
-- =============================================================================
