# 📚 Documentación — Stella Maris

Índice maestro de **toda** la documentación del proyecto. Empieza por los dos primeros.

| ⭐ Documento | Para qué |
|---|---|
| **[INFORME-FINAL.md](INFORME-FINAL.md)** | Estado del proyecto (documento **vivo/actualizable**). Incluye la sección reservada para el **plan de pruebas**. |
| **[entrega/LEVANTAR-LA-APP-PASO-A-PASO.md](entrega/LEVANTAR-LA-APP-PASO-A-PASO.md)** | Cómo **levantar la app en otro PC desde cero** (dev local y producción). |

---

## 🗂️ Estructura

```
docs/
├── INFORME-FINAL.md          ← informe final vivo (empezar aquí)
├── README.md                 ← este índice
├── BACKUP-SETUP.md           ← respaldo de datos (Supabase)
├── RECOVERY-PROCEDURE.md     ← recuperación de cuentas de usuario
├── SENTRY-SETUP.md           ← monitoreo de errores
├── entrega/                  ← traspaso y operación (handoff)
├── dev/                      ← documentación técnica (desarrollo)
├── manuales/                 ← manuales de usuario (+ PDFs)
├── formacion/                ← guiones del módulo Cursos
├── presentacion/             ← material de presentación (PDF, QR)
└── _archivo/                 ← documentos históricos SUPERADOS (no vigentes)

tests/                        ← QA: planes, smoke, guías de testers
```

---

## 🚚 entrega/ — Traspaso y operación

Todo lo necesario para operar, respaldar y traspasar el proyecto.

- [README.md](entrega/README.md) — orden de lectura de la carpeta.
- [INFORME-FINAL-STAKEHOLDERS.md](entrega/INFORME-FINAL-STAKEHOLDERS.md) — informe a stakeholders.
- [LEVANTAR-LA-APP-PASO-A-PASO.md](entrega/LEVANTAR-LA-APP-PASO-A-PASO.md) — **levantar en otro PC desde cero**.
- [MANUAL-ADMINISTRADOR-CRITICO.md](entrega/MANUAL-ADMINISTRADOR-CRITICO.md) — servicios, credenciales (inventario) y operación.
- [CREDENCIALES.PLANTILLA.md](entrega/CREDENCIALES.PLANTILLA.md) — plantilla de credenciales (no versionar valores reales).
- [MIGRACION-A-CUENTA-OFICIAL.md](entrega/MIGRACION-A-CUENTA-OFICIAL.md) — pasar servicios a la cuenta oficial.
- [BACKUP-Y-RESTAURACION.md](entrega/BACKUP-Y-RESTAURACION.md) — respaldo local y portabilidad.
- [NOTIFICACIONES-PUSH.md](entrega/NOTIFICACIONES-PUSH.md) — operación del sistema de push.
- [AUDITORIA-MIGRACIONES.md](entrega/AUDITORIA-MIGRACIONES.md) — auditoría de migraciones SQL.
- [PLAN-DE-PRUEBAS-FINAL.md](entrega/PLAN-DE-PRUEBAS-FINAL.md) — plan de pruebas (insumo del QA final).

## 🛠️ dev/ — Documentación técnica

