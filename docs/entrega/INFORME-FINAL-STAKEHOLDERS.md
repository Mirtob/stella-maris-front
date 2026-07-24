# Informe Final de Entrega — Stella Maris

> **Documento de cierre para stakeholders.** Presenta qué se entregó, en qué estado, cómo se
> opera y mantiene desde cualquier equipo, los costos, los riesgos y una **hoja de ruta de
> versiones anuales con valor estimado**. Los campos marcados `(dato operativo)` los completa
> el equipo de operación con las métricas reales de uso antes de la presentación.

| Campo | Valor |
|---|---|
| Producto | **Stella Maris** — PWA de cantorales litúrgicos para coros católicos (Chile) |
| Etapa | **Freeze de funcionalidades activo** (2026-07-23) · QA final en ejecución |
| URL producción | https://stella-maris-front.vercel.app |
| Repositorio | github.com/Mirtob/stella-maris-front |
| Período del informe | 2026-06-15 (marcha blanca) → 2026-07-24 (freeze) |
| Autor / responsable técnico | Gustavus Tobar |
| Fecha de emisión | 2026-07-24 |

---

## 1. Resumen ejecutivo

**Stella Maris** es una aplicación web progresiva (**PWA**) — instalable en el teléfono sin
tienda de aplicaciones — que funciona como un "Spotify litúrgico": los **coros** preparan y
publican el cantoral de cada Misa, y el **pueblo fiel** sigue la celebración con la letra de
los cantos, el ordinario de la Misa, las partituras y el audio/video, todo apoyado en el
**calendario litúrgico** real (celebración, ciclo A/B/C, color y tiempo). Incluye un **panel
de administración** para el catálogo, los usuarios y las parroquias, y un **módulo de
formación (Cursos)**.

La app está **operativa en producción**, con backend, autenticación y datos reales. Tras la
marcha blanca (soft launch desde 2026-06-15) se **adelantó el freeze de funcionalidades al
2026-07-23** y se inició el **QA final**.

**Veredicto técnico (al 2026-07-24):** **Operativa, sin incidentes bloqueantes (P0/P1)
abiertos.** El bloque de QA automatizado y la auditoría de estructura de base de datos están
**en verde**; el único hallazgo de la corrida (P3, menor) fue **corregido y verificado en
producción**. Resta ejecutar la **matriz manual por rol en dispositivo** (validación humana
de los flujos de usuario), que no bloquea la operación actual.

---

## 2. Objetivo y alcance entregado

**Objetivo:** digitalizar y unificar la preparación y el seguimiento de la música litúrgica de
la parroquia, reduciendo la dependencia de fotocopias, cuidando la fidelidad litúrgica y
facilitando la participación del pueblo fiel — incluidos adultos mayores.

**Alcance entregado:**
- Tres perfiles: **Pueblo fiel**, **Coro** y **Administrador**, con rol permanente + rol de sesión.
- Catálogo de cantos alimentado desde un **canal de YouTube** + partituras desde **Google Drive**.
- **Constructor de cantorales** por momentos de la Misa, con guía litúrgica (IGMR/Misal), avisos
  de canto repetido y clonado de cantorales.
- Publicación por **parroquia/capilla**, con **código QR** y **folleto PDF** en cuadernillo.
- **Seguimiento de la Misa**: ordinario con posturas, **respuestas en latín**, salmo del libro
  por ciclo A/B/C, y partituras.
- **Modo Atril** para el coro (zoom, transpositor, autoscroll, metrónomo, concentración).
- Acceso por **Google** o por **usuario/clave**, con recuperación de cuenta autoservicio.
- **Notificaciones push**, **favoritos**, **historial global**, **directorio de coros** y
  **Camino de formación (Cursos)** con video y quizzes.

> Descripción funcional completa: `docs/dev/APP-OVERVIEW.md` · Flujos por perfil: `docs/dev/CASOS_DE_USO.md`.

---

## 3. Arquitectura y tecnología (alto nivel)

