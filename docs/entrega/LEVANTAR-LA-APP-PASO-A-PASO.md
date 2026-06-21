# Levantar Stella Maris desde cualquier computador — Paso a paso

> Guía detallada y autocontenida para poner la app a funcionar en un computador nuevo,
> ya sea para **desarrollo local** (Vía A) o para **producción desde cero** (Vía B).
> Las credenciales reales se obtienen del gestor de contraseñas / `CREDENCIALES.local.md`
> (ver `MANUAL-ADMINISTRADOR-CRITICO.md`). Aquí NO hay valores secretos.

**Resumen de qué necesitas tener acceso:**
- Cuenta de **GitHub** (repo `Mirtob/stella-maris-front`).
- Cuenta de **Vercel** (solo para producción).
- Proyecto de **Supabase** `szoaiiipglebpewwzfgh` (o uno nuevo si se reconstruye).
- Proyecto de **Google Cloud** (OAuth, YouTube, Drive, Gemini) + canal de YouTube + carpetas de Drive.
- Cuentas de **Resend** (correos) y **Sentry** (errores).

---

## Parte 0 — Requisitos del computador (una sola vez)

1. **Node.js LTS (v20 o superior)** — descargar de https://nodejs.org y instalar.
   - Verificar en una terminal: `node -v` y `npm -v` deben responder.
2. **Git** — https://git-scm.com (en Windows incluye "Git Bash").
   - Verificar: `git --version`.
3. **Editor de código** (recomendado VS Code) — opcional pero útil.
4. (Windows) Las credenciales reales a mano (gestor de contraseñas).

---

## Vía A — Desarrollo local (probar/editar la app en este PC)

> Resultado: la app corriendo en `http://localhost:5173` contra el Supabase real.

### A.1 Obtener el código
```bash
git clone https://github.com/Mirtob/stella-maris-front.git
cd stella-maris-front
```
> Si ya tienes la carpeta (por backup), basta con entrar a ella.

### A.2 Instalar dependencias
```bash
npm install
```
> Tarda unos minutos la primera vez. Reproduce exactamente las versiones del `package-lock`.

### A.3 Crear el archivo de variables `.env.local`
En la raíz del proyecto, crear un archivo llamado **`.env.local`** (no se sube a git).
Tomar como base `.env.production.example` y **completar con los valores reales**:

```env
# --- Cliente (se inyectan en el navegador) ---
VITE_SUPABASE_URL=https://szoaiiipglebpewwzfgh.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key de Supabase>
VITE_GOOGLE_CLIENT_ID=<client id OAuth de Google>
VITE_YOUTUBE_API_KEY=<api key de YouTube>
VITE_YOUTUBE_CHANNEL_ID=<id del canal>
VITE_GOOGLE_DRIVE_API_KEY=<api key de Drive>
VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER=<id carpeta partituras>
VITE_GOOGLE_DRIVE_MEDIA_FOLDER=<id carpeta media>
VITE_SENTRY_DSN=<dsn de Sentry, opcional en local>

# --- Servidor (para las funciones /api en local) ---
SUPABASE_SERVICE_ROLE_KEY=<service role key de Supabase>
GOOGLE_API_KEY=<api key server de Google>
GEMINI_API_KEY=<api key de Gemini>
RESEND_API_KEY=<api key de Resend>
RESEND_FROM=<remitente verificado, ej: no-reply@tudominio>
ALLOWED_ORIGINS=http://localhost:5173
PUBLIC_ORIGIN=http://localhost:5173
```
> El inventario completo y dónde sacar cada valor está en `MANUAL-ADMINISTRADOR-CRITICO.md` §3.
> Si solo vas a tocar la interfaz, con las `VITE_*` alcanza; los secretos server-only
> solo hacen falta si pruebas las funciones `/api` localmente.

### A.4 Levantar en modo desarrollo
```bash
npm run dev
```
Abrir `http://localhost:5173`. Los cambios se recargan en caliente.

### A.5 Verificar que compila para producción
```bash
npm run build
```
Debe terminar con `built in ...` y generar la carpeta `build/`.

> **Nota:** `npm run dev` (Vite) **no** ejecuta las funciones `/api` como en Vercel.
> Para probar `/api` localmente igual que en producción, usar el Vercel CLI:
> `npm i -g vercel` y luego `vercel dev`.

---

## Vía B — Producción desde cero (re-desplegar todo)

> Resultado: la app pública funcionando en Vercel contra Supabase. Hacer esto solo si
> hay que reconstruir el despliegue o migrarlo a otras cuentas.

### B.1 Base de datos y backend — Supabase
1. Si el proyecto `szoaiiipglebpewwzfgh` existe y funciona, **saltar al paso B.1.e**.
2. Crear un proyecto nuevo en https://supabase.com (anotar URL y claves).
3. **Aplicar el esquema:** en Supabase → **SQL Editor**, abrir cada archivo de
   `supabase/migrations/` **en orden cronológico** (los nombres llevan fecha:
   `20260602_...` → `20260620_...`), pegar y ejecutar uno por uno.
   - Esto crea tablas (`published_cantorals`, `songs`, `user_profiles`, `admins`,
     `custom_parishes`…), RLS, RPC (`search_songs`, `api_rate_limit`, `is_admin`…),
     triggers e índices (incl. `vigil` y el único por Misa).
