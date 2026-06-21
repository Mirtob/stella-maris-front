# Informe Final de Entrega — Stella Maris

> **Estado: BORRADOR para revisión.** Completar los campos `________` (métricas,
> fechas, nombres) antes de presentar a los stakeholders.

| Campo | Valor |
|---|---|
| Producto | **Stella Maris** — PWA de cantorales litúrgicos para coros católicos (Chile) |
| Etapa | Cierre de **marcha blanca** (soft launch desde 2026-06-15) |
| URL producción | https://stella-maris-front.vercel.app |
| Repositorio | github.com/Mirtob/stella-maris-front |
| Período del informe | 2026-06-15 → `________` |
| Autor / responsable técnico | `________` |
| Fecha de emisión | `________` |

---

## 1. Resumen ejecutivo

Stella Maris es una aplicación web progresiva (PWA) que permite a los **coros**
preparar y publicar los cantorales de cada Misa, y al **pueblo fiel** seguir la
celebración con la letra de los cantos, el ordinario de la Misa y las partituras de
las partes fijas. Incluye un **panel de administración** para gestionar el catálogo,
los usuarios y las parroquias.

Durante la marcha blanca se validó el flujo principal de extremo a extremo —un coro
arma un cantoral, la app genera el folleto PDF y el código QR, y el pueblo fiel lo
consulta— bajo condiciones reales y con las medidas de seguridad activas. La app se
encuentra **operativa en producción** y lista para el cierre de la fase de prueba.

