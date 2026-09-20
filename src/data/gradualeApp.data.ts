// ARCHIVO GENERADO por scripts/render-graduale-webp.py — NO editar a mano.
//
// Qué propio gregoriano hay para cada celebración, en cada libro. Es el índice que se
// lleva el navegador: sólo los nombres, sin los recortes (esos viven en
// gradualeIndex.data.ts, que se queda en el repositorio y no se empaqueta).
//
// Cada canto vale `1` si una sola melodía sirve para los tres años, o la lista de años
// que tiene cubiertos cuando el libro trae una por año (pasa sobre todo en las comuniones
// del Tiempo Ordinario). En esa lista, "*" es la versión para los años sin melodía propia.
//
// El año NO se elige: lo determina la fecha de la Misa (ver utils/liturgicalCycle).
//
// La imagen es /graduale/<libro>/<clave>/<canto>[-<año>].webp

export interface MisaApp {
  /** Carpeta de las imágenes, y clave de la Misa en el índice grande. */
  clave: string;
  /** Título latino tal como lo trae el libro. */
  titulo: string;
  /** Página impresa donde empieza, para quien quiera ir al libro de papel. */
  pagina: number;
  cantos: Record<string, 1 | readonly string[]>;
  /** Cuál de las Misas del día es ("Misa de la noche"). Sólo en las solemnidades
   *  que el libro trae con varias. */
  rotulo?: string;
}

