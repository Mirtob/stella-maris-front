# Testing Completo - Stella Maris App

## Estado de Compilación

- ✅ Build con `npm run build` **PASÓ**
- ✅ Todas las importaciones de TypeScript resueltas
- ✅ Seguridad OAuth mejorada (state/nonce validation)
- ✅ Storage consistente (sessionStorage para sesión, localStorage solo para temas)

## Checklist de Testing

### 1. Flujo de Autenticación OAuth

**Objetivo**: Verificar que Google OAuth funcione sin errores

**Pasos**:
1. Abre la app en `http://localhost:3000`
2. Haz clic en "Continuar con Google"
3. Se debe abrir un popup de login de Google
4. Después de autenticarse, debería:
   - ✅ Cerrarse el popup automáticamente
   - ✅ La sesión se guarda en `sessionStorage` (verificar en DevTools > Application)
   - ✅ El perfil del usuario se guarda en `sessionStorage`
   - ✅ Se redirige a la pantalla principal con bienvenida personalizada

**Validación de Seguridad**:
- [ ] Verificar que `sessionStorage` contiene `stella_maris_google_session`
- [ ] Verificar que `stella_maris_google_session` contiene `accessToken`, `idToken`, `expiresAt`
- [ ] Verificar que el `state` es diferente en cada login (prevención CSRF)
- [ ] Verificar que el `nonce` está en el `id_token` (prevención de token replay)

**Errores Esperados a Manejar**:
- Si popup bloqueado: mostrar toast de error
- Si token inválido: limpiar sesión y redirigir a login

---

### 2. Integración YouTube

**Objetivo**: Verificar que YouTube Data API funciona

**Pasos - Lectura de Metadata**:
1. Desde cualquier componente que muestre un video (Liturgy.tsx, SongPlayer.tsx)
2. Busca un video con ID o URL de YouTube
3. Debería:
   - ✅ Extraer el video ID correctamente
   - ✅ Obtener metadata (título, duración, thumbnails)
   - ✅ Cachear datos en `localStorage` por 24h

**Pasos - Upload de Video (requiere sesión OAuth)**:
1. Ir a Admin Dashboard > Upload Song
2. Seleccionar un archivo de video local
3. Rellenar campos obligatorios
4. Hacer clic en "Subir"
5. Debería:
   - ✅ Mostrar barra de progreso del upload
   - ✅ Enviar a YouTube con acceso token válido
   - ✅ Recibir `videoId` en respuesta
   - ✅ Mostrar éxito con toast

**Validación de Seguridad**:
- [ ] El token se envía en header `Authorization: Bearer {token}`
- [ ] El token está en `sessionStorage` (no localStorage)
- [ ] Si no hay token, mostrar error descriptivo
- [ ] Si token expirado, hacer logout automático

**Errores a Probar**:
- [ ] Video inválido (archivo que no sea video)
- [ ] Sin token de autenticación
- [ ] Upload muy grande (>100MB simulado)

---

### 3. Integración Google Drive

**Objetivo**: Verificar que Google Drive API funciona

**Pasos - Upload de Partituras**:
1. Ir a Admin Dashboard > Upload Song
2. Seleccionar un archivo PDF (partitura)
3. Hacer clic en "Subir Partitura"
4. Debería:
   - ✅ Mostrar barra de progreso
   - ✅ Enviar a Google Drive con acceso token
   - ✅ Retornar `fileId` y URL pública
   - ✅ NO marcar como público por defecto (por seguridad)
   - ✅ Guardar en carpeta `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER`

**Validación de Seguridad**:
- [ ] El archivo se sube con permiso `reader` para `anyone` SOLO si se marca explícitamente
- [ ] Por defecto, el archivo está restringido al usuario que subió
- [ ] URL pública solo disponible si usuario selecciona "Hacer público"

**Errores a Probar**:
- [ ] Archivo tipo incorrecto (no PDF)
- [ ] Sin token de autenticación
- [ ] Carpeta destino no existe (crear automáticamente)

---

### 4. Variables de Entorno

**Verificación**:
```bash
# En .env.local deben estar:
VITE_GOOGLE_CLIENT_ID=<tu-client-id>.apps.googleusercontent.com
VITE_YOUTUBE_API_KEY=AIzaSy...
VITE_YOUTUBE_CHANNEL_ID=UC...
VITE_GOOGLE_DRIVE_API_KEY=AIzaSy... (o mismo que YOUTUBE_API_KEY)
VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER=1...
VITE_GOOGLE_DRIVE_MEDIA_FOLDER=1...
```