**Veredicto técnico:** `________` (ej.: "Operativa, sin incidentes bloqueantes
abiertos; pendientes menores documentados").

---

## 2. Objetivo y alcance entregado

**Objetivo:** digitalizar y unificar la preparación y el seguimiento de la música
litúrgica de la parroquia, reduciendo la dependencia de fotocopias y facilitando la
participación del pueblo fiel.

**Alcance entregado (resumen):**
- Tres perfiles: **Pueblo fiel**, **Coro** y **Administrador**.
- Catálogo de cantos alimentado desde un **canal de YouTube** + partituras desde **Google Drive**.
- Constructor de cantorales por momentos de la Misa, con guía litúrgica (IGMR/Misal).
- Publicación de cantorales por parroquia/capilla, con **código QR** y **folleto PDF**.
- Seguimiento de la Misa: ordinario con posturas, **respuestas en latín**, y partituras.
- **Modo Atril** para el coro (lectura durante la Misa).
- Acceso por **Google** o por **usuario/clave**, con recuperación de cuenta.

---

## 3. Arquitectura y tecnología (alto nivel)

- **Frontend:** React 18 + TypeScript + Vite + Tailwind, empaquetado como **PWA**.
- **Hosting / backend liviano:** **Vercel** (sitio estático + funciones serverless en `/api`).
- **Datos, autenticación y archivos:** **Supabase** (PostgreSQL con RLS, Auth, Storage, RPC).
- **Integraciones:** Google OAuth (login), YouTube Data API (catálogo), Google Drive
  (partituras), Gemini (sugerencias), Resend (correos de recuperación), Sentry (errores).
- **Seguridad:** claves sensibles **solo del lado servidor** (proxies), políticas RLS,
  rate-limiting distribuido, cabeceras de seguridad y CSP estricta.

> Detalle técnico: `docs/dev/ARQUITECTURA.md`, `docs/dev/DATABASE_SCHEMA.md`,
> `docs/dev/API_SPECIFICATION.md`.

---

## 4. Funcionalidades entregadas por perfil

### Pueblo fiel
- Lista de Misas de su(s) parroquia(s) y capillas.
- Letra de los cantos **sin acordes**; reproducción tipo radio.
- **Ver Ordinario**: guía de la Misa por momentos, posturas y **respuestas en latín** (toggle).
- **PDF** del cantoral con letra sin acordes + **partituras del ordinario** (Kyrie, Gloria, Santo, Cordero, Padre Nuestro).
- Notificaciones de cantorales nuevos; acceso por **QR**.

### Coro
- Constructor de cantorales por momento, con **sugerencias** y **guía litúrgica**.
- Variantes por tiempo: Cuaresma, Semana Santa (Triduo), aspersión pascual.
- **Misa vespertina / del día** (la víspera cuenta como Misa del día siguiente).
- Publicación **multi-parroquia** y regla de **un cantoral por Misa**.
- **PDF del coro** con letra y **acordes**; opción de folleto con partituras.
- **Modo Atril**: partituras de todos los cantos en orden de la Misa (+ letra/acordes de respaldo), zoom, transpositor, autoscroll y modo concentración.

### Administrador
- Sincronización del **canal de YouTube** al catálogo.
- **CRUD completo**: cantos, usuarios (usuario/clave), capillas y parroquias.
- Aprobación/rechazo de cantos; recuperación de cuentas de usuarios.

### Transversal
- **Tutorial en vivo** guiado por perfil + tips contextuales.
- **PWA** instalable y **modo offline** (cantorales y partituras cacheados).
- Español de Chile (tuteo), modo oscuro, accesibilidad básica.

---

## 5. Resultados de la marcha blanca

> Completar con datos reales de la operación.

| Indicador | Valor |
|---|---|
| Parroquias/coros activos | `________` |
| Usuarios registrados (Coro / Pueblo fiel) | `________` |
| Cantorales publicados | `________` |
| Cantos en el catálogo | `________` |
| Incidentes P0/P1 durante la marcha blanca | `________` |
| Disponibilidad observada | `________` |

**QA:** rutina diaria (build + suite de integración + smoke) descrita en
`tests/PLAN-QA-DIARIO.md`; corridas registradas en `tests/INFORME.md`. Última corrida
contra producción: `________` (resultado: `________`).

---

## 6. Seguridad y privacidad

- Claves críticas (service-role de Supabase, Resend, Gemini, Google API) **nunca** viajan
  al navegador: se usan **proxies serverless**. Detalle en `docs/dev/SEGURIDAD-SECRETOS.md`.
- **RLS** en todas las tablas críticas; el pueblo fiel no puede ver borradores ni escribir.
- **Rate limiting** distribuido en los endpoints públicos.
- Cabeceras de seguridad + **CSP** estricta (`vercel.json`).
- Datos personales mínimos; el email de respaldo se usa **solo** para recuperación.
- **Pendiente de seguridad** (heredado): rotar la API key de Google que estuvo expuesta
  en una versión anterior del bundle (ya removida del cliente). Ver §9.

---

## 7. Operación y costos

| Servicio | Función | Plan actual | Costo aprox. |
|---|---|---|---|
| Vercel | Hosting + serverless | `________` | `________` |
| Supabase | DB + Auth + Storage | `________` (Free/Pro) | `________` |
| Google Cloud | OAuth + YouTube + Drive + Gemini | Cuotas gratuitas / pago por uso | `________` |
| Resend | Correos de recuperación | `________` | `________` |
| Sentry | Monitoreo de errores | `________` | `________` |
| Dominio | `________` | `________` | `________` |

> Recomendación: evaluar **Supabase Pro** (USD ~25/mes) por el Point-in-Time Recovery
> de la base de datos (ver `docs/BACKUP-SETUP.md`).

---

## 8. Continuidad y respaldo

- **Código:** versionado en GitHub (`Mirtob/stella-maris-front`).
- **Backup local y portabilidad** (levantar la app en otro PC): `docs/entrega/BACKUP-Y-RESTAURACION.md`.
- **Backup de datos (Supabase):** `docs/BACKUP-SETUP.md` + `scripts/supabase-backup.mjs`.
- **Traspaso a futuros administradores** (servicios, credenciales, cómo levantar todo):
  `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`.

---

## 9. Riesgos y limitaciones conocidas

| # | Riesgo / limitación | Impacto | Mitigación |
|---|---|---|---|
| R1 | Catálogo de cantos depende del trabajo de carga (videos + partituras) | Cantorales pobres si el catálogo está vacío | Plan de carga de contenido; convenio con otros coros |
| R2 | API key de Google expuesta en versión previa | Uso indebido de cuota | **Rotar la key** y restringir por API/referer |
| R3 | Sin Supabase Pro, no hay PITR automático | Pérdida de datos ante incidente | Activar Pro o correr `supabase-backup.mjs` periódico |
| R4 | Match de partituras del ordinario depende de nombres en Drive | Partitura no encontrada | Convención de nombres documentada en el Manual del Canal |
| R5 | Variantes del Triduo/Exequias aún sin texto latino propio | Caen a español en latín | Completar en una iteración futura |

---

## 10. Roadmap / pendientes (post marcha blanca)

- Modo Atril **Fase C (metrónomo)** y **Fase D (afinador)**.
- Latín en las **variantes** del ordinario (Triduo, Exequias, Ordenación).
- Persistencia **cross-device** de preferencias (idioma del ordinario, etc.).
- Métricas de uso / panel de analítica.
- Importación automática de videos de cursos.

---

## 11. Próximos pasos para el cierre

1. Ejecutar el **Plan de Pruebas Final** (`docs/entrega/PLAN-DE-PRUEBAS-FINAL.md`) y adjuntar resultados.
2. Rotar credenciales sensibles (R2) y dejar el inventario en el Manual del Administrador.
3. Realizar y verificar un **backup completo** (datos + código + configuración).
4. Confirmar plan de soporte/operación post-lanzamiento y responsables.
5. Presentación a stakeholders y firma de aceptación.

---

## 12. Anexos

- Plan de pruebas: `docs/entrega/PLAN-DE-PRUEBAS-FINAL.md`
- Backup y restauración: `docs/entrega/BACKUP-Y-RESTAURACION.md`
- Manual del administrador (crítico): `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`
- Manual del canal y contenido: `docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md`
- Arquitectura / esquema de datos / API: `docs/dev/`

---

_Aceptación del stakeholder: __________________________  Fecha: ___________________
