# Manual del Administrador (Información Crítica) — Stella Maris

> Para quien quede a cargo de la app en el futuro. Contiene **todo lo necesario para
> levantar, operar y mantener** Stella Maris desde cualquier computador.
>
> ⚠️ **SEGURIDAD — LEER PRIMERO:** este documento describe **dónde** están las
> credenciales y **cómo** usarlas, pero **NO contiene los valores reales**. Los
> valores (claves, tokens, contraseñas) se guardan **fuera de git**, en:
> 1. el panel de **Vercel** (producción) y de cada servicio, y
> 2. un archivo local `docs/entrega/CREDENCIALES.local.md` (copiar de la plantilla
>    `CREDENCIALES.PLANTILLA.md`) **que NO se sube a git**, o en un gestor de
>    contraseñas compartido (recomendado: 1Password/Bitwarden).
> **Nunca** pegar claves reales en archivos versionados.

---

## 1. Qué es y dónde vive

| Recurso | Identificador / URL | Notas |
|---|---|---|
| Sitio en producción | https://stella-maris-front.vercel.app | PWA + funciones `/api` |
| Repositorio de código | github.com/Mirtob/stella-maris-front | Rama principal: `main` |
| Proyecto Supabase | `szoaiiipglebpewwzfgh` (https://supabase.com/dashboard/project/szoaiiipglebpewwzfgh) | DB + Auth + Storage + RPC |
| Hosting / deploy | Vercel (proyecto enlazado al repo) | Auto-deploy al hacer push a `main` |

---

## 2. Cuentas y servicios (inventario de accesos)

Completar el **dueño** (quién tiene acceso) y guardar las credenciales de login en el
gestor de contraseñas. Estos son los **logins de las consolas**, distintos de las API keys (§3).

| # | Servicio | Para qué | Consola | Dueño / cuenta |
|---|---|---|---|---|
| S1 | **GitHub** | Código fuente | github.com | `________` |
| S2 | **Vercel** | Hosting, serverless, variables de entorno | vercel.com | `________` |
| S3 | **Supabase** | Base de datos, Auth, Storage | supabase.com | `________` |
| S4 | **Google Cloud** | OAuth (login), YouTube API, Drive API, Gemini | console.cloud.google.com | `________` |
| S5 | **Canal de YouTube** | Catálogo de cantos | studio.youtube.com | `________` |
| S6 | **Google Drive** | Partituras y media (carpetas) | drive.google.com | `________` |
| S7 | **Resend** | Correos de recuperación de clave | resend.com | `________` |
| S8 | **Sentry** | Monitoreo de errores | sentry.io | `________` |
| S9 | **Dominio** (si aplica) | DNS del sitio | `________` | `________` |

---

## 3. Variables de entorno / credenciales (inventario completo)

> En **producción** se cargan en **Vercel → Settings → Environment Variables**. En
> **local** se ponen en `.env.local` (gitignored). Los valores reales van en
> `CREDENCIALES.local.md` o el gestor de contraseñas — **aquí solo el inventario**.

### 3.1 Cliente (prefijo `VITE_`, se inyectan en el bundle — NO secretas)
| Variable | Para qué | Sensibilidad |
|---|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | Pública |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima (limitada por RLS) | Pública (protegida por RLS) |
| `VITE_GOOGLE_CLIENT_ID` | Login con Google (OAuth) | Pública |
| `VITE_YOUTUBE_API_KEY` | Lectura del canal (cliente; uso legacy) | Restringir por API/referer |
| `VITE_YOUTUBE_CHANNEL_ID` | ID del canal de YouTube | Pública |
| `VITE_GOOGLE_DRIVE_API_KEY` | Acceso a partituras (cliente) | Restringir por API/referer |
| `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER` | Carpeta de partituras (ID) | Pública |
| `VITE_GOOGLE_DRIVE_MEDIA_FOLDER` | Carpeta de media (ID) | Pública |
| `VITE_SENTRY_DSN` | DSN de Sentry (frontend) | Pública |
| `VITE_SENTRY_ENV` / `VITE_APP_ENV` | Entorno reportado | Pública |
| `VITE_APP_VERSION` | Versión mostrada | Pública |

### 3.2 Servidor (solo en Vercel — **SECRETAS**, nunca con prefijo `VITE_`)
| Variable | Para qué | Rotación |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones admin server-side (crear usuarios, etc.) | Supabase → Project Settings → API |
| `GOOGLE_API_KEY` | Proxy `/api/youtube` y Drive (server) | Google Cloud → Credentials |
| `GEMINI_API_KEY` | Sugerencias `/api/suggest` | Google AI Studio / Cloud |
| `RESEND_API_KEY` | Envío de correos de recuperación | resend.com → API Keys |
| `RESEND_FROM` | Remitente verificado de Resend | Configuración del dominio en Resend |
| `ALLOWED_ORIGINS` | Lista blanca de orígenes (CORS) | Editar en Vercel |
| `PUBLIC_ORIGIN` | URL pública para enlaces | Editar en Vercel |

> Plantilla base del cliente: `.env.production.example`. La lista server-only de §3.2
> **no** está en ese archivo a propósito (son secretas).

### 3.3 Cómo rotar una clave (procedimiento general)
1. Generar la nueva clave en la consola del servicio (§2).
2. Actualizarla en **Vercel** (y en `.env.local` si se usa en local).
3. **Redeploy** en Vercel para que tome el nuevo valor.
4. Revocar/eliminar la clave anterior en la consola.
5. Anotar la fecha de rotación en `CREDENCIALES.local.md`.

> **Pendiente conocido:** rotar la `GOOGLE_API_KEY`/key de Drive que estuvo expuesta en
> un bundle anterior y restringirla por API y por referer/dominio.

---

## 4. Cómo levantar la app desde CUALQUIER computador (resumen)

> Detalle completo en `docs/entrega/BACKUP-Y-RESTAURACION.md`.

**Desarrollo local:**
```bash
git clone https://github.com/Mirtob/stella-maris-front.git
cd stella-maris-front
npm install
# crear .env.local con las VITE_* (de .env.production.example) + secretos server-only (§3.2)
npm run dev
```

**Producción (re-desplegar):**
1. Enlazar el repo en **Vercel** (build `npm run build`, output `build`).
2. Cargar **todas** las variables de §3.1 y §3.2 en Vercel.
3. Confirmar el proyecto **Supabase** con su esquema (migraciones en `supabase/migrations/`).
4. Ajustar en **Google Cloud** los *Authorized redirect URIs* del OAuth y los dominios.
5. Push a `main` (o "Redeploy") y correr `node tests/integration/run-all.mjs`.

---

## 5. Procedimientos críticos

| Tarea | Cómo | Referencia |
|---|---|---|
| **Deploy** | Push a `main` → Vercel auto-despliega | — |
| **Aplicar migración SQL** | Supabase → SQL Editor → pegar el `.sql` | `supabase/migrations/` |
| **Sincronizar catálogo** | Panel Admin → Sincronizar YouTube | `docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md` |
| **Subir partituras** | Drive (carpeta de partituras) con la convención de nombres | Manual del Canal |
| **CRUD admin** | Panel Admin → Usuarios / Cantos / Capillas / Parroquias | — |
| **Recuperar cuenta de usuario** | Procedimiento fuera de banda | `docs/RECOVERY-PROCEDURE.md` |
| **Backup de datos** | Pro/PITR o `scripts/supabase-backup.mjs` | `docs/BACKUP-SETUP.md` |
| **Backup local del proyecto** | `scripts/backup-local.ps1` | `docs/entrega/BACKUP-Y-RESTAURACION.md` |
| **Rotar claves** | §3.3 | este documento |
| **Designar otro admin** | Agregar email a la tabla `admins` (Supabase) | `docs/dev/SECURITY.md` |

---

## 6. Checklist de traspaso a un nuevo administrador

- ☐ Acceso a **GitHub** (colaborador del repo)
- ☐ Acceso a **Vercel** (miembro del proyecto)
- ☐ Acceso a **Supabase** (miembro del proyecto)
- ☐ Acceso a **Google Cloud** + **canal de YouTube** + **Drive** (carpetas)
- ☐ Acceso a **Resend** y **Sentry**
- ☐ Entrega de `CREDENCIALES.local.md` (o gestor de contraseñas) con todos los valores
- ☐ Email del nuevo admin agregado a la tabla `admins` de Supabase
- ☐ Repaso conjunto de: deploy, backup, rotación de claves y recovery
- ☐ Confirmar que sabe levantar la app local (`npm run dev`) y leer logs en Vercel/Sentry

---

## 7. Contactos / responsables

| Rol | Nombre | Contacto |
|---|---|---|
| Responsable técnico | `________` | `________` |
| Administrador de contenido (canal/Drive) | `________` | `________` |
| Dueño de cuentas de servicio | `________` | `________` |
