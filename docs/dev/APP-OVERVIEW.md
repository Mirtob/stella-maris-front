# Stella Maris — Visión general de la aplicación

> **Documento de producto/técnico.** Describe **qué es y qué hace** la app en su estado actual.
> Para el **estado del proyecto** (infraestructura, riesgos, pendientes) manda
> [`docs/INFORME-FINAL.md`](../INFORME-FINAL.md). Para los **flujos por perfil**, ver
> [`CASOS_DE_USO.md`](CASOS_DE_USO.md).
>
> - **Última actualización:** 2026-07-21
> - **Producción:** https://stella-maris-front.vercel.app/

---

## 1. Qué es

**Stella Maris** es una **PWA** (aplicación web instalable, sin tienda de aplicaciones) para coros
católicos y sus comunidades. Funciona como un "Spotify litúrgico":

- los **coros** arman y publican el **cantoral** de cada Misa,
- el **Pueblo fiel** lo sigue con letra, audio, PDF y el ordinario de la Misa,
- y todo se apoya en el **calendario litúrgico** real (celebración, ciclo A/B/C, color, tiempo).

No es un prototipo: está **en producción**, con backend, autenticación y datos reales.

---

## 2. Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + TypeScript + **Vite** (PWA) |
| Estilos | Tailwind CSS · iconos `lucide-react` |
| Estado | Context API + hooks propios |
| Backend | Funciones serverless en `api/*` desplegadas en **Vercel** (11 endpoints + 1 cron) |
| BD / Auth / Storage | **Supabase** (Postgres + RLS + RPC + Storage + Auth) — 38 migraciones SQL |
| PDF | `jspdf` (generación) + `pdfjs-dist` (render de partituras de Drive) |
| Otros | `qrcode`, `web-push` (VAPID), `@sentry/react`, `googleapis` |

**Tamaño:** ~184 archivos `.ts/.tsx`, ~35.000 líneas.

**Integraciones externas:** Google OAuth (login), YouTube Data API (catálogo por canal, vía proxy
`/api/youtube`), Google Drive (partituras y media), Gemini (sugerencias IA), Resend (correos de
recuperación), Sentry (errores), Web Push.

> Detalle: [`ARQUITECTURA.md`](ARQUITECTURA.md) · [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) ·
> [`API_SPECIFICATION.md`](API_SPECIFICATION.md).

### Endpoints serverless (`api/`)

`admin-users` · `delete-account` · `notify-cantoral` · `pdf` · `push-subscribe` · `push-test` ·
`recover-password` · `sheets` · `suggest` · `youtube` · `cron/celebration-reminders`

### Notas de arquitectura que sorprenden

- **No hay service worker de aplicación.** `sw.js` está **desactivado a propósito**; el offline se
  resuelve por **Cache Storage** en `offlineCache.ts`. `push-sw.js` existe y es **solo para push**.
- El **salmo del libro** se sirve como **imagen WebP**, no como PDF: JBIG2 + CSP rompían pdf.js.
- Las **claves sensibles** (service-role, Resend, Gemini, YouTube) son **server-only**; el bundle no
  las contiene.

---

## 3. Roles y permisos

Un usuario tiene un **rol permanente** (perfil) y un **rol de sesión** (`activeRole`): al entrar
confirma "cómo participa hoy". Un miembro de Coro puede actuar como **Pueblo fiel** sin perder su
rol. Los **roles solo los cambia el administrador principal** (validado en UI y por trigger en BD).

### Qué ve cada rol en el menú

| Sección | Pueblo fiel | Coro | Admin |
|---|:--:|:--:|:--:|
| Inicio | ✅ | ✅ (constructor) | ✅ |
| Cantorales Publicados | ✅ | ✅ | ✅ |
| Calendario Litúrgico | ✅ | ✅ | ✅ |
| Mis Cantos (favoritos) | ✅ | ✅ | ✅ |
| Cursos | ✅ | ✅ | ✅ |
| Historial de Cantorales | — | ✅ | ✅ |
| Banco de Partituras | — | ✅ | ✅ |
| Mis Cantorales | — | ✅ | — |
| Panel Admin | — | — | ✅ |
| **Modo Atril** | — | ✅ | — |

> El Admin opera de forma **global** (CRUD sobre todas las parroquias) y por eso no usa el
> conmutador de parroquia activa.

---

## 4. Módulos

### 4.1 Cantorales
Constructor por partes de la Misa según el tiempo litúrgico · **aviso de canto repetido** respecto de
la semana anterior · **clonar** un cantoral anterior ("usar como base") · publicación **multi-parroquia**
· **revisión litúrgica** no bloqueante (Gloria/Aleluya en Cuaresma, canto no litúrgico, secuencias) ·
**QR** por cantoral y QR permanente de parroquia · editar/eliminar publicados de la parroquia propia ·
vigencia hasta las **23:59 del día de la Misa**.

**Tipo de Misa:** del día · **I Vísperas** (sábado tarde = domingo) · **II Vísperas**.