**Validación**:
- [ ] Abrir DevTools > Console
- [ ] Debe mostrar configuración de API (sin secretos)
- [ ] Debe mostrar advertencias si faltan variables no-críticas
- [ ] Debe mostrar errores si faltan variables críticas

---

### 5. Manejo de Errores

**Casos a Probar**:

| Caso | Esperado | Validar |
|------|----------|---------|
| Sin conexión a internet | Toast de error de conexión | ✓ |
| Token expirado | Logout automático + redirección a login | ✓ |
| Archivo corrupto | Toast error con descripción | ✓ |
| API Key inválida | Fallback a datos mock (si aplica) | ✓ |
| CORS bloqueado | Error en console + toast al usuario | ✓ |

---

### 6. Testing de Sesión

**Objetivo**: Verificar persistencia y limpieza de sesión

**Pasos**:
1. Login con Google
2. Abrir DevTools > Application > Session Storage
3. Verificar que contiene:
   - `stella_maris_google_session` (tokens)
   - `stella_maris_user_profile` (perfil)
4. Actualizar página (F5)
5. Debería:
   - ✅ Mantener sesión (devuelve a página anterior)
   - ✅ Mostrar usuario loggeado
6. Hacer logout
7. Debería:
   - ✅ Limpiar `sessionStorage` completamente
   - ✅ Redirigir a login

**Validación de Seguridad**:
- [ ] `sessionStorage` se limpia al cerrar pestaña (no persiste entre ventanas)
- [ ] No hay datos sensibles en `localStorage`
- [ ] `localStorage` solo contiene tema (no datos de usuario)

---

### 7. Testing en Móvil/PWA

**Objetivo**: Verificar que PWA funciona

**Pasos**:
1. Abrir app en Chrome móvil
2. Menú > "Instalar aplicación"
3. Instalar
4. Debería:
   - ✅ Funcionar offline (service worker cacheando recursos)
   - ✅ Acceso a cámara/galería para subir archivos
   - ✅ Persistir sesión entre sesiones

---

## Checklist Final Pre-Producción

- [ ] Build sin errores: `npm run build`
- [ ] Login OAuth funciona completo
- [ ] YouTube metadata se obtiene correctamente
- [ ] YouTube upload funciona (si tienes credenciales)
- [ ] Google Drive upload funciona (si tienes credenciales)
- [ ] Errores se muestran de forma clara
- [ ] Tokens expiran correctamente
- [ ] Sesión se limpia al logout
- [ ] CSP headers en `index.html` están correctas
- [ ] No hay secretos en el bundle
- [ ] PWA instala y funciona offline
- [ ] Pruebas en móvil pasan

---

## Comandos Útiles para Testing

```bash
# Desarrollar en modo watch
npm run dev

# Compilar para producción
npm run build

# Preview de build
npm run preview

# Limpiar cache
rm -rf node_modules build
npm install

# Verificar errores TypeScript
npm run build -- --mode production
```

---

## Debugging

### DevTools Console

```javascript
// Ver sesión actual
JSON.parse(sessionStorage.getItem('stella_maris_google_session'))

// Ver perfil
JSON.parse(sessionStorage.getItem('stella_maris_user_profile'))

// Ver cache de videos
Object.keys(localStorage).filter(k => k.startsWith('youtube_'))

// Limpiar sesión manualmente
sessionStorage.clear()
```

### Network Tab

Buscar requests a:
- `accounts.google.com` (OAuth)
- `www.googleapis.com` (YouTube/Drive)
- `cdn.jsdelivr.net` (Figma assets)

---

## Próximos Pasos Post-Testing

1. Si YouTube/Drive no funcionan en producción:
   - Verificar que URLs autorizadas en Google Cloud Console incluyen dominio de producción
   - Verificar que OAuth redirect URI esté correctamente configurado

2. Si hay issues de CORS:
   - Verificar que `index.html` tiene CSP correcta
   - Agregar dominio a lista blanca en Google Cloud Console

3. Si sesión se pierde:
   - Verificar que `sessionStorage` está habilitado en navegador
   - Implementar fallback a `localStorage` si es necesario

---

**Última actualización**: 22 May 2026
**Status**: Lista para testing completo
