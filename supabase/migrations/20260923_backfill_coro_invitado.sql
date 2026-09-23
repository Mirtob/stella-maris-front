-- =============================================================================
-- STELLA MARIS — Reparar los cantorales de coro invitado que quedaron sin marcar
-- Migration: 20260923_backfill_coro_invitado
-- (aplica DESPUÉS de 20260922_cantoral_coro_invitado)
--
-- QUÉ PASÓ
-- El cantoral del 11-oct-2026 en Valdivia de Paine se publicó como coro invitado pero
-- quedó con `guest_choir_parish` en NULL, así que no aparecía en Pirque. La causa está
-- en el cliente (utils/choirInvitations): la lista de invitaciones que llegaba al menú
-- de publicación descarta las anfitrionas que el usuario ya cubre por perfil —ahí
-- publica por derecho— y con eso se perdía la invitación antes de poder marcar nada.
-- Corregido con `invitacionQueMarca`, que resuelve la marca contra las invitaciones sin
-- filtrar y contra la parroquia y la fecha definitivas del cantoral.
--
-- Esto repara lo ya publicado. La marca NO se inventa: se copia de la invitación
-- aceptada que le corresponde, así que si no hay invitación, la fila se queda como está.
--
-- APLICAR A MANO en el SQL Editor de Supabase. Es idempotente: correrla dos veces no
-- cambia nada la segunda vez (solo toca filas con guest_choir_parish IS NULL).
-- =============================================================================

BEGIN;

-- Qué se va a tocar, antes de tocarlo.
SELECT c.id, c.date, c.parish_name, i.guest_parish AS marca_que_se_pondra
  FROM public.published_cantorals c
  JOIN public.choir_invitations i
    ON c.parish_name = i.host_parish
   -- published_cantorals.date es TEXT y choir_invitations.date es DATE: se compara con
   -- to_char y no con un cast, para no depender del DateStyle del servidor. Misma razón
   -- que en user_invited_to_parish (ver 20260910_coros_invitados).
   AND c.date = to_char(i.date, 'YYYY-MM-DD')
 WHERE c.guest_choir_parish IS NULL
   AND i.accepted_at IS NOT NULL
   AND i.rejected_at IS NULL;

UPDATE public.published_cantorals c
   SET guest_choir_parish = i.guest_parish
  FROM public.choir_invitations i
 WHERE c.parish_name = i.host_parish
   AND c.date = to_char(i.date, 'YYYY-MM-DD')
   AND c.guest_choir_parish IS NULL
   AND i.accepted_at IS NOT NULL
   AND i.rejected_at IS NULL;

COMMIT;

-- =============================================================================
-- COMPROBACIÓN
--   SELECT date, parish_name, guest_choir_parish
--     FROM published_cantorals
--    WHERE guest_choir_parish IS NOT NULL;
--
-- Debe aparecer el del 11-oct en Valdivia de Paine, marcado con la parroquia de Pirque.
-- Después, en la app y con perfil CORO de Pirque, ese cantoral aparece en "Cantorales
-- Publicados" con la etiqueta "✈️ Invitados — se canta allá". Con perfil Pueblo fiel de
-- Pirque NO debe aparecer.
-- =============================================================================
