/**
 * Administrador principal (super-admin) de Stella Maris.
 *
 * Es el ÚNICO autorizado a cambiar el rol/perfil de otros usuarios (incluyendo
 * promover a Admin). El resto de los Admin pueden gestionar cantos, capillas,
 * etc., pero NO tocar roles.
 *
 * El gating de la UI vive en ProfileManager; el refuerzo server-side vive en el
 * trigger de `supabase/migrations/20260626_principal_admin_role_guard.sql`.
 * Si cambias este correo, actualiza también ese trigger.
 */
export const PRINCIPAL_ADMIN_EMAIL = 'gustavus.tobar@gmail.com';

/** True si el email dado corresponde al administrador principal. */
export function isPrincipalAdminEmail(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === PRINCIPAL_ADMIN_EMAIL;
}
