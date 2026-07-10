# Plan de Riesgos — Stella Maris

> Documento **actualizable**. Registro de riesgos del proyecto con probabilidad, impacto,
> severidad, mitigación y plan de contingencia. Revisar al menos **una vez al mes** y en
> cada hito (freeze, lanzamiento, migración de cuentas).
>
> - **Versión:** 1.0 · **Última actualización:** 2026-07-10

## Metodología

**Severidad = Probabilidad × Impacto.** Escalas:

- **Probabilidad:** Baja (poco probable) · Media (puede ocurrir) · Alta (probable).
- **Impacto:** Bajo · Medio · Alto · Crítico (amenaza la continuidad del proyecto).

| Prob \ Impacto | Bajo | Medio | Alto | Crítico |
|---|---|---|---|---|
| **Alta** | Media | Alta | Crítica | Crítica |
| **Media** | Baja | Media | Alta | Crítica |
| **Baja** | Baja | Baja | Media | Alta |

---

## Top 5 riesgos (atención prioritaria)

1. **R-16 — Cuentas atadas a correo personal** (Severidad **Alta**): perder ese acceso = perder control de todo.
2. **R-08 — Fuga de secretos / key expuesta** (Severidad **Crítica** si ocurre): rotación pendiente.
3. **R-05 — Pérdida de datos sin backup** (Severidad **Alta**): respaldar con disciplina.
4. **R-15 — Bus factor (un solo mantenedor)** (Severidad **Alta**): documentar y sumar 2º administrador.
5. **R-01 — Pausa de Supabase por inactividad** (Severidad **Alta**): plan de continuidad.

---

## Registro de riesgos

### A. Infraestructura y servicios

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-01 | Supabase (free) se pausa tras ~1 semana sin actividad | Media | Alto | **Alta** | Uso real; evaluar plan Pro; ping periódico | Reactivar proyecto (1 clic) o pasar a Pro |
| R-02 | Caída del proveedor (Vercel/Supabase) | Baja | Alto | Media | Proveedores con buen historial | Esperar recuperación; Pro da más garantías/SLA |
| R-03 | Superar límites de free tier (egress, storage, build) | Media | Medio | Media | Monitorear uso mensual | Subir de plan a tiempo |
| R-04 | Cuota de APIs Google (YouTube/Drive/Gemini) agotada o cuenta suspendida | Media | Alto | **Alta** | Keys restringidas; proxy; cuotas vigiladas | Solicitar aumento de cuota / 2º proyecto Cloud |

### B. Datos

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-05 | Pérdida de datos de la BD sin respaldo | Baja | Crítico | **Alta** | `scripts/backup-local.ps1` regular; Supabase Pro (PITR) | Restaurar desde el último backup |
| R-06 | Migración SQL mal aplicada o fuera de orden | Media | Alto | **Alta** | Aplicar en orden; `AUDITORIA-MIGRACIONES.md` | Corregir/revertir a mano el cambio |
| R-07 | Borrado accidental de PDFs en Storage | Baja | Medio | Baja | Policies de storage; backups | Regenerar/republicar el cantoral |

### C. Seguridad

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-08 | Fuga de secretos (service-role, API keys) | Media | Crítico | **Crítica** | Secretos server-only; `.gitignore`; key fuera del bundle (proxy) | **Rotar** claves de inmediato (pendiente: rotar key ya expuesta) |
| R-09 | Abuso de endpoints / bypass de rate limit | Baja | Medio | Baja | RPC `api_rate_limit` (fail-open controlado) | Ajustar límites; bloquear origen |
| R-10 | RLS mal configurada expone datos entre usuarios | Baja | Alto | Media | Patrón RLS probado; pruebas de integración RLS/RPC | Corregir policy y auditar accesos |

### D. Dependencias y técnico

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-11 | Dependencia sin fijar (`jspdf: "*"`) rompe el build al actualizar | Media | Medio | Media | **Fijar versión** antes del freeze | Volver al lock anterior |
| R-12 | Ruptura por versión de Node (local 24 vs Vercel) | Media | Medio | Media | Fijar Node en Vercel / `engines` | Alinear versiones y redeploy |
| R-13 | Bundle grande (>1.5 MB) → lentitud en móviles de gama baja | Media | Bajo | Baja | Code splitting / lazy load | Optimizar chunks |
| R-14 | Vulnerabilidad en dependencia | Media | Medio | Media | `npm audit` periódico | Actualizar/parchear la dependencia |

### E. Operación y personas

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-15 | Bus factor: un solo desarrollador/mantenedor | Media | Alto | **Alta** | Documentación ordenada; 2º admin; onboarding | Traspaso con la doc de `entrega/` |
| R-16 | Cuentas atadas al correo personal | Baja | Crítico | **Alta** | `MIGRACION-A-CUENTA-OFICIAL.md` (pasar a cuenta oficial) | Recuperación de cuenta del proveedor |
| R-17 | Catálogo de cantos/videos incompleto | Media | Medio | Media | Plan de grabación; sincronización YouTube | Priorizar contenido esencial |

### F. Legal y cumplimiento

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-18 | Derechos de autor de cantos/partituras/audio | Media | Alto | **Alta** | Contenido propio/licenciado/dominio público; atribuciones | Retirar contenido en disputa |
| R-19 | Datos personales de usuarios (Ley 19.628, privacidad) | Baja | Medio | Baja | Política de privacidad; mínimos datos | Ajustar tratamiento; borrar a solicitud |
| R-20 | Vercel Hobby en uso no personal (términos) | Baja | Medio | Baja | Pasar a Pro si se comercializa | Migrar de plan |

### G. Producto y adopción

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-21 | Baja adopción por parte de los coros | Media | Medio | Media | Onboarding, tutorial en vivo, manuales | Acompañamiento y capacitación |
| R-22 | Notificaciones no llegan (iOS sin PWA / Android batería) | Media | Bajo | Baja | Guías de activación; textos por dispositivo | Soporte puntual al usuario |

### H. Costos

| ID | Riesgo | Prob | Impacto | Sev. | Mitigación | Contingencia |
|---|---|---|---|---|---|---|
| R-23 | Escalada de costos al crecer (Vercel/Supabase/Gemini Pro) | Media | Medio | Media | Monitoreo de uso; presupuesto (ver informe presupuestario) | Ajustar planes/uso |

---

## Seguimiento

- **Cadencia de revisión:** mensual + en cada hito.
- **Próxima revisión sugerida:** al cerrar el freeze (~31-jul-2026), junto con el plan de pruebas.
- Riesgos cerrados o nuevos se anotan aquí con fecha.

Documentos relacionados: [INFORME-FINAL](../INFORME-FINAL.md) · [MANUAL-ADMINISTRADOR-CRITICO](MANUAL-ADMINISTRADOR-CRITICO.md) · [BACKUP-Y-RESTAURACION](BACKUP-Y-RESTAURACION.md) · [MIGRACION-A-CUENTA-OFICIAL](MIGRACION-A-CUENTA-OFICIAL.md).
