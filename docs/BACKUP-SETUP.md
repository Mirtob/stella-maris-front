# Backup de Supabase — Setup

> Hay dos rutas: oficial Pro (USD $25/mes, recomendado) o casero gratuito (script Node).
> Tiempo estimado: **30 minutos** (Pro) o **45 minutos** (casero).

## Opción A — Plan Pro de Supabase (recomendado)

**Por qué:**
- Point-in-Time Recovery (PITR) hasta los últimos 7 días.
- Backup automático diario sin que vos hagas nada.
- Restore con un click desde el dashboard.
- **USD $25/mes**, justificado al primer incidente real.

### Pasos

1. Andá a **https://supabase.com/dashboard/project/szoaiiipglebpewwzfgh/settings/billing**.
2. Click en **Upgrade to Pro**.
3. Cargar tarjeta de crédito.
4. Una vez en Pro:
   - Settings → **Database → Backups**
   - Activar **Point-in-Time Recovery**
   - Configurar retention: **7 días** (el máximo del plan).

### Verificación (test de restore)

> ⚠️ Hacé este test la primera vez para confirmar que el backup funciona. Después no.

1. Crear una fila de prueba en `published_cantorals` con `parish_name='TEST-BACKUP'`.
2. Esperar 1 hora.
3. Borrar la fila.
4. Esperar 10 min más.
5. **Database → Backups → Restore** a un punto previo al borrado.
6. Verificar que la fila vuelve a aparecer.

---

## Opción B — Script Node casero (gratis)

**Por qué:**
- No requiere upgrade a Pro.
- Corre por cron / GitHub Actions.
- Limitación: backup completo (no PITR), restore manual con SQL.

### 1. Crear el script de backup

Ya está incluido en el repo: `scripts/supabase-backup.mjs`.

### 2. Configurar GitHub Actions

`.github/workflows/backup.yml` corre diariamente:
- Descarga dump de todas las tablas
- Encripta con GPG
- Sube a GitHub Releases (privado)

Requiere agregar estos secrets en GitHub:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (de Supabase Settings → API)
- `BACKUP_GPG_PASSPHRASE` (cualquier string fuerte)

### 3. Restore manual

El backup es un **JSON comprimido y encriptado**: `backup-<fecha-hora>.json.gz.gpg`
(el tag del release es `backup-AAAA-MM-DD-HHMM`).

```bash
# Descargar el último backup (ver el tag exacto en GitHub -> Releases)
gh release download backup-2026-06-10-0300 -p '*.json.gz.gpg'

# Desencriptar (pide la BACKUP_GPG_PASSPHRASE)
gpg --decrypt backup-2026-06-10-0300.json.gz.gpg > backup.json.gz

# Descomprimir
gunzip backup.json.gz   # -> backup.json
```

`backup.json` tiene la forma `{ timestamp, supabase_url, tables: { <tabla>: [filas...] }, storage }`.
**No es un dump SQL** — es JSON por tabla. Para restaurar, reinsertá las filas por tabla
(en orden: `admins`, `songs`, `user_profiles`, `published_cantorals`, `cantoral_songs`) con la
SERVICE_ROLE_KEY vía REST/SDK, o convertilas a `INSERT`s.

---

## Comparación

| Aspecto | Pro de Supabase | Script casero |
|---|---|---|
| Costo | USD $25/mes | $0 |
| Automatizado | ✅ | ✅ (vía Actions) |
| Granularidad | Cada minuto (PITR) | Diario |
| Restore | 1 click | Manual con SQL |
| Confiabilidad | Alta | Media (depende de Actions) |
| Setup | 5 min | 30 min |
| Esfuerzo continuo | 0 | Revisar logs ocasionalmente |

## Recomendación

Para los **primeros 100 usuarios**: opción casera (B). Es suficiente.
A partir de **100 usuarios activos**: pasá a Pro (A) — el costo es trivial frente al riesgo.

---

## Política de retención

- **Backups diarios** los últimos 30 días.
- **Backups semanales** los últimos 6 meses.
- **Backups mensuales** los últimos 2 años.

Esto te cubre ante:
- Errores humanos (borrar mal algo)
- Bugs de software que corrompan datos
- Ataques de ransomware (raro pero posible)

Borrá backups más viejos que 2 años para cumplir con la **Ley 19.628** (no conservar datos personales más allá del propósito original).
