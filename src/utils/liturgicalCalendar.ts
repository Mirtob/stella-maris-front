// Calendario litúrgico católico (Calendario Romano General).
//
// Los datos provienen de `data/liturgicalCalendar.generated.json`, generado en
// build/dev con romcal vía `npm run gen:calendar` (ver scripts/genLiturgicalCalendar.mjs).
// romcal aporta el cómputo correcto (fechas, temporada, color, ciclo) y los
// nombres en español los pone el script. Aquí solo se consulta el JSON.
//
// Para años fuera del rango generado se cae al cálculo hand-rolled (algoritmo de
// Pascua) como respaldo, para que nunca falle.

import generated from '../data/liturgicalCalendar.generated.json';
import { parseYmdLocal, formatYmdLocal } from './dateLocal';

export interface LiturgicalDate {
  name: string;
  date: string; // 'YYYY-MM-DD'
  type: 'sunday' | 'solemnity' | 'feast' | 'weekday';
  season: string;
}

export interface LiturgicalInfo {
  date: string;
  key: string;
  type: string;
  name: string;
  season: string;
  color: string;       // 'green' | 'violet' | 'white' | 'red' | 'rose' | 'gold' | 'black'
  cycle: string | null; // 'A' | 'B' | 'C'
}

// ── Traducción de nombres que romcal deja en inglés ────────────────────────
// Cuando la localización `es` de romcal no tiene la entrada, cae al inglés. Aquí
// los pasamos a español para que toda la copy (constructor, calendario) esté en
// español. "Corpus Christi" se deja igual (uso común en español).
const ES_NAMES: Record<string, string> = {
  'Birth of the Blessed Virgin Mary': 'Natividad de la Santísima Virgen María',
  'Chair of Saint Peter, Apostle': 'Cátedra de San Pedro, Apóstol',
  'Conversion of Saint Paul, Apostle': 'Conversión de San Pablo, Apóstol',
  'Dedication of the Lateran Basilica': 'Dedicación de la Basílica de Letrán',
  'Holy Innocents, Martyrs': 'Santos Inocentes, Mártires',
  'Immaculate Heart of Mary': 'Inmaculado Corazón de María',
  'Saint Andrew the Apostle': 'San Andrés, Apóstol',
  'Saint Bartholomew the Apostle': 'San Bartolomé, Apóstol',
  'Saint Bridget of Sweden, Religious, Patron of Europe': 'Santa Brígida de Suecia, Religiosa, Patrona de Europa',
  'Saint James, Apostle': 'Santiago, Apóstol',
  'Saint John the Apostle and Evangelist': 'San Juan, Apóstol y Evangelista',
  'Saint Lawrence of Rome, Deacon and Martyr': 'San Lorenzo, Diácono y Mártir',
  'Saint Luke the Evangelist': 'San Lucas, Evangelista',
  'Saint Mark the Evangelist': 'San Marcos, Evangelista',
  'Saint Mary Magdalene': 'Santa María Magdalena',
  'Saint Matthew, Apostle and Evangelist': 'San Mateo, Apóstol y Evangelista',
  'Saint Matthias the Apostle': 'San Matías, Apóstol',
  'Saint Stephen, The First Martyr': 'San Esteban, Protomártir',
  'Saint Thomas the Apostle': 'Santo Tomás, Apóstol',
  'Saints Michael, Gabriel and Raphael, Archangels': 'Santos Arcángeles Miguel, Gabriel y Rafael',
  'Saints Philip and James, Apostles': 'Santos Felipe y Santiago, Apóstoles',
  'Saints Simon and Jude, Apostles': 'Santos Simón y Judas, Apóstoles',
  'The Exaltation of the Holy Cross': 'La Exaltación de la Santa Cruz',
  'Visitation of the Blessed Virgin Mary': 'La Visitación de la Santísima Virgen María',
};

function toEs(name: string): string {
  return ES_NAMES[name] ?? name;
}

// ── Índice de los datos generados ──────────────────────────────────────────
const GEN = (generated as LiturgicalInfo[]).map((e) => ({ ...e, name: toEs(e.name) }));
const byDate = new Map<string, LiturgicalInfo>(GEN.map((e) => [e.date, e]));
const GEN_YEARS = GEN.map((e) => parseInt(e.date.slice(0, 4), 10));
const GEN_MIN_YEAR = Math.min(...GEN_YEARS);
const GEN_MAX_YEAR = Math.max(...GEN_YEARS);

function inGeneratedRange(year: number): boolean {
  return year >= GEN_MIN_YEAR && year <= GEN_MAX_YEAR;
}

function genToLitDate(e: LiturgicalInfo): LiturgicalDate {
  const t = e.type.toLowerCase();
  const type: LiturgicalDate['type'] =
    t === 'solemnity' || t === 'feast' || t === 'sunday' ? (t as LiturgicalDate['type']) : 'weekday';
  return { name: e.name, date: e.date, type, season: e.season };
}

// ===========================================================================
// Fallback hand-rolled (solo para años fuera del rango generado)
// ===========================================================================

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

function getFirstSundayOfAdvent(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const dayOfWeek = christmas.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 28 : 21 + dayOfWeek;
  const firstAdvent = new Date(christmas);
  firstAdvent.setDate(christmas.getDate() - daysToSubtract);
  return firstAdvent;
}

