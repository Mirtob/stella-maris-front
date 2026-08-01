# Notificaciones push (Web Push / PWA)

Avisos al teléfono aunque la app esté cerrada:
- **Celebraciones próximas** (7 días y 1 día antes) — cron diario.
- **Nuevo cantoral publicado** para tu parroquia — al publicar.

## Puesta en marcha (una sola vez)

### 1. Migraciones
Aplicar en Supabase (SQL Editor), ambas con RLS y **sin policies** (solo el service role accede):
- `supabase/migrations/20260702_push_subscriptions.sql` — tabla `push_subscriptions`.
- `supabase/migrations/20260731_cron_runs.sql` — tabla `cron_runs` (bitácora de corridas del cron).

### 2. Variables de entorno en Vercel (Project Settings → Environment Variables)
| Variable | Valor | Notas |
|---|---|---|
| `VAPID_PRIVATE_KEY` | `BdP_Q5tCS9buvjEEjBqGycKQ8x4q5GwawOb72QtSCDs` | **Secreta.** Debe corresponder a la pública. |
| `VITE_VAPID_PUBLIC_KEY` | `BD6iyTq35EL0rH1goWKY4FEjvAjpUpxO-XSY9qFFaKHh9qBOeUeMSiKhFuUO8ZwZHOsUwM5T3F4NmvJSzv1ViSg` | No secreta (ya va como fallback en el cliente). Opcional. |
| `VAPID_SUBJECT` | `mailto:gustavus.tobar@gmail.com` | Opcional (tiene default). |
| `CRON_SECRET` | (una cadena aleatoria) | **Obligatoria.** Vercel la inyecta al cron como `Authorization: Bearer`. Sin ella el endpoint queda abierto (ver abajo). Generar con `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. |

> `SUPABASE_SERVICE_ROLE_KEY` y `VITE_SUPABASE_*` ya están configuradas (las usan las otras funciones).

Para regenerar las claves: `node -e "console.log(require('web-push').generateVAPIDKeys())"`.

### 3. Redeploy
El `vercel.json` ya trae el cron diario (`/api/cron/celebration-reminders`, **14:00 UTC** = 10:00 de Chile
en invierno, 11:00 en verano — los crons de Vercel son solo en UTC y Chile cambia de horario).
El recordatorio "publica el cantoral" del domingo cae en la corrida del **jueves** (domingo − 3).

> ⚠️ El plan es **Hobby**: los crons se disparan *dentro de la hora* pedida (no al minuto) y
> Vercel no guarda logs ni historial de corridas. Por eso existe la bitácora (abajo).

## Diagnóstico: "no me llegó el aviso"

`GET /api/cron/celebration-reminders?dry=1` recorre **exactamente la misma lógica sin enviar
nada** y responde a quién le habría llegado y por qué. Añade `&date=YYYY-MM-DD` para
reconstruir otro día (p. ej. un jueves pasado); la simulación de fecha **solo** se acepta
junto a `dry=1`, para que nadie dispare avisos de una fecha arbitraria.

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://stella-maris-front.vercel.app/api/cron/celebration-reminders?dry=1&date=2026-07-30"
```

> 🔐 **El endpoint exige el Bearer** cuando `CRON_SECRET` está configurada (desde el
> 31-jul-2026). La cabecera `x-vercel-cron` **ya no basta**: la puede mandar cualquiera y no
> la valida nadie, así que antes permitía disparar los avisos y —peor— leer este mismo
> diagnóstico, que expone parroquias, roles y endpoints de los suscriptores. Solo se acepta
> como fallback mientras NO exista el secreto. Vercel inyecta el Bearer por su cuenta en las
> llamadas del cron, así que la corrida programada sigue funcionando sin tocar `vercel.json`.

Qué mirar en la respuesta:

| Campo | Para qué sirve |
|---|---|
| `ultimasCorridas` | Bitácora real (tabla `cron_runs`). **Si falta el día, el cron no se disparó.** |
| `wouldSend` | Cuántos avisos habrían salido en esa fecha |
| `preview` | El texto exacto del aviso |
| `suscripciones.detalle` | Cada dispositivo: rol, parroquias, `updated_at`, endpoint enmascarado |
| `coroDetail[].skipped` | Por qué se descartó cada parroquia (`ya publicado`, `sin celebración ese día`…) |

Si un dispositivo **no aparece** en `suscripciones.detalle`, el problema es la suscripción
(se perdió o nunca se activó), no el cron: basta abrir la app —`syncPushParishes` la recrea
sola si el permiso sigue concedido— o activarla en Ajustes → Notificaciones.

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
