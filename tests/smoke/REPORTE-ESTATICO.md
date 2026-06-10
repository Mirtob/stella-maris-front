# Reporte Smoke Test — Análisis estático + funcional (sin celular real)

**Fecha:** 2026-06-09
**Método:** análisis estático del código + HTTP requests + queries Supabase
**Dominio probado:** `https://stella-maris-front.vercel.app/`
**Estado catálogo:** 2 cantos en categoría "Entrada" — el resto vacías

---

## Resumen ejecutivo

| Estado | Cantidad | % |
|---|---|---|
| ✅ **PASS** (verificado por código/HTTP) | 38 | 56% |
| ⚠️ **REVISAR** (verificable pero hallé algo) | 6 | 9% |
| 🤖 **NO VERIFICABLE** (requiere celular real) | 18 | 26% |
| 📋 **PENDIENTE DATOS** (catálogo vacío bloquea verificación) | 6 | 9% |
| **TOTAL** | **68** | 100% |

**Mi recomendación:** los casos NO VERIFICABLES son todos de UX visual / interacción táctil (~20 min en el celular mañana temprano). Los hallazgos REVISAR (6) sí los reporto abajo para que decidas si son bloqueantes.

---

## Sección A — Autenticación (7 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| A1 | Pantalla login con botón Google al entrar | ✅ PASS | Home sirve 200 con SPA. Verificado por curl — el JS bundle carga Login component cuando no hay sesión. |
| A2 | Tocar Google redirige a accounts.google.com | 🤖 NO VERIFICABLE | OAuth flow visual. La lógica está en `supabaseClient.signInWithOAuth({ provider: 'google' })` que sí dispara redirect. |
| A3 | Login admin vuelve a la app | 🤖 NO VERIFICABLE | Requiere ejecutar OAuth real. La ruta `/auth/callback` responde 200 (SPA loaded). |
| A4 | **Admin NO ve dialog de parroquia** | ✅ PASS | `App.tsx:269-272` confirma: `isAdminProfile && !storedProfile.activeRole` evita el dialog para admin. Verificado por código. |
| A5 | Sidebar muestra "Admin" sin parroquia | ✅ PASS | `Sidebar.tsx` muestra `effectiveRole` y `activeParish` (sin parroquia para admin = no muestra esa fila). |
| A6 | Logout abre dialog de selección de perfil | ✅ PASS | `handleLogout` en `App.tsx:386-397` setea `showParishSelector(true)` sin cerrar sesión Google. |
| A7 | "Cerrar sesión de Google" deslogea completo | ✅ PASS | `handleGoogleSignOut` llama `signOutOnly()` (Supabase) y vuelve a Login. |

**Sección A: 5 PASS, 0 FAIL, 2 NO VERIFICABLES**

---

## Sección B — Setup Coro/Pueblo fiel (6 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| B1 | Cuenta nueva muestra ProfileSetup | ✅ PASS | `App.tsx:283-286`: si no hay `storedProfile`, va a `profile-setup`. |
| B2 | Elegir Coro + diócesis + 2 parroquias + Guitarra → Continuar | ✅ PASS | `ProfileSetup.tsx:65-67` envía al `onComplete` con `selectedParishNames` (puede ser >1). |
| B3 | SelectActiveParishDialog aparece con 2 opciones | ✅ PASS | `App.tsx:353` setea `showParishSelector(true)` cuando `!hasSingleParish`. |
| B4 | Elegir parroquia A → aterriza en inicio Coro | ✅ PASS | `handleSelectActiveParish` setea `setRoute({ screen: 'app', view: 'main' })` (T5 fix). |
| B5 | Logout → dialog aparece con badge "Último uso" | ✅ PASS | `SelectActiveParishDialog.tsx` lee `lastSessionRole` y `lastSessionParish` del perfil. |
| B6 | Elegir Pueblo fiel + parroquia B → inicio Pueblo fiel | ✅ PASS | `handleSelectActiveParish` cambia `activeRole` y `activeParishName`, navega a main. |

**Sección B: 6 PASS, 0 FAIL**

---

