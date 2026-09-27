import logoStellaMaris from 'figma:asset/logo-stella-maris.webp';
import { useAvanceEstimado } from '../../hooks/useAvanceEstimado';
import { FraseMagisterio } from './FraseMagisterio';

interface CargandoLogoProps {
  /** Avance real de 0 a 100. Sin él, se muestra uno estimado (useAvanceEstimado). */
  porcentaje?: number;
  /**
   * Qué se está cargando. No se muestra: en su lugar va una frase del Magisterio (pedido
   * del 27-sep-2026). Queda como nombre de la barra para los lectores de pantalla.
   */
  mensaje?: string;
  /** 'sm' para espacios chicos (una partitura dentro del Atril); 'md' para un panel. */
  tamano?: 'sm' | 'md';
  /** Colores para fondo oscuro (visor, Atril) o claro (tarjetas, diálogos). */
  sobre?: 'oscuro' | 'claro';
}

/**
 * Pantalla de carga de la app: el logo girando, el porcentaje y una enseñanza del
 * Magisterio sobre la música sacra que cambia sola.
 *
 * Reemplaza al círculo suelto que dejaba a la gente preguntándose si la app se había
 * quedado pegada, sobre todo al armar el folleto, que puede tardar varios segundos
 * mientras baja las partituras de Drive.
 */
export function CargandoLogo({ porcentaje, mensaje, tamano = 'md', sobre = 'oscuro' }: CargandoLogoProps) {
  const estimado = useAvanceEstimado(porcentaje === undefined);
  const valor = Math.max(0, Math.min(100, Math.round(porcentaje ?? estimado)));
  const chico = tamano === 'sm';
  const texto = sobre === 'oscuro' ? 'text-white' : 'text-brand-ink';
  const riel = sobre === 'oscuro' ? 'bg-white/15' : 'bg-blue-100 dark:bg-white/10';

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label={mensaje ?? 'Cargando'}
        className={`flex ${chico ? 'flex-row gap-3' : 'flex-col gap-3'} items-center`}
      >
        <div className={`relative ${chico ? 'w-10 h-10' : 'w-24 h-24 sm:w-28 sm:h-28'} flex-shrink-0`}>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 opacity-30 blur-xl animate-pulse" />
          <img
            src={logoStellaMaris}
            alt=""
            className="relative w-full h-full rounded-full object-cover drop-shadow-lg"
            style={{ animation: 'spin3d 2.4s linear infinite', transformStyle: 'preserve-3d' }}
          />
        </div>
        <div className={`flex flex-col ${chico ? 'items-start' : 'items-center'} gap-1.5`}>
          <span className={`font-bold tabular-nums ${chico ? 'text-base' : 'text-2xl'} ${texto}`}>{valor} %</span>
          <div className={`${chico ? 'w-28' : 'w-48'} h-1.5 rounded-full overflow-hidden ${riel}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-[width] duration-300"
              style={{ width: `${valor}%` }}
            />
          </div>
        </div>
      </div>
      <FraseMagisterio sobre={sobre} compacta={chico} />
    </div>
  );
}
