# Plan de Pruebas Final — Stella Maris (Backend + Frontend)

> **Propósito:** QA completo de punta a punta para el **freeze / entrega final** (congelación
> de funcionalidades ~31-jul-2026). Cubre backend (Supabase + funciones serverless de Vercel)
> y frontend (PWA: Pueblo fiel, Coro, Admin), seguridad, rendimiento, offline y accesibilidad.
>
> **Cómo usarlo:** cada caso tiene **pasos**, **resultado esperado** y una casilla de
> **estado** (☐ Pass / ☐ Fail / ☐ N/A). Anotar evidencia (captura, log) en los fallos.
> Los bloques automatizables apuntan a los scripts existentes en `tests/`.
>
> **Última actualización del plan:** 2026-07-20 — incluye salmo del libro (imagen A/B/C),
> favoritos en todas las pantallas, historial global, clonar cantoral, cursos con video
> embebido, metrónomo del atril y eliminación de cuenta. Alineado hasta el commit `cece530`.

| Campo | Valor |
|---|---|
| Versión probada (commit) | `git rev-parse --short HEAD` → `________` |
| Entorno | Producción (Vercel) + Supabase `szoaiiipglebpewwzfgh` |
| Fecha | `________` |
| Responsable | `________` |
| Dispositivos | `________` (al menos 1 Android real + 1 escritorio) |
| Resultado global | ☐ APROBADO ☐ APROBADO C/OBSERVACIONES ☐ RECHAZADO |

---

## 0. Criterios de aprobación

- **Bloqueante (P0):** rompe el flujo principal (login, ver cantoral, publicar, descargar PDF) o expone un secreto. **0 abiertos** para aprobar.
- **Alto (P1):** afecta un flujo importante de un perfil. ≤ 1 con workaround.
- **Medio/Bajo (P2/P3):** degradan UX o son cosméticos. Se documentan y no bloquean.

---

## 1. Preparación

1. Confirmar que el último commit está **desplegado en Vercel** (Deployments → Ready).
2. `tests/.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PUBLIC_BASE_URL=https://stella-maris-front.vercel.app/`.
3. Tener a mano 3 cuentas de prueba: **Pueblo fiel**, **Coro**, **Admin**.
4. Limpiar `localStorage` del dispositivo de prueba para validar primer ingreso (onboarding/tour).

---

## 2. Backend — Supabase (automatizado + manual)

### 2.1 Suite automatizada (caja negra, anon key)
```bash
node tests/integration/run-all.mjs
```
| Caso | Esperado | Estado |
|---|---|---|
| SELECT `published_cantorals` solo `published` | RLS oculta borradores | ☐ |
| RPC `search_songs` accesible | Lista sin error | ☐ |
| `is_admin()` para anon | FALSE | ☐ |
| INSERT `published_cantorals` sin auth | Rechazado por RLS | ☐ |
| DELETE `songs` sin admin | Rechazado por RLS | ☐ |
| Storage `cantorales-pdf`: LIST anon | No enumera | ☐ |
| Storage: UPLOAD anon | Rechazado | ☐ |
| Storage: UPLOAD path traversal `../etc/passwd` | Rechazado | ☐ |
| `search_songs` (6 combinaciones de filtros) | Sin error | ☐ |

### 2.2 Verificaciones SQL (manual, SQL Editor)
**Primero: `docs/entrega/AUDITORIA-MIGRACIONES.md`** (un solo SQL que verifica que TODAS
las migraciones estén aplicadas — crítico porque se aplicaron a mano). Luego
`tests/sql/checks.sql` bloque por bloque.
| Check | Esperado | Estado |
|---|---|---|
| **Auditoría de migraciones** (SQL del doc) | Todo `OK`, ningún `❌ FALTA` | ☐ |
| Tabla `admins` contiene al admin principal | 1 fila | ☐ |
| RLS activa en tablas críticas | `rowsecurity = true` | ☐ |
| Policies en `published_cantorals` | ≥ 4 | ☐ |
| Columna `vigil` en `published_cantorals` | existe (bool) | ☐ |
| Tabla `custom_parishes` existe | sí | ☐ |
| Índice único `published_cantorals_mass_uk` | presente | ☐ |
| Triggers `set_created_by` / `updated_at` | activos | ☐ |
| Función `api_rate_limit` (RPC) | existe | ☐ |
| Catálogo `songs` | > 0 filas | ☐ |
| Tabla `custom_liturgical_dates` + `cld_select` = `true` | existe, lectura pública | ☐ |
| Tabla `push_subscriptions` (RLS activa, sin policies) + col `role` | existe | ☐ |
| Storage INSERT → `private.is_cantoral_pdf_owner` (fix 42883) | referencia `private` | ☐ |
| Tabla `song_favorites` (RLS por `auth.uid()`) — migración 20260714 | existe; INSERT ajeno rechazado | ☐ |
| Tabla `choir_contacts` (directorio del coro) — 20260708 | existe, RLS activa | ☐ |
| Tablas de cursos: `course_progress`, `course_quizzes`, `course_videos`, `course_ranking` — 20260708/09 | existen | ☐ |
| Tabla `survey_responses` (muestra /demo) — 20260706 | existe; INSERT anónimo permitido (encuesta) | ☐ |
| `mass_moment` CHECK acepta partes extra (salmo, padre_nuestro, no-liturgico) — 20260627/29 | sin error al guardar | ☐ |