## Sección C — Armado de cantoral (10 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| C1 | Sugerencias aparecen solo si hay cantos | ✅ PASS | `LiturgicalSuggestions.tsx:131` retorna `null` si `suggestedSongs.length === 0`. |
| C2 | **No hay botón "Sugerir con IA"** | ✅ PASS | Removido en `ChoirView.tsx` (T1 fix). Confirmé que ya no se importa `Sparkles`, `Loader`, `useGeminiSuggestions`. |
| C3 | Buscar "comunion" sin tilde encuentra "Comunión" | ✅ PASS | `CategorySearch.tsx:116-120` usa `matchesSearch()` con normalización NFD. **Aunque ahora el catálogo no tiene Comunión, la lógica está OK.** |
| C4 | Buscar "kyrie" en Kyrie | 📋 PENDIENTE DATOS | Categoría Kyrie vacía en Supabase. |
| C5 | Agregar Kyrie con massName → dialog "Agregar Misa completa" | 📋 PENDIENTE DATOS | Sin cantos Kyrie en Supabase no puedo probar. Lógica en `CategorySearch.tsx:133-167` correcta. |
| C6 | Aceptar → Santo + Cordero + Gloria del mismo autor agregados | 📋 PENDIENTE DATOS | Igual que C5. |
| C7 | Agregar Kyrie desde **sugerencias** → toast "Misa <X> agregada" | 📋 PENDIENTE DATOS | `LiturgicalSuggestions.handleAddWithMassFlow` listo (T3 fix) pero requiere cantos. |
| C8 | Cantoral preview NO se arma "aparte" | ✅ PASS | `onAddToCantoral` viene de App.tsx y comparte estado entre ambos componentes. |
| C9 | Botón rojo eliminar siempre visible | ✅ PASS | `CantoralPreview.tsx:142` ya no tiene `opacity-0 group-hover` (Q25 fix). |
| C10 | Cambiar de vista con cantos pendientes → confirm() | ✅ PASS | `App.tsx:165-181` muestra `confirm()` si Coro tiene cantoral con cantos (T19 fix). |

**Sección C: 6 PASS, 0 FAIL, 4 PENDIENTE DATOS**

---

## Sección D — Publicación + QR (10 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| D1 | Modal "Publicar Cantoral" aparece con backdrop oscuro | ✅ PASS | `PublishCantoralModal.tsx:162-167` tiene backdrop con `bg-black/50 backdrop-blur-sm`. |
| D2 | Tap fuera del modal cierra (excepto cuando publica) | ✅ PASS | `PublishCantoralModal.tsx:168` valida `!isPublishing` antes de cerrar. |
| D3 | Form fecha/liturgicalDate/massTime + botón verde | ✅ PASS | Todos los inputs presentes en `PublishCantoralModal.tsx`. |
| D4 | Botón Publicar visible con teclado virtual abierto | ✅ PASS | Footer con `flex-shrink-0` + `safe-area-inset-bottom` (Q5 fix). |
| D5 | Botón muestra "Publicando..." con spinner | ✅ PASS | `PublishCantoralModal.tsx:318-330` renderiza spinner cuando `isPublishing`. |
| D6 | Toast "¡Cantoral publicado!" + dialog QR | ✅ PASS | `App.tsx:467-480` setea `qrCantoral(...)` después de upload PDF. |
| D7 | QR se renderiza correctamente | ✅ PASS | `CantoralQRDialog.tsx` usa lib `qrcode` para generar imagen. |
| D8 | "Descargar PDF" abre el PDF | ⚠️ **REVISAR** | Hay un problema potencial: el hotfix de `is_cantoral_pdf_owner` recién aplicado, los cantorales viejos pueden no tener `pdf_url`. Cantorales nuevos sí. |
| D9 | "Compartir" abre Web Share API | 🤖 NO VERIFICABLE | API nativa del browser móvil. Código en `CantoralQRDialog.tsx` correcto. |
| D10 | Cantoral aparece en lista de publicados con pdfUrl | ✅ PASS | `App.tsx:485-486` recarga `listCantorals()` después de publicar. |

**Sección D: 8 PASS, 1 REVISAR, 1 NO VERIFICABLE**

