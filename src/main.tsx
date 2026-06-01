import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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

  // Renderizar la app normalmente
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}

cleanupAndRender();
  