- **Frontend:** React 18 + TypeScript + Vite + Tailwind, empaquetado como **PWA** (~35.000 líneas).
- **Hosting / backend liviano:** **Vercel** (sitio estático + 11 funciones serverless en `/api` + 1 cron).
- **Datos, autenticación y archivos:** **Supabase** (PostgreSQL con RLS, Auth, Storage, RPC) — 38 migraciones.
- **Integraciones:** Google OAuth (login), YouTube Data API (catálogo), Google Drive (partituras),
  Gemini (sugerencias IA), Resend (correos de recuperación), Sentry (errores), Web Push/VAPID.
- **Seguridad:** claves sensibles **solo del lado servidor** (proxies), políticas **RLS**,
  **rate-limiting** distribuido, cabeceras de seguridad y **CSP estricta**.

> Detalle técnico: `docs/dev/ARQUITECTURA.md`, `docs/dev/DATABASE_SCHEMA.md`, `docs/dev/API_SPECIFICATION.md`.

---

## 4. Funcionalidades entregadas por perfil

### Pueblo fiel
Lista de Misas de su(s) parroquia(s) y capillas · letra **sin acordes** y reproducción tipo radio
· **Ver Ordinario** (posturas + toggle **Español/Latín**) · **salmo responsorial** con antífona ·
**folleto PDF** en cuadernillo · notificaciones de cantoral nuevo · acceso por **QR** · **favoritos**.

### Coro
Constructor por momento con **sugerencias** y **guía litúrgica** · variantes por tiempo (Cuaresma,
Triduo, aspersión pascual) · **Misa vespertina / del día** · publicación **multi-parroquia** y
**un cantoral por Misa** · **PDF del coro** con acordes + partituras · **Modo Atril** · **historial
global** + clonar cantoral · **directorio/contacto del coro**.

### Administrador
Sincronización del **canal de YouTube** · **CRUD completo** de cantos, usuarios (usuario/clave),
capillas y parroquias · aprobación/rechazo de cantos · recuperación de cuentas · editor de quizzes.

### Transversal
**Tutorial en vivo** por perfil + tips contextuales · **PWA** instalable + **offline** (Cache
Storage) · español de Chile (tuteo), modo oscuro, accesibilidad básica (objetivos táctiles ≥44px,
ARIA, foco visible).

---

## 5. Estado de la operación (marcha blanca)

> Métricas de uso a completar por el equipo de operación con datos reales del período.

| Indicador | Valor |
|---|---|
| Parroquias/coros activos | `(dato operativo)` |
| Usuarios registrados (Coro / Pueblo fiel) | `(dato operativo)` |
| Cantorales publicados | `(dato operativo)` |
| Cantos en el catálogo | ~21 aprobados y publicables (verificado por `search_songs` en QA) · en carga |
| Incidentes P0/P1 durante la marcha blanca | `(dato operativo)` |
| Disponibilidad observada | `(dato operativo)` |

---

## 6. Aseguramiento de calidad (QA) — resultados

QA con rutina diaria (build + suite de integración + smoke) descrita en `tests/PLAN-QA-DIARIO.md`;
el **plan de pruebas final** (backend + frontend) está en `docs/entrega/PLAN-DE-PRUEBAS-FINAL.md`.

**Corrida de arranque del QA de freeze — 2026-07-23 (registro en `tests/INFORME.md`):**

| Bloque | Método | Resultado |
|---|---|---|
| Integración backend (RLS / RPC / Storage / CORS) | `tests/integration/run-all.mjs` | ✅ **17/17** |
| **Auditoría de migraciones** (estructura de la BD) | SQL en `docs/entrega/AUDITORIA-MIGRACIONES.md` | ✅ **56/56 OK** — BD 100% al día |
| Endpoints serverless (acceso anónimo / validación) | `curl` a `/api/*` | ✅ 12/12 |
| Rate limiting | `tests/stress/rate-limit.mjs` | ✅ 20×200 · 15×429 · 0×5xx |
| PWA / manifest / íconos (iOS + Android) | `tests/pwa/check-prod.mjs` | ✅ 18 OK · 1 aviso intencional (offline) |
| Claves fuera del bundle | grep sobre `build/` | ✅ 0 fugas |
| Cabeceras de seguridad + CSP | `curl -I` a producción | ✅ CSP/HSTS/X-Frame/nosniff OK |
| Accesibilidad (axe-core) | `tests/qa/axe-audit.mjs` | ✅ 0 violaciones |
| Responsive + objetivos táctiles <44px | `tests/qa/visual-tour.mjs` | ✅ 0 hallazgos |