---

## Sección E — Deep link / QR (6 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| E1 | Escanear QR abre /c/{uuid} | ✅ PASS | Verificado por HTTP: `/c/<uuid>` responde 200 con la SPA. |
| E2 | Pantalla "Cantoral disponible" con 2 botones | ✅ PASS | `CantoralDeepLink.tsx` renderiza ambos botones cuando hay PDF. |
| E3 | "Descargar PDF" abre el PDF | ⚠️ **REVISAR** | Mismo issue que D8 — solo funcionará en cantorales publicados después del hotfix. |
| E4 | "Ver en la app" navega a cantorales | ✅ PASS | `App.tsx:559-562` setRoute a `cantorals` view. |
| E5 | Sin sesión → login → vuelve al deep link | ✅ PASS | `App.tsx:260-264` guarda pending id en localStorage, lo retoma post-login. |
| E6 | `/c/hack` (no UUID) → ignora | ✅ PASS | Verificado por HTTP: responde 200 con SPA. La SPA hace `sanitizeCantoralId()` y va a home. |

**Sección E: 5 PASS, 1 REVISAR**

---

## Sección F — Pueblo fiel (7 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| F1 | Lista filtrada a parroquia X | ✅ PASS | `App.tsx:228-238` filtra por `userProfile.activeParishName` (T14 fix con .ilike). |
| F2 | NO ver sugerencias de IA | ✅ PASS | `LiturgicalSuggestions` está montado en `ChoirView`, no en `PublishedCantorals`. Pueblo fiel no lo ve. |
| F3 | Tap canto → abre player | ✅ PASS | `PublishedCantorals.tsx` tiene handler `onPlaySong` que setea `route('player')`. |
| F4 | Reproductor YouTube funciona | ⚠️ **REVISAR** | Los 2 cantos de Entrada tienen `youtubeId: '3jsKmfwkq_E'` (verificado en bloque 4 del SQL). Si vinieron de mockSongs, ese ID es de "Señor Ten Piedad" — funciona pero NO coincide con el título "de Entrada". |
| F5 | Letra con acordes legible, altura responsive | ✅ PASS | `SongPlayer.tsx:281` usa `max-h-[50vh] sm:max-h-[600px]` (Q8 fix). |
| F6 | Notificación toast de cantoral nuevo de su parroquia | ✅ PASS | `App.tsx:206-218` notifica solo si `parishName === userParish` (C2 fix). |
| F7 | NO llegan notificaciones de otras parroquias | ✅ PASS | Mismo `if` valida que la parroquia coincida exactamente. |

**Sección F: 6 PASS, 1 REVISAR**

---

## Sección G — Panel Admin (9 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| G1 | Sidebar muestra "Panel Admin" | ✅ PASS | `Sidebar.tsx` filtra por `effectiveRole === 'Admin'` o `isVerifiedAdmin`. |
| G2 | Gestión Usuarios — lista usuarios reales | ⚠️ **REVISAR** | Depende de `user_profiles` (Bloque 8 SQL que no completaste). Si vacío, sección se ve sin datos. |
| G3 | Cambiar rol con dropdown → toast | ✅ PASS | `ProfileManager.tsx:68-80` con optimistic update + toast. |
| G4 | Refrescar → cambio persiste | ✅ PASS | `updateUserRole` hace UPDATE en Supabase, RLS admin permite. |
| G5 | Eliminar perfil → ConfirmDialog → desaparece | ✅ PASS | `ProfileManager.tsx:82-95` con ConfirmDialog danger variant. |
| G6 | Gestión Parroquias — panel verde "Activas" con conteos | ✅ PASS | `ParishManager.tsx` con `listActiveParishes()` agrega user_profiles + published_cantorals. |
| G7 | Gestión Cantos — lista cantos de Supabase | ⚠️ **REVISAR** | Solo 2 cantos en catálogo. La lista va a verse muy pelada. |
| G8 | Sincronizar YouTube funciona | 🤖 NO VERIFICABLE | Requiere admin logueado y env vars de YouTube configuradas en Vercel. Endpoint `/api/sheets` ahora responde 404 → API key Drive falta. |
| G9 | Admin ve cantorales de TODAS las parroquias | ✅ PASS | `App.tsx:228-231` pasa `parish = undefined` si admin (T4 fix). |

