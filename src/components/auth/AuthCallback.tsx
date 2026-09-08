/**
 * La vuelta desde Google: aquí aterriza el navegador después de iniciar sesión.
 *
 * Reportado el 8-sep-2026 — "no puedo entrar desde el celular". Esta pantalla era un
 * CALLEJÓN SIN SALIDA: si la sesión no llegaba, mostraba un error sin un solo botón ni
 * enlace, con el aro girando como si aún estuviera trabajando, y un texto que hablaba
 * de "redirect URI registrado en Google Cloud" — algo que no le dice nada a nadie que
 * quiera cantar en su parroquia. Quien caía aquí se quedaba encerrado.
 *
 * Pasa sobre todo en el TELÉFONO con la app instalada: Google abre su pantalla en una
 * pestaña aparte del sistema y, al volver, la sesión puede tardar un instante en quedar
 * escrita —o quedar escrita en otro contenedor—. Por eso ahora:
 *
 *   1. se reintenta unas cuantas veces antes de dar nada por perdido;
 *   2. si aun así no llega, se DICE en cristiano y se ofrece salida;
 *   3. y si nadie toca nada, la app vuelve sola al inicio. Nunca se queda encerrado.
 */

import { useEffect, useState } from 'react';
import { getSessionFromUrl } from '../../services/googleAuth';

/** Intentos y espera entre ellos. La sesión suele aparecer en el primer reintento. */
const INTENTOS = 4;
const ESPERA_MS = 900;
/** Si el usuario no hace nada, se vuelve solo al inicio en vez de dejarlo encallado. */
const VOLVER_SOLO_MS = 9000;

export function AuthCallback() {
  const [fallo, setFallo] = useState(false);
  const [intento, setIntento] = useState(1);

  useEffect(() => {
    let cancelado = false;

    const volverAlInicio = () => window.location.replace('/');

    (async () => {
      for (let n = 1; n <= INTENTOS; n++) {
        if (cancelado) return;
        setIntento(n);
        try {
          const sesion = await getSessionFromUrl();
          if (cancelado) return;
          if (sesion) { volverAlInicio(); return; }
        } catch (e) {
          // Se anota, pero no se corta: el siguiente intento puede traerla.
          console.error('Vuelta de Google, intento', n, e);
        }
        if (n < INTENTOS) await new Promise((r) => setTimeout(r, ESPERA_MS));
      }
      if (!cancelado) setFallo(true);
    })();

    return () => { cancelado = true; };
  }, []);

  // Salvavidas: aunque el usuario no toque nada, no se queda en esta pantalla.
  useEffect(() => {
    if (!fallo) return;
    const t = setTimeout(() => window.location.replace('/'), VOLVER_SOLO_MS);
    return () => clearTimeout(t);
  }, [fallo]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
        {!fallo ? (
          <>
            {/* El aro solo gira mientras de verdad se está intentando. */}
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-blue-400 mx-auto mb-6" />
            <h1 className="text-2xl text-white font-semibold mb-2">Entrando…</h1>
            <p className="text-white/80">
              {intento === 1 ? 'Un momento.' : 'Tardando un poco más de lo normal…'}
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">🔑</div>
            <h1 className="text-2xl text-white font-semibold mb-3">No se completó el inicio de sesión</h1>
            {/* En cristiano, y con lo que de verdad suele arreglarlo en un teléfono. */}
            <p className="text-white/80 mb-6">
              Google no alcanzó a devolvernos tu sesión. Suele pasar en el teléfono cuando
              la pantalla de Google se abre aparte. Vuelve a intentarlo: casi siempre entra
              a la segunda.
            </p>
            <button
              onClick={() => window.location.replace('/')}
              className="w-full py-4 px-6 rounded-2xl bg-white text-blue-900 font-bold text-lg active:scale-95 transition-all shadow-lg"
            >
              Volver a intentar
            </button>
            <p className="text-white/60 text-sm mt-4">
              Si se repite, entra con usuario y clave desde la misma pantalla de inicio.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
