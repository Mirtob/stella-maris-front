import * as Sentry from '@sentry/react';

/**
 * Inicializa Sentry para monitoreo de errores en producción.
 *
 * Filosofía:
 *   - NO enviamos PII: emails, parroquias, nombres reales se redactan antes de enviar.
 *   - Solo errores en producción. En dev cancela el envío para no contaminar.
 *   - Sampling alto (100%) inicialmente, baja a 10% cuando crezca el tráfico.
 *
 * Variables de entorno requeridas:
 *   VITE_SENTRY_DSN     - DSN del proyecto en Sentry (https://xxxx@xxx.ingest.sentry.io/yyy)
 *   VITE_SENTRY_ENV     - environment (production / preview / development)
 *
 * Si VITE_SENTRY_DSN no está, Sentry queda deshabilitado silenciosamente.
 * Eso permite que el dev local no requiera ninguna config.
 */
export function initSentry() {
  const dsn = import.meta.env?.VITE_SENTRY_DSN;
  if (!dsn || dsn.includes('xxxx')) {
    // No DSN configurado — Sentry queda inactivo. Útil en dev local.
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env?.VITE_SENTRY_ENV ?? import.meta.env?.MODE ?? 'unknown',

    // Replay y performance OFF por defecto para mantener el bundle chico
    // y no enviar datos extra. Activar solo si los pagás.
    integrations: [],

    // Sampling de errores: 100% inicialmente. Bajar cuando crezca el volumen.
    sampleRate: 1.0,

    // Tracing OFF — no necesitamos APM aún, ahorra cuota Sentry
    tracesSampleRate: 0.0,

    // No enviar la URL completa con query params (puede contener tokens, IDs)
    sendDefaultPii: false,

    // Limpieza PII antes de enviar
    beforeSend(event) {
      try {
        // Redactar email del user object si Sentry lo capturó por defecto
        if (event.user?.email) {
          event.user.email = '[redacted]';
        }
        if (event.user?.username) {
          event.user.username = '[redacted]';
        }
        // No enviar IP
        if (event.user) {
          event.user.ip_address = undefined;
        }
        // Redactar URLs que contengan email o parroquia
        if (event.request?.url) {
          event.request.url = redactPii(event.request.url);
        }
        // Redactar mensajes que parezcan tener email
        if (event.message) {
          event.message = redactPii(event.message);
        }
        if (event.exception?.values) {
          for (const ex of event.exception.values) {
            if (ex.value) ex.value = redactPii(ex.value);
          }
        }
        return event;
      } catch {
        // Si el sanitizado falla, mejor no enviar que enviar con PII
        return null;
      }
    },

    // Ignorar errores comunes del browser que son ruido (extensiones, ad blockers)
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Ad blockers
      /chrome-extension/,
      /moz-extension/,
    ],
  });
}

/** Reemplaza emails, parroquias y otros patrones sensibles por '[redacted]'. */
function redactPii(input: string): string {
  return input
    // Email
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
    // "Parroquia X - Diócesis Y" o variantes — match básico de "Parroquia <palabras>"
    .replace(/Parroquia\s+[A-ZÁÉÍÓÚÑa-záéíóúñ\s.]+(?=\s|$|[,;])/g, '[parroquia]')
    // UUID que podrían ser IDs de cantorales
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, '[uuid]');
}

/**
 * Captura manual de excepciones desde código de la app.
 * Útil para reportar errores no-fatales que queremos ver en Sentry.
 */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (import.meta.env?.MODE === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[reportError]', error, context);
  }
}

/** Establecer contexto de usuario SIN PII (solo rol y un hash anónimo). */
export function setSentryUserContext(role: string, anonId?: string) {
  Sentry.setUser({
    id: anonId,             // No es el email, es un ID anónimo del usuario
    segment: role,          // Coro / Pueblo fiel / Admin
  });
}

/** Limpiar contexto de usuario (al hacer logout). */
export function clearSentryUserContext() {
  Sentry.setUser(null);
}
