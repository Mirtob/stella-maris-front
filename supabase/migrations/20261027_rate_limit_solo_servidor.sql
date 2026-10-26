-- =============================================================================
-- STELLA MARIS — El contador de peticiones lo toca solo el servidor
-- Migration: 20261027_rate_limit_solo_servidor
--
-- ⚠️  APLICAR DESPUÉS DE DESPLEGAR el commit que cambia los api/*.ts para llamar al
--     RPC con la service key. Si se aplica antes, el código viejo (que usa la anon
--     key) recibe 401: los endpoints fail-open caen al contador en memoria, pero
--     recover-password es fail-CLOSED y respondería 429 a todos hasta el deploy.
--
-- `api_rate_limit(p_key, p_limit, p_window_seconds)` era ejecutable por anon, y la
-- clave la elige quien llama: cualquiera podía gastarle el cupo a otra IP
-- ('recover-password:<ip>') o llenar la tabla de claves basura.
--
-- APLICAR A MANO en el SQL Editor de Supabase.
-- =============================================================================

BEGIN;

REVOKE EXECUTE ON FUNCTION public.api_rate_limit(TEXT, INT, INT) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.api_rate_limit(TEXT, INT, INT) TO service_role;

COMMIT;

-- =============================================================================
-- VERIFICACIÓN
--   Como anónimo: POST /rest/v1/rpc/api_rate_limit                   -- 401
--   Y la app: pedir un código de "olvidé mi clave" sigue funcionando.
-- =============================================================================
