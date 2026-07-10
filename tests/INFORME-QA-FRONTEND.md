# Informe de QA Frontend + UX/UI

> **Fecha:** 11 de junio de 2026
> **Alcance:** todo el código frontend de `src/`, todas las pantallas accesibles sin OAuth, accesibilidad, performance y consistencia UX.
> **Método:** auditoría estática (grep/inspección de código), visual tour automatizado (Playwright + screenshots), axe-core sobre 3 pantallas, análisis del bundle de Vite.

---

## Resumen ejecutivo

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| **P0 — Bloqueante** | 0 | — |
| **P1 — Alta**       | 4 | Fix hoy |
| **P2 — Media**      | 9 | Fix mañana |
| **P3 — Baja / pulido** | 7 | Sprint 2 |

**Conclusión:** sin bloqueantes para lanzamiento. Hay 4 issues de impacto real (logs sucios en prod, native `window.confirm`, logo PNG inflado, ConfirmDialog no usado donde corresponde) que arreglo hoy. El resto es pulido.

---

## P1 — Alta prioridad (4 issues)

### F1 — `console.log` ruidosos en producción
**Dónde:** `src/components/CategorySearch.tsx` (19 logs), `src/components/PublishedCantorals.tsx` (7), `src/components/ParishManager.tsx` (3), `src/services/supabase.ts` (18), `src/services/youtube.ts` (6), `src/config/api.ts` (5).

**Impacto:** Cualquier usuario con F12 abierto ve logs de debug del autocompletar de Misa, "Removiendo Santo existente", IDs de cantos, etc. Comprime el bundle algunos KB pero más importante: **fuga de información sobre internals**.

**Fix:** eliminar todos los `console.log` (mantener `console.error` que son legítimos para reportes de errores). Reemplazar por `if (import.meta.env.DEV) console.log(...)` solo si son útiles para desarrollo.

---

### F2 — `window.confirm()` nativo en lugar de `ConfirmDialog`
**Dónde:** `src/App.tsx:203` — "¿Salir y perderlos?" cuando el coro abandona un draft.

**Impacto:** `ConfirmDialog.tsx` existe y dice explícitamente *"Replaces window.confirm() for a consistent PWA / mobile-friendly UX"*. El uso del nativo rompe esa promesa. En iOS Safari el confirm nativo se ve "extraño" (estilo OS, no la app).

**Fix:** reemplazar el `window.confirm` por un state local + `<ConfirmDialog>`.

---

### F3 — Logo PNG de **1.2 MB** (1024×1024) descargado en cada primer load
**Dónde:** `src/assets/44767b9307cb7c59bba6fc5a03063ff51488551e.png`. Importado por 8 componentes (Login, LoadingScreen, Header, Sidebar, EmptyState, Home, ProfileSetup, Onboarding) y se muestra a tamaños entre 64px y 224px.

**Impacto:** todos los primeros usuarios descargan 1.2 MB innecesarios. En 4G lenta son 5-10 s de espera. **Lighthouse Performance baja varios puntos** por este asset.

**Fix:** generar el logo a 512×512 (~80 KB) o 384×384 (~50 KB). Usar el `scripts/resize-pwa-icons.mjs` que ya tenemos.

---

### F4 — Bug pre-existente: `aria-label` duplicado en `CategorySearch.tsx`
**Dónde:** `src/components/CategorySearch.tsx:475`. Vite avisa en cada build:
```
[plugin vite:esbuild] CategorySearch.tsx: Duplicate "aria-label" attribute in JSX element
```

**Impacto:** el segundo atributo es ignorado por React. El primero podría no ser el que queríamos.

**Fix:** dejar uno solo.

---

## P2 — Media (9 issues)

### V1 — Sin página 404
URLs como `/no-existe` caen a Login sin mensaje. Usuario confundido.
**Fix:** ruta catch-all que muestre "Esta página no existe" con botón "Volver al inicio".

### V2 — `/c/{uuid-inválido}` no muestra mensaje
Falla silenciosamente al Login. Si el QR estaba mal el usuario no se entera.
**Fix:** mostrar pantalla "Este link de cantoral no es válido o expiró".

### A1 — Accesibilidad: falta `<main>` en el shell
axe `landmark-one-main`. El contenido principal no está en un landmark.
**Fix:** envolver el render principal con `<main>`.

### A2 — Accesibilidad: falta `<h1>`
axe `page-has-heading-one`. La pantalla de Login tiene `<h2>` pero no `<h1>`.
**Fix:** convertir el "Stella Maris" / "Tu guía para la liturgia musical" en `<h1>`.

### A3 — Accesibilidad: contenido fuera de landmarks
axe `region`. ThemeToggle, OfflineBanner, MenuButton están afuera.
**Fix:** envolver en `<header>` o agregar `role="banner"`.

