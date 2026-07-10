# Informe Final — Stella Maris (documento vivo)

> **Documento ACTUALIZABLE.** Es la fuente única de estado del proyecto. Cuando cambie
> algo relevante (módulo, infraestructura, plan de pruebas), se edita aquí y se anota en
> la **Bitácora de cambios** al final.
>
> - **Versión:** 1.1
> - **Última actualización:** 2026-07-10
> - **Estado del proyecto:** módulos maduros para producción · **freeze ~31-jul-2026** → luego QA final
> - **App en producción:** https://stella-maris-front.vercel.app/

---

## 1. Resumen ejecutivo

**Stella Maris** es una PWA (aplicación web instalable) para coros católicos: una
plataforma tipo "Spotify litúrgico" donde los **coros** arman y publican cantorales, y
los **fieles** siguen la Misa con letra, acordes, partituras, audio/video, calendario
litúrgico, notificaciones y un módulo de **formación (Cursos)**.

A julio de 2026 todos los módulos se consideran **suficientemente maduros para
producción**. El plan es **congelar funcionalidades al cierre de julio** y desde ahí
ejecutar el **QA final** (ver §8, plan de pruebas pendiente de integrar).

---

## 2. Estado actual

| Área | Estado |
|---|---|
| Cantorales (armar/publicar/QR/PDF cuadernillo) | ✅ Operativo |
| Multi-parroquia / capillas / roles | ✅ Operativo |
| Calendario litúrgico + celebraciones | ✅ Operativo |
| Partituras (Drive + PDF.js) y Modo Atril | ✅ Operativo |
| Ordinario de la Misa (letra/partitura/latín) | ✅ Operativo |
| Login Google + usuario/clave + recuperación | ✅ Operativo |
| Notificaciones push (celebraciones, nuevo cantoral, cron jueves 10:00 CL) | ✅ Operativo |
| Cursos (formación) + quizzes + video embebido | ✅ Operativo |
| Panel Admin (CRUD completo) | ✅ Operativo |
| **Freeze de funcionalidades** | ⏳ ~31-jul-2026 |
| **QA final** | ⏳ Post-freeze (ver §8) |

---

## 3. Arquitectura y stack

- **Frontend:** React 18 + TypeScript + Vite (PWA). ~35.000 líneas, ~160 archivos `.ts/.tsx`.
- **Estilos:** Tailwind CSS. Iconos `lucide-react`.
- **Backend serverless:** funciones en `api/*` (11 endpoints) desplegadas en **Vercel**
  (incluye 1 **cron** diario de recordatorios).
- **Base de datos / Auth / Storage:** **Supabase** (Postgres + RLS + RPC + Storage +
  Auth). ~38 migraciones SQL en `supabase/migrations/` (se aplican a mano en orden).
- **Integraciones:** Google OAuth (login), YouTube Data API (catálogo por canal, vía
  proxy `/api/youtube`), Google Drive (partituras/media), Gemini (IA), Resend (correos
  de recuperación), Sentry (errores), Web Push / VAPID (notificaciones).
- **Build:** `npm run build` (Vite/esbuild), ~12-20 s. Sin `tsc` en el build (valida
  sintaxis/resolución, no tipos).

> Detalle técnico: `docs/dev/ARQUITECTURA.md`, `docs/dev/DATABASE_SCHEMA.md`,
> `docs/dev/API_SPECIFICATION.md`.

---

## 4. Infraestructura y cuentas

| Servicio | Uso | Notas |
|---|---|---|
| **GitHub** | Repositorio (`Mirtob/stella-maris-front`) | `git push` a `main` dispara deploy |
| **Vercel** | Hosting + serverless + cron | Plan Hobby (cron diario 14:00 UTC = 10:00 CL invierno) |
| **Supabase** | BD/Auth/Storage (`szoaiiipglebpewwzfgh`) | Plan free: se pausa por inactividad (ver §5) |
| **Google Cloud** | OAuth, YouTube, Drive, Gemini | Keys restringidas por API/dominio |
| **Resend** | Correos de recuperación | Requiere dominio verificado |
| **Sentry** | Monitoreo de errores | Opcional |

> Inventario de credenciales (sin valores) y traspaso de cuentas:
> `docs/entrega/MANUAL-ADMINISTRADOR-CRITICO.md`,
> `docs/entrega/CREDENCIALES.PLANTILLA.md`,
> `docs/entrega/MIGRACION-A-CUENTA-OFICIAL.md`.

---

## 5. Evaluación técnica de mantenibilidad (2026-07-10)

**Conclusión:** el proyecto se puede mantener por años en un PC común. **No** se necesita
un computador exclusivo. Vercel y Supabase se administran desde el navegador (cero
cómputo local); localmente solo hace falta editor + `npm run build` + git.

