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
  n: number;         // número dentro del track
  title: string;
  eje: Eje;
  duration: string;
  source: string;    // fuente magisterial
  idea: string;      // idea fuerza
  summary?: string;  // texto breve de apoyo (opcional en cápsulas por preparar)
  videoUrl?: string; // vacío → canal oficial
  quiz?: QuizQuestion[]; // opcional: sin quiz se completa con "Marcar como vista"
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
  /** Id del track que hay que completar para abrir este. Sin valor = abierto (paralelo). */
  requiresTrack?: string;
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

// Cápsula de teoría musical (siempre eje Musical; con resumen y quiz).
const th = (id: string, n: number, duration: string, title: string, source: string, idea: string, summary: string, quiz?: QuizQuestion[]): Capsule =>
  ({ id, n, eje: 'M', duration, title, source, idea, summary, quiz });

// Track PARALELO de teoría musical dentro del Año 1 (base indispensable para el órgano:
// culmina en el círculo de quintas). Abierto desde el inicio, no bloquea el camino.
const YEAR1_THEORY: Track = {
  id: 'y1-teoria',
  cycle: 'Ciclo I · Teoría Musical',
  title: 'Año 1 — Teoría Musical (base para el órgano)',
  motto: 'Del sonido al círculo de quintas',
  status: 'active',
  certificate: 'Teoría Musical — Fundamentos',
  modules: [
    { id: 'y1-th-a', term: 'Módulo A', title: 'Principios y el sonido', capsules: [
      th('y1-th-c1', 1, '7 min', '¿Qué es la música? Principios básicos', 'Teoría musical · fundamentos',
        'La música es el arte de combinar sonidos en el tiempo; se sostiene en tres elementos: melodía, armonía y ritmo.',
        'Melodía (sucesión de sonidos), armonía (sonidos simultáneos) y ritmo (su organización en el tiempo) son los tres pilares. Todo lo que estudiaremos desarrolla alguno de ellos.',
        [
          { q: 'Los tres elementos de la música son…', options: ['letra, voz y volumen', 'melodía, armonía y ritmo', 'grave, medio y agudo'], answer: 1 },
          { q: 'La melodía es…', options: ['sonidos que suenan a la vez', 'una sucesión de sonidos', 'el silencio'], answer: 1 },
          { q: 'La armonía se refiere a…', options: ['sonidos simultáneos', 'sonidos uno tras otro', 'la duración'], answer: 0 },
          { q: 'El ritmo organiza la música en el…', options: ['espacio', 'tiempo', 'volumen'], answer: 1 },
        ]),
      th('y1-th-c2', 2, '8 min', 'Las propiedades del sonido', 'Acústica musical',
        'Todo sonido tiene cuatro propiedades: altura, duración, intensidad y timbre.',
        'Altura (grave/agudo, según la frecuencia), duración (largo/corto), intensidad (fuerte/suave) y timbre (el "color" que distingue una voz de un órgano). La música juega con las cuatro.',
        [
          { q: '¿Qué propiedad define si una nota es grave o aguda?', options: ['la intensidad', 'la altura', 'el timbre'], answer: 1 },
          { q: 'Que un sonido sea largo o corto es cuestión de…', options: ['la duración', 'la altura', 'el timbre'], answer: 0 },
          { q: 'Que un sonido sea fuerte o suave es cuestión de…', options: ['el timbre', 'la intensidad', 'la altura'], answer: 1 },
          { q: 'El "color" que distingue una voz de un órgano es el…', options: ['timbre', 'volumen', 'ritmo'], answer: 0 },
        ]),
    ]},
    { id: 'y1-th-b', term: 'Módulo B', title: 'La escritura musical', capsules: [
      th('y1-th-c3', 3, '9 min', 'El pentagrama y el endecagrama', 'Notación musical',
        'El pentagrama tiene cinco líneas; uniendo el de Sol y el de Fa se forma el gran sistema (endecagrama) con el Do central en medio.',
        'Las notas se escriben en las líneas y espacios del pentagrama, y en líneas adicionales fuera de él. El "endecagrama" (once líneas) une las claves de Sol y Fa —clave para el órgano—, con el Do central como puente.',
        [
          { q: '¿Cuántas líneas tiene un pentagrama?', options: ['cuatro', 'cinco', 'seis'], answer: 1 },
          { q: 'El endecagrama (gran sistema) une las claves de…', options: ['Sol y Fa', 'Sol y Do', 'Fa y Do'], answer: 0 },
          { q: 'Las notas que no caben en el pentagrama se escriben en…', options: ['otro pentagrama', 'líneas adicionales', 'el margen'], answer: 1 },
          { q: 'En el centro del gran sistema está el…', options: ['La 440', 'Do central', 'Sol agudo'], answer: 1 },
        ]),
      th('y1-th-c4', 4, '8 min', 'Las claves (Sol, Fa, Do)', 'Notación musical',
        'La clave fija el nombre de las notas en el pentagrama; Sol para agudos, Fa para graves, Do para voces medias.',
        'Sin clave, las notas no tienen nombre. La clave de Sol se usa para sonidos agudos (voces altas, mano derecha del órgano); la de Fa, para graves (bajos, pedal). El organista lee ambas a la vez.',
        [
          { q: 'La clave de Fa se usa sobre todo para sonidos…', options: ['agudos', 'graves', 'medios'], answer: 1 },
          { q: 'La clave de Sol se usa sobre todo para sonidos…', options: ['agudos', 'graves', 'medios'], answer: 0 },
          { q: 'Sin clave, las notas del pentagrama…', options: ['no tienen nombre', 'suenan igual', 'no existen'], answer: 0 },
          { q: 'El organista normalmente lee…', options: ['solo la clave de Sol', 'dos claves a la vez (Sol y Fa)', 'sin clave'], answer: 1 },
        ]),
      th('y1-th-c5', 5, '8 min', 'Las notas y su ubicación', 'Notación musical',
        'Siete nombres —Do, Re, Mi, Fa, Sol, La, Si— se ubican en líneas y espacios y se repiten por octavas.',
        'Aprender a reconocer cada nota por su posición es leer música. Con la clave de Sol, memoriza las notas en líneas y espacios; luego se amplía con líneas adicionales.',
        [
          { q: '¿Cuántos nombres de nota se repiten en toda la música?', options: ['cinco', 'siete', 'doce'], answer: 1 },
          { q: 'El orden ascendente de las notas es…', options: ['Do Re Mi Fa Sol La Si', 'Do Mi Sol Si', 'La Si Do Re'], answer: 0 },
          { q: 'Las notas se escriben en…', options: ['solo las líneas', 'líneas y espacios', 'solo los espacios'], answer: 1 },
        ]),
      th('y1-th-c6', 6, '10 min', 'Duración de las notas y silencios', 'Ritmo · notación',
        'Cada figura (redonda, blanca, negra, corchea…) vale la mitad de la anterior; los silencios son su ausencia con igual valor.',
        'Redonda = 2 blancas = 4 negras = 8 corcheas. A cada figura le corresponde un silencio de igual duración. Dominar esto es la base de la lectura rítmica.',
        [
          { q: 'Una blanca equivale a…', options: ['una negra', 'dos negras', 'cuatro negras'], answer: 1 },
          { q: 'Una redonda equivale a…', options: ['dos negras', 'cuatro negras', 'ocho negras'], answer: 1 },
          { q: 'Cada figura vale, respecto de la anterior…', options: ['el doble', 'la mitad', 'lo mismo'], answer: 1 },
          { q: 'Un silencio representa…', options: ['una nota aguda', 'una ausencia de sonido con duración', 'un acorde'], answer: 1 },
        ]),
      th('y1-th-c7', 7, '9 min', 'Compás, métrica y pulso', 'Ritmo',
        'El pulso es el latido regular; el compás lo agrupa (2/4, 3/4, 4/4) con acentos.',
        'El número de arriba dice cuántos tiempos hay por compás; el de abajo, qué figura vale un tiempo. El primer tiempo lleva el acento. Sentir el pulso y el compás ordena el canto y el acompañamiento.',
        [
          { q: 'En un compás de 3/4 hay…', options: ['dos tiempos', 'tres tiempos', 'cuatro tiempos'], answer: 1 },
          { q: 'El pulso es…', options: ['el latido regular de la música', 'el volumen', 'la melodía'], answer: 0 },
          { q: 'En 4/4, el número de arriba indica…', options: ['la figura que vale un tiempo', 'cuántos tiempos por compás', 'el tempo'], answer: 1 },
          { q: 'El acento del compás cae normalmente en el…', options: ['último tiempo', 'primer tiempo', 'silencio'], answer: 1 },
        ]),
      th('y1-th-c8', 8, '8 min', 'Alteraciones: sostenido, bemol, becuadro', 'Notación musical',
        'El sostenido sube medio tono, el bemol lo baja, y el becuadro anula la alteración.',
        'Estos signos modifican la altura de una nota en un semitono. Son imprescindibles para las escalas, las tonalidades y —más adelante— el círculo de quintas.',
        [
          { q: 'El sostenido (♯) hace que la nota…', options: ['suba medio tono', 'baje medio tono', 'no cambie'], answer: 0 },
          { q: 'El bemol (♭) hace que la nota…', options: ['suba medio tono', 'baje medio tono', 'se acorte'], answer: 1 },
          { q: 'El becuadro (♮)…', options: ['anula la alteración anterior', 'sube un tono', 'baja un tono'], answer: 0 },
          { q: 'Una alteración modifica la altura en…', options: ['un tono', 'un semitono', 'una octava'], answer: 1 },
        ]),
    ]},
    { id: 'y1-th-c', term: 'Módulo C', title: 'Solfeo', capsules: [
      th('y1-th-c9', 9, '9 min', 'Solfeo rítmico', 'Solfeo',
        'Leer y ejecutar solo el ritmo (con palmas o percusión) antes de añadir la altura.',
        'El solfeo rítmico entrena a leer figuras y silencios a tiempo, marcando el pulso. Es el primer paso para leer música con seguridad.',
        [
          { q: 'El solfeo rítmico se ocupa sobre todo de…', options: ['la afinación', 'la duración y el pulso', 'el timbre'], answer: 1 },
          { q: 'El solfeo rítmico todavía NO incluye…', options: ['el pulso', 'las figuras', 'la afinación'], answer: 2 },
          { q: 'Se suele practicar…', options: ['palmeando o percutiendo el ritmo', 'cantando a dos voces', 'tocando el órgano'], answer: 0 },
        ]),
      th('y1-th-c10', 10, '9 min', 'Solfeo hablado', 'Solfeo',
        'Nombrar las notas (Do, Re, Mi…) en voz alta y a tiempo, sin entonar.',
        'Une la lectura de las notas con el ritmo, pero sin cantar la altura todavía. Prepara el paso siguiente: entonar.',
        [
          { q: 'En el solfeo hablado…', options: ['se cantan las notas afinadas', 'se nombran las notas a tiempo, sin afinar', 'solo se palmea el ritmo'], answer: 1 },
          { q: 'El solfeo hablado añade, al rítmico…', options: ['la armonía', 'el nombre de las notas', 'el timbre'], answer: 1 },
          { q: 'En esta etapa todavía no se…', options: ['lee el ritmo', 'nombra las notas', 'entona la altura'], answer: 2 },
        ]),
      th('y1-th-c11', 11, '10 min', 'Solfeo cantado (entonado)', 'Solfeo',
        'Cantar las notas afinadas: unir nombre, ritmo y altura.',
        'Es la meta del solfeo: leer y entonar. Se apoya en la escala y en los intervalos (módulo siguiente). Afinar leyendo transforma a un coro.',
        [
          { q: 'El solfeo cantado añade, a lo anterior…', options: ['el timbre', 'la afinación de cada nota', 'la armonía'], answer: 1 },
          { q: 'Se apoya sobre todo en…', options: ['la escala y los intervalos', 'el volumen', 'el compás'], answer: 0 },
          { q: 'La meta del solfeo es…', options: ['leer y entonar', 'solo leer el ritmo', 'memorizar canciones'], answer: 0 },
        ]),
    ]},
    { id: 'y1-th-d', term: 'Módulo D', title: 'Escalas, intervalos y acordes', capsules: [
      th('y1-th-c12', 12, '8 min', 'Tono y semitono', 'Teoría musical',
        'El semitono es la mínima distancia entre dos notas; el tono equivale a dos semitonos.',
        'En el teclado, dos teclas contiguas (con o sin negra en medio) están a un semitono. Mi–Fa y Si–Do son semitonos naturales. Tono y semitono son la unidad de medida de escalas e intervalos.',
        [
          { q: 'Entre Mi y Fa hay…', options: ['un tono', 'un semitono', 'un tono y medio'], answer: 1 },
          { q: 'Un tono equivale a…', options: ['un semitono', 'dos semitonos', 'tres semitonos'], answer: 1 },
          { q: 'La mínima distancia entre dos notas es…', options: ['el tono', 'el semitono', 'la octava'], answer: 1 },
          { q: 'Entre Si y Do hay…', options: ['un tono', 'un semitono', 'un tono y medio'], answer: 1 },
        ]),
      th('y1-th-c13', 13, '10 min', 'La escala mayor', 'Teoría musical',
        'La escala mayor sigue el patrón Tono–Tono–semitono–Tono–Tono–Tono–semitono.',
        'Do mayor (todas las notas blancas) es el modelo: T-T-s-T-T-T-s. Ese patrón, empezado en cualquier nota, genera todas las escalas mayores (y explica sus alteraciones).',
        [
          { q: 'El patrón de la escala mayor es…', options: ['T-s-T-T-s-T-T', 'T-T-s-T-T-T-s', 'todos tonos'], answer: 1 },
          { q: 'La escala mayor sin ninguna alteración es la de…', options: ['Sol', 'Do', 'Fa'], answer: 1 },
          { q: 'En la escala mayor, los semitonos caen entre los grados…', options: ['1-2 y 5-6', '3-4 y 7-8', 'no hay semitonos'], answer: 1 },
        ]),
      th('y1-th-c14', 14, '10 min', 'Las escalas menores', 'Teoría musical',
        'Hay tres formas de escala menor: natural, armónica (7.º grado elevado) y melódica.',
        'La menor natural es relativa de una mayor (misma armadura). La armónica sube el 7.º grado para crear la sensible; la melódica modifica el 6.º y 7.º al subir. Cada una da un color distinto.',
        [
          { q: 'La escala menor armónica se caracteriza por…', options: ['bajar el 2.º grado', 'elevar el 7.º grado', 'no tener alteraciones'], answer: 1 },
          { q: 'La menor natural comparte armadura con…', options: ['su relativa mayor', 'ninguna escala', 'la menor melódica solamente'], answer: 0 },
          { q: '¿Cuántas formas de escala menor vimos?', options: ['una', 'dos', 'tres'], answer: 2 },
        ]),
      th('y1-th-c15', 15, '10 min', 'Los intervalos', 'Teoría musical',
        'Un intervalo es la distancia entre dos notas; se mide por su número (2.ª, 3.ª, 5.ª…) y su calidad (mayor, menor, justa).',
        'Contar las notas da el número; contar los tonos/semitonos da la calidad. Los intervalos son la base de la afinación (solfeo cantado) y de los acordes.',
        [
          { q: 'Un intervalo se define por…', options: ['su número y su calidad', 'solo su color', 'su duración'], answer: 0 },
          { q: 'El "número" del intervalo se obtiene…', options: ['contando las notas', 'midiendo el volumen', 'por el timbre'], answer: 0 },
          { q: 'Los intervalos son la base de…', options: ['la afinación y los acordes', 'el compás', 'el timbre'], answer: 0 },
        ]),
      th('y1-th-c16', 16, '11 min', 'Los acordes (tríadas)', 'Armonía',
        'Una tríada son tres notas superpuestas por terceras; según sus intervalos es mayor, menor, aumentada o disminuida.',
        'Sobre una nota (fundamental) se apilan una tercera y una quinta. Tríada mayor (3.ª mayor + 3.ª menor), menor (al revés), aumentada y disminuida. Los acordes son el corazón de la armonía y del acompañamiento.',
        [
          { q: 'Una tríada está formada por…', options: ['dos notas', 'tres notas por terceras', 'cinco notas'], answer: 1 },
          { q: 'La nota base de una tríada se llama…', options: ['sensible', 'fundamental', 'dominante'], answer: 1 },
          { q: '¿Cuál NO es un tipo de tríada?', options: ['mayor', 'disminuida', 'cromática'], answer: 2 },
        ]),
      th('y1-th-c17', 17, '9 min', 'Inversiones de acordes', 'Armonía',
        'Un mismo acorde cambia de inversión según qué nota quede en el bajo: fundamental, primera o segunda inversión.',
        'Si el bajo es la fundamental, está en estado fundamental; si es la 3.ª, primera inversión; si es la 5.ª, segunda inversión. Las inversiones dan variedad y suavizan el bajo (clave en el órgano).',
        [
          { q: 'Un acorde está en primera inversión cuando en el bajo suena…', options: ['la fundamental', 'la tercera', 'la quinta'], answer: 1 },
          { q: 'En estado fundamental, en el bajo suena…', options: ['la fundamental', 'la tercera', 'la quinta'], answer: 0 },
          { q: 'En segunda inversión, en el bajo suena…', options: ['la fundamental', 'la tercera', 'la quinta'], answer: 2 },
        ]),
    ]},
    { id: 'y1-th-e', term: 'Módulo E', title: 'Tonalidad y círculo de quintas', capsules: [
      th('y1-th-c18', 18, '10 min', 'Tonalidades y armadura de clave', 'Teoría musical',
        'La tonalidad es el "centro" de una pieza; la armadura de clave indica sus sostenidos o bemoles.',
        'Cada escala mayor/menor tiene sus alteraciones fijas, escritas al inicio como armadura. Reconocer la armadura te dice la tonalidad y qué notas van alteradas en toda la pieza.',
        [
          { q: 'La armadura de clave indica…', options: ['el tempo', 'los sostenidos o bemoles de la tonalidad', 'el volumen'], answer: 1 },
          { q: 'La tonalidad es…', options: ['el centro o "casa" de la pieza', 'el instrumento', 'la letra'], answer: 0 },
          { q: 'La armadura se escribe…', options: ['al final de la pieza', 'al inicio, junto a la clave', 'en cada compás'], answer: 1 },
        ]),
      th('y1-th-c19', 19, '12 min', 'El círculo de quintas', 'Teoría musical',
        'El círculo de quintas ordena las 12 tonalidades por intervalos de quinta: hacia la derecha se ganan sostenidos; hacia la izquierda, bemoles.',
        'Partiendo de Do (sin alteraciones), cada quinta ascendente añade un sostenido (Sol, Re, La…); cada quinta descendente añade un bemol (Fa, Sib, Mib…). Orden de sostenidos: Fa-Do-Sol-Re-La-Mi-Si; los bemoles, al revés. Es el mapa que todo organista debe dominar.',
        [
          { q: 'El círculo de quintas ordena las tonalidades por intervalos de…', options: ['segunda', 'quinta', 'octava'], answer: 1 },
          { q: 'En el círculo, hacia la derecha se ganan…', options: ['sostenidos', 'bemoles', 'silencios'], answer: 0 },
          { q: 'Hacia la izquierda se ganan…', options: ['sostenidos', 'bemoles', 'becuadros'], answer: 1 },
          { q: 'El orden de los sostenidos es…', options: ['Fa-Do-Sol-Re-La-Mi-Si', 'Do-Re-Mi-Fa-Sol', 'Si-La-Sol-Fa'], answer: 0 },
        ]),
      th('y1-th-c20', 20, '11 min', 'Del círculo de quintas al acompañamiento', 'Armonía aplicada',
        'En el círculo, tónica, subdominante y dominante son vecinas: eso explica los acordes que más se usan y facilita transportar.',
        'La dominante está una quinta arriba de la tónica; la subdominante, una quinta abajo: son las vecinas inmediatas en el círculo. Con esto se arman los acompañamientos, se transporta y se entiende por qué el órgano exige este dominio.',
        [
          { q: 'Respecto de la tónica, la dominante está…', options: ['una quinta arriba', 'una octava abajo', 'un semitono arriba'], answer: 0 },
          { q: 'La subdominante está, respecto de la tónica…', options: ['una quinta abajo', 'una quinta arriba', 'un tono arriba'], answer: 0 },
          { q: 'En el círculo, tónica, subdominante y dominante son…', options: ['opuestas', 'vecinas', 'la misma nota'], answer: 1 },
          { q: 'El círculo de quintas es especialmente importante para…', options: ['el organista', 'el timbre', 'el volumen'], answer: 0 },
        ]),
    ]},
  ],
};

