import * as Tooltip from '@radix-ui/react-tooltip';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Nombre accesible OBLIGATORIO. Se usa como `aria-label` (lo anuncia el lector de
   * pantalla) y como texto del tooltip visual. Así un botón solo-ícono queda
   * accesible en touch (aria-label), teclado (tooltip al enfocar) y mouse (al pasar).
   */
  label: string;
  children: ReactNode;
  /** Lado en que aparece el tooltip. */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Botón solo-ícono accesible: combina el `aria-label` con un tooltip de Radix que se
 * muestra al pasar el mouse Y al enfocar con teclado. Reemplaza los tooltips caseros
 * `group-hover` con `pointer-events-none`, que no funcionan en touch ni los anuncia
 * el lector de pantalla.
 */
export function IconButton({ label, children, side = 'top', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type={type} aria-label={label} className={className} {...rest}>
            {children}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side={side}
            sideOffset={6}
            // z alto: por encima del Sidebar (z-70) y su overlay (z-60).
            className="z-[80] select-none rounded-lg bg-blue-950 px-3 py-1.5 text-sm font-bold text-white shadow-xl"
          >
            {label}
            <Tooltip.Arrow className="fill-blue-950" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