### 2.3 Funciones serverless (Vercel)
| Endpoint | Caso | Esperado | Estado |
|---|---|---|---|
| `/api/sheets` | Origin permitido | 200 + headers CORS + RateLimit | ☐ |
| `/api/sheets` | Origin `evil.example.com` | Sin `Access-Control-Allow-Origin` | ☐ |
| `/api/pdf?id=hack` | id inválido | 400 | ☐ |
| `/api/pdf?id=<real>` | partitura real de Drive | 200 `application/pdf` (`%PDF`) | ☐ |
| `/api/youtube` | proxy del canal | 200 con datos del canal | ☐ |
| `/api/suggest` | sugerencia litúrgica | 200 (o degradación si falta Gemini) | ☐ |
| `/api/admin-users` | sin sesión admin | 401/403 | ☐ |
| `/api/recover-password` | email válido | 200 y correo enviado (Resend) | ☐ |
| `/api/push-subscribe` | body inválido | 400 (desplegado) | ☐ |
| `/api/notify-cantoral` | sin sesión | 401 (no 500) | ☐ |
| `/api/push-test` | endpoint inexistente | 200 `sent:0` | ☐ |
| `/api/notify-cantoral` | publicación real (con sesión) | Encola push a la parroquia | ☐ |
| `/api/delete-account` | sin sesión | 401/403 (no 500) | ☐ |
| `/api/cron/celebration-reminders` | sin `CRON_SECRET`/header cron | 401 (no 500) | ☐ |
| `/api/pdf?id=<libro salmos>` | PDF grande linearizado | 200 `application/pdf` **+ `Accept-Ranges: bytes`** (206 con `Range`) | ☐ |
| Todas | No exponen `x-vercel-error: FUNCTION_INVOCATION_FAILED` | OK | ☐ |

### 2.4 Rate limiting (estrés controlado)
```bash
node tests/stress/rate-limit.mjs
```
| Métrica | Esperado | Estado |
|---|---|---|
| ~20 × 200 OK, resto 429 | Límite distribuido (RPC `api_rate_limit`) | ☐ |
| 5xx | 0 | ☐ |
| Headers `X-RateLimit-*` | Presentes | ☐ |

---

## 3. Frontend — Autenticación e ingreso

| # | Caso | Pasos | Esperado | Estado |
|---|---|---|---|---|
| A1 | Login Google | Iniciar con cuenta Google | Entra y carga perfil | ☐ |
| A2 | Login usuario/clave | Cuenta creada por admin | Entra con email sintético | ☐ |
| A3 | Cambio de clave | Ajustes → cambiar clave | Clave actualizada | ☐ |
| A4 | Recuperación self-service | "Olvidé mi clave" → email | Llega correo (Resend) y restablece | ☐ |
| A5 | Recuperación por admin | Ver `docs/RECOVERY-PROCEDURE.md` | Admin reasigna acceso | ☐ |
| A6 | Sesión cross-device | Entrar en tablet ya configurada | NO vuelve a pedir preferencias | ☐ |
| A7 | Logout | Cerrar sesión | Vuelve a login, sugiere rol/parroquia previa | ☐ |

---

## 4. Frontend — Onboarding y perfil

| # | Caso | Esperado | Estado |
|---|---|---|---|
| B1 | Onboarding (3 slides) primera vez | Aparece una vez por dispositivo | ☐ |
| B2 | ProfileSetup: elegir rol (Coro/Pueblo fiel) | Solo esos 2 roles elegibles | ☐ |
| B3 | Selección de parroquia(s) + diócesis | Permite multi-parroquia | ☐ |
| B4 | Email de respaldo (no admin) | Se guarda en Supabase | ☐ |
| B5 | Instrumento (Coro) | Guitarra/Órgano persistido | ☐ |
| B6 | Selector de parroquia activa | Cambia cantorales mostrados | ☐ |

