-- =============================================================================
-- STELLA MARIS — Borrar cantos: solo el administrador principal
-- Migration: 20260902_songs_borrado_solo_principal
--
-- Sigue a 20260901_admin_solo_cantos. Los ayudantes entran a "subir y transcribir":
-- eso es INSERT y UPDATE. Borrar del catálogo no es parte del encargo y no tiene
-- vuelta atrás — un DELETE se lleva la letra, los acordes, las partituras vinculadas
-- y las etiquetas de un canto que puede estar en cantorales ya publicados.
--
-- Hasta ahora `songs_admin_all` era FOR ALL, así que abrir el catálogo al ayudante le
-- abría también el borrado. Aquí se parte esa policy en cuatro, por operación:
--
--     SELECT  → is_song_admin()   (ver también los NO aprobados; el público solo ve
--                                  los aprobados, vía songs_public_read)
--     INSERT  → is_song_admin()   (subir)
--     UPDATE  → is_song_admin()   (transcribir, corregir, etiquetar)
--     DELETE  → is_admin()        (SOLO el principal)
--
-- Nota sobre `songs_public_read`: sigue intacta (FOR SELECT USING approval_status =
-- 'approved'). Las policies de un mismo comando se combinan con OR, así que el
-- ayudante ve los aprobados por esa y los pendientes por la suya.
--
-- APLICAR A MANO en el SQL Editor de Supabase, DESPUÉS de 20260901.
-- =============================================================================

BEGIN;

-- La policy que lo permitía todo se reemplaza por una por operación.
DROP POLICY IF EXISTS "songs_admin_all" ON public.songs;

-- Ver el catálogo COMPLETO, incluidos los cantos aún no aprobados.
DROP POLICY IF EXISTS "songs_song_admin_select" ON public.songs;
CREATE POLICY "songs_song_admin_select" ON public.songs
  FOR SELECT
  USING ((select public.is_song_admin()));

-- Subir cantos nuevos.
DROP POLICY IF EXISTS "songs_song_admin_insert" ON public.songs;
CREATE POLICY "songs_song_admin_insert" ON public.songs
  FOR INSERT
  WITH CHECK ((select public.is_song_admin()));

-- Transcribir, corregir, aprobar, etiquetar.
DROP POLICY IF EXISTS "songs_song_admin_update" ON public.songs;
CREATE POLICY "songs_song_admin_update" ON public.songs
  FOR UPDATE
  USING ((select public.is_song_admin()))
  WITH CHECK ((select public.is_song_admin()));

-- Borrar: SOLO el principal. `is_admin()` ya significa admin pleno (ver 20260901).
DROP POLICY IF EXISTS "songs_principal_delete" ON public.songs;
CREATE POLICY "songs_principal_delete" ON public.songs
  FOR DELETE
  USING ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Las ETIQUETAS del catálogo, por el mismo criterio.
--
-- Crear y renombrar etiquetas es parte de ordenar el catálogo, así que el ayudante
-- las mantiene. Borrar una etiqueta la quita de TODOS los cantos que la usaban, en
-- todas las parroquias: eso es del principal.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "song_tags_delete" ON public.song_tags;
CREATE POLICY "song_tags_delete" ON public.song_tags
  FOR DELETE
  USING ((select public.is_admin()));

COMMIT;

-- =============================================================================
-- COMPROBAR DESPUÉS DE APLICAR
--
--   SELECT policyname, cmd FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'songs'
--    ORDER BY cmd, policyname;
--
-- Se esperan cinco filas: songs_public_read (SELECT), songs_song_admin_select
-- (SELECT), songs_song_admin_insert (INSERT), songs_song_admin_update (UPDATE) y
-- songs_principal_delete (DELETE). Ninguna con cmd = 'ALL'.
-- =============================================================================
