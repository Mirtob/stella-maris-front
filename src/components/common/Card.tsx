import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `muted` = superficie aún más tenue (para sub-bloques dentro de otra Card). */
  tone?: 'default' | 'muted';
  children: ReactNode;
}

/**
 * Superficie "glass" recurrente en la app (tarjeta translúcida con blur, borde claro
 * y sombra suave). Centraliza el patrón repetido
 * `bg-white/40 dark:bg-white/10 rounded-2xl border-2 border-white/40 ...`.
 * Acepta `className` para padding y ajustes puntuales.
 */
export function Card({ tone = 'default', className = '', children, ...rest }: CardProps) {
  const surface =
    tone === 'muted'
      ? 'bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/10'
      : 'bg-white/40 dark:bg-white/10 border-white/40 dark:border-white/20';
  return (
    <div
      className={`backdrop-blur-sm rounded-2xl border-2 shadow-md ${surface} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