export const GRADUALE_APP: Record<'romanum' | 'simplex', Record<string, MisaApp>> =
{
 "romanum": {
  "1.º Domingo de Adviento": {
   "clave": "hebdomada-prima-adventus",
   "titulo": "Hebdomada Prima Adventus",
   "pagina": 12,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "2.º Domingo de Adviento": {
   "clave": "hebdomada-secunda-adventus",
   "titulo": "Hebdomada Secunda Adventus",
   "pagina": 15,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "3.º Domingo de Adviento": {
   "clave": "hebdomada-tertia-adventus",
   "titulo": "Hebdomada Tertia Adventus",
   "pagina": 18,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "4.º Domingo de Adviento": {
   "clave": "dominica-quarta-adventus",
   "titulo": "Dominica quarta Adventus",
   "pagina": 31,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "communio": 1,
    "graduale": 1,
    "alleluia": 1
   }
  },
  "Natividad del Señor": {
   "clave": "in-nativitate-domini",
   "titulo": "In Nativitate Domini",
   "pagina": 35,
   "cantos": {
    "introitus": 1,
    "communio": 1
   }
  },
  "Sagrada Familia": {
   "clave": "sanctae-familiae-iesu-mariae-et-ioseph",
   "titulo": "Sanctae Familiae Iesu, Mariae et Ioseph",
   "pagina": 48,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Santa María, Madre de Dios": {
   "clave": "sollemnitas-sanctae-dei-genetricis-mariae",
   "titulo": "Sollemnitas Sanctae Dei Genetricis Mariae",
   "pagina": 50,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "2.º Domingo después de Navidad": {
   "clave": "dominica-secunda-post-nativitatem",
   "titulo": "Dominica Secunda post Nativitatem",
   "pagina": 50,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "Epifanía del Señor": {
   "clave": "in-epiphania-domini",
   "titulo": "In Epiphania Domini",
   "pagina": 53,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "Bautismo del Señor": {
   "clave": "in-baptismate-domini",
   "titulo": "In Baptismate Domini",
   "pagina": 56,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "1.º Domingo de Cuaresma": {
   "clave": "hebdomada-prima-quadragesimae",
   "titulo": "Hebdomada Prima Quadragesimae",
   "pagina": 68,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "graduale": 1,
    "communio": 1
   }
  },
  "2.º Domingo de Cuaresma": {
   "clave": "hebdomada-secunda-quadragesimae",
   "titulo": "Hebdomada Secunda Quadragesimae",
   "pagina": 85,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "3.º Domingo de Cuaresma": {
   "clave": "hebdomada-tertia-quadragesimae",
   "titulo": "Hebdomada Tertia Quadragesimae",
   "pagina": 93,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "4.º Domingo de Cuaresma": {
   "clave": "hebdomada-quarta-quadragesimae",
   "titulo": "Hebdomada Quarta Quadragesimae",
   "pagina": 105,
   "cantos": {
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1,
    "introitus": 1
   }
  },
  "5.º Domingo de Cuaresma": {
   "clave": "hebdomada-quinta-quadragesimae",
   "titulo": "Hebdomada Quinta Quadragesimae",
   "pagina": 117,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1,
    "offertorium": 1
   }
  },
  "Domingo de la Divina Misericordia (2.º de Pascua)": {
   "clave": "hebdomada-secunda-paschae",
   "titulo": "Hebdomada Secunda Paschae",
   "pagina": 213,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "3.º Domingo de Pascua": {
   "clave": "hebdomada-tertia-paschae",
   "titulo": "Hebdomada Tertia Paschae",
   "pagina": 216,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "4.º Domingo de Pascua": {
   "clave": "hebdomada-quarta-paschae",
   "titulo": "Hebdomada Quarta Paschae",
   "pagina": 219,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "offertorium": 1,
    "alleluia": 1
   }
  },
  "5.º Domingo de Pascua": {
   "clave": "hebdomada-quinta-paschae",
   "titulo": "Hebdomada Quinta Paschae",
   "pagina": 222,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "6.º Domingo de Pascua": {
   "clave": "hebdomada-sexta-paschae",
   "titulo": "Hebdomada Sexta Paschae",
   "pagina": 226,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "Ascensión del Señor": {
   "clave": "in-ascensione-domini",
   "titulo": "In Ascensione Domini",
   "pagina": 232,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "7.º Domingo de Pascua": {
   "clave": "hebdomada-septima-paschae",
   "titulo": "Hebdomada Septima Paschae",
   "pagina": 238,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "Pentecostés": {
   "clave": "dominica-pentecostes",
   "titulo": "Dominica Pentecostes",
   "pagina": 245,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "2.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-secunda",
   "titulo": "Hebdomada Secunda",
   "pagina": 257,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "3.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-tertia",
   "titulo": "Hebdomada Tertia",
   "pagina": 261,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "4.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-quarta",
   "titulo": "Hebdomada Quarta",
   "pagina": 265,
   "cantos": {
    "graduale": 1,
    "offertorium": 1,
    "introitus": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "5.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-quinta",
   "titulo": "Hebdomada Quinta",
   "pagina": 268,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "6.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-sexta",
   "titulo": "Hebdomada Sexta",
   "pagina": 272,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "7.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-septima",
   "titulo": "Hebdomada Septima",
   "pagina": 275,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "8.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-octava",
   "titulo": "Hebdomada Octava",
   "pagina": 278,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "9.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-nona",
   "titulo": "Hebdomada Nona",
   "pagina": 281,
   "cantos": {
    "graduale": 1,
    "offertorium": 1,
    "introitus": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "10.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima",
   "titulo": "Hebdomada Decima",
   "pagina": 285,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "11.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-undecima",
   "titulo": "Hebdomada Undecima",
   "pagina": 288,
   "cantos": {
    "graduale": 1
   }
  },
  "12.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-undecima-p291",
   "titulo": "Hebdomada Undecima",
   "pagina": 291,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "13.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-tertia",
   "titulo": "Hebdomada Decima Tertia",
   "pagina": 294,
   "cantos": {
    "graduale": 1,
    "offertorium": 1,
    "introitus": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "14.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-quarta",
   "titulo": "Hebdomada Decima Quarta",
   "pagina": 297,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "15.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-quinta",
   "titulo": "Hebdomada Decima Quinta",
   "pagina": 300,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "16.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-sexta",
   "titulo": "Hebdomada Decima Sexta",
   "pagina": 304,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "17.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-septima",
   "titulo": "Hebdomada Decima Septima",
   "pagina": 307,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "18.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-octava",
   "titulo": "Hebdomada Decima Octava",
   "pagina": 312,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "19.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-decima-nona",
   "titulo": "Hebdomada Decima Nona",
   "pagina": 316,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "20.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima",
   "titulo": "Hebdomada Vigesima",
   "pagina": 320,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "21.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-prima",
   "titulo": "Hebdomada Vigesima Prima",
   "pagina": 323,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "22.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-secunda",
   "titulo": "Hebdomada Vigesima Secunda",
   "pagina": 327,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "23.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-tertia",
   "titulo": "Hebdomada Vigesima Tertia",
   "pagina": 329,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "24.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-quarta",
   "titulo": "Hebdomada Vigesima Quarta",
   "pagina": 333,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "communio": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "25.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-quinta",
   "titulo": "Hebdomada Vigesima Quinta",
   "pagina": 336,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "26.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-sexta",
   "titulo": "Hebdomada Vigesima Sexta",
   "pagina": 339,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "27.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-septima",
   "titulo": "Hebdomada Vigesima Septima",
   "pagina": 343,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "28.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-octava",
   "titulo": "Hebdomada Vigesima Octava",
   "pagina": 347,
   "cantos": {
    "communio": 1,
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1
   }
  },
  "29.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-vigesima-nona",
   "titulo": "Hebdomada Vigesima Nona",
   "pagina": 351,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "30.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-trigesima",
   "titulo": "Hebdomada Trigesima",
   "pagina": 354,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "31.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-trigesima-prima",
   "titulo": "Hebdomada Trigesima Prima",
   "pagina": 357,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "32.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-trigesima-secunda",
   "titulo": "Hebdomada Trigesima Secunda",
   "pagina": 360,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "33.º Domingo del Tiempo Ordinario": {
   "clave": "hebdomada-trigesima-tertia",
   "titulo": "Hebdomada Trigesima Tertia",
   "pagina": 363,
   "cantos": {
    "introitus": 1,
    "offertorium": 1,
    "communio": 1,
    "graduale": 1,
    "alleluia": 1
   }
  },
  "Jesucristo, Rey del Universo": {
   "clave": "hebdomada-trigesima-quarta",
   "titulo": "Hebdomada Trigesima Quarta",
   "pagina": 366,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Santísima Trinidad": {
   "clave": "dominica-i-post-pentecosten-sanctissimae-trinitatis",
   "titulo": "Dominica I post Pentecosten — Sanctissimae Trinitatis",
   "pagina": 368,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1,
    "alleluia": 1
   }
  },
  "Corpus Christi": {
   "clave": "feria-v-post-dom-ss-mae-trinitatis-ss-mi-corporis-et-sanguinis-christi",
   "titulo": "Feria V post dom. Ss.mae Trinitatis — Ss.mi Corporis et Sanguinis Christi",
   "pagina": 374,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "Sagrado Corazón de Jesús": {
   "clave": "feria-vi-post-dom-ii-post-pentecosten-sacratissimi-cordis-iesu",
   "titulo": "Feria VI post dom. II post Pentecosten — Sacratissimi Cordis Iesu",
   "pagina": 381,
   "cantos": {
    "introitus": 1,
    "communio": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  }
 },
 "simplex": {
  "Natividad del Señor": {
   "clave": "in-nativitate-domini",
   "titulo": "In Nativitate Domini",
   "pagina": 77,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Sagrada Familia": {
   "clave": "s-familiae-iesu-mariae-et-ioseph",
   "titulo": "S. Familiae Iesu, Mariae et Ioseph",
   "pagina": 83,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Epifanía del Señor": {
   "clave": "in-epiphania-domini",
   "titulo": "In Epiphania Domini",
   "pagina": 89,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "1.º Domingo de Cuaresma": {
   "clave": "dominica-i",
   "titulo": "Dominica I",
   "pagina": 103,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "2.º Domingo de Cuaresma": {
   "clave": "dominica-ii-iii",
   "titulo": "Dominica II & III",
   "pagina": 109,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "3.º Domingo de Cuaresma": {
   "clave": "dominica-ii-iii",
   "titulo": "Dominica II & III",
   "pagina": 109,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "4.º Domingo de Cuaresma": {
   "clave": "dominica-iv",
   "titulo": "Dominica IV",
   "pagina": 115,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "5.º Domingo de Cuaresma": {
   "clave": "dominica-v",
   "titulo": "Dominica V",
   "pagina": 121,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Domingo de Resurrección": {
   "clave": "dominica-paschae-in-resurrectione-domini",
   "titulo": "Dominica Paschae in Resurrectione Domini",
   "pagina": 156,
   "cantos": {
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  },
  "Ascensión del Señor": {
   "clave": "in-ascensione-domini",
   "titulo": "In Ascensione Domini",
   "pagina": 191,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Pentecostés": {
   "clave": "dominica-pentecostes",
   "titulo": "Dominica Pentecostes",
   "pagina": 198,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Santísima Trinidad": {
   "clave": "sanctissimae-trinitatis",
   "titulo": "Sanctissimae Trinitatis",
   "pagina": 208,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Corpus Christi": {
   "clave": "ss-mi-corporis-et-sanguinis-christi",
   "titulo": "SS.mi Corporis et Sanguinis Christi",
   "pagina": 214,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Sagrado Corazón de Jesús": {
   "clave": "sacratissimi-cordis-iesu",
   "titulo": "Sacratissimi Cordis Iesu",
   "pagina": 222,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Jesucristo, Rey del Universo": {
   "clave": "domini-nostri-iesu-christi-universorum-regis",
   "titulo": "Domini nostri Iesu Christi universorum Regis",
   "pagina": 266,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Presentación del Señor": {
   "clave": "in-praesentatione-domini",
   "titulo": "In Praesentatione Domini",
   "pagina": 272,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "San José, Esposo de la Virgen María": {
   "clave": "santi-ioseph-sponsi-b-mariae-virginis",
   "titulo": "Santi Ioseph sponsi B. Mariae Virginis",
   "pagina": 280,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Anunciación del Señor": {
   "clave": "in-annuntiatione-domini",
   "titulo": "In Annuntiatione Domini",
   "pagina": 284,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Natividad de San Juan Bautista": {
   "clave": "in-nativitate-sancti-ioannis-baptistae",
   "titulo": "In Nativitate sancti Ioannis Baptistae",
   "pagina": 288,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "San Pedro y San Pablo, Apóstoles": {
   "clave": "sanctorum-petri-et-pauli-apostolorum",
   "titulo": "Sanctorum Petri et Pauli Apostolorum",
   "pagina": 295,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Transfiguración del Señor": {
   "clave": "in-transfiguratione-domini",
   "titulo": "In Transfiguratione Domini",
   "pagina": 301,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Asunción de la Virgen María": {
   "clave": "in-assumptione-b-mariae-virginis",
   "titulo": "In Assumptione B. Mariae Virginis",
   "pagina": 307,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Birth of the Blessed Virgin Mary": {
   "clave": "in-nativitate-b-mariae-virginis",
   "titulo": "In Nativitate B. Mariae Virginis",
   "pagina": 315,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "The Exaltation of the Holy Cross": {
   "clave": "in-exaltatione-sanctae-crucis",
   "titulo": "In Exaltatione sanctae Crucis",
   "pagina": 318,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Saints Michael, Gabriel and Raphael, Archangels": {
   "clave": "ss-michaelis-gabrielis-et-raphaelis-archangelorum",
   "titulo": "Ss. Michaelis, Gabrielis et Raphaelis, archangelorum",
   "pagina": 323,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Todos los Santos": {
   "clave": "omnium-sanctorum",
   "titulo": "Omnium Sanctorum",
   "pagina": 330,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "Inmaculada Concepción de la Virgen María": {
   "clave": "in-conceptione-immaculata-b-mariae-virginis",
   "titulo": "In Conceptione immaculata B. Mariae Virginis",
   "pagina": 336,
   "cantos": {
    "introitus": 1,
    "graduale": 1
   }
  }
 }
} as const;

/**
 * Las Misas que el GRADUALE SIMPLEX ofrece por tiempo litúrgico, no por domingo.
 *
 * El Simplex está hecho así a propósito: en vez de dar los propios de cada domingo, da
 * ocho Misas para todo el Tiempo Ordinario, dos para Adviento y dos para Pascua, y es el
 * coro quien escoge cuál canta. Por eso no aparecen en `GRADUALE_APP`, que va por
 * celebración: aquí van por tiempo, y la elección se hace en el constructor.
 *
 * Los domingos que el Simplex SÍ trae con nombre propio (los de Cuaresma, las
 * solemnidades) están en `GRADUALE_APP` como los del Romanum.
 */
export const SIMPLEX_POR_TIEMPO: Record<string, Record<string, MisaApp>> =
{
 "Adviento": {
  "missa-i": {
   "clave": "missa-i",
   "titulo": "Missa I",
   "pagina": 66,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "missa-ii": {
   "clave": "missa-ii",
   "titulo": "Missa II",
   "pagina": 72,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  }
 },
 "Pascua": {
  "missa-i-p178": {
   "clave": "missa-i-p178",
   "titulo": "Missa I",
   "pagina": 178,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "missa-ii-p185": {
   "clave": "missa-ii-p185",
   "titulo": "Missa II",
   "pagina": 185,
   "cantos": {
    "introitus": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  }
 },
 "Tiempo Ordinario": {
  "missa-i-p228": {
   "clave": "missa-i-p228",
   "titulo": "Missa I",
   "pagina": 228,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1
   }
  },
  "missa-ii-p233": {
   "clave": "missa-ii-p233",
   "titulo": "Missa II",
   "pagina": 233,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "missa-iii": {
   "clave": "missa-iii",
   "titulo": "Missa III",
   "pagina": 238,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "missa-iv": {
   "clave": "missa-iv",
   "titulo": "Missa IV",
   "pagina": 244,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "missa-v": {
   "clave": "missa-v",
   "titulo": "Missa V",
   "pagina": 250,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "communio": 1
   }
  },
  "missa-vi": {
   "clave": "missa-vi",
   "titulo": "Missa VI",
   "pagina": 255,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1,
    "communio": 1
   }
  },
  "missa-vii": {
   "clave": "missa-vii",
   "titulo": "Missa VII",
   "pagina": 258,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "offertorium": 1
   }
  },
  "missa-viii": {
   "clave": "missa-viii",
   "titulo": "Missa VIII",
   "pagina": 261,
   "cantos": {
    "introitus": 1,
    "graduale": 1,
    "alleluia": 1,
    "offertorium": 1
   }
  }
 }
} as const;

/**
 * Las varias Misas que algunas SOLEMNIDADES tienen, cada una con sus propios cantos.
 *
 * La Navidad tiene cuatro (vigilia, noche, aurora y día) y Pentecostés dos. El calendario
 * de la app da UN nombre por día, así que estas Misas no caben en `GRADUALE_APP`, que va
 * por celebración: colgadas de ahí, sus cantos quedaban invisibles. Aquí van por
 * solemnidad, y el coro elige cuál canta en el constructor.
 *
 * Son MÁS concretas que la entrada del día, así que la elegida manda sobre ella.
 */
export const MISAS_DE_LA_SOLEMNIDAD:
  Record<'romanum' | 'simplex', Record<string, Record<string, MisaApp>>> =
{
 "romanum": {
  "Natividad del Señor": {
   "ad-missam-in-vigilia": {
    "clave": "ad-missam-in-vigilia",
    "titulo": "Ad Missam in Vigilia",
    "pagina": 35,
    "cantos": {
     "introitus": 1,
     "communio": 1,
     "graduale": 1,
     "alleluia": 1,
     "offertorium": 1
    },
    "rotulo": "Misa de la vigilia"
   },
   "ad-missam-in-nocte": {
    "clave": "ad-missam-in-nocte",
    "titulo": "Ad Missam in Nocte",
    "pagina": 38,
    "cantos": {
     "introitus": 1,
     "graduale": 1,
     "alleluia": 1,
     "offertorium": 1,
     "communio": 1
    },
    "rotulo": "Misa de la noche"
   },
   "ad-missam-in-aurora": {
    "clave": "ad-missam-in-aurora",
    "titulo": "Ad Missam in Aurora",
    "pagina": 41,
    "cantos": {
     "offertorium": 1,
     "introitus": 1,
     "graduale": 1,
     "alleluia": 1,
     "communio": 1
    },
    "rotulo": "Misa de la aurora"
   },
   "ad-missam-in-die": {
    "clave": "ad-missam-in-die",
    "titulo": "Ad Missam in Die",
    "pagina": 44,
    "cantos": {
     "introitus": 1,
     "graduale": 1,
     "alleluia": 1,
     "offertorium": 1,
     "communio": 1
    },
    "rotulo": "Misa del día"
   }
  },
  "Domingo de Resurrección": {
   "ad-missam-in-die-p193": {
    "clave": "ad-missam-in-die-p193",
    "titulo": "Ad Missam in Die",
    "pagina": 193,
    "cantos": {
     "introitus": 1,
     "offertorium": 1,
     "graduale": 1,
     "alleluia": 1,
     "communio": 1
    },
    "rotulo": "Misa del día"
   }
  },
  "Pentecostés": {
   "ad-missam-in-vigilia-p245": {
    "clave": "ad-missam-in-vigilia-p245",
    "titulo": "Ad Missam in Vigilia",
    "pagina": 245,
    "cantos": {
     "introitus": 1,
     "offertorium": 1,
     "communio": 1,
     "alleluia": 1
    },
    "rotulo": "Misa de la vigilia"
   },
   "ad-missam-in-die-p249": {
    "clave": "ad-missam-in-die-p249",
    "titulo": "Ad Missam in Die",
    "pagina": 249,
    "cantos": {
     "introitus": 1,
     "offertorium": 1,
     "communio": 1,
     "alleluia": 1
    },
    "rotulo": "Misa del día"
   }
  }
 },
 "simplex": {}
} as const;