**Hallazgos:** 1 (P3, robustez) — `/api/suggest` devolvía 500 ante un cuerpo vacío. **Corregido y
verificado en producción** (responde 400). **0 hallazgos P0/P1 abiertos.**

**Pendiente (validación humana, no bloqueante):** matriz manual por rol en dispositivo (Coro,
Pueblo fiel, Admin) según `tests/smoke/CHECKLIST.md`.

---

## 7. Seguridad y privacidad

- Claves críticas (service-role de Supabase, Resend, Gemini, Google API) **nunca** viajan al
  navegador: se usan **proxies serverless**. Detalle en `docs/dev/SEGURIDAD-SECRETOS.md`.
- **RLS** en todas las tablas críticas (verificado en QA): el pueblo fiel no ve borradores ni escribe.
- **Rate limiting** distribuido en los endpoints públicos (verificado en QA).
- Cabeceras de seguridad + **CSP** estricta (`wasm-unsafe-eval` sí, `unsafe-eval` no).
- Datos personales mínimos; el email de respaldo se usa **solo** para recuperación de clave.
- **Pendiente heredado:** rotar la API key de Google que estuvo expuesta en una versión previa del
  bundle (ya removida del cliente). Ver §11 (R2).

---

## 8. Cómo manejar la app desde cualquier computador o teléfono

> La app se opera **100 % desde el navegador**; no requiere un computador dedicado. Hay tres niveles
> según lo que se necesite hacer. Los runbooks detallados están referenciados en cada punto.

### 8.1 Uso cotidiano — solo con el teléfono (coros y fieles)
No requiere computador. Desde cualquier celular:
1. Abrir **https://stella-maris-front.vercel.app** en **Safari** (iPhone) o **Chrome** (Android).
2. **Instalar la app**: *Compartir → Agregar a pantalla de inicio* (iPhone) / *Instalar app* (Android).
3. Ingresar con **Google** o **usuario/clave** y elegir perfil (Coro / Pueblo fiel) y parroquia.
4. Para recibir **notificaciones push** en iPhone: iOS ≥ 16.4 y app instalada en pantalla de inicio.

> Manuales de usuario listos para compartir (con PDF): `docs/manuales/MANUAL-CORO.md`,
> `docs/manuales/MANUAL-PUEBLO-FIEL.md` (`docs/manuales/pdf/`).

### 8.2 Administración — desde cualquier computador, solo navegador
Todo lo administrativo se hace en paneles web; no hay que instalar nada localmente:
- **Contenido de la app:** iniciar sesión como **Administrador** en la propia app → **Panel Admin**
  (sincronizar YouTube, CRUD de cantos/usuarios/capillas/parroquias, quizzes).
- **Carga de cantos y partituras:** subir videos al **canal de YouTube** y partituras a **Google
  Drive** siguiendo la convención de carpetas. Guía: `docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md`,
  `docs/manuales/TUTORIAL-SUBIR-CONTENIDO.md`.
- **Infraestructura:** los paneles de **Vercel** (deploys/logs), **Supabase** (base de datos, Auth,
  Storage) y **Google Cloud** (OAuth/YouTube/Drive/Gemini) se administran desde el navegador con las
  credenciales del inventario. Inventario y operación: `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`.
- **Notificaciones push (operación):** `docs/entrega/NOTIFICACIONES-PUSH.md`.

