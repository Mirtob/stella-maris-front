-- =============================================================================
-- STELLA MARIS — Dos niveles de administrador
-- Migration: 20260901_admin_solo_cantos
--
-- Pedido el 1-sep-2026: van a entrar personas a ayudar a subir y transcribir
-- cantos. Deben poder trabajar el catálogo y NADA MÁS. El acceso total queda en
-- un solo correo: gustavus.tobar@gmail.com.
--
-- CÓMO ESTÁ RESUELTO (y por qué así)
--
-- `admins` gana una columna `role`:
--     'principal' → acceso total (hoy: solo gustavus.tobar@gmail.com)
--     'songs'     → SOLO el catálogo de cantos y sus etiquetas
--
-- La pieza importante es que **`is_admin()` pasa a significar "admin pleno"**.
-- Esa función la usan ya unas veinte policies repartidas por todo el esquema
-- (perfiles, parroquias, capillas, celebraciones, encuesta, cursos, cantorales,
-- Storage…). Redefinirla es lo que hace que TODAS ellas queden cerradas para un
-- ayudante sin tocarlas una por una — y, sobre todo, que cualquier policy que se
-- agregue mañana sin pensar en esto quede cerrada también. Al revés (dejar
-- is_admin() abierta y cerrar una por una) bastaría con olvidar UNA para filtrar.
-- Cerrado por omisión, abierto solo donde se decidió: esa es la regla.
--
-- Lo que se abre explícitamente al ayudante es `is_song_admin()`, y solo se usa
-- en las policies de `songs` y `song_tags`.
--
-- OJO — cuentas afectadas: stellamarismusicacatolica@gmail.com (agregada en
-- 20260708_add_admin_stellamaris) queda como 'songs'. Si tiene que conservar el
-- acceso total, córrele el UPDATE del final de este archivo.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Nivel de cada admin
-- ---------------------------------------------------------------------------

ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'songs';

-- Por defecto 'songs': quien se agregue sin decir nada entra con el mínimo.
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE public.admins
  ADD CONSTRAINT admins_role_check CHECK (role IN ('principal', 'songs'));

-- El acceso total es de un solo correo.
UPDATE public.admins
   SET role = 'principal'
 WHERE lower(email) = 'gustavus.tobar@gmail.com';

UPDATE public.admins
   SET role = 'songs'
 WHERE lower(email) <> 'gustavus.tobar@gmail.com';

-- Red de seguridad: si por lo que sea el principal no estuviera en la tabla, se
-- crea. Sin esto, una tabla sin ningún 'principal' deja el sistema sin nadie que
-- pueda administrarlo (y sin nadie que pueda arreglarlo desde la app).
INSERT INTO public.admins (email, added_by, role)
VALUES ('gustavus.tobar@gmail.com', 'admin_solo_cantos', 'principal')
ON CONFLICT (email) DO UPDATE SET role = 'principal';

-- ---------------------------------------------------------------------------
-- 2. is_admin() = ADMIN PLENO  (misma firma: todas las policies siguen valiendo)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
     WHERE email = auth.email()
       AND role = 'principal'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. is_song_admin() = puede trabajar el catálogo de cantos
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_song_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
     WHERE email = auth.email()
       AND role IN ('principal', 'songs')
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_song_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. admin_level() — qué panel mostrar. 'principal' | 'songs' | NULL
--    Solo decide la UI; quien manda de verdad son las policies de arriba.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_level()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.admins WHERE email = auth.email() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.admin_level() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5. Lo ÚNICO que se le abre al ayudante: el catálogo y sus etiquetas
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "songs_admin_all" ON public.songs;
CREATE POLICY "songs_admin_all" ON public.songs
  FOR ALL
  USING ((select public.is_song_admin()))
  WITH CHECK ((select public.is_song_admin()));

DROP POLICY IF EXISTS "song_tags_insert" ON public.song_tags;
CREATE POLICY "song_tags_insert" ON public.song_tags
  FOR INSERT
  WITH CHECK ((select public.is_song_admin()));

DROP POLICY IF EXISTS "song_tags_update" ON public.song_tags;
CREATE POLICY "song_tags_update" ON public.song_tags
  FOR UPDATE
  USING ((select public.is_song_admin()))
  WITH CHECK ((select public.is_song_admin()));

DROP POLICY IF EXISTS "song_tags_delete" ON public.song_tags;
CREATE POLICY "song_tags_delete" ON public.song_tags
  FOR DELETE
  USING ((select public.is_song_admin()));

-- ---------------------------------------------------------------------------
-- 6. La tabla `admins` la toca SOLO el principal
--
--    Antes la policy era `is_admin()` para FOR ALL, o sea que cualquier admin
--    podía agregarse cómplices o borrar al principal. Con is_admin() ya
--    redefinida esto queda cerrado, pero se deja explícito y separado el SELECT
--    (que sí conviene que vean todos, para saber quién administra) del resto.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "admins_select_admin" ON public.admins;
CREATE POLICY "admins_select_admin" ON public.admins
  FOR SELECT
  USING ((select public.is_song_admin()));

DROP POLICY IF EXISTS "admins_modify_admin" ON public.admins;
CREATE POLICY "admins_modify_admin" ON public.admins
  FOR ALL
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

COMMIT;

-- =============================================================================
-- CÓMO SE OPERA DESPUÉS
--
-- Dar de alta a alguien que solo sube cantos:
--   INSERT INTO admins (email, added_by, role)
--   VALUES ('ayudante@gmail.com', 'gustavus', 'songs')
--   ON CONFLICT (email) DO UPDATE SET role = 'songs';
--   -- y en user_profiles ponerle role = 'Admin' (desde Gestión de Usuarios).
--
-- Quitarle el acceso:
--   DELETE FROM admins WHERE email = 'ayudante@gmail.com';
--
-- Devolver acceso total a alguien (pensarlo dos veces):
--   UPDATE admins SET role = 'principal' WHERE email = 'otro@gmail.com';
--
-- Ver quién es quién:
--   SELECT email, role, added_at, added_by FROM admins ORDER BY role, email;
-- =============================================================================
