import { getLiturgicalColorStyle } from '../../utils/liturgicalColors';

interface LiturgicalColorBadgeProps {
  date: string; // 'YYYY-MM-DD'
  className?: string;
}

/** Etiqueta con el color litúrgico del día (punto + nombre, p. ej. "Morado"). */
export function LiturgicalColorBadge({ date, className = '' }: LiturgicalColorBadgeProps) {
  const c = getLiturgicalColorStyle(date);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-bold ${c.badge} ${className}`}
      title={`Color litúrgico: ${c.label}`}
    >
      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} aria-hidden />
      {c.label}
    </span>
  );
}
