/**
 * Genera el calendario litúrgico (Calendario Romano General) a un JSON estático
 * usando romcal v1 SOLO en build/dev. romcal v1 no trae locale español, así que
 * usamos sus cálculos (fecha, temporada, color, ciclo, rango) y ponemos los
 * NOMBRES en español nosotros (domingos por patrón, solemnidades por diccionario).
 *
 * Uso:  npm run gen:calendar
 * Salida:  src/data/liturgicalCalendar.generated.json
 *
 * Regenerar al ampliar el rango de años (YEAR_FROM..YEAR_TO).
 */
import Romcal from 'romcal';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../src/data/liturgicalCalendar.generated.json');

const YEAR_FROM = 2024;
const YEAR_TO = 2032;

// Solo nos interesan domingos + solemnidades/fiestas para el cantoral.
const KEEP_TYPES = new Set(['SUNDAY', 'SOLEMNITY', 'FEAST']);
const RANK_ORDER = { SOLEMNITY: 3, FEAST: 2, SUNDAY: 1 };

const SEASON_ES = {
  ADVENT: 'Adviento',
  CHRISTMASTIDE: 'Navidad',
  LENT: 'Cuaresma',
  EASTER: 'Pascua',
  'ORDINARY TIME': 'Tiempo Ordinario',
  PASCHALTRIDUUM: 'Triduo Pascual',
};

const COLOR_ES = {
  WHITE: 'white',
  RED: 'red',
  GREEN: 'green',
  PURPLE: 'violet',
  ROSE: 'rose',
  GOLD: 'gold',
  BLACK: 'black',
};

// Diccionario de nombres en español para celebraciones fijas (por `key` de romcal).
const NAME_ES = {
  easter: 'Domingo de Resurrección',
  easterSunday: 'Domingo de Resurrección',
  palmSunday: 'Domingo de Ramos',
  pentecostSunday: 'Pentecostés',
  ashWednesday: 'Miércoles de Ceniza',
  holyThursday: 'Jueves Santo',
  goodFriday: 'Viernes Santo',
  holySaturday: 'Sábado Santo',
  christmas: 'Natividad del Señor',
  maryMotherOfGod: 'Santa María, Madre de Dios',
  epiphany: 'Epifanía del Señor',
  theBaptismOfTheLord: 'Bautismo del Señor',
  baptismOfTheLord: 'Bautismo del Señor',
  ascension: 'Ascensión del Señor',
  ascensionOfTheLord: 'Ascensión del Señor',
  trinitySunday: 'Santísima Trinidad',
  holyTrinity: 'Santísima Trinidad',
  corpusChristi: 'Corpus Christi',
  mostSacredHeartOfJesus: 'Sagrado Corazón de Jesús',
  sacredHeartOfJesus: 'Sagrado Corazón de Jesús',
  ourLordJesusChristKingOfTheUniverse: 'Jesucristo, Rey del Universo',
  christTheKing: 'Jesucristo, Rey del Universo',
  divineMercySunday: 'Domingo de la Divina Misericordia (2.º de Pascua)',
  birthOfJohnTheBaptist: 'Natividad de San Juan Bautista',
  easterMonday: 'Lunes de la Octava de Pascua',
  easterTuesday: 'Martes de la Octava de Pascua',
  easterWednesday: 'Miércoles de la Octava de Pascua',
  easterThursday: 'Jueves de la Octava de Pascua',
  easterFriday: 'Viernes de la Octava de Pascua',
  easterSaturday: 'Sábado de la Octava de Pascua',
  immaculateConception: 'Inmaculada Concepción de la Virgen María',
  assumption: 'Asunción de la Virgen María',
  assumptionOfTheBlessedVirginMary: 'Asunción de la Virgen María',
  allSaints: 'Todos los Santos',
  holyFamily: 'Sagrada Familia',
  annunciation: 'Anunciación del Señor',
  nativityOfJohnTheBaptist: 'Natividad de San Juan Bautista',
  peterAndPaulApostles: 'San Pedro y San Pablo, Apóstoles',
  transfiguration: 'Transfiguración del Señor',
  exaltationOfTheHolyCross: 'Exaltación de la Santa Cruz',
  presentationOfTheLord: 'Presentación del Señor',
  josephHusbandOfMary: 'San José, Esposo de la Virgen María',
};

