-- =============================================================================
-- STELLA MARIS — Aceptar o rechazar la invitación (y decir por qué)
-- Migration: 20260912_invitaciones_respuesta
--
-- 20260910 dejó la invitación y su rechazo. Faltaba la otra mitad: el coro invitado
-- ACEPTA (y se va derecho a armar el cantoral de esa fecha) o RECHAZA explicando el
-- motivo, para que la parroquia anfitriona sepa si tiene que buscar otro coro y no
-- se quede mirando una invitación sin respuesta.
--
-- LA RESPUESTA SE PUEDE CAMBIAR
-- Aceptar hoy y avisar el jueves que al final no pueden es exactamente lo que pasa.
-- Por eso `responder_invitacion` no exige que esté sin responder: fija una y limpia
-- la otra. El motivo se guarda solo cuando se rechaza.
--
-- ACEPTAR ES LA LLAVE
-- El permiso de publicar en la parroquia anfitriona ya no es "invitada y no
-- rechazada", sino **aceptada**. Una invitación que nadie contestó no habilita nada:
-- publicar en la casa de otro empieza por decir que sí.
--
-- Y basta con que acepte UNA persona del coro invitado. La invitación es al CORO, no a
-- cada corista: en cuanto uno la acepta, cualquiera de ese coro puede armar y publicar
-- el cantoral. Por eso la aceptación vive en la fila de la invitación y no en una tabla
-- por usuario.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

ALTER TABLE public.choir_invitations
  ADD COLUMN IF NOT EXISTS accepted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by     UUID,
  -- Por qué no pueden ir. Lo escribe el coro invitado; lo lee la anfitriona.
  ADD COLUMN IF NOT EXISTS rejected_reason TEXT;

-- ── Responder: aceptar o rechazar, y en el rechazo, por qué ──────────────────
-- Por función y no por una policy de UPDATE porque la RLS no distingue columnas: con
-- UPDATE abierto, el coro invitado podría además cambiarse la fecha. Aquí lo único
-- que se escribe es la respuesta, y solo sobre la invitación propia.
-- `user_covers_parish_strict` (20260911): responder afecta a un tercero, así que
-- exige parroquia declarada en el perfil.
CREATE OR REPLACE FUNCTION public.responder_invitacion(
  p_id      UUID,
  p_aceptar BOOLEAN,
  p_motivo  TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  UPDATE public.choir_invitations i
     SET accepted_at     = CASE WHEN p_aceptar THEN now() ELSE NULL END,
         accepted_by     = CASE WHEN p_aceptar THEN auth.uid() ELSE NULL END,
         rejected_at     = CASE WHEN p_aceptar THEN NULL ELSE now() END,
         rejected_by     = CASE WHEN p_aceptar THEN NULL ELSE auth.uid() END,
         -- El motivo solo tiene sentido en el rechazo, y se recorta: es una razón
         -- breve ("ese día tenemos Misa a la misma hora"), no una carta.
         rejected_reason = CASE WHEN p_aceptar THEN NULL ELSE left(btrim(p_motivo), 500) END
   WHERE i.id = p_id
     AND public.user_covers_parish_strict(i.guest_parish)
  RETURNING TRUE INTO v_ok;
  RETURN COALESCE(v_ok, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.responder_invitacion(UUID, BOOLEAN, TEXT) TO authenticated;

COMMENT ON FUNCTION public.responder_invitacion(UUID, BOOLEAN, TEXT) IS
  'El coro invitado acepta o rechaza (con motivo) su invitación. Se puede cambiar la '
  'respuesta. Ver 20260912_invitaciones_respuesta.';

-- ── El permiso ahora exige la aceptación ────────────────────────────────────
-- Se reescribe la función de 20260910 sumando `accepted_at IS NOT NULL`. El resto es
-- idéntico (ver allá el porqué del parámetro TEXT y del to_char).
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
      WHERE to_char(i.date, 'YYYY-MM-DD') = left(btrim(p_fecha), 10)
        -- Aceptada por alguien del coro invitado, y no rechazada después.
        AND i.accepted_at IS NOT NULL
        AND i.rejected_at IS NULL
        AND (
          p_unidad = i.host_parish
          OR left(p_unidad, length(i.host_parish) + 3) = i.host_parish || ' · '
        )
        AND public.user_covers_parish(i.guest_parish)
    );
$$;

-- La función vieja pasa a ser un atajo de la nueva: una sola implementación.
CREATE OR REPLACE FUNCTION public.rechazar_invitacion(p_id UUID)
RETURNS BOOLEAN
LANGUAGE sql VOLATILE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.responder_invitacion(p_id, FALSE, NULL);
$$;

COMMIT;

-- =============================================================================
-- COMPROBACIÓN (correr después de aplicar)
--
-- Con la cuenta del coro invitado:
--   SELECT public.responder_invitacion('<id>', TRUE);            → true  (aceptada)
--   SELECT public.responder_invitacion('<id>', FALSE, 'Ese día tenemos Misa a la
--          misma hora');                                          → true  (rechazada)
--   SELECT accepted_at, rejected_at, rejected_reason
--     FROM choir_invitations WHERE id = '<id>';
--     → aceptar deja rejected_* en NULL, y rechazar deja accepted_* en NULL
--
-- Con otra cuenta cualquiera (o sin parroquia declarada):
--   SELECT public.responder_invitacion('<id>', TRUE);            → false
--
-- Y que el permiso exige la aceptación:
--   recién invitada, sin responder → user_invited_to_parish(host, fecha) = false
--   tras aceptar                   → true
--   tras rechazar                  → false
--
-- Basta con UNO del coro: con la cuenta de OTRO corista del mismo coro, despues de que
-- un companero acepto,
--   INSERT ... parish_name = '<anfitriona>', date = '<fecha>'  → funciona
-- =============================================================================
