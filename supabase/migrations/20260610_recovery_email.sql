-- T13: Recovery de cuenta — agregar campo recovery_email a user_profiles
--
-- Permite al usuario registrar un email alternativo para recuperar acceso
-- a su cuenta si pierde acceso a la cuenta Google con la que se registró.
--
-- El admin usa este campo para verificar la identidad del usuario cuando
-- pide recovery (ver docs/RECOVERY-PROCEDURE.md).
--
-- Ejecutar en: Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- 1. Agregar la columna
-- ---------------------------------------------------------------------------

ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS recovery_email text;

-- Validación: si está presente, debe ser un email válido (regex básico)
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_recovery_email_format;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_recovery_email_format
CHECK (
  recovery_email IS NULL
  OR recovery_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Índice para que el admin pueda buscar por recovery_email en recovery flows
CREATE INDEX IF NOT EXISTS idx_user_profiles_recovery_email
  ON public.user_profiles (lower(recovery_email))
  WHERE recovery_email IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. RLS: el usuario solo puede ver/editar SU propio recovery_email
--    El admin puede leer todos (ya cubierto por la policy de "admin can read all")
-- ---------------------------------------------------------------------------

-- Las policies existentes de user_profiles ya permiten:
--   - Usuario lee/actualiza solo su propia fila (id = auth.uid())
--   - Admin lee y actualiza todas las filas
-- No requiere cambios adicionales.

-- ---------------------------------------------------------------------------
-- 3. Verificación
-- ---------------------------------------------------------------------------

-- Ejecutar después para confirmar:
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'user_profiles' AND column_name = 'recovery_email';
--
-- Debe devolver: recovery_email | text | YES