const SUNDAY_SEASON_ES = {
  Advent: 'Adviento',
  Lent: 'Cuaresma',
  Easter: 'Pascua',
  OrdinaryTime: 'Tiempo Ordinario',
};

/** Nombre en español de una celebración a partir de su `key`/`name`/`season`. */
function spanishName(entry) {
  const key = entry.key || '';
  if (NAME_ES[key]) return NAME_ES[key];

  // Domingos numerados: "11ThSundayOfOrdinaryTime" → "11.º Domingo del Tiempo Ordinario"
  const m = key.match(/^(\d+)\D*SundayOf(Advent|Lent|Easter|OrdinaryTime)$/i);
  if (m) {
    const n = parseInt(m[1], 10);
    const seasonKey = Object.keys(SUNDAY_SEASON_ES).find(
      (s) => s.toLowerCase() === m[2].toLowerCase()
    );
    const seasonEs = SUNDAY_SEASON_ES[seasonKey] || m[2];
    const prep = seasonEs === 'Tiempo Ordinario' ? 'del' : 'de';
    return `${n}.º Domingo ${prep} ${seasonEs}`;
  }

  // Fallback: nombre en inglés de romcal (raro; celebraciones menores).
  return entry.name;
}

/** Extrae 'YYYY-MM-DD' del campo moment de romcal (moment | Date | ISO string).
 *  romcal guarda las fechas a medianoche UTC, así que toISOString().slice(0,10)
 *  devuelve el día litúrgico correcto sin corrimiento de zona horaria. */
function toYmd(m) {
  if (!m) return null;
  if (typeof m === 'string') return m.slice(0, 10);
  if (typeof m.format === 'function') return m.format('YYYY-MM-DD');
  const d = m instanceof Date ? m : new Date(typeof m.valueOf === 'function' ? m.valueOf() : m);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function normalizeColor(meta) {
  const k = meta?.liturgicalColor?.key;
  return (k && COLOR_ES[k.toUpperCase()]) || 'green';
}

function normalizeSeason(data) {
  const raw = String(data?.season?.key || data?.season?.value || '');
  if (/ordinary\s*time/i.test(raw)) return 'Tiempo Ordinario';
  if (/holy\s*week/i.test(raw)) return 'Semana Santa';
  if (/paschal\s*triduum|triduum/i.test(raw)) return 'Triduo Pascual';
  const up = raw.toUpperCase();
  return SEASON_ES[up] || SEASON_ES[up.replace('TIDE', '')] || (raw || 'Tiempo Ordinario');
}

function normalizeCycle(meta) {
  // cycle.value: "Year A" | "Year B" | "Year C"
  const v = meta?.cycle?.value || '';
  const m = String(v).match(/Year\s+([ABC])/i);
  return m ? m[1].toUpperCase() : null;
}

function run() {
  const byDate = new Map(); // 'YYYY-MM-DD' → entry (mayor rango gana)

  for (let year = YEAR_FROM; year <= YEAR_TO; year++) {
    const dates = Romcal.calendarFor({ year, country: 'general', locale: 'en' });
    for (const d of dates) {
      if (!KEEP_TYPES.has(d.type)) continue;
      const date = toYmd(d.moment);
      if (!date) continue;
      const entry = {
        date,
        key: d.key,
        type: d.type,
        name: spanishName(d),
        season: normalizeSeason(d.data),
        color: normalizeColor(d.data?.meta),
        cycle: normalizeCycle(d.data?.meta),
      };
      const prev = byDate.get(date);
      if (!prev || (RANK_ORDER[entry.type] || 0) > (RANK_ORDER[prev.type] || 0)) {
        byDate.set(date, entry);
      }
    }
  }

  const out = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 0) + '\n', 'utf8');
  console.log(`✓ ${out.length} celebraciones (${YEAR_FROM}–${YEAR_TO}) → ${OUT}`);
}

run();