const cap = (id: string, n: number, eje: Eje, duration: string, title: string, source: string, idea: string): Capsule =>
  ({ id, n, eje, duration, title, source, idea });

const YEAR2: Track = {
  id: 'y2',
  cycle: 'Ciclo II · Intermedio',
  title: 'Año 2 — El arte al servicio del misterio',
  motto: 'La belleza es camino hacia Dios',
  status: 'active',
  requiresTrack: 'y1',
  certificate: 'Músico Litúrgico — Intermedio',
  modules: [
    { id: 'y2-m1', term: 'Módulo 1', title: 'Teología litúrgica: el misterio que cantamos', capsules: [
      cap('y2-c1', 1, 'E', '10 min', 'La liturgia, fuente y culmen', 'Sacrosanctum Concilium 10', 'Todo, también la música, brota de la liturgia y conduce a ella: es la cumbre de la vida de la Iglesia.'),
      cap('y2-c2', 2, 'E', '12 min', 'La música como signo sagrado', 'Benedicto XVI, El espíritu de la liturgia', 'El canto no ilustra el rito: lo hace presente. La belleza sonora es signo del misterio que se celebra.'),
      cap('y2-c3', 3, 'E', '10 min', 'Actualidad de san Pío X', 'Quirógrafo de Juan Pablo II (2003)', 'A cien años de Tra le Sollecitudini, la Iglesia reafirma sus principios: santidad, arte y universalidad siguen vigentes.'),
    ]},
    { id: 'y2-m2', term: 'Módulo 2', title: 'Gregoriano en serio', capsules: [
      cap('y2-c4', 4, 'M', '11 min', 'Los ocho modos gregorianos', 'Tradición del canto llano', 'El gregoriano no está en tonalidad mayor/menor: vive en ocho modos con su propio color y reposo.'),
      cap('y2-c5', 5, 'M', '12 min', 'Leer neumas: primeros pasos', 'Graduale · Liber Usualis', 'Los neumas guardan melodía y matiz. Aprender a leerlos abre la puerta al canto propio de la Iglesia.'),
      cap('y2-c6', 6, 'M', '10 min', 'Cantar un Kyrie del Kyriale', 'Kyriale Romanum', 'Del papel a la voz: cantamos juntos un Kyrie gregoriano sencillo, respirando el flujo de la melodía.'),
      cap('y2-c7', 7, 'M', '10 min', 'Cantar un Sanctus del Kyriale', 'Kyriale Romanum', 'El Sanctus une nuestra voz a la de los ángeles; lo aprendemos en su forma gregoriana más accesible.'),
    ]},
    { id: 'y2-m3', term: 'Módulo 3', title: 'Polifonía sacra', capsules: [
      cap('y2-c8', 8, 'M', '11 min', 'Palestrina: la claridad del texto', 'Concilio de Trento · tradición polifónica', 'La gran polifonía nunca sacrifica la palabra: la reviste sin oscurecerla. Palestrina es su modelo.'),
      cap('y2-c9', 9, 'M', '9 min', 'Tomás Luis de Victoria', 'Historia de la música sacra', 'La cumbre española de la polifonía: intensidad espiritual y perfección al servicio de la oración.'),
      cap('y2-c10', 10, 'M', '12 min', 'Primer canto a dos voces', 'Práctica coral', 'Damos el paso del unísono a dos voces: escucha, independencia y empaste al servicio del texto.'),
    ]},
    { id: 'y2-m4', term: 'Módulo 4', title: 'Dirección coral básica', capsules: [
      cap('y2-c11', 11, 'M', '10 min', 'El gesto que ordena', 'Técnica de dirección', 'Pulso, preparación y entradas: el director sirve al coro con un gesto claro, no con protagonismo.'),
      cap('y2-c12', 12, 'M', '10 min', 'Preparar un ensayo eficaz', 'Práctica coral', 'Un buen ensayo se planifica: objetivos, calentamiento, pasajes difíciles y sentido litúrgico de lo que se canta.'),
      cap('y2-c13', 13, 'M', '9 min', 'Dinámica al servicio del texto', 'Interpretación', 'Fuerte y suave no son adornos: subrayan el sentido de la palabra orante. La expresión sirve, no decora.'),
    ]},
    { id: 'y2-m5', term: 'Módulo 5', title: 'Salmodia y tonos', capsules: [
      cap('y2-c14', 14, 'L', '10 min', 'El tono salmódico', 'Salterio · tradición litúrgica', 'Los salmos tienen tonos propios para cantarse con dignidad y verdad, sin volverlos canción.'),
      cap('y2-c15', 15, 'L', '10 min', 'Formar un salmista', 'IGMR 61', 'El salmista es un ministro: prepararlo bien eleva toda la Liturgia de la Palabra.'),
    ]},
    { id: 'y2-m6', term: 'Módulo 6', title: 'El órgano y los instrumentos', capsules: [
      cap('y2-c16', 16, 'M', '9 min', 'El órgano, en gran estima', 'Sacrosanctum Concilium 120', 'El órgano de tubos es tenido en gran estima porque eleva el espíritu y sostiene el canto de la asamblea.'),
      cap('y2-c17', 17, 'M', '10 min', 'Criterios para otros instrumentos', 'Musicam Sacram', 'Otros instrumentos pueden admitirse si son aptos para el uso sagrado y sirven a la oración, con permiso del Ordinario.'),
      cap('y2-c18', 18, 'M', '9 min', 'Sobriedad instrumental por tiempos', 'Normas del Año Litúrgico', 'En Adviento y Cuaresma el instrumento se modera; en Pascua y solemnidades, se despliega. El tiempo manda.'),
    ]},
  ],
};

