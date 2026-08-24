# Plan de QA diario — Marcha blanca

> Vigente desde **2026-06-17**, durante toda la marcha blanca.
> Objetivo: detectar regresiones temprano y convertir **cada corrección reportada
> por usuarios en una prueba de regresión permanente**.

App prod: https://stella-maris-front.vercel.app/ · Supabase: `szoaiiipglebpewwzfgh`

---

## 1. Rutina automatizada diaria (~5 min)

Correr **a hora de bajo tráfico** (madrugada), en este orden. Si uno falla, **no** seguir
hasta entender por qué.

```bash
# 1. Compila (atrapa errores de TS/imports tras merges del día)
npm run build

# 2. Backend: RLS, Storage, CORS, RPC  (necesita tests/.env)
node tests/integration/run-all.mjs

# 3. Frontend en producción: login, deep links, PWA, dark mode, offline
node tests/pwa/smoke-headless.mjs
```

Antes del paso 3, confirmar que **el deploy del día ya está en vivo** (si hubo push):
buscar en el bundle un marcador del último cambio, no fiarse del hash.

```bash
# Verifica que prod sirve el código nuevo (ej. cadena introducida hoy)
node -e "fetch('https://stella-maris-front.vercel.app/').then(r=>r.text()).then(h=>{const m=h.match(/assets\/index-[\w-]+\.js/)[0];return fetch('https://stella-maris-front.vercel.app/'+m)}).then(r=>r.text()).then(j=>console.log('marcador presente:', j.includes('TEXTO_DEL_FIX_DE_HOY')))"
```

Guardar las salidas en `tests/output/` y anotar PASS/FAIL del día en `tests/INFORME.md`.

### Criterio de corte
- **Cualquier FAIL en build / integración / smoke ⇒ se bloquea el día** hasta resolver.
- WARN ⇒ se registra y se evalúa (no bloquea salvo que escale).

---

## 2. Rutina semanal (o ante cambios de su área)

| Prueba | Cuándo | Cómo |
|---|---|---|
| `tests/sql/checks.sql` | 1×/sem o tras tocar migraciones/RLS | Pegar en SQL Editor de Supabase, revisar policies/índices/integridad |
| `tests/stress/rate-limit.mjs` | 1×/sem o tras tocar `api/*` | `node tests/stress/rate-limit.mjs` (60s; consume cuota — opt-in) |
| Smoke móvil real | 1×/sem | `tests/smoke/CHECKLIST.md` desde un celular con login Google real |

---

## 3. Métricas a vigilar cada día (salud de marcha blanca)

- **Tamaño del catálogo** — `search_songs sin filtros`. Hoy = **2 cantos** (crítico: casi vacío).
- **Errores en Sentry** — nuevos issues desde ayer (frontend y serverless).
- **Cantorales publicados** — que `published_cantorals` crezca y solo exponga `published` a anon.
- **5xx / 4xx en `/api/*`** — picos indican fallo de función o de cuota Google/Gemini.

---

## 4. Proceso: corrección de usuario → prueba de regresión

**Regla de oro: ningún fix se cierra sin su prueba.** Cada reporte de la marcha blanca
sigue este flujo:

1. **Registrar** el reporte (qué hizo el usuario, qué esperaba, qué pasó, rol, dispositivo).
2. **Triage por severidad:**
   | Sev | Definición | Respuesta |
   |---|---|---|
   | **P0** | Caída, pérdida de datos, fuga de RLS, login roto | Fix + deploy el mismo día |
   | **P1** | Función clave inutilizable (publicar cantoral, reproducir) | ≤ 48 h |
   | **P2** | Bug molesto con workaround | Siguiente ciclo |
   | **P3** | Cosmético / copy (ej. voseo) | Batch |
3. **Reproducir** y escribir primero la prueba que **falla** (rojo).
4. **Corregir** hasta que la prueba pase (verde).
5. **Anclar la prueba** en la suite correcta según el tipo:
   | Tipo de bug | Dónde se agrega la prueba |
   |---|---|
   | RLS / permisos / RPC / Storage | `tests/integration/run-all.mjs` |
   | Endpoint serverless (`api/*`) | `tests/integration/run-all.mjs` (sección Vercel) |
   | Flujo sin login (deep link, PWA, login, offline, dark) | `tests/pwa/smoke-headless.mjs` |
   | Esquema / policy / índice / integridad de datos | `tests/sql/checks.sql` |
   | Datos de catálogo / diócesis / calendario | check de integridad en `run-all.mjs` |
   | Copy / i18n (voseo→tuteo) | barrido `grep` documentado + revisión visual |
   | Flujo con login Google | `tests/smoke/CHECKLIST.md` (manual) |
6. **Commit** del fix + la prueba juntos. La prueba queda en la rutina diaria para siempre.

