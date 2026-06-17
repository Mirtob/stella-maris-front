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
| QA-2 | **Catálogo casi vacío** (2 cantos). Riesgo #1 de marcha blanca. | P1 | Poblar catálogo (etiquetar videos + sync YouTube, Manual del Canal). | En `run-all.mjs`: WARN si `search_songs sin filtros` < umbral (ej. 30). |
| QA-3 | **5 respuestas 4xx intermitentes** en `/api/sheets` bajo carga (30×200, 5×4xx, 0×5xx). | P3 | Instrumentar: loguear el código/causa exacta de esos 4xx (¿403 Drive? ¿cuota?). | Ampliar `rate-limit.mjs` para registrar el desglose de status 4xx. |

---

## 6. Estado del último QA

**2026-06-17** — Build ✅ · Integración 17/17 ✅ · Smoke 7/7 ✅ · Rate-limit ✅ (QA-1 resuelto: 20×200 + 15×429) · Catálogo ⚠️ (QA-2, 2 cantos).
