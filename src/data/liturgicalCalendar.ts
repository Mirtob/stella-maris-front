import { parseYmdLocal, getTodayLocal } from '../utils/dateLocal';
export interface LiturgicalEvent {
  id: string;
  name: string;
  date: string; // Formato: YYYY-MM-DD
  type: 'Solemnidad' | 'Fiesta' | 'Domingo' | 'Feria';
  color: 'Blanco' | 'Rojo' | 'Verde' | 'Morado' | 'Rosa';
  season: 'Adviento' | 'Navidad' | 'Cuaresma' | 'Pascua' | 'Tiempo Ordinario';
  importance: 'high' | 'medium' | 'low';
  description?: string;
  alertEnabled?: boolean; // Si se debe alertar sobre este evento
  alertDaysBefore?: number; // Días de anticipación para la alerta
}

// Calendario Litúrgico 2026
export const liturgicalCalendar2026: LiturgicalEvent[] = [
  // ADVIENTO
  {
    id: 'adv1',
    name: '1° Domingo de Adviento',
    date: '2025-11-30',
    type: 'Domingo',
    color: 'Morado',
    season: 'Adviento',
    importance: 'medium',
    description: 'Inicio del Año Litúrgico'
  },
  {
    id: 'adv2',
    name: '2° Domingo de Adviento',
    date: '2025-12-07',
    type: 'Domingo',
    color: 'Morado',
    season: 'Adviento',
    importance: 'medium'
  },
  {
    id: 'inmaculada',
    name: 'Inmaculada Concepción de la Virgen María',
    date: '2025-12-08',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Adviento',
    importance: 'high',
    description: 'La Inmaculada Concepción de la Bienaventurada Virgen María'
  },
  {
    id: 'adv3',
    name: '3° Domingo de Adviento (Gaudete)',
    date: '2025-12-14',
    type: 'Domingo',
    color: 'Rosa',
    season: 'Adviento',
    importance: 'medium',
    description: 'Domingo de la alegría'
  },
  {
    id: 'adv4',
    name: '4° Domingo de Adviento',
    date: '2025-12-21',
    type: 'Domingo',
    color: 'Morado',
    season: 'Adviento',
    importance: 'medium'
  },

  // NAVIDAD
  {
    id: 'navidad1',
    name: 'Natividad del Señor (Nochebuena)',
    date: '2025-12-24',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'high',
    description: 'Misa de la Noche'
  },
  {
    id: 'navidad2',
    name: 'Natividad del Señor (Día)',
    date: '2025-12-25',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'high',
    description: 'Nacimiento de Jesús'
  },
  {
    id: 'sagfam',
    name: 'Sagrada Familia de Jesús, María y José',
    date: '2025-12-28',
    type: 'Fiesta',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'medium'
  },
  {
    id: 'madre1',
    name: 'Santa María, Madre de Dios',
    date: '2026-01-01',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'high',
    description: 'Octava de Navidad'
  },
  {
    id: 'epifania',
    name: 'Epifanía del Señor',
    date: '2026-01-04',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'high',
    description: 'Manifestación del Señor a los Magos'
  },
  {
    id: 'bautismo',
    name: 'Bautismo del Señor',
    date: '2026-01-11',
    type: 'Fiesta',
    color: 'Blanco',
    season: 'Navidad',
    importance: 'medium',
    description: 'Fin del Tiempo de Navidad'
  },

  // TIEMPO ORDINARIO (Primera parte)
  {
    id: 'to2',
    name: '2° Domingo del Tiempo Ordinario',
    date: '2026-01-18',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to3',
    name: '3° Domingo del Tiempo Ordinario',
    date: '2026-01-25',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to4',
    name: '4° Domingo del Tiempo Ordinario',
    date: '2026-02-01',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to5',
    name: '5° Domingo del Tiempo Ordinario',
    date: '2026-02-08',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to6',
    name: '6° Domingo del Tiempo Ordinario',
    date: '2026-02-15',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'candelaria',
    name: 'Presentación del Señor',
    date: '2026-02-02',
    type: 'Fiesta',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'medium',
    description: 'La Candelaria'
  },

  // CUARESMA
  {
    id: 'ceniza',
    name: 'Miércoles de Ceniza',
    date: '2026-02-18',
    type: 'Feria',
    color: 'Morado',
    season: 'Cuaresma',
    importance: 'high',
    description: 'Inicio de la Cuaresma'
  },
  {
    id: 'cuar1',
    name: '1° Domingo de Cuaresma',
    date: '2026-02-22',
    type: 'Domingo',
    color: 'Morado',
    season: 'Cuaresma',
    importance: 'medium'
  },
  {
    id: 'cuar2',
    name: '2° Domingo de Cuaresma',
    date: '2026-03-01',
    type: 'Domingo',
    color: 'Morado',
    season: 'Cuaresma',
    importance: 'medium'
  },
  {
    id: 'cuar3',
    name: '3° Domingo de Cuaresma',
    date: '2026-03-08',
    type: 'Domingo',
    color: 'Morado',
    season: 'Cuaresma',
    importance: 'medium'
  },
  {
    id: 'cuar4',
    name: '4° Domingo de Cuaresma (Laetare)',
    date: '2026-03-15',
    type: 'Domingo',
    color: 'Rosa',
    season: 'Cuaresma',
    importance: 'medium',
    description: 'Domingo de la alegría'
  },
  {
    id: 'cuar5',
    name: '5° Domingo de Cuaresma',
    date: '2026-03-22',
    type: 'Domingo',
    color: 'Morado',
    season: 'Cuaresma',
    importance: 'medium'
  },
  {
    id: 'ramos',
    name: 'Domingo de Ramos',
    date: '2026-03-29',
    type: 'Domingo',
    color: 'Rojo',
    season: 'Cuaresma',
    importance: 'high',
    description: 'Entrada triunfal de Jesús en Jerusalén'
  },

  // SEMANA SANTA
  {
    id: 'jueves',
    name: 'Jueves Santo',
    date: '2026-04-02',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'high',
    description: 'Misa de la Cena del Señor'
  },
  {
    id: 'viernes',
    name: 'Viernes Santo',
    date: '2026-04-03',
    type: 'Solemnidad',
    color: 'Rojo',
    season: 'Pascua',
    importance: 'high',
    description: 'Pasión y Muerte del Señor'
  },
  {
    id: 'sabado',
    name: 'Sábado Santo - Vigilia Pascual',
    date: '2026-04-04',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'high',
    description: 'Madre de todas las Vigilias'
  },

  // PASCUA
  {
    id: 'pascua',
    name: 'Domingo de Resurrección',
    date: '2026-04-05',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'high',
    description: 'Resurrección del Señor'
  },
  {
    id: 'pasc2',
    name: '2° Domingo de Pascua (Divina Misericordia)',
    date: '2026-04-12',
    type: 'Domingo',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'medium'
  },
  {
    id: 'pasc3',
    name: '3° Domingo de Pascua',
    date: '2026-04-19',
    type: 'Domingo',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'medium'
  },
  {
    id: 'pasc4',
    name: '4° Domingo de Pascua',
    date: '2026-04-26',
    type: 'Domingo',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'medium',
    description: 'Domingo del Buen Pastor'
  },
  {
    id: 'pasc5',
    name: '5° Domingo de Pascua',
    date: '2026-05-03',
    type: 'Domingo',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'medium'
  },
  {
    id: 'pasc6',
    name: '6° Domingo de Pascua',
    date: '2026-05-10',
    type: 'Domingo',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'medium'
  },
  {
    id: 'ascension',
    name: 'Ascensión del Señor',
    date: '2026-05-14',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Pascua',
    importance: 'high',
    description: 'Ascensión de Jesús al Cielo'
  },
  {
    id: 'pentecostes',
    name: 'Pentecostés',
    date: '2026-05-24',
    type: 'Solemnidad',
    color: 'Rojo',
    season: 'Pascua',
    importance: 'high',
    description: 'Venida del Espíritu Santo'
  },

  // TIEMPO ORDINARIO (Segunda parte)
  {
    id: 'trinidad',
    name: 'Santísima Trinidad',
    date: '2026-05-31',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high'
  },
  {
    id: 'corpus',
    name: 'Santísimo Cuerpo y Sangre de Cristo (Corpus Christi)',
    date: '2026-06-04',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high',
    description: 'Corpus Christi'
  },
  {
    id: 'corazon',
    name: 'Sagrado Corazón de Jesús',
    date: '2026-06-12',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high'
  },
  {
    id: 'to10',
    name: '10° Domingo del Tiempo Ordinario',
    date: '2026-06-07',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to11',
    name: '11° Domingo del Tiempo Ordinario',
    date: '2026-06-14',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to12',
    name: '12° Domingo del Tiempo Ordinario',
    date: '2026-06-21',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to13',
    name: '13° Domingo del Tiempo Ordinario',
    date: '2026-06-28',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'pedro',
    name: 'San Pedro y San Pablo',
    date: '2026-06-29',
    type: 'Solemnidad',
    color: 'Rojo',
    season: 'Tiempo Ordinario',
    importance: 'high'
  },
  {
    id: 'to14',
    name: '14° Domingo del Tiempo Ordinario',
    date: '2026-07-05',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to15',
    name: '15° Domingo del Tiempo Ordinario',
    date: '2026-07-12',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to16',
    name: '16° Domingo del Tiempo Ordinario',
    date: '2026-07-19',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to17',
    name: '17° Domingo del Tiempo Ordinario',
    date: '2026-07-26',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to18',
    name: '18° Domingo del Tiempo Ordinario',
    date: '2026-08-02',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to19',
    name: '19° Domingo del Tiempo Ordinario',
    date: '2026-08-09',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'asuncion',
    name: 'Asunción de la Virgen María',
    date: '2026-08-15',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high',
    description: 'Asunción de María al Cielo'
  },
  {
    id: 'to20',
    name: '20° Domingo del Tiempo Ordinario',
    date: '2026-08-16',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to21',
    name: '21° Domingo del Tiempo Ordinario',
    date: '2026-08-23',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to22',
    name: '22° Domingo del Tiempo Ordinario',
    date: '2026-08-30',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to23',
    name: '23° Domingo del Tiempo Ordinario',
    date: '2026-09-06',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to24',
    name: '24° Domingo del Tiempo Ordinario',
    date: '2026-09-13',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to25',
    name: '25° Domingo del Tiempo Ordinario',
    date: '2026-09-20',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to26',
    name: '26° Domingo del Tiempo Ordinario',
    date: '2026-09-27',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to27',
    name: '27° Domingo del Tiempo Ordinario',
    date: '2026-10-04',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to28',
    name: '28° Domingo del Tiempo Ordinario',
    date: '2026-10-11',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to29',
    name: '29° Domingo del Tiempo Ordinario',
    date: '2026-10-18',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to30',
    name: '30° Domingo del Tiempo Ordinario',
    date: '2026-10-25',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'todossantos',
    name: 'Todos los Santos',
    date: '2026-11-01',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high'
  },
  {
    id: 'fieles',
    name: 'Conmemoración de los Fieles Difuntos',
    date: '2026-11-02',
    type: 'Feria',
    color: 'Morado',
    season: 'Tiempo Ordinario',
    importance: 'medium',
    description: 'Día de los Muertos'
  },
  {
    id: 'to32',
    name: '32° Domingo del Tiempo Ordinario',
    date: '2026-11-08',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'to33',
    name: '33° Domingo del Tiempo Ordinario',
    date: '2026-11-15',
    type: 'Domingo',
    color: 'Verde',
    season: 'Tiempo Ordinario',
    importance: 'low'
  },
  {
    id: 'cristorey',
    name: 'Nuestro Señor Jesucristo, Rey del Universo',
    date: '2026-11-22',
    type: 'Solemnidad',
    color: 'Blanco',
    season: 'Tiempo Ordinario',
    importance: 'high',
    description: 'Cristo Rey - Fin del Año Litúrgico'
  },
  {
    id: 'guadalupe',
    name: 'Nuestra Señora de Guadalupe',
    date: '2026-12-12',
    type: 'Fiesta',
    color: 'Blanco',
    season: 'Adviento',
    importance: 'high',
    description: 'Patrona de América'
  },
];

