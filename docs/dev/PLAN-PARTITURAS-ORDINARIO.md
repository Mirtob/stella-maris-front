# Plan — Partituras del ordinario en PDF y Modo Atril

> **Actualización (2026-06-20): cantorales/PDF separados por perfil.**
> - **Pueblo fiel** (`generateCantoralPDF`): letra SIN acordes + partituras del ordinario embebidas.
> - **Coro** (`generateChoirCantoralPDF`): letra de todos los cantos CON acordes, en orden de la Misa,
>   **sin** partituras embebidas (los callers ya no pasan `embedScores`).
> - **Modo Atril**: Coro = partitura de TODOS los cantos con `sheetMusicUrl` (fallback letra+acordes);
>   Pueblo fiel = partitura solo del ordinario. Repertorio ordenado por la Misa (`sortByMassOrder`).
> - Embebido de partituras compartido en `utils/embedPartitura.ts`. Efecto secundario: publicar
>   vuelve a ser rápido (ya no se renderizan PDFs al publicar).

> **Estado (2026-06-20): IMPLEMENTADO (F1–F4).**
> - **F1** `utils/ordinary.ts` (`ORDINARY_CATEGORIES` + `isOrdinary`) y `utils/ordinarySheetMusic.ts`
>   (`resolveOrdinarySheetMusic` con caché de `/api/sheets`, match por Misa+parte). Enganchado en
>   `CategorySearch` (`addSongEnriched`) para Kyrie/Gloria/Santo/Cordero/Padre Nuestro.
> - **F2** `choirCantoralPDFGenerator` admite `embedScores: boolean | 'ordinary'`; el PDF publicado
>   (App) usa `'ordinary'`; Full Score sigue en `true`.
> - **F3** `AtrilMode` muestra la partitura (vía `PDFViewer`) para el ordinario; oculta
>   zoom de fuente/transpositor/autoscroll de letra en ese modo; fallback a letra o aviso.
> - **F4** Pre-cache offline ya incluye las partituras del ordinario (itera `songs[].sheetMusicUrl`).
>   Sin migración SQL.

> **Objetivo:** al armar un cantoral, las partituras del **ordinario** (Kyrie, Gloria,
> Santo, Cordero de Dios) y del **Padre Nuestro** (si se va a cantar) deben quedar
> disponibles tanto en el **PDF** como en el **Modo Atril**, para que el coro cante
> esas partes desde la partitura (no desde letra/acordes).

## Decisiones confirmadas (usuario)
1. **PDF:** las partituras del ordinario + Padre Nuestro van **también en el PDF publicado (QR)**,
   no solo en el folleto Full Score descargable.
2. **Atril:** **solo partitura para el ordinario** — Kyrie/Gloria/Santo/Cordero/Padre Nuestro se
   muestran como partitura; el resto de los cantos sigue en letra/acordes (sin toggle).
3. **Origen:** si una parte del ordinario no tiene partitura vinculada, **buscar en Drive por
   nombre de la Misa** (mismo enfoque que ya usa el Padre Nuestro hoy).

## Estado actual (sobre qué se construye)
- `src/utils/choirCantoralPDFGenerator.ts` ya tiene `embedScores` (Sección 2): embebe las
  partituras (PDF de Drive → PDF.js → canvas → imagen A4) de **todos** los cantos con
  `sheetMusicUrl`, ordenadas por parte de la Misa. Se usa con `embedScores: true` en
  `CantoralPDFPreview` y `CantoralHistory`. El **PDF publicado** (`App.handlePublishCantoral`)
  hoy NO lo usa (va liviano).
- `src/components/common/PDFViewer.tsx`: visor reutilizable (PDF.js, scroll continuo, zoom,
  autoscroll, fallback offline). Usa `getDrivePdfProxyUrl(sheetMusicUrl)` → `/api/pdf?id=…`.
- `src/components/atril/AtrilMode.tsx`: hoy solo muestra `LyricsWithChords`/`LyricsOnly`.
  **No tiene visor de partituras** — es el grueso del trabajo nuevo.
- `src/components/songs/CategorySearch.tsx`: al agregar Kyrie auto-agrega Santo/Cordero/Gloria
  de la misma Misa; el Padre Nuestro sintético ya intenta resolver su partitura vía `/api/sheets`.
- `Song.sheetMusicUrl` se guarda dentro del JSON `songs` de `published_cantorals` → lo que
  enriquezcamos al armar fluye solo al PDF y al Atril. **No requiere migración SQL.**

## Arquitectura / piezas nuevas

### Constante única del ordinario
`ORDINARY_CATEGORIES = ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios', 'Padre Nuestro']`
en un util compartido (p. ej. `src/utils/ordinary.ts`) + helper `isOrdinary(song)`.
(Decidir si incluir 'Rito de Aspersión' — ver Consideraciones.)

