/**
 * Frases del Magisterio sobre la música sacra, para las pantallas de carga.
 *
 * Reemplazan a los "Preparando…" y "Releyendo…" (pedido del 27-sep-2026): mientras la
 * app trabaja, el coro y la asamblea leen una enseñanza breve. Van en orden histórico,
 * de san Pío X (1903) a la Ordenación General del Misal Romano, y se muestran en orden
 * aleatorio (ver useFraseRotativa).
 *
 * Criterio: frases CORTAS, que se lean con calma en los segundos que dura una carga.
 * Por eso varias están abreviadas; cuando el texto se resume o se reformula (y no es una
 * cita literal de la traducción), la fuente lleva «cf.». Los números remiten al párrafo
 * del documento, para quien quiera leerlo entero en vatican.va.
 */

export interface FraseMagisterio {
  texto: string;
  fuente: string;
}

export const FRASES_MAGISTERIO: FraseMagisterio[] = [
  // ── San Pío X, Tra le sollecitudini (1903) ──────────────────────────────────
  {
    texto: 'La música sagrada, parte integrante de la liturgia solemne, participa de su fin: la gloria de Dios y la santificación de los fieles.',
    fuente: 'San Pío X, Tra le sollecitudini, 1',
  },
  {
    texto: 'La música sagrada debe tener en grado eminente las cualidades de la liturgia: la santidad y la bondad de las formas.',
    fuente: 'San Pío X, Tra le sollecitudini, 2',
  },
  {
    texto: 'Una composición será tanto más sagrada y litúrgica cuanto más se acerque a la melodía gregoriana.',
    fuente: 'cf. San Pío X, Tra le sollecitudini, 3',
  },
  {
    texto: 'La participación activa en los sagrados misterios es la fuente primera e indispensable del verdadero espíritu cristiano.',
    fuente: 'cf. San Pío X, Tra le sollecitudini, introducción',
  },
  {
    texto: 'Siendo el canto lo principal, el órgano y los instrumentos deben sostenerlo, nunca oprimirlo.',
    fuente: 'cf. San Pío X, Tra le sollecitudini',
  },

  // ── Pío XI, Divini cultus (1928) ────────────────────────────────────────────
  {
    texto: 'Los fieles no deben asistir a la liturgia como extraños o mudos espectadores.',
    fuente: 'cf. Pío XI, Divini cultus, 9',
  },

  // ── Pío XII, Musicae sacrae disciplina (1955) ───────────────────────────────
  {
    texto: 'El canto sagrado eleva la mente de los fieles hacia Dios y aviva su devoción.',
    fuente: 'cf. Pío XII, Musicae sacrae disciplina',
  },

  // ── Concilio Vaticano II, Sacrosanctum Concilium (1963) ─────────────────────
  {
    texto: 'La Iglesia desea que todos los fieles participen de la liturgia de manera plena, consciente y activa.',
    fuente: 'cf. Sacrosanctum Concilium, 14',
  },
  {
    texto: 'Los que pertenecen a la schola cantorum desempeñan un auténtico ministerio litúrgico.',
    fuente: 'Sacrosanctum Concilium, 29',
  },
  {
    texto: 'Para promover la participación activa, foméntense las aclamaciones, las respuestas, los salmos y los cantos del pueblo.',
    fuente: 'cf. Sacrosanctum Concilium, 30',
  },
  {
    texto: 'Guárdese también, a su debido tiempo, un silencio sagrado.',
    fuente: 'Sacrosanctum Concilium, 30',
  },
  {
    texto: 'El canto sagrado, unido a las palabras, es parte necesaria o integral de la liturgia solemne.',
    fuente: 'Sacrosanctum Concilium, 112',
  },
  {
    texto: 'La música sacra será tanto más santa cuanto más íntimamente unida esté a la acción litúrgica.',
    fuente: 'Sacrosanctum Concilium, 112',
  },
  {
    texto: 'La acción litúrgica reviste una forma más noble cuando se celebra solemnemente con canto.',
    fuente: 'cf. Sacrosanctum Concilium, 113',
  },
  {
    texto: 'Consérvese y cultívese con sumo cuidado el tesoro de la música sacra.',
    fuente: 'Sacrosanctum Concilium, 114',
  },
  {
    texto: 'La Iglesia reconoce el canto gregoriano como el propio de la liturgia romana.',
    fuente: 'Sacrosanctum Concilium, 116',
  },
  {
    texto: 'Foméntese con empeño el canto religioso popular, para que resuenen las voces de los fieles.',
    fuente: 'cf. Sacrosanctum Concilium, 118',
  },
  {
    texto: 'Téngase en gran estima el órgano de tubos: su sonido eleva poderosamente las almas hacia Dios.',
    fuente: 'cf. Sacrosanctum Concilium, 120',
  },
  {
    texto: 'Los compositores están llamados a cultivar la música sacra y a acrecentar su tesoro.',
    fuente: 'cf. Sacrosanctum Concilium, 121',
  },

  // ── Musicam sacram (1967) ───────────────────────────────────────────────────
  {
    texto: 'Por la unión de las voces se alcanza más profundamente la unión de los corazones.',
    fuente: 'cf. Musicam sacram, 5',
  },
  {
    texto: 'Con el canto, las almas se elevan más fácilmente a las realidades celestiales.',
    fuente: 'cf. Musicam sacram, 5',
  },
  {
    texto: 'La verdadera solemnidad no depende tanto de la riqueza del canto como de una celebración digna y religiosa.',
    fuente: 'cf. Musicam sacram, 11',
  },
  {
    texto: 'Nada hay más solemne y festivo que una asamblea que expresa, toda entera, su fe y su piedad con el canto.',
    fuente: 'cf. Musicam sacram, 16',
  },
  {
    texto: 'Además de la formación musical, los cantores necesitan una adecuada formación litúrgica y espiritual.',
    fuente: 'cf. Musicam sacram, 24',
  },
  {
    texto: 'Los instrumentos pueden sostener las voces, facilitar la participación y hacer más profunda la unidad de la asamblea.',
    fuente: 'cf. Musicam sacram, 64',
  },

  // ── Catecismo de la Iglesia Católica (1992) ────────────────────────────────
  {
    texto: 'El canto y la música son signos tanto más elocuentes cuanto más unidos están a la acción litúrgica.',
    fuente: 'cf. Catecismo de la Iglesia Católica, 1157',
  },
  {
    texto: 'Belleza de la oración, participación unánime y solemnidad: tres criterios para el canto litúrgico.',
    fuente: 'cf. Catecismo de la Iglesia Católica, 1157',
  },

  // ── San Juan Pablo II, Quirógrafo (2003) y Benedicto XVI (2007) ────────────
  {
    texto: 'La música litúrgica ha de ser verdadero arte, capaz de expresar el Misterio que se celebra.',
    fuente: 'cf. San Juan Pablo II, Quirógrafo en el centenario de Tra le sollecitudini',
  },
  {
    texto: 'En el arte de celebrar, el canto litúrgico desempeña un papel importante.',
    fuente: 'cf. Benedicto XVI, Sacramentum caritatis, 42',
  },
  {
    texto: 'No todas las músicas son iguales: el canto debe estar bien integrado en la forma propia de la celebración.',
    fuente: 'cf. Benedicto XVI, Sacramentum caritatis, 42',
  },

  // ── Ordenación General del Misal Romano ─────────────────────────────────────
  {
    texto: '«Cantar es propio de quien ama.»',
    fuente: 'San Agustín, citado en la IGMR, 39',
  },
  {
    texto: '«Quien canta bien, ora dos veces.»',
    fuente: 'Proverbio antiguo, citado en la IGMR, 39',
  },
  {
    texto: 'Téngase en gran estima el uso del canto en la celebración de la Misa.',
    fuente: 'IGMR, 40',
  },
  {
    texto: 'Conviene que los fieles sepan cantar juntos en latín algunas partes del Ordinario, como el Credo y el Padre nuestro.',
    fuente: 'cf. IGMR, 41',
  },
  {
    texto: 'El silencio sagrado también forma parte de la celebración.',
    fuente: 'cf. IGMR, 45',
  },
  {
    texto: 'El canto de entrada fomenta la unión de los que se reúnen y los introduce en el misterio del tiempo litúrgico.',
    fuente: 'cf. IGMR, 47',
  },
  {
    texto: 'Con el Aleluya, la asamblea acoge y saluda al Señor que le va a hablar en el Evangelio.',
    fuente: 'cf. IGMR, 62',
  },
  {
    texto: 'En el Santo, toda la asamblea se une a las criaturas celestiales.',
    fuente: 'cf. IGMR, 79',
  },
  {
    texto: 'El canto de comunión expresa, por la unión de las voces, la unión espiritual de quienes comulgan.',
    fuente: 'cf. IGMR, 86',
  },
  {
    texto: 'El coro canta las partes que le corresponden y promueve la participación activa de los fieles en el canto.',
    fuente: 'cf. IGMR, 103',
  },
];