const YEAR3: Track = {
  id: 'y3',
  cycle: 'Ciclo III · Avanzado',
  title: 'Año 3 — Maestros y transmisores',
  motto: 'Recibimos un tesoro para entregarlo',
  status: 'active',
  requiresTrack: 'y2',
  certificate: 'Formador de Música Sacra — Avanzado',
  modules: [
    { id: 'y3-m1', term: 'Módulo 1', title: 'Historia de la música sacra', capsules: [
      cap('y3-c1', 1, 'E', '11 min', 'De la salmodia hebrea a la Iglesia primitiva', 'Historia de la liturgia', 'Cristo y los apóstoles cantaron salmos; la Iglesia naciente heredó y transformó ese canto orante.'),
      cap('y3-c2', 2, 'E', '11 min', 'San Ambrosio y san Gregorio Magno', 'Patrística · tradición romana', 'Ambrosio da a la Iglesia el himno; a Gregorio se atribuye el impulso del canto que lleva su nombre.'),
      cap('y3-c3', 3, 'M', '12 min', 'Del canto llano a la polifonía; Trento', 'Concilio de Trento', 'La polifonía floreció, y Trento la purificó: nunca a costa de la claridad del texto sagrado.'),
      cap('y3-c4', 4, 'M', '11 min', 'Del barroco al Motu Proprio de Pío X', 'Tra le Sollecitudini (1903)', 'Tras siglos de esplendor y también de abusos operísticos, Pío X devuelve la música a su fin: el culto.'),
      cap('y3-c5', 5, 'E', '11 min', 'El siglo XX y el Concilio Vaticano II', 'Sacrosanctum Concilium', 'El Concilio conserva el tesoro y abre la participación de todos: continuidad, no ruptura.'),
    ]},
    { id: 'y3-m2', term: 'Módulo 2', title: 'Armonía funcional aplicada', capsules: [
      cap('y3-c6', 6, 'M', '12 min', 'Funciones tonales', 'Armonía tonal', 'Tónica, subdominante y dominante: entender las funciones libera al músico de tocar de memoria.'),
      cap('y3-c7', 7, 'M', '11 min', 'Cadencias y conducción de voces', 'Armonía tonal', 'Las cadencias respiran la frase; la buena conducción de voces hace natural y noble el acompañamiento.'),
      cap('y3-c8', 8, 'M', '10 min', 'Rearmonizar con criterio', 'Práctica de acompañamiento', 'Enriquecer la armonía es lícito si sirve al canto y no lo enturbia. El criterio manda sobre el efecto.'),
    ]},
    { id: 'y3-m3', term: 'Módulo 3', title: 'Latín litúrgico esencial', capsules: [
      cap('y3-c9', 9, 'L', '10 min', 'Pronunciación eclesiástica del latín', 'Tradición romana', 'El latín de la Iglesia tiene su pronunciación propia; conocerla honra los textos que cantamos.'),
      cap('y3-c10', 10, 'L', '11 min', 'Comprender el Ordinario en latín', 'Ordinario de la Misa', 'Kyrie, Gloria, Sanctus, Agnus Dei: cantar con sentido exige entender lo que cada palabra proclama.'),
      cap('y3-c11', 11, 'E', '11 min', 'Grandes textos: Pange Lingua, Adoro te', 'Himnos de santo Tomás de Aquino', 'Los himnos eucarísticos de santo Tomás son teología hecha canto: joyas para conocer y amar.'),
    ]},
    { id: 'y3-m4', term: 'Módulo 4', title: 'Componer y adaptar cantos', capsules: [
      cap('y3-c12', 12, 'M', '12 min', 'Poner música a un texto litúrgico', 'Criterios de composición sacra', 'Componer para la liturgia es servir al texto: la melodía nace de la palabra, no la palabra de la melodía.'),
      cap('y3-c13', 13, 'M', '11 min', 'Adaptar sin traicionar', 'Fidelidad litúrgica', 'Adaptar un canto exige respetar su forma y su fe; el atajo fácil suele empobrecer la oración.'),
    ]},
    { id: 'y3-m5', term: 'Módulo 5', title: 'Dirección e interpretación avanzada', capsules: [
      cap('y3-c14', 14, 'M', '11 min', 'Fraseo y respiración del texto', 'Interpretación', 'La música respira con el sentido de la frase orante; el fraseo es exégesis sonora del texto.'),
      cap('y3-c15', 15, 'M', '11 min', 'Interpretar según el tiempo litúrgico', 'Año litúrgico', 'El mismo canto se dice distinto en Cuaresma o en Pascua: el tiempo colorea la interpretación.'),
    ]},
    { id: 'y3-m6', term: 'Módulo 6', title: 'Formar nuevos cantores', capsules: [
      cap('y3-c16', 16, 'E', '11 min', 'El coro que se multiplica', 'Vocación del músico litúrgico', 'Quien recibió formación tiene el deber de transmitirla: formar a otros es asegurar el futuro del canto sacro.'),
      cap('y3-c17', 17, 'E', '10 min', 'Transmitir la fe por la música', 'Evangelización y belleza', 'La belleza evangeliza: un coro que forma nuevos cantores siembra fe a través del canto.'),
    ]},
  ],
};