### Resolución de partitura por Drive (fallback)
`src/utils/ordinarySheetMusic.ts`:
- `resolveOrdinarySheetMusic(song): Promise<Song>` — si `song` es del ordinario y NO tiene
  `sheetMusicUrl`, consulta `/api/sheets` (cacheado a nivel módulo) y hace match por
  `massName` + `category` (normalizando acentos/espacios, reutilizando la lógica del Padre
  Nuestro). Devuelve el `song` enriquecido (o igual si no hay match).
- Cache en memoria del listado de `/api/sheets` para no repetir la llamada al agregar varias
  partes seguidas.

## Fases

### Fase 1 — Resolución de partituras del ordinario (fundamento)
- Crear `ordinary.ts` (constante + `isOrdinary`) y `ordinarySheetMusic.ts` (resolver + cache).
- Enganchar en `CategorySearch`: al agregar una parte del ordinario (y las auto-agregadas
  Santo/Cordero/Gloria), enriquecer con `resolveOrdinarySheetMusic` antes de `onAddToCantoral`.
  Unificar el camino del Padre Nuestro con este helper.
- Resultado: el `Song` del ordinario queda con `sheetMusicUrl` resuelto y persiste en el cantoral.

### Fase 2 — PDF publicado con partituras del ordinario
- Generalizar la opción del generador: `embedScores?: boolean | 'ordinary'`.
  - `true` → embebe todos (comportamiento actual del Full Score).
  - `'ordinary'` → Sección 2 filtra a `ORDINARY_CATEGORIES` (ordinario + Padre Nuestro).
- `App.handlePublishCantoral` pasa `embedScores: 'ordinary'` al generar el PDF publicado del QR.
  Full Score sigue en `true`.
- Mantener el manejo best-effort (página de aviso si una partitura falla) ya existente.
- **Costo:** publicar será más lento (descarga/renderiza hasta ~5 PDFs). Aceptado por decisión 1.
  Mitigación: la resolución de Fase 1 evita misses; cota suave de páginas por si una partitura
  es enorme.

### Fase 3 — Modo Atril con partituras del ordinario
- En `AtrilMode`, si el canto activo `isOrdinary` y tiene `sheetMusicUrl`:
  renderizar la **partitura** en el panel de lectura (reutilizando `PDFViewer` con
  `getDrivePdfProxyUrl`), en lugar de la letra.
- Ocultar los controles propios de letra (transpositor, zoom de fuente) cuando se muestra
  partitura; `PDFViewer` ya trae su zoom + autoscroll. Se conserva la barra lateral de
  repertorio y el cambio de canto.
- **Fallback:** parte del ordinario sin partitura → mostrar su letra/acordes si existe; si no,
  aviso "partitura no disponible".

### Fase 4 — Robustez + QA
- Offline: `PDFViewer` ya cae a la copia cacheada; revisar que las partituras del ordinario
  entren al pre-cache del "Modo Misa offline" (`offlineCache`).
- Casos borde: Pascua con Rito de Aspersión (reemplaza Kyrie); Misa sin Gloria (Adviento/Cuaresma);
  ordinario agregado manualmente sin `massName`.
- Build + smoke de integración + checklist manual (publicar cantoral con Misa completa →
  verificar partituras en PDF publicado, Full Score y Atril).

## Consideraciones técnicas
- **Sin migración SQL:** `sheetMusicUrl` ya viaja en el JSON `songs`. Reusa `vigil`/esquema actual.
- **Rendimiento de publicación:** principal trade-off de la decisión 1. Medir el tiempo de
  publicación con una Misa completa; si se vuelve molesto, evaluar generar el PDF con partituras
  en segundo plano tras publicar (no bloqueante).
- **Match de Drive:** depende de nombres de archivo consistentes en la carpeta de partituras.
  Documentar la convención esperada en el Manual del Canal (p. ej. `Misa X - Santo.pdf`).
- **a11y / móvil:** el visor en Atril debe respetar áreas táctiles y `safe-area`.

## Fases entregables por separado
- F1 sola ya mejora datos (partituras resueltas) sin cambiar UI.
- F2 y F3 son independientes entre sí una vez hecha F1.

## Verificación
- Publicar un cantoral con Misa completa (Kyrie+Gloria+Santo+Cordero) + Padre Nuestro cantado:
  - PDF publicado (QR) incluye esas partituras.
  - Folleto Full Score las sigue incluyendo (todas).
  - Modo Atril muestra la partitura al pasar por esas partes; letra en los himnos.
- Caso sin partitura vinculada: la resolución por Drive la completa; si no existe en Drive,
  fallback correcto (letra o aviso).
