# Plan de implementación — Modo Atril

> Atril digital para músicos del coro: repertorio del domingo en orden litúrgico,
> lectura a pantalla completa, autoscroll, zoom, transpositor, metrónomo y afinador.
> Se implementa por **fases** (A→D), con build + commit + deploy por fase.

## Decisiones por defecto (acotan "hacer todo")
- **Perfil:** Atril **completo** para **Coro/Admin** (acordes, transpositor, metrónomo, afinador). Para **Pueblo fiel**, versión *lite* (letra + autoscroll + zoom; sin acordes/afinador). Punto de entrada: botón **"Modo Atril"** en `ChoirView` y en el cantoral publicado (`CantoralWithOrdinary`).
- **Fuente del repertorio:** el cantoral (publicado o borrador), ordenado por momento con `getOrdinaryForCantoral` (ya existe).
- **BPM del metrónomo:** **tap-tempo** dentro del atril (sin migración). Opcional a futuro: columna `bpm` en `songs`.
- **Afinador:** se incluye (Fase D), requiere habilitar micrófono en `Permissions-Policy`.

## Reutilización (ya existe en el código)
- Transposición: `utils/chordTranspose.ts` (`transposeContent`, `getTransposedKey`, `formatTransposition`).
- Letra con acordes: `components/songs/LyricsWithChords.tsx`; letra sola: `LyricsOnly.tsx`.
- Pantalla encendida: `hooks/useWakeLock.ts`.
- Orden litúrgico: `data/massOrdinaryVariants.ts` (`getOrdinaryForCantoral`).

---

## Fase A — Núcleo del atril  (esfuerzo ~1–1.5 d)
Componente nuevo `components/atril/AtrilMode.tsx` (+ `AtrilSidebar.tsx`).
- **Shell:** sidebar izquierda (repertorio en orden litúrgico, clic carga el canto) + panel de lectura.
- **Lectura:** `LyricsWithChords` (Coro/Guitarra) con controles de **transposición** (reusar) y tonalidad mostrada; `LyricsOnly` para Pueblo fiel/Órgano.
- **Modo concentración:** estado `focus` → oculta sidebar/menús (CSS). Botón **"Salir"** + tecla **ESC** (keydown, escritorio) + `requestFullscreen()` donde el navegador lo soporte (caveat iOS: la PWA instalada ya es sin barras).
- **Zoom [A+]/[A-]:** estado `fontScale` aplicado al panel (botones grandes).
- **Wake lock:** activo mientras el atril está abierto.
- **Entrega:** ~70% del valor. Sin dependencias de hardware.

## Fase B — Autoscroll  (esfuerzo ~0.5 d)
- Motor con `requestAnimationFrame` que desplaza el panel de lectura.
- **Slider táctil** de velocidad (0 = apagado … N). Botón play/pausa.
- **Pausa al tocar/arrastrar** y reanuda; se reinicia al cambiar de canto.
- Mantener wake lock activo.

## Fase C — Metrónomo  (esfuerzo ~1 d)
- **BPM:** tap-tempo (botón "Tap") + selector de compás (4/4, 3/4, 2/4).
- **Motor de tiempo:** `AudioContext` para timing preciso (mejor que `setInterval`).
- **Salidas (3, según dispositivo):**
  - **Háptico:** `navigator.vibrate` — patrón fuerte en tiempo fuerte, suave en débiles. *Solo Android* (iOS no soporta Vibration API).
  - **Audio:** click sintetizado (Web Audio) — alternativa que **sí funciona en iPhone**.
  - **Visual:** parpadeo dorado sutil en cada pulso.
- Detección de soporte: si no hay vibración, usar audio+visual.

## Fase D — Afinador sacro  (mini-proyecto, esfuerzo ~1.5–2 d)
Componente aislado `components/atril/Tuner.tsx` (lazy-load).
- **Bloqueador (config):** cambiar en `vercel.json` la `Permissions-Policy` de `microphone=()` a **`microphone=(self)`** (habilita micro solo en nuestro origen). Documentar en `SEGURIDAD-SECRETOS.md`.
- **Captura:** `getUserMedia({audio})` + `AnalyserNode`.
- **Detección de pitch:** autocorrelación (YIN/ACF) → frecuencia → nota + desviación en cents (aguja).
- **Afinación base:** selector **440 Hz / 432 Hz** (órgano de Maipo) — escala la referencia.
- **Instrumentos transpositores:** selector (Concierto/Guitarra, Trompeta B♭, Saxo E♭, Corno F…) → aplica offset de semitonos al **nombre mostrado** (la matemática es trivial; lo difícil es la detección fiable).
- **Riesgos:** precisión con ruido ambiente; **`getUserMedia` en PWA instalada de iOS** es problemático → fallback claro ("Afinador no disponible / abre en Safari") y permiso denegado bien manejado.
- **Requiere prueba real en iPhone y Android** (no automatizable).

---

## Secuencia y verificación
- Implementar **A → B → C → D**, con `npm run build` + commit + push por fase.
- Las fases C (vibración) y D (micro/fullscreen) **se prueban en celulares reales** (iPhone + Android); no hay cobertura automatizada.
- Cada fase queda funcional por separado (el atril sirve desde la Fase A).

## Dependencias / notas
- Para que el atril luzca, el **catálogo necesita letras y acordes** poblados (relacionado con el catálogo casi vacío de la marcha blanca).
- Estimación total: **~4–5 días** de desarrollo + pruebas en dispositivos.
- Pendiente operativo de la Fase D: confirmar el cambio de `Permissions-Policy` (postura de seguridad: habilita el micrófono para toda la app en el mismo origen).
