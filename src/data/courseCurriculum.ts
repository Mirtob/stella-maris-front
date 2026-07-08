// =============================================================================
// Itinerario de formación del músico litúrgico católico — currículo (Año 1).
// El progreso por usuario va en Supabase (services/courseProgress); aquí vive el
// CONTENIDO estático. Pega la URL real de cada video en `videoUrl` a medida que
// los grabes (vacío = usa el canal oficial como respaldo).
// =============================================================================

export type Eje = 'E' | 'L' | 'M'; // Espiritual/teológico · Litúrgico · Musical/técnico

export const EJE_META: Record<Eje, { label: string; color: string }> = {
  E: { label: 'Espiritual', color: '#5b3f7a' },
  L: { label: 'Litúrgico', color: '#9c2c2c' },
  M: { label: 'Musical', color: '#3f6b52' },
};

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // índice de la opción correcta
}

export interface Capsule {
  id: string;        // estable (no cambiar: es la clave del progreso)
  n: number;         // número global dentro del track
  title: string;
  eje: Eje;
  duration: string;
  source: string;    // fuente magisterial
  idea: string;      // idea fuerza
  summary: string;   // texto breve de apoyo
  videoUrl?: string; // vacío → canal oficial
  quiz: QuizQuestion[];
}

export interface Module {
  id: string;
  term: string;   // "Trimestre 1"
  title: string;
  capsules: Capsule[];
}

export interface Track {
  id: string;
  cycle: string;   // "Ciclo I · Fundamentos"
  title: string;   // "Año 1 — Intensivo"
  motto: string;
  status: 'active' | 'coming';
  certificate?: string;
  modules: Module[];
}

