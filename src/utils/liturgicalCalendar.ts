// Utilidades para calcular el calendario litúrgico católico

interface LiturgicalDate {
  name: string;
  date: string; // ISO string
  type: 'sunday' | 'solemnity' | 'feast' | 'weekday';
  season: 'Adviento' | 'Navidad' | 'Cuaresma' | 'Pascua' | 'Tiempo Ordinario';
}

// Calcular el Domingo de Pascua usando el algoritmo de Meeus/Jones/Butcher
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

// Obtener el primer domingo de Adviento (4 domingos antes de Navidad)
function getFirstSundayOfAdvent(year: number): Date {
  const christmas = new Date(year, 11, 25); // 25 de diciembre
  const dayOfWeek = christmas.getDay(); // 0 = domingo, 6 = sábado
  
  // El primer domingo de Adviento es el domingo más cercano al 30 de noviembre
  // (entre el 27 de noviembre y el 3 de diciembre)
  let daysToSubtract = dayOfWeek === 0 ? 28 : 21 + dayOfWeek;
  
  const firstAdvent = new Date(christmas);
  firstAdvent.setDate(christmas.getDate() - daysToSubtract);
  
  return firstAdvent;
}

// Obtener el nombre del domingo en Tiempo Ordinario
function getOrdinaryTimeSundayName(weekNumber: number): string {
  return `${weekNumber}° Domingo del Tiempo Ordinario`;
}

