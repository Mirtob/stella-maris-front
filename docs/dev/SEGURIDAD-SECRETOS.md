# Seguridad — manejo de secretos y API keys

> Modelo de cómo se manejan las claves en Stella Maris. **Regla de oro:** ningún
> secreto sensible debe terminar en el bundle del cliente.

## Cómo funciona Vite con las variables de entorno

- Vite **inyecta al bundle** (texto plano, visible para cualquiera) **solo** las
  variables con prefijo **`VITE_`** **y que estén referenciadas** en el código del
  cliente (`import.meta.env.VITE_X`).
- Las variables **sin** prefijo `VITE_` (p. ej. `GOOGLE_API_KEY`) **no** se inyectan;
  solo viven en el servidor y se leen con `process.env` en las funciones de `api/`.

## Clasificación de secretos

| Secreto | Dónde vive | En el bundle |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (server) | ❌ Nunca |
| `RESEND_API_KEY` | Vercel (server) | ❌ Nunca |
| `GEMINI_API_KEY` | Vercel (server) | ❌ Nunca |
| `GOOGLE_API_KEY` (YouTube/Drive) | Vercel (server) | ❌ Nunca — se usa vía `/api/youtube` y `/api/sheets` |
| `VITE_SUPABASE_ANON_KEY` | Vercel | ✅ **Pública por diseño** (protegida por RLS) |
| `VITE_SUPABASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_YOUTUBE_CHANNEL_ID`, folder IDs | Vercel | ✅ No son secretos |

## Regla para agregar un secreto nuevo

1. Si lo usa **solo el servidor** → variable **sin** `VITE_` (ej. `MI_API_KEY`), leída
   con `process.env.MI_API_KEY` dentro de `api/`. **Hacer `.trim()`** (algunas envs de
   Vercel traen espacios) y no loguearla.
2. Si el **cliente** necesita el dato que produce ese secreto → **no** exponer la clave:
   crear un **proxy** en `api/` que la use server-side y que el cliente llame por `fetch`
   (mismo patrón que `/api/youtube`, `/api/sheets`, `/api/admin-users`).
3. Proteger el endpoint según el caso: rate-limit (lecturas que consumen cuota) y/o
   verificación de admin (`is_admin` con el token del que llama).

## Qué NO hacer

- ❌ Poner una API key sensible con prefijo `VITE_` y usarla en el cliente.
- ❌ Hardcodear claves en el código (todo va por env).
- ❌ Commitear archivos `.env*` con valores reales (solo `.env.production.example` con placeholders).

## Verificación rápida (auditoría del bundle)

```bash
npm run build
# No debe aparecer ninguna clave de Google, Resend ni service-role:
grep -roh "AIza[0-9A-Za-z_-]\{12,\}" build/assets   # → vacío
grep -rl  "service_role" build/assets               # → vacío
grep -roh "re_[0-9A-Za-z]\{12,\}" build/assets       # → vacío
# (La anon key 'eyJ...' SÍ aparece y es correcto: es pública.)
```

> Antecedente: en 2026-06 se detectó la API key de Google embebida y **sin restringir**
> en el bundle. Se corrigió moviendo las lecturas de YouTube a `/api/youtube` (clave
> server-only). Ver memoria del proyecto. Si una clave llegó a exponerse, **rotarla**.