**Dos PDF distintos:**
- **Folleto del Pueblo:** solo letra, decorado, impuesto como **cuadernillo carta**.
- **Full Score del Coro:** letra con acordes + partituras incrustadas (desde el Historial).

### 4.2 Multi-parroquia y capillas
Una **capilla se comporta como parroquia** para selección y publicación (cantoral y público propios).
Etiqueta canónica: `"Parroquia - Diócesis · Capilla"`. El usuario puede pertenecer a varias
parroquias y conmutar sin cerrar sesión.

### 4.3 Calendario litúrgico
Celebración, **ciclo A/B/C**, color y tiempo litúrgico. **Celebraciones personalizadas persistidas**
(`custom_liturgical_dates`): las del Admin son globales, las del Coro son por parroquia.

### 4.4 Cantos y partituras
Catálogo importado del canal de YouTube · **letra con formato** (negrita/cursiva/subrayado/centrado)
· **acordes en cifrado latino** con toggle latino/americano y **transpositor** con ortografía por
armadura (Sib, no La#) · **canto multi-parte** (`extra_moments`) · partituras en Drive organizadas
por momento → canto → **PDF por voz** · **favoritos** ("Mis Cantos").

**Salmo responsorial del libro:** imagen de la página del libro según celebración y ciclo. El Coro ve
la partitura; el Pueblo fiel, la antífona.

### 4.5 Ordinario de la Misa
Letra y partitura por rol · **toggle Español/Latín** · **indicaciones posturales** (de pie / sentado /
de rodillas) · variantes (Triduo, Exequias, Ordenación) · aspersión pascual · partituras resueltas
por **carpeta de Drive** (una carpeta por Misa, un PDF por parte).

### 4.6 Modo Atril (solo Coro)
Todo el repertorio de la Misa como **documento continuo**: zoom global, **transpositor por canto**,
notación latino/americano, **autoscroll**, **metrónomo** (BPM, tap tempo, pulso visual), **modo
concentración**, **impresión** fiel a lo que se ve, y panel de repertorio para saltar entre cantos.

### 4.7 Autenticación
**Google OAuth** y **usuario + clave** (email sintético, para quien no quiere usar correo), con
cambio de clave, email de respaldo y **recuperación self-service** por Resend. **Eliminación de
cuenta** autoservicio.

### 4.8 Notificaciones
**Web Push (VAPID)**: recordatorios de celebraciones (cron diario) y aviso de **nuevo cantoral** al
publicar; para el Coro, recordatorio semanal de "publica el cantoral". Se activan **por dispositivo**
en Ajustes, con envío de prueba. Además, campana de novedades **dentro** de la app.

### 4.9 Cursos — Camino de formación
**Año 1** en cápsulas semanales con **video embebido** (suma vistas al canal), **quiz** por cápsula,
**progreso y racha**, y **certificado** al completar. Ranking tras flag `SHOW_RANKING`.

### 4.10 Panel Admin
CRUD completo de **Usuarios / Cantos / Capillas / Parroquias**, sincronización del canal de YouTube,
migración de catálogo, editor de quizzes y resultados de encuesta.

### 4.11 Transversales
Tutorial en vivo (tours por rol + tips contextuales, reiniciable) · modo oscuro · offline por Cache
Storage · directorio de contacto de coros · pantalla pública `/demo` con encuesta de prelanzamiento.

---

## 5. Momentos de la Misa (canónicos)

Valores de `MassMoment` (columna `mass_moment`), en orden litúrgico:

`entrada` · `rito_aspersion` · `kyrie` · `gloria` · `salmo` · `aleluya` · `post_evangelio` ·
`respuesta_oracion_universal` · `ofertorio` · `santo` · `aclamacion_consagracion` · `amen_doxologia` ·
`padre_nuestro` · `tuyo_es_el_reino` · `cordero` · `comunion` · `final` · `exposicion` ·
`no-liturgico`

**Tiempos litúrgicos** (`LiturgicalSeason`): `adviento` · `navidad` · `tiempo-ordinario` ·
`cuaresma` · `semana-santa` · `pascua` · `pentecostes` · `corpus-christi`. Un canto puede pertenecer
a varios; arreglo vacío = válido para todos.

---

## 6. Diseño

- **Paleta:** fondos ocres claros, encabezados y botones en azul rey con gradiente, alto contraste.
  **Modo oscuro** completo en azules.
- **Colores litúrgicos** aplicados desde el calendario: verde (ordinario), morado (Adviento y
  Cuaresma), blanco (Navidad, Pascua, solemnidades), rojo (Pentecostés, mártires), rosa (3.º de
  Adviento, 4.º de Cuaresma).
- **Accesibilidad:** objetivos táctiles ≥44 px, ARIA labels, foco visible, `prefers-reduced-motion`,
  tipografía base grande (pensada para uso en el templo y para adultos mayores).
- **Mobile-first**, con navegación inferior por rol y menú lateral.
