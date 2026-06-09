-- =============================================================================
-- STELLA MARIS — User profiles persistence
-- Migration: 20260609_user_profiles
--
-- Hasta ahora los perfiles vivían solo en localStorage del cliente. Para que
-- el admin pueda ver los usuarios que se han logueado y administrarlos,
-- guardamos una fila por usuario en `user_profiles`.
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id              UUID        PRIMARY KEY,                       -- = auth.users.id
  email           TEXT        UNIQUE NOT NULL,
  name            TEXT,
  role            TEXT        NOT NULL DEFAULT 'Pueblo fiel'
                              CHECK (role IN ('Coro', 'Pueblo fiel', 'Admin')),
  instruments     TEXT[]      DEFAULT '{}',
  parishes        TEXT[]      DEFAULT '{}',
  parish_name     TEXT,
  photo_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles (role);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles (email);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_user_profiles_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer/editar SU propia fila
DROP POLICY IF EXISTS "user_profiles_self_select" ON user_profiles;
CREATE POLICY "user_profiles_self_select" ON user_profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_self_insert" ON user_profiles;
CREATE POLICY "user_profiles_self_insert" ON user_profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_self_update" ON user_profiles;
CREATE POLICY "user_profiles_self_update" ON user_profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin lee y modifica TODO
DROP POLICY IF EXISTS "user_profiles_admin_all" ON user_profiles;
CREATE POLICY "user_profiles_admin_all" ON user_profiles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Verificación
--   SELECT count(*) FROM user_profiles;
--   SELECT email, role FROM user_profiles WHERE role = 'Admin';
-- ---------------------------------------------------------------------------
