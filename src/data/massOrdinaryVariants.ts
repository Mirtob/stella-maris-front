// =============================================================================
// STELLA MARIS — Ordinarios variantes para liturgias especiales (Fase 3)
//
// Guía resumida basada en el Misal Romano y la IGMR. Cada arreglo describe el
// ORDEN de los momentos, posturas, rúbricas breves y en qué punto entran los
// cantos programados (los `type: 'song'` se muestran solo si el cantoral tiene
// un canto de esa categoría).
//
// Detección (getOrdinaryForCantoral):
//   - Triduo Pascual: por la FECHA del cantoral (algoritmo de Pascua).
//   - Exequias / Ordenación: por el texto de la celebración (liturgicalDate),
//     ya que no dependen de una fecha fija.
//   - Cualquier otro caso: el ordinario normal de la Misa (massOrdinary).
// =============================================================================
import { MassSection, massOrdinary } from './massOrdinary';
import { PublishedCantoral } from '../types';
import { getSpecialLiturgicalDay } from '../utils/specialLiturgicalDays';
import { parseYmdLocal } from './../utils/dateLocal';

const PURPLE = 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600';
const BLUE = 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600';
const AMBER = 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-600';
const SKY = 'bg-sky-100 dark:bg-sky-900/30 border-sky-400 dark:border-sky-600';
const RED = 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600';

// ─────────────────────────────────────────────────────────────────────────────
// JUEVES SANTO — Misa de la Cena del Señor
// ─────────────────────────────────────────────────────────────────────────────
export const juevesSantoOrdinary: MassSection[] = [
  { id: 'js-entrada', title: 'Procesión de Entrada', type: 'instruction', posture: 'standing', icon: '✝️', color: BLUE },
  { id: 'js-entrada-song', title: 'Canto de Entrada', type: 'song', posture: 'standing', category: 'Entrada', icon: '✝️' },
  { id: 'js-saludo', title: 'Saludo y Acto Penitencial', text: 'Señal de la Cruz, saludo y acto penitencial como de costumbre.', type: 'liturgy', posture: 'standing', icon: '🙏', color: PURPLE },
  { id: 'js-kyrie', title: 'Señor, ten piedad (Kyrie)', type: 'song', posture: 'standing', category: 'Kyrie', icon: '🎵' },
  { id: 'js-gloria-rubr', title: 'Gloria — se tocan las campanas', text: 'Se canta el Gloria mientras suenan las campanas y el órgano; después callan hasta la Vigilia Pascual.', type: 'liturgy', posture: 'standing', icon: '🔔', color: AMBER },
  { id: 'js-gloria', title: 'Gloria', type: 'song', posture: 'standing', category: 'Gloria', icon: '🎵' },
  { id: 'js-palabra', title: 'Liturgia de la Palabra', text: 'Primera lectura, salmo, segunda lectura y Evangelio (en Cuaresma no se canta el Aleluya).', type: 'liturgy', posture: 'sitting', icon: '📖', color: BLUE },
  { id: 'js-salmo', title: 'Salmo Responsorial', type: 'song', posture: 'sitting', category: 'Salmo', icon: '📖' },
  { id: 'js-aclam', title: 'Aclamación al Evangelio', type: 'song', posture: 'standing', category: 'Post Evangelio', icon: '📯' },
  { id: 'js-lavatorio', title: 'Lavatorio de los pies (Mandatum)', text: 'Tras la homilía, el sacerdote lava los pies a algunos fieles. Se cantan antífonas como «Ubi caritas» / «Donde hay caridad y amor».', type: 'instruction', posture: 'sitting', icon: '🦶', color: PURPLE },
  { id: 'js-euc', title: 'Liturgia Eucarística', text: 'En la procesión de ofrendas puede llevarse también el pan para los pobres.', type: 'liturgy', posture: 'standing', icon: '🍇', color: BLUE },
  { id: 'js-ofertorio', title: 'Canto de Ofertorio', type: 'song', posture: 'sitting', category: 'Ofertorio', icon: '🍇' },
  { id: 'js-santo', title: 'Santo', type: 'song', posture: 'standing', category: 'Santo', icon: '✝️' },
  { id: 'js-cordero', title: 'Cordero de Dios', type: 'song', posture: 'kneeling', category: 'Cordero de Dios', icon: '🐑' },
  { id: 'js-comunion', title: 'Canto de Comunión', type: 'song', posture: 'sitting', category: 'Comunión', icon: '🫓' },
  { id: 'js-traslado-rubr', title: 'Traslado del Santísimo al Monumento', text: 'Terminada la oración, se traslada el Santísimo en procesión al monumento con el canto «Pange lingua». NO hay bendición ni despedida; luego se desnuda el altar.', type: 'liturgy', posture: 'standing', icon: '🕯️', color: PURPLE },
  { id: 'js-traslado-song', title: 'Canto de Traslado (Procesión)', type: 'song', posture: 'standing', category: 'Exposición y Procesión', icon: '🕯️' },
];

