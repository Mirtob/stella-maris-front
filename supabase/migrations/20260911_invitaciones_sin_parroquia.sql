-- =============================================================================
-- STELLA MARIS — Invitar, retirar y rechazar exigen parroquia DECLARADA
-- Migration: 20260911_invitaciones_sin_parroquia
--
-- EL AGUJERO QUE CIERRA
-- `user_covers_parish` (20260824) devuelve TRUE cuando el perfil **no declara
-- ninguna parroquia**. Eso se decidió a propósito y para publicar está bien: el
-- perfil se sincroniza en segundo plano, y si esa escritura falló alguna vez, es
-- peor dejar a un coro sin poder publicar un domingo por la mañana.
--
-- Pero 20260910 reutilizó esa misma función para tres cosas de otra naturaleza:
--   · INVITAR   — le da permiso de publicar a un TERCERO en una parroquia.
--   · RETIRAR   — borra la invitación de otro.
--   · RECHAZAR  — apaga el permiso de otro.
--
-- Ahí la excepción no se justifica: una cuenta recién creada, sin parroquia en el
-- perfil, podía invitar a cualquier coro a cualquier parroquia, y retirar o rechazar
-- invitaciones ajenas. Ninguna de esas tres cosas es "que el coro pueda trabajar el
-- domingo"; son actos sobre la casa y el permiso de otro.
--
-- Publicar NO se toca: sigue con la baranda permisiva de 20260824, por la razón de
-- siempre. Tampoco se toca el lado invitado de `user_invited_to_parish`, porque ahí
-- la excepción no agrega nada — quien no declara parroquia ya puede publicar donde
-- quiera por la otra rama de la misma policy.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

-- ── La misma regla, pero sin la excepción del perfil vacío ───────────────────
CREATE OR REPLACE FUNCTION public.user_covers_parish_strict(p_unidad TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    COALESCE(btrim(p_unidad), '') <> ''
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1
        FROM public.user_profiles p
        WHERE p.id = auth.uid()
          AND (
            -- La parroquia (o capilla) tal cual, en cualquiera de los dos campos.
            p_unidad = p.parish_name
            OR p_unidad = ANY (COALESCE(p.parishes, ARRAY[]::TEXT[]))
            -- Una capilla que cuelga de su parroquia.
            OR left(p_unidad, length(p.parish_name) + 3) = p.parish_name || ' · '
            OR EXISTS (
              SELECT 1
              FROM unnest(COALESCE(p.parishes, ARRAY[]::TEXT[])) AS q
              WHERE left(p_unidad, length(q) + 3) = q || ' · '
            )
          )
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.user_covers_parish_strict(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.user_covers_parish_strict(TEXT) IS
  'Como user_covers_parish, pero EXIGE que el perfil declare la parroquia. Para los '
  'actos que afectan a terceros: invitar, retirar y rechazar. Ver 20260911.';

-- ── Invitar: solo desde una parroquia declarada ──────────────────────────────
DROP POLICY IF EXISTS "choir_inv_insert" ON public.choir_invitations;
CREATE POLICY "choir_inv_insert" ON public.choir_invitations
  FOR INSERT
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (created_by IS NULL OR created_by = (select auth.uid()))
    AND (select public.is_choir_or_admin())
    AND public.user_covers_parish_strict(host_parish)
  );

-- ── Retirar: quien invitó (el autor, o su parroquia declarada) ───────────────
DROP POLICY IF EXISTS "choir_inv_delete" ON public.choir_invitations;
CREATE POLICY "choir_inv_delete" ON public.choir_invitations
  FOR DELETE
  USING (
    (created_by IS NOT NULL AND created_by = (select auth.uid()))
    OR public.user_covers_parish_strict(host_parish)
    OR (select public.is_admin())
  );

-- ── Rechazar: solo el coro invitado, con parroquia declarada ─────────────────
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
     AND public.user_covers_parish_strict(i.guest_parish)
  RETURNING TRUE INTO v_ok;
  RETURN COALESCE(v_ok, FALSE);
END;
$$;

COMMIT;

-- =============================================================================
-- COMPROBACIÓN (correr después de aplicar)
--
-- Con una cuenta de Coro SIN parroquia declarada en su perfil:
--   INSERT INTO choir_invitations (host_parish, guest_parish, date)
--   VALUES ('Valdivia de Paine - …', 'Pirque - …', '2026-10-11');  → falla
--   DELETE FROM choir_invitations WHERE id = '<una ajena>';        → 0 filas
--   SELECT public.rechazar_invitacion('<una ajena>');              → false
--
-- Con la cuenta del coro de Valdivia (parroquia declarada):
--   INSERT … → funciona;  DELETE de la suya → funciona
--
-- Y que publicar NO se endureció (cuenta sin parroquia declarada):
--   INSERT INTO published_cantorals (…, parish_name) VALUES (…);   → sigue funcionando
-- =============================================================================
