import { createRoot } from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from "./App";
import "./index.css";
import { initSentry } from "./services/sentry";

// Inicializar Sentry ANTES de renderizar la app.
// Si VITE_SENTRY_DSN no está configurada, queda inactivo silenciosamente.
initSentry();

// Limpiar service workers y cachés viejos ANTES de renderizar la app
// Esto garantiza que todos los usuarios siempre vean la versión más reciente
async function cleanupAndRender() {
  if ('serviceWorker' in navigator) {
    try {
      // 1. Desregistrar todos los service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));

      // 2. Borrar todos los cachés del navegador
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // 3. Si había SWs activos, recargar para obtener código limpio
      if (registrations.length > 0) {
        window.location.reload();
        return;
      }
    } catch {
      // ignorar errores — la app carga igual
    }
  }

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
  