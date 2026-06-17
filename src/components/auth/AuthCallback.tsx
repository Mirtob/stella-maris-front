/**
 * 🔐 Google OAuth Callback
 * 
 * Este componente es el destino de redirección después de que el usuario
 * inicia sesión con Google. Procesa la respuesta OAuth.
 */

import { useEffect, useState } from 'react';
import { getSessionFromUrl } from '../../services/googleAuth';

export function AuthCallback() {
  const [status, setStatus] = useState('Procesando autenticación...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        const session = await getSessionFromUrl();
        if (session) {
          setStatus('Autenticación completada. Redirigiendo...');
          window.location.replace('/');
          return;
        }

        setErrorMessage('No se pudo recuperar la sesión de Google. Intenta iniciar sesión de nuevo.');
      } catch (error: any) {
        console.error('Error procesando callback de autenticación:', error);
        setErrorMessage(error?.message || 'Error inesperado en el callback de OAuth');
      }
    }

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-xl text-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-blue-400 mx-auto mb-6"></div>
        <h1 className="text-2xl sm:text-3xl text-white font-semibold mb-4">Procesando autenticación</h1>
        <p className="text-white/80 mb-6">{status}</p>
        {errorMessage && (
          <div className="rounded-2xl bg-red-700/20 border border-red-400/40 p-4 text-left text-sm text-red-100">
            <p className="font-semibold">Error</p>
            <p>{errorMessage}</p>
            <p className="mt-3 text-xs text-red-200">Asegúrate de que tu redirect URI está registrado en Google Cloud y en Supabase.</p>
          </div>
        )}
      </div>
    </div>
  );
}
