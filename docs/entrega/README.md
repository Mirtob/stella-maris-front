# Entrega — Cierre de marcha blanca (Stella Maris)

Carpeta con los documentos de cierre y traspaso. Orden sugerido de lectura:

1. **[INFORME-FINAL-STAKEHOLDERS.md](INFORME-FINAL-STAKEHOLDERS.md)** — informe de
   entrega a los stakeholders (qué se entregó, estado, costos, riesgos, roadmap). *Borrador a completar.*
2. **[PLAN-DE-PRUEBAS-FINAL.md](PLAN-DE-PRUEBAS-FINAL.md)** — plan de pruebas detallado
   (backend + frontend) para validar antes del cierre.
3. **[BACKUP-Y-RESTAURACION.md](BACKUP-Y-RESTAURACION.md)** — respaldo local (este PC) y
   cómo levantar la app desde otro computador. Script: `scripts/backup-local.ps1`.
3b. **[LEVANTAR-LA-APP-PASO-A-PASO.md](LEVANTAR-LA-APP-PASO-A-PASO.md)** — runbook
   detallado para poner la app a funcionar en un computador nuevo (desarrollo local y
   producción desde cero), con solución de problemas.
4. **[MANUAL-ADMINISTRADOR-CRITICO.md](MANUAL-ADMINISTRADOR-CRITICO.md)** — info crítica
   para futuros administradores: servicios, credenciales (inventario) y operación.
5. **[CREDENCIALES.PLANTILLA.md](CREDENCIALES.PLANTILLA.md)** — plantilla de credenciales.
   Copiar a `CREDENCIALES.local.md` (gitignored) o a un gestor de contraseñas; **no** versionar valores reales.

Documentos relacionados existentes:
- `docs/BACKUP-SETUP.md` — backup de Supabase (Pro/PITR o script).
- `docs/RECOVERY-PROCEDURE.md` — recuperación de cuentas de usuario.
- `docs/manuales/MANUAL-CANAL-Y-CONTENIDO.md` — carga de videos y partituras.
- `tests/PLAN-QA-DIARIO.md` y `tests/INFORME.md` — QA diario y corridas registradas.