---

## 5. Frontend — Pueblo fiel

| # | Caso | Esperado | Estado |
|---|---|---|---|
| C1 | Lista de Misas de la parroquia | Cantorales próximos visibles | ☐ |
| C2 | Misa vespertina | Aparece bajo el sábado con badge 🕯️ + celebración del domingo | ☐ |
| C3 | Escuchar cantos (radio) | Reproduce todos en orden | ☐ |
| C4 | Ver Cantos / letra | Letra **sin acordes** | ☐ |
| C5 | Ver Ordinario | Guía de la Misa por momentos + posturas | ☐ |
| C6 | Ordinario en **Latín** | Toggle Español/Latín; textos y respuestas en latín (sin tildes) | ☐ |
| C7 | Descargar PDF | Letra sin acordes + **partituras del ordinario** al final | ☐ |
| C8 | Modo Atril | **NO** disponible para Pueblo fiel | ☐ |
| C9 | Campana de notificaciones | Avisa cantoral nuevo | ☐ |
| C10 | Deep link / QR | Abre el cantoral correcto | ☐ |
| C11 | Salmo responsorial (del libro) | Ve **solo la antífona** (texto R/), **sin** partitura | ☐ |
| C12 | Corazón de Favoritos visible | En radio, Ver Ordinario y demás pantallas de cantos | ☐ |
| C13 | Controles de lectura (Ver Cantos) | Tamaño de letra / contraste ajustables y persistidos | ☐ |
| C14 | "Mis cantos" | Los cantos guardados aparecen y se abren en el reproductor | ☐ |

---

## 6. Frontend — Coro

| # | Caso | Esperado | Estado |
|---|---|---|---|
| D1 | Selector de celebración | En Cuaresma/Semana Santa ofrece oficios del Triduo | ☐ |
| D2 | Constructor por momentos | Agregar canto a cada categoría | ☐ |
| D3 | Kyrie → auto Santo/Cordero/Gloria de la misma Misa | Diálogo y alta correcta | ☐ |
| D4 | Aspersión pascual | Pregunta Kyrie vs Aspersión; cambia el momento | ☐ |
| D5 | Padre Nuestro cantado | Pregunta al agregar Ofertorio; resuelve partitura | ☐ |
| D6 | Sugerencias litúrgicas | Propone según tiempo litúrgico | ☐ |
| D7 | Publicar — Tipo de Misa | Elegir **del día** vs **vespertina** | ☐ |
| D8 | Publicar multi-parroquia | Mismos cantos, fecha/horario por parroquia | ☐ |
| D9 | Un cantoral por Misa | No permite duplicar (parroquia+fecha+hora) | ☐ |
| D10 | QR + PDF del coro | PDF letra **con acordes** en orden de la Misa | ☐ |
| D11 | PDF coro **con partituras** (opcional) | Botón secundario embebe todas | ☐ |
| D12 | Historial de cantorales | Re-descarga y gestión | ☐ |
| D13 | Modo Atril — letra/acordes | Canto sin partitura → letra con acordes | ☐ |
| D14 | Modo Atril — **partituras de todos** | Cantos con partitura → PDF en orden de la Misa | ☐ |
| D15 | Atril: zoom, transpositor, autoscroll, concentración, **metrónomo** | Funcionan | ☐ |
| D16 | Datos de Misa **al inicio** del constructor | Fecha + hora (combobox ½ h) + tipo antes de elegir cantos | ☐ |
| D17 | Fecha sin celebración | Ofrece **agregar la celebración** (persistida) | ☐ |
| D18 | Salmo en el constructor | Solo **antífona editable** (sin partitura); va al PDF/pueblo | ☐ |
| D19 | Salmo en Modo Atril (Coro) | Muestra la **partitura del libro** (imagen, año A/B/C correcto) | ☐ |
| D20 | Aviso de canto repetido | Avisa si un canto se usó la semana pasada (excluye ordinario) | ☐ |
| D21 | Publicar — modal centrado en PDF | Solo diseño/letra/tamaño/guirnalda; Misa **prellenada** | ☐ |
| D22 | Historial global (archivo) | Buscador Año/Mes + País/Diócesis/Parroquia/Capilla | ☐ |
| D23 | Clonar cantoral ("usar como base") | Solo desde Historial; precarga los cantos | ☐ |
| D24 | Directorio / contacto del coro | Tarjeta editable en perfil; visible en el directorio | ☐ |

