-- =============================================================================
-- STELLA MARIS — El cantoral del coro invitado también es suyo
-- Migration: 20260922_cantoral_coro_invitado
-- (aplica DESPUÉS de 20260910_coros_invitados)
--
-- EL CASO REAL
-- El coro de Pirque acepta la invitación de Valdivia de Paine y arma el cantoral de
-- la fiesta patronal. Al publicarlo, ese cantoral aparecía SOLO en Valdivia: en
-- Pirque no lo veía nadie, ni siquiera el coro que lo armó y que lo va a cantar.
-- Salían de su parroquia y el cantoral de su propia Misa desaparecía de su app.
--
-- QUÉ CAMBIA
-- Se anota en el cantoral a QUÉ CORO invitaron (`guest_choir_parish`). Con eso la
-- publicación llega a dos lados a la vez:
--   · la parroquia ANFITRIONA (`parish_name`) — su coro y su pueblo fiel, como
--     cualquier cantoral de su casa;
--   · el coro INVITADO (`guest_choir_parish`) — SOLO el coro, no el pueblo fiel de
--     Pirque, que ese domingo tiene su propia Misa y su propio cantoral.
--
-- La columna guarda la unidad tal como fue invitada (`choir_invitations.guest_parish`),
-- así que si se invitó a la parroquia, la ven también sus capillas, y si se invitó a
-- una capilla, solo esa. NULL = cantoral normal, de la parroquia propia.
--
-- QUIÉN FILTRA
-- El filtro es del cliente, igual que hoy: `cantorals_select` deja leer todo lo
-- publicado (desde 20260613, para que el QR funcione sin login). Esta columna no
-- abre ni cierra ningún permiso — solo dice de quién es además el cantoral.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

ALTER TABLE public.published_cantorals
  ADD COLUMN IF NOT EXISTS guest_choir_parish TEXT;

COMMENT ON COLUMN public.published_cantorals.guest_choir_parish IS
  'Parroquia/capilla del CORO INVITADO que publicó este cantoral en otra parroquia '
  '(choir_invitations.guest_parish). NULL = cantoral de la parroquia propia. Hace que '
  'el cantoral se vea también en la casa del coro invitado, solo para el perfil Coro. '
  'Ver 20260922_cantoral_coro_invitado.';

-- El coro invitado pregunta "¿dónde están los cantorales que armamos afuera?".
-- Parcial: la inmensa mayoría de las filas no son de coros invitados.
CREATE INDEX IF NOT EXISTS published_cantorals_guest_choir_idx
  ON public.published_cantorals (guest_choir_parish, date)
  WHERE guest_choir_parish IS NOT NULL;

COMMIT;

-- =============================================================================
-- COMPROBACIÓN (correr después de aplicar)
--
-- Con la invitación aceptada, el coro de Pirque publica en Valdivia:
--   INSERT INTO published_cantorals (…, parish_name, guest_choir_parish, date)
--   VALUES (…, 'Valdivia de Paine - …', 'Pirque - …', '2026-10-11');
--
-- Lo que debe verse:
--   Valdivia, perfil Coro        → sí     Valdivia, Pueblo fiel  → sí
--   Pirque,   perfil Coro        → sí     Pirque,   Pueblo fiel  → NO
--   Buin (ajena), cualquiera     → no
-- =============================================================================
