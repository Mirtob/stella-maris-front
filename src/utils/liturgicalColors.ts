import { liturgicalCalendar2026 } from '../data/liturgicalCalendar';

// Función para obtener el color litúrgico actual
export function getCurrentLiturgicalColor(): string {
  const today = new Date();
  
  const sortedEvents = [...liturgicalCalendar2026].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  let currentEvent = sortedEvents[0];
  for (const event of sortedEvents) {
    const eventDate = new Date(event.date);
    if (eventDate <= today) {
      currentEvent = event;
    } else {
      break;
    }
  }
  
  return currentEvent?.color || 'Verde';
}

// Mapear colores litúrgicos a colores de cruz (para iconos)
export function getLiturgicalCrossColor(color: string): string {
  const colors: Record<string, string> = {
    'Blanco': 'text-amber-600',
    'Rojo': 'text-red-600',
    'Verde': 'text-green-600',
    'Morado': 'text-purple-600',
    'Rosa': 'text-pink-500',
  };
  return colors[color] || 'text-purple-600';
}

// Mapear colores litúrgicos a gradientes de Tailwind
export function getLiturgicalGradient(color: string): string {
  const gradients: Record<string, string> = {
    'Blanco': 'from-amber-500 to-amber-600',
    'Rojo': 'from-red-600 to-red-700',
    'Verde': 'from-green-600 to-green-700',
    'Morado': 'from-purple-600 to-purple-700',
    'Rosa': 'from-pink-500 to-pink-600',
  };
  return gradients[color] || 'from-purple-600 to-purple-700';
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