// ── Formación permanente: cápsulas mensuales, disponibles siempre (mantienen la racha) ──
const P = (id: string, eje: Eje, serie: string, title: string, source: string, idea: string, summary: string): Capsule =>
  ({ id, n: 0, eje, duration: '6 min', title: `${serie}: ${title}`, source, idea, summary });

export const PERMANENT_CAPSULES: Capsule[] = [
  P('perm-doc1', 'E', 'Documento del mes', 'Sacrosanctum Concilium 112–121', 'Concilio Vaticano II', 'El capítulo VI del Concilio sobre la música sacra, en breve.', 'Recorremos los números clave: la música como parte integrante, el tesoro que se conserva, el gregoriano y el órgano.'),
  P('perm-doc2', 'E', 'Documento del mes', 'Musicam Sacram', 'Instrucción de 1967', 'Cómo se canta la Misa según la instrucción posconciliar.', 'Grados de participación cantada, funciones y la insistencia en la formación de músicos y fieles.'),
  P('perm-doc3', 'E', 'Documento del mes', 'Tra le Sollecitudini', 'San Pío X, 1903', 'El motu proprio que reformó la música sacra.', 'Las tres cualidades —santidad, arte, universalidad— y el gregoriano como modelo supremo.'),
  P('perm-santo1', 'E', 'Santo músico', 'Santa Cecilia', 'Patrona de los músicos', 'La virgen mártir que canta a Dios en su corazón.', 'Su testimonio recuerda que el músico canta primero con la vida.'),
  P('perm-santo2', 'E', 'Santo músico', 'San Gregorio Magno', 'Papa y doctor', 'El impulso del canto que lleva su nombre.', 'Su celo por la liturgia dio nombre al canto propio de la Iglesia romana.'),
  P('perm-santo3', 'E', 'Santo músico', 'San Ambrosio', 'Obispo de Milán', 'El padre del himno cristiano en Occidente.', 'Introdujo el canto de himnos y antífonas para sostener la fe del pueblo.'),
  P('perm-santo4', 'E', 'Santo músico', 'Santa Hildegarda de Bingen', 'Doctora de la Iglesia', 'Mística y compositora del siglo XII.', 'Su música luminosa nace de la contemplación: arte y oración inseparables.'),
  P('perm-error1', 'L', 'Error frecuente', 'Cuando el canto tapa la Palabra', 'Musicam Sacram · SC', 'El acompañamiento o el volumen que impiden comprender el texto.', 'La palabra es oración: si no se entiende, algo hay que corregir.'),
  P('perm-error2', 'L', 'Error frecuente', 'Repertorio ajeno al tiempo litúrgico', 'Normas del Año Litúrgico', 'Cantar Aleluya en Cuaresma o villancicos fuera de Navidad.', 'Cada tiempo pide su canto; ignorarlo confunde la celebración.'),
  P('perm-error3', 'L', 'Error frecuente', 'El aplauso en la liturgia', 'Espíritu de la liturgia', 'Aplaudir al coro convierte el culto en espectáculo.', 'La Misa no busca aplauso, sino adoración; el mejor elogio es el silencio orante.'),
  P('perm-pieza1', 'M', 'Pieza del mes', 'Ave verum corpus (Mozart)', 'Apreciación musical', 'Una joya breve de adoración eucarística.', 'Escucha guiada: cómo Mozart sirve al texto con una sencillez sublime.'),
  P('perm-pieza2', 'M', 'Pieza del mes', 'Sicut cervus (Palestrina)', 'Apreciación musical', 'La sed del alma hecha polifonía serena.', 'Escucha guiada: líneas que fluyen como agua hacia Dios.'),
  P('perm-pieza3', 'M', 'Pieza del mes', 'O magnum mysterium (Victoria)', 'Apreciación musical', 'El asombro ante el misterio de la Navidad.', 'Escucha guiada: intensidad contenida al servicio del texto.'),
];

