import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** id del encabezado del diálogo (para `aria-labelledby`). */
  labelledById?: string;
  /** Etiqueta accesible cuando no hay un encabezado con id. */
  ariaLabel?: string;
  /** Clases del PANEL (la caja blanca). El overlay lo pone el propio Modal. */
  panelClassName?: string;
  /** Cerrar al tocar el fondo oscuro (por defecto sí). */
  closeOnOverlay?: boolean;
  children: ReactNode;
}

/**
 * Diálogo accesible reutilizable (portal a `document.body`).
 *
 * Aporta lo que a los modales hechos a mano les faltaba (auditoría de junio, M1):
 *  - `role="dialog"` + `aria-modal` → los lectores de pantalla lo anuncian como diálogo.
 *  - Cierre con **Escape** y clic en el fondo.
 *  - Foco inicial dentro del diálogo y **restauración** del foco al cerrar.
 *  - Bloqueo del scroll del fondo mientras está abierto.
 *
 * Solo se ocupa del contenedor/overlay: el contenido (encabezado, cuerpo, botones)
 * lo pone quien lo usa, con total libertad de estilo.
 */
export function Modal({
  open,
  onClose,
  labelledById,
  ariaLabel,
  panelClassName = '',
  closeOnOverlay = true,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Elemento que tenía el foco antes de abrir, para devolvérselo al cerrar.
  const previouslyFocused = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;

    // Cerrar con Escape.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);

    // Bloquear el scroll del fondo.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial: el primer elemento enfocable del panel, o el panel mismo.
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    (focusable ?? panel)?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Devolver el foco al disparador (si sigue en el DOM).
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fadeIn"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-label={labelledById ? undefined : ariaLabel}
        tabIndex={-1}
        className={`relative outline-none ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
