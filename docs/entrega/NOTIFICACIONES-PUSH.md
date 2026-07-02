# Notificaciones push (Web Push / PWA)

Avisos al teléfono aunque la app esté cerrada:
- **Celebraciones próximas** (7 días y 1 día antes) — cron diario.
- **Nuevo cantoral publicado** para tu parroquia — al publicar.

## Puesta en marcha (una sola vez)

### 1. Migración
Aplicar en Supabase (SQL Editor): `supabase/migrations/20260702_push_subscriptions.sql`
(tabla `push_subscriptions` con RLS; solo el service role accede).

### 2. Variables de entorno en Vercel (Project Settings → Environment Variables)
| Variable | Valor | Notas |
|---|---|---|
| `VAPID_PRIVATE_KEY` | `BdP_Q5tCS9buvjEEjBqGycKQ8x4q5GwawOb72QtSCDs` | **Secreta.** Debe corresponder a la pública. |
| `VITE_VAPID_PUBLIC_KEY` | `BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg` | No secreta (ya va como fallback en el cliente). Opcional. |
| `VAPID_SUBJECT` | `mailto:gustavus.tobar@gmail.com` | Opcional (tiene default). |
| `CRON_SECRET` | (una cadena aleatoria) | Recomendado: Vercel lo inyecta al cron como `Authorization: Bearer`. |

> `SUPABASE_SERVICE_ROLE_KEY` y `VITE_SUPABASE_*` ya están configuradas (las usan las otras funciones).

Para regenerar las claves: `node -e "console.log(require('web-push').generateVAPIDKeys())"`.

### 3. Redeploy
El `vercel.json` ya trae el cron diario (`/api/cron/celebration-reminders`, 12:00 UTC ≈ 08:00 Chile).

## Cómo lo activa el usuario
Ajustes → **Notificaciones** → "Activar notificaciones" (pide permiso del navegador).

### iOS (importante)
En iPhone/iPad **solo funciona con la PWA instalada** en la pantalla de inicio (iOS 16.4+):
Compartir → «Agregar a inicio», y abrir desde el ícono. En la pestaña de Safari no llega.
La tarjeta de Ajustes ya muestra este aviso en iOS.

## Piezas técnicas
- `public/push-sw.js` — service worker SOLO-push (sin caché; no reintroduce el problema
  del app-shell por el que se desactivó `sw.js`). `main.tsx` lo conserva al limpiar SW legacy.
- `src/services/push.ts` — suscribe/desuscribe + sincroniza parroquias.
- `api/push-subscribe.ts` — alta/baja (service role; la tabla no se expone a clientes).
- `api/notify-cantoral.ts` — envía al publicar (lo llama App en segundo plano).
- `api/cron/celebration-reminders.ts` — cron diario.
- `api/_push.ts` — envío con `web-push` + consultas por service role.
