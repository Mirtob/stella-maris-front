# 🚀 Quick Start - Backend Integration

Guía rápida para conectar Stella Maris con el backend real en **menos de 30 minutos**.

---

## 📋 Requisitos Previos

- [ ] Node.js 18+ instalado
- [ ] Cuenta de Google (Gmail)
- [ ] Navegador moderno (Chrome/Firefox)
- [ ] Editor de código (VS Code recomendado)

---

## 🏃 Pasos Rápidos

### 1️⃣ Configurar Supabase (10 min)

**Crear Proyecto:**
1. Ir a https://supabase.com
2. Crear cuenta con Google
3. Click "New Project"
4. Nombre: `stella-maris`
5. Password: (guardar seguro)
6. Region: `South America (São Paulo)`
7. Click "Create project" (esperar 2-3 min)

**Obtener Credentials:**
1. En el proyecto, ir a `Settings` (⚙️) > `API`
2. Copiar:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

**Habilitar Google OAuth:**
1. Ir a `Authentication` > `Providers`
2. Buscar "Google"
3. Toggle "Enabled"
4. Dejar configuración default (usaremos el client de Supabase)
5. Save

**Crear Tablas:**
1. Ir a `SQL Editor`
2. Click "New query"
3. Copiar el contenido de `/docs/DATABASE_SCHEMA.md` (sección CREATE TABLES)
4. Run query
5. Verificar en `Table Editor` que se crearon las tablas

**Configurar Storage:**
1. Ir a `Storage`
2. Click "Create bucket"
3. Nombre: `sheet-music`
4. Public bucket: ✅ (checked)
5. Create bucket

---

### 2️⃣ Configurar Google APIs (10 min)

**Crear Proyecto en Google Cloud:**
1. Ir a https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Nombre: `Stella Maris`
4. Create

**Habilitar YouTube Data API:**
1. En el menú, ir a `APIs & Services` > `Library`
2. Buscar "YouTube Data API v3"
3. Click "Enable"

**Habilitar Google Drive API:**
1. En `Library`, buscar "Google Drive API"
2. Click "Enable"

**Crear API Key:**
1. Ir a `APIs & Services` > `Credentials`
2. Click "Create Credentials" → "API Key"
3. Copiar la key generada → `VITE_YOUTUBE_API_KEY` y `VITE_GOOGLE_DRIVE_API_KEY`
4. (Opcional) Click "Restrict Key" para limitar a tus dominios

**Obtener Channel ID de YouTube:**
1. Ir a tu canal de YouTube (o crear uno nuevo)
2. En la URL, el ID está después de `/channel/`
3. Ejemplo: `youtube.com/channel/UCxxxxx` → copiar `UCxxxxx`
4. Guardar como `VITE_YOUTUBE_CHANNEL_ID`

**Crear Carpeta en Google Drive:**
1. Ir a https://drive.google.com
2. Click "New" → "Folder"
3. Nombre: "Stella Maris - Partituras"
4. Click derecho en la carpeta → "Share" → "Anyone with the link" (Viewer)
5. En la URL, copiar el ID: `drive.google.com/drive/folders/[ID]`
6. Guardar como `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER`

---

### 3️⃣ Configurar el Proyecto (5 min)

**Clonar variables de entorno:**
```bash
cp .env.example .env.local
```

**Editar `.env.local`:**
```bash
# Pegar los valores obtenidos en los pasos anteriores
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...

VITE_YOUTUBE_API_KEY=AIzaSyXXXXXXX...
VITE_YOUTUBE_CHANNEL_ID=UCxxxxxxxxx

VITE_GOOGLE_DRIVE_API_KEY=AIzaSyXXXXXXX...
VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER=1xxxxxxxxx
```

**Instalar dependencias de Supabase:**
```bash
npm install @supabase/supabase-js
```

**Descomentar código en `/services/supabase.ts`:**
1. Abrir `/services/supabase.ts`
2. Buscar comentarios `// TODO: Descomentar cuando...`
3. Descomentar imports y funciones marcadas
4. Eliminar o comentar las versiones mock

---

### 4️⃣ Probar la Integración (5 min)

**Iniciar servidor de desarrollo:**
```bash
npm run dev
```

