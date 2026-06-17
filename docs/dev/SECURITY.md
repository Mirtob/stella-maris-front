# Seguridad para publicación

Este documento recoge los controles mínimos implementados antes de publicar la aplicación con integraciones de Google Drive y YouTube.

## Cambios aplicados

- Se eliminó la exposición del `client_secret` de Google del bundle frontend.
- El flujo OAuth ahora usa `state` y `nonce` para evitar ataques de CSRF y token replay.
- Los tokens de sesión se guardan en `sessionStorage` en lugar de `localStorage`.
- Se agregó una política CSP básica en `index.html` para limitar orígenes de scripts, conexiones, imágenes y frames.
- Las partituras de Google Drive ya no se marcan como públicas por defecto.

## Recomendaciones antes de producción

1. Usar un backend o Supabase para:
   - almacenar `client_secret` de forma segura
   - intercambiar códigos OAuth con PKCE
   - manejar refresh tokens
   - aplicar políticas de acceso a archivos y usuarios

2. Mantener las siguientes prácticas:
   - HTTPS obligatorio en producción
   - no incluir secretos en el repositorio ni en variables de entorno públicas
   - limitar scopes OAuth al mínimo necesario
   - validar y sanitizar nombres de archivos antes de subir
   - vigilar el uso de Drive y YouTube para evitar exposición accidental de datos críticos

3. Seguridad adicional de frontend:
   - habilitar `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin` en el servidor
   - revisar y cerrar cualquier vector XSS antes de publicar
   - usar RLS en Supabase si se adopta un backend propio

## Notas específicas de Google API

- `GOOGLE_OAUTH_CONFIG.clientId` permanece en el frontend, pero el `clientSecret` no debe estar nunca en el bundle.
- Cualquier token de acceso debe tratarse como sensible y renovarse en un servidor seguro.
- La subida de archivos críticos debe realizarse con permisos restringidos y solo compartirse cuando sea necesario.
