-- =============================================================================
-- STELLA MARIS — Datos de contacto del coro
-- Migration: 20260708_choir_contacts
--
-- Cada coro puede publicar sus datos de contacto (nombre del coro, parroquia,
-- correo, teléfono, otros) para que los coros intercambien partituras/datos.
-- Cada coro gestiona SÓLO su ficha; cualquier usuario autenticado puede verlas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.choir_contacts (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  choir_name TEXT,
  parish     TEXT,
  email      TEXT,
  phone      TEXT,
  notes      TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.choir_contacts ENABLE ROW LEVEL SECURITY;

-- El dueño gestiona su propia ficha (insert/update/delete/select).
DROP POLICY IF EXISTS "choir_contacts_owner_write" ON public.choir_contacts;
CREATE POLICY "choir_contacts_owner_write" ON public.choir_contacts
  FOR ALL USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- Cualquier usuario autenticado puede VER los contactos (directorio de coros).
DROP POLICY IF EXISTS "choir_contacts_read" ON public.choir_contacts;
CREATE POLICY "choir_contacts_read" ON public.choir_contacts
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
