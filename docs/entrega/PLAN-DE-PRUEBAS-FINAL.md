# Plan de Pruebas Final — Stella Maris (Backend + Frontend)

> **Propósito:** validar de punta a punta la aplicación antes de cerrar la marcha
> blanca. Cubre backend (Supabase + funciones serverless de Vercel) y frontend
> (PWA: Pueblo fiel, Coro, Admin), seguridad, rendimiento, offline y accesibilidad.
>
> **Cómo usarlo:** cada caso tiene **pasos**, **resultado esperado** y una casilla de
> **estado** (☐ Pass / ☐ Fail / ☐ N/A). Anotar evidencia (captura, log) en los fallos.
> Los bloques automatizables apuntan a los scripts existentes en `tests/`.

| Campo | Valor |
|---|---|
| Versión probada (commit) | `git rev-parse --short HEAD` → `________` |
| Entorno | Producción (Vercel) + Supabase `szoaiiipglebpewwzfgh` |
| Fecha | `________` |
| Responsable | `________` |
| Dispositivos | `________` (al menos 1 Android real + 1 escritorio) |
| Resultado global | ☐ APROBADO ☐ APROBADO C/OBSERVACIONES ☐ RECHAZADO |

---

## 0. Criterios de aprobación

- **Bloqueante (P0):** rompe el flujo principal (login, ver cantoral, publicar, descargar PDF) o expone un secreto. **0 abiertos** para aprobar.
- **Alto (P1):** afecta un flujo importante de un perfil. ≤ 1 con workaround.
- **Medio/Bajo (P2/P3):** degradan UX o son cosméticos. Se documentan y no bloquean.

---

## 1. Preparación

1. Confirmar que el último commit está **desplegado en Vercel** (Deployments → Ready).
2. `tests/.env` con `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `PUBLIC_BASE_URL=https://stella-maris-front.vercel.app/`.
3. Tener a mano 3 cuentas de prueba: **Pueblo fiel**, **Coro**, **Admin**.
4. Limpiar `localStorage` del dispositivo de prueba para validar primer ingreso (onboarding/tour).

---

## 2. Backend — Supabase (automatizado + manual)

### 2.1 Suite automatizada (caja negra, anon key)
```bash
node tests/integration/run-all.mjs
```
| Caso | Esperado | Estado |
|---|---|---|
| SELECT `published_cantorals` solo `published` | RLS oculta borradores | ☐ |
| RPC `search_songs` accesible | Lista sin error | ☐ |
| `is_admin()` para anon | FALSE | ☐ |
| INSERT `published_cantorals` sin auth | Rechazado por RLS | ☐ |
| DELETE `songs` sin admin | Rechazado por RLS | ☐ |
| Storage `cantorales-pdf`: LIST anon | No enumera | ☐ |
| Storage: UPLOAD anon | Rechazado | ☐ |
| Storage: UPLOAD path traversal `../etc/passwd` | Rechazado | ☐ |
| `search_songs` (6 combinaciones de filtros) | Sin error | ☐ |

### 2.2 Verificaciones SQL (manual, SQL Editor)
Ejecutar `tests/sql/checks.sql` bloque por bloque.
| Check | Esperado | Estado |
|---|---|---|
| Tabla `admins` contiene al admin principal | 1 fila | ☐ |
| RLS activa en tablas críticas | `rowsecurity = true` | ☐ |
| Policies en `published_cantorals` | ≥ 4 | ☐ |
| Columna `vigil` en `published_cantorals` | existe (bool) | ☐ |
| Tabla `custom_parishes` existe | sí | ☐ |
| Índice único `published_cantorals_mass_uk` | presente | ☐ |
| Triggers `set_created_by` / `updated_at` | activos | ☐ |
| Función `api_rate_limit` (RPC) | existe | ☐ |
| Catálogo `songs` | > 0 filas | ☐ |

### 2.3 Funciones serverless (Vercel)
| Endpoint | Caso | Esperado | Estado |
|---|---|---|---|
| `/api/sheets` | Origin permitido | 200 + headers CORS + RateLimit | ☐ |
| `/api/sheets` | Origin `evil.example.com` | Sin `Access-Control-Allow-Origin` | ☐ |
| `/api/pdf?id=hack` | id inválido | 400 | ☐ |
| `/api/pdf?id=<real>` | partitura real de Drive | 200 `application/pdf` (`%PDF`) | ☐ |
| `/api/youtube` | proxy del canal | 200 con datos del canal | ☐ |
| `/api/suggest` | sugerencia litúrgica | 200 (o degradación si falta Gemini) | ☐ |
| `/api/admin-users` | sin sesión admin | 401/403 | ☐ |
| `/api/recover-password` | email válido | 200 y correo enviado (Resend) | ☐ |
| Todas | No exponen `x-vercel-error: FUNCTION_INVOCATION_FAILED` | OK | ☐ |

