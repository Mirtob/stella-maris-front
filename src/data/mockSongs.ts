import { Song } from '../types';

// Mock data - En producción, esto vendría de una API conectada a YouTube
// Video de ejemplo: Señor Ten Piedad - 3jsKmfwkq_E
export const mockSongs: Song[] = [
  // Entrada
  {
    id: '1',
    title: 'Todos Juntos Formamos la Iglesia',
    category: 'Entrada',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:45',
    artist: 'Coro Parroquial',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Ordinario', 'Popular', 'Comunidad'],
    liturgicalSeason: 'Ordinario',
    lyrics: `Estrofa 1:
Todos juntos formamos la Iglesia,
somos pueblo que Dios convocó,
para anunciar al mundo entero
el mensaje de salvación.

Coro:
Iglesia peregrina de Dios,
pueblo de Dios, ¡canta con fervor!
Que Cristo va contigo, te da su amor,
¡Él es tu amigo, tu liberador!`
  },
  {
    id: '2',
    title: 'Pueblo de Reyes',
    category: 'Entrada',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:12',
    artist: 'Canto Litúrgico',
    author: 'Alejandro Mejía',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Ordinario', 'Popular', 'Alabanza'],
    liturgicalSeason: 'Ordinario',
    originalKey: 'G',
    lyrics: `Coro:
[G]Pueblo de reyes, [D]asamblea santa,
[Em]pueblo sacer[C]dotal,
[G]pueblo de Dios, ben[D]dice a tu Señor.
[Em]Pueblo de [C]Dios, ben[D]dice a tu Se[G]ñor.

Estrofa 1:
[C]Te cantamos, oh [D]Hijo amado del [G]Padre,
[C]te alabamos, Je[D]sús, Se[Em]ñor.
[C]Te ofrecemos [D]nuestra vida y tra[G]bajo,[Em]
[C]bendito [D]seas, Se[G]ñor.

(Repetir Coro)`
  },
  {
    id: '3',
    title: 'Juntos Como Hermanos',
    category: 'Entrada',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:20',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Ordinario', 'Fraternidad', 'Unidad'],
    liturgicalSeason: 'Ordinario',
    lyrics: `Coro:
Juntos como hermanos,
miembros de una Iglesia,
vamos caminando
al encuentro del Señor.

Estrofa 1:
Un largo caminar,
por el desierto bajo el sol,
no podemos avanzar
sin la ayuda del Señor.

(Repetir Coro)`
  },
  
  // MISA GREGORIANA (completa)
  {
    id: '4',
    title: 'Kyrie Eleison',
    category: 'Kyrie',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:30',
    artist: 'Canto Gregoriano',
    author: 'Gregoriano',
    version: 'Coro',
    massName: 'Misa Gregoriana',
    tags: ['Ordinario', 'Gregoriano', 'Clásico']
  },
  {
    id: '5',
    title: 'Gloria in Excelsis Deo',
    category: 'Gloria',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:15',
    artist: 'Canto Gregoriano',
    author: 'Gregoriano',
    version: 'Coro',
    massName: 'Misa Gregoriana',
    tags: ['Ordinario', 'Gregoriano', 'Clásico']
  },
  {
    id: '6',
    title: 'Sanctus',
    category: 'Santo',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:20',
    artist: 'Canto Gregoriano',
    author: 'Gregoriano',
    version: 'Coro',
    massName: 'Misa Gregoriana',
    tags: ['Ordinario', 'Gregoriano', 'Clásico']
  },
  {
    id: '7',
    title: 'Agnus Dei',
    category: 'Cordero de Dios',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:15',
    artist: 'Canto Gregoriano',
    author: 'Gregoriano',
    version: 'Coro',
    massName: 'Misa Gregoriana',
    tags: ['Ordinario', 'Gregoriano', 'Clásico']
  },

  // MISA CRIOLLA (completa)
  {
    id: '8',
    title: 'Kyrie',
    category: 'Kyrie',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:50',
    artist: 'Misa Criolla',
    author: 'Ariel Ramírez',
    version: 'Guitarra',
    massName: 'Misa Criolla',
    tags: ['Ordinario', 'Criolla', 'Folk']
  },
  {
    id: '9',
    title: 'Gloria',
    category: 'Gloria',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:40',
    artist: 'Misa Criolla',
    author: 'Ariel Ramírez',
    version: 'Guitarra',
    massName: 'Misa Criolla',
    tags: ['Ordinario', 'Criolla', 'Folk']
  },
  {
    id: '10',
    title: 'Santo',
    category: 'Santo',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:10',
    artist: 'Misa Criolla',
    author: 'Ariel Ramírez',
    version: 'Guitarra',
    massName: 'Misa Criolla',
    tags: ['Ordinario', 'Criolla', 'Folk']
  },
  {
    id: '11',
    title: 'Cordero de Dios',
    category: 'Cordero de Dios',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:40',
    artist: 'Misa Criolla',
    author: 'Ariel Ramírez',
    version: 'Guitarra',
    massName: 'Misa Criolla',
    tags: ['Ordinario', 'Criolla', 'Folk']
  },

  // MISA POPULAR (completa)
  {
    id: '12',
    title: 'Señor Ten Piedad',
    category: 'Kyrie',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:35',
    artist: 'Liturgia Popular',
    author: 'Cesáreo Gabaráin',
    version: 'Coro',
    massName: 'Misa Popular',
    tags: ['Ordinario', 'Popular', 'Alabanza']
  },
  {
    id: '13',
    title: 'Gloria a Dios en el Cielo',
    category: 'Gloria',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:50',
    artist: 'Liturgia Popular',
    author: 'Cesáreo Gabaráin',
    version: 'Coro',
    massName: 'Misa Popular',
    tags: ['Ordinario', 'Popular', 'Alabanza']
  },
  {
    id: '14',
    title: 'Santo, Santo, Santo',
    category: 'Santo',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:30',
    artist: 'Liturgia Popular',
    author: 'Cesáreo Gabaráin',
    version: 'Coro',
    massName: 'Misa Popular',
    tags: ['Ordinario', 'Popular', 'Alabanza']
  },
  {
    id: '15',
    title: 'Cordero que Quitas el Pecado',
    category: 'Cordero de Dios',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:25',
    artist: 'Liturgia Popular',
    author: 'Cesáreo Gabaráin',
    version: 'Coro',
    massName: 'Misa Popular',
    tags: ['Ordinario', 'Popular', 'Alabanza']
  },

  // MISA DE ÓRGANO (completa)
  {
    id: '16',
    title: 'Kyrie (Misa de Órgano)',
    category: 'Kyrie',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:40',
    artist: 'Litúrgica Solemne',
    author: 'J.S. Bach',
    version: 'Órgano',
    massName: 'Misa de Órgano',
    tags: ['Ordinario', 'Órgano', 'Clásico']
  },
  {
    id: '17',
    title: 'Gloria (Misa de Órgano)',
    category: 'Gloria',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:30',
    artist: 'Litúrgica Solemne',
    author: 'J.S. Bach',
    version: 'Órgano',
    massName: 'Misa de Órgano',
    tags: ['Ordinario', 'Órgano', 'Clásico']
  },
  {
    id: '18',
    title: 'Santo (Misa de Órgano)',
    category: 'Santo',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:50',
    artist: 'Litúrgica Solemne',
    author: 'J.S. Bach',
    version: 'Órgano',
    massName: 'Misa de Órgano',
    tags: ['Ordinario', 'Órgano', 'Clásico']
  },
  {
    id: '19',
    title: 'Cordero de Dios (Misa de Órgano)',
    category: 'Cordero de Dios',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:30',
    artist: 'Litúrgica Solemne',
    author: 'J.S. Bach',
    version: 'Órgano',
    massName: 'Misa de Órgano',
    tags: ['Ordinario', 'Órgano', 'Clásico']
  },
  
  // Salmo
  {
    id: '20',
    title: 'El Señor es mi Pastor',
    category: 'Salmo',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:30',
    artist: 'Salmo 23',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Salmo', 'Popular', 'Alabanza']
  },
  {
    id: '21',
    title: 'Gusten y Vean',
    category: 'Salmo',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:40',
    artist: 'Salmo 34',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Salmo', 'Popular', 'Alabanza']
  },
  {
    id: '22',
    title: 'Alabad al Señor',
    category: 'Salmo',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:25',
    artist: 'Salmo 150',
    author: 'Tradicional',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Salmo', 'Popular', 'Alabanza']
  },
  
  // Aleluya
  {
    id: '23',
    title: 'Aleluya, Aleluya',
    category: 'Aleluya',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:10',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Aleluya', 'Popular', 'Alabanza']
  },
  {
    id: '24',
    title: 'Aleluya de Haendel',
    category: 'Aleluya',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:55',
    artist: 'Clásico',
    author: 'G.F. Haendel',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Aleluya', 'Órgano', 'Clásico']
  },
  {
    id: '25',
    title: 'Aleluya Pascual',
    category: 'Aleluya',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:35',
    artist: 'Tiempo Pascual',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Aleluya', 'Popular', 'Alabanza']
  },
  
  // Post Evangelio
  {
    id: '26',
    title: 'Creo Señor, pero Aumenta mi Fe',
    category: 'Post Evangelio',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:20',
    artist: 'Canto de Reflexión',
    author: 'Kiko Argüello',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Post Evangelio', 'Popular', 'Alabanza']
  },
  {
    id: '27',
    title: 'Palabra de Dios',
    category: 'Post Evangelio',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:45',
    artist: 'Coro Parroquial',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Post Evangelio', 'Popular', 'Alabanza']
  },
  {
    id: '28',
    title: 'Escucha Señor',
    category: 'Post Evangelio',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:10',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Post Evangelio', 'Popular', 'Alabanza']
  },
  
  // Ofertorio
  {
    id: '29',
    title: 'Qué Detalle Señor',
    category: 'Ofertorio',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:05',
    artist: 'Coro Parroquial',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Ofertorio', 'Popular', 'Alabanza']
  },
  {
    id: '30',
    title: 'Pan y Vino',
    category: 'Ofertorio',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:35',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Ofertorio', 'Popular', 'Alabanza']
  },
  {
    id: '31',
    title: 'Te Ofrecemos Padre Nuestro',
    category: 'Ofertorio',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:20',
    artist: 'Liturgia',
    author: 'Tradicional',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Ofertorio', 'Popular', 'Alabanza']
  },
  
  // Comunión
  {
    id: '32',
    title: 'Yo Soy el Pan de Vida',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:40',
    artist: 'Espiritual',
    author: 'Suzanne Toolan',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza'],
    originalKey: 'C',
    lyrics: `Coro:
[C]Yo soy el [F]pan de [C]vida,
el que [Dm]viene a [G]mí no ten[C]drá hambre,
el que [F]cree en [C]mí no ten[Dm]drá [G]sed.
[F]Nadie viene a [C]mí
si [Dm]mi Padre no le [G]atrae.[C]

Estrofa 1:
[C]Yo lo resu[F]citaré,[G]
yo lo resu[Am]citaré,[G]
yo lo resu[F]citaré[G]
en el día [C]final.

(Repetir Coro)`
  },
  {
    id: '33',
    title: 'Cantemos al Amor de los Amores',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:15',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza']
  },
  {
    id: '34',
    title: 'Alma Misionera',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:50',
    artist: 'Canto Litúrgico',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza']
  },
  {
    id: '35',
    title: 'Pan de Vida',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:00',
    artist: 'Coro Parroquial',
    author: 'Tradicional',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza']
  },
  {
    id: '36',
    title: 'Jesús está Pasando',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:55',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza']
  },
  {
    id: '37',
    title: 'Dios Está Aquí',
    category: 'Comunión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:10',
    artist: 'Canto Litúrgico',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Comunión', 'Popular', 'Alabanza']
  },
  
  // Salida
  {
    id: '38',
    title: 'Vayan y Anuncien',
    category: 'Salida',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:30',
    artist: 'Canto Misionero',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Salida', 'Popular', 'Alabanza']
  },
  {
    id: '39',
    title: 'Que Viva mi Cristo',
    category: 'Salida',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:45',
    artist: 'Tradicional',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Salida', 'Popular', 'Alabanza']
  },
  {
    id: '40',
    title: 'María de Nazaret',
    category: 'Salida',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:10',
    artist: 'Canto Mariano',
    author: 'Kiko Argüello',
    version: 'Órgano',
    sheetMusicUrl: '#',
    tags: ['Salida', 'Popular', 'Alabanza']
  },

  // ========== CANTOS ESPECIALES PARA DÍAS LITÚRGICOS ==========
  
  // Jueves Santo - Exposición y Procesión
  {
    id: '100',
    title: 'Pange Lingua',
    category: 'Exposición y Procesión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:30',
    artist: 'Canto Gregoriano',
    author: 'Santo Tomás de Aquino',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Jueves Santo', 'Exposición', 'Gregoriano'],
    liturgicalSeason: 'Cuaresma'
  },

  // Vigilia Pascual - Pregón Pascual
  {
    id: '101',
    title: 'Exultet',
    category: 'Pregón Pascual',
    youtubeId: '3jsKmfwkq_E',
    duration: '8:45',
    artist: 'Canto Litúrgico',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Vigilia Pascual', 'Pregón', 'Pascua'],
    liturgicalSeason: 'Pascua'
  },

  // Vigilia Pascual - Salmos del Antiguo Testamento
  {
    id: '102',
    title: 'Salmo de la Creación',
    category: 'Salmo AT 1',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:20',
    artist: 'Canto Litúrgico',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Vigilia Pascual', 'Antiguo Testamento', 'Pascua'],
    liturgicalSeason: 'Pascua'
  },
  {
    id: '103',
    title: 'Salmo del Éxodo',
    category: 'Salmo AT 2',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:45',
    artist: 'Canto Litúrgico',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Vigilia Pascual', 'Antiguo Testamento', 'Pascua'],
    liturgicalSeason: 'Pascua'
  },

  // Vigilia Pascual - Salmo Epistolar
  {
    id: '104',
    title: 'Salmo Responsorial',
    category: 'Salmo Epistolar',
    youtubeId: '3jsKmfwkq_E',
    duration: '2:50',
    artist: 'Canto Litúrgico',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Vigilia Pascual', 'Epistolar', 'Pascua'],
    liturgicalSeason: 'Pascua'
  },

  // Vigilia Pascual - Aleluya Triple
  {
    id: '105',
    title: 'Aleluya, Aleluya, Aleluya',
    category: 'Aleluya Triple',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:15',
    artist: 'Canto Pascual',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Vigilia Pascual', 'Aleluya', 'Resurrección', 'Pascua'],
    liturgicalSeason: 'Pascua'
  },

  // Domingo de Resurrección - Secuencia
  {
    id: '106',
    title: 'Victimae Paschali Laudes',
    category: 'Secuencia de Pascua',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:20',
    artist: 'Canto Gregoriano',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Pascua', 'Secuencia', 'Resurrección'],
    liturgicalSeason: 'Pascua'
  },

  // Pentecostés - Secuencia
  {
    id: '107',
    title: 'Veni Sancte Spiritus',
    category: 'Secuencia de Pentecostés',
    youtubeId: '3jsKmfwkq_E',
    duration: '5:10',
    artist: 'Canto Gregoriano',
    author: 'Esteban Langton',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Pentecostés', 'Secuencia', 'Espíritu Santo'],
    liturgicalSeason: 'Pascua'
  },

  // Corpus Christi - Secuencia
  {
    id: '108',
    title: 'Lauda Sion',
    category: 'Secuencia de Corpus',
    youtubeId: '3jsKmfwkq_E',
    duration: '6:30',
    artist: 'Canto Gregoriano',
    author: 'Santo Tomás de Aquino',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Corpus Christi', 'Secuencia', 'Eucaristía'],
    liturgicalSeason: 'Ordinario'
  },

  // Nochebuena - Kalenda
  {
    id: '109',
    title: 'Kalenda Navideña',
    category: 'Kalenda Navideña',
    youtubeId: '3jsKmfwkq_E',
    duration: '5:45',
    artist: 'Canto Litúrgico',
    author: 'Liturgia Romana',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Navidad', 'Kalenda', 'Nacimiento'],
    liturgicalSeason: 'Navidad'
  },

  // Aclamación al Evangelio (Cuaresma)
  {
    id: '110',
    title: 'Gloria y Honor a Ti, Señor Jesús',
    category: 'Aclamación al Evangelio',
    youtubeId: '3jsKmfwkq_E',
    duration: '1:45',
    artist: 'Canto Litúrgico',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Cuaresma', 'Aclamación', 'Evangelio'],
    liturgicalSeason: 'Cuaresma'
  },
  {
    id: '111',
    title: 'Honor y Gloria a Ti, Señor',
    category: 'Aclamación al Evangelio',
    youtubeId: '3jsKmfwkq_E',
    duration: '1:50',
    artist: 'Canto Litúrgico',
    author: 'Tradicional',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Cuaresma', 'Aclamación', 'Evangelio'],
    liturgicalSeason: 'Cuaresma'
  },

  // ===== CANTOS NO LITÚRGICOS =====
  // Adoración Eucarística
  {
    id: '200',
    title: 'Aquí Estoy Yo',
    category: 'Adoración',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:30',
    artist: 'Canto de Adoración',
    author: 'Athenas',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Adoración', 'Eucaristía', 'Contemplación'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Adoración',
    originalKey: 'D',
    lyrics: `      D            A/C#
Aquí estoy yo, ante tu majestad,
     Bm           G
aquí postrado, Señor, ante ti.
      D            A/C#
Aquí estoy yo, en tu presencia real,
     Bm           G        A
adorándote, mi Rey, Jesús.

Coro:
    D              A
Tú eres mi todo, mi Salvador,
    Bm             G
mi fortaleza, mi redentor.
    D              A
Tú eres mi vida, mi protector,
    Bm      G    A      D
Jesús sacramentado, mi Señor.`
  },
  {
    id: '201',
    title: 'Ante Ti',
    category: 'Adoración',
    youtubeId: '3jsKmfwkq_E',
    duration: '5:15',
    artist: 'Canto de Adoración',
    author: 'Martín Valverde',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Adoración', 'Contemplación', 'Amor'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Adoración'
  },
  {
    id: '202',
    title: 'Vengo Ante Ti',
    category: 'Adoración',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:45',
    artist: 'Canto de Adoración',
    author: 'Jesed',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Adoración', 'Súplica', 'Entrega'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Adoración',
    originalKey: 'G'
  },

  // Procesiones
  {
    id: '203',
    title: 'Caminando con Jesús',
    category: 'Procesión',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:50',
    artist: 'Canto Procesional',
    author: 'Popular',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Procesión', 'Caminata', 'Fe'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Procesión'
  },
  {
    id: '204',
    title: 'Plegaria a la Virgen del Carmen',
    category: 'Procesión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:20',
    artist: 'Canto Procesional',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Procesión', 'María', 'Carmen'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Procesión'
  },

  // Cantos Marianos
  {
    id: '205',
    title: 'Madre del Amor Hermoso',
    category: 'Mariano',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:00',
    artist: 'Canto Mariano',
    author: 'Tradicional',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['María', 'Virgen', 'Advocación'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Mariano'
  },
  {
    id: '206',
    title: 'Oh María, Madre Mía',
    category: 'Mariano',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:30',
    artist: 'Canto Mariano',
    author: 'Popular',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['María', 'Devoción', 'Amor'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Mariano',
    originalKey: 'F'
  },
  {
    id: '207',
    title: 'Reina del Cielo',
    category: 'Mariano',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:45',
    artist: 'Canto Mariano',
    author: 'Athenas',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['María', 'Regina Coeli', 'Pascua'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Mariano'
  },

  // Reflexión y Meditación
  {
    id: '208',
    title: 'En el Silencio Te Escucho',
    category: 'Reflexión',
    youtubeId: '3jsKmfwkq_E',
    duration: '5:00',
    artist: 'Canto de Meditación',
    author: 'Espíritu y Vida',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Reflexión', 'Silencio', 'Oración'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Reflexión',
    originalKey: 'Em'
  },
  {
    id: '209',
    title: 'Como Tú No Hay Nadie',
    category: 'Reflexión',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:15',
    artist: 'Canto de Meditación',
    author: 'Martín Valverde',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Reflexión', 'Alabanza', 'Intimidad'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Reflexión'
  },

  // Evangelización
  {
    id: '210',
    title: 'Pescador de Hombres',
    category: 'Evangelización',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:30',
    artist: 'Canto de Evangelización',
    author: 'Cesáreo Gabaráin',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Evangelización', 'Misión', 'Llamado'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Evangelización',
    originalKey: 'G'
  },
  {
    id: '211',
    title: 'Id y Enseñad',
    category: 'Evangelización',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:50',
    artist: 'Canto de Evangelización',
    author: 'Kairoi',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Evangelización', 'Misión', 'Mandato'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Evangelización'
  },
  {
    id: '212',
    title: 'Testigos del Señor',
    category: 'Evangelización',
    youtubeId: '3jsKmfwkq_E',
    duration: '4:10',
    artist: 'Canto de Evangelización',
    author: 'Popular',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Evangelización', 'Testimonio', 'Anuncio'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Evangelización',
    originalKey: 'C'
  },

  // Otros
  {
    id: '213',
    title: 'Jesús, Confío en Ti',
    category: 'Otro',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:40',
    artist: 'Canto Devocional',
    author: 'Popular',
    version: 'Coro',
    sheetMusicUrl: '#',
    tags: ['Confianza', 'Devoción', 'Misericordia'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Otro'
  },
  {
    id: '214',
    title: 'Mi Dios Está Vivo',
    category: 'Otro',
    youtubeId: '3jsKmfwkq_E',
    duration: '3:25',
    artist: 'Canto Alegre',
    author: 'Popular',
    version: 'Guitarra',
    sheetMusicUrl: '#',
    tags: ['Alegría', 'Testimonio', 'Vida'],
    isLiturgical: false,
    nonLiturgicalCategory: 'Otro',
    originalKey: 'D'
  },
];