4. **Storage:** confirmar el bucket **`cantorales-pdf`** con sus policies (lo crean las
   migraciones de storage; si no, crearlo y aplicar las policies de esas migraciones).
5. (e) **Admin inicial:** insertar el email del administrador en la tabla `admins`:
   ```sql
   insert into public.admins (email) values ('gustavus.tobar@gmail.com')
   on conflict do nothing;
   ```
6. Anotar de **Project Settings → API**: `Project URL`, `anon key` y `service_role key`.

### B.2 Google Cloud (login + APIs)
1. En https://console.cloud.google.com, proyecto correspondiente:
   - **OAuth consent screen** publicado.
   - **Credentials → OAuth Client ID (Web):** en *Authorized JavaScript origins* y
     *Authorized redirect URIs* agregar la URL de producción
     (`https://<tu-dominio>.vercel.app`) y, para desarrollo, `http://localhost:5173`.
   - **API keys** habilitadas para **YouTube Data API v3**, **Drive API** y **Gemini**.
     Restringir cada key por API y por referer/dominio.
2. Tener identificados el **ID del canal** de YouTube y los **IDs de carpeta** de Drive
   (partituras y media).

### B.3 Resend y Sentry (opcionales pero recomendados)
- **Resend:** verificar el dominio remitente y crear una API key (`RESEND_API_KEY`,
  `RESEND_FROM`). Sin esto, la recuperación self-service por correo no envía.
- **Sentry:** crear proyecto y copiar el `DSN` (`VITE_SENTRY_DSN`).

### B.4 Hosting — Vercel
1. En https://vercel.com → **Add New → Project** → importar el repo de GitHub.
2. Configuración de build (ya viene en `vercel.json`, confirmar):
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
3. **Environment Variables** (Settings → Environment Variables): cargar **todas** las de
   la Vía A (`A.3`), tanto `VITE_*` como las server-only, con los valores de producción.
   - `ALLOWED_ORIGINS` y `PUBLIC_ORIGIN` deben apuntar a la URL pública real.
4. **Deploy.** Vercel construye y publica. Cada `git push` a `main` re-despliega.
5. (Opcional) Configurar el **dominio** propio en Settings → Domains.

### B.5 Verificación post-deploy
1. Abrir la URL pública: debe cargar el login.
2. Iniciar sesión (Google y usuario/clave).
3. Como Coro: armar y **publicar** un cantoral de prueba → ver QR y PDF.
4. Como Pueblo fiel: ver el cantoral, descargar PDF, abrir Ver Ordinario (toggle latín).
5. (Cuando termine la marcha blanca) correr el smoke: `node tests/integration/run-all.mjs`.

---

## Mapa rápido: qué variable vive dónde

| Variable | Local (`.env.local`) | Producción (Vercel) | Secreta |
|---|:---:|:---:|:---:|
| `VITE_*` (Supabase URL/anon, Google client, YouTube, Drive, Sentry) | Sí | Sí | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí (si usas `/api`) | Sí | **Sí** |
| `GOOGLE_API_KEY`, `GEMINI_API_KEY` | Sí (si usas `/api`) | Sí | **Sí** |
| `RESEND_API_KEY`, `RESEND_FROM` | Sí (si usas `/api`) | Sí | **Sí** |
| `ALLOWED_ORIGINS`, `PUBLIC_ORIGIN` | Sí | Sí | No |

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `node` no reconocido | Node no instalado / terminal sin reiniciar | Instalar Node LTS y reabrir la terminal |
| `Cannot find module ...` | Faltó `npm install` | Correr `npm install` en la raíz |
| Pantalla en blanco / errores de Supabase | `VITE_SUPABASE_URL`/`ANON_KEY` mal | Revisar `.env.local` (sin espacios, sin comillas) |
| Login Google falla / `redirect_uri_mismatch` | URL no autorizada en OAuth | Agregar el origen/redirect en Google Cloud (B.2) |
| `/api/...` da `FUNCTION_INVOCATION_FAILED` | Falta un secreto server-only en Vercel | Cargar la env var y **Redeploy** |
| "Failed to parse URL" en serverless | Espacios en `VITE_SUPABASE_URL` | Quitar espacios; el código hace `.trim()` igual |
| No llegan correos de recuperación | Resend sin configurar | Setear `RESEND_API_KEY`/`RESEND_FROM` y dominio verificado |
| El catálogo aparece vacío | Falta sincronizar YouTube | Panel Admin → Sincronizar (ver Manual del Canal) |
| Cambios de env no toman efecto | Vercel cachea el build anterior | Redeploy tras editar variables |

---

## Referencias

- Inventario de credenciales y servicios: `MANUAL-ADMINISTRADOR-CRITICO.md`
- Respaldo y portabilidad: `BACKUP-Y-RESTAURACION.md`
- Backup de datos (Supabase): `docs/BACKUP-SETUP.md`
- Esquema de datos / API: `docs/dev/DATABASE_SCHEMA.md`, `docs/dev/API_SPECIFICATION.md`
