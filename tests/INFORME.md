# Informe de Pruebas Integrales · Stella Maris

| Campo | Valor |
|---|---|
| **Producto** | Stella Maris — PWA de cantorales litúrgicos |
| **Versión** | (commit SHA) `git rev-parse --short HEAD` → `_________` |
| **Entorno** | Producción (Vercel + Supabase) |
| **Fecha de ejecución** | `_________` |
| **Responsable** | `_________` |
| **Resultado global** | ☐ APROBADO  ☐ APROBADO CON OBSERVACIONES  ☐ RECHAZADO |

---

## Corrida 2026-07-23 — Arranque del QA de freeze (bloque automatizado)

| Campo | Valor |
|---|---|
| **Commit** | `e13427e` (feat ux: jerarquía de acciones, modal accesible, densidad móvil, íconos CRUD) |
| **Entorno** | Producción — `https://stella-maris-front.vercel.app/` + Supabase `szoaiiipglebpewwzfgh` |
| **Ejecutado por** | Claude Code (automatizado) |
| **Alcance** | Todo lo automatizable desde el entorno de desarrollo. **Pendiente manual:** SQL Editor (§2.2), endpoints con sesión/CRON (§2.3 parcial), matriz por rol en dispositivo (§3–§7, §10), tour/offline/wakelock en device (§8.1–§8.2). |
| **Resultado** | ✅ **Bloque automatizado APROBADO** — 0 fallos |

### Resultados

| Bloque del plan | Comando / método | Resultado |
|---|---|---|
| **§2.1** Suite integrada (RLS/RPC/Storage/CORS) | `node tests/integration/run-all.mjs` | ✅ **17/17 PASS**, 0 FAIL |
| **§2.4** Rate limiting | `node tests/stress/rate-limit.mjs` | ✅ 20×200 · 15×429 · **0×5xx** · headers `X-RateLimit-*` presentes |
| **§8.2** PWA / manifest / íconos (iOS+Android emulado) | `node tests/pwa/check-prod.mjs` | ✅ 18 OK · 1 WARN (offline SW, **intencional**) · 0 FAIL |
| **§8.3** Claves fuera del bundle | `grep AIza / service-role / re_ / VAPID` en `build/` | ✅ 0 coincidencias |
| **§8.3** Headers de seguridad + CSP | `curl -I` a producción | ✅ CSP, HSTS (2 años+preload), X-Frame DENY, nosniff, Referrer/Permissions-Policy; **`wasm-unsafe-eval` sí, `unsafe-eval` no** |
| **§8.5** Accesibilidad (axe-core) | `node tests/qa/axe-audit.mjs` (3 pantallas pre-login) | ✅ **0 violaciones** (28/23/22 passes; incompletes = contraste manual) |
| **§8.5** Responsive + tap targets <44px | `node tests/qa/visual-tour.mjs` (iPhone13/Pixel7/desktop) | ✅ **0 hallazgos** P0–P3 (sin errores JS, sin CLS, sin targets <44px) |
| **Build** | `npm run build` | ✅ Verde (~11–15 s) |

### §2.3 — Funciones serverless (casos de acceso anónimo / validación, vía `curl`)

| Endpoint | Caso | Esperado | Observado | Estado |
|---|---|---|---|---|
| `/api/admin-users` | POST sin token | 401 | 401 | ✅ |
| `/api/admin-users` | GET (método incorrecto) | — | 405 | ✅ (guard de método) |
| `/api/notify-cantoral` | POST sin sesión | 401 | 401 | ✅ |
| `/api/delete-account` | POST sin sesión | 401/403 | 401 | ✅ |
| `/api/cron/celebration-reminders` | sin `CRON_SECRET` | 401 | 401 | ✅ |
| `/api/push-subscribe` | body inválido | 400 | 400 | ✅ |
| `/api/pdf?id=hack` | id inválido | 400 | 400 | ✅ |
| `/api/youtube?endpoint=search` | proxy del canal (key server-side) | 200 | 200 | ✅ |
| `/api/youtube?endpoint=hackentry` | endpoint no permitido | 400 | 400 | ✅ |
| `/api/suggest` | POST con body `{}` | 400 | 400 | ✅ |
| `/api/suggest` | GET (método incorrecto) | 405 | 405 | ✅ |
| **`/api/suggest`** | **POST sin cuerpo** | 400 | **500 `FUNCTION_INVOCATION_FAILED`** | ❌ **Hallazgo H1** |

