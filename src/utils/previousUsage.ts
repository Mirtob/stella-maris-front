import { PublishedCantoral } from '../types';
import { getLiturgicalInfoForDate } from './liturgicalCalendar';

export interface UsageOccurrence {
  parts: string[];
  /** "la semana pasada" · "hace 3 semanas" · "Navidad 2024" */
  label: string;
  /** true = misma celebración ANUAL de otro año; false = ventana semanal reciente. */
  annual: boolean;
}

export interface PreviousUsage {
  byId: Record<string, { title: string; occ: UsageOccurrence[] }>;
}

const baseId = (id: string) => (id || '').split('::')[0];
const norm = (s?: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYmd(s: string): Date {
  const [y, m, d] = (s || '').split('-').map(Number);
  return new Date(y || 1970, (m || 1) - 1, d || 1);
}

/**
 * Nombre de la celebración ANUAL (solemnidad/fiesta) que el coro está por armar, o null
 * si es un domingo ordinario. Prioriza la fecha del día especial elegido en el
 * constructor; si no, busca una solemnidad/fiesta en hoy + los próximos 8 días (cubre el
 * domingo próximo y solemnidades entre semana como Navidad o los oficios de Semana Santa).
 */
export function resolveAnnualTarget(todayYmd: string, selectedDate?: string | null): { name: string; date: string } | null {
  const check = (dateStr: string) => {
    const info = getLiturgicalInfoForDate(dateStr);
    if (info && (info.type === 'SOLEMNITY' || info.type === 'FEAST')) return { name: info.name, date: dateStr };
    return null;
  };
  if (selectedDate) {
    const r = check(selectedDate);
    if (r) return r;
  }
  const today = parseYmd(todayYmd);
  for (let i = 0; i <= 8; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const r = check(ymd(d));
    if (r) return r;
  }
  return null;
}

/**
 * Uso de cada canto en el conjunto de referencia para avisar repeticiones al armar:
 *   - VENTANA SEMANAL: los últimos `weeks` (4) cantorales publicados (domingo a domingo).
 *   - MISMA CELEBRACIÓN ANUAL: si `annualName` viene, cantorales de años previos con esa
 *     misma celebración (Cristo Rey, Navidad, oficios de Semana Santa, etc.).
 * Excluye el cantoral en edición.
 */
export function computeUsage(
  cantorals: PublishedCantoral[],
  opts: { excludeId?: string | null; todayYmd: string; weeks?: number; annualName?: string | null },
): PreviousUsage {
  const weeks = opts.weeks ?? 4;
  const today = parseYmd(opts.todayYmd);
  const published = cantorals.filter((c) => c.status === 'published' && c.id !== opts.excludeId);

  const byId: PreviousUsage['byId'] = {};
  const addCantoral = (c: PublishedCantoral, label: string, annual: boolean) => {
    const parts: Record<string, string[]> = {};
    for (const s of c.songs ?? []) {
      const id = baseId(s.id);
      if (!id) continue;
      (parts[id] ??= []);
      if (s.category && !parts[id].includes(s.category)) parts[id].push(s.category);
      if (!byId[id]) byId[id] = { title: s.title, occ: [] };
    }
    for (const id of Object.keys(parts)) {
      if (parts[id].length) byId[id].occ.push({ parts: parts[id], label, annual });
    }
  };

  // Ventana semanal: los `weeks` cantorales pasados más recientes.
  const weekly = published
    .filter((c) => c.date <= opts.todayYmd)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, weeks);
  const weeklyIds = new Set(weekly.map((c) => c.id));
  for (const c of weekly) {
    const w = Math.max(1, Math.round((today.getTime() - parseYmd(c.date).getTime()) / (7 * 86400000)));
    addCantoral(c, w <= 1 ? 'la semana pasada' : `hace ${w} semanas`, false);
  }

  // Misma celebración anual en años previos.
  if (opts.annualName) {
    const target = norm(opts.annualName);
    const annual = published
      .filter((c) => !weeklyIds.has(c.id) && c.date <= opts.todayYmd && norm(c.liturgicalDate) === target)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    for (const c of annual) addCantoral(c, `${c.liturgicalDate} ${c.date.slice(0, 4)}`, true);
  }

  return { byId };
}

export function previousUseOf(usage: PreviousUsage | null | undefined, songId: string) {
  if (!usage) return undefined;
  return usage.byId[baseId(songId)];
}
