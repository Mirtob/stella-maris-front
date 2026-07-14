-- =============================================================================
-- STELLA MARIS — Favoritos de cantos ("Mis cantos")
-- Migration: 20260714_song_favorites
--
-- Cada usuario guarda los cantos que quiere tener a mano para practicar/rezar. Solo
-- almacena la referencia (song_id); los detalles del canto se resuelven de la tabla
-- pública `songs`. RLS: cada quien gestiona SOLO sus favoritos.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.song_favorites (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, song_id)
);

ALTER TABLE public.song_favorites ENABLE ROW LEVEL SECURITY;

-- Cada usuario gestiona SOLO sus favoritos.
DROP POLICY IF EXISTS "song_favorites_owner" ON public.song_favorites;
CREATE POLICY "song_favorites_owner" ON public.song_favorites
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
