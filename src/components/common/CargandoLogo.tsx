import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';
import { useAvanceEstimado } from '../../hooks/useAvanceEstimado';

interface CargandoLogoProps {
  /** Avance real de 0 a 100. Sin él, se muestra uno estimado (useAvanceEstimado). */
  porcentaje?: number;
  mensaje?: string;
  /** 'sm' para botones y barras; 'md' para el centro de un panel. */
  tamano?: 'sm' | 'md';
  /** Colores para fondo oscuro (visor, Atril) o claro (tarjetas, diálogos). */
  sobre?: 'oscuro' | 'claro';
}

/**
 * Pantalla de carga de la app: el logo girando y el porcentaje.
 *
 * Reemplaza al círculo suelto que dejaba a la gente preguntándose si la app se había
 * quedado pegada (pedido del 27-sep-2026), sobre todo al armar el folleto, que puede
 * tardar varios segundos mientras baja las partituras de Drive.
 */
export function CargandoLogo({ porcentaje, mensaje, tamano = 'md', sobre = 'oscuro' }: CargandoLogoProps) {
  const estimado = useAvanceEstimado(porcentaje === undefined);
  const valor = Math.max(0, Math.min(100, Math.round(porcentaje ?? estimado)));
  const logo = tamano === 'sm' ? 'w-10 h-10' : 'w-24 h-24 sm:w-28 sm:h-28';
  const texto = sobre === 'oscuro' ? 'text-white' : 'text-brand-ink';
  const suave = sobre === 'oscuro' ? 'text-white/70' : 'text-brand-ink-soft';
  const riel = sobre === 'oscuro' ? 'bg-white/15' : 'bg-blue-100 dark:bg-white/10';

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valor}
      aria-label={mensaje ?? 'Cargando'}
      className={`flex ${tamano === 'sm' ? 'flex-row gap-3' : 'flex-col gap-3'} items-center`}
    >
      <div className={`relative ${logo} flex-shrink-0`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 opacity-30 blur-xl animate-pulse" />
        <img
          src={logoStellaMaris}
          alt=""
          className="relative w-full h-full rounded-full object-cover drop-shadow-lg"
          style={{ animation: 'spin3d 2.4s linear infinite', transformStyle: 'preserve-3d' }}
        />
      </div>
      <div className={`flex flex-col ${tamano === 'sm' ? 'items-start' : 'items-center'} gap-1.5 min-w-0`}>
        <span className={`font-bold tabular-nums ${tamano === 'sm' ? 'text-base' : 'text-2xl'} ${texto}`}>
          {valor} %
        </span>
        <div className={`${tamano === 'sm' ? 'w-28' : 'w-48'} h-1.5 rounded-full overflow-hidden ${riel}`}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-[width] duration-300"
            style={{ width: `${valor}%` }}
          />
        </div>
        {mensaje && <p className={`text-sm ${suave} ${tamano === 'sm' ? '' : 'text-center'}`}>{mensaje}</p>}
      </div>
    </div>
  );
}