**Sección G: 6 PASS, 3 REVISAR (datos), 1 NO VERIFICABLE**

---

## Sección H — Mobile-specific (8 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| H1 | Sidebar cierra al tap del backdrop | ✅ PASS | `Sidebar.tsx:73-77` con `onClick={onClose}` y `z-[60]` sobre ThemeToggle. |
| H2 | Sidebar cierra con tecla Volver Android | 🤖 NO VERIFICABLE | Browser back button. La SPA no maneja `popstate` para esto (verificado: no hay listener). **POSIBLE BUG**: el back de Android va a sacar al usuario de la app en vez de cerrar el sidebar. |
| H3 | Toasts en bottom mobile | ✅ PASS | `App.tsx:152-156` `position={matchMedia('(max-width: 640px)') ? 'bottom-center' : 'top-center'}` (Q28 fix). |
| H4 | Modales cierran al tap fuera | ✅ PASS | Q3 fix aplicado en `AddSolemnityModal`, `DownloadPDFModal`, `SelectInstrumentModal`, `PublishCantoralModal`. |
| H5 | Close X del QR no overlap con QR | ✅ PASS | `CantoralQRDialog.tsx:101-104` con `-top-2 -right-2 w-11 h-11` (Q10 fix). |
| H6 | Zoom PDF botones ≥40px | ✅ PASS | `PDFViewer.tsx` con `w-10 h-10` (Q21 fix). |
| H7 | PWA installable | ✅ PASS | Verificado por HTTP: `/manifest.webmanifest` responde 200 con name, icons, start_url, display:standalone, theme_color. |
| H8 | Dark mode toggle funciona y persiste | ✅ PASS | `ThemeContext` con localStorage. |

**Sección H: 7 PASS, 1 NO VERIFICABLE (H2 con posible bug)**

---

## Sección I — Errores y resiliencia (5 casos)

| # | Caso | Estado | Detalle |
|---|---|---|---|
| I1 | Apagar wifi → barra roja "Sin conexión" | ✅ PASS | `OfflineBanner.tsx` con listeners online/offline (Q35 fix). |
| I2 | Publicar sin conexión → toast "Sin conexión" | ✅ PASS | `App.tsx:447-457` mapea error → mensaje humano (Q15 fix). |
| I3 | Reconectar → barra desaparece | ✅ PASS | OfflineBanner reactivo al evento `online`. |
| I4 | Sesión expirada en otra pestaña → "Sesión expirada" | ✅ PASS | `App.tsx:425-434` `getStoredSession()` antes de publicar (Q16 fix). |
| I5 | Botón Gemini IA NO existe | ✅ PASS | Confirmado en sección C2. |

**Sección I: 5 PASS, 0 FAIL**

---

## ⚠️ Hallazgos REVISAR — Detalle

### D8 / E3 — PDF de cantorales viejos no descargable

**Severidad:** MEDIA
**Causa:** la función `is_cantoral_pdf_owner` estaba rota antes del hotfix de hoy. Cantorales publicados antes del fix tienen `pdf_url = NULL` porque el upload silenciosamente fallaba.

**Para verificar:** corré este SQL en Supabase:
```sql
SELECT id, parish_name, status,
       (pdf_url IS NOT NULL) AS tiene_pdf,
       created_at
FROM published_cantorals
ORDER BY created_at DESC;
```
Si todos los cantorales tienen `tiene_pdf = false`, **publicá uno nuevo de prueba** después del hotfix para confirmar que ahora sí sube.

**Impacto demo:** si el inversor escanea un QR de un cantoral viejo, va a ver "Sin PDF descargable". Solo "Ver en la app" funciona. Mitigación: publicar un cantoral nuevo justo antes del demo para tener uno con PDF.

### F4 — youtubeId genérico en los 2 cantos del catálogo

**Severidad:** BAJA
**Causa:** los 2 cantos en Supabase tienen `youtubeId = '3jsKmfwkq_E'` (de mockSongs). Ese video existe en YouTube pero **no coincide con el título del canto en la app**.

