import { getCurrentLiturgicalSeason } from './liturgicalSeason';
import { getLiturgicalColorId, type LiturgicalColorId } from './liturgicalColors';
import { parseYmdLocal } from './dateLocal';

/** Colores del folleto: rótulos, cenefas y líneas de separación. */
export interface ColoresFolleto {
  primary: [number, number, number];   // color principal (cabeceras, líneas)
  light: [number, number, number];     // fondo claro
  textOnPrimary: [number, number, number]; // texto sobre primary
  /** El tiempo litúrgico, para la portada ("Tiempo: Tiempo Ordinario"). */
  seasonName: string;
}

/**
 * Tinta de cada color litúrgico. El blanco no se puede imprimir sobre papel blanco, así
 * que se representa en DORADO, como en los ornamentos de las solemnidades.
 */
const TINTA: Record<LiturgicalColorId, Omit<ColoresFolleto, 'seasonName'>> = {
  green: { primary: [21, 128, 61], light: [220, 252, 231], textOnPrimary: [255, 255, 255] },
  violet: { primary: [91, 33, 182], light: [237, 233, 254], textOnPrimary: [255, 255, 255] },
  white: { primary: [180, 130, 32], light: [254, 243, 199], textOnPrimary: [255, 255, 255] },
  gold: { primary: [180, 130, 32], light: [254, 243, 199], textOnPrimary: [255, 255, 255] },
  red: { primary: [185, 28, 28], light: [254, 226, 226], textOnPrimary: [255, 255, 255] },
  rose: { primary: [190, 24, 93], light: [252, 231, 243], textOnPrimary: [255, 255, 255] },
  black: { primary: [55, 65, 81], light: [229, 231, 235], textOnPrimary: [255, 255, 255] },
};

/**
 * Colores del folleto para la fecha de la CELEBRACIÓN (`cantoral.date`).
 *
 * Mandan los de la celebración, no los del tiempo: antes se sacaban sólo del tiempo
 * litúrgico, y Todos los Santos (solemnidad, blanco) salía con adornos verdes por caer
 * en el Tiempo Ordinario (reportado el 19-oct-2026). Una celebración agregada a mano con
 * su color también manda (ver getLiturgicalColorId).
 */
export function coloresDelFolleto(dateStr: string): ColoresFolleto {
  // Local, no UTC: en el borde de un tiempo litúrgico el color se iba al anterior.
  const season = getCurrentLiturgicalSeason(parseYmdLocal(dateStr));
  return { ...TINTA[getLiturgicalColorId(dateStr)], seasonName: season || 'Tiempo Ordinario' };
}