export const CURRICULUM: Track[] = [YEAR1, YEAR1_THEORY, YEAR2, YEAR3];

/** Cápsulas del Año 1 (progreso principal / racha del track intensivo). */
export const ACTIVE_CAPSULES: Capsule[] = YEAR1.modules.flatMap((m) => m.capsules);

export function trackCapsules(t: Track): Capsule[] {
  return t.modules.flatMap((m) => m.capsules);
}

/** Todas las cápsulas (los 3 años + permanentes) — para abrir cualquiera por id. */
const ALL_CAPSULES: Capsule[] = [...CURRICULUM.flatMap(trackCapsules), ...PERMANENT_CAPSULES];

export function findCapsule(id: string): Capsule | undefined {
  return ALL_CAPSULES.find((c) => c.id === id);
}

export function isTrackDone(t: Track, done: Set<string>): boolean {
  const caps = trackCapsules(t);
  return caps.length > 0 && caps.every((c) => done.has(c.id));
}

/** Insignia que se gana al completar cada módulo (trimestre) del Año 1. */
export const MODULE_BADGES: Record<string, { name: string; emoji: string }> = {
  'y1-t1': { name: 'Servidor del altar', emoji: '🕊️' },
  'y1-t2': { name: 'Conoce la Misa', emoji: '⛪' },
  'y1-t3': { name: 'Voz al servicio', emoji: '🎵' },
  'y1-t4': { name: 'Guardián del tiempo litúrgico', emoji: '📅' },
  // Teoría musical
  'y1-th-a': { name: 'Oído despierto', emoji: '🔊' },
  'y1-th-b': { name: 'Sabe leer música', emoji: '🎼' },
  'y1-th-c': { name: 'Solfea', emoji: '🎯' },
  'y1-th-d': { name: 'Domina los acordes', emoji: '🎹' },
  'y1-th-e': { name: 'Círculo de quintas', emoji: '🧭' },
};