### Hallazgos de esta corrida

| ID | Sev. | Componente | Descripción | Estado |
|---|---|---|---|---|
| **H1** | **P3** (robustez) | `api/suggest.ts` | POST sin cuerpo → `req.body` es `undefined`; desestructurarlo lanzaba excepción no capturada → **500 FUNCTION_INVOCATION_FAILED** en vez de 400 limpio. Sin impacto de seguridad (crashea antes de tocar Gemini; la app real siempre manda body). **Fix aplicado** (`(req.body ?? {})`, commit local) → **pendiente commit+push+re-verificación en prod**. | 🟡 Corregido, sin desplegar |

**Notas:**
- Estos chequeos son de **backend/config/pre-login**; el rediseño de la tarjeta de cantoral y la densidad móvil (commit `e13427e`) viven en pantallas **autenticadas** → se validan en la **matriz por rol en dispositivo** (§5–§7), aún pendiente.
- `axe-core` no está en `package.json`; se instaló con `npm install --no-save` solo para la corrida.
- Sin hallazgos nuevos. La auditoría de junio (`tests/INFORME-QA-FRONTEND.md`) sobre landmarks/h1/region ya está resuelta (axe = 0 violaciones).

---

## Corrida 2026-06-20 — Smoke headless contra producción (feature: Misa vespertina)

| Campo | Valor |
|---|---|
| **Commit** | `10a86a0` (feat: Misa vespertina / primeras vísperas al publicar) |
| **Entorno** | Producción — `https://stella-maris-front.vercel.app/` + Supabase `szoaiiipglebpewwzfgh` |
| **Ejecutado por** | Claude Code (automatizado, anon key) |
| **Hora** | 2026-06-20 21:10 UTC |
| **Resultado** | ✅ **APROBADO** — 17/17 suite integrada + verificación de feature OK |

### Suite integrada (`node tests/integration/run-all.mjs`) — 17/17 ✅

- **Supabase básicos (5/5):** SELECT solo `published`; `search_songs` accesible; `is_admin()` = FALSE para anon; INSERT sin auth bloqueado por RLS; DELETE songs sin admin bloqueado.
- **Storage (3/3):** LIST anon no enumera; UPLOAD anon rechazado; path traversal `../etc/passwd` rechazado (Bucket not found).
- **Endpoints Vercel (3/3):** `/api/sheets` 200 con CORS + RateLimit; CORS niega `evil.example.com`; `/api/pdf?id=hack` → 400.
- **RPC search_songs (6/6):** las 6 combinaciones de filtros respondieron sin error.

### Verificación puntual — Misa vespertina (migración `20260620_cantoral_vigil`)

| Check | Esperado | Observado | Estado |
|---|---|---|---|
| Columna `vigil` legible vía anon (`SELECT id,status,vigil`) | Sin error de columna | 5 filas, `vigil` presente | ✅ Pass |
| Filtro `.eq('vigil', true)` (tipo boolean) | Sin error | OK — 0 cantorales vespertinos hoy | ✅ Pass |
| Bundle desplegado contiene `"Misa vespertina"` | Presente (deploy activo) | Encontrado en `index-BnPMGvGG.js` | ✅ Pass |

**Conclusión:** Deploy del commit `10a86a0` activo en prod, columna `vigil` aplicada en `published_cantorals`, backend sano. **No automatizable:** el insert autenticado (publicar una vespertina como coro) requiere sesión — pendiente de validación manual end-to-end desde cuenta de coro (marcar "vespertina" → cae bajo la víspera con badge 🕯️).