// Obtener solemnidades que requieren alertas (4 semanas antes)
export function getUpcomingSolemnities(daysAhead: number = 28): LiturgicalEvent[] {
  // Medianoche local a ambos lados (ver utils/dateLocal): con `new Date('YYYY-MM-DD')`
  // la fecha se parsea en UTC y en Chile cae el día anterior, así que la celebración
  // de HOY se quedaba fuera de "las próximas".
  const hoy = parseYmdLocal(getTodayLocal());
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + daysAhead);

  return liturgicalCalendar2026.filter(event => {
    const eventDate = parseYmdLocal(event.date);
    return event.importance === 'high' &&
           eventDate >= hoy &&
           eventDate <= hasta;
  });
}

// Obtener eventos por mes
export function getEventsByMonth(month: number, year: number = 2026): LiturgicalEvent[] {
  return liturgicalCalendar2026.filter(event => {
    // Local: en UTC, un evento del día 1 caía en el mes anterior.
    const eventDate = parseYmdLocal(event.date);
    return eventDate.getMonth() === month && eventDate.getFullYear() === year;
  });
}

// Obtener color litúrgico por fecha
export function getLiturgicalColor(date: string): string {
  const event = liturgicalCalendar2026.find(e => e.date === date);
  return event ? event.color : 'Verde';
}