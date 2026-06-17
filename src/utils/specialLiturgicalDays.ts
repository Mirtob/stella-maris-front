/**
 * Sistema de detección de fechas litúrgicas especiales
 * con adaptaciones específicas para cada celebración
 */

// Calcular Domingo de Pascua
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month - 1, day);
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export type SpecialLiturgicalDay = 
  | 'JuevesSanto'
  | 'ViernesSanto'
  | 'VigiliaPascual'
  | 'DomingoResurreccion'
  | 'Pentecostes'
  | 'CorpusChristi'
  | 'Nochebuena'
  | 'Navidad'
  | null;

/**
 * Determina si una fecha es un día litúrgico especial
 */
export function getSpecialLiturgicalDay(date: Date = new Date()): SpecialLiturgicalDay {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  
  const easter = calculateEaster(year);
  
  // Jueves Santo: 3 días antes de Pascua
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);
  if (isSameDay(date, holyThursday)) return 'JuevesSanto';
  
  // Viernes Santo: 2 días antes de Pascua
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  if (isSameDay(date, goodFriday)) return 'ViernesSanto';
  
  // Vigilia Pascual: Sábado antes de Pascua
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);
  if (isSameDay(date, holySaturday)) return 'VigiliaPascual';
  
  // Domingo de Resurrección
  if (isSameDay(date, easter)) return 'DomingoResurreccion';
  
  // Pentecostés: 50 días después de Pascua
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  if (isSameDay(date, pentecost)) return 'Pentecostes';
  
  // Corpus Christi: 60 días después de Pascua (jueves después de Trinidad)
  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  if (isSameDay(date, corpusChristi)) return 'CorpusChristi';
  
  // Nochebuena: 24 de diciembre
  if (month === 11 && day === 24) return 'Nochebuena';
  
  // Navidad: 25 de diciembre
  if (month === 11 && day === 25) return 'Navidad';
  
  return null;
}

/** Celebración elegible en el constructor de cantorales. */
export interface BuildableCelebration {
  key: SpecialLiturgicalDay | 'normal';
  label: string;
  date?: string; // Fecha de la próxima ocurrencia (YYYY-MM-DD), informativa
}

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CELEBRATION_LABELS: Record<Exclude<SpecialLiturgicalDay, null>, string> = {
  JuevesSanto: 'Jueves Santo — Cena del Señor',
  ViernesSanto: 'Viernes Santo — Pasión',
  VigiliaPascual: 'Vigilia Pascual',
  DomingoResurreccion: 'Domingo de Resurrección',
  Pentecostes: 'Pentecostés',
  CorpusChristi: 'Corpus Christi',
  Nochebuena: 'Nochebuena',
  Navidad: 'Navidad',
};

/**
 * Devuelve las celebraciones para las que tiene sentido armar un cantoral en
 * este momento del año. Siempre incluye la Misa dominical normal; durante la
 * Cuaresma y la Semana Santa surgen los oficios del Triduo para poder
 * prepararlos con anticipación (orden y liturgia propios de cada uno).
 */
export function getBuildableCelebrations(today: Date = new Date()): BuildableCelebration[] {
  const list: BuildableCelebration[] = [{ key: 'normal', label: 'Misa dominical' }];

  const year = today.getFullYear();
  const easter = calculateEaster(year);
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);

  // Ventana de preparación de Semana Santa: desde Miércoles de Ceniza hasta Pascua.
  if (today >= ashWednesday && today <= easter) {
    const jueves = new Date(easter); jueves.setDate(easter.getDate() - 3);
    const viernes = new Date(easter); viernes.setDate(easter.getDate() - 2);
    const vigilia = new Date(easter); vigilia.setDate(easter.getDate() - 1);
    list.push(
      { key: 'JuevesSanto', label: CELEBRATION_LABELS.JuevesSanto, date: ymdLocal(jueves) },
      { key: 'ViernesSanto', label: CELEBRATION_LABELS.ViernesSanto, date: ymdLocal(viernes) },
      { key: 'VigiliaPascual', label: CELEBRATION_LABELS.VigiliaPascual, date: ymdLocal(vigilia) },
      { key: 'DomingoResurreccion', label: CELEBRATION_LABELS.DomingoResurreccion, date: ymdLocal(easter) },
    );
  }

  // Si hoy es un día especial que no está en la lista, ofrécelo también.
  const todaySpecial = getSpecialLiturgicalDay(today);
  if (todaySpecial && !list.some(c => c.key === todaySpecial)) {
    list.splice(1, 0, { key: todaySpecial, label: CELEBRATION_LABELS[todaySpecial], date: ymdLocal(today) });
  }

  return list;
}

/**
 * Obtiene las categorías de la Misa que deben mostrarse según el día especial
 */
export interface CategoryConfig {
  categories: string[];
  hiddenCategories: string[];
  specialCategories: string[];
  notes: string[];
}