### 8.3 Mantenimiento / desarrollo — levantar la app en un PC nuevo
Solo si hay que **cambiar el código**. Requisitos: **Node LTS** + **Git** + un editor. Resumen:
```bash
git clone https://github.com/Mirtob/stella-maris-front
cd stella-maris-front
npm install
# crear .env.local con las variables (ver plantilla)
npm run dev      # desarrollo local
npm run build    # verificar el empaquetado
```
El **deploy a producción es automático**: cada `git push` a `main` dispara el despliegue en Vercel.
Runbook completo (variables de entorno, Supabase, Google Cloud, solución de problemas):
**`docs/entrega/LEVANTAR-LA-APP-PASO-A-PASO.md`**.

> **Evaluación de mantenibilidad:** la app se mantiene por años en un PC común (no se necesita equipo
> dedicado). Punto blando no bloqueante: 8 GB de RAM funcionan pero se agradecen 16 GB.

### 8.4 Respaldo, recuperación y traspaso
- **Código:** versionado en GitHub (`Mirtob/stella-maris-front`).
- **Respaldo de datos (Supabase):** `docs/BACKUP-SETUP.md` (+ `scripts/supabase-backup.mjs`); respaldo
  local con `scripts/backup-local.ps1` (ver `docs/entrega/BACKUP-Y-RESTAURACION.md`).
- **Recuperación de cuentas de usuario:** `docs/RECOVERY-PROCEDURE.md`.
- **Traspaso a la cuenta oficial** (dejar todos los servicios en `stellamarismusicacatolica@gmail.com`):
  `docs/entrega/MIGRACION-A-CUENTA-OFICIAL.md`.
- **Credenciales:** inventario en `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`; usar la plantilla
  `docs/entrega/CREDENCIALES.PLANTILLA.md` en un gestor de contraseñas (nunca versionar valores reales).

---

## 9. Operación y costos

| Servicio | Función | Plan actual | Costo actual | Si escala |
|---|---|---|---:|---|
| Vercel | Hosting + serverless + cron | Hobby | US$0 | Pro ≈ US$20/mes |
| Supabase | DB + Auth + Storage | Free | US$0 | Pro ≈ US$25/mes |
| Google Cloud | OAuth + YouTube + Drive + Gemini | Capa gratuita | US$0 | Pago por uso |
| Resend | Correos de recuperación | Free | US$0 | ≈ US$20/mes |
| Sentry | Monitoreo de errores | Free | US$0 | — |
| Dominio propio (opcional) | URL de marca | — | ≈ US$12/año | — |

- **Costo operativo actual:** ≈ **US$0/mes** (todo en capas gratuitas).
- **Si se profesionaliza/escala:** ≈ **US$65/mes** ≈ **US$780/año**.
- **Recomendación:** evaluar **Supabase Pro** (~US$25/mes) por el respaldo Point-in-Time y para evitar
  la pausa por inactividad del plan Free. Detalle económico: `docs/entrega/INFORME-PRESUPUESTARIO.md`.

**Valor económico del activo entregado (v1.0):** valor de reposición estimado **US$18.000 – 28.000**
≈ **433 – 673 UF** (frente a un gasto real de US$2.500). *Cifras estimativas, no tasación formal.*

---

## 10. Continuidad y sostenibilidad

- **Bus factor:** ya existe un **2.º administrador** en la tabla `admins`; documentar accesos y mantener
  el inventario de credenciales al día.
- **Canal de YouTube como motor de sostenibilidad:** los ingresos por anuncios/membresías se
  **reinvierten al 100 %** en el proyecto (equipos, honorarios de desarrollo y de profesores, cursos).
  Proyección a 3 años y punto de recuperación: `docs/entrega/INFORME-PRESUPUESTARIO.md` §6.
- **Respaldos periódicos** tras el freeze (código + datos + configuración).

---

## 11. Riesgos y limitaciones conocidas

