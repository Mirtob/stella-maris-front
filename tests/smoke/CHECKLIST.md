# Smoke Test — Caja Negra

**Duración estimada:** 30–45 min  
**Requiere:** celular real (Android/iOS) conectado al dominio de producción, conexión a internet, cuenta de Google del admin y al menos una cuenta secundaria para Coro / Pueblo fiel.

Marcar cada caso `[ ]` → `[x]` solo si pasa en el celular. Si falla, anotar el detalle en `INFORME.md > Hallazgos`.

---

## A. Autenticación

- [ ] **A1.** Abrir el dominio en celular nuevo (sin cookies). Aparece pantalla de login con botón Google.
- [ ] **A2.** Tocar Google. Redirige a `accounts.google.com`.
- [ ] **A3.** Iniciar sesión con cuenta admin (`gustavus.tobar@gmail.com`). Vuelve a la app.
- [ ] **A4.** **Admin NO ve el dialog de selección de parroquia** — entra directo al inicio.
- [ ] **A5.** Sidebar muestra rol "Admin" y NO muestra parroquia.
- [ ] **A6.** Logout (icon en sidebar). Aparece dialog para elegir perfil/parroquia.
- [ ] **A7.** Tocar "Cerrar sesión de Google". Vuelve al login (cuenta deslogueada).

## B. Setup de Coro / Pueblo fiel

- [ ] **B1.** Login con cuenta secundaria. Aparece `ProfileSetup`.
- [ ] **B2.** Elegir rol "Coro" → seleccionar diócesis → marcar 2 parroquias → elegir instrumento "Guitarra" → "Continuar".
- [ ] **B3.** Aparece `SelectActiveParishDialog` con las 2 parroquias.
- [ ] **B4.** Elegir parroquia A. La app aterriza en el inicio del perfil Coro.
- [ ] **B5.** Logout → vuelve a abrir el dialog → muestra badge "Último uso" sobre Coro + parroquia A.
- [ ] **B6.** Elegir Pueblo fiel + parroquia B → entra al inicio de Pueblo fiel.

## C. Armado de Cantoral (Coro)

- [ ] **C1.** En inicio del Coro, las **sugerencias litúrgicas aparecen solo si hay cantos en Supabase**. Si la tabla `songs` está vacía, no se renderiza nada.
- [ ] **C2.** **No hay botón "Sugerir cantos con IA"** en pantalla.
- [ ] **C3.** Buscar "comunion" (sin tilde) en categoría Comunión → encuentra "Comunión..."
- [ ] **C4.** Buscar "kyrie" en Kyrie → encuentra "Kyrie Eleison"
- [ ] **C5.** Agregar un Kyrie con `massName` (ej. Misa Criolla). Aparece dialog "Agregar Misa completa".
- [ ] **C6.** Aceptar → se agregan automáticamente Santo + Cordero + Gloria del mismo autor.
- [ ] **C7.** Repetir: agregar Kyrie desde **sugerencias** (no desde búsqueda). Toast "Misa <X> agregada · + Santo, Cordero, Gloria".
- [ ] **C8.** El cantoral en preview tiene **un solo cantoral** (no se arma "aparte"). Contador en barra sticky muestra el total correcto.
- [ ] **C9.** Quitar un canto con el botón rojo (siempre visible, no solo en hover).
- [ ] **C10.** Cambiar a otra vista (ej. Calendario). Aparece `confirm()` "¿Salir y perderlos?". Cancelar.

## D. Publicación + QR

- [ ] **D1.** Tocar "Publicar Cantoral". Modal aparece con backdrop oscuro.
- [ ] **D2.** Tocar fuera del modal → cierra (a menos que esté en estado "publicando").
- [ ] **D3.** Completar fecha + tiempo litúrgico + hora. Botón "Publicar" verde.
- [ ] **D4.** Mientras el teclado virtual está abierto, el botón "Publicar" sigue visible.
- [ ] **D5.** Tocar "Publicar". El botón muestra "Publicando..." con spinner.
- [ ] **D6.** Tras éxito: toast "¡Cantoral publicado! 🎵" y aparece dialog QR.
- [ ] **D7.** El QR se renderiza correctamente.
- [ ] **D8.** Botón verde "Descargar PDF del cantoral" — al tocar, abre el PDF en visor nativo.
- [ ] **D9.** "Compartir" abre Web Share API del celular.
- [ ] **D10.** Cerrar QR. Cantoral aparece en la lista de publicados con `pdfUrl`.

