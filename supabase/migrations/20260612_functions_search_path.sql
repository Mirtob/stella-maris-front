-- =============================================================================
-- STELLA MARIS — Pin search_path en todas las funciones
-- Migration: 20260612_functions_search_path
--
-- El linter de Supabase marca "Function Search Path Mutable" en funciones que no
-- fijan `search_path`. En una función SECURITY DEFINER eso es un vector de
-- escalada: un atacante que controle el search_path de su sesión podría hacer que
-- la función resuelva un objeto (tabla/función) hacia un esquema malicioso.
--
-- Fix: recrear cada función con `SET search_path = ''` y calificar TODOS los
-- objetos con su esquema (`public.*`, `auth.*`). pg_catalog queda implícito, así
-- que `now()`, `to_tsvector`, `regexp_replace`, etc. siguen resolviendo.
--
-- CREATE OR REPLACE conserva los triggers (referencian por nombre) y los GRANT
-- existentes; aun así re-emitimos los grants de las funciones expuestas como RPC.
-- =============================================================================

-- 1. is_admin() — SECURITY DEFINER (la usan las policies de admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE email = auth.email()
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- 2. is_cantoral_pdf_owner(text) — SECURITY DEFINER (policies de Storage)
CREATE OR REPLACE FUNCTION public.is_cantoral_pdf_owner(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  cantoral_id_text TEXT;
  cantoral_id      UUID;
  owner_id         UUID;
BEGIN
  -- Storage object names must be exactly '<uuid>.pdf'
  IF object_name !~ '^[0-9a-fA-F-]{36}\.pdf$' THEN
    RETURN FALSE;
  END IF;

  cantoral_id_text := regexp_replace(object_name, '\.pdf$', '');

  BEGIN
    cantoral_id := cantoral_id_text::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
  END;

  SELECT created_by INTO owner_id
  FROM public.published_cantorals
  WHERE id = cantoral_id;

  -- Cantoral must exist in the DB before its PDF can be uploaded
  IF owner_id IS NULL THEN
    RETURN public.is_admin();  -- admin can re-seed legacy rows
  END IF;

  RETURN owner_id = auth.uid() OR public.is_admin();
END;
$$;

-- 3. search_songs(...) — RPC del buscador de cantos
CREATE OR REPLACE FUNCTION public.search_songs(
  p_moment     TEXT    DEFAULT NULL,
  p_season     TEXT    DEFAULT NULL,
  p_instrument TEXT    DEFAULT NULL,
  p_query      TEXT    DEFAULT NULL,
  p_limit      INT     DEFAULT 100,
  p_offset     INT     DEFAULT 0
)
RETURNS SETOF public.songs
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT *
  FROM public.songs
  WHERE
    approval_status = 'approved'
    AND (p_moment     IS NULL OR mass_moment = p_moment)
    AND (p_season     IS NULL OR p_season     = ANY(liturgical_seasons) OR liturgical_seasons = '{}')
    AND (p_instrument IS NULL OR p_instrument = ANY(instruments))
    AND (p_query      IS NULL OR to_tsvector('spanish', title) @@ plainto_tsquery('spanish', p_query))
  ORDER BY title ASC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- 4. update_updated_at() — trigger BEFORE UPDATE en songs
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 5. set_cantoral_created_by() — trigger BEFORE INSERT en published_cantorals
CREATE OR REPLACE FUNCTION public.set_cantoral_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 6. update_user_profiles_updated_at() — trigger BEFORE UPDATE en user_profiles
CREATE OR REPLACE FUNCTION public.update_user_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
