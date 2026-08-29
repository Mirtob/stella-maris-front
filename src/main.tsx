import { createRoot } from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from "./App";
import "./index.css";
import { initSentry } from "./services/sentry";
import { CACHE_NAME as OFFLINE_CACHE } from "./services/offlineCache";
import { reportDisplayMode, registerPwaServiceWorker } from "./services/push";

// Inicializar Sentry ANTES de renderizar la app.
// Si VITE_SENTRY_DSN no está configurada, queda inactivo silenciosamente.
initSentry();

// Limpiar service workers y cachés viejos ANTES de renderizar la app
// Esto garantiza que todos los usuarios siempre vean la versión más reciente
async function cleanupAndRender() {
  if ('serviceWorker' in navigator) {
    try {
      // 1. Desregistrar los service workers LEGACY (app-shell), pero CONSERVAR el
      //    push-sw.js (solo-push, sin caché): desregistrarlo mataría la suscripción
      //    de notificaciones del usuario. Es la única excepción a "sin SW".
      const registrations = await navigator.serviceWorker.getRegistrations();
      const isPushSW = (r: ServiceWorkerRegistration) => {
        const url = (r.active || r.waiting || r.installing)?.scriptURL || '';
        return url.endsWith('/push-sw.js');
      };
      const legacy = registrations.filter(r => !isPushSW(r));
      await Promise.all(legacy.map(r => r.unregister()));

      // 2. Borrar cachés viejos del app-shell (deploys obsoletos de SW antiguos),
      //    pero CONSERVAR el caché de datos offline (cantorales/partituras) para que
      //    la app siga usable sin conexión durante la Misa.
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== OFFLINE_CACHE).map(k => caches.delete(k)));
      }

      // 3. Si había SWs legacy activos, recargar para obtener código limpio
      if (legacy.length > 0) {
        window.location.reload();
        return;
      }
    } catch {
      // ignorar errores — la app carga igual
    }
  }

  // Registrar el service worker de la PWA. No cachea (ver public/push-sw.js): está
  // para las notificaciones y para que el navegador ofrezca instalar la app en un
  // toque. Sin esto, en Android había que cazar la opción en el menú ⋮, que cambia de
  // nombre y de lugar en cada teléfono.
  void registerPwaServiceWorker();

  // Avisar al push-sw si esta ventana es la app INSTALADA, para que al tocar una
  // notificación abra la PWA y no una pestaña del navegador.
  reportDisplayMode();

  // Renderizar la app normalmente envuelta en Sentry ErrorBoundary
  // para capturar cualquier crash de React sin pantalla blanca.
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fdba74 100%)',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ color: '#1e3a8a', fontSize: '28px', marginBottom: '8px' }}>
            Algo salió mal
          </h1>
          <p style={{ color: '#1e40af', maxWidth: '420px', marginBottom: '24px', lineHeight: 1.6 }}>
            La aplicación encontró un error inesperado. Ya lo notificamos al equipo.
            Toca el botón para volver a intentar.
          </p>
          <button
            onClick={resetError}
            style={{
              background: 'linear-gradient(to right, #1e3a8a, #1e3a5f)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(30, 58, 138, 0.4)',
            }}
          >
            Volver a intentar
          </button>
        </div>
      )}
    >
      <App />
    </Sentry.ErrorBoundary>
  );
}

cleanupAndRender();
  