| # | Riesgo / limitación | Impacto | Mitigación |
|---|---|---|---|
| R1 | El catálogo depende de la carga de contenido (videos + partituras) | Cantorales pobres si está vacío | Plan de carga; convenio con otros coros |
| R2 | API key de Google expuesta en versión previa | Uso indebido de cuota | **Rotar la key** y restringir por API/referer |
| R3 | Sin Supabase Pro no hay respaldo Point-in-Time automático | Pérdida de datos ante incidente | Activar Pro o correr `supabase-backup.mjs` periódico |
| R4 | Match de partituras del ordinario depende de nombres en Drive | Partitura no encontrada | Convención de nombres documentada (Manual del Canal) |
| R5 | Variantes del Triduo/Exequias sin texto latino propio | Caen a español en latín | Completar en una versión futura (ver §13) |
| R6 | `jspdf` sin versión fijada; paridad de Node local↔Vercel | Rotura por actualización | Fijar versión antes de cerrar el freeze |
| R7 | Derechos de autor de cantos/partituras/audio | Desmonetización de videos | Usar contenido propio, con licencia o dominio público |

> Registro completo (23 riesgos con probabilidad/impacto/mitigación): `docs/entrega/PLAN-DE-RIESGOS.md`.

---

## 12. Mapa de documentación (todo lo entregado)

Toda la documentación vive en `docs/` (índice maestro en `docs/README.md`). Categorías:

- **Estado y visión:** `docs/INFORME-FINAL.md` (estado vivo) · `docs/dev/APP-OVERVIEW.md` ·
  `docs/dev/CASOS_DE_USO.md`.
- **Entrega / operación (`docs/entrega/`):** este informe · `PLAN-DE-PRUEBAS-FINAL.md` ·
  `AUDITORIA-MIGRACIONES.md` · `LEVANTAR-LA-APP-PASO-A-PASO.md` · `MANUAL-ADMINISTRADOR-CRITICO.md` ·
  `BACKUP-Y-RESTAURACION.md` · `MIGRACION-A-CUENTA-OFICIAL.md` · `CREDENCIALES.PLANTILLA.md` ·
  `NOTIFICACIONES-PUSH.md` · `PLAN-DE-RIESGOS.md` · `INFORME-PRESUPUESTARIO.md`.
- **Técnica (`docs/dev/`):** `ARQUITECTURA.md` · `DATABASE_SCHEMA.md` · `API_SPECIFICATION.md` ·
  `BACKEND_SETUP.md` · seguridad (`SEGURIDAD-SECRETOS.md`, `SECURITY.md`) · integraciones (Google/YouTube).
- **Manuales de usuario (`docs/manuales/`):** Coro · Pueblo fiel · Canal y contenido · Tutorial de subida
  (+ PDF en `docs/manuales/pdf/`).
- **Formación (`docs/formacion/`):** guiones de Cursos (Años 1–3, teoría musical) + plan de grabación.
- **Respaldo y recuperación (raíz `docs/`):** `BACKUP-SETUP.md` · `RECOVERY-PROCEDURE.md` · `SENTRY-SETUP.md`.
- **QA (`tests/`):** `PLAN-QA-DIARIO.md` · `INFORME.md` (corridas) · `smoke/CHECKLIST.md` · `qa-externo/`.

---

## 13. Propuesta de valor — hoja de ruta de versiones anuales

> Estrategia sugerida: **una versión mayor al año**, cada una un incremento de valor **autocontenido y
> presupuestable por separado**. Los montos son **estimaciones** (horas × tarifa de mercado US$25–40/h,
> misma metodología que `INFORME-PRESUPUESTARIO.md`); no son cotizaciones formales. La operación sigue
> costando ≈ US$0/mes salvo que se decida escalar a planes pagos.

| Versión | Año | Tema | Esfuerzo estim. | Valor de desarrollo estimado |
|---|---|---|---:|---|
| **v1.0** | 2026 | Base entregada (esta entrega) | ~600 h | US$18.000–28.000 · 433–673 UF |
| **v2.0** | 2027 | Formación y datos | ~140 h | US$3.500–5.600 · 84–135 UF |
| **v3.0** | 2028 | Comunidad y alcance | ~170 h | US$4.250–6.800 · 102–163 UF |
| **v4.0** | 2029 | Inteligencia litúrgica | ~200 h | US$5.000–8.000 · 120–192 UF |
| **v5.0** | 2030 | Plataforma y tiempo real | ~220 h | US$5.500–8.800 · 132–212 UF |