## E. Deep link / QR de otro dispositivo

- [ ] **E1.** Escanear el QR con la cámara del celular (otra cuenta logueada).
- [ ] **E2.** Abre `/c/{uuid}` y muestra "Cantoral disponible" con 2 opciones.
- [ ] **E3.** Tocar "Descargar PDF" → abre el PDF.
- [ ] **E4.** Volver atrás. Tocar "Ver en la app" → navega a cantorales publicados.
- [ ] **E5.** Escanear desde un dispositivo SIN sesión → manda a login, tras login vuelve a la pantalla del deep link.
- [ ] **E6.** Probar URL manipulada `/c/hack` (no UUID) → la app la ignora, no crashea.

## F. Pueblo fiel

- [ ] **F1.** Login como Pueblo fiel parroquia X. Ver lista filtrada a parroquia X.
- [ ] **F2.** **NO ver** sugerencias de IA / Gemini.
- [ ] **F3.** Tocar un cantoral → expande → tocar un canto → abre player.
- [ ] **F4.** Reproductor YouTube embebido funciona.
- [ ] **F5.** Letra con acordes legible. En pantalla pequeña, altura máxima es ~50% del viewport.
- [ ] **F6.** Cantoral nuevo publicado por Coro de parroquia X → notificación toast "¡Nuevo cantoral publicado!"
- [ ] **F7.** **NO** llegan notificaciones de cantorales de parroquia Y.

## G. Panel Admin

- [ ] **G1.** Como admin → Sidebar muestra "Panel Admin".
- [ ] **G2.** Gestión de Usuarios — muestra lista de usuarios reales (los que se loguearon). Búsqueda con/sin acentos funciona.
- [ ] **G3.** Cambiar rol de un usuario con el dropdown → toast "Rol actualizado".
- [ ] **G4.** Refrescar → el cambio persiste.
- [ ] **G5.** Eliminar perfil → ConfirmDialog → desaparece de la lista.
- [ ] **G6.** Gestión de Parroquias — panel verde "Parroquias activas" muestra conteos de usuarios y cantorales.
- [ ] **G7.** Gestión de Cantos — lista cantos de Supabase. Búsqueda con acentos funciona. Botón "Eliminar" con ConfirmDialog.
- [ ] **G8.** Sincronizar YouTube — botón "Sincronizar ahora". Si el canal está poblado, agrega nuevos a Supabase.
- [ ] **G9.** Admin puede ver y borrar cantorales de **TODAS** las parroquias (sin filtro).

## H. Mobile-specific

- [ ] **H1.** Sidebar cierra al tocar el backdrop oscuro.
- [ ] **H2.** Sidebar cierra al tocar tecla Volver del Android.
- [ ] **H3.** Toasts aparecen en la **parte inferior** (no tapados por el menú).
- [ ] **H4.** Modales cierran al tocar fuera (excepto durante publicación activa).
- [ ] **H5.** Botón Cerrar (X) del QR dialog es tocable sin overlap con el QR.
- [ ] **H6.** Zoom de PDF tiene botones grandes (≥40px).
- [ ] **H7.** PWA installable (botón "Agregar a inicio" en menú del browser).
- [ ] **H8.** Modo oscuro toggle funciona y persiste.

## I. Errores y resiliencia

- [ ] **I1.** Apagar WiFi mientras se está en la app. Barra roja "Sin conexión" aparece.
- [ ] **I2.** Intentar publicar sin conexión → toast "Sin conexión a internet."
- [ ] **I3.** Reconectar → la barra desaparece sola.
- [ ] **I4.** Forzar logout en otra pestaña (Supabase) → al publicar muestra "Sesión expirada" y manda al login.
- [ ] **I5.** Si Gemini estuviera todavía (no debería estar): después de 12s mostraría timeout. (En realidad ya removimos el botón, debería NO existir.)
