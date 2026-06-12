# Informe de Pruebas de Humo — 2026-06-12

**Commit:** `3031385` (main) · **Entorno:** build de producción servido localmente
(`vite preview` → `http://127.0.0.1:4173`) + backend en vivo (Supabase + Vercel `/api`).
**Ejecutado por:** suite automatizada del repo (`tests/`), headless.

> Nota: el smoke de UI se corrió contra el **build local** (no requiere OAuth ni el
> deploy de Vercel). El de integración se corrió contra el **backend de producción
> actual** (las migraciones `20260612_*` todavía NO están aplicadas).

---

## Resumen ejecutivo

| Suite | Comando | Resultado |
|---|---|---|
| Build | `vite build` | ✅ OK (19.8 s) |
| Smoke UI headless | `node tests/pwa/smoke-headless.mjs http://127.0.0.1:4173` | ✅ **7/7 OK**, 0 WARN, 0 FAIL |
| Integración backend | `node tests/integration/run-all.mjs` | ✅ **17/17 PASS** |
| Accesibilidad (axe) | `node tests/qa/axe-audit.mjs http://127.0.0.1:4173` | ✅ **0 violaciones** (3 pantallas) |
| Tour visual | `node tests/qa/visual-tour.mjs http://127.0.0.1:4173` | ✅ **0 hallazgos** (P0–P3) |

**Veredicto:** la app pasa el smoke completo. Se corrigió 1 aserción de test
desactualizada (no era bug de la app). 3 observaciones para seguimiento (abajo).

---

## 1. Smoke UI headless (`tests/pwa/smoke-headless.mjs`)

Cubre los casos del CHECKLIST que NO requieren login OAuth.

| Caso | Descripción | Estado |
|---|---|---|
| A1 | Login muestra botón Google | ✅ |
| E2 | Deep link válido `/c/{uuid}` se maneja (va a login + guarda id) | ✅ |
| E6 | Deep link malformado `/c/hack` → pantalla NotFound, sin crash, 0 errores JS | ✅ |
| H7 | PWA instalable (manifest + íconos + SW) — delegado a `check-prod.mjs` | ✅ |
| H8 | Toggle dark mode funciona y persiste tras reload | ✅ |
| I1 | Banner "sin conexión" aparece offline | ✅ |
| I3 | Banner offline desaparece al reconectar | ✅ |

### Hallazgo corregido — E6 (test desactualizado, NO bug)
En la primera corrida E6 dio **FAIL**. Investigado: `/c/hack` ahora renderiza
correctamente la pantalla **"Este link de cantoral no es válido"** (NotFound),
sin crash y con **0 errores JS**. La aserción del test era **vieja**: esperaba el
comportamiento previo ("va a login en silencio"), anterior a la feature de
NotFound/`classifyPath` (commit `a6b15d7`). Se **actualizó la aserción** de E6 para
aceptar la pantalla NotFound y se agregó un guard explícito de crash de ErrorBoundary
("Algo salió mal"). Re-corrida: **7/7 OK**.

Reporte JSON: `tests/pwa/output/smoke-headless-2026-06-12T15-04-50.json`

---

## 2. Integración backend (`tests/integration/run-all.mjs`) — 17/17 PASS

Valida RLS, RPC, Storage policies y CORS contra el backend en vivo (anon key).

- **RLS:** `published_cantorals` SELECT devuelve solo published; INSERT sin auth
  bloqueado; DELETE de `songs` sin admin bloqueado.
- **RPC:** `is_admin()` devuelve FALSE para anon; `search_songs` accesible y con
  todos los filtros (momento/temporada/instrumento/texto/combinado).
- **Storage:** UPLOAD anon bloqueado por policy; path traversal rechazado;
  LIST público accesible (ver observación #2).
- **Vercel `/api`:** `/api/sheets` ejecuta; CORS NO permite `evil.example.com`;
  `/api/pdf` valida el formato del id.

Log completo: `tests/output/integration_2026-06-12_smoke.log`

---

## 3. Accesibilidad (axe) — 0 violaciones

| Pantalla | Passes | Violations | Incomplete |
|---|---|---|---|
| login | 28 | 0 | 1 |
| deeplink-valid | 28 | 0 | 1 |
| deeplink-bad | 22 | 0 | 1 |

("Incomplete" = axe no pudo determinar automáticamente; no es violación.)
Reporte: `tests/qa/screenshots/_axe-findings.json`

## 4. Tour visual — 0 hallazgos (P0–P3)

Screenshots regeneradas en `tests/qa/screenshots/` (desktop, iPhone 13, Pixel 7):
home-login, deeplink-valid, deeplink-bad, deeplink-empty, random-404.
Reporte: `tests/qa/screenshots/_findings.json`

---

## Observaciones / seguimiento

1. **Drive responde 404 en `/api/sheets`.** La función serverless funciona, pero
   Google Drive devuelve 404 → revisar `VITE_GOOGLE_DRIVE_API_KEY` /
   `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER` en Vercel. **Relevante** para la feature
   nueva de partituras embebidas en el PDF del Coro (depende de `/api/pdf` + Drive):
   si la API key está mal, las partituras no cargarán.

2. **La migración pendiente `20260612_storage_fn_private.sql` cambia el LIST del
   bucket.** Hoy el test "LIST bucket accesible (read público)" PASA porque existe
   la policy `cantorales_pdf_public_read`. Esa migración la **elimina** (fix del
   linter `public_bucket_allows_listing`). Tras aplicarla, el listado anon dejará de
   funcionar (el acceso por URL pública sigue OK). → **Actualizar ese test** para
   afirmar que el listado queda denegado (es el comportamiento deseado).

3. **Catálogo de cantos casi vacío.** `search_songs` devuelve 0–1 resultados en la
   mayoría de filtros (solo "sin filtros" y "momento=entrada" dan 1). Es estado de
   datos, no un bug — a tener en cuenta al probar flujos que dependen de cantos.

---

## Cobertura y límites

- **Cubierto (headless):** login UI, deep links (válido/inválido), NotFound, dark
  mode + persistencia, banner offline, PWA, y todo el backend (RLS/RPC/Storage/CORS).
- **NO cubierto (requiere humano):** los ~60 casos del `CHECKLIST.md` detrás de login
  con Google OAuth real (Google bloquea browsers automatizados). Esos siguen siendo
  manuales desde un celular real — ver `tests/smoke/CHECKLIST.md`.
- **Pendiente manual:** `tests/sql/checks.sql` en el SQL Editor de Supabase.
