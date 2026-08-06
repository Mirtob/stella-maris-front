import { InstrumentType, UserRole } from '../types';

/**
 * Traspaso del rol/instrumento elegidos en el REGISTRO hacia el alta de perfil.
 *
 * El formulario de registro ya pregunta rol e instrumento, así que `ProfileSetup` no
 * debe volver a preguntarlos: solo pide la parroquia y el consentimiento legal. Pero
 * `ProfileSetup` también atiende a las cuentas creadas por el ADMIN, cuyo perfil trae
 * rol 'Pueblo fiel' por DEFECTO — a ésas hay que seguir preguntándoles el rol, porque
 * nadie se lo preguntó nunca.
 *
 * Como el rol guardado no distingue "lo eligió el usuario" de "es el default", se deja
 * esta marca en localStorage al registrarse y se consume en el primer ingreso. Va por
 * localStorage y no por estado de React porque entre medio hay un `window.location.reload()`.
 * Si la marca no está (cuenta del admin, u otro dispositivo), `ProfileSetup` pregunta
 * todo como siempre.
 */
export const SIGNUP_PREFS_KEY = 'stella_maris_signup_prefs';

export interface SignupPrefs {
  role: UserRole;
  instruments?: InstrumentType[];
}

export function readSignupPrefs(): SignupPrefs | null {
  try {
    const raw = localStorage.getItem(SIGNUP_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Solo roles auto-asignables: nunca 'Admin', ni aunque alguien edite el localStorage.
    if (parsed?.role !== 'Coro' && parsed?.role !== 'Pueblo fiel') return null;
    return parsed as SignupPrefs;
  } catch {
    return null;
  }
}

export function clearSignupPrefs(): void {
  try {
    localStorage.removeItem(SIGNUP_PREFS_KEY);
  } catch {
    /* modo privado */
  }
}
