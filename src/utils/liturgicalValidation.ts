// Validación litúrgica de un cantoral antes de publicar. Devuelve avisos NO
// bloqueantes: incoherencias entre los cantos elegidos y el tiempo litúrgico
// del día. Usa el calendario romcal (getLiturgicalInfoForDate) para temporada y
// rango, y reutiliza isLent para la detección de Cuaresma.

import { Song } from '../types';
import { getLiturgicalInfoForDate } from './liturgicalCalendar';
import { isLent } from './liturgicalSeason';
import { parseYmdLocal } from './dateLocal';

export interface LiturgicalWarning {
  level: 'warn' | 'info';
  code: string;
  message: string;
}

// Partes propias de la Misa (donde un canto no litúrgico no corresponde).
const MASS_PARTS = new Set([
  'Entrada', 'Kyrie', 'Gloria', 'Salmo', 'Aleluya', 'Post Evangelio',
  'Ofertorio', 'Santo', 'Padre Nuestro', 'Cordero de Dios', 'Comunión', 'Salida',
]);

export function validateCantoral(songs: Song[], ctx: { date: string }): LiturgicalWarning[] {
  const out: LiturgicalWarning[] = [];
  if (!songs.length || !ctx.date) return out;

  const info = getLiturgicalInfoForDate(ctx.date);
  const season = info?.season || '';
  const name = info?.name || '';
  const isSolemnityOrFeast = info ? info.type === 'SOLEMNITY' || info.type === 'FEAST' : false;
  const lent = isLent(parseYmdLocal(ctx.date));
  const advent = /adviento/i.test(season);

  const has = (category: string) => songs.some((s) => s.category === category);

  // Gloria: se omite en Adviento y Cuaresma (salvo solemnidades y fiestas).
  if (has('Gloria') && (advent || lent) && !isSolemnityOrFeast) {
    out.push({
      level: 'warn',
      code: 'gloria-omit',
      message: `El Gloria se omite durante ${advent ? 'el Adviento' : 'la Cuaresma'} (salvo solemnidades y fiestas).`,
    });
  }

  // Aleluya: en Cuaresma se sustituye por la Aclamación al Evangelio.
  if (has('Aleluya') && lent) {
    out.push({
      level: 'warn',
      code: 'alleluia-lent',
      message: 'En Cuaresma el Aleluya se sustituye por la Aclamación al Evangelio.',
    });
  }

  // Secuencia: obligatoria en Pascua y Pentecostés.
  const hasSequence = songs.some((s) => s.category === 'Secuencia' || /secuencia/i.test(s.title));
  if (/resurrecci|pentecost/i.test(name) && !hasSequence) {
    const which = /pentecost/i.test(name) ? 'Veni Sancte Spiritus' : 'Victimæ Paschali Laudes';
    out.push({ level: 'info', code: 'sequence', message: `Considera incluir la Secuencia (${which}).` });
  }

  // Canto no litúrgico colocado en una parte de la Misa.
  const nonLit = songs.filter((s) => s.isLiturgical === false && MASS_PARTS.has(s.category));
  if (nonLit.length) {
    const titles = nonLit.map((s) => s.title).slice(0, 3).join(', ');
    out.push({
      level: 'warn',
      code: 'non-liturgical',
      message: `Hay ${nonLit.length} canto(s) no litúrgico(s) en partes de la Misa: ${titles}${nonLit.length > 3 ? '…' : ''}.`,
    });
  }

  // Partes habituales faltantes (informativo).
  const missing: string[] = [];
  (['Entrada', 'Santo', 'Cordero de Dios', 'Comunión'] as const).forEach((p) => {
    if (!has(p)) missing.push(p);
  });
  if (missing.length) {
    out.push({ level: 'info', code: 'missing-parts', message: `Faltan partes habituales: ${missing.join(', ')}.` });
  }

  return out;
}