export function getCategoriesForSpecialDay(
  specialDay: SpecialLiturgicalDay
): CategoryConfig {
  const defaultCategories = [
    'Entrada',
    'Kyrie',
    'Gloria',
    'Salmo',
    'Aleluya',
    'Post Evangelio',
    'Ofertorio',
    'Santo',
    'Cordero de Dios',
    'Comunión',
    'Salida',
  ];

  if (!specialDay) {
    return {
      categories: defaultCategories,
      hiddenCategories: [],
      specialCategories: [],
      notes: [],
    };
  }

  switch (specialDay) {
    case 'JuevesSanto':
      return {
        categories: [
          'Entrada',
          'Kyrie',
          'Gloria',
          'Salmo',
          'Aleluya',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Exposición y Procesión', // Reemplaza Salida
        ],
        hiddenCategories: ['Salida'],
        specialCategories: ['Exposición y Procesión'],
        notes: [
          'No hay canto de salida',
          'Se canta durante la procesión con el Santísimo al Monumento',
        ],
      };

    case 'ViernesSanto':
      return {
        categories: [
          'Salmo',
          'Post Evangelio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
        ],
        hiddenCategories: ['Entrada', 'Salida', 'Kyrie', 'Gloria', 'Aleluya', 'Ofertorio'],
        specialCategories: [],
        notes: [
          'No hay canto de entrada ni de salida',
          'La celebración comienza en silencio',
          'No se canta Gloria ni Aleluya',
        ],
      };

    case 'VigiliaPascual':
      return {
        categories: [
          'Pregón Pascual',
          'Salmo AT 1',
          'Salmo AT 2',
          'Salmo AT 3',
          'Salmo AT 4',
          'Salmo AT 5',
          'Salmo AT 6',
          'Salmo AT 7',
          'Gloria',
          'Salmo Epistolar',
          'Aleluya Triple',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Salida',
        ],
        hiddenCategories: ['Entrada', 'Kyrie', 'Aleluya', 'Salmo'],
        specialCategories: [
          'Pregón Pascual',
          'Salmo AT 1',
          'Salmo AT 2',
          'Salmo AT 3',
          'Salmo AT 4',
          'Salmo AT 5',
          'Salmo AT 6',
          'Salmo AT 7',
          'Salmo Epistolar',
          'Aleluya Triple',
        ],
        notes: [
          'No hay canto de entrada',
          'Se proclama el Pregón Pascual',
          'Se pueden cantar hasta 7 salmos del Antiguo Testamento',
          'El Aleluya Triple anuncia oficialmente la Resurrección',
        ],
      };

    case 'DomingoResurreccion':
      return {
        categories: [
          'Entrada',
          'Kyrie',
          'Gloria',
          'Salmo',
          'Secuencia de Pascua', // Especial
          'Aleluya',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Salida',
        ],
        hiddenCategories: [],
        specialCategories: ['Secuencia de Pascua'],
        notes: [
          'Se canta la Secuencia de Pascua después de la segunda lectura',
          'La secuencia es obligatoria en este día',
        ],
      };

    case 'Pentecostes':
      return {
        categories: [
          'Entrada',
          'Kyrie',
          'Gloria',
          'Salmo',
          'Secuencia de Pentecostés', // Especial
          'Aleluya',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Salida',
        ],
        hiddenCategories: [],
        specialCategories: ['Secuencia de Pentecostés'],
        notes: [
          'Se canta la Secuencia de Pentecostés después de la segunda lectura',
          'La secuencia "Veni Sancte Spiritus" es tradicional',
        ],
      };

    case 'CorpusChristi':
      return {
        categories: [
          'Entrada',
          'Kyrie',
          'Gloria',
          'Salmo',
          'Secuencia de Corpus', // Especial
          'Aleluya',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Salida',
        ],
        hiddenCategories: [],
        specialCategories: ['Secuencia de Corpus'],
        notes: [
          'Se canta la Secuencia de Corpus Christi después de la segunda lectura',
          'La secuencia "Lauda Sion" es tradicional',
        ],
      };

    case 'Nochebuena':
      return {
        categories: [
          'Kalenda Navideña', // Especial
          'Entrada',
          'Kyrie',
          'Gloria',
          'Salmo',
          'Aleluya',
          'Post Evangelio',
          'Ofertorio',
          'Santo',
          'Cordero de Dios',
          'Comunión',
          'Salida',
        ],
        hiddenCategories: [],
        specialCategories: ['Kalenda Navideña'],
        notes: [
          'Se puede cantar la Kalenda antes de la Misa',
          'La Kalenda anuncia solemnemente el nacimiento de Cristo',
        ],
      };

    case 'Navidad':
      return {
        categories: defaultCategories,
        hiddenCategories: [],
        specialCategories: [],
        notes: [
          'Solemnidad de la Natividad del Señor',
          'Se canta el Gloria con especial solemnidad',
        ],
      };

    default:
      return {
        categories: defaultCategories,
        hiddenCategories: [],
        specialCategories: [],
        notes: [],
      };
  }
}

/**
 * Verifica si una categoría debe mostrarse en un día especial
 */
export function shouldShowCategory(
  category: string,
  date: Date = new Date()
): boolean {
  const specialDay = getSpecialLiturgicalDay(date);
  const config = getCategoriesForSpecialDay(specialDay);
  
  return (
    config.categories.includes(category) &&
    !config.hiddenCategories.includes(category)
  );
}

/**
 * Obtiene el nombre del día litúrgico especial
 */
export function getSpecialDayName(day: SpecialLiturgicalDay): string {
  const names: Record<string, string> = {
    JuevesSanto: 'Jueves Santo',
    ViernesSanto: 'Viernes Santo',
    VigiliaPascual: 'Vigilia Pascual',
    DomingoResurreccion: 'Domingo de Resurrección',
    Pentecostes: 'Pentecostés',
    CorpusChristi: 'Corpus Christi',
    Nochebuena: 'Nochebuena',
    Navidad: 'Navidad',
  };
  
  return day ? names[day] : '';
}

/**
 * Obtiene el emoji del día litúrgico especial
 */
export function getSpecialDayEmoji(day: SpecialLiturgicalDay): string {
  const emojis: Record<string, string> = {
    JuevesSanto: '🍞',
    ViernesSanto: '✝️',
    VigiliaPascual: '🕯️',
    DomingoResurreccion: '🌅',
    Pentecostes: '🔥',
    CorpusChristi: '🍞',
    Nochebuena: '⭐',
    Navidad: '👶',
  };
  
  return day ? emojis[day] : '';
}
