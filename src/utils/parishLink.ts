// Enlace PERMANENTE por parroquia/capilla: /i/{parroquia}
// A diferencia del deep-link por cantoral (/c/{id}, único por publicación), este
// enlace es ESTABLE: un mismo QR físico —pegado en la iglesia— que siempre resuelve
// al cantoral vigente de esa parroquia/capilla. Codifica la cadena de parroquia
// activa (la misma que se guarda en `parish_name` de cada cantoral publicado).

/** Ruta relativa del enlace permanente de una parroquia/capilla. */
export function buildParishLinkPath(parish: string): string {
  return `/i/${encodeURIComponent(parish.trim())}`;
}

/** URL absoluta del enlace permanente (lo que se codifica en el QR). */
export function buildParishLinkUrl(parish: string): string {
  return `${window.location.origin}${buildParishLinkPath(parish)}`;
}

/**
 * Extrae la parroquia de un path `/i/{parroquia}`. Devuelve null si el path no aplica
 * o si la parroquia queda vacía / anómala. La búsqueda posterior en Supabase usa ilike
 * parametrizado con escape, así que no hay riesgo de inyección con el valor devuelto.
 */
export function parseParishFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/i\/([^/?#]+)\/?$/);
  if (!m) return null;
  let parish: string;
  try {
    parish = decodeURIComponent(m[1]);
  } catch {
    return null; // secuencia % inválida
  }
  parish = parish.trim();
  if (!parish || parish.length > 200) return null;
  return parish;
}