- **Arquitectura y visión:** [ARQUITECTURA.md](dev/ARQUITECTURA.md) · [APP-OVERVIEW.md](dev/APP-OVERVIEW.md) · [INDEX.md](dev/INDEX.md) · [DOCUMENTACION.md](dev/DOCUMENTACION.md)
- **Datos y API:** [DATABASE_SCHEMA.md](dev/DATABASE_SCHEMA.md) · [API_SPECIFICATION.md](dev/API_SPECIFICATION.md)
- **Backend / integraciones:** [BACKEND_SETUP.md](dev/BACKEND_SETUP.md) · [QUICK_START_BACKEND.md](dev/QUICK_START_BACKEND.md) · [INTEGRACIONES_BACKEND.md](dev/INTEGRACIONES_BACKEND.md) · [GOOGLE_OAUTH_INTEGRATION.md](dev/GOOGLE_OAUTH_INTEGRATION.md) · [YOUTUBE_API_INTEGRATION.md](dev/YOUTUBE_API_INTEGRATION.md) · [YOUTUBE_INTEGRATION.md](dev/YOUTUBE_INTEGRATION.md)
- **Seguridad:** [SECURITY.md](dev/SECURITY.md) · [SEGURIDAD.md](dev/SEGURIDAD.md) · [SEGURIDAD-SECRETOS.md](dev/SEGURIDAD-SECRETOS.md)
- **Producto / UX / casos:** [CASOS_DE_USO.md](dev/CASOS_DE_USO.md) · [CORRECCIONES_LITURGICAS.md](dev/CORRECCIONES_LITURGICAS.md) · [MEJORAS_UX_UI.md](dev/MEJORAS_UX_UI.md) · [RESUMEN_IMPLEMENTACION.md](dev/RESUMEN_IMPLEMENTACION.md)
- **Planes de features:** [PLAN-MODO-ATRIL.md](dev/PLAN-MODO-ATRIL.md) · [PLAN-PARTITURAS-ORDINARIO.md](dev/PLAN-PARTITURAS-ORDINARIO.md) · [PLAN-TUTORIAL-EN-VIVO.md](dev/PLAN-TUTORIAL-EN-VIVO.md)
- **QA técnico:** [QA_CHECKLIST.md](dev/QA_CHECKLIST.md) · [QA_SUMMARY.md](dev/QA_SUMMARY.md) · [TESTING_GUIDE.md](dev/TESTING_GUIDE.md)
- **Convenciones:** [Guidelines.md](dev/Guidelines.md) · [Attributions.md](dev/Attributions.md)

> Nota: `dev/` tiene algo de solapamiento histórico (varios documentos de seguridad y de
> índice). El estado vigente manda desde `INFORME-FINAL.md`.

## 👥 manuales/ — Usuarios finales

- [MANUAL-CORO.md](manuales/MANUAL-CORO.md) · [MANUAL-PUEBLO-FIEL.md](manuales/MANUAL-PUEBLO-FIEL.md)
- [MANUAL-CANAL-Y-CONTENIDO.md](manuales/MANUAL-CANAL-Y-CONTENIDO.md) · [TUTORIAL-SUBIR-CONTENIDO.md](manuales/TUTORIAL-SUBIR-CONTENIDO.md)
- PDFs listos para compartir en `manuales/pdf/`.

## 🎓 formacion/ — Guiones de Cursos

- Guiones Año 1: [T1](formacion/guiones-trimestre-1.md) · [T2](formacion/guiones-trimestre-2.md) · [T3](formacion/guiones-trimestre-3.md) · [T4](formacion/guiones-trimestre-4.md)
- [Teoría Musical](formacion/guiones-teoria-musical.md) · [Año 2](formacion/guiones-ano-2.md) · [Año 3](formacion/guiones-ano-3.md)
- [plan-de-grabacion.md](formacion/plan-de-grabacion.md) — sesiones + metadata `STELLA_MARIS_CURSO`.

## 🧪 tests/ — QA (fuera de docs/)

- [PLAN-QA-DIARIO.md](../tests/PLAN-QA-DIARIO.md) — rutina diaria de QA.
- [INFORME.md](../tests/INFORME.md) — corridas registradas.
- [INFORME-QA-FRONTEND.md](../tests/INFORME-QA-FRONTEND.md) — auditoría de frontend/UX (jun-2026).
- [smoke/CHECKLIST.md](../tests/smoke/CHECKLIST.md) — smoke test manual.
- [qa-externo/](../tests/qa-externo/) — guías para testers externos.
- [COMO-CORRER.md](../tests/COMO-CORRER.md) — cómo correr las pruebas.

## 🗃️ _archivo/ — Histórico (no vigente)

Documentos superados de fases anteriores (abr–jun 2026), conservados solo como
referencia histórica. **No usar como fuente de verdad** — el estado actual está en
`INFORME-FINAL.md`.