const YEAR1: Track = {
  id: 'y1',
  cycle: 'Ciclo I · Fundamentos',
  title: 'Año 1 — Intensivo',
  motto: 'Cantar es rezar dos veces',
  status: 'active',
  certificate: 'Cantor Litúrgico — Fundamentos',
  modules: [
    {
      id: 'y1-t1',
      term: 'Trimestre 1',
      title: 'La identidad del cantor: ¿por qué cantamos?',
      capsules: [
        {
          id: 'y1-t1-c1', n: 1, eje: 'E', duration: '7 min',
          title: 'Cantar es rezar dos veces',
          source: 'Salmo 150 · atribuido a san Agustín · Catecismo 1156',
          idea: 'El canto litúrgico no acompaña la oración: ES oración. Por eso «el que canta bien, ora dos veces».',
          summary: 'Cantar en la Misa es un modo de orar con todo el ser. La belleza del canto no busca el aplauso, sino elevar el corazón a Dios y ayudar a la asamblea a rezar.',
          quiz: [{ q: '¿Qué es el canto en la liturgia?', options: ['Un adorno para amenizar la Misa', 'Una forma de oración en sí misma', 'Un momento para el lucimiento del coro'], answer: 1 }],
        },
        {
          id: 'y1-t1-c2', n: 2, eje: 'E', duration: '8 min',
          title: 'Ministerio, no espectáculo',
          source: 'Sacrosanctum Concilium 112',
          idea: 'La música sacra es «parte integrante de la liturgia solemne» (SC 112): el coro sirve al culto, no da un concierto.',
          summary: 'El coro ejerce un ministerio dentro de la acción sagrada. Su lugar y su modo de cantar deben ayudar a la oración de todos, nunca convertir la Misa en un escenario.',
          quiz: [{ q: 'Según SC 112, la música sacra es…', options: ['un añadido opcional a la Misa', 'parte integrante de la liturgia solemne', 'un concierto sacro paralelo al rito'], answer: 1 }],
        },
        {
          id: 'y1-t1-c3', n: 3, eje: 'E', duration: '9 min',
          title: 'Las tres marcas de la música sacra',
          source: 'san Pío X, Tra le Sollecitudini (1903)',
          idea: 'Toda música litúrgica debe ser santa, verdadero arte (bondad de las formas) y universal.',
          summary: 'San Pío X fijó tres cualidades: santidad (aparta lo profano), bondad de las formas (arte verdadero, no cualquier cosa) y universalidad (que la Iglesia entera la reconozca como suya).',
          quiz: [{ q: 'Las tres cualidades que pide Pío X son santidad, universalidad y…', options: ['popularidad', 'bondad de las formas (arte verdadero)', 'brevedad'], answer: 1 }],
        },
        {
          id: 'y1-t1-c4', n: 4, eje: 'L', duration: '8 min',
          title: 'Cantar para que todos canten',
          source: 'Sacrosanctum Concilium 14 y 114',
          idea: 'El fin es la participación plena, consciente y activa de TODA la asamblea; el coro la sostiene, no la reemplaza.',
          summary: 'El Concilio pide la «actuosa participatio»: que el pueblo cante y rece. El coro no canta EN LUGAR de la asamblea, sino que la anima y la lleva a participar.',
          quiz: [{ q: 'El objetivo del canto de la asamblea es…', options: ['que el coro brille', 'la participación activa de todo el pueblo', 'llenar los silencios'], answer: 1 }],
        },
        {
          id: 'y1-t1-c5', n: 5, eje: 'E', duration: '7 min',
          title: 'El deber de formarse',
          source: 'Musicam Sacram (1967)',
          idea: 'La Iglesia pide que músicos y cantores reciban una genuina formación litúrgica y musical: tocar bonito no basta.',
          summary: 'El músico católico tiene el deber de formarse, no solo en técnica, sino sobre todo en el sentido de la liturgia. Sin esa formación, incluso lo bien tocado puede desviar la oración.',
          quiz: [{ q: 'Para la Iglesia, la formación del músico litúrgico es…', options: ['opcional si ya toca bien', 'un deber, litúrgico y musical', 'solo para el director'], answer: 1 }],
        },
      ],
    },
    {
      id: 'y1-t2',
      term: 'Trimestre 2',
      title: 'La Misa por dentro',
      capsules: [
        {
          id: 'y1-t2-c6', n: 6, eje: 'L', duration: '9 min',
          title: 'El mapa de la Misa',
          source: 'Instrucción General del Misal Romano (IGMR)',
          idea: 'La Misa tiene dos grandes mesas —la Palabra y la Eucaristía— enmarcadas por los Ritos iniciales y los Ritos finales.',
          summary: 'Conocer la estructura de la Misa permite saber qué se canta y por qué en cada momento: Ritos iniciales, Liturgia de la Palabra, Liturgia Eucarística y Ritos finales.',
          quiz: [{ q: '¿Cuáles son las dos grandes «mesas» de la Misa?', options: ['la Palabra y la Eucaristía', 'el coro y el altar', 'la entrada y la salida'], answer: 0 }],
        },
        {
          id: 'y1-t2-c7', n: 7, eje: 'L', duration: '10 min',
          title: 'Cada canto tiene una función',
          source: 'IGMR 47–88',
          idea: 'El canto de entrada reúne; el de comunión acompaña la procesión. No todo canto sirve para todo momento.',
          summary: 'Cada canto de la Misa cumple una función propia: iniciar y unir (entrada), acompañar la presentación de los dones (ofertorio), la procesión de comunión, o el envío (salida).',
          quiz: [{ q: 'El canto de entrada sirve sobre todo para…', options: ['lucir al solista', 'iniciar la celebración y unir a la asamblea', 'cubrir el tiempo hasta que llegue el sacerdote'], answer: 1 }],
        },
        {
          id: 'y1-t2-c8', n: 8, eje: 'L', duration: '8 min',
          title: 'Ordinario y Propio',
          source: 'Tradición litúrgica romana',
          idea: 'El Ordinario (Kyrie, Gloria, Santo, Cordero…) es fijo; el Propio cambia según el día.',
          summary: 'Distinguir Ordinario (partes fijas que se repiten en cada Misa) y Propio (entrada, salmo, comunión, que cambian con el día y el tiempo) ordena la elección del repertorio.',
          quiz: [{ q: 'El Kyrie, Gloria, Santo y Cordero forman parte del…', options: ['Propio del día', 'Ordinario de la Misa', 'repertorio libre'], answer: 1 }],
        },
        {
          id: 'y1-t2-c9', n: 9, eje: 'L', duration: '9 min',
          title: 'El Salmo responsorial',
          source: 'IGMR 61 · Ordenación de las Lecturas',
          idea: 'El salmo es la Palabra de Dios hecha canto y respuesta de la asamblea; el salmista ejerce un verdadero ministerio.',
          summary: 'El Salmo responsorial es parte de la Liturgia de la Palabra, no un relleno. Idealmente se canta, y el salmista tiene un oficio propio que exige preparación.',
          quiz: [{ q: 'El Salmo responsorial es…', options: ['un canto de relleno entre lecturas', 'parte de la Liturgia de la Palabra: la Palabra hecha canto', 'siempre optativo'], answer: 1 }],
        },
        {
          id: 'y1-t2-c10', n: 10, eje: 'L', duration: '10 min',
          title: 'El canto que pide el rito',
          source: 'Musicam Sacram · IGMR',
          idea: 'Se elige el canto que corresponde a cada momento y tiempo, no «cualquier canto» para rellenar.',
          summary: 'El primer criterio no es el gusto ni la novedad, sino la conveniencia con el rito y el tiempo litúrgico. El canto está al servicio de la acción sagrada.',
          quiz: [{ q: 'Al elegir un canto, el primer criterio es…', options: ['que le guste al coro', 'que corresponda al momento y al rito', 'que sea el más nuevo'], answer: 1 }],
        },
      ],
    },
    {
      id: 'y1-t3',
      term: 'Trimestre 3',
      title: 'La voz y el instrumento al servicio',
      capsules: [
        {
          id: 'y1-t3-c11', n: 11, eje: 'M', duration: '8 min',
          title: 'Respiración y afinación',
          source: 'Técnica vocal al servicio de la liturgia',
          idea: 'La respiración diafragmática y una afinación cuidada son la base para sostener el canto sin cansancio.',
          summary: 'Antes que la potencia, el apoyo. Una buena respiración y el hábito de afinar permiten cantar largo, unido y sin desafinar, que es lo que ayuda a orar.',
          quiz: [{ q: 'La base de un canto sostenido y afinado es…', options: ['cantar fuerte', 'la respiración y el apoyo diafragmático', 'memorizar la letra'], answer: 1 }],
        },
        {
          id: 'y1-t3-c12', n: 12, eje: 'M', duration: '7 min',
          title: 'Que se entienda la letra',
          source: 'Musicam Sacram · SC 112',
          idea: 'La letra es oración: si no se entiende, se pierde el sentido. La dicción es una exigencia litúrgica.',
          summary: 'De nada sirve una melodía hermosa si no se comprende lo que se canta. Vocalizar y cuidar la dicción es servir al contenido orante del texto.',
          quiz: [{ q: '¿Por qué es tan importante la dicción?', options: ['para lucir la voz', 'porque la letra es oración y debe comprenderse', 'no importa si la melodía es bonita'], answer: 1 }],
        },
        {
          id: 'y1-t3-c13', n: 13, eje: 'M', duration: '7 min',
          title: 'Tempo litúrgico',
          source: 'Práctica litúrgica',
          idea: 'Ni arrastrar ni correr: el tempo justo ayuda a orar y respeta el rito y a la asamblea.',
          summary: 'El tempo no lo dicta el gusto del músico, sino el momento litúrgico. Un canto arrastrado apaga; uno apresurado atropella. El pulso justo sostiene la oración.',
          quiz: [{ q: 'El tempo de un canto litúrgico debe…', options: ['ser siempre rápido y alegre', 'ayudar a la oración: ni arrastrado ni apresurado', 'seguir el gusto del guitarrista'], answer: 1 }],
        },
        {
          id: 'y1-t3-c14', n: 14, eje: 'M', duration: '10 min',
          title: 'Acompañar sin tapar',
          source: 'SC 120 · Musicam Sacram',
          idea: 'El instrumento sostiene y sirve al canto; nunca debe cubrir la voz ni convertirse en protagonista.',
          summary: 'El acompañamiento (guitarra, órgano) está al servicio del canto y del texto. La sobriedad es virtud litúrgica: menos es más cuando ayuda a rezar.',
          quiz: [{ q: 'El acompañamiento instrumental debe…', options: ['lucirse con solos', 'sostener el canto sin taparlo', 'ser lo más fuerte posible'], answer: 1 }],
        },
        {
          id: 'y1-t3-c15', n: 15, eje: 'M', duration: '8 min',
          title: 'Cantar juntos',
          source: 'Tradición coral',
          idea: 'El coro busca el empaste: sonar como una sola voz. Escucharse vale más que destacar.',
          summary: 'La unidad del coro es signo de la unidad de la Iglesia. Empastar es escucharse, igualar la vocal y el volumen, y renunciar al protagonismo individual.',
          quiz: [{ q: 'El «empaste» coral significa…', options: ['que cada voz destaque', 'que las voces suenen como una sola', 'cantar muy fuerte'], answer: 1 }],
        },
      ],
    },
    {
      id: 'y1-t4',
      term: 'Trimestre 4',
      title: 'El año litúrgico y el repertorio',
      capsules: [
        {
          id: 'y1-t4-c16', n: 16, eje: 'L', duration: '9 min',
          title: 'Adviento y Navidad',
          source: 'Normas del Año Litúrgico · SC',
          idea: 'Adviento es espera sobria y gozosa; se omite el Gloria dominical hasta Navidad. Cada tiempo pide su tono.',
          summary: 'El repertorio sigue el tiempo: en Adviento, sobriedad y esperanza (sin Gloria los domingos); en Navidad, el Gloria y la alegría del Nacimiento.',
          quiz: [{ q: 'Durante el Adviento…', options: ['se canta el Gloria cada domingo', 'se omite el Gloria dominical (vuelve en Navidad)', 'no se canta nada'], answer: 1 }],
        },
        {
          id: 'y1-t4-c17', n: 17, eje: 'L', duration: '9 min',
          title: 'Cuaresma y Pascua',
          source: 'Normas del Año Litúrgico · IGMR',
          idea: 'En Cuaresma se ayuna del Aleluya y del Gloria, con sobriedad instrumental; en Pascua todo estalla en aleluyas.',
          summary: 'La Cuaresma es tiempo penitencial: se omite el Aleluya (sustituido por otra aclamación) y el Gloria dominical, y se modera lo festivo. La Pascua desborda en aleluyas.',
          quiz: [{ q: 'En Cuaresma, el Aleluya…', options: ['se canta con más fuerza', 'se omite (se sustituye por otra aclamación)', 'se canta solo el primer domingo'], answer: 1 }],
        },
        {
          id: 'y1-t4-c18', n: 18, eje: 'L', duration: '10 min',
          title: 'Elegir repertorio con criterio católico',
          source: 'SC 112 · Musicam Sacram · IGMR',
          idea: 'Un canto litúrgico debe tener letra conforme a la fe, calidad artística y, cuando corresponde, aprobación eclesiástica.',
          summary: 'No todo canto religioso es apto para la liturgia. El criterio irrenunciable es la ortodoxia de la letra; luego, la calidad y la conveniencia con el rito.',
          quiz: [{ q: 'Un criterio irrenunciable al elegir un canto es…', options: ['que sea pegajoso', 'que su letra sea conforme a la fe católica', 'que dure poco'], answer: 1 }],
        },
        {
          id: 'y1-t4-c19', n: 19, eje: 'M', duration: '10 min',
          title: 'Primer encuentro con el gregoriano',
          source: 'Sacrosanctum Concilium 116',
          idea: 'El canto gregoriano es el canto propio de la liturgia romana y debe ocupar el primer lugar (principem locum).',
          summary: 'El gregoriano no es una reliquia: es el canto que la Iglesia reconoce como especialmente apto para el rito romano. Un primer contacto abre a un tesoro vivo.',
          quiz: [{ q: 'Según SC 116, en la liturgia romana el canto gregoriano…', options: ['está prohibido', 'ocupa el primer lugar (principem locum)', 'es solo para monasterios'], answer: 1 }],
        },
        {
          id: 'y1-t4-c20', n: 20, eje: 'E', duration: '8 min',
          title: 'Síntesis y envío',
          source: 'Síntesis · Quirógrafo de Juan Pablo II (2003)',
          idea: 'El coro es una escuela de oración: formándose, ayuda a toda la asamblea a rezar cantando. La formación no termina.',
          summary: 'Cierre del Año 1: recogemos lo aprendido y renovamos el compromiso. Un coro formado sirve mejor al altar y contagia el deseo de seguir creciendo.',
          quiz: [{ q: 'La meta última de la formación del coro es…', options: ['ganar concursos', 'servir mejor a la oración de la Iglesia', 'tener el repertorio más grande'], answer: 1 }],
        },
      ],
    },
  ],
};

const YEAR2: Track = {
  id: 'y2',
  cycle: 'Ciclo II · Intermedio',
  title: 'Año 2 — El arte al servicio del misterio',
  motto: 'La belleza es camino hacia Dios',
  status: 'coming',
  modules: [],
};

const YEAR3: Track = {
  id: 'y3',
  cycle: 'Ciclo III · Avanzado',
  title: 'Año 3 — Maestros y transmisores',
  motto: 'Recibimos un tesoro para entregarlo',
  status: 'coming',
  modules: [],
};

export const CURRICULUM: Track[] = [YEAR1, YEAR2, YEAR3];

/** Todas las cápsulas del track activo, en orden. */
export const ACTIVE_CAPSULES: Capsule[] = YEAR1.modules.flatMap((m) => m.capsules);

export function findCapsule(id: string): Capsule | undefined {
  return ACTIVE_CAPSULES.find((c) => c.id === id);
}