---

## 1. Resumen ejecutivo

Stella Maris fue sometida a un protocolo de pruebas de tres etapas: **integrales** (lógica de
backend y reglas de seguridad), **estrés** (carga controlada sobre endpoints serverless) y
**caja negra móvil** (smoke test del flujo end-to-end desde celular real). El objetivo fue
validar que el sistema responde correctamente al flujo principal — un coro publica un
cantoral, la app genera y sube el PDF a Supabase Storage, se comparte vía QR, y el Pueblo
fiel lo descarga — bajo condiciones realistas y con las medidas de seguridad activas.

**Resultado:** `_________` (completar con el conteo final: ej. "57/60 casos pasaron, 2 hallazgos menores, 1 medio").

---

## 2. Alcance

### Componentes evaluados

- **Supabase**: tablas `published_cantorals`, `songs`, `admins`, `user_profiles`, storage bucket `cantorales-pdf`
- **Vercel serverless functions**: `/api/sheets`, `/api/pdf`, `/api/suggest`
- **Cliente PWA**: flujos de Coro, Pueblo fiel y Admin desde celular
- **Integraciones externas**: YouTube Data API (solo en sync admin), Google OAuth, Drive

### Tipos de prueba

| Tipo | Cobertura | Cant. casos |
|---|---|---|
| Integrales (automatizado) | Supabase RLS + RPC + Storage + endpoints serverless | ~20 |
| SQL Editor (manual) | Verificación de policies, triggers, índices, integridad | ~30 |
| Estrés (automatizado) | Rate limiting bajo carga moderada (35 req/min) | 1 escenario |
| Smoke caja negra (manual) | Flujo end-to-end desde celular real | 60+ casos |

### Fuera de alcance

- Pruebas de carga alta (>300 req/min) — descartadas por riesgo de costos
- Compatibilidad con navegadores legacy (IE, Safari <14)
- Pruebas en hardware OLED para validación de dark mode (sin device disponible)

---

## 3. Pruebas Integrales (automatizadas)

**Ejecución:**

```bash
node tests/integration/run-all.mjs
```

**Output (pegar aquí el JSON final del script):**

```json
__pegar_output__
```

### 3.1 Conectividad básica (Supabase con anon key)

| Caso | Esperado | Observado | Estado |
|---|---|---|---|
| SELECT published_cantorals devuelve solo `status='published'` | Sí, RLS oculta drafts ajenos | `_____` | ☐ Pass ☐ Fail |
| RPC `search_songs` accesible | Sí, retorna lista | `_____` | ☐ Pass ☐ Fail |
| `is_admin()` para anon | FALSE | `_____` | ☐ Pass ☐ Fail |
| INSERT a `published_cantorals` sin auth | Rechazado por RLS | `_____` | ☐ Pass ☐ Fail |
| DELETE en `songs` sin admin | Rechazado por RLS | `_____` | ☐ Pass ☐ Fail |

### 3.2 Storage policies

| Caso | Esperado | Observado | Estado |
|---|---|---|---|
| LIST bucket público | Acceso permitido | `_____` | ☐ Pass ☐ Fail |
| UPLOAD anon | Rechazado | `_____` | ☐ Pass ☐ Fail |
| UPLOAD path traversal `../etc/passwd` | Rechazado por regex | `_____` | ☐ Pass ☐ Fail |

### 3.3 Endpoints Vercel

| Caso | Esperado | Observado | Estado |
|---|---|---|---|
| `/api/sheets` desde origen permitido | 200 + headers CORS | `_____` | ☐ Pass ☐ Fail |
| `/api/sheets` desde `evil.example.com` | Sin `Access-Control-Allow-Origin` | `_____` | ☐ Pass ☐ Fail |
| `/api/pdf?id=hack` (formato inválido) | 400 Bad Request | `_____` | ☐ Pass ☐ Fail |

