# Plan — Tutorial en vivo (tour guiado por perfil)

> **Estado (2026-06-20):** **F1 implementada** (commit ee77a24) — motor `src/components/tour/`
> (`Tour.tsx` + `tours.ts`) + tour de **Pueblo fiel** + auto-disparo por rol. **F2 (Coro), F3
> (Admin + botón "Ver tutorial"), F4 (tips contextuales)** pendientes. Decisiones 1–4 confirmadas.

> Tour interactivo dentro de la app para **usuarios primerizos**: resalta los
> elementos reales de la interfaz y enseña el **flujo natural de cada perfil**
> (Pueblo fiel, Coro, Admin/Canal).

## Estado actual (sobre qué se construye)
- Ya existe `components/common/Onboarding.tsx` (3 slides de bienvenida, **antes** de elegir perfil,
  una vez por dispositivo vía `stella_maris_onboarding_seen`). **Se mantiene** como bienvenida general.
- **Lo nuevo** arranca *después*: ya dentro de la app, con el rol elegido, guía por las pantallas reales.
- No existe aún ningún motor de coachmarks/tour.

## Enfoque (decisiones por defecto)
- **Motor propio, sin dependencias** (recomendado): overlay con spotlight + tooltip, controlado por
  nosotros. Evita sumar librería (driver.js/shepherd) y problemas de CSP/bundle. Control total.
- **Disparo:** automático la **primera vez por rol** + botón **"Ver tutorial"** para repetir cuando
  quieran. Persistencia en `localStorage` por rol (`tour_seen_<rol>`); opcional a futuro: columna en
  `user_profiles` para que sea cross-device.
- **Alcance del guiado:** mayormente sobre la **pantalla principal de cada rol** (resaltar las acciones
  clave ahí) + **tips contextuales puntuales** en pantallas profundas (constructor, Modo Atril). Se
  evita un tour que "maneje" entre muchas pantallas (frágil); cada paso **se salta solo si su elemento
  no está** en pantalla.

## Arquitectura
- `TourProvider` (context) + `useTour()` para iniciar/saltar/avanzar.
- **Modelo de paso:** `{ id, target?: data-tour-id, title, body, placement, role }`. Sin `target` =
  tarjeta centrada (intro/cierre).
- **`TourOverlay`:** fondo atenuado con "recorte" (spotlight) sobre el elemento objetivo +
  tooltip con título, texto, progreso (puntos) y controles **Anterior / Siguiente / Saltar / Listo**.
  `scrollIntoView` del objetivo; reposiciona en resize; **ESC = saltar**; foco al tooltip (a11y).
- **Targets:** se agregan atributos `data-tour="..."` a los elementos reales (menú, ítems de sidebar,
  "Modo Atril", "Escuchar cantos", tarjetas de categoría, CTA publicar, tarjetas del panel admin, etc.).
- **Guiones por rol:** `puebloFielTour`, `coroTour`, `adminTour` (arreglos de pasos), en `src/components/tour/`.

## Guiones (flujo natural por perfil)

**Pueblo fiel** (la mayoría; el más simple)
1. Bienvenida (centrado).
2. "Aquí ves las **Misas de tu parroquia**" (lista de cantorales).
3. "Toca una Misa para ver sus cantos."
4. Botón **🎧 Escuchar cantos** (modo radio).
5. **Ver Ordinario / letra** del momento.
6. **Campana** de notificaciones (cuando el coro publica algo nuevo).
7. **Menú** (cambiar parroquia/capilla, modo oscuro). Cierre.

**Coro** (el más completo)
1. Bienvenida.
2. **Selector de celebración** (Misa normal / oficios de Semana Santa).
3. **Categorías por momento** — "agrega un canto a cada momento de la Misa."
4. **Sugerencias litúrgicas** (según el tiempo).
5. **CTA Publicar Cantoral**.
6. **🎼 Modo Atril** (para leer/tocar durante la Misa).
7. **Menú:** Mis Cantorales, Historial, Banco de Partituras, Calendario, Cursos. Cierre.

**Admin / Canal**
1. Bienvenida.
2. Tarjetas del panel: **Sincronizar YouTube**, Gestión de Cantos/Usuarios/Parroquias, **Cuentas
   usuario/clave**, Recuperación.
3. Recordatorio: subir videos con metadata + sincronizar (enlace al **Manual del Canal**). Cierre.

## Consideraciones técnicas
- **Robustez:** si el target de un paso no existe (p. ej. sidebar cerrada), el paso se **omite** o el
  tour **abre primero** ese contenedor; nunca se queda pegado.
- **Responsive/móvil:** tooltip que cabe en pantalla chica, spotlight con padding, `scrollIntoView`.
- **No interferir** con login / ProfileSetup / selector de parroquia: el tour solo inicia en la vista
  principal con rol ya elegido.
- **Accesibilidad:** ESC para saltar, foco gestionado, `aria-live`, botones grandes.
- **i18n:** tuteo chileno (consistente con el resto).
- **Rendimiento:** `tour/` con lazy-load; no pesa en el arranque.
- **Reinicio:** opción "Ver tutorial de nuevo" (menú/ajustes) que limpia `tour_seen_<rol>`.

## Fases
- **F1 (~1.5–2 d):** motor del tour (overlay spotlight + modelo de pasos + `data-tour` base) + **tour Pueblo fiel**.
- **F2 (~0.5–1 d):** **tour Coro**.
- **F3 (~0.5 d):** **tour Admin/Canal** + botón "Ver tutorial" para repetir.
- **F4 (~0.5–1 d):** tips contextuales (constructor, Modo Atril) + reinicio en ajustes; métricas opcionales.
- **Total ~3–4 días.**

## Decisiones a confirmar
1. **Motor propio** (sin dependencia) vs. librería (driver.js). *Recom.: propio.*
2. **Disparo automático** por rol la primera vez + botón para repetir. *Recom.: sí.*
3. **Alcance por pantalla principal** + tips puntuales (vs. tour que navega entre pantallas). *Recom.: por pantalla.*
4. **Persistencia:** solo `localStorage` ahora (cross-device más adelante). *Recom.: localStorage.*

## Verificación
- Las pantallas guiadas están tras login → la prueba real es en dispositivo (móvil + escritorio).
- Cada fase queda funcional por separado (se puede liberar el tour de Pueblo fiel solo).