### 2.4 Rate limiting (estrés controlado)
```bash
node tests/stress/rate-limit.mjs
```
| Métrica | Esperado | Estado |
|---|---|---|
| ~20 × 200 OK, resto 429 | Límite distribuido (RPC `api_rate_limit`) | ☐ |
| 5xx | 0 | ☐ |
| Headers `X-RateLimit-*` | Presentes | ☐ |

---

## 3. Frontend — Autenticación e ingreso

| # | Caso | Pasos | Esperado | Estado |
|---|---|---|---|---|
| A1 | Login Google | Iniciar con cuenta Google | Entra y carga perfil | ☐ |
| A2 | Login usuario/clave | Cuenta creada por admin | Entra con email sintético | ☐ |
| A3 | Cambio de clave | Ajustes → cambiar clave | Clave actualizada | ☐ |
| A4 | Recuperación self-service | "Olvidé mi clave" → email | Llega correo (Resend) y restablece | ☐ |
| A5 | Recuperación por admin | Ver `docs/RECOVERY-PROCEDURE.md` | Admin reasigna acceso | ☐ |
| A6 | Sesión cross-device | Entrar en tablet ya configurada | NO vuelve a pedir preferencias | ☐ |
| A7 | Logout | Cerrar sesión | Vuelve a login, sugiere rol/parroquia previa | ☐ |

---

## 4. Frontend — Onboarding y perfil

| # | Caso | Esperado | Estado |
|---|---|---|---|
| B1 | Onboarding (3 slides) primera vez | Aparece una vez por dispositivo | ☐ |
| B2 | ProfileSetup: elegir rol (Coro/Pueblo fiel) | Solo esos 2 roles elegibles | ☐ |
| B3 | Selección de parroquia(s) + diócesis | Permite multi-parroquia | ☐ |
| B4 | Email de respaldo (no admin) | Se guarda en Supabase | ☐ |
| B5 | Instrumento (Coro) | Guitarra/Órgano persistido | ☐ |
| B6 | Selector de parroquia activa | Cambia cantorales mostrados | ☐ |

---

## 5. Frontend — Pueblo fiel

| # | Caso | Esperado | Estado |
|---|---|---|---|
| C1 | Lista de Misas de la parroquia | Cantorales próximos visibles | ☐ |
| C2 | Misa vespertina | Aparece bajo el sábado con badge 🕯️ + celebración del domingo | ☐ |
| C3 | Escuchar cantos (radio) | Reproduce todos en orden | ☐ |
| C4 | Ver Cantos / letra | Letra **sin acordes** | ☐ |
| C5 | Ver Ordinario | Guía de la Misa por momentos + posturas | ☐ |
| C6 | Ordinario en **Latín** | Toggle Español/Latín; textos y respuestas en latín (sin tildes) | ☐ |
| C7 | Descargar PDF | Letra sin acordes + **partituras del ordinario** al final | ☐ |
| C8 | Modo Atril | **NO** disponible para Pueblo fiel | ☐ |
| C9 | Campana de notificaciones | Avisa cantoral nuevo | ☐ |
| C10 | Deep link / QR | Abre el cantoral correcto | ☐ |

---

## 6. Frontend — Coro

| # | Caso | Esperado | Estado |
|---|---|---|---|
| D1 | Selector de celebración | En Cuaresma/Semana Santa ofrece oficios del Triduo | ☐ |
| D2 | Constructor por momentos | Agregar canto a cada categoría | ☐ |
| D3 | Kyrie → auto Santo/Cordero/Gloria de la misma Misa | Diálogo y alta correcta | ☐ |
| D4 | Aspersión pascual | Pregunta Kyrie vs Aspersión; cambia el momento | ☐ |
| D5 | Padre Nuestro cantado | Pregunta al agregar Ofertorio; resuelve partitura | ☐ |
| D6 | Sugerencias litúrgicas | Propone según tiempo litúrgico | ☐ |
| D7 | Publicar — Tipo de Misa | Elegir **del día** vs **vespertina** | ☐ |
| D8 | Publicar multi-parroquia | Mismos cantos, fecha/horario por parroquia | ☐ |
| D9 | Un cantoral por Misa | No permite duplicar (parroquia+fecha+hora) | ☐ |
| D10 | QR + PDF del coro | PDF letra **con acordes** en orden de la Misa | ☐ |
| D11 | PDF coro **con partituras** (opcional) | Botón secundario embebe todas | ☐ |
| D12 | Historial de cantorales | Re-descarga y gestión | ☐ |
| D13 | Modo Atril — letra/acordes | Canto sin partitura → letra con acordes | ☐ |
| D14 | Modo Atril — **partituras de todos** | Cantos con partitura → PDF en orden de la Misa | ☐ |
| D15 | Atril: zoom, transpositor, autoscroll, concentración | Funcionan | ☐ |