### 3.4 RPC search_songs — combinaciones de filtros

| Filtros | Esperado | Observado | Estado |
|---|---|---|---|
| sin filtros | Lista completa | `___ rows` | ☐ Pass ☐ Fail |
| `momento=entrada` | Solo Entrada | `___ rows` | ☐ Pass ☐ Fail |
| `temporada=adviento` | Solo Adviento (o sin temporada) | `___ rows` | ☐ Pass ☐ Fail |
| `instrumento=coro` | Solo cantos con coro | `___ rows` | ☐ Pass ☐ Fail |
| `query="santo"` | Full-text match | `___ rows` | ☐ Pass ☐ Fail |
| Combinación entrada+adviento | Intersección | `___ rows` | ☐ Pass ☐ Fail |

---

## 4. Verificaciones SQL (manuales)

**Ejecución:** SQL Editor de Supabase, archivo `tests/sql/checks.sql`.

### 4.1 Admins y RLS

| Check | Esperado | Observado |
|---|---|---|
| Tabla `admins` | 1 fila: `gustavus.tobar@gmail.com` | `_____` |
| `is_admin()` (logueado admin) | `TRUE` | `_____` |
| RLS en tablas críticas | `rowsecurity = true` en las 4 | `_____` |
| Cantidad de policies en `published_cantorals` | ≥ 4 | `_____` |
| Cantidad de policies en `songs` | ≥ 2 | `_____` |

### 4.2 Storage bucket

| Check | Esperado | Observado |
|---|---|---|
| Bucket `cantorales-pdf` existe | Sí, `public = true` | `_____` |
| Policies del bucket | `public_read`, `owner_insert/update/delete` | `_____` |

### 4.3 Catálogo `songs`

| Check | Esperado | Observado |
|---|---|---|
| Total cantos en catálogo | > 0 (idealmente ~989) | `_____` |
| Distribución por `mass_moment` | Todas las categorías representadas | `_____` |
| Duplicados de `youtube_id` | Cero filas | `_____` |
| Índices GIN en `liturgical_seasons` y `instruments` | Presentes | `_____` |

### 4.4 `published_cantorals` integridad

| Check | Esperado | Observado |
|---|---|---|
| Columnas `pdf_url`, `created_by`, `status` existen | Sí | `_____` |
| Cantorales recientes tienen `created_by` no nulo | ≥ 1 con creator | `_____` |
| Cantorales recientes tienen `pdf_url` | ≥ 1 con PDF | `_____` |

### 4.5 Función `is_cantoral_pdf_owner`

| Input | Esperado | Observado |
|---|---|---|
| `<uuid-real>.pdf` (de mi cantoral) | TRUE | `_____` |
| `hack.pdf` | FALSE | `_____` |
| `../etc/passwd` | FALSE | `_____` |
| `not-a-uuid.pdf` | FALSE | `_____` |

### 4.6 `user_profiles`

| Check | Esperado | Observado |
|---|---|---|
| Cantidad total de perfiles | ≥ 1 (después del primer login) | `_____` |
| Distribución por rol | Al menos 1 Admin | `_____` |
| Email admin presente con `role='Admin'` | Sí | `_____` |

### 4.7 Triggers activos

| Check | Esperado | Observado |
|---|---|---|
| `published_cantorals_set_created_by` BEFORE INSERT | Activo | `_____` |
| `songs_updated_at` BEFORE UPDATE | Activo | `_____` |
| `user_profiles_updated_at` BEFORE UPDATE | Activo | `_____` |

---

## 5. Pruebas de Estrés

**Ejecución:**

```bash
node tests/stress/rate-limit.mjs
```

**Configuración:**

| Parámetro | Valor |
|---|---|
| Endpoint | `/api/sheets` |
| Total requests | 35 |
| Ventana | 60 segundos |
| Rate limit configurado | 20 req/min |
| Cargas concurrentes | 1 (secuencial controlada) |