### Plantilla de caso (pegar en `tests/INFORME.md`)
```
[ID]  AAAA-MM-DD  Sev: P_   Rol: Pueblo/Coro/Canal   Disp: ___
Reporte:   ...
Esperado:  ...
Causa:     ...
Fix:       commit ____
Prueba:    archivo + nombre del caso
Estado:    abierto / en review / cerrado
```

---

## 5. Backlog de correcciones detectadas por el QA (pendientes + su prueba)

| # | Hallazgo | Sev | Acción | Prueba a agregar |
|---|---|---|---|---|
| ~~QA-1~~ ✅ | **Rate limit no enforce en serverless** — `const hits = new Map()` por instancia. | P2 | **RESUELTO 2026-06-17**: limiter distribuido vía RPC `api_rate_limit` (Supabase, migración `20260617`), fail-open al de memoria. Verificado en prod: 20×200 + 15×429. | ✅ `rate-limit.mjs` ahora usa cache-buster y **gate de regresión** (exit 1 si no hay 429 o hay 5xx). |
| ~~QA-2~~ ✅ | **Catálogo casi vacío** (2 cantos). Riesgo #1 de marcha blanca. | P1 | **RESUELTO 2026-08-23**: el catálogo tiene **52 cantos** (umbral del plan: 30). | ✅ `run-all.mjs` reporta el conteo de `search_songs sin filtros` en cada corrida. |
| ~~QA-3~~ ✅ | **5 respuestas 4xx intermitentes** en `/api/sheets` bajo carga. | P3 | **RESUELTO 2026-08-23**: eran el recorrido secuencial del Drive rozando el tope de 10 s de la función (8,3 s medidos). Paralelizado a tandas de 8 → 2,5-3,4 s. La corrida del 23-ago dio **0×4xx y 0×5xx**. | ✅ `rate-limit.mjs` ya desglosa `other4xx` / `server5xx`. |
| ~~QA-5~~ ✅ | **Publicar no estaba atado a la parroquia**: un coro de la parroquia A podía publicar un cantoral —o agregar una celebración— en la parroquia B. | P2 | **RESUELTO 2026-08-24**: migración `20260824_scope_por_parroquia.sql` aplicada. Verificado en los dos sentidos: publica en su parroquia y en su capilla (201), no en la ajena (403). Ojo: la parroquia es autodeclarada, así que es una baranda, no un muro. | ✅ `tests/security/parroquia-ajena.mjs` (**6/0**) + §12 de `tests/sql/checks.sql`, que además lista los coros que la política dejaría fuera. |
| ~~QA-4~~ ✅ | **Publicar no exigía rol** (`cantorals_insert`): cualquier cuenta publicaba un cantoral visible para todos. Comprobado en producción el 23-ago. | **P1** | **RESUELTO 2026-08-23**: migración `20260823_publish_requires_choir.sql` aplicada. Verificado en los dos sentidos: Pueblo fiel bloqueado (403), Coro publica igual que siempre (201). | ✅ `tests/security/escalada.mjs` (16/0) + §11 de `tests/sql/checks.sql`. |

---

## 6. Estado del último QA

**2026-06-17** — Build ✅ · Integración 17/17 ✅ · Smoke 7/7 ✅ · Rate-limit ✅ (QA-1 resuelto: 20×200 + 15×429) · Catálogo ⚠️ (QA-2, 2 cantos).

**2026-06-19 (backend)** — Build ✅ · Integración 17/17 ✅ · Endpoints auth/admin sanos (admin-users→401, recover-password→404) · Tabla custom_parishes ✅ · Rate-limit distribuido ✅ (ráfaga 20×200+5×429; el test espaciado da 0×429 por ventana fija al correr seguido, no es fallo real) · Catálogo ⚠️ (QA-2, 2 cantos).

**2026-08-23 (cierre de la versión 1)** — Build ✅ · Unitarias 294/294 ✅ · Integración 17/17 ✅ ·
Smoke headless 7/7 ✅ · PWA 18 OK/1 WARN intencional ✅ · Estrés 0×5xx ✅ · Humo por pantalla
(12 vistas × 3 roles + 9 subpaneles admin + 9 rutas públicas) sin errores de JS ✅ ·
Accesibilidad 0 violaciones graves ✅ · Auto-ataque **16 bloqueos / 0 escaladas** ✅ (QA-4 cerrado
con la migración aplicada) · Catálogo 52 cantos ✅.
Detalle completo en `tests/INFORME.md`.

### Rutina nueva desde este cierre

```bash
node tests/security/escalada.mjs          # opt-in: crea y borra una cuenta desechable
node tests/security/parroquia-ajena.mjs   # opt-in: publicar fuera de la parroquia
```

Correrlas **tras cualquier cambio de políticas RLS o de roles**. Es la única prueba que
cubre las RLS con una sesión real; el resto de la suite solo ve lo que ve un anónimo.
