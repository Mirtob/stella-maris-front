/**
 * Ciclo dominical del Leccionario (Año A / B / C) para una fecha dada.
 *
 * El año litúrgico empieza el 1.er Domingo de Adviento (el domingo anterior más las 3
 * semanas previas al 4.º de Adviento, que es el domingo que cae en/antes del 24-dic). El
 * ciclo se determina por el año CIVIL en que TERMINA el año litúrgico:
 *   año_fin % 3 → 1 = A · 2 = B · 0 = C.
 * (Ej.: el año litúrgico que termina en 2023 es A; 2024 es B; 2025 es C.)
 */
export type SundayCycle = 'A' | 'B' | 'C';

/** Domingo que cae en o antes de la fecha dada (00:00 local). */
function sundayOnOrBefore(d: Date): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  r.setDate(r.getDate() - r.getDay()); // getDay(): 0 = domingo
  return r;
}

/** 1.er Domingo de Adviento del año civil `year`. */
export function firstSundayOfAdvent(year: number): Date {
  // 4.º Domingo de Adviento = domingo en o antes del 24-dic; Adviento I = 21 días antes.
  const fourth = sundayOnOrBefore(new Date(year, 11, 24));
  fourth.setDate(fourth.getDate() - 21);
  return fourth;
}

/** Ciclo dominical (A/B/C) para la fecha dada. Acepta Date o 'YYYY-MM-DD'. */
export function getSundayCycle(input: Date | string): SundayCycle {
  const d = typeof input === 'string'
    ? new Date(Number(input.slice(0, 4)), Number(input.slice(5, 7)) - 1, Number(input.slice(8, 10)))
    : new Date(input.getFullYear(), input.getMonth(), input.getDate());
  const y = d.getFullYear();
  const yearEnd = d >= firstSundayOfAdvent(y) ? y + 1 : y;
  const m = yearEnd % 3;
  return m === 1 ? 'A' : m === 2 ? 'B' : 'C';
}
