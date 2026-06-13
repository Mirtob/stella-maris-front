/**
 * Local date helpers — avoid the classic timezone trap of
 * `new Date().toISOString().split('T')[0]` which gives the UTC date,
 * not the date the user actually sees on their wall clock.
 *
 * Example of the bug: user in Chile (UTC-3) at 22:00 on Friday June 5
 * would get '2026-06-06' from the naïve approach, publishing the cantoral
 * for the wrong day.
 */

/** Today's date as 'YYYY-MM-DD' in the user's local timezone. */
export function getTodayLocal(): string {
  const d = new Date();
  return formatYmdLocal(d);
}

/** Format any Date object as 'YYYY-MM-DD' using local timezone components. */
export function formatYmdLocal(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Parse a 'YYYY-MM-DD' string as a local Date (midnight in the user's TZ).
 * Avoids the trap where `new Date('2026-06-05')` is parsed as UTC midnight,
 * which displays as the previous day in any negative-offset timezone.
 */
export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Format 'YYYY-MM-DD' for display (e.g. "viernes, 5 de junio de 2026"). */
export function formatYmdForDisplay(
  ymd: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
): string {
  if (!ymd) return '';
  try {
    return parseYmdLocal(ymd).toLocaleDateString('es-ES', options);
  } catch {
    return ymd;
  }
}

/** Suma (o resta, con n negativo) días a un 'YYYY-MM-DD' respetando la TZ local. */
export function addDaysLocal(ymd: string, n: number): string {
  const d = parseYmdLocal(ymd);
  d.setDate(d.getDate() + n);
  return formatYmdLocal(d);
}

/**
 * Rango de la semana (Lunes–Domingo) que contiene a `ref` (default hoy),
 * como 'YYYY-MM-DD'. Se normaliza para que Lunes=0 … Domingo=6.
 */
export function getWeekRangeLocal(ref: Date = new Date()): { start: string; end: string } {
  // getDay(): Domingo=0 … Sábado=6. (getDay()+6)%7 → Lunes=0 … Domingo=6.
  const dayIdx = (ref.getDay() + 6) % 7;
  const monday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - dayIdx);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  return { start: formatYmdLocal(monday), end: formatYmdLocal(sunday) };
}

/**
 * ¿Está `ymd` dentro de [startYmd, endYmd] inclusive?
 * Compara strings 'YYYY-MM-DD' lexicográficamente (válido para fechas ISO ordenadas)
 * para evitar el corrimiento de día de `new Date(str)`.
 */
export function isWithinInclusive(ymd: string, startYmd: string, endYmd: string): boolean {
  return ymd >= startYmd && ymd <= endYmd;
}
