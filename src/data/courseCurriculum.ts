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
        [{ q: 'Los tres elementos de la música son…', options: ['letra, voz y volumen', 'melodía, armonía y ritmo', 'grave, medio y agudo'], answer: 1 }]),
      th('y1-th-c2', 2, '8 min', 'Las propiedades del sonido', 'Acústica musical',
        'Todo sonido tiene cuatro propiedades: altura, duración, intensidad y timbre.',
        'Altura (grave/agudo, según la frecuencia), duración (largo/corto), intensidad (fuerte/suave) y timbre (el "color" que distingue una voz de un órgano). La música juega con las cuatro.',
        [{ q: '¿Qué propiedad define si una nota es grave o aguda?', options: ['la intensidad', 'la altura', 'el timbre'], answer: 1 }]),
    ]},
    { id: 'y1-th-b', term: 'Módulo B', title: 'La escritura musical', capsules: [
      th('y1-th-c3', 3, '9 min', 'El pentagrama y el endecagrama', 'Notación musical',
        'El pentagrama tiene cinco líneas; uniendo el de Sol y el de Fa se forma el gran sistema (endecagrama) con el Do central en medio.',
        'Las notas se escriben en las líneas y espacios del pentagrama, y en líneas adicionales fuera de él. El "endecagrama" (once líneas) une las claves de Sol y Fa —clave para el órgano—, con el Do central como puente.',
        [{ q: '¿Cuántas líneas tiene un pentagrama?', options: ['cuatro', 'cinco', 'seis'], answer: 1 }]),
      th('y1-th-c4', 4, '8 min', 'Las claves (Sol, Fa, Do)', 'Notación musical',
        'La clave fija el nombre de las notas en el pentagrama; Sol para agudos, Fa para graves, Do para voces medias.',
        'Sin clave, las notas no tienen nombre. La clave de Sol se usa para sonidos agudos (voces altas, mano derecha del órgano); la de Fa, para graves (bajos, pedal). El organista lee ambas a la vez.',
        [{ q: 'La clave de Fa se usa sobre todo para sonidos…', options: ['agudos', 'graves', 'medios'], answer: 1 }]),
      th('y1-th-c5', 5, '8 min', 'Las notas y su ubicación', 'Notación musical',
        'Siete nombres —Do, Re, Mi, Fa, Sol, La, Si— se ubican en líneas y espacios y se repiten por octavas.',
        'Aprender a reconocer cada nota por su posición es leer música. Con la clave de Sol, memoriza las notas en líneas y espacios; luego se amplía con líneas adicionales.',
        [{ q: '¿Cuántos nombres de nota se repiten en toda la música?', options: ['cinco', 'siete', 'doce'], answer: 1 }]),
      th('y1-th-c6', 6, '10 min', 'Duración de las notas y silencios', 'Ritmo · notación',
        'Cada figura (redonda, blanca, negra, corchea…) vale la mitad de la anterior; los silencios son su ausencia con igual valor.',
        'Redonda = 2 blancas = 4 negras = 8 corcheas. A cada figura le corresponde un silencio de igual duración. Dominar esto es la base de la lectura rítmica.',
        [{ q: 'Una blanca equivale a…', options: ['una negra', 'dos negras', 'cuatro negras'], answer: 1 }]),
      th('y1-th-c7', 7, '9 min', 'Compás, métrica y pulso', 'Ritmo',
        'El pulso es el latido regular; el compás lo agrupa (2/4, 3/4, 4/4) con acentos.',
        'El número de arriba dice cuántos tiempos hay por compás; el de abajo, qué figura vale un tiempo. El primer tiempo lleva el acento. Sentir el pulso y el compás ordena el canto y el acompañamiento.',
        [{ q: 'En un compás de 3/4 hay…', options: ['dos tiempos', 'tres tiempos', 'cuatro tiempos'], answer: 1 }]),
      th('y1-th-c8', 8, '8 min', 'Alteraciones: sostenido, bemol, becuadro', 'Notación musical',
        'El sostenido sube medio tono, el bemol lo baja, y el becuadro anula la alteración.',
        'Estos signos modifican la altura de una nota en un semitono. Son imprescindibles para las escalas, las tonalidades y —más adelante— el círculo de quintas.',
        [{ q: 'El sostenido (♯) hace que la nota…', options: ['suba medio tono', 'baje medio tono', 'no cambie'], answer: 0 }]),
    ]},
    { id: 'y1-th-c', term: 'Módulo C', title: 'Solfeo', capsules: [
      th('y1-th-c9', 9, '9 min', 'Solfeo rítmico', 'Solfeo',
        'Leer y ejecutar solo el ritmo (con palmas o percusión) antes de añadir la altura.',
        'El solfeo rítmico entrena a leer figuras y silencios a tiempo, marcando el pulso. Es el primer paso para leer música con seguridad.',
        [{ q: 'El solfeo rítmico se ocupa sobre todo de…', options: ['la afinación', 'la duración y el pulso', 'el timbre'], answer: 1 }]),
      th('y1-th-c10', 10, '9 min', 'Solfeo hablado', 'Solfeo',
        'Nombrar las notas (Do, Re, Mi…) en voz alta y a tiempo, sin entonar.',
        'Une la lectura de las notas con el ritmo, pero sin cantar la altura todavía. Prepara el paso siguiente: entonar.',
        [{ q: 'En el solfeo hablado…', options: ['se cantan las notas afinadas', 'se nombran las notas a tiempo, sin afinar', 'solo se palmea el ritmo'], answer: 1 }]),
      th('y1-th-c11', 11, '10 min', 'Solfeo cantado (entonado)', 'Solfeo',
        'Cantar las notas afinadas: unir nombre, ritmo y altura.',
        'Es la meta del solfeo: leer y entonar. Se apoya en la escala y en los intervalos (módulo siguiente). Afinar leyendo transforma a un coro.',
        [{ q: 'El solfeo cantado añade, a lo anterior…', options: ['el timbre', 'la afinación de cada nota', 'la armonía'], answer: 1 }]),
    ]},
    { id: 'y1-th-d', term: 'Módulo D', title: 'Escalas, intervalos y acordes', capsules: [
      th('y1-th-c12', 12, '8 min', 'Tono y semitono', 'Teoría musical',
        'El semitono es la mínima distancia entre dos notas; el tono equivale a dos semitonos.',
        'En el teclado, dos teclas contiguas (con o sin negra en medio) están a un semitono. Mi–Fa y Si–Do son semitonos naturales. Tono y semitono son la unidad de medida de escalas e intervalos.',
        [{ q: 'Entre Mi y Fa hay…', options: ['un tono', 'un semitono', 'un tono y medio'], answer: 1 }]),
      th('y1-th-c13', 13, '10 min', 'La escala mayor', 'Teoría musical',
        'La escala mayor sigue el patrón Tono–Tono–semitono–Tono–Tono–Tono–semitono.',
        'Do mayor (todas las notas blancas) es el modelo: T-T-s-T-T-T-s. Ese patrón, empezado en cualquier nota, genera todas las escalas mayores (y explica sus alteraciones).',
        [{ q: 'El patrón de la escala mayor es…', options: ['T-s-T-T-s-T-T', 'T-T-s-T-T-T-s', 'todos tonos'], answer: 1 }]),
      th('y1-th-c14', 14, '10 min', 'Las escalas menores', 'Teoría musical',
        'Hay tres formas de escala menor: natural, armónica (7.º grado elevado) y melódica.',
        'La menor natural es relativa de una mayor (misma armadura). La armónica sube el 7.º grado para crear la sensible; la melódica modifica el 6.º y 7.º al subir. Cada una da un color distinto.',
        [{ q: 'La escala menor armónica se caracteriza por…', options: ['bajar el 2.º grado', 'elevar el 7.º grado', 'no tener alteraciones'], answer: 1 }]),
      th('y1-th-c15', 15, '10 min', 'Los intervalos', 'Teoría musical',
        'Un intervalo es la distancia entre dos notas; se mide por su número (2.ª, 3.ª, 5.ª…) y su calidad (mayor, menor, justa).',
        'Contar las notas da el número; contar los tonos/semitonos da la calidad. Los intervalos son la base de la afinación (solfeo cantado) y de los acordes.',
        [{ q: 'Un intervalo se define por…', options: ['su número y su calidad', 'solo su color', 'su duración'], answer: 0 }]),
      th('y1-th-c16', 16, '11 min', 'Los acordes (tríadas)', 'Armonía',
        'Una tríada son tres notas superpuestas por terceras; según sus intervalos es mayor, menor, aumentada o disminuida.',
        'Sobre una nota (fundamental) se apilan una tercera y una quinta. Tríada mayor (3.ª mayor + 3.ª menor), menor (al revés), aumentada y disminuida. Los acordes son el corazón de la armonía y del acompañamiento.',
        [{ q: 'Una tríada está formada por…', options: ['dos notas', 'tres notas por terceras', 'cinco notas'], answer: 1 }]),
      th('y1-th-c17', 17, '9 min', 'Inversiones de acordes', 'Armonía',
        'Un mismo acorde cambia de inversión según qué nota quede en el bajo: fundamental, primera o segunda inversión.',
        'Si el bajo es la fundamental, está en estado fundamental; si es la 3.ª, primera inversión; si es la 5.ª, segunda inversión. Las inversiones dan variedad y suavizan el bajo (clave en el órgano).',
        [{ q: 'Un acorde está en primera inversión cuando en el bajo suena…', options: ['la fundamental', 'la tercera', 'la quinta'], answer: 1 }]),
    ]},
    { id: 'y1-th-e', term: 'Módulo E', title: 'Tonalidad y círculo de quintas', capsules: [
      th('y1-th-c18', 18, '10 min', 'Tonalidades y armadura de clave', 'Teoría musical',
        'La tonalidad es el "centro" de una pieza; la armadura de clave indica sus sostenidos o bemoles.',
        'Cada escala mayor/menor tiene sus alteraciones fijas, escritas al inicio como armadura. Reconocer la armadura te dice la tonalidad y qué notas van alteradas en toda la pieza.',
        [{ q: 'La armadura de clave indica…', options: ['el tempo', 'los sostenidos o bemoles de la tonalidad', 'el volumen'], answer: 1 }]),
      th('y1-th-c19', 19, '12 min', 'El círculo de quintas', 'Teoría musical',
        'El círculo de quintas ordena las 12 tonalidades por intervalos de quinta: hacia la derecha se ganan sostenidos; hacia la izquierda, bemoles.',
        'Partiendo de Do (sin alteraciones), cada quinta ascendente añade un sostenido (Sol, Re, La…); cada quinta descendente añade un bemol (Fa, Sib, Mib…). Orden de sostenidos: Fa-Do-Sol-Re-La-Mi-Si; los bemoles, al revés. Es el mapa que todo organista debe dominar.',
        [{ q: 'El círculo de quintas ordena las tonalidades por intervalos de…', options: ['segunda', 'quinta', 'octava'], answer: 1 }]),
      th('y1-th-c20', 20, '11 min', 'Del círculo de quintas al acompañamiento', 'Armonía aplicada',
        'En el círculo, tónica, subdominante y dominante son vecinas: eso explica los acordes que más se usan y facilita transportar.',
        'La dominante está una quinta arriba de la tónica; la subdominante, una quinta abajo: son las vecinas inmediatas en el círculo. Con esto se arman los acompañamientos, se transporta y se entiende por qué el órgano exige este dominio.',
        [{ q: 'Respecto de la tónica, la dominante está…', options: ['una quinta arriba', 'una octava abajo', 'un semitono arriba'], answer: 0 }]),
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