// ─────────────────────────────────────────────────────────────────────────────
// VIERNES SANTO — Celebración de la Pasión del Señor (NO es Misa)
// ─────────────────────────────────────────────────────────────────────────────
export const viernesSantoOrdinary: MassSection[] = [
  { id: 'vs-entrada', title: 'Entrada en silencio y Postración', text: 'El sacerdote entra en silencio y se postra ante el altar. NO hay canto de entrada ni saludo; tampoco Kyrie ni Gloria.', type: 'instruction', posture: 'kneeling', icon: '🤫', color: RED },
  { id: 'vs-palabra', title: 'Liturgia de la Palabra', text: 'Lecturas y proclamación solemne de la Pasión según san Juan.', type: 'liturgy', posture: 'sitting', icon: '📖', color: BLUE },
  { id: 'vs-salmo', title: 'Salmo Responsorial', type: 'song', posture: 'sitting', category: 'Salmo', icon: '📖' },
  { id: 'vs-pasion', title: 'Aclamación a la Pasión', type: 'song', posture: 'standing', category: 'Post Evangelio', icon: '✝️' },
  { id: 'vs-oracion', title: 'Oración Universal Solemne', text: 'Las grandes intercesiones por la Iglesia y el mundo.', type: 'liturgy', posture: 'standing', icon: '🙏', color: PURPLE },
  { id: 'vs-cruz', title: 'Adoración de la Santa Cruz', text: 'Se descubre y se adora la Cruz. Se cantan los «Improperios» o «Oh Cruz fiel» mientras los fieles veneran la Cruz.', type: 'instruction', posture: 'kneeling', icon: '✝️', color: RED },
  { id: 'vs-comunion-rubr', title: 'Sagrada Comunión', text: 'No hay Plegaria Eucarística. Se reza el Padre Nuestro y se distribuye la comunión reservada del día anterior.', type: 'liturgy', posture: 'standing', icon: '🫓', color: BLUE },
  { id: 'vs-comunion', title: 'Canto de Comunión', type: 'song', posture: 'sitting', category: 'Comunión', icon: '🫓' },
  { id: 'vs-final', title: 'Conclusión en silencio', text: 'Tras la oración, todos se retiran en silencio. NO hay bendición, despedida ni canto final.', type: 'instruction', posture: 'standing', icon: '🤫', color: RED },
];