---

## 7. Frontend — Admin

| # | Caso | Esperado | Estado |
|---|---|---|---|
| E1 | Acceso al panel | Solo admin verificado (server-side) | ☐ |
| E2 | Sincronizar YouTube | Importa cantos del canal | ☐ |
| E3 | CRUD Cantos | Crear/editar/aprobar/rechazar/borrar | ☐ |
| E4 | CRUD Usuarios | Crear cuenta usuario/clave, reset, borrar | ☐ |
| E5 | CRUD Capillas | Crear/editar/borrar | ☐ |
| E6 | CRUD Parroquias (`custom_parishes`) | Crear/editar/borrar | ☐ |
| E7 | Admin actuando como Coro/Pueblo fiel | Ve opciones de ese rol | ☐ |

---

## 8. Transversal

### 8.1 Tutorial en vivo (tour)
| Caso | Esperado | Estado |
|---|---|---|
| Auto-disparo 1ª vez por rol (Pueblo/Coro/Admin) | Tour correcto | ☐ |
| Tour no se traba en objetivos altos | Tooltip visible, avanza | ☐ |
| Botón "Ver tutorial" (Sidebar) y "Volver a ver" (Ajustes) | Reinician tours/tips | ☐ |
| Tips contextuales (constructor, Atril) 1ª vez | Aparecen | ☐ |

### 8.2 PWA / Offline
| Caso | Esperado | Estado |
|---|---|---|
| Instalar PWA (Android) | Se instala con ícono/manifest | ☐ |
| Offline: cantorales cacheados | Se ven sin red | ☐ |
| Offline: partituras pre-cacheadas | Se abren sin red (Cache Storage) | ☐ |
| Wake lock en Atril/visor | Pantalla no se apaga | ☐ |

### 8.3 Seguridad
| Caso | Esperado | Estado |
|---|---|---|
| Bundle sin claves sensibles | `grep AIza`/service-role en `build/` → vacío | ☐ |
| CSP y headers (vercel.json) | Presentes en respuesta | ☐ |
| Secretos solo server-side | Sin `VITE_` para service-role/Resend/Gemini | ☐ |
| Rotación de la key Google expuesta (pendiente histórico) | Confirmar rotada | ☐ |

### 8.4 Rendimiento / errores
| Caso | Esperado | Estado |
|---|---|---|
| Carga inicial móvil aceptable | < ~4 s en 4G | ☐ |
| Sentry recibe errores | Evento de prueba visible | ☐ |
| Publicar es rápido (sin render de PDFs) | PDF del coro sin partituras embebidas | ☐ |

### 8.5 i18n / a11y / responsive
| Caso | Esperado | Estado |
|---|---|---|
| Español de Chile (tuteo), sin auto-traducción de términos litúrgicos | "Salmo" no se vuelve "Salmon" | ☐ |
| Botones no desbordan en móvil | Texto dentro del botón | ☐ |
| Landmarks/roles (main, dialog) y foco | a11y básica OK | ☐ |
| Modo oscuro | Consistente | ☐ |

---

## 9. Regresión — features de la marcha blanca

Marcar que cada función entregada sigue funcionando tras los últimos cambios:
- ☐ Rate limit distribuido · ☐ Login usuario/clave + recuperación · ☐ CRUD admin completo
- ☐ Proxy YouTube (key fuera del bundle) · ☐ Guía litúrgica en Ver Ordinario
- ☐ Modo Atril A+B · ☐ Tutorial F1–F4 · ☐ Misa vespertina · ☐ Partituras del ordinario
- ☐ Separación PDF/Atril por perfil · ☐ Ordinario en latín

---

## 10. Cierre

- Casos ejecutados: `___` · Pass: `___` · Fail: `___`
- Hallazgos P0/P1: `___` · P2/P3: `___`
- Veredicto: ☐ APROBADO ☐ APROBADO C/OBSERVACIONES ☐ RECHAZADO
- Firma responsable: __________________  Fecha: __________

> Las corridas automatizadas del día se registran en `tests/INFORME.md`.
