# CHECKLIST.md — Clasificación: automatizable vs. manual

> Resultado del análisis de T16. Cada caso del CHECKLIST.md original fue clasificado en una de tres categorías:
>
> - **AUTO** — se puede automatizar con Playwright headless. Cubierto por `tests/pwa/smoke-headless.mjs`.
> - **MAN-OAUTH** — requiere login real con Google OAuth. Google bloquea cuentas reales accedidas por automated browsers. Intrínsecamente manual.
> - **MAN-DEVICE** — requiere hardware del celular (cámara QR, botón Volver Android, Web Share, etc.). Intrínsecamente manual.

## Resumen

| Categoría | Cantidad | Estado |
|-----------|----------|--------|
| **AUTO**          | 7  | ✅ Verificado headless el 2026-06-11 — todos OK |
| **MAN-OAUTH**     | 56 | ⏳ Pendiente — usuario en celular |
| **MAN-DEVICE**    | 7  | ⏳ Pendiente — usuario en celular |
| **YA VERIFICADO** | 1  | ✅ T15 cubrió H7 (PWA installable) |

## Detalle por sección

### A. Autenticación
| ID | Categoría | Motivo |
|---|---|---|
| A1 | AUTO | Login page render — no requiere OAuth |
| A2 | MAN-OAUTH | Redirige a `accounts.google.com` |
| A3 | MAN-OAUTH | Iniciar sesión admin |
| A4 | MAN-OAUTH | Verifica post-login del admin |
| A5 | MAN-OAUTH | Verifica sidebar del admin logueado |
| A6 | MAN-OAUTH | Logout requiere estar logueado |
| A7 | MAN-OAUTH | Cerrar sesión Google requiere sesión |

### B. Setup de Coro / Pueblo fiel
**Todos MAN-OAUTH** — requieren login con cuenta secundaria.

### C. Armado de Cantoral (Coro)
**Todos MAN-OAUTH** — requieren Coro logueado.

### D. Publicación + QR
**Todos MAN-OAUTH** — requieren Coro logueado.

### E. Deep link / QR
| ID | Categoría | Motivo |
|---|---|---|
| E1 | MAN-DEVICE | Escanear con cámara del celular |
| E2 | AUTO | Navegar a `/c/{uuid}` y verificar estado |
| E3 | MAN-OAUTH | Descargar PDF requiere sesión |
| E4 | MAN-OAUTH | "Ver en la app" requiere sesión |
| E5 | MAN-OAUTH | Flujo desde dispositivo sin sesión + OAuth completo |
| E6 | AUTO | URL malformada `/c/hack` — guard del cliente |

### F. Pueblo fiel
**Todos MAN-OAUTH** — requieren Pueblo fiel logueado.

### G. Panel Admin
**Todos MAN-OAUTH** — requieren admin logueado.

### H. Mobile-specific
| ID | Categoría | Motivo |
|---|---|---|
| H1 | MAN-OAUTH | Sidebar requiere sesión |
| H2 | MAN-DEVICE | Tecla Volver Android — no hay equivalente headless |
| H3 | MAN-OAUTH | Toasts requieren acción post-login |
| H4 | MAN-OAUTH | Modales requieren acción post-login |
| H5 | MAN-OAUTH | QR dialog requiere publicación |
| H6 | MAN-DEVICE | Zoom PDF requiere visor nativo del celular |
| H7 | YA VERIFICADO | `check-prod.mjs` validó manifest + íconos + SW |
| H8 | AUTO | Dark mode toggle público |

### I. Errores y resiliencia
| ID | Categoría | Motivo |
|---|---|---|
| I1 | AUTO | Banner offline con `setOffline(true)` |
| I2 | MAN-OAUTH | Publicar requiere Coro logueado |
| I3 | AUTO | Reconectar con `setOffline(false)` |
| I4 | MAN-OAUTH | Forzar logout en otra pestaña requiere sesión |
| I5 | YA VERIFICADO | El botón Gemini fue removido y los tests confirman su ausencia |

## Por qué OAuth no se puede automatizar

Google detecta sesiones de Playwright/Selenium/Puppeteer y las bloquea con:
- "This browser or app may not be secure"
- Captcha permanente
- "Couldn't sign you in" sin redirect de retorno

Workarounds que NO usamos por riesgo:
- Service account con cuenta especial — viola TOS de Google
- Token Supabase pre-fabricado — requiere exponer la `service_role_key` en el test runner, peligroso
- Mock del provider — no testea el flujo real, valor reducido

Conclusión: los 56 casos MAN-OAUTH **deben** validarse en celular real por el usuario o un QA con sesión humana. No hay forma segura de automatizarlos sin filtrar credenciales.

## Reporte de la corrida AUTO (2026-06-11)

```
[OK] A1 — Login muestra botón Google
[OK] E2 — Deep link válido manejado (login=true, deeplink=false, path=/c/)
[OK] E6 — /c/hack ignorada, app sana sin errores JS
[OK] H7 — Delegado a check-prod.mjs (manifest válido + íconos correctos + SW registrable)
[OK] H8 — Dark mode toggle funciona (dark: false → true) + persiste tras reload
[OK] I1 — Banner "sin conexión" aparece offline
[OK] I3 — Banner offline desaparece al reconectar

Resumen: 7 OK · 0 WARN · 0 FAIL
```

Reportes JSON en `tests/pwa/output/smoke-headless-*.json`.

## Cómo correr los AUTO de nuevo

```bash
node tests/pwa/check-prod.mjs            # T15 — manifest + iconos + SW + meta tags
node tests/pwa/smoke-headless.mjs        # T16 AUTO — login render, deep link guards, dark mode, offline banner
```

Pasarles `[URL]` como primer arg para apuntarlos a preview de Vercel.