// ─────────────────────────────────────────────────────────────────────────────
// VIGILIA PASCUAL — la celebración más solemne del año
// ─────────────────────────────────────────────────────────────────────────────
export const vigiliaPascualOrdinary: MassSection[] = [
  { id: 'vp-lucernario', title: 'Lucernario — Bendición del fuego y Cirio Pascual', text: 'Se bendice el fuego nuevo, se enciende el Cirio Pascual y entra en procesión («Luz de Cristo»).', type: 'instruction', posture: 'standing', icon: '🔥', color: AMBER },
  { id: 'vp-pregon', title: 'Pregón Pascual (Exsúltet)', type: 'song', posture: 'standing', category: 'Pregón Pascual', icon: '🕯️' },
  { id: 'vp-palabra', title: 'Liturgia de la Palabra', text: 'Se proclaman varias lecturas del Antiguo Testamento; cada una con su salmo y oración.', type: 'liturgy', posture: 'sitting', icon: '📖', color: BLUE },
  { id: 'vp-at1', title: 'Salmo — Lectura AT (1)', type: 'song', posture: 'sitting', category: 'Salmo AT 1', icon: '📜' },
  { id: 'vp-at2', title: 'Salmo — Lectura AT (2)', type: 'song', posture: 'sitting', category: 'Salmo AT 2', icon: '📜' },
  { id: 'vp-at3', title: 'Salmo — Lectura AT (3)', type: 'song', posture: 'sitting', category: 'Salmo AT 3', icon: '📜' },
  { id: 'vp-at4', title: 'Salmo — Lectura AT (4)', type: 'song', posture: 'sitting', category: 'Salmo AT 4', icon: '📜' },
  { id: 'vp-at5', title: 'Salmo — Lectura AT (5)', type: 'song', posture: 'sitting', category: 'Salmo AT 5', icon: '📜' },
  { id: 'vp-at6', title: 'Salmo — Lectura AT (6)', type: 'song', posture: 'sitting', category: 'Salmo AT 6', icon: '📜' },
  { id: 'vp-at7', title: 'Salmo — Lectura AT (7)', type: 'song', posture: 'sitting', category: 'Salmo AT 7', icon: '📜' },
  { id: 'vp-gloria-rubr', title: 'Gloria — vuelven las campanas', text: 'Se entona el Gloria y vuelven a sonar las campanas y el órgano.', type: 'liturgy', posture: 'standing', icon: '🔔', color: AMBER },
  { id: 'vp-gloria', title: 'Gloria', type: 'song', posture: 'standing', category: 'Gloria', icon: '🎵' },
  { id: 'vp-epistola', title: 'Salmo tras la Epístola', type: 'song', posture: 'sitting', category: 'Salmo Epistolar', icon: '📖' },
  { id: 'vp-aleluya', title: 'Aleluya Triple (solemne)', text: 'El sacerdote entona el Aleluya por primera vez desde Cuaresma, elevando el tono tres veces; el pueblo lo repite.', type: 'song', posture: 'standing', category: 'Aleluya Triple', icon: '🎺' },
  { id: 'vp-postev', title: 'Aclamación tras el Evangelio', type: 'song', posture: 'standing', category: 'Post Evangelio', icon: '📯' },
  { id: 'vp-bautismal', title: 'Liturgia Bautismal', text: 'Letanías de los Santos, bendición del agua, bautismos (si los hay), renovación de las promesas bautismales y aspersión del pueblo.', type: 'instruction', posture: 'standing', icon: '💧', color: SKY },
  { id: 'vp-euc', title: 'Liturgia Eucarística', type: 'liturgy', posture: 'standing', icon: '🍇', color: BLUE },
  { id: 'vp-ofertorio', title: 'Canto de Ofertorio', type: 'song', posture: 'sitting', category: 'Ofertorio', icon: '🍇' },
  { id: 'vp-santo', title: 'Santo', type: 'song', posture: 'standing', category: 'Santo', icon: '✝️' },
  { id: 'vp-cordero', title: 'Cordero de Dios', type: 'song', posture: 'kneeling', category: 'Cordero de Dios', icon: '🐑' },
  { id: 'vp-comunion', title: 'Canto de Comunión', type: 'song', posture: 'sitting', category: 'Comunión', icon: '🫓' },
  { id: 'vp-salida', title: 'Canto de Salida (con Aleluya)', type: 'song', posture: 'standing', category: 'Salida', icon: '⛪' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISA DE EXEQUIAS (funeral)
// ─────────────────────────────────────────────────────────────────────────────
export const exequiasOrdinary: MassSection[] = [
  { id: 'ex-recibimiento', title: 'Recibimiento del féretro', text: 'El sacerdote recibe el cuerpo a la entrada del templo; puede rociarlo con agua bendita en memoria del Bautismo.', type: 'instruction', posture: 'standing', icon: '⚰️', color: PURPLE },
  { id: 'ex-entrada', title: 'Canto de Entrada', type: 'song', posture: 'standing', category: 'Entrada', icon: '✝️' },
  { id: 'ex-inicio', title: 'Ritos iniciales', text: 'Saludo y oración colecta. En la Misa de difuntos NO se canta el Gloria.', type: 'liturgy', posture: 'standing', icon: '🙏', color: PURPLE },
  { id: 'ex-salmo', title: 'Salmo Responsorial', type: 'song', posture: 'sitting', category: 'Salmo', icon: '📖' },
  { id: 'ex-aclam', title: 'Aclamación al Evangelio', type: 'song', posture: 'standing', category: 'Aleluya', icon: '🎺' },
  { id: 'ex-homilia', title: 'Homilía', text: 'Breve; no debe ser un elogio fúnebre, sino anuncio de la esperanza pascual.', type: 'liturgy', posture: 'sitting', icon: '📖', color: BLUE },
  { id: 'ex-ofertorio', title: 'Canto de Ofertorio', type: 'song', posture: 'sitting', category: 'Ofertorio', icon: '🍇' },
  { id: 'ex-santo', title: 'Santo', type: 'song', posture: 'standing', category: 'Santo', icon: '✝️' },
  { id: 'ex-cordero', title: 'Cordero de Dios', type: 'song', posture: 'kneeling', category: 'Cordero de Dios', icon: '🐑' },
  { id: 'ex-comunion', title: 'Canto de Comunión', type: 'song', posture: 'sitting', category: 'Comunión', icon: '🫓' },
  { id: 'ex-despedida-rubr', title: 'Última Encomendación y Despedida', text: 'Tras la oración después de la comunión, se hace la aspersión e incensación del féretro y se entona el canto de despedida («In paradísum» / «Al paraíso te conduzcan los ángeles»).', type: 'liturgy', posture: 'standing', icon: '🕊️', color: SKY },
  { id: 'ex-salida', title: 'Canto de Despedida', type: 'song', posture: 'standing', category: 'Salida', icon: '🕊️' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MISA DE ORDENACIÓN (diáconos / presbíteros)
// ─────────────────────────────────────────────────────────────────────────────
export const ordenacionOrdinary: MassSection[] = [
  { id: 'or-entrada', title: 'Canto de Entrada', type: 'song', posture: 'standing', category: 'Entrada', icon: '✝️' },
  { id: 'or-inicio', title: 'Ritos iniciales y Gloria', text: 'Saludo, acto penitencial y Gloria (salvo en Adviento o Cuaresma).', type: 'liturgy', posture: 'standing', icon: '🙏', color: PURPLE },
  { id: 'or-gloria', title: 'Gloria', type: 'song', posture: 'standing', category: 'Gloria', icon: '🎵' },
  { id: 'or-salmo', title: 'Salmo Responsorial', type: 'song', posture: 'sitting', category: 'Salmo', icon: '📖' },
  { id: 'or-aleluya', title: 'Aleluya', type: 'song', posture: 'standing', category: 'Aleluya', icon: '🎺' },
  { id: 'or-rito', title: 'Rito de Ordenación (tras el Evangelio)', text: 'Presentación y elección de los candidatos, homilía, promesas del electo y, postrados todos, las Letanías de los Santos. Luego la imposición de manos y la Plegaria de Ordenación.', type: 'instruction', posture: 'kneeling', icon: '🙌', color: AMBER },
  { id: 'or-letanias', title: 'Letanías de los Santos', text: 'Se cantan mientras los ordenandos están postrados en tierra.', type: 'instruction', posture: 'kneeling', icon: '📿', color: AMBER },
  { id: 'or-explicativos', title: 'Ritos explicativos', text: 'Imposición de vestiduras, unción de manos (presbíteros) o entrega del Evangeliario (diáconos), entrega del pan y del vino, y abrazo de paz.', type: 'instruction', posture: 'sitting', icon: '🕊️', color: BLUE },
  { id: 'or-euc', title: 'Liturgia Eucarística', type: 'liturgy', posture: 'standing', icon: '🍇', color: BLUE },
  { id: 'or-ofertorio', title: 'Canto de Ofertorio', type: 'song', posture: 'sitting', category: 'Ofertorio', icon: '🍇' },
  { id: 'or-santo', title: 'Santo', type: 'song', posture: 'standing', category: 'Santo', icon: '✝️' },
  { id: 'or-cordero', title: 'Cordero de Dios', type: 'song', posture: 'kneeling', category: 'Cordero de Dios', icon: '🐑' },
  { id: 'or-comunion', title: 'Canto de Comunión', type: 'song', posture: 'sitting', category: 'Comunión', icon: '🫓' },
  { id: 'or-salida', title: 'Canto de Salida', type: 'song', posture: 'standing', category: 'Salida', icon: '⛪' },
];

export interface OrdinaryVariant {
  sections: MassSection[];
  /** Etiqueta para el encabezado de la guía (null = Misa normal). */
  label: string | null;
}

/**
 * Devuelve el ordinario (lista de momentos) que corresponde a un cantoral:
 *   1. Triduo Pascual → por la fecha.
 *   2. Exequias / Ordenación → por el texto de la celebración (liturgicalDate).
 *   3. En cualquier otro caso → la Misa normal (massOrdinary).
 */
export function getOrdinaryForCantoral(cantoral: PublishedCantoral): OrdinaryVariant {
  const special = cantoral.date ? getSpecialLiturgicalDay(parseYmdLocal(cantoral.date)) : null;
  if (special === 'JuevesSanto') return { sections: juevesSantoOrdinary, label: 'Jueves Santo — Cena del Señor' };
  if (special === 'ViernesSanto') return { sections: viernesSantoOrdinary, label: 'Viernes Santo — Pasión del Señor' };
  if (special === 'VigiliaPascual') return { sections: vigiliaPascualOrdinary, label: 'Vigilia Pascual' };

  const ld = (cantoral.liturgicalDate || '').toLowerCase();
  if (/exequias|funeral|difunt/.test(ld)) return { sections: exequiasOrdinary, label: 'Misa de Exequias' };
  if (/ordenaci/.test(ld)) return { sections: ordenacionOrdinary, label: 'Misa de Ordenación' };

  return { sections: massOrdinary, label: null };
}
