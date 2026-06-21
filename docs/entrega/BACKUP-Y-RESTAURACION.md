# Backup y Restauración — Stella Maris

> Cómo **respaldar** la aplicación para futuros desarrollos en este PC y cómo
> **levantarla desde cualquier otro computador**. Cubre las tres capas que componen
> la app. Las credenciales reales NO van aquí — ver `MANUAL-ADMINISTRADOR-CRITICO.md`.

## Las tres capas a respaldar

| Capa | Qué es | Dónde vive | Cómo se respalda |
|---|---|---|---|
| **1. Código** | Frontend + funciones `/api` + migraciones SQL | GitHub `Mirtob/stella-maris-front` + este PC | `git push` + copia local (script) |
| **2. Configuración / secretos** | Variables de entorno y credenciales | `.env.local` (este PC) y Vercel (prod) | Copia segura de `.env.local` (NO a git) |
| **3. Datos** | Base de datos + archivos (PDFs) | Supabase (Postgres + Storage) | Plan Pro (PITR) o `scripts/supabase-backup.mjs` |

> Regla de oro: el **código** está seguro en GitHub; lo que de verdad hay que cuidar
> aparte son los **secretos** (capa 2) y los **datos** (capa 3), porque NO están en git.

---

## A. Backup local en ESTE PC (para futuros desarrollos)

Objetivo: tener una copia autocontenida del proyecto en este computador, lista para
seguir desarrollando aunque GitHub o internet no estén disponibles.

### A.1 Script de respaldo (recomendado)

```powershell
# Desde la carpeta del proyecto
powershell -ExecutionPolicy Bypass -File scripts\backup-local.ps1
```

El script `scripts/backup-local.ps1`:
1. Crea un **ZIP fechado** del proyecto en `C:\Backups\StellaMaris\` **excluyendo**
   `node_modules`, `build`, `.git` y archivos temporales (lo pesado y reconstruible).
2. Copia `.env.local` a `C:\Backups\StellaMaris\secrets\.env.local.<fecha>`
   (carpeta de secretos, **fuera del repo y fuera de git**).
3. Registra el commit actual (`git rev-parse HEAD`) en un `MANIFEST.txt` dentro del ZIP
   para saber exactamente qué versión se respaldó.

> **Frecuencia sugerida:** antes de cambios grandes y al cierre de cada semana de
> desarrollo. Guardar al menos una copia en un disco/nube distinto a este PC.

### A.2 Backup manual (alternativa)

1. `git push` (asegura el código en GitHub).
2. Copiar la carpeta del proyecto **sin** `node_modules` ni `build` a tu destino de backup.
3. Copiar `.env.local` a tu gestor de contraseñas o carpeta cifrada.
4. Exportar los datos: `node scripts/supabase-backup.mjs` (ver capa 3).

### A.3 Reconstruir el entorno de desarrollo en este PC

```powershell
npm install          # reinstala dependencias desde package-lock
# .env.local debe existir (restaurar desde el backup de secretos)
npm run dev          # http://localhost:5173
npm run build        # verificar que compila
```

---

## B. Levantar la app desde OTRO computador

Requisitos: Node.js LTS, Git, y acceso a las cuentas de servicio (ver Manual del Admin).

### B.1 Para desarrollo local (otro PC)

```bash
git clone https://github.com/Mirtob/stella-maris-front.git
cd stella-maris-front
npm install
# Crear .env.local a partir de la plantilla y completar valores reales:
#   - base: .env.production.example  (cliente)
#   - secretos server-only: ver MANUAL-ADMINISTRADOR-CRITICO.md
npm run dev      # desarrollo
npm run build    # build de producción (sale en /build)
```

> El frontend necesita las variables `VITE_*`. Las funciones `/api` necesitan además
> los secretos server-only, que en local se leen de `.env.local` y en producción del
> panel de Vercel.

### B.2 Para producción (re-desplegar el sitio completo)

1. **Vercel:** crear/recuperar el proyecto enlazado al repo de GitHub.
   - Build command: `npm run build` · Output: `build` (ya en `vercel.json`).
   - Cargar **todas** las variables de entorno (Settings → Environment Variables).
     Lista completa en `MANUAL-ADMINISTRADOR-CRITICO.md`.
2. **Supabase:** debe existir el proyecto con su esquema (ver capa 3 / restauración).
   - Aplicar las migraciones de `supabase/migrations/` en orden si es un proyecto nuevo.
3. **Google Cloud / Resend / Sentry:** las credenciales deben corresponder al proyecto
   (OAuth redirect URIs, dominios permitidos, etc.). Ver Manual del Admin.
4. Hacer un deploy (push a `main` o "Redeploy" en Vercel) y correr el smoke de
   producción (`node tests/integration/run-all.mjs`).

---

## C. Datos — Supabase (base de datos + Storage)

### C.1 Base de datos
- **Recomendado:** Supabase **Pro** con Point-in-Time Recovery (restore con un click).
  Pasos en `docs/BACKUP-SETUP.md` (Opción A).
- **Gratis:** `node scripts/supabase-backup.mjs` genera un dump de las tablas
  (Opción B en `docs/BACKUP-SETUP.md`). Programarlo (Programador de tareas de Windows)
  y guardar los dumps junto a los backups locales.
- **Esquema desde cero:** aplicar `supabase/migrations/*.sql` en orden cronológico
  (los nombres llevan fecha) en un proyecto Supabase nuevo.

### C.2 Storage (PDFs de cantorales)
- Bucket `cantorales-pdf`. Los PDFs se **regeneran** desde la app al re-publicar, pero
  para un respaldo fiel, descargar el bucket (Storage → Download) o vía API con la
  service-role key, y guardarlo con el backup de datos.

---

## D. Verificación del backup (hacerlo al menos una vez)

1. **Código:** clonar el repo en una carpeta temporal, `npm install`, `npm run build` → debe compilar.
2. **Secretos:** confirmar que el `.env.local` respaldado tiene **todas** las claves de
   la lista del Manual del Admin (sin valores vacíos en las requeridas).
3. **Datos:** seguir el "test de restore" de `docs/BACKUP-SETUP.md` (crear fila, borrar,
   restaurar) — o restaurar un dump en un proyecto Supabase de prueba.
4. Anotar fecha de la última verificación: `________`.

---

## E. Checklist rápida de respaldo

- ☐ `git push` al día (código en GitHub)
- ☐ ZIP local del proyecto (`backup-local.ps1`) en disco/nube externa
- ☐ `.env.local` respaldado en lugar seguro (NO en git)
- ☐ Dump de Supabase reciente (o Pro/PITR activo)
- ☐ Copia del bucket `cantorales-pdf` (opcional)
- ☐ Inventario de credenciales actualizado (Manual del Admin)
- ☐ Backup verificado (sección D) en los últimos 90 días
