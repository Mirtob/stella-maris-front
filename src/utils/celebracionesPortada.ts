/**
 * Qué se celebra ese día, dicho en la portada del folleto.
 *
 * Un día no siempre tiene una sola celebración. Sobre el domingo pueden caer una
 * jornada, un aniversario o una fiesta patronal; y una solemnidad propia puede
 * REEMPLAZAR al domingo del calendario. El constructor ya lo decía en pantalla
 * ("También se celebra…", "En lugar de…"), pero el folleto impreso —que es lo que la
 * gente tiene en la mano en la Misa— solo traía el nombre de la celebración principal:
 * el domingo desaparecía sin explicación, o la fiesta patronal no se nombraba en
 * ninguna parte.
 *
 * Esto es la regla pura; el calendario lo pone `getCelebrationsForDate` y el dibujo,
 * utils/cantoralPDFGenerator.
 */

/** Lo que el calendario sabe del día (la forma de `CelebracionesDelDia`). */
export interface CelebracionesDelDiaMin {
  /** La que manda ese día según el calendario + lo agregado a mano. */
  principal: string;
  /** Lo que se celebra ADEMÁS, sin quitarle el día a nadie. */
  ademas: string[];
  /** La del calendario que quedó desplazada por una celebración propia. */
  desplazada?: string;
}

export interface CelebracionesDePortada {
  /** Lo que se celebra además de la del cantoral. Vacío = nada que agregar. */
  tambien: string[];
  /** La que quedó desplazada por la del cantoral. */
  enLugarDe?: string;
}

const limpia = (s?: string | null) => (s ?? '').trim();

/**
 * Decide qué decir en la portada, a partir de la celebración que lleva el cantoral y
 * de lo que el calendario sabe de ese día.
 *
 * Dos casos de "en lugar de":
 *  · El calendario ya lo sabe: hay una celebración agregada que reemplaza al día
 *    (`desplazada`).
 *  · La del cantoral no figura entre las del día: se eligió a mano algo que no está
 *    en el calendario (una Misa de difuntos, una ordenación escrita al vuelo), y
 *    entonces lo que reemplaza es la del calendario.
 *
 * Todo lo demás que se celebre ese día —la del calendario incluida, si no fue
 * desplazada— se nombra como "también".
 */
export function celebracionesDePortada(
  elegida: string | undefined,
  dia: CelebracionesDelDiaMin,
): CelebracionesDePortada {
  const eleg = limpia(elegida);
  const principal = limpia(dia.principal);
  const ademas = (dia.ademas ?? []).map(limpia).filter(Boolean);
  const desplazada = limpia(dia.desplazada);

  let enLugarDe: string | undefined;
  if (desplazada) enLugarDe = desplazada;
  else if (eleg && principal && eleg !== principal && !ademas.includes(eleg)) enLugarDe = principal;

  const tambien: string[] = [];
  for (const nombre of [principal, ...ademas]) {
    if (!nombre || nombre === eleg || nombre === enLugarDe) continue;
    if (!tambien.includes(nombre)) tambien.push(nombre);
  }

  return { tambien, enLugarDe };
}
