import { useSyncExternalStore } from 'react';

/**
 * ID del usuario actual, expuesto como store externo para que componentes hoja
 * (p. ej. el corazón de Favoritos en cualquier pantalla que muestre cantos) lo lean
 * sin tener que pasar `userId` por props por todo el árbol. Lo fija AppContent al
 * cargar/cambiar el perfil.
 */
let currentUserId: string | undefined;
const listeners = new Set<() => void>();

export function setCurrentUserId(id?: string) {
  if (currentUserId === id) return;
  currentUserId = id;
  listeners.forEach((l) => l());
}

export function getCurrentUserId(): string | undefined {
  return currentUserId;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Hook reactivo: re-renderiza cuando cambia el usuario (login/logout/cambio de cuenta). */
export function useCurrentUserId(): string | undefined {
  return useSyncExternalStore(subscribe, getCurrentUserId, getCurrentUserId);
}