/** Calendario de respaldo (domingos + solemnidades principales) para años sin datos romcal. */
export function calculateLiturgicalYear(year: number): LiturgicalDate[] {
  const dates: LiturgicalDate[] = [];
  const easter = calculateEaster(year);
  const firstAdvent = getFirstSundayOfAdvent(year);

  for (let i = 0; i < 4; i++) {
    const s = new Date(firstAdvent);
    s.setDate(firstAdvent.getDate() + i * 7);
    dates.push({ name: `${i + 1}.º Domingo de Adviento`, date: formatYmdLocal(s), type: 'sunday', season: 'Adviento' });
  }
  dates.push({ name: 'Natividad del Señor', date: `${year}-12-25`, type: 'solemnity', season: 'Navidad' });
  dates.push({ name: 'Santa María, Madre de Dios', date: `${year}-01-01`, type: 'solemnity', season: 'Navidad' });
  dates.push({ name: 'Epifanía del Señor', date: `${year}-01-06`, type: 'solemnity', season: 'Navidad' });

  const ash = new Date(easter); ash.setDate(easter.getDate() - 46);
  dates.push({ name: 'Miércoles de Ceniza', date: formatYmdLocal(ash), type: 'solemnity', season: 'Cuaresma' });
  for (let i = 0; i < 5; i++) {
    const s = new Date(easter); s.setDate(easter.getDate() - 42 + i * 7);
    dates.push({ name: `${i + 1}.º Domingo de Cuaresma`, date: formatYmdLocal(s), type: 'sunday', season: 'Cuaresma' });
  }
  const palm = new Date(easter); palm.setDate(easter.getDate() - 7);
  dates.push({ name: 'Domingo de Ramos', date: formatYmdLocal(palm), type: 'sunday', season: 'Cuaresma' });
  dates.push({ name: 'Domingo de Resurrección', date: formatYmdLocal(easter), type: 'solemnity', season: 'Pascua' });
  for (let i = 1; i < 7; i++) {
    const s = new Date(easter); s.setDate(easter.getDate() + i * 7);
    dates.push({ name: `${i + 1}.º Domingo de Pascua`, date: formatYmdLocal(s), type: 'sunday', season: 'Pascua' });
  }
  const pentecost = new Date(easter); pentecost.setDate(easter.getDate() + 49);
  dates.push({ name: 'Pentecostés', date: formatYmdLocal(pentecost), type: 'solemnity', season: 'Pascua' });

  return dates.sort((a, b) => a.date.localeCompare(b.date));
}

// ===========================================================================
// API pública (firmas estables — consumida por PublishCantoralModal)
// ===========================================================================

/** Info litúrgica completa de una fecha (nombre, temporada, color, ciclo). null si no hay dato. */
export function getLiturgicalInfoForDate(date: string): LiturgicalInfo | null {
  return byDate.get(date) ?? null;
}

/** Nombre de la celebración de una fecha; '' si no se encuentra (permite agregar custom). */
export function getLiturgicalDateForDate(date: string, customDates?: LiturgicalDate[]): string {
  const custom = customDates?.find((d) => d.date === date);
  if (custom) return custom.name;

  const hit = byDate.get(date);
  if (hit) return hit.name;

  const year = parseYmdLocal(date).getFullYear();
  if (!inGeneratedRange(year)) {
    const found = calculateLiturgicalYear(year).find((d) => d.date === date);
    if (found) return found.name;
  }
  return '';
}

/** Fecha 'YYYY-MM-DD' de una celebración por nombre, dentro (o cerca) de un año. */
export function getDateForLiturgicalName(name: string, year: number, customDates?: LiturgicalDate[]): string | null {
  const custom = customDates?.find((d) => d.name === name);
  if (custom) return custom.date;

  const sameYear = GEN.find((e) => e.name === name && e.date.startsWith(`${year}-`));
  if (sameYear) return sameYear.date;

  if (!inGeneratedRange(year)) {
    const found = calculateLiturgicalYear(year).find((d) => d.name === name);
    if (found) return found.date;
  }

  const any = GEN.find((e) => e.name === name);
  return any ? any.date : null;
}

export function isSunday(date: string): boolean {
  return parseYmdLocal(date).getDay() === 0;
}

/** Todas las celebraciones de un año (domingos + solemnidades/fiestas) + custom. */
export function getAllLiturgicalDates(year: number, customDates?: LiturgicalDate[]): LiturgicalDate[] {
  const base = inGeneratedRange(year)
    ? GEN.filter((e) => e.date.startsWith(`${year}-`)).map(genToLitDate)
    : calculateLiturgicalYear(year);
  return [...base, ...(customDates || [])].sort((a, b) => a.date.localeCompare(b.date));
}

/** Nombres de celebraciones de un año para el selector (orden cronológico, sin duplicados). */
export function getLiturgicalDateNames(year: number, customDates?: LiturgicalDate[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const d of getAllLiturgicalDates(year, customDates)) {
    if (!seen.has(d.name)) { seen.add(d.name); names.push(d.name); }
  }
  return names;
}