---

## 7. Frontend — Admin

| # | Caso | Esperado | Estado |
|---|---|---|---|
| E1 | Acceso al panel | Solo admin verificado (server-side) | ☐ |
| E2 | Sincronizar YouTube | Importa cantos del canal | ☐ |
| E3 | CRUD Cantos | Crear/editar/aprobar/rechazar/borrar | ☐ |
| E4 | CRUD Usuarios | Crear cuenta usuario/clave, reset, borrar | ☐ |
| E5 | CRUD Capillas | Crear/editar/borrar | ☐ |
| E6 | CRUD Parroquias (`custom_parishes`) | Crear/editar/borrar | ☐ |
| E7 | Admin actuando como Coro/Pueblo fiel | Ve opciones de ese rol | ☐ |

---

## 8. Transversal

### 8.1 Tutorial en vivo (tour)
| Caso | Esperado | Estado |
|---|---|---|
| Auto-disparo 1ª vez por rol (Pueblo/Coro/Admin) | Tour correcto | ☐ |
| Tour no se traba en objetivos altos | Tooltip visible, avanza | ☐ |
| Botón "Ver tutorial" (Sidebar) y "Volver a ver" (Ajustes) | Reinician tours/tips | ☐ |
| Tips contextuales (constructor, Atril) 1ª vez | Aparecen | ☐ |

### 8.2 PWA / Offline
| Caso | Esperado | Estado |
|---|---|---|
| Instalar PWA (Android) | Se instala con ícono/manifest | ☐ |
| Offline: cantorales cacheados | Se ven sin red | ☐ |
| Offline: partituras pre-cacheadas | Se abren sin red (Cache Storage) | ☐ |
| Wake lock en Atril/visor | Pantalla no se apaga | ☐ |

### 8.3 Seguridad
| Caso | Esperado | Estado |
|---|---|---|
| Bundle sin claves sensibles | `grep AIza`/service-role en `build/` → vacío | ☐ |
| CSP y headers (vercel.json) | Presentes en respuesta | ☐ |
| CSP `script-src` con `'wasm-unsafe-eval'` pero **sin** `'unsafe-eval'` | Correcto (WASM sí, eval de strings no) | ☐ |
| Imágenes del salmo (`/salmos/**`) son estáticas | Sin datos sensibles; `img-src 'self'` las sirve | ☐ |
| Secretos solo server-side | Sin `VITE_` para service-role/Resend/Gemini/VAPID privada | ☐ |
| Rotación de la key Google expuesta (pendiente histórico) | Confirmar rotada | ☐ |

### 8.4 Rendimiento / errores
| Caso | Esperado | Estado |
|---|---|---|
| Carga inicial móvil aceptable | < ~4 s en 4G | ☐ |
| Sentry recibe errores | Evento de prueba visible | ☐ |
| Publicar es rápido (sin render de PDFs) | PDF del coro sin partituras embebidas | ☐ |

### 8.5 i18n / a11y / responsive
| Caso | Esperado | Estado |
|---|---|---|
| Español de Chile (tuteo), sin auto-traducción de términos litúrgicos | "Salmo" no se vuelve "Salmon" | ☐ |
| Botones no desbordan en móvil | Texto dentro del botón | ☐ |
| Landmarks/roles (main, dialog) y foco | a11y básica OK | ☐ |
| Modo oscuro | Consistente | ☐ |

---

## 9. Regresión — features de la marcha blanca

Marcar que cada función entregada sigue funcionando tras los últimos cambios:
- ☐ Rate limit distribuido · ☐ Login usuario/clave + recuperación · ☐ CRUD admin completo
- ☐ Proxy YouTube (key fuera del bundle) · ☐ Guía litúrgica en Ver Ordinario
- ☐ Modo Atril A+B+metrónomo · ☐ Tutorial F1–F4 · ☐ Misa vespertina · ☐ Partituras del ordinario
- ☐ Separación PDF/Atril por perfil · ☐ Ordinario en latín · ☐ Notificaciones push (cron + al publicar)
- ☐ Folleto cuadernillo decorado · ☐ Celebraciones persistidas · ☐ Salmo del libro (imagen A/B/C)
- ☐ Favoritos en todas las pantallas · ☐ Historial global · ☐ Clonar cantoral · ☐ Cursos (video+quiz)
- ☐ Datos de contacto del coro · ☐ Aviso de canto repetido · ☐ Transpositor con bemoles

