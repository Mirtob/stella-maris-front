import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'brand' | 'gold' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Estilos por variante, construidos con los TOKENS de marca (no colores a mano).
 * Reproducen el patrón repetido en toda la app: gradiente + borde + sombra + escala
 * al presionar. El dark mode lo resuelven los tokens, sin clases `dark:` por botón.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  brand:
    'bg-gradient-to-br from-brand to-brand-strong text-brand-foreground border-2 border-brand-border shadow-lg hover:shadow-xl',
  gold:
    'bg-gradient-to-br from-gold to-gold-strong text-gold-foreground border-2 border-gold-strong/60 shadow-lg hover:shadow-xl',
  danger:
    'bg-gradient-to-br from-danger to-danger-strong text-danger-foreground border-2 border-danger-strong shadow-lg hover:shadow-xl',
  outline:
    'bg-transparent text-brand-ink border-2 border-brand/40 hover:bg-brand/5',
  ghost:
    'bg-transparent text-brand-ink border-2 border-transparent hover:bg-brand/10',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base sm:text-lg rounded-2xl gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * Botón base de Stella Maris. Centraliza el aspecto de los botones de acción para que
 * sean consistentes y se escriban en una línea. Acepta `className` para ajustes
 * puntuales (ancho completo, márgenes, etc.).
 */
export function Button({
  variant = 'brand',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