### B1 — Bundle 1.4 MB sin code splitting
Una sola entrada. Admin Dashboard, ParishManager, SongManager se descargan también para Pueblo fiel.
**Fix:** `React.lazy()` + `Suspense` para los routes admin.

### M1 — 6 modals NO usan `createPortal` ni `role="dialog"`
`AddSolemnityModal`, `DownloadPDFModal`, `PostPublishModal`, `PublishCantoralModal`, `SelectInstrumentModal`, `YouTubeSyncDialog`.

Riesgo de z-index issues, sin atajos de teclado, screen readers no los detectan como diálogos.
**Fix:** envolver en `<div role="dialog" aria-modal="true">` y considerar `createPortal` para los más complejos (PublishCantoralModal es el más crítico).

### M2 — Inputs sin `autoComplete` ni `<label htmlFor>`
`AddSolemnityModal`, `ParishManager` (varios), `LiturgicalCalendar`. Forms accesibles requieren label asociado.
**Fix:** agregar `id` + `<label htmlFor>` o `aria-label`.

### M3 — Botones-icono sin `aria-label`
Detectados en 10 componentes. El close (X) de `PublishCantoralModal:184`, el "+" de "Agregar solemnidad", varios botones de instrumento.
**Fix:** `aria-label="Cerrar modal"` etc.

---

## P3 — Pulido (7 issues)

### V3 — Deep link no avisa "venís de un QR"
El user llega a Login normal. UX confuso.
**Fix:** banner "Iniciá sesión para ver el cantoral que escaneaste."

### V4 — ThemeToggle podría chocar con MenuButton post-login
Ambos top-right, posiciones similares.
**Fix:** validar visualmente post-login (requiere OAuth).

### V5 — Layout suelto en desktop
Login centrado pequeño en 1440×900.
**Fix:** un `max-w` distinto en desktop con padding mayor.

### U1 — Mezcla amber vs purple como BG sin patrón consistente
Admin amber, Profile/Calendar purple, Login amber.
**Fix:** documentar la convención o unificar. Bajo impacto, pero genera ruido visual al navegar.

### U2 — pdf.js (414 KB) en bundle aunque solo se usa al ver PDFs
**Fix:** dynamic import en `PDFViewer.tsx`.

### B2 — Vite no advierte cuando el bundle supera 500 KB
El warning sí aparece, pero no hay `chunkSizeWarningLimit` configurado.
**Fix:** ajustar el límite o code split.

### T1 — `TODO` post-demo en producción
- `src/services/googleAuth.ts:157` — implementar /api/upload-song con service account
- `src/services/supabase.ts:25` — descomentar cuando @supabase/supabase-js esté instalado (YA está)
- `src/services/youtube.ts:347` — Implementar con YouTube API real
- `src/components/AdminUploadSong.tsx:22` — reactivar uploads desde la app

**Fix:** o ejecutar el TODO, o quitar el código asociado, o convertir en issue formal.

---

## Plan de fixes

### Hoy (P1)
- [ ] F1 — Limpiar `console.log` (CategorySearch + PublishedCantorals + ParishManager + supabase service)
- [ ] F2 — Reemplazar `window.confirm` por `<ConfirmDialog>` en App.tsx
- [ ] F3 — Re-generar logo a 512×512 con `resize-pwa-icons.mjs`
- [ ] F4 — Eliminar `aria-label` duplicado

### Mañana (P2)
- [ ] V1 + V2 — Página 404 + mensaje de deep link inválido
- [ ] A1 + A2 + A3 — Landmarks + h1 (Login + shell)
- [ ] B1 — Code splitting de las 3 vistas admin
- [ ] M1 — Modals primarios: role="dialog" + aria-modal
- [ ] M2 + M3 — Labels e inputs

### Sprint 2 (P3)
- [ ] V3 — Banner deep link
- [ ] U1 — Unificar paleta de BGs o documentar convención
- [ ] U2 — Lazy load pdf.js
- [ ] T1 — Limpiar TODOs

---

## Cómo se recorrió el código

```bash
# Visual tour: screenshots por pantalla y viewport
node tests/qa/visual-tour.mjs

# Accesibilidad con axe-core
node tests/qa/axe-audit.mjs

# Build para inspeccionar tamaños
npm run build
ls -lhS build/assets/*.js

# Greps específicos
# console.log -> 58 ocurrencias en 6 archivos
# window.confirm -> 1 (App.tsx)
# target="_blank" -> 4 (todos con rel="noopener" ok)
# createPortal -> 5 modales (de 11 totales)
# Inputs -> 27 + decenas en LiturgicalCalendar/ParishManager
```

Screenshots y reportes JSON en `tests/qa/screenshots/`.
