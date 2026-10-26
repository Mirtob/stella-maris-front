-- =============================================================================
-- STELLA MARIS — El directorio de coros lo ven solo los coros
-- Migration: 20261026_contactos_solo_coros
--
-- `choir_contacts` (correo, teléfono y notas de quien dirige cada coro) era legible
-- por CUALQUIER usuario con sesión (20260708). Como el registro es libre, en la
-- práctica era público: bastaba crear una cuenta de Pueblo fiel para bajar todo el
-- directorio con una llamada a PostgREST.
--
-- La tarjeta del perfil le promete al coro: "Estos datos quedan visibles para otros
-- coros de la app". Ahora la base cumple exactamente eso: leen el directorio las
-- cuentas de Coro (o Admin) que declararon su parroquia, y el admin principal.
-- Cada coro sigue viendo y editando su propia ficha (choir_contacts_owner_write).
--
-- Límite honesto: el rol Coro y la parroquia los declara la propia persona, así que
-- esto sube la vara (ya no basta "tener cuenta"), pero no es un muro. El muro sería
-- aprobar a los coros por parroquia.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "choir_contacts_read" ON public.choir_contacts;
CREATE POLICY "choir_contacts_read" ON public.choir_contacts
  FOR SELECT USING (
    (select public.is_admin())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles p
       WHERE p.id = (select auth.uid())
         AND p.role IN ('Coro', 'Admin')
         AND (COALESCE(array_length(p.parishes, 1), 0) > 0
              OR COALESCE(btrim(p.parish_name), '') <> '')
    )
  );

COMMIT;

-- =============================================================================
-- VERIFICACIÓN
--   Como Pueblo fiel (debe dar 0):   SELECT count(*) FROM choir_contacts;
--   Como Coro con parroquia (> 0 si hay fichas): la misma consulta.
-- =============================================================================
