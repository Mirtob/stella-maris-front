export type PostureType = 'standing' | 'sitting' | 'kneeling';

export interface MassSection {
  id: string;
  title: string;
  text?: string;
  /**
   * Texto en latín del ordinario / las respuestas, para seguir la Misa en latín.
   * Para partes cantadas del ordinario (Kyrie, Gloria, Santo, Cordero, Padre
   * Nuestro, Credo) es el texto canónico para cantar/seguir. Solo está presente en
   * las partes con texto latino fijo; las variables (lecturas, oraciones del día)
   * no lo tienen. Se mantiene sin acentos de pronunciación (ortografía simple).
   */
  latin?: string;
  type: 'liturgy' | 'song' | 'instruction';
  posture: PostureType;
  category?: string;
  icon?: string;
  color?: string;
}

export const massOrdinary: MassSection[] = [
  // RITOS INICIALES
  {
    id: 'entrance',
    title: 'Procesión de Entrada',
    type: 'instruction',
    posture: 'standing',
    icon: '✝️',
    color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
  },
  {
    id: 'entrada-song',
    title: 'Canto de Entrada',
    type: 'song',
    posture: 'standing',
    category: 'Entrada',
    icon: '✝️'
  },
  {
    id: 'sign-cross',
    title: 'Señal de la Cruz y Saludo',
    text: '✝ En el nombre del Padre, y del Hijo, y del Espíritu Santo.\n\nR/ Amén.\n\nSacerdote: El Señor esté con ustedes.\nR/ Y con tu espíritu.',
    latin: '✝ In nomine Patris, et Filii, et Spiritus Sancti.\n\nR/ Amen.\n\nSacerdos: Dominus vobiscum.\nR/ Et cum spiritu tuo.',
    type: 'liturgy',
    posture: 'standing',
    icon: '✝️',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },
  {
    id: 'aspersion',
    title: 'Rito de Aspersión (Tiempo Pascual)',
    text: 'En el Tiempo Pascual, en lugar del acto penitencial, puede hacerse la bendición y aspersión del agua en memoria del Bautismo (IGMR 51). El sacerdote rocía al pueblo mientras se entona el canto de aspersión; se omite el Kyrie.',
    type: 'liturgy',
    posture: 'standing',
    icon: '💧',
    color: 'bg-sky-100 dark:bg-sky-900/30 border-sky-400 dark:border-sky-600'
  },
  {
    id: 'aspersion-song',
    title: 'Canto de Aspersión',
    type: 'song',
    posture: 'standing',
    category: 'Rito de Aspersión',
    icon: '💧'
  },
  {
    id: 'penitential',
    title: 'Acto Penitencial',
    text: 'Sacerdote: Hermanos: Para celebrar dignamente estos sagrados misterios, reconozcamos nuestros pecados.\n\n(Breve silencio)\n\nYo confieso ante Dios todopoderoso y ante ustedes, hermanos, que he pecado mucho de pensamiento, palabra, obra y omisión.\n\nPor mi culpa, por mi culpa, por mi gran culpa.\n\nPor eso ruego a santa María siempre Virgen, a los ángeles, a los santos y a ustedes, hermanos, que intercedan por mí ante Dios, nuestro Señor.',
    latin: 'Sacerdos: Fratres, agnoscamus peccata nostra, ut apti simus ad sacra mysteria celebranda.\n\n(Breve silentium)\n\nConfiteor Deo omnipotenti et vobis, fratres, quia peccavi nimis cogitatione, verbo, opere et omissione:\n\nmea culpa, mea culpa, mea maxima culpa.\n\nIdeo precor beatam Mariam semper Virginem, omnes Angelos et Sanctos, et vos, fratres, orare pro me ad Dominum Deum nostrum.\n\nSacerdos: Misereatur nostri omnipotens Deus et, dimissis peccatis nostris, perducat nos ad vitam aeternam.\nR/ Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },
  {
    id: 'kyrie-song',
    title: 'Señor, Ten Piedad (Kyrie)',
    latin: 'Kyrie, eleison.  R/ Kyrie, eleison.\nChriste, eleison.  R/ Christe, eleison.\nKyrie, eleison.  R/ Kyrie, eleison.',
    type: 'song',
    posture: 'standing',
    category: 'Kyrie',
    icon: '🎵'
  },
  {
    id: 'gloria-song',
    title: 'Gloria',
    latin: 'Gloria in excelsis Deo et in terra pax hominibus bonae voluntatis. Laudamus te, benedicimus te, adoramus te, glorificamus te, gratias agimus tibi propter magnam gloriam tuam, Domine Deus, Rex caelestis, Deus Pater omnipotens.\n\nDomine Fili unigenite, Iesu Christe, Domine Deus, Agnus Dei, Filius Patris, qui tollis peccata mundi, miserere nobis; qui tollis peccata mundi, suscipe deprecationem nostram. Qui sedes ad dexteram Patris, miserere nobis.\n\nQuoniam tu solus Sanctus, tu solus Dominus, tu solus Altissimus, Iesu Christe, cum Sancto Spiritu: in gloria Dei Patris. Amen.',
    type: 'song',
    posture: 'standing',
    category: 'Gloria',
    icon: '🎵'
  },
  {
    id: 'collect',
    title: 'Oración Colecta',
    text: 'Sacerdote: Oremos.\n\n(Oración del día)',
    latin: 'Sacerdos: Oremus.\n\n(Collecta diei)\n\nR/ Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },

  // LITURGIA DE LA PALABRA
  {
    id: 'sit-readings',
    title: 'Sentarse para las Lecturas',
    type: 'instruction',
    posture: 'sitting',
    icon: '📖',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'first-reading',
    title: 'Primera Lectura',
    text: 'Lector: Lectura del libro de...\n\n(Lectura del Antiguo Testamento)\n\nPalabra de Dios.\nR/ Te alabamos, Señor.',
    latin: 'Lector: Lectio libri...\n\n(Lectio Veteris Testamenti)\n\nVerbum Domini.\nR/ Deo gratias.',
    type: 'liturgy',
    posture: 'sitting',
    icon: '📖',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'psalm-song',
    title: 'Salmo Responsorial',
    type: 'song',
    posture: 'sitting',
    category: 'Salmo',
    icon: '🎵'
  },
  {
    id: 'second-reading',
    title: 'Segunda Lectura',
    text: 'Lector: Lectura de la carta...\n\n(Lectura del Nuevo Testamento)\n\nPalabra de Dios.\nR/ Te alabamos, Señor.',
    latin: 'Lector: Lectio Epistolae...\n\n(Lectio Novi Testamenti)\n\nVerbum Domini.\nR/ Deo gratias.',
    type: 'liturgy',
    posture: 'sitting',
    icon: '📖',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'stand-gospel',
    title: 'De pie para el Evangelio',
    type: 'instruction',
    posture: 'standing',
    icon: '📖',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'alleluia-song',
    title: 'Aclamación antes del Evangelio (Aleluya)',
    latin: 'Alleluia, alleluia, alleluia.\n\n(En Cuaresma se omite el Alleluia.)',
    type: 'song',
    posture: 'standing',
    category: 'Aleluya',
    icon: '🎵'
  },
  {
    id: 'gospel',
    title: 'Evangelio',
    text: 'Sacerdote: El Señor esté con ustedes.\nR/ Y con tu espíritu.\n\nSacerdote: Lectura del santo Evangelio según...\nR/ Gloria a ti, Señor.\n\n(Lectura del Evangelio)\n\nPalabra del Señor.\nR/ Gloria a ti, Señor Jesús.',
    latin: 'Sacerdos: Dominus vobiscum.\nR/ Et cum spiritu tuo.\n\nSacerdos: Lectio sancti Evangelii secundum N.\nR/ Gloria tibi, Domine.\n\n(Lectio Evangelii)\n\nVerbum Domini.\nR/ Laus tibi, Christe.',
    type: 'liturgy',
    posture: 'standing',
    icon: '✝️',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'post-gospel-song',
    title: 'Canto después del Evangelio',
    type: 'song',
    posture: 'standing',
    category: 'Post Evangelio',
    icon: '🎵'
  },
  {
    id: 'sit-homily',
    title: 'Sentarse para la Homilía',
    type: 'instruction',
    posture: 'sitting',
    icon: '💭',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'homily',
    title: 'Homilía',
    text: '(Reflexión del sacerdote sobre las lecturas)',
    type: 'liturgy',
    posture: 'sitting',
    icon: '💭',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'stand-creed',
    title: 'De pie para el Credo',
    type: 'instruction',
    posture: 'standing',
    icon: '📿',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },
  {
    id: 'creed',
    title: 'Credo',
    text: 'Creo en un solo Dios, Padre todopoderoso, Creador del cielo y de la tierra, de todo lo visible y lo invisible.\n\nCreo en un solo Señor, Jesucristo, Hijo único de Dios, nacido del Padre antes de todos los siglos: Dios de Dios, Luz de Luz, Dios verdadero de Dios verdadero, engendrado, no creado, de la misma naturaleza del Padre, por quien todo fue hecho; que por nosotros, los hombres, y por nuestra salvación bajó del cielo...\n\n(Se inclina la cabeza)\n\nY por obra del Espíritu Santo se encarnó de María, la Virgen, y se hizo hombre...\n\n(Continúa el Credo)',
    latin: 'Credo in unum Deum, Patrem omnipotentem, factorem caeli et terrae, visibilium omnium et invisibilium.\n\nEt in unum Dominum Iesum Christum, Filium Dei unigenitum, et ex Patre natum ante omnia saecula. Deum de Deo, lumen de lumine, Deum verum de Deo vero, genitum, non factum, consubstantialem Patri: per quem omnia facta sunt. Qui propter nos homines et propter nostram salutem descendit de caelis.\n\n(Se inclina la cabeza)\n\nEt incarnatus est de Spiritu Sancto ex Maria Virgine, et homo factus est.\n\nCrucifixus etiam pro nobis sub Pontio Pilato; passus et sepultus est, et resurrexit tertia die, secundum Scripturas, et ascendit in caelum, sedet ad dexteram Patris. Et iterum venturus est cum gloria, iudicare vivos et mortuos, cuius regni non erit finis.\n\nEt in Spiritum Sanctum, Dominum et vivificantem: qui ex Patre Filioque procedit. Qui cum Patre et Filio simul adoratur et conglorificatur: qui locutus est per prophetas. Et unam, sanctam, catholicam et apostolicam Ecclesiam. Confiteor unum baptisma in remissionem peccatorum. Et exspecto resurrectionem mortuorum, et vitam venturi saeculi. Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '📿',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },
  {
    id: 'creed-song',
    title: 'Credo (Cantado)',
    latin: 'Credo in unum Deum, Patrem omnipotentem... (texto completo del Credo, arriba).',
    type: 'song',
    posture: 'standing',
    category: 'Credo',
    icon: '🎵'
  },
  {
    id: 'prayers',
    title: 'Oración Universal (Oración de los Fieles)',
    text: 'Sacerdote: Oremos por las necesidades de la Iglesia y del mundo.\n\n(Intenciones)\n\nR/ Te rogamos, óyenos.',
    latin: 'Sacerdos: Oremus pro necessitatibus Ecclesiae et mundi.\n\n(Intentiones)\n\nR/ Te rogamus, audi nos.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600'
  },

  // LITURGIA EUCARÍSTICA
  {
    id: 'sit-offertory',
    title: 'Sentarse para la Preparación de las Ofrendas',
    type: 'instruction',
    posture: 'sitting',
    icon: '🍞',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'offertory-song',
    title: 'Canto de Ofertorio',
    type: 'song',
    posture: 'sitting',
    category: 'Ofertorio',
    icon: '🎵'
  },
  {
    id: 'offertory',
    title: 'Preparación de las Ofrendas',
    text: 'Sacerdote: Bendito seas, Señor, Dios del universo, por este pan, fruto de la tierra y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros pan de vida.\nR/ Bendito seas por siempre, Señor.\n\nSacerdote: Bendito seas, Señor, Dios del universo, por este vino, fruto de la vid y del trabajo del hombre, que recibimos de tu generosidad y ahora te presentamos; él será para nosotros bebida de salvación.\nR/ Bendito seas por siempre, Señor.',
    latin: 'Sacerdos: Benedictus es, Domine, Deus universi, quia de tua largitate accepimus panem, quem tibi offerimus, fructum terrae et operis manuum hominum: ex quo nobis fiet panis vitae.\nR/ Benedictus Deus in saecula.\n\nSacerdos: Benedictus es, Domine, Deus universi, quia de tua largitate accepimus vinum, quod tibi offerimus, fructum vitis et operis manuum hominum: ex quo nobis fiet potus spiritalis.\nR/ Benedictus Deus in saecula.',
    type: 'liturgy',
    posture: 'sitting',
    icon: '🕊️',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'stand-eucharist',
    title: 'De pie para la Plegaria Eucarística',
    type: 'instruction',
    posture: 'standing',
    icon: '✝️',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'prayer-offerings',
    title: 'Oración sobre las Ofrendas',
    text: 'Sacerdote: Oren, hermanos, para que este sacrificio, mío y de ustedes, sea agradable a Dios, Padre todopoderoso.\n\nR/ El Señor reciba de tus manos este sacrificio, para alabanza y gloria de su nombre, para nuestro bien y el de toda su santa Iglesia.',
    latin: 'Sacerdos: Orate, fratres: ut meum ac vestrum sacrificium acceptabile fiat apud Deum Patrem omnipotentem.\n\nR/ Suscipiat Dominus sacrificium de manibus tuis ad laudem et gloriam nominis sui, ad utilitatem quoque nostram totiusque Ecclesiae suae sanctae.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'preface',
    title: 'Prefacio',
    text: 'Sacerdote: El Señor esté con ustedes.\nR/ Y con tu espíritu.\n\nSacerdote: Levantemos el corazón.\nR/ Lo tenemos levantado hacia el Señor.\n\nSacerdote: Demos gracias al Señor, nuestro Dios.\nR/ Es justo y necesario.\n\n(Prefacio del día)',
    latin: 'Sacerdos: Dominus vobiscum.\nR/ Et cum spiritu tuo.\n\nSacerdos: Sursum corda.\nR/ Habemus ad Dominum.\n\nSacerdos: Gratias agamus Domino Deo nostro.\nR/ Dignum et iustum est.\n\n(Praefatio diei)',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'santo-song',
    title: 'Santo',
    latin: 'Sanctus, Sanctus, Sanctus Dominus Deus Sabaoth. Pleni sunt caeli et terra gloria tua. Hosanna in excelsis. Benedictus qui venit in nomine Domini. Hosanna in excelsis.',
    type: 'song',
    posture: 'standing',
    category: 'Santo',
    icon: '🎵'
  },
  {
    id: 'kneel-consecration',
    title: 'De rodillas para la Consagración',
    type: 'instruction',
    posture: 'kneeling',
    icon: '✝️',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'consecration',
    title: 'Consagración',
    text: '(El sacerdote consagra el pan y el vino)\n\nSacerdote: Este es el Sacramento de nuestra fe.\n\nR/ Anunciamos tu muerte, proclamamos tu resurrección. ¡Ven, Señor Jesús!',
    latin: '(Sacerdos panem et vinum consecrat)\n\nSacerdos: Mysterium fidei.\n\nR/ Mortem tuam annuntiamus, Domine, et tuam resurrectionem confitemur, donec venias.',
    type: 'liturgy',
    posture: 'kneeling',
    icon: '✝️',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'eucharistic-prayer',
    title: 'Plegaria Eucarística',
    text: '(Continuación de la Plegaria Eucarística)',
    type: 'liturgy',
    posture: 'kneeling',
    icon: '✝️',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'stand-doxology',
    title: 'De pie para la Doxología',
    type: 'instruction',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },
  {
    id: 'doxology',
    title: 'Doxología',
    text: 'Sacerdote: Por Cristo, con él y en él, a ti, Dios Padre omnipotente, en la unidad del Espíritu Santo, todo honor y toda gloria por los siglos de los siglos.\n\nR/ Amén.',
    latin: 'Sacerdos: Per ipsum, et cum ipso, et in ipso, est tibi Deo Patri omnipotenti, in unitate Spiritus Sancti, omnis honor et gloria per omnia saecula saeculorum.\n\nR/ Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600'
  },

  // RITO DE LA COMUNIÓN
  {
    id: 'lords-prayer',
    title: 'Padre Nuestro',
    text: 'Sacerdote: Fieles a la recomendación del Salvador y siguiendo su divina enseñanza, nos atrevemos a decir:\n\nPadre nuestro, que estás en el cielo, santificado sea tu nombre; venga a nosotros tu reino; hágase tu voluntad en la tierra como en el cielo. Danos hoy nuestro pan de cada día; perdona nuestras ofensas, como también nosotros perdonamos a los que nos ofenden; no nos dejes caer en la tentación, y líbranos del mal.\n\nSacerdote: Líbranos de todos los males, Señor...\n\nR/ Tuyo es el reino, tuyo el poder y la gloria, por siempre, Señor.',
    latin: 'Sacerdos: Praeceptis salutaribus moniti, et divina institutione formati, audemus dicere:\n\nPater noster, qui es in caelis: sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo, et in terra. Panem nostrum cotidianum da nobis hodie; et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo.\n\nSacerdos: Libera nos, quaesumus, Domine, ab omnibus malis...\n\nR/ Quia tuum est regnum, et potestas, et gloria in saecula.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'lords-prayer-song',
    title: 'Padre Nuestro (Cantado)',
    latin: 'Pater noster, qui es in caelis: sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo, et in terra. Panem nostrum cotidianum da nobis hodie; et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo.',
    type: 'song',
    posture: 'standing',
    category: 'Padre Nuestro',
    icon: '🎵'
  },
  {
    id: 'peace',
    title: 'Rito de la Paz',
    text: 'Sacerdote: Señor Jesucristo, que dijiste a tus apóstoles: "La paz les dejo, mi paz les doy", no tengas en cuenta nuestros pecados, sino la fe de tu Iglesia y, conforme a tu palabra, concédele la paz y la unidad.\n\nSacerdote: La paz del Señor esté siempre con ustedes.\nR/ Y con tu espíritu.\n\nSacerdote: Dense fraternalmente la paz.',
    latin: 'Sacerdos: Domine Iesu Christe, qui dixisti Apostolis tuis: Pacem relinquo vobis, pacem meam do vobis: ne respicias peccata nostra, sed fidem Ecclesiae tuae; eamque secundum voluntatem tuam pacificare et coadunare digneris.\n\nSacerdos: Pax Domini sit semper vobiscum.\nR/ Et cum spiritu tuo.\n\nSacerdos: Offerte vobis pacem.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🤝',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'cordero-song',
    title: 'Cordero de Dios',
    latin: 'Agnus Dei, qui tollis peccata mundi: miserere nobis.\nAgnus Dei, qui tollis peccata mundi: miserere nobis.\nAgnus Dei, qui tollis peccata mundi: dona nobis pacem.',
    type: 'song',
    posture: 'standing',
    category: 'Cordero de Dios',
    icon: '🎵'
  },
  {
    id: 'kneel-communion',
    title: 'De rodillas antes de la Comunión',
    type: 'instruction',
    posture: 'kneeling',
    icon: '🍞',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'invitation-communion',
    title: 'Invitación a la Comunión',
    text: 'Sacerdote: Este es el Cordero de Dios, que quita el pecado del mundo. Dichosos los invitados a la cena del Señor.\n\nR/ Señor, no soy digno de que entres en mi casa, pero una palabra tuya bastará para sanarme.',
    latin: 'Sacerdos: Ecce Agnus Dei, ecce qui tollit peccata mundi. Beati qui ad cenam Agni vocati sunt.\n\nR/ Domine, non sum dignus ut intres sub tectum meum, sed tantum dic verbo, et sanabitur anima mea.',
    type: 'liturgy',
    posture: 'kneeling',
    icon: '🍞',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'communion-procession',
    title: 'Procesión de Comunión',
    type: 'instruction',
    posture: 'standing',
    icon: '🚶',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'communion-song',
    title: 'Canto de Comunión',
    type: 'song',
    posture: 'standing',
    category: 'Comunión',
    icon: '🎵'
  },
  {
    id: 'sit-silence',
    title: 'Sentarse para la Oración en Silencio',
    type: 'instruction',
    posture: 'sitting',
    icon: '🕊️',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'silence',
    title: 'Silencio de Acción de Gracias',
    text: '(Momento de oración personal en silencio)',
    type: 'liturgy',
    posture: 'sitting',
    icon: '🕊️',
    color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700'
  },
  {
    id: 'stand-prayer',
    title: 'De pie para la Oración después de la Comunión',
    type: 'instruction',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },
  {
    id: 'prayer-communion',
    title: 'Oración después de la Comunión',
    text: 'Sacerdote: Oremos.\n\n(Oración del día)\n\nR/ Amén.',
    latin: 'Sacerdos: Oremus.\n\n(Postcommunio diei)\n\nR/ Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600'
  },

  // RITO DE CONCLUSIÓN
  {
    id: 'announcements',
    title: 'Avisos (si los hay)',
    text: '(Avisos parroquiales)',
    type: 'liturgy',
    posture: 'standing',
    icon: '📢',
    color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
  },
  {
    id: 'blessing',
    title: 'Bendición Final',
    text: 'Sacerdote: El Señor esté con ustedes.\nR/ Y con tu espíritu.\n\nSacerdote: La bendición de Dios todopoderoso, Padre, Hijo ✝ y Espíritu Santo, descienda sobre ustedes.\n\nR/ Amén.',
    latin: 'Sacerdos: Dominus vobiscum.\nR/ Et cum spiritu tuo.\n\nSacerdos: Benedicat vos omnipotens Deus, Pater, et Filius, ✝ et Spiritus Sanctus.\n\nR/ Amen.',
    type: 'liturgy',
    posture: 'standing',
    icon: '✝️',
    color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
  },
  {
    id: 'dismissal',
    title: 'Despedida',
    text: 'Sacerdote: Puedan ir en paz.\nR/ Demos gracias a Dios.',
    latin: 'Sacerdos: Ite, missa est.\nR/ Deo gratias.',
    type: 'liturgy',
    posture: 'standing',
    icon: '🙏',
    color: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600'
  },
  {
    id: 'salida-song',
    title: 'Canto de Salida',
    type: 'song',
    posture: 'standing',
    category: 'Salida',
    icon: '🎵'
  },
];

export const postureIcons = {
  standing: '🧍',
  sitting: '🪑',
  kneeling: '🧎',
};

export const postureLabels = {
  standing: 'De pie',
  sitting: 'Sentado',
  kneeling: 'De rodillas',
};

export const postureColors = {
  standing: 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 text-blue-900 dark:text-blue-200',
  sitting: 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-200',
  kneeling: 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-900 dark:text-red-200',
};
