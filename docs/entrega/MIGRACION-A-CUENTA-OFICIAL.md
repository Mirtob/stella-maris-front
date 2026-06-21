# Migración de la app a la cuenta oficial — Paso a paso

> **Objetivo:** que TODO lo necesario para operar Stella Maris quede vinculado a
> **stellamarismusicacatolica@gmail.com** y no a la cuenta personal
> (gustavus.tobar@gmail.com).
>
> **Estrategia general (clave):** ningún servicio cambia "el correo" de golpe. En cada
> uno se hace: **(1) invitar/dar acceso de dueño a la cuenta oficial → (2) verificar que
> funciona → (3) recién entonces quitar la cuenta personal.** Mantener ambos accesos
> durante la transición evita quedar bloqueado.

> ⚠️ **Dos avisos importantes (leer antes de empezar):**
> - **YouTube:** mover un canal personal a una *Brand Account* puede **cambiar el ID del
>   canal** → habría que actualizar `VITE_YOUTUBE_CHANNEL_ID` y **re-sincronizar** el catálogo.
> - **Google Drive:** si no se puede transferir la propiedad de las carpetas entre
>   cuentas Gmail personales, el camino robusto es **recrear las carpetas** bajo la cuenta
>   oficial y actualizar `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER` y `..._MEDIA_FOLDER`.

---

## Paso 0 — Preparar la cuenta oficial (una sola vez)

1. Entrar a **stellamarismusicacatolica@gmail.com** y dejarla segura:
   - Activar **verificación en dos pasos (2FA)**.
   - Configurar **correo y teléfono de recuperación**.
2. Tener a mano el **gestor de contraseñas** para ir guardando los nuevos accesos
   (`CREDENCIALES.local.md` o el password manager — ver `MANUAL-ADMINISTRADOR-CRITICO.md`).
3. No borrar nada de la cuenta personal hasta el final (Paso 12).

---

## Paso 1 — Google Cloud (OAuth + API keys + Gemini)

> Aquí viven el login con Google, las API keys de YouTube/Drive y (si aplica) Gemini.
> Transferir el **proyecto** conserva las claves; no hace falta rotar todo (salvo la key
> ya expuesta, que conviene rotar igual).

1. https://console.cloud.google.com → seleccionar el proyecto de Stella Maris.
2. **IAM y administración → IAM → Conceder acceso:**
   - Agregar **stellamarismusicacatolica@gmail.com** con rol **Propietario (Owner)**.
3. **APIs y servicios → Pantalla de consentimiento de OAuth:**
   - Cambiar **correo de asistencia** e **información de contacto del desarrollador** a la cuenta oficial.
4. (Recomendado) Aprovechar para **rotar la API key de Google expuesta** y restringirla por API y por dominio/referer.
5. Verificar con la cuenta oficial que puede ver el proyecto, las credenciales y las keys.
6. Más adelante (Paso 12), quitar a la cuenta personal de IAM.

---

## Paso 2 — Canal de YouTube (catálogo de cantos)

> Caso ideal: el canal es una **Brand Account** (cuenta de marca), que admite varios dueños.

**Si es Brand Account:**
1. https://www.youtube.com → con la cuenta personal → **Configuración → Agregar o administrar administradores** (abre la gestión de la Brand Account en Google).
2. **Administrar permisos → invitar** a stellamarismusicacatolica@gmail.com como **Propietario**.
3. La cuenta oficial **acepta** la invitación.
4. **Transferir la propiedad principal** a la cuenta oficial.
5. Verificar que la cuenta oficial administra el canal. Luego (Paso 12) quitar la personal.

**Si es un canal personal (atado al Gmail personal):**
1. YouTube → **Configuración → Configuración avanzada → "Mover canal a una cuenta de marca"**.
2. Mover el canal a una Brand Account y luego seguir los pasos de "Brand Account" de arriba.
3. ⚠️ Esto **puede cambiar el ID del canal**. Si cambia:
   - Actualizar `VITE_YOUTUBE_CHANNEL_ID` (Vercel + `.env.local`) y **Redeploy**.
   - **Re-sincronizar** el catálogo desde el panel Admin.
