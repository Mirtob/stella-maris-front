import { createPortal } from 'react-dom';
import { CargandoLogo } from './CargandoLogo';

/**
 * Capa de carga mientras se arma el folleto: el logo girando con el porcentaje REAL
 * (generateCantoralPDF → onProgress). Se muestra encima de todo porque armar el
 * cuadernillo puede tardar varios segundos y un botón que solo dice "Generando…" no
 * deja claro que la app sigue trabajando.
 */
export function CargandoFolleto({ porcentaje, mensaje = 'Preparando el folleto…' }: {
  porcentaje: number;
  mensaje?: string;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-6">
      <CargandoLogo porcentaje={porcentaje} mensaje={mensaje} />
    </div>,
    document.body,
  );
}
