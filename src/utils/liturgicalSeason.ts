/**
 * Determina si una fecha está en el tiempo de Cuaresma
 * (Desde Miércoles de Ceniza hasta Viernes Santo, ambos inclusive)
 */
export function isLent(date: Date = new Date()): boolean {
  const year = date.getFullYear();
  
  // Calcular Domingo de Pascua usando el algoritmo de Meeus/Jones/Butcher
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
  
  const easter = new Date(year, month - 1, day);
  
  // Miércoles de Ceniza: 46 días antes de Pascua
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  
  // Viernes Santo: 2 días antes de Pascua
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  // Normalizar las fechas a medianoche para comparación
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const normalizedAshWednesday = new Date(ashWednesday.getFullYear(), ashWednesday.getMonth(), ashWednesday.getDate());
  const normalizedGoodFriday = new Date(goodFriday.getFullYear(), goodFriday.getMonth(), goodFriday.getDate());
  
  // Verificar si está entre Miércoles de Ceniza y Viernes Santo (inclusive)
  return normalizedDate >= normalizedAshWednesday && normalizedDate <= normalizedGoodFriday;
}

/**
 * Calcula el Domingo de Pascua para un año dado
 */
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

/**
 * Determina el tiempo litúrgico actual
 */
export function getCurrentLiturgicalSeason(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  
  // Calcular fechas importantes
  const easter = calculateEaster(year);
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 50);
  
  // Adviento: 4 domingos antes de Navidad
  const christmas = new Date(year, 11, 25); // Diciembre 25
  const adventStart = new Date(christmas);
  adventStart.setDate(christmas.getDate() - 28); // Aproximadamente 4 semanas
  
  // Ajustar al domingo más cercano
  const dayOfWeek = adventStart.getDay();
  if (dayOfWeek !== 0) {
    adventStart.setDate(adventStart.getDate() - dayOfWeek);
  }
  
  // Epifanía (tradicionalmente el 6 de enero)
  const epiphany = new Date(year, 0, 6);
  
  // Normalizar fecha actual
  const currentDate = new Date(year, month, day);
  
  // Determinar el tiempo litúrgico
  
  // Tiempo de Navidad (25 de diciembre hasta Epifanía)
  if (
    (month === 11 && day >= 25) || 
    (month === 0 && day <= 6)
  ) {
    return 'Navidad';
  }
  
  // Adviento (4 semanas antes de Navidad)
  if (currentDate >= adventStart && month === 11 && day < 25) {
    return 'Adviento';
  }
  
  // Cuaresma (Miércoles de Ceniza hasta Viernes Santo)
  if (isLent(date)) {
    return 'Cuaresma';
  }
  
  // Pascua (Domingo de Pascua hasta Pentecostés - 50 días)
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  
  if (currentDate > goodFriday && currentDate <= pentecost) {
    return 'Pascua';
  }
  
  // Tiempo Ordinario (todo lo demás)
  return 'Tiempo Ordinario';
}

/**
 * Obtiene el nombre correcto para el canto después del salmo
 * "Aleluya" normalmente, "Aclamación al Evangelio" en Cuaresma
 */
export function getGospelAcclamationName(date: Date = new Date()): string {
  return isLent(date) ? 'Aclamación al Evangelio' : 'Aleluya';
}

/**
 * Obtiene el icono correcto para el canto después del salmo
 */
export function getGospelAcclamationIcon(date: Date = new Date()): string {
  return isLent(date) ? '📿' : '🎺';
}