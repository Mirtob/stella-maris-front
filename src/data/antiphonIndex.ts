import { ANTIPHON_INDEX_DATA, type AntiphonEntryData } from './antiphonIndex.data';

/**
 * Antífonas de entrada y de comunión del Misal, por celebración.
 *
 * Son el texto PROPIO de cada día: cambian cada domingo, como el salmo. El coro las
 * puede cantar además del canto de entrada —la antífona va después— y al empezar la
 * comunión. Aquí solo se guardan y se resuelven; quién las canta y si se imprimen en el
 * folleto lo decide el coro en el constructor.
 *
 * Los datos los genera `scripts/import-antifonas.py` desde los propios del año en PDF
 * (liturgiapapal.org). El archivo `.data.ts` NO se edita a mano.
 *
 * COBERTURA: los seis PDF son del propio del TIEMPO (Adviento → Tiempo Ordinario), así
 * que están todos los domingos y las solemnidades del Señor. El santoral (San Pedro y
 * San Pablo, la Asunción, Todos los Santos…) no está en esa fuente, y para esos días la
 * caja aparece vacía y el coro escribe lo que corresponda.
 */
export type AntiphonEntry = AntiphonEntryData;

/**
 * Etiqueta del calendario de la app → clave del índice, cuando difieren.
 * Mismo mecanismo que `CELEBRATION_ALIASES` en psalmIndex.ts.
 */
const CELEBRATION_ALIASES: Record<string, string> = {
  // El Misal la titula por el domingo; la app, por su advocación.
  'Domingo de la Divina Misericordia (2.º de Pascua)': '2.º Domingo de Pascua',
  'Natividad del Señor': 'Natividad del Señor (Misa del día)',
};

/** Normaliza para emparejar pese a acentos, mayúsculas y puntuación. */
const normKey = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();

// Índice normalizado, armado una sola vez en el primer uso.
let normalizado: Record<string, AntiphonEntry> | null = null;
function indiceNormalizado(): Record<string, AntiphonEntry> {
  if (!normalizado) {
    normalizado = {};
    for (const [k, v] of Object.entries(ANTIPHON_INDEX_DATA)) normalizado[normKey(k)] = v;
  }
  return normalizado;
}

/**
 * Las antífonas de una celebración. `null` si esa celebración no está en la fuente
 * (santoral, o una celebración agregada a mano por la parroquia).
 */
export function resolveAntiphons(celebration: string): AntiphonEntry | null {
  if (!celebration) return null;
  const key = CELEBRATION_ALIASES[celebration] ?? celebration;
  const entry = ANTIPHON_INDEX_DATA[key] ?? indiceNormalizado()[normKey(key)];
  if (!entry) return null;
  if (!entry.entrada && !entry.comunion) return null;
  return entry;
}

/** Texto con su cita, como se muestra y como va al folleto: «Texto» (Cf. Sal 65, 4). */
export function conCita(texto?: string, cita?: string): string {
  const t = (texto ?? '').trim();
  if (!t) return '';
  const c = (cita ?? '').trim();
  return c ? `${t} (${c})` : t;
}

/** ¿Hay antífonas cargadas? (para no ofrecer la sección si el índice quedó vacío). */
export function antiphonsReady(): boolean {
  return Object.keys(ANTIPHON_INDEX_DATA).length > 0;
}
