import { getLiturgicalInfoForDate } from './liturgicalCalendar';
import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { parseYmdLocal, getTodayLocal } from './dateLocal';

/**
 * Color de la TEMPORADA litúrgica actual (verde en Tiempo Ordinario, morado en
 * Adviento/Cuaresma, etc.) — para el cromo AMBIENTE (menú, cabecera, barra inferior).
 *
 * OJO: usa el color de la TEMPORADA, no el de la fiesta del día. Antes tomaba el color
 * del día (`getLiturgicalColorStyle`), así que una fiesta de santo entre semana (p. ej.
 * Santo Tomás, FIESTA blanca → gradiente ámbar/dorado) teñía todo de dorado, cuando en
 * Tiempo Ordinario debe verse VERDE. La fiesta del día sigue disponible en el calendario
 * y las cards vía `getLiturgicalColorStyle`.
 */
export function getCurrentLiturgicalColor(): string {
  const season = getCurrentLiturgicalSeason(parseYmdLocal(getTodayLocal()));
  return PALETTE[seasonToColorId(season)].label;
}

// Mapear colores litúrgicos a colores de cruz (para iconos)
export function getLiturgicalCrossColor(color: string): string {
  const colors: Record<string, string> = {
    'Blanco': 'text-amber-600',
    'Rojo': 'text-red-600',
    'Verde': 'text-green-600',
    'Morado': 'text-purple-600',
    'Rosa': 'text-pink-500',
    'Dorado': 'text-yellow-500',
    'Negro': 'text-gray-800',
  };
  return colors[color] || 'text-green-600';
}

// Mapear colores litúrgicos a gradientes de Tailwind
export function getLiturgicalGradient(color: string): string {
  const gradients: Record<string, string> = {
    'Blanco': 'from-amber-500 to-amber-600',
    'Rojo': 'from-red-600 to-red-700',
    'Verde': 'from-green-600 to-green-700',
    'Morado': 'from-purple-600 to-purple-700',
    'Rosa': 'from-pink-500 to-pink-600',
    'Dorado': 'from-yellow-400 to-amber-500',
    'Negro': 'from-gray-700 to-gray-900',
  };
  return gradients[color] || 'from-green-600 to-green-700';
}

// Mapear colores litúrgicos a clases completas de Tailwind para cards
export function getLiturgicalCardClasses(color: string): string {
  const classes: Record<string, string> = {
    'Blanco': 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600 text-amber-900 dark:text-amber-200',
    'Rojo': 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-900 dark:text-red-200',
    'Verde': 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-900 dark:text-green-200',
    'Morado': 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-200',
    'Rosa': 'bg-pink-100 dark:bg-pink-900/30 border-pink-400 dark:border-pink-600 text-pink-900 dark:text-pink-200',
  };
  return classes[color] || 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-900 dark:text-purple-200';
}

// Mapear colores litúrgicos a colores sólidos para leyenda
export function getLiturgicalSolidColor(color: string): string {
  const colors: Record<string, string> = {
    'Blanco': 'bg-amber-400 border-4 border-amber-600',
    'Rojo': 'bg-red-500',
    'Verde': 'bg-green-500',
    'Morado': 'bg-purple-500',
    'Rosa': 'bg-pink-400',
  };
  return colors[color] || 'bg-purple-500';
}

// ===========================================================================
// Color litúrgico POR FECHA (derivado de romcal — calendario real)
// Devuelve clases Tailwind LITERALES para que el motor las detecte.
// ===========================================================================

export type LiturgicalColorId = 'green' | 'violet' | 'white' | 'red' | 'rose' | 'gold' | 'black';

export interface LiturgicalColorStyle {
  id: LiturgicalColorId;
  label: string;        // 'Morado'
  dot: string;          // clases para el punto de color
  badge: string;        // clases bg+text+border para una etiqueta
  headerAccent: string; // gradiente para acentos de cabecera
}

const PALETTE: Record<LiturgicalColorId, LiturgicalColorStyle> = {
  green: {
    id: 'green', label: 'Verde',
    dot: 'bg-green-500',
    badge: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700',
    headerAccent: 'from-green-600 to-green-700',
  },
  violet: {
    id: 'violet', label: 'Morado',
    dot: 'bg-purple-600',
    badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700',
    headerAccent: 'from-purple-700 to-purple-900',
  },
  white: {
    id: 'white', label: 'Blanco',
    dot: 'bg-gray-100 border border-gray-400',
    badge: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/40 dark:text-gray-100 dark:border-gray-500',
    headerAccent: 'from-amber-400 to-yellow-500',
  },
  red: {
    id: 'red', label: 'Rojo',
    dot: 'bg-red-600',
    badge: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700',
    headerAccent: 'from-red-700 to-red-900',
  },
  rose: {
    id: 'rose', label: 'Rosa',
    dot: 'bg-pink-400',
    badge: 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700',
    headerAccent: 'from-pink-400 to-pink-600',
  },
  gold: {
    id: 'gold', label: 'Dorado',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700',
    headerAccent: 'from-yellow-400 to-amber-500',
  },
  black: {
    id: 'black', label: 'Negro',
    dot: 'bg-gray-800',
    badge: 'bg-gray-200 text-gray-800 border-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-500',
    headerAccent: 'from-gray-700 to-gray-900',
  },
};

/** Temporada (string español) → color litúrgico por defecto. */
export function seasonToColorId(season: string): LiturgicalColorId {
  const s = (season || '').toLowerCase();
  if (s.includes('adviento') || s.includes('cuaresma')) return 'violet';
  if (s.includes('semana santa')) return 'red';
  if (s.includes('navidad') || s.includes('pascua')) return 'white';
  return 'green'; // Tiempo Ordinario
}

/** Id de color litúrgico de una fecha 'YYYY-MM-DD' (romcal; fallback por temporada). */
export function getLiturgicalColorId(date?: string): LiturgicalColorId {
  if (!date) return 'green';
  const info = getLiturgicalInfoForDate(date);
  if (info?.color && info.color in PALETTE) return info.color as LiturgicalColorId;
  const season = info?.season || getCurrentLiturgicalSeason(parseYmdLocal(date));
  return seasonToColorId(season);
}

/** Estilo (clases Tailwind) del color litúrgico de una fecha. */
export function getLiturgicalColorStyle(date?: string): LiturgicalColorStyle {
  return PALETTE[getLiturgicalColorId(date)];
}