---

## 10. Features nuevas (post marcha blanca — desde 2026-07)

> Requisito previo: la **auditoría de migraciones** (§2.2) en verde.

### 10.1 Notificaciones push (Web Push)
| # | Caso | Esperado | Estado |
|---|---|---|---|
| N1 | Banner en pantalla principal (sin activar) | Aparece; se puede descartar y no vuelve | ☐ |
| N2 | Activar (Ajustes o banner) en Android | Pide permiso; llega **notificación de bienvenida** | ☐ |
| N3 | Botón "Enviar notificación de prueba" | Llega al teléfono | ☐ |
| N4 | iOS en Safari (sin instalar) | Indica "Agregar a inicio"; no intenta activar | ☐ |
| N5 | iOS PWA instalada (16.4+) | Activa y recibe push | ☐ |
| N6 | Publicar 1 cantoral | Suscriptores de esa parroquia reciben "Nuevo cantoral" | ☐ |
| N7 | Tap en el aviso de cantoral | Abre **modo radio** primero, luego el cantoral | ☐ |
| N8 | Publicar VARIOS a la vez (multi-día) | **UN** aviso por parroquia ("N cantorales nuevos") | ☐ |
| N9 | Varios avisos del mismo tipo/parroquia | **No se apilan** (el nuevo reemplaza en la bandeja) | ☐ |
| N10 | Cron: celebraciones a 7/1 día | 1 push por suscriptor con la **lista** (no uno por celebración) | ☐ |
| N11 | Cron: "publica el cantoral" (Coro **o Admin** sin publicar) — **jueves 10:00 Chile** (14 UTC) | Llega a Coro y Admin (rol permanente); si ya publicó, **NO** llega | ☐ |
| N12 | Desactivar | Deja de recibir; reactivable | ☐ |

> Disparo manual del cron (N10/N11): `GET /api/cron/celebration-reminders` con header `Authorization: Bearer <CRON_SECRET>`.

### 10.2 Celebraciones personalizadas (persistidas)
| # | Caso | Esperado | Estado |
|---|---|---|---|
| CE1 | Admin agrega celebración "Todos (global)" | Aparece para TODOS (verificar desde otra cuenta) | ☐ |
| CE2 | Coro agrega celebración | Selector "¿Para quién?" con sus parroquias; queda en esa parroquia | ☐ |
| CE3 | Aparece en "Calendario Litúrgico" y en el selector al publicar | Sí, en ambos | ☐ |
| CE4 | Pueblo fiel **anónimo** (sin login) | Ve las celebraciones globales (lectura pública) | ☐ |
| CE5 | Persistencia | Sigue tras recargar / en otro dispositivo | ☐ |

### 10.3 Folleto PDF en cuadernillo decorado
| # | Caso | Esperado | Estado |
|---|---|---|---|
| F1 | Vista previa del folleto (al publicar) | Decorado: portada + guirnalda + separadores de sección + colores litúrgicos | ☐ |
| F2 | Descargar / compartir por QR | **Mismo diseño impuesto como cuadernillo** (carta horizontal, doble faz) | ☐ |
| F3 | Elegir guirnalda (25 opciones) | Se refleja en el PDF | ☐ |
| F4 | Fuente y tamaño de letra | Se aplican | ☐ |
| F5 | Imprimir y doblar | Calza como librito | ☐ |

### 10.4 Modo Atril imprimible
| # | Caso | Esperado | Estado |
|---|---|---|---|
| AT1 | Imprimir desde el atril | PDF **vertical**, tal cual se ve (no cuadernillo) | ☐ |
| AT2 | Órgano/Guitarra | Órgano → partituras; Guitarra → letra con acordes; respeta transposición/notación actual | ☐ |

### 10.5 Transpositor (teoría musical)
| # | Caso | Esperado | Estado |
|---|---|---|---|
| TR1 | Bajar a Sib mayor | Acordes con **bemoles** (Sib, Mib…), no La#/Re# | ☐ |
| TR2 | Tonalidades de sostenidos (Sol, Re, La) | Se mantienen con sostenidos | ☐ |
| TR3 | Toggle latino/americano | Convierte sin romper la letra | ☐ |