// Calcular todas las fechas litúrgicas importantes para un año
export function calculateLiturgicalYear(year: number): LiturgicalDate[] {
  const dates: LiturgicalDate[] = [];
  
  // Calcular Pascua
  const easter = calculateEaster(year);
  
  // Adviento (comienza el año litúrgico del año anterior)
  const firstAdvent = getFirstSundayOfAdvent(year);
  for (let i = 0; i < 4; i++) {
    const adventSunday = new Date(firstAdvent);
    adventSunday.setDate(firstAdvent.getDate() + (i * 7));
    dates.push({
      name: `${i + 1}° Domingo de Adviento`,
      date: adventSunday.toISOString().split('T')[0],
      type: 'sunday',
      season: 'Adviento'
    });
  }
  
  // Navidad
  dates.push({
    name: 'Natividad del Señor (Nochebuena)',
    date: `${year}-12-24`,
    type: 'solemnity',
    season: 'Navidad'
  });
  
  dates.push({
    name: 'Natividad del Señor (Día)',
    date: `${year}-12-25`,
    type: 'solemnity',
    season: 'Navidad'
  });
  
  dates.push({
    name: 'Santa María, Madre de Dios',
    date: `${year}-01-01`,
    type: 'solemnity',
    season: 'Navidad'
  });
  
  // Epifanía (6 de enero en la mayoría de países latinos)
  dates.push({
    name: 'Epifanía del Señor',
    date: `${year}-01-06`,
    type: 'solemnity',
    season: 'Navidad'
  });
  
  // Bautismo del Señor (domingo después de Epifanía)
  const epiphany = new Date(year, 0, 6);
  const baptismOfLord = new Date(epiphany);
  const daysToNextSunday = (7 - epiphany.getDay()) % 7;
  baptismOfLord.setDate(epiphany.getDate() + (daysToNextSunday === 0 ? 7 : daysToNextSunday));
  dates.push({
    name: 'Bautismo del Señor',
    date: baptismOfLord.toISOString().split('T')[0],
    type: 'feast',
    season: 'Navidad'
  });
  
  // Cuaresma
  const ashWednesday = new Date(easter);
  ashWednesday.setDate(easter.getDate() - 46);
  dates.push({
    name: 'Miércoles de Ceniza',
    date: ashWednesday.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Cuaresma'
  });
  
  // Domingos de Cuaresma
  for (let i = 0; i < 5; i++) {
    const lentSunday = new Date(easter);
    lentSunday.setDate(easter.getDate() - 42 + (i * 7));
    dates.push({
      name: `${i + 1}° Domingo de Cuaresma`,
      date: lentSunday.toISOString().split('T')[0],
      type: 'sunday',
      season: 'Cuaresma'
    });
  }
  
  // Domingo de Ramos
  const palmSunday = new Date(easter);
  palmSunday.setDate(easter.getDate() - 7);
  dates.push({
    name: 'Domingo de Ramos',
    date: palmSunday.toISOString().split('T')[0],
    type: 'sunday',
    season: 'Cuaresma'
  });
  
  // Semana Santa
  const holyThursday = new Date(easter);
  holyThursday.setDate(easter.getDate() - 3);
  dates.push({
    name: 'Jueves Santo',
    date: holyThursday.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Cuaresma'
  });
  
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  dates.push({
    name: 'Viernes Santo',
    date: goodFriday.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Cuaresma'
  });
  
  const holySaturday = new Date(easter);
  holySaturday.setDate(easter.getDate() - 1);
  dates.push({
    name: 'Sábado Santo - Vigilia Pascual',
    date: holySaturday.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Cuaresma'
  });
  
  // Pascua
  dates.push({
    name: 'Domingo de Resurrección',
    date: easter.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Pascua'
  });
  
  // Domingos de Pascua
  for (let i = 1; i < 7; i++) {
    const easterSunday = new Date(easter);
    easterSunday.setDate(easter.getDate() + (i * 7));
    dates.push({
      name: `${i + 1}° Domingo de Pascua`,
      date: easterSunday.toISOString().split('T')[0],
      type: 'sunday',
      season: 'Pascua'
    });
  }
  
  // Ascensión (40 días después de Pascua, o el 7° domingo de Pascua en algunos países)
  const ascension = new Date(easter);
  ascension.setDate(easter.getDate() + 42); // Domingo (7 semanas)
  dates.push({
    name: 'Ascensión del Señor',
    date: ascension.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Pascua'
  });
  
  // Pentecostés (50 días después de Pascua)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  dates.push({
    name: 'Pentecostés',
    date: pentecost.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Pascua'
  });
  
  // Santísima Trinidad (domingo después de Pentecostés)
  const trinity = new Date(pentecost);
  trinity.setDate(pentecost.getDate() + 7);
  dates.push({
    name: 'Solemnidad de la Santísima Trinidad',
    date: trinity.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Tiempo Ordinario'
  });
  
  // Corpus Christi (jueves o domingo después de la Trinidad, depende del país)
  const corpusChristi = new Date(trinity);
  corpusChristi.setDate(trinity.getDate() + 7); // Domingo siguiente
  dates.push({
    name: 'Solemnidad del Corpus Christi',
    date: corpusChristi.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Tiempo Ordinario'
  });
  
  // Sagrado Corazón (viernes después de Corpus Christi)
  const sacredHeart = new Date(corpusChristi);
  sacredHeart.setDate(corpusChristi.getDate() + 5);
  dates.push({
    name: 'Solemnidad del Sagrado Corazón de Jesús',
    date: sacredHeart.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Tiempo Ordinario'
  });
  
  // Cristo Rey (último domingo del año litúrgico, antes del primer domingo de Adviento)
  const christTheKing = new Date(firstAdvent);
  christTheKing.setDate(firstAdvent.getDate() - 7);
  dates.push({
    name: 'Solemnidad de Cristo Rey',
    date: christTheKing.toISOString().split('T')[0],
    type: 'solemnity',
    season: 'Tiempo Ordinario'
  });
  
  // Calcular domingos del Tiempo Ordinario
  // Tiempo Ordinario I: después del Bautismo del Señor hasta el Miércoles de Ceniza
  let currentDate = new Date(baptismOfLord);
  currentDate.setDate(currentDate.getDate() + 7);
  let weekNumber = 2;
  
  while (currentDate < ashWednesday) {
    if (currentDate.getDay() === 0) { // Es domingo
      dates.push({
        name: getOrdinaryTimeSundayName(weekNumber),
        date: currentDate.toISOString().split('T')[0],
        type: 'sunday',
        season: 'Tiempo Ordinario'
      });
      weekNumber++;
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Tiempo Ordinario II: después de Pentecostés hasta Cristo Rey
  currentDate = new Date(pentecost);
  currentDate.setDate(currentDate.getDate() + 7);
  
  while (currentDate <= christTheKing) {
    if (currentDate.getDay() === 0) { // Es domingo
      // Saltar los domingos ya asignados (Trinidad, Corpus Christi)
      const dateStr = currentDate.toISOString().split('T')[0];
      if (!dates.some(d => d.date === dateStr)) {
        dates.push({
          name: getOrdinaryTimeSundayName(weekNumber),
          date: dateStr,
          type: 'sunday',
          season: 'Tiempo Ordinario'
        });
        weekNumber++;
      }
    }
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return dates.sort((a, b) => a.date.localeCompare(b.date));
}

// Buscar la celebración litúrgica de una fecha específica
export function getLiturgicalDateForDate(date: string, customDates?: LiturgicalDate[]): string {
  const year = new Date(date).getFullYear();
  const allDates = [...calculateLiturgicalYear(year), ...(customDates || [])];
  
  const found = allDates.find(d => d.date === date);
  if (found) return found.name;
  
  // Si no se encuentra y es domingo, retornar vacío para permitir agregar personalizada
  const dateObj = new Date(date);
  if (dateObj.getDay() === 0) {
    return ''; // Es domingo pero no está en el calendario litúrgico
  }
  
  return ''; // No es domingo ni celebración especial
}

// Buscar la fecha de una celebración litúrgica por nombre
export function getDateForLiturgicalName(name: string, year: number, customDates?: LiturgicalDate[]): string | null {
  const allDates = [...calculateLiturgicalYear(year), ...(customDates || [])];
  const found = allDates.find(d => d.name === name);
  return found ? found.date : null;
}

// Verificar si una fecha es domingo
export function isSunday(date: string): boolean {
  return new Date(date).getDay() === 0;
}

// Obtener todas las celebraciones para un año (incluye personalizadas)
export function getAllLiturgicalDates(year: number, customDates?: LiturgicalDate[]): LiturgicalDate[] {
  return [...calculateLiturgicalYear(year), ...(customDates || [])].sort((a, b) => 
    a.date.localeCompare(b.date)
  );
}

// Obtener solo los nombres de las celebraciones para un selector
export function getLiturgicalDateNames(year: number, customDates?: LiturgicalDate[]): string[] {
  const allDates = getAllLiturgicalDates(year, customDates);
  return allDates.map(d => d.name);
}