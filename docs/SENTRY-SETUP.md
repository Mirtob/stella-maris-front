# Setup de Sentry — Acción manual en Vercel

> Sentry ya está integrado en el código. Solo falta crear el proyecto y agregar la env var.
> Tiempo estimado: **10 minutos**.

## 1. Crear cuenta + proyecto

1. Andá a **https://sentry.io/signup/**
2. Sign up con tu Google (mismo email del admin).
3. Elegí **Free Plan**:
   - 5.000 errores/mes
   - 30 días de retención
   - 1 usuario
4. Crear proyecto: **Platform = React**, **Project name = stella-maris**.
5. Copia el **DSN** que aparece (formato `https://xxxxxxxxxx@yyyyyy.ingest.sentry.io/zzz`).

## 2. Configurar env vars en Vercel

1. Dashboard Vercel → tu proyecto **stella-maris-front**.
2. **Settings → Environment Variables**.
3. Agregar:

   ```
   VITE_SENTRY_DSN=https://xxxxxxxxxx@yyyyyy.ingest.sentry.io/zzz
   VITE_SENTRY_ENV=production
   ```

   Aplica a: **Production** (y opcionalmente Preview si querés ver errores en deploys de prueba).

4. Re-deploy (o esperar al próximo push).

## 3. Verificar que funciona

Después del re-deploy:

1. Abrí la app en producción.
2. En la consola del browser, ejecutar:
   ```js
   throw new Error('Test Sentry desde producción');
   ```
3. Esperá 30-60 segundos.
4. Andá al dashboard de Sentry → **Issues**.
5. Debería aparecer el error.

## Qué información se envía (y qué no)

### ✅ SÍ se envía
- Mensaje del error y stack trace
- URL del browser (sanitizada, sin emails/parroquias/UUIDs)
- Tipo de navegador, OS, versión
- ID anónimo del usuario (UUID Supabase, NO email)
- Rol activo (Coro / Pueblo fiel / Admin)
- Breadcrumbs (acciones recientes)

### ❌ NO se envía (redactado en `services/sentry.ts`)
- Email del usuario (se reemplaza por `[email]`)
- Nombre de parroquia (se reemplaza por `[parroquia]`)
- IDs de cantorales (UUIDs → `[uuid]`)
- IP del usuario
- Cuerpos de requests (passwords, tokens, etc.)

Esto cumple con la **Ley 19.628** sobre datos sensibles.

## Costo

- **Free hasta 5.000 errores/mes.** Suficiente para 500 usuarios activos.
- Si superás, Team plan = USD $26/mes.
- Performance/Replay están **deshabilitados** para ahorrar cuota.

## Cómo reportar errores manualmente desde código

```typescript
import { reportError } from './services/sentry';

try {
  riskyOperation();
} catch (err) {
  reportError(err, { context: 'publishCantoral', cantoralId: id });
}
```

En dev local hace `console.error`. En producción dispara `Sentry.captureException`.