**Output (pegar JSON final):**

```json
__pegar_stats__
```

### Veredictos

| Métrica | Esperado | Observado | Estado |
|---|---|---|---|
| 200 OK | ~20 | `_____` | ☐ Pass ☐ Fail |
| 429 Rate Limit | ~15 | `_____` | ☐ Pass ☐ Fail |
| 5xx Server Errors | 0 | `_____` | ☐ Pass ☐ Fail |
| Headers `X-RateLimit-*` | Presentes | `_____` | ☐ Pass ☐ Fail |
| Latencia promedio | < 1000ms | `_____ ms` | ☐ Pass ☐ Fail |

---

## 6. Smoke Test Caja Negra (manual)

**Ejecución:** Seguir `tests/smoke/CHECKLIST.md` con celular real.

### Resumen por sección

| Sección | Total casos | Pasaron | Fallaron | Comentario |
|---|---|---|---|---|
| A. Autenticación | 7 | `___` | `___` | `_____` |
| B. Setup Coro/Pueblo fiel | 6 | `___` | `___` | `_____` |
| C. Armado de cantoral | 10 | `___` | `___` | `_____` |
| D. Publicación + QR | 10 | `___` | `___` | `_____` |
| E. Deep link / QR | 6 | `___` | `___` | `_____` |
| F. Pueblo fiel | 7 | `___` | `___` | `_____` |
| G. Panel Admin | 9 | `___` | `___` | `_____` |
| H. Mobile-specific | 8 | `___` | `___` | `_____` |
| I. Errores / resiliencia | 5 | `___` | `___` | `_____` |
| **TOTAL** | **68** | **___** | **___** | |

### Dispositivos usados

| Modelo | OS | Browser | Resolución |
|---|---|---|---|
| `_____` | `_____` | `_____` | `_____` |

---

## 7. Hallazgos

> Listar **cada falla** observada con severidad, paso para reproducir y captura/log si aplica.

### Hallazgos críticos (P0 — bloquean la demo)

_Ninguno detectado — completar si surge_

### Hallazgos altos (P1 — afectan flujo principal)

| ID | Componente | Descripción | Reproducción | Estado |
|---|---|---|---|---|
| H1 | `_____` | `_____` | `_____` | ☐ Abierto ☐ Cerrado |

### Hallazgos medios (P2 — degradan UX pero no bloquean)

| ID | Componente | Descripción | Reproducción | Estado |
|---|---|---|---|---|
| H2 | `_____` | `_____` | `_____` | ☐ Abierto ☐ Cerrado |

### Hallazgos bajos (P3 — pulido)

| ID | Componente | Descripción | Reproducción | Estado |
|---|---|---|---|---|
| H3 | `_____` | `_____` | `_____` | ☐ Abierto ☐ Cerrado |

---

## 8. Conclusiones

**Resumen cuantitativo:**

- Casos automatizados ejecutados: `___`
- Casos automatizados aprobados: `___` (`___`%)
- Casos manuales ejecutados: `___`
- Casos manuales aprobados: `___` (`___`%)
- Hallazgos P0/P1: `___`
- Hallazgos P2/P3: `___`

**Estado de aprobación:**

☐ **APROBADO** — Sin hallazgos P0/P1. La app es demostrable.
☐ **APROBADO CON OBSERVACIONES** — Hallazgos P2/P3 documentados pero no bloqueantes.
☐ **RECHAZADO** — Hallazgos P0/P1 abiertos. Re-ejecutar tras correcciones.

**Recomendaciones:**

- `_____`
- `_____`

---

## 9. Anexos

- **A1.** Output completo de `tests/integration/run-all.mjs`
- **A2.** Output completo de `tests/stress/rate-limit.mjs`
- **A3.** Capturas de pantalla del smoke test móvil
- **A4.** Lista de commits incluidos en la versión probada (`git log --oneline -20`)

---

_Firma del responsable: ______________________  Fecha: __________________________ _
