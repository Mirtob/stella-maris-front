/**
 * Cuentas de usuario y clave: su correo interno y cómo se muestran.
 *
 * Vive aparte de services/supabaseClient (que lo reexporta) porque ese archivo crea la
 * conexión a Supabase al cargarse, y esto son reglas puras que se prueban sin ella.
 */

// Cada cuenta de usuario y clave tiene un correo SINTÉTICO interno (no se envía ningún
// correo). El correo real es opcional y se usa solo para recuperar la clave.
export const USERNAME_EMAIL_DOMAIN = 'usuario.stellamaris.app';

/** ¿El email corresponde a una cuenta de usuario/clave (no Google)? */
export function isUsernameAccount(email?: string | null): boolean {
  return !!email && email.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`);
}

/**
 * El nombre que se MUESTRA de una persona.
 *
 * Una cuenta de usuario y clave sin nombre cargado tenía como nombre su correo interno
 * («juan@usuario.stellamaris.app»): largo, sin espacios y sin sentido para nadie. En
 * el menú lateral se desbordaba y su cola asomaba sobre el constructor aun con el menú
 * cerrado (reportado el 26-sep-2026). Se muestra el nombre de usuario, que es con lo
 * que la persona entra.
 */
export function nombreParaMostrar(name?: string | null, email?: string | null): string {
  const n = (name ?? '').trim();
  if (n && !isUsernameAccount(n)) return n;
  const correo = isUsernameAccount(n) ? n : (email ?? '');
  if (isUsernameAccount(correo)) return correo.split('@')[0];
  return n || correo;
}