**Test 1: Verificar Configuración**
1. Abrir DevTools (F12)
2. En consola debería aparecer:
   ```
   ✅ Supabase inicializado
   ✅ Todas las configuraciones están correctas
   ```

**Test 2: Login con Google**
1. Click en "Iniciar Sesión"
2. Seleccionar cuenta de Google
3. Debería redirigir y crear sesión

**Test 3: Crear Perfil**
1. Después del login, completar perfil
2. Seleccionar rol y parroquia
3. Verificar en Supabase Dashboard → Table Editor → `user_profiles`

**Test 4: Crear Canto (Solo Admin)**
1. Login como Admin
2. Ir a "Panel Administrativo" → "Gestión de Cantos"
3. Agregar nuevo canto
4. Verificar en Table Editor → `songs`

**Test 5: Publicar Cantoral (Solo Coro)**
1. Login como Coro
2. Crear cantoral
3. Publicar
4. Verificar en Table Editor → `published_cantorals`

---

## 🔧 Troubleshooting

### ❌ Error: "Invalid API Key"

**Solución:**
1. Verificar que la API Key está bien copiada en `.env.local`
2. Verificar que las APIs están habilitadas en Google Cloud Console
3. Reiniciar servidor de desarrollo (`npm run dev`)

### ❌ Error: "Failed to fetch"

**Solución:**
1. Verificar conexión a internet
2. Verificar URLs en `.env.local`
3. Verificar CORS en Supabase (debería estar habilitado por defecto)

### ❌ Error: "Authentication failed"

**Solución:**
1. Verificar que Google OAuth está habilitado en Supabase
2. Verificar redirect URLs en Google Cloud Console
3. Limpiar cookies y cache del navegador

### ❌ Error: "Storage bucket not found"

**Solución:**
1. Verificar que el bucket `sheet-music` existe en Supabase → Storage
2. Verificar que es público
3. Verificar políticas de acceso

---

## 📊 Verificar Todo Está Funcionando

### Checklist Final

- [ ] Login con Google funciona
- [ ] Perfil se crea en base de datos
- [ ] Cantos se listan correctamente
- [ ] Videos de YouTube se reproducen
- [ ] Thumbnails de YouTube cargan
- [ ] Subir partitura funciona
- [ ] Cantorales se publican correctamente
- [ ] Pueblo Fiel ve cantorales publicados
- [ ] Dark mode persiste después de refresh
- [ ] Sin errores en consola

---

## 🎯 Siguientes Pasos

### Migrar Datos Mock a Supabase

**Opción 1: Manual (recomendado para pocos cantos)**
1. Ir a Supabase → Table Editor → `songs`
2. Click "Insert row"
3. Copiar datos de `/data/songs.ts`

**Opción 2: Script (para muchos cantos)**
```typescript
// scripts/migrate-songs.ts
import { songs } from './data/songs';
import supabase from './services/supabase';

async function migrateSongs() {
  for (const song of songs) {
    await supabase.songs.create(song);
    console.log(`✅ Migrated: ${song.title}`);
  }
}

migrateSongs();
```

### Configurar Row Level Security (RLS)

Ver `/docs/DATABASE_SCHEMA.md` sección "RLS Policies"

### Optimizar Performance

1. Habilitar cache de Supabase
2. Implementar pagination
3. Lazy loading de imágenes
4. Service Worker para offline

---

## 📚 Recursos Adicionales

- [Supabase Documentation](https://supabase.com/docs)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- [Google Drive API Docs](https://developers.google.com/drive)
- [OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)

---

## 💡 Tips Pro

### Development
- Usa **Supabase local development** para testing sin usar quota
- Activa **SQL logging** en Supabase para debug
- Usa **React DevTools** para inspeccionar estado

### Production
- Configura **backups automáticos** en Supabase
- Activa **rate limiting** en APIs
- Monitorea **usage dashboard** de YouTube API
- Implementa **error tracking** (Sentry)

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa logs en Supabase Dashboard
2. Revisa consola del navegador (F12)
3. Revisa `/docs/QA_CHECKLIST.md`
4. Revisa `/docs/API_SPECIFICATION.md`

---

**¡Listo! Tu aplicación debería estar conectada al backend real en menos de 30 minutos.** 🎉