export function isModuleDone(mod: Module, done: Set<string>): boolean {
  return mod.capsules.length > 0 && mod.capsules.every((c) => done.has(c.id));
}

// ── Quizzes BASE (por defecto) — editables desde el Panel Admin (course_quizzes en BD).
// Año 1 (camino): 3-4 preguntas. Años 2 y 3: preguntas base (el que graba puede editarlas).
// `answer` = índice de la opción correcta. Teoría Musical tiene su quiz inline (ya 3-4).
const Q = (q: string, answer: number, ...options: string[]): QuizQuestion => ({ q, options, answer });

export const BASE_QUIZZES: Record<string, QuizQuestion[]> = {
  // ── Año 1 · Camino ──
  'y1-t1-c1': [Q('¿Qué es el canto en la liturgia?', 1, 'Un adorno para amenizar la Misa', 'Una forma de oración en sí misma', 'Un momento para el lucimiento del coro'), Q('«El que canta bien, ora…»', 1, 'una vez', 'dos veces', 'en silencio'), Q('Esa frase se atribuye a…', 2, 'san Pío X', 'santo Tomás', 'san Agustín')],
  'y1-t1-c2': [Q('Según SC 112, la música sacra es…', 1, 'un añadido opcional', 'parte integrante de la liturgia solemne', 'un concierto paralelo'), Q('El coro en la Misa ejerce un…', 1, 'espectáculo', 'ministerio', 'ensayo'), Q('El mejor "éxito" del coro es que…', 2, 'lo aplaudan', 'suene fuerte', 'la asamblea rece')],
  'y1-t1-c3': [Q('Las tres cualidades de Pío X son santidad, universalidad y…', 1, 'popularidad', 'bondad de las formas (arte verdadero)', 'brevedad'), Q('¿En qué documento las fijó?', 2, 'Musicam Sacram', 'Sacrosanctum Concilium', 'Tra le Sollecitudini'), Q('La "santidad" implica que la música…', 0, 'aparta lo profano', 'sea muy antigua', 'sea gratis')],
  'y1-t1-c4': [Q('El objetivo del canto de la asamblea es…', 1, 'que el coro brille', 'la participación activa de todos', 'llenar silencios'), Q('El coro, respecto de la asamblea…', 1, 'la reemplaza', 'la anima y sostiene', 'la ignora'), Q('¿Qué números del Concilio lo enseñan?', 2, 'SC 1 y 2', 'SC 50 y 51', 'SC 14 y 114')],
  'y1-t1-c5': [Q('Para la Iglesia, la formación del músico es…', 1, 'opcional', 'un deber, litúrgico y musical', 'solo del director'), Q('¿Qué documento insiste en la formación?', 1, 'el Catecismo', 'Musicam Sacram', 'la Biblia'), Q('«Tocar bonito»…', 2, 'es suficiente', 'no importa', 'no basta')],
  'y1-t2-c6': [Q('Las dos grandes "mesas" de la Misa son…', 0, 'la Palabra y la Eucaristía', 'el coro y el altar', 'entrada y salida'), Q('¿Cuántas grandes partes tiene la Misa?', 2, 'dos', 'tres', 'cuatro'), Q('Los ritos que abren la Misa son los…', 1, 'finales', 'iniciales', 'de comunión')],
  'y1-t2-c7': [Q('El canto de entrada sirve para…', 1, 'lucir al solista', 'iniciar y unir a la asamblea', 'cubrir tiempo'), Q('El canto de comunión es…', 1, 'un solo de órgano', 'procesional', 'optativo siempre'), Q('¿Dónde se describen sus funciones?', 2, 'en el Catecismo', 'en la Biblia', 'en la IGMR')],
  'y1-t2-c8': [Q('Kyrie, Gloria, Santo y Cordero son…', 1, 'el Propio', 'el Ordinario', 'repertorio libre'), Q('El Propio…', 1, 'es fijo', 'cambia con el día', 'no existe'), Q('Conviene mantener el Ordinario…', 2, 'distinto cada domingo', 'sin cantar', 'estable durante un tiempo')],
  'y1-t2-c9': [Q('El Salmo responsorial es…', 1, 'un relleno', 'parte de la Liturgia de la Palabra', 'optativo siempre'), Q('Idealmente se…', 1, 'recita', 'canta', 'omite'), Q('El salmista ejerce un…', 2, 'solo', 'adorno', 'ministerio')],
  'y1-t2-c10': [Q('Al elegir un canto, el primer criterio es…', 1, 'que guste al coro', 'que corresponda al momento y al rito', 'que sea nuevo'), Q('El canto está al servicio de…', 1, 'el músico', 'la acción sagrada', 'el aplauso'), Q('«Rellenar con cualquier canto» es…', 2, 'lo ideal', 'obligatorio', 'un error')],
  'y1-t3-c11': [Q('La base de un canto sostenido y afinado es…', 1, 'cantar fuerte', 'la respiración y el apoyo', 'la letra'), Q('Afinar es…', 1, 'un don de pocos', 'un hábito que se entrena', 'imposible'), Q('¿Hace falta gritar para conmover?', 1, 'sí', 'no', 'siempre')],
  'y1-t3-c12': [Q('¿Por qué importa la dicción?', 1, 'para lucir la voz', 'porque la letra es oración y debe entenderse', 'no importa'), Q('Si no se entiende la letra…', 1, 'suena mejor', 'se pierde el sentido', 'da igual'), Q('La dicción es…', 2, 'un capricho', 'un lujo', 'una exigencia litúrgica')],
  'y1-t3-c13': [Q('El tempo litúrgico debe…', 1, 'ser siempre rápido', 'ayudar a orar, ni arrastrar ni correr', 'seguir al guitarrista'), Q('¿Quién "dicta" el tempo?', 1, 'el gusto del músico', 'el momento litúrgico', 'el más rápido'), Q('Si la gente no alcanza a cantar, probablemente…', 0, 'vas muy rápido', 'vas muy lento', 'está bien')],
  'y1-t3-c14': [Q('El acompañamiento debe…', 1, 'lucirse con solos', 'sostener el canto sin taparlo', 'ser lo más fuerte'), Q('La sobriedad es…', 1, 'aburrida', 'una virtud litúrgica', 'opcional'), Q('¿Qué instrumento tiene el Concilio en gran estima?', 2, 'la batería', 'la guitarra eléctrica', 'el órgano de tubos')],
  'y1-t3-c15': [Q('El empaste coral es…', 1, 'que cada voz destaque', 'sonar como una sola voz', 'cantar muy fuerte'), Q('Para empastar hay que…', 1, 'subir el volumen', 'escucharse mutuamente', 'ir cada uno a su ritmo'), Q('La unidad del coro es signo de…', 2, 'la técnica', 'el ensayo', 'la comunión de la Iglesia')],
  'y1-t4-c16': [Q('Durante el Adviento, el Gloria dominical…', 1, 'se canta siempre', 'se omite (vuelve en Navidad)', 'no importa'), Q('Adviento es tiempo de…', 1, 'fiesta plena', 'espera sobria y gozosa', 'luto'), Q('En Navidad…', 0, 'vuelve el Gloria y la alegría', 'se calla todo', 'se ayuna')],
  'y1-t4-c17': [Q('En Cuaresma, el Aleluya…', 1, 'se canta más fuerte', 'se omite (otra aclamación)', 'solo el 1.º domingo'), Q('En Cuaresma, el Gloria dominical…', 1, 'se canta', 'se omite', 'se repite'), Q('En la Pascua…', 2, 'sigue la sobriedad', 'no se canta', 'estalla el Aleluya')],
  'y1-t4-c18': [Q('Un criterio irrenunciable al elegir un canto es…', 1, 'que sea pegajoso', 'que su letra sea conforme a la fe', 'que dure poco'), Q('Además de la fe, importa…', 0, 'la calidad y la conveniencia con el rito', 'el número de estrofas', 'el idioma'), Q('¿Todo canto religioso sirve para la Misa?', 1, 'sí', 'no', 'solo los antiguos')],
  'y1-t4-c19': [Q('Según SC 116, el canto gregoriano…', 1, 'está prohibido', 'ocupa el primer lugar', 'es solo para monjes'), Q('El gregoriano es el canto propio de…', 2, 'la ópera', 'los conciertos', 'la liturgia romana'), Q('¿Es una reliquia de museo?', 1, 'sí', 'no, es un tesoro vivo', 'da igual')],
  'y1-t4-c20': [Q('La meta última de la formación del coro es…', 2, 'ganar concursos', 'tener más repertorio', 'servir mejor a la oración de la Iglesia'), Q('El coro es una escuela de…', 1, 'música pop', 'oración', 'competencia'), Q('¿La formación termina?', 1, 'sí, al final del año', 'no, es permanente', 'nunca empieza')],

  // ── Año 2 · Intermedio (preguntas base) ──
  'y2-c1': [Q('La liturgia es, para el Concilio…', 1, 'un rito secundario', 'fuente y culmen de la vida de la Iglesia', 'solo una costumbre'), Q('¿Qué número lo enseña?', 2, 'SC 100', 'SC 50', 'SC 10'), Q('La música litúrgica…', 0, 'brota de la liturgia y conduce a ella', 'es independiente del rito', 'es un concierto')],
  'y2-c2': [Q('Para Benedicto XVI, la música sacra…', 1, 'decora el rito', 'hace presente el misterio (es signo)', 'es un adorno'), Q('¿La belleza litúrgica es mera decoración?', 1, 'sí', 'no, es signo del misterio', 'a veces'), Q('Por eso la calidad musical importa…', 0, 'teológicamente', 'solo estéticamente', 'nada')],
  'y2-c3': [Q('El Quirógrafo de 2003 es de…', 2, 'Pío X', 'Benedicto XVI', 'Juan Pablo II'), Q('Celebra el centenario de…', 1, 'el Concilio', 'Tra le Sollecitudini', 'Musicam Sacram'), Q('Los principios de Pío X…', 0, 'siguen vigentes', 'quedaron derogados', 'nunca existieron')],
  'y2-c4': [Q('El gregoriano se organiza en…', 1, 'tonalidades mayores', 'ocho modos', 'doce escalas'), Q('La nota de reposo de un modo se llama…', 2, 'tónica', 'dominante', 'finalis'), Q('¿Está escrito en mayor/menor?', 1, 'sí', 'no', 'a veces')],
  'y2-c5': [Q('Los neumas del gregoriano se escriben en…', 1, 'pentagrama de 5 líneas', 'tetragrama de 4 líneas', 'sin líneas'), Q('Un "punctum" representa…', 0, 'una nota', 'un silencio', 'un acorde'), Q('Leer neumas permite…', 2, 'ignorar la melodía', 'tocar más rápido', 'cantar el gregoriano sin sacar de oído')],
  'y2-c6': [Q('El Kyriale reúne…', 1, 'canciones populares', 'los cantos del Ordinario', 'salmos'), Q('«Kyrie eleison» significa…', 0, 'Señor, ten piedad', 'Gloria a Dios', 'Santo'), Q('Se canta idealmente…', 2, 'con mucha orquesta', 'muy rápido', 'con sobriedad')],
  'y2-c7': [Q('El Sanctus une nuestra voz a la de…', 1, 'los solistas', 'los ángeles', 'el público'), Q('Es una aclamación de…', 2, 'la entrada', 'la comunión', 'la Plegaria Eucarística'), Q('¿Es solo del coro?', 1, 'sí', 'no, de toda la asamblea', 'del organista')],
  'y2-c8': [Q('Palestrina es modelo de…', 1, 'volumen', 'claridad del texto en la polifonía', 'rapidez'), Q('¿Qué concilio pidió claridad del texto?', 2, 'Vaticano II', 'Nicea', 'Trento'), Q('Su obra símbolo es…', 0, 'la Missa Papae Marcelli', 'el Réquiem de Mozart', 'el Mesías')],
  'y2-c9': [Q('Tomás Luis de Victoria compuso…', 1, 'ópera', 'solo música sacra', 'música de baile'), Q('Es la cumbre española de…', 2, 'el canto llano', 'la zarzuela', 'la polifonía'), Q('Su música destaca por su…', 0, 'intensidad espiritual', 'volumen', 'velocidad')],
  'y2-c10': [Q('Al cantar a dos voces hay que…', 1, 'gritar más', 'escuchar la otra voz', 'ir cada uno a su aire'), Q('El paso previo a dos voces es…', 0, 'el unísono', 'la polifonía a 8', 'el solo'), Q('Conviene empezar por…', 2, 'una obra entera', 'lo más difícil', 'pasajes cortos')],
  'y2-c11': [Q('El pulso que marca el director es el…', 1, 'timbre', 'ictus', 'tempo libre'), Q('El gesto preparatorio anticipa…', 0, 'la entrada y la respiración', 'el final', 'el aplauso'), Q('El director…', 2, 'protagoniza', 'se luce', 'sirve al coro')],
  'y2-c12': [Q('Un buen ensayo…', 1, 'se improvisa', 'se planifica', 'repite todo entero'), Q('No conviene…', 0, 'repetir la obra entera cada vez', 'trabajar pasajes difíciles', 'calentar la voz'), Q('Además de notas, el ensayo…', 2, 'solo corrige', 'pierde tiempo', 'forma litúrgicamente')],
  'y2-c13': [Q('La dinámica debe nacer de…', 1, 'el efecto', 'el sentido del texto', 'el azar'), Q('Fuerte y suave están…', 0, 'al servicio del sentido', 'para lucirse', 'de adorno'), Q('Aplicar matices "porque quedan bonitos" es…', 2, 'interpretar', 'orar', 'solo decorar')],
  'y2-c14': [Q('El tono salmódico tiene entonación, recitación, mediación y…', 2, 'coda', 'estribillo', 'terminación'), Q('La cuerda de recitación (tenor) es donde…', 0, 'se dice el texto', 'se calla', 'se acelera'), Q('¿Se canta como una canción?', 1, 'sí', 'no, con su modo propio', 'nunca se canta')],
  'y2-c15': [Q('El salmista es un…', 2, 'solista de lujo', 'adorno', 'ministro'), Q('¿Hace falta una gran voz?', 1, 'sí, imprescindible', 'no; sí un corazón que sirve al texto', 'da igual'), Q('Conviene formar…', 0, 'varios salmistas en la comunidad', 'uno solo para siempre', 'ninguno')],
  'y2-c16': [Q('El órgano de tubos es tenido en…', 1, 'poca estima', 'gran estima (SC 120)', 'igual que todos'), Q('¿Por qué?', 0, 'eleva el espíritu y sostiene el canto', 'suena fuerte', 'es caro'), Q('Se usa con…', 2, 'muchos adornos', 'solos constantes', 'sobriedad')],
  'y2-c17': [Q('Otros instrumentos se admiten si…', 1, 'están de moda', 'son aptos para el uso sagrado', 'suenan fuerte'), Q('Con el juicio de…', 2, 'el coro', 'el público', 'la autoridad competente'), Q('El criterio es…', 0, 'la aptitud para el culto', 'la moda', 'el gusto personal')],
  'y2-c18': [Q('En Cuaresma, el instrumento…', 1, 'se despliega', 'se modera (solo sostiene)', 'desaparece del todo'), Q('En Pascua y solemnidades…', 0, 'se despliega', 'se calla', 'se prohíbe'), Q('¿Manda el gusto o el tiempo litúrgico?', 1, 'el gusto', 'el tiempo litúrgico', 'ninguno')],

  // ── Año 3 · Avanzado (preguntas base) ──
  'y3-c1': [Q('La música sacra hunde sus raíces en…', 1, 'la ópera', 'la salmodia del Templo y la sinagoga', 'la música celta'), Q('¿Cristo y los apóstoles cantaron?', 0, 'sí, salmos', 'no', 'solo escucharon'), Q('«Después de cantar el himno, salieron» está en…', 2, 'un tratado', 'una carta', 'el Evangelio (Última Cena)')],
  'y3-c2': [Q('San Ambrosio dio a Occidente…', 1, 'la polifonía', 'el himno', 'el órgano'), Q('A san Gregorio Magno se vincula…', 0, 'el canto gregoriano', 'la ópera', 'la guitarra'), Q('Ante todo, ambos eran…', 2, 'músicos de corte', 'compositores', 'pastores')],
  'y3-c3': [Q('La polifonía nació a partir del…', 1, 'jazz', 'canto llano', 'rock'), Q('El Concilio de Trento pidió…', 0, 'claridad del texto', 'más voces', 'silencio'), Q('¿Prohibió Trento la polifonía?', 1, 'sí', 'no', 'solo la de Palestrina')],
  'y3-c4': [Q('Un abuso del barroco fue el estilo…', 1, 'gregoriano', 'operístico/teatral', 'silencioso'), Q('San Pío X devolvió la música a…', 0, 'su fin: el culto', 'los teatros', 'las cortes'), Q('El movimiento de reforma previo se llamó…', 2, 'romántico', 'clásico', 'ceciliano')],
  'y3-c5': [Q('El Concilio Vaticano II mandó conservar…', 0, 'el tesoro de la música sacra', 'solo lo nuevo', 'nada'), Q('Y abrir…', 1, 'la ópera', 'la participación activa de todos', 'los conciertos'), Q('¿Es ruptura con la tradición?', 1, 'sí', 'no, es continuidad', 'la abolió')],
  'y3-c6': [Q('Las tres funciones tonales son…', 0, 'tónica, subdominante, dominante', 'grave, medio, agudo', 'fuerte, medio, suave'), Q('La tónica representa…', 1, 'tensión', 'reposo ("casa")', 'el final del texto'), Q('La dominante crea…', 2, 'silencio', 'reposo', 'tensión que pide resolver')],
  'y3-c7': [Q('La cadencia auténtica es…', 1, 'IV–I', 'V–I', 'I–V'), Q('La cadencia plagal es…', 0, 'IV–I', 'V–I', 'ii–V'), Q('La buena conducción de voces evita…', 2, 'las cadencias', 'los acordes', 'quintas y octavas paralelas')],
  'y3-c8': [Q('Rearmonizar es lícito si…', 1, 'impresiona', 'sirve al canto y no lo enturbia', 'complica'), Q('El criterio manda sobre…', 0, 'el efecto', 'el texto', 'la oración'), Q('El mejor arreglo suele ser…', 2, 'el más complejo', 'el más fuerte', 'el que no se nota')],
  'y3-c9': [Q('En «excelsis», la c ante e/i suena…', 1, 'como k', 'como "ch" (ekschelsis)', 'como s'), Q('«gn» (Agnus) suena…', 0, 'como "ñ"', 'como "gn" separado', 'muda'), Q('Es la pronunciación…', 2, 'clásica', 'inglesa', 'eclesiástica (romana)')],
  'y3-c10': [Q('«Agnus Dei» significa…', 1, 'Gloria a Dios', 'Cordero de Dios', 'Santo'), Q('«Gloria in excelsis Deo» es…', 0, 'Gloria a Dios en las alturas', 'Señor ten piedad', 'Cordero de Dios'), Q('Cantar con sentido exige…', 2, 'ir rápido', 'cantar fuerte', 'entender el texto')],
  'y3-c11': [Q('El «Tantum Ergo» proviene del…', 1, 'Adoro te', 'Pange Lingua', 'Ave María'), Q('¿Quién compuso estos himnos?', 2, 'san Ambrosio', 'Palestrina', 'santo Tomás de Aquino'), Q('Se compusieron para la fiesta de…', 0, 'Corpus Christi', 'Navidad', 'Pentecostés')],
  'y3-c12': [Q('Al componer para la liturgia, la melodía nace de…', 1, 'la moda', 'la palabra', 'el instrumento'), Q('Respetar la prosodia significa…', 0, 'que los acentos musicales caigan en los del texto', 'ir muy rápido', 'usar muchas notas'), Q('¿La palabra sirve a la melodía?', 1, 'sí', 'no, al revés', 'nunca se relacionan')],
  'y3-c13': [Q('Al adaptar un canto hay que cuidar…', 1, 'la rima', 'la fidelidad doctrinal', 'la duración'), Q('Y la coherencia entre…', 0, 'música y sentido', 'volumen y tempo', 'coro y público'), Q('El atajo fácil suele…', 2, 'mejorar', 'no cambiar nada', 'empobrecer la oración')],
  'y3-c14': [Q('El fraseo organiza la música según…', 1, 'el volumen', 'el sentido del texto', 'el azar'), Q('Respirar en mal lugar puede…', 0, 'cambiar el sentido', 'mejorar la afinación', 'no afectar'), Q('El fraseo es como…', 2, 'gritar', 'callar', '"predicar" el texto con la música')],
  'y3-c15': [Q('En Cuaresma, la interpretación es más…', 1, 'festiva', 'recogida y sobria', 'rápida'), Q('En Pascua y solemnidades…', 0, 'plena y luminosa', 'apagada', 'muda'), Q('¿Cambia la interpretación según el tiempo?', 0, 'sí', 'no', 'solo el tempo')],
  'y3-c16': [Q('Quien recibió formación tiene el deber de…', 1, 'guardarla', 'transmitirla', 'olvidarla'), Q('Un coro maduro…', 0, 'multiplica, no acapara', 'no enseña a nadie', 'depende de uno solo'), Q('Formar nuevos cantores asegura…', 2, 'el aplauso', 'el descanso', 'el futuro del canto sacro')],
  'y3-c17': [Q('La belleza es una vía de…', 1, 'entretenimiento', 'evangelización', 'competencia'), Q('El «via pulchritudinis» es el camino de…', 0, 'la belleza', 'la técnica', 'la fama'), Q('La meta última del itinerario es…', 2, 'ganar concursos', 'saberlo todo', 'servir al altar y evangelizar cantando')],
};

/** Quiz por defecto de una cápsula (BASE_QUIZZES o el inline del currículo). */
export function baseQuizFor(capsuleId: string): QuizQuestion[] {
  return BASE_QUIZZES[capsuleId] ?? findCapsule(capsuleId)?.quiz ?? [];
}