### 10.6 Gestor de cantos (Admin)
| # | Caso | Esperado | Estado |
|---|---|---|---|
| GC1 | Toggle "Litúrgico / No litúrgico" | Momento y `is_liturgical` concuerdan; se puede volver a litúrgico | ☐ |
| GC2 | Guardar canto en un momento nuevo (Padre Nuestro, etc.) | Guarda sin error (CHECK de `mass_moment` al día) | ☐ |
| GC3 | Selector de partitura | **Agrupado por momento** (y por subcarpeta de canto polifónico) | ☐ |
| GC4 | Formato de letra (negrita/cursiva/subrayado/centrado) | Se ve en la letra del Pueblo; **limpio** en acordes/PDF | ☐ |
| GC5 | Canto multi-parte (chips ★ principal) | Sirve en varias partes sin duplicar id | ☐ |

### 10.7 Salmo responsorial del libro (imagen)

> Contexto: la partitura del salmo se sirve como **imagen WebP** (`public/salmos/<A|B|C>/<pág>.webp`),
> NO por pdf.js (JBIG2 + CSP estricta lo impiden). Datos en `src/data/psalmIndex*.ts`. **2026 = Año A.**

| # | Caso | Esperado | Estado |
|---|---|---|---|
| SL1 | Ciclo litúrgico correcto por fecha | A/B/C según el domingo (Adviento 2026 → Año C) | ☐ |
| SL2 | Coro — partitura en Modo Atril | Imagen nítida de la página del libro; zoom del atril funciona | ☐ |
| SL3 | Coro — salmo en el constructor | Solo antífona editable (sin partitura) | ☐ |
| SL4 | Pueblo — antífona | Solo texto R/ (sin partitura) | ☐ |
| SL5 | Antífona editada → PDF/pueblo | El texto editado aparece en el folleto y para el Pueblo | ☐ |
| SL6 | Salmo a dos páginas (rango) | Muestra ambas páginas (p. ej. Epifanía) | ☐ |
| SL7 | Solemnidad de otra sección | Página correcta (Carmen 125, Inmaculada 130, etc.) | ☐ |
| SL8 | Celebración sin salmo en el índice | Aviso "pendiente" (nada roto) | ☐ |
| SL9 | Imagen faltante (B/C incompletos) | Cae a "Abrir el libro en Drive" | ☐ |

### 10.8 Favoritos ("Mis cantos")

| # | Caso | Esperado | Estado |
|---|---|---|---|
| FV1 | Corazón en **todas** las pantallas de cantos | Constructor, Atril, Ver Ordinario (lista+ficha), Radio, Banco de Partituras | ☐ |
| FV2 | Guardar/quitar | Se pinta rosado; se refleja en "Mis cantos" | ☐ |
| FV3 | Sincronización entre dispositivos | Mismo usuario ve los mismos favoritos (RLS por `auth.uid()`) | ☐ |
| FV4 | Sin sesión | No aparece el corazón | ☐ |
| FV5 | Cantos no persistibles (salmo, Padre Nuestro generado, id `::`) | **No** muestran corazón | ☐ |
| FV6 | Canto quitado del catálogo | No rompe "Mis cantos" (se omite el que ya no existe) | ☐ |

### 10.9 Camino de formación (Cursos)

| # | Caso | Esperado | Estado |
|---|---|---|---|
| CU1 | Ver cápsula con video embebido | Reproduce en la app y **suma vista** en YouTube | ☐ |
| CU2 | Botón "Suscríbete" (cápsula y pantalla principal) | Lleva al canal | ☐ |
| CU3 | Quiz tras el video | Corrige y guarda avance (`course_progress`) | ☐ |
| CU4 | Progreso / racha | Se actualizan y persisten | ☐ |
| CU5 | Ranking **oculto** | No visible (flag `SHOW_RANKING=false`); sin restos en UI | ☐ |

### 10.10 Eliminar cuenta (autoservicio)

| # | Caso | Esperado | Estado |
|---|---|---|---|
| DA1 | Ajustes → eliminar mi cuenta | Pide confirmación; borra perfil y datos asociados | ☐ |
| DA2 | Reingreso tras borrar | Trata al usuario como nuevo (onboarding) | ☐ |

---

## 11. Cierre

- Casos ejecutados: `___` · Pass: `___` · Fail: `___`
- Hallazgos P0/P1: `___` · P2/P3: `___`
- Veredicto: ☐ APROBADO ☐ APROBADO C/OBSERVACIONES ☐ RECHAZADO
- Firma responsable: __________________  Fecha: __________

> Las corridas automatizadas del día se registran en `tests/INFORME.md`.
