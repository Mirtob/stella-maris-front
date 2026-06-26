-- ============================================================================
-- Migration: 20260626_principal_admin_role_guard
-- ----------------------------------------------------------------------------
-- Restringe el cambio de ROL en user_profiles SOLO al administrador principal
-- (super-admin). El resto de los Admin pueden gestionar cantos/capillas/etc. y
-- editar nombre/parroquia/instrumento de un perfil, pero NO promover ni degradar
-- roles (en particular, nadie más puede crear nuevos Admin).
--
-- Defensa en profundidad: la UI ya oculta el selector de rol a los no-principales
-- (ver src/config/admin.ts + ProfileManager), pero esto lo enforza a nivel BD,
-- así no se puede saltar con una llamada directa a PostgREST.
--
-- Nota: las llamadas con service-role (p. ej. /api/admin-users al pre-armar el
-- perfil con rol 'Pueblo fiel') tienen auth.uid() = NULL, por lo que el guard no
-- las bloquea. Eso es intencional: el endpoint server-side es de confianza.
--
-- Si cambias el email del administrador principal, actualízalo también en
-- src/config/admin.ts (PRINCIPAL_ADMIN_EMAIL).
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_principal_admin_role_change()
RETURNS TRIGGER AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- Solo nos importa cuando realmente cambia el rol.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- auth.uid() es NULL para el service-role → caller_email NULL → permitido.
    SELECT email INTO caller_email FROM auth.users WHERE id = auth.uid();

    IF caller_email IS NOT NULL
       AND lower(caller_email) <> 'gustavus.tobar@gmail.com' THEN
      RAISE EXCEPTION 'Solo el administrador principal puede cambiar roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS user_profiles_role_guard ON user_profiles;
CREATE TRIGGER user_profiles_role_guard
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_principal_admin_role_change();

-- Verificación rápida:
--   -- Como Admin secundario (debe fallar):
--   UPDATE user_profiles SET role = 'Admin' WHERE email = 'algo@ejemplo.com';
--   -- Como administrador principal (debe funcionar).