4. Si YouTube no permite mover el canal (por restricciones de la cuenta), alternativa:
   dejar el canal donde está pero agregar a la cuenta oficial como administrador del
   contenido y planificar la migración del canal más adelante.

---

## Paso 3 — Google Drive (carpetas de partituras y media)

> Las carpetas tienen un **ID** que la app usa (`VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER`,
> `VITE_GOOGLE_DRIVE_MEDIA_FOLDER`).

**Opción A — Transferir propiedad (si está disponible entre las cuentas):**
1. Click derecho en la carpeta → **Compartir** → agregar la cuenta oficial.
2. Cambiar su rol a **Propietario** (Drive a veces solo permite transferir propiedad de
   archivos sueltos entre cuentas Gmail personales, no de carpetas completas).
3. Si funciona y el **ID de la carpeta no cambia**, no hay que tocar variables.

**Opción B — Recrear bajo la cuenta oficial (más robusto):**
1. Con la cuenta oficial, crear dos carpetas nuevas: "Partituras" y "Media".
2. Mover/copiar todos los archivos a las nuevas carpetas.
3. Copiar los **nuevos IDs** de carpeta (están en la URL de Drive).
4. Actualizar `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER` y `VITE_GOOGLE_DRIVE_MEDIA_FOLDER`
   en Vercel + `.env.local` y **Redeploy**.
5. Verificar que las partituras se ven en la app (PDF y Modo Atril).

---

## Paso 4 — Supabase (base de datos, Auth, Storage)

> Los proyectos pertenecen a una **organización**.

1. Iniciar sesión en https://supabase.com con la cuenta oficial (puede usar "Continuar con Google").
2. Que la cuenta oficial tenga su propia **organización** (o usar una compartida).
3. Con la cuenta personal: **Project Settings → General → Transfer project** hacia la
   organización de la cuenta oficial. (Alternativa: en la organización, **invitar** a la
   cuenta oficial como **Owner/Member**.)
4. Revisar la **facturación**: si el proyecto es Pro, confirmar el método de pago en la
   nueva organización.
5. Verificar que la cuenta oficial ve el proyecto, la base y el Storage.

---

## Paso 5 — App: administrador (tabla `admins`)

> El acceso de Admin dentro de la app se valida por **email** en la tabla `admins`.

1. Supabase → **SQL Editor**:
   ```sql
   insert into public.admins (email)
   values ('stellamarismusicacatolica@gmail.com')
   on conflict do nothing;
   ```
2. Iniciar sesión en la app con la cuenta oficial (Login con Google) y confirmar que
   entra al **panel de administración**.
3. (Paso 12) Cuando todo esté migrado, opcionalmente quitar el email personal de `admins`.

---

## Paso 6 — Vercel (hosting + deploy)

1. Iniciar sesión en https://vercel.com con la cuenta oficial ("Continue with Google").
2. Crear un **Team** para la cuenta oficial (o usar su cuenta personal de Vercel).
3. Con la cuenta personal: **Project Settings → (Advanced) Transfer** el proyecto al
   Team/cuenta oficial. (Alternativa: invitar a la cuenta oficial como miembro del proyecto.)
4. Confirmar que el proyecto sigue **enlazado al repo de GitHub** y que las **variables de
   entorno** están completas (si la transferencia no las copia, recargarlas).
5. Hacer un **Redeploy** y verificar que el sitio carga.

---

## Paso 7 — GitHub (código)

> GitHub no obliga a usar Gmail, pero conviene que el repo quede en una cuenta/organización
> asociada a la cuenta oficial.

**Opción A — Misma cuenta GitHub, cambiar correo:**
- GitHub → **Settings → Emails** → agregar el correo oficial y dejarlo como primario.