### v2.0 (2027) — "Formación y datos"
Completa lo iniciado y da visibilidad de uso.
- **Panel de analítica** (parroquias/cantorales/cantos más usados, adopción) para decisiones pastorales.
- **Cursos Año 2 y 3** publicados (contenido + más cápsulas y quizzes); importación de videos semiautomática.
- **Afinador** en Modo Atril (Fase D) y **latín en las variantes** del ordinario (Triduo/Exequias/Ordenación).
- **Preferencias persistentes cross-device** (idioma del ordinario, tamaño de letra).
- *Valor:* mejora la **retención** del coro (formación) y aporta **métricas** para sostener el proyecto.

### v3.0 (2028) — "Comunidad y alcance"
Convierte la app en red entre comunidades.
- **Compartir cantorales entre coros/parroquias** (biblioteca comunitaria con valoración y comentarios).
- **Directorio ampliado** y coordinación entre coros de una misma parroquia/diócesis.
- **Integración con calendario** (Google Calendar) para ensayos y Misas.
- **Escalamiento multi-diócesis** (jerarquía país → diócesis → parroquia → capilla más rica).
- *Valor:* **efecto red** — cada comunidad nueva aporta repertorio y sube el valor para todas.

### v4.0 (2029) — "Inteligencia litúrgica"
Automatiza el trabajo pesado del coro.
- **Sugerencia asistida por IA** más profunda (cantoral completo según tiempo/celebración/historial).
- **Transcripción de acordes desde audio** y **OCR de partituras escaneadas** para acelerar la carga.
- **Accesibilidad avanzada** (lectura en voz alta, alto contraste ampliado) y **más idiomas** (portugués LatAm).
- *Valor:* baja drásticamente el costo de mantener el catálogo y **amplía el mercado** a LatAm.

### v5.0 (2030) — "Plataforma y tiempo real"
Consolida a Stella Maris como plataforma.
- **Sincronía en vivo durante la Misa** (el coro guía, el pueblo sigue en tiempo real).
- **Apps nativas** (envoltorio para App Store / Play Store) y **offline-first** robusto.
- **Donaciones/membresías** integradas y opción **white-label** para otras comunidades.
- *Valor:* nuevas **vías de sostenibilidad** (donaciones/membresías/white-label) y experiencia premium.

**Trayectoria de valor (acumulada, estimada):** cada versión anual suma ~US$3.500–8.800 de valor de
desarrollo. En 5 años el activo puede pasar de **~433–673 UF (v1.0)** a un rango acumulado del orden de
**900–1.500 UF**, manteniendo el costo operativo cercano a cero salvo decisión de escalar.

---

## 14. Próximos pasos para el cierre

1. **Completar la matriz manual por rol** del plan de pruebas (Coro/Pueblo fiel/Admin en dispositivo).
2. **Rotar** la credencial sensible (R2) y actualizar el inventario del Manual del Administrador.
3. **Fijar** la versión de `jspdf` y confirmar la paridad de Node (R6).
4. Realizar y verificar un **backup completo** (datos + código + configuración).
5. Completar las **métricas de uso** (§5) y confirmar responsables de soporte/operación.
6. Presentación a stakeholders y **firma de aceptación**.

---

## 15. Anexos

- Plan de pruebas: `docs/entrega/PLAN-DE-PRUEBAS-FINAL.md` · Corridas: `tests/INFORME.md`
- Auditoría de migraciones: `docs/entrega/AUDITORIA-MIGRACIONES.md`
- Levantar la app / backup: `docs/entrega/LEVANTAR-LA-APP-PASO-A-PASO.md` · `docs/entrega/BACKUP-Y-RESTAURACION.md`
- Manual del administrador: `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`
- Presupuesto y valor: `docs/entrega/INFORME-PRESUPUESTARIO.md` · Riesgos: `docs/entrega/PLAN-DE-RIESGOS.md`
- Arquitectura / datos / API: `docs/dev/`

---

_Aceptación del stakeholder: __________________________  Fecha: ____________________
