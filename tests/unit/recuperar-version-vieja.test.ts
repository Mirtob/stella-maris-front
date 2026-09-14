/**
 * Recuperarse cuando la app del teléfono quedó vieja (src/utils/chunkRecovery.ts).
 *
 * Reportado el 10-sep-2026: dos usuarios con iPhone veían «Algo salió mal — Toca el
 * botón para volver a intentar», y ese botón no podía funcionar. La causa: la app se
 * sirve en trozos con el hash en el nombre y marcados `immutable`; cada despliegue
 * borra los viejos, así que un teléfono con la app dormida varios días pide un archivo
 * que ya no existe.
 *
 * Lo que se fija aquí:
 *  · Reconocer ESE fallo, en los cuatro navegadores que lo dicen distinto —Safari, que
 *    es donde se reportó, no menciona la palabra "chunk" por ninguna parte—.
 *  · No confundirlo con un error de verdad, que debe llegar entero a Sentry.
 *  · Al recargar, NO perder el enlace profundo (/c/<id>?r=1 abre el modo radio).
 */
import {
  esFalloDeChunk, esErrorDeVersion, urlConVersionFresca, VersionNuevaError, MAX_INTENTOS,
} from '../../src/utils/chunkRecovery';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Reconocer "ese trozo ya no existe" ==');
check('Chrome / Edge',
  esFalloDeChunk(new Error('Failed to fetch dynamically imported module: https://x/assets/a.js')), true);
check('Vite',
  esFalloDeChunk(new Error('error loading dynamically imported module')), true);
check('Safari / iOS — el del reporte',
  esFalloDeChunk(new Error('Importing a module script failed.')), true);
// Cuando el asset no existe, la reescritura de SPA devuelve el index.html y el
// navegador se queja del TIPO, no del 404. Es el mismo problema con otra cara.
check('el index.html servido en vez del JS (Chrome)',
  esFalloDeChunk(new Error("Expected a JavaScript module script but the server responded with a MIME type of 'text/html'. Strict MIME type checking is enforced for module scripts per HTML spec.")), true);
check('el mismo caso, como lo dice Firefox',
  esFalloDeChunk(new Error('Loading module from "https://app.cl/assets/a.js" was blocked because of a disallowed MIME type ("text/html").')), true);
check('webpack, por su nombre',
  esFalloDeChunk(Object.assign(new Error('boom'), { name: 'ChunkLoadError' })), true);
check('CSS que no se pudo precargar',
  esFalloDeChunk(new Error('Unable to preload CSS for /assets/x.css')), true);

console.log('\n== No confundirlo con un error de verdad ==');
check('un TypeError normal se propaga',
  esFalloDeChunk(new TypeError("Cannot read properties of undefined (reading 'map')")), false);
check('un error de red cualquiera',
  esFalloDeChunk(new Error('NetworkError when attempting to fetch resource.')), false);
check('null', esFalloDeChunk(null), false);
check('undefined', esFalloDeChunk(undefined), false);

console.log('\n== El error propio llega a la pantalla ==');
const v = new VersionNuevaError(new Error('Importing a module script failed.'));
check('se llama como toca', v.name, 'VersionNuevaError');
check('la pantalla lo reconoce', esErrorDeVersion(v), true);
check('y también reconoce el fallo crudo',
  esErrorDeVersion(new Error('Failed to fetch dynamically imported module')), true);
check('un error normal NO es de versión',
  esErrorDeVersion(new TypeError('x is not a function')), false);

console.log('\n== Al recargar no se pierde el enlace profundo ==');
check('se conserva la ruta',
  new URL(urlConVersionFresca('https://app.cl/c/abc-123', 111)).pathname, '/c/abc-123');
check('se conserva el parámetro del modo radio',
  new URL(urlConVersionFresca('https://app.cl/c/abc-123?r=1', 111)).searchParams.get('r'), '1');
check('se agrega el buscador de versión',
  new URL(urlConVersionFresca('https://app.cl/c/abc-123?r=1', 111)).searchParams.get('nv'), '111');
check('se conserva el ancla',
  new URL(urlConVersionFresca('https://app.cl/x#parte2', 111)).hash, '#parte2');
check('recargar dos veces no acumula parámetros',
  new URL(urlConVersionFresca(urlConVersionFresca('https://app.cl/x', 111), 222)).searchParams.getAll('nv'),
  ['222']);
check('la raíz también funciona',
  new URL(urlConVersionFresca('https://app.cl/', 111)).pathname, '/');

console.log('\n== Cuántos intentos ==');
check('dos: uno por si fue la red, otro por si fue el despliegue', MAX_INTENTOS, 2);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