**Punto blando (no bloqueante):** RAM. Con 8 GB el desarrollo funciona pero se pone lento
con editor + navegador + dev server abiertos. Mejora opcional: subir a 16 GB.

**Riesgos de "para siempre" (ninguno es de hardware):**

1. **Supabase free se pausa** tras ~1 semana sin actividad. Con uso real no ocurre; para
   asegurar continuidad, evaluar plan pago (~USD 25/mes).
2. **Dependencia sin fijar:** `jspdf` está como `"*"` en `package.json` → fijar a una
   versión antes del freeze para evitar roturas por actualización.
3. **Paridad de Node:** local usa Node 24; confirmar versión compatible en Vercel.
4. **Bus factor:** un solo mantenedor/cuentas personales → documentar accesos y tener un
   2º administrador (ya hay 2º admin en la tabla `admins`).
5. **Respaldos:** mantener `scripts/backup-local.ps1` con regularidad, sobre todo tras el freeze.
6. **Plan de Vercel:** Hobby limita cron a diario y es para uso no comercial.

> 📋 **Registro de riesgos detallado** (23 riesgos, con probabilidad/impacto/severidad,
> mitigación y contingencia): [entrega/PLAN-DE-RIESGOS.md](entrega/PLAN-DE-RIESGOS.md).
> 💰 **Valor económico y presupuesto** (UF/USD/CLP, gasto real y valor de reposición):
> [entrega/INFORME-PRESUPUESTARIO.md](entrega/INFORME-PRESUPUESTARIO.md).

---

## 6. Mapa de la documentación

Toda la documentación vive en `docs/` y está catalogada en **[docs/README.md](README.md)**
(índice maestro). Categorías: `dev/` (técnica), `entrega/` (traspaso/operación),
`manuales/` (usuarios), `formacion/` (guiones de Cursos), `presentacion/`, `_archivo/`
(histórico superado). El QA vive en `tests/`.

---

## 7. Cómo levantar el proyecto en otro PC

Paso a paso completo (desarrollo local y producción desde cero, con variables de entorno
y solución de problemas): **[docs/entrega/LEVANTAR-LA-APP-PASO-A-PASO.md](entrega/LEVANTAR-LA-APP-PASO-A-PASO.md)**.

Resumen: instalar Node LTS + Git → `git clone` → `npm install` → crear `.env.local` con
las variables → `npm run dev` (o `npm run build`). Para producción: Supabase (migraciones
en orden) + Google Cloud + Vercel (variables de entorno) + deploy.

---

## 8. Plan de pruebas (PENDIENTE — se integra tras el freeze)

> 🔜 **Reservado.** Al cerrar el freeze (~31-jul-2026) se consolidará aquí el **plan de
> pruebas final** para el QA. Esta sección se completará con: alcance, matriz de casos por
> rol (Coro / Pueblo fiel / Admin), pruebas de regresión, criterios de aceptación y
> registro de corridas.

Insumos existentes que alimentarán este plan:
- `docs/entrega/PLAN-DE-PRUEBAS-FINAL.md` — plan detallado backend + frontend.
- `tests/PLAN-QA-DIARIO.md` — rutina diaria de QA (build + integración + smoke).
- `tests/INFORME-QA-FRONTEND.md` — auditoría de frontend/UX (histórica, jun-2026).
- `tests/smoke/CHECKLIST.md` — smoke test manual.
- `docs/dev/QA_CHECKLIST.md`, `docs/dev/TESTING_GUIDE.md`.

---

## 9. Riesgos y pendientes abiertos

- [ ] Fijar versión de `jspdf` (quitar `"*"`).
- [ ] Confirmar versión de Node en Vercel (paridad con local).
- [ ] Decidir plan pago de Supabase para evitar pausa por inactividad.
- [ ] Completar el **plan de pruebas** (§8) tras el freeze.
- [ ] Subir videos de Cursos + activar `COURSE_WEEKLY_ENABLED`.
- [ ] (Opcional) Subir RAM del PC a 16 GB para comodidad de desarrollo.

---

## 10. Bitácora de cambios

| Fecha | Versión | Cambio |
|---|---|---|
| 2026-07-10 | 1.0 | Creación del informe. Reordenamiento de documentación (raíz → `docs/`, `_archivo/`, índice maestro). Instructivo de levantamiento actualizado con VAPID/CRON/flags. |
| 2026-07-10 | 1.1 | Agregados **Plan de Riesgos** (23 riesgos) e **Informe Presupuestario** (UF/USD/CLP). PDF del informe (`scripts/build-informe-pdf.mjs` → Descargas). |