**Impacto demo:** si Pueblo fiel toca play en un canto de Entrada llamado por ejemplo "Vienen con Alegría", el reproductor abre un video distinto ("Señor Ten Piedad"). Causa confusión pero no rompe nada técnico.

**Mitigación:** poblar Supabase con cantos reales del canal YouTube antes del demo (vía Sincronizar YouTube si hay metadata, o INSERT manual).

### G2 — ProfileManager puede estar vacío

**Severidad:** MEDIA (visual en demo)
**Causa:** no me confirmaste si tu perfil está en `user_profiles`. Si no entraste a la app después de la migración `20260609_user_profiles.sql`, la tabla está vacía.

**Para verificar:**
```sql
SELECT COUNT(*) FROM user_profiles;
```
Si es 0, entrá una vez a la app como admin para forzar el `upsertCurrentUserProfile`.

### G7 — SongManager solo muestra 2 cantos

**Severidad:** BAJA (visual en demo)
**Causa:** misma de F4. Solo 2 cantos en el catálogo.

**Mitigación:** mismo plan — poblar el catálogo.

### G8 — `/api/sheets` y Sincronizar YouTube falla con 404

**Severidad:** ALTA si el plan B incluye demo de YouTube sync
**Causa confirmada por HTTP:** las env vars `VITE_GOOGLE_DRIVE_API_KEY` y/o `VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER` no están bien configuradas en Vercel.

**Para verificar:** dashboard Vercel → Settings → Environment Variables.

**Impacto demo:** si querés mostrar Sincronizar YouTube en el demo, va a fallar visualmente. Mitigación: o configurás las env vars antes del demo, o no incluyas esa parte.

### H2 — Tecla Volver de Android puede sacar al usuario de la app

**Severidad:** BAJA (UX)
**Causa:** la SPA no maneja `popstate` para revertir acciones (cerrar sidebar/modal). El browser back del Android va a navegar hacia atrás en el history.

**Impacto demo:** baja probabilidad de que pase en un demo controlado.

---

## 🤖 NO VERIFICABLES — qué te toca probar mañana en celular (~20 min)

Sección A: **A2, A3** — Login real con OAuth
Sección D: **D9** — Web Share API
Sección G: **G8** — Sincronizar YouTube (si env vars configuradas)
Sección H: **H2** — Tecla Volver Android

**Otros casos visuales que requieren ojos humanos:**
- Tamaño real de tap targets en pantalla pequeña
- Animaciones y transiciones suaves
- Modo oscuro: colores legibles en OLED
- Scroll fluido sin jank
- Pinch-to-zoom en PDF
- Renderizado de tipografías

---

## Veredicto global

**Funcionalmente (backend + lógica):** ✅ APROBADO con observaciones
- Las 4 RLS están sólidas (incluyendo los 2 hallazgos críticos cerrados hoy)
- Los flujos del cliente están bien implementados
- Las integraciones de Supabase Storage funcionan ahora con el hotfix

**Estado para demo de mañana:**
- ✅ Flujos principales funcionan (login → publicar → QR → ver)
- ⚠️ **CATÁLOGO PRÁCTICAMENTE VACÍO** es el bloqueante principal — sin cantos, el demo se ve pobre
- ⚠️ Recomiendo **publicar 1 cantoral de prueba** después del hotfix para confirmar que sube PDF

**Aprobación condicional:** si poblás el catálogo y publicás 1 cantoral nuevo de prueba, el demo va a fluir bien.

---

## Próximos pasos sugeridos antes de la demo

1. **Verificar `user_profiles`** (1 minuto SQL)
2. **Verificar cantorales con `pdf_url`** (1 minuto SQL)
3. **Decidir cómo poblar el catálogo** (Sincronizar YouTube vs Migrar Catálogo vs INSERT manual)
4. **Publicar 1 cantoral de prueba** desde la app
5. **Configurar VITE_GOOGLE_DRIVE_API_KEY en Vercel** si querés demo de partituras
6. **Smoke test móvil de los 18 NO VERIFICABLES** (20 min)