**Opción B — Nueva cuenta/organización oficial + transferir el repo (recomendado):**
1. Crear una cuenta GitHub (o una **Organización**) con el correo oficial.
2. En el repo actual: **Settings → General → Transfer ownership** hacia la cuenta/organización oficial.
3. Re-conectar el proyecto de **Vercel** al repo en su nueva ubicación.
4. Actualizar la URL del remoto en este PC:
   ```bash
   git remote set-url origin https://github.com/<nuevo-owner>/stella-maris-front.git
   git remote -v
   ```

---

## Paso 8 — Resend (correos de recuperación)

1. Iniciar sesión en https://resend.com.
2. Invitar a la cuenta oficial como **miembro/owner** del workspace (o crear el workspace
   con la cuenta oficial).
3. Verificar que el **dominio remitente** sigue válido (`RESEND_FROM`).
4. Si se crea una API key nueva, actualizar `RESEND_API_KEY` en Vercel + `.env.local` y **Redeploy**.

---

## Paso 9 — Sentry (monitoreo de errores)

1. Invitar a la cuenta oficial como **Owner** de la organización de Sentry, o **transferir**
   el proyecto a una organización de la cuenta oficial.
2. Si cambia el proyecto, actualizar `VITE_SENTRY_DSN` (Vercel + `.env.local`) y **Redeploy**.

---

## Paso 10 — Dominio / DNS (si aplica)

1. Si hay un dominio propio, transferir su gestión a la cuenta oficial en el registrador.
2. En Vercel → **Settings → Domains**, confirmar el dominio bajo el proyecto migrado.

---

## Paso 11 — Actualizar variables y credenciales

1. Revisar **Vercel → Environment Variables**: que todo apunte a recursos de la cuenta
   oficial (IDs de Drive/YouTube, keys nuevas si se rotaron) y **Redeploy**.
2. Actualizar `.env.local` en este PC con los mismos valores.
3. Actualizar `CREDENCIALES.local.md` (o el gestor de contraseñas) con los nuevos accesos
   y fechas de rotación.

---

## Paso 12 — Verificación final y baja de la cuenta personal

1. **Probar de punta a punta con la cuenta oficial:**
   - Login (Google) y entrada al panel Admin.
   - Sincronizar YouTube (catálogo).
   - Ver una partitura (Drive) en PDF y en Modo Atril.
   - Publicar un cantoral de prueba → QR + PDF.
   - Recibir un correo de recuperación (Resend).
2. Cuando TODO funcione con la cuenta oficial, **quitar la cuenta personal**:
   - Google Cloud IAM (Paso 1), YouTube (Paso 2), Supabase (Paso 4), Vercel (Paso 6),
     GitHub (Paso 7), Resend (Paso 8), Sentry (Paso 9), tabla `admins` (Paso 5).
3. (Cuando termine la marcha blanca) correr el smoke: `node tests/integration/run-all.mjs`.

---

## Checklist de migración

- ☐ Cuenta oficial con 2FA y recuperación
- ☐ Google Cloud: cuenta oficial como Owner + consent screen actualizada
- ☐ YouTube: canal administrado por la cuenta oficial (ID actualizado si cambió)
- ☐ Drive: carpetas bajo la cuenta oficial (IDs actualizados si cambiaron)
- ☐ Supabase: proyecto en la organización oficial
- ☐ App: email oficial en la tabla `admins` y login Admin OK
- ☐ Vercel: proyecto bajo la cuenta/Team oficial + env vars completas
- ☐ GitHub: repo en la cuenta/organización oficial + remoto actualizado
- ☐ Resend y Sentry migrados
- ☐ Dominio/DNS (si aplica) migrado
- ☐ Variables y `CREDENCIALES.local.md` actualizados + Redeploy
- ☐ Verificación E2E con la cuenta oficial OK
- ☐ Cuenta personal removida de todos los servicios
