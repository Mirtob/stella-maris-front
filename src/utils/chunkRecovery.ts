/**
 * Cuando la app que tiene el teléfono ya no existe en el servidor.
 *
 * EL CASO REAL (reportado el 10-sep-2026, dos usuarios, iPhone)
 * La app se parte en trozos (`assets/index-XZrUUbLO.js`) que se sirven como
 * `immutable` durante un año, con el hash en el nombre. Cada despliegue cambia esos
 * hashes y borra los viejos. Un teléfono que lleva días con la app instalada y dormida
 * conserva en memoria el índice ANTIGUO: al abrir una pantalla diferida pide un trozo
 * que ya no está, el `import()` falla, y React tira la excepción.
 *
 * Lo que la persona veía era «Algo salió mal — Toca el botón para volver a intentar»,
 * y el botón NO PUEDE funcionar: reintentar vuelve a pedir el mismo archivo muerto.
 * Un callejón sin salida, en una pantalla que además promete que el equipo ya se
 * enteró. De ahí este módulo: distinguir ESTE fallo de un error de verdad, recuperarse
 * solo, y si no se puede, decir la verdad — «hay una versión nueva» — con un botón que
 * sí arregle.
 *
 * Nada de esto toca la caché sin conexión: se comprobó que ahí solo viven partituras,
 * no el armazón de la app, así que borrarla no ayudaría y costaría las partituras que
 * el coro dejó bajadas para el domingo.
 */

/** Marca del navegador donde se cuentan los intentos (sobrevive a la recarga). */
const CLAVE_INTENTOS = 'sm_chunk_intentos';
/** Parámetro que fuerza al navegador a pedir el índice de nuevo, no el que tiene. */
const PARAM_VERSION = 'nv';
/** Dos intentos: uno por si fue un tropiezo de red, otro por si fue el despliegue. */
export const MAX_INTENTOS = 2;

/**
 * ¿El fallo es "ese trozo de la app ya no existe"?
 *
 * Cada navegador lo dice a su manera, y hay que reconocerlas todas: si no, el arreglo
 * no se aplica justo en el aparato donde hace falta. Safari (que es donde se reportó)
 * NO dice "chunk" por ninguna parte.
 */
export function esFalloDeChunk(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  if (!e) return false;
  if (e.name === 'ChunkLoadError') return true;
  const m = String(e.message ?? '');
  return (
    /failed to fetch dynamically imported module/i.test(m) ||   // Chrome, Edge
    /error loading dynamically imported module/i.test(m) ||     // Vite
    /importing a module script failed/i.test(m) ||              // Safari / iOS
    // El asset no existe y el servidor devuelve el index.html en su lugar (reescritura
    // de SPA): el navegador se queja del TIPO, no del 404, y cada uno con su frase.
    //   Chrome  → "…responded with a MIME type of 'text/html'"
    //   Firefox → "…blocked because of a disallowed MIME type ("text/html")"
    //   Safari  → "…is not a valid JavaScript MIME type"
    /is not a valid javascript mime type/i.test(m) ||
    /expected a javascript(?: module)? script/i.test(m) ||
    /disallowed mime type/i.test(m) ||
    /mime type[^)]{0,12}['"]?text\/html/i.test(m) ||
    /unable to preload css/i.test(m)
  );
}

/** Error propio: la app del teléfono quedó vieja. Lo reconoce la pantalla de error. */
export class VersionNuevaError extends Error {
  constructor(public readonly causaOriginal: unknown) {
    super('La app del dispositivo quedó desactualizada y no pudo cargar una pantalla.');
    this.name = 'VersionNuevaError';
  }
}

/** ¿El error que llegó a la pantalla de error es de versión vieja? */
export function esErrorDeVersion(error: unknown): boolean {
  return (error as { name?: string })?.name === 'VersionNuevaError' || esFalloDeChunk(error);
}

const leerIntentos = (): number => {
  try { return Number(sessionStorage.getItem(CLAVE_INTENTOS) || '0') || 0; } catch { return 0; }
};

const escribirIntentos = (n: number): void => {
  try { sessionStorage.setItem(CLAVE_INTENTOS, String(n)); } catch { /* modo privado */ }
};

/** Al cargar bien una pantalla diferida se borra la cuenta: la app está sana otra vez. */
export function olvidarIntentos(): void {
  try { sessionStorage.removeItem(CLAVE_INTENTOS); } catch { /* modo privado */ }
}

/**
 * La misma dirección, pero pidiendo el índice fresco.
 *
 * Se CONSERVAN la ruta, los parámetros y el ancla: por aquí pasan los enlaces
 * profundos (`/c/<id>?r=1` abre el modo radio y luego el cantoral) y perderlos
 * significaría que quien llega desde un QR o desde un aviso acabe en la portada.
 */
export function urlConVersionFresca(href: string, ahora: number = Date.now()): string {
  const url = new URL(href);
  url.searchParams.set(PARAM_VERSION, String(ahora));
  return url.toString();
}

/** Quita el parámetro de recarga de la barra de direcciones, sin recargar. */
export function limpiarParamVersion(): void {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(PARAM_VERSION)) return;
    url.searchParams.delete(PARAM_VERSION);
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  } catch { /* si falla, el parámetro sobra pero no molesta */ }
}

/**
 * Intenta recuperarse de un trozo perdido. Devuelve `true` si va a recargar (y quien
 * llama debe quedarse esperando), `false` si ya se agotaron los intentos.
 */
export function intentarRecuperar(): boolean {
  const intentos = leerIntentos();
  if (intentos >= MAX_INTENTOS) return false;
  escribirIntentos(intentos + 1);
  try {
    window.location.replace(urlConVersionFresca(window.location.href));
  } catch {
    window.location.reload();
  }
  return true;
}

/** Recuperación a mano, desde el botón de la pantalla de error. */
export function recargarAhora(): void {
  olvidarIntentos();
  try {
    window.location.replace(urlConVersionFresca(window.location.href));
  } catch {
    window.location.reload();
  }
}
