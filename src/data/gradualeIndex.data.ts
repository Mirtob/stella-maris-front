// ARCHIVO GENERADO por scripts/import-graduale.py — NO editar a mano.
// Dónde está cada canto propio en el Graduale Romanum y en el Graduale Simplex:
// página y RECORTE, porque muchas páginas llevan dos o más cantos.
//
// La clave es el título del libro (en latín) convertido a slug. NO se traduce a las
// celebraciones de la app aquí: el Simplex ofrece Misas por tiempo litúrgico
// (`Missa I`…`Missa VIII`), así que la correspondencia con el domingo la elige el coro.
//
// `y0`/`y1` van en puntos PDF, medidos sobre la página `p` (índice 0).

/** Una región de página a recortar. */
export interface RecorteGraduale { p: number; y0: number; y1: number; }

/** Los cantos de una Misa del libro. Cada canto puede ocupar varias regiones. */
export interface MisaGraduale {
  titulo: string;
  /** Secciones que la contienen, de fuera a dentro ("Proprium de Tempore", "Tempus
   *  Adventus"…). Sin esto, "Feria Secunda" o "Missa I" son ambiguos. */
  ruta: string[];
  pagina: number;
  cantos: Partial<Record<
    'introitus' | 'graduale' | 'alleluia' | 'tractus' | 'offertorium' | 'communio',
    RecorteGraduale[]
  >>;
}

export const GRADUALE_INDEX_DATA: Record<'romanum' | 'simplex', Record<string, MisaGraduale>> =
{
 "romanum": {
  "tempus-adventus": {
   "titulo": "Tempus Adventus",
   "ruta": [
    "Proprium de Tempore"
   ],
   "pagina": 12,
   "cantos": {
    "graduale": [
     {
      "p": 12,
      "y0": 35.8,
      "y1": 519.3
     },
     {
      "p": 13,
      "y0": 0,
      "y1": 157.0
     }
    ],
    "offertorium": [
     {
      "p": 13,
      "y0": 149.0,
      "y1": 451.6
     }
    ],
    "communio": [
     {
      "p": 13,
      "y0": 443.6,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-prima-adventus": {
   "titulo": "Hebdomada Prima Adventus",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus"
   ],
   "pagina": 12,
   "cantos": {
    "graduale": [
     {
      "p": 12,
      "y0": 35.8,
      "y1": 519.3
     },
     {
      "p": 13,
      "y0": 0,
      "y1": 157.0
     }
    ],
    "offertorium": [
     {
      "p": 13,
      "y0": 149.0,
      "y1": 451.6
     }
    ],
    "communio": [
     {
      "p": 13,
      "y0": 443.6,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-secunda-adventus": {
   "titulo": "Hebdomada Secunda Adventus",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus"
   ],
   "pagina": 15,
   "cantos": {
    "introitus": [
     {
      "p": 14,
      "y0": 169.0,
      "y1": 446.1
     }
    ],
    "graduale": [
     {
      "p": 14,
      "y0": 438.1,
      "y1": 519.3
     },
     {
      "p": 15,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 16,
      "y0": 0,
      "y1": 176.2
     }
    ],
    "offertorium": [
     {
      "p": 16,
      "y0": 168.2,
      "y1": 446.7
     }
    ],
    "communio": [
     {
      "p": 16,
      "y0": 438.7,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-tertia-adventus": {
   "titulo": "Hebdomada Tertia Adventus",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus"
   ],
   "pagina": 18,
   "cantos": {
    "introitus": [
     {
      "p": 17,
      "y0": 221.8,
      "y1": 519.3
     },
     {
      "p": 18,
      "y0": 0,
      "y1": 147.3
     }
    ],
    "graduale": [
     {
      "p": 18,
      "y0": 165.6,
      "y1": 519.3
     },
     {
      "p": 19,
      "y0": 0,
      "y1": 235.7
     }
    ],
    "offertorium": [
     {
      "p": 19,
      "y0": 227.7,
      "y1": 519.3
     }
    ]
   }
  },
  "in-feriis-adventus-a-die-17-ad-diem-24-decembris": {
   "titulo": "In Feriis Adventus a die 17 ad diem 24 decembris",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus"
   ],
   "pagina": 21,
   "cantos": {
    "communio": [
     {
      "p": 20,
      "y0": 154.5,
      "y1": 293.2
     }
    ],
    "introitus": [
     {
      "p": 20,
      "y0": 285.2,
      "y1": 519.3
     },
     {
      "p": 21,
      "y0": 0,
      "y1": 39.8
     }
    ],
    "graduale": [
     {
      "p": 21,
      "y0": 31.799999999999997,
      "y1": 519.3
     },
     {
      "p": 22,
      "y0": 0,
      "y1": 37.4
     }
    ],
    "offertorium": [
     {
      "p": 22,
      "y0": 29.4,
      "y1": 287.9
     }
    ]
   }
  },
  "feria-secunda": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 21,
   "cantos": {
    "communio": [
     {
      "p": 20,
      "y0": 154.5,
      "y1": 293.2
     }
    ],
    "introitus": [
     {
      "p": 20,
      "y0": 285.2,
      "y1": 519.3
     },
     {
      "p": 21,
      "y0": 0,
      "y1": 39.8
     }
    ],
    "graduale": [
     {
      "p": 21,
      "y0": 31.799999999999997,
      "y1": 519.3
     },
     {
      "p": 22,
      "y0": 0,
      "y1": 37.4
     }
    ],
    "offertorium": [
     {
      "p": 22,
      "y0": 29.4,
      "y1": 287.9
     }
    ]
   }
  },
  "feria-tertia": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 24,
   "cantos": {
    "introitus": [
     {
      "p": 23,
      "y0": 56.400000000000006,
      "y1": 296.4
     }
    ],
    "graduale": [
     {
      "p": 23,
      "y0": 288.4,
      "y1": 519.3
     },
     {
      "p": 24,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 26,
   "cantos": {
    "graduale": [
     {
      "p": 26,
      "y0": 79.7,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 28,
   "cantos": {
    "graduale": [
     {
      "p": 27,
      "y0": 324.3,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 29,
   "cantos": {
    "graduale": [
     {
      "p": 28,
      "y0": 285.1,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 30,
   "cantos": {
    "graduale": [
     {
      "p": 29,
      "y0": 181.1,
      "y1": 519.3
     }
    ]
   }
  },
  "die-19-decembris": {
   "titulo": "Die 19 decembris",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 31,
   "cantos": {
    "introitus": [
     {
      "p": 30,
      "y0": 230.0,
      "y1": 275.5
     }
    ],
    "offertorium": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 275.5
     }
    ],
    "communio": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 519.3
     },
     {
      "p": 31,
      "y0": 0,
      "y1": 146.1
     }
    ],
    "graduale": [
     {
      "p": 31,
      "y0": 138.1,
      "y1": 519.3
     },
     {
      "p": 32,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "die-20-decembris": {
   "titulo": "Die 20 decembris",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 31,
   "cantos": {
    "introitus": [
     {
      "p": 30,
      "y0": 230.0,
      "y1": 275.5
     }
    ],
    "offertorium": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 275.5
     }
    ],
    "communio": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 519.3
     },
     {
      "p": 31,
      "y0": 0,
      "y1": 146.1
     }
    ],
    "graduale": [
     {
      "p": 31,
      "y0": 138.1,
      "y1": 519.3
     },
     {
      "p": 32,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-quarta-adventus": {
   "titulo": "Dominica quarta Adventus",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 31,
   "cantos": {
    "introitus": [
     {
      "p": 30,
      "y0": 230.0,
      "y1": 275.5
     }
    ],
    "offertorium": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 275.5
     }
    ],
    "communio": [
     {
      "p": 30,
      "y0": 267.5,
      "y1": 519.3
     },
     {
      "p": 31,
      "y0": 0,
      "y1": 146.1
     }
    ],
    "graduale": [
     {
      "p": 31,
      "y0": 138.1,
      "y1": 519.3
     },
     {
      "p": 32,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "die-24-decembris-ad-missam-matutinam": {
   "titulo": "Die 24 decembris, ad Missam matutinam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Adventus",
    "In Feriis Adventus a die 17 ad diem 24 decembris"
   ],
   "pagina": 34,
   "cantos": {
    "communio": [
     {
      "p": 33,
      "y0": 165.1,
      "y1": 519.3
     }
    ]
   }
  },
  "tempus-nativitatis": {
   "titulo": "Tempus Nativitatis",
   "ruta": [
    "Proprium de Tempore"
   ],
   "pagina": 35,
   "cantos": {
    "introitus": [
     {
      "p": 34,
      "y0": 161.6,
      "y1": 519.3
     },
     {
      "p": 35,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 36,
      "y0": 0,
      "y1": 449.8
     }
    ],
    "communio": [
     {
      "p": 36,
      "y0": 441.8,
      "y1": 519.3
     }
    ]
   }
  },
  "in-nativitate-domini": {
   "titulo": "In Nativitate Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 35,
   "cantos": {
    "introitus": [
     {
      "p": 34,
      "y0": 161.6,
      "y1": 519.3
     },
     {
      "p": 35,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 36,
      "y0": 0,
      "y1": 449.8
     }
    ],
    "communio": [
     {
      "p": 36,
      "y0": 441.8,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-vigilia": {
   "titulo": "Ad Missam in Vigilia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis",
    "In Nativitate Domini"
   ],
   "pagina": 35,
   "cantos": {
    "introitus": [
     {
      "p": 34,
      "y0": 161.6,
      "y1": 519.3
     },
     {
      "p": 35,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 36,
      "y0": 0,
      "y1": 449.8
     }
    ],
    "communio": [
     {
      "p": 36,
      "y0": 441.8,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-nocte": {
   "titulo": "Ad Missam in Nocte",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis",
    "In Nativitate Domini"
   ],
   "pagina": 38,
   "cantos": {
    "graduale": [
     {
      "p": 38,
      "y0": 187.3,
      "y1": 519.3
     },
     {
      "p": 39,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-aurora": {
   "titulo": "Ad Missam in Aurora",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis",
    "In Nativitate Domini"
   ],
   "pagina": 41,
   "cantos": {
    "offertorium": [
     {
      "p": 40,
      "y0": 9.3,
      "y1": 380.1
     }
    ],
    "introitus": [
     {
      "p": 40,
      "y0": 372.1,
      "y1": 519.3
     },
     {
      "p": 41,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 42,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-die": {
   "titulo": "Ad Missam in Die",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis",
    "In Nativitate Domini"
   ],
   "pagina": 44,
   "cantos": {
    "graduale": [
     {
      "p": 44,
      "y0": 212.3,
      "y1": 519.3
     },
     {
      "p": 45,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 46,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "sanctae-familiae-iesu-mariae-et-ioseph": {
   "titulo": "Sanctae Familiae Iesu, Mariae et Ioseph",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 48,
   "cantos": {
    "introitus": [
     {
      "p": 47,
      "y0": 93.2,
      "y1": 115.3
     }
    ],
    "graduale": [
     {
      "p": 47,
      "y0": 107.3,
      "y1": 129.3
     }
    ],
    "alleluia": [
     {
      "p": 47,
      "y0": 121.30000000000001,
      "y1": 143.4
     }
    ],
    "offertorium": [
     {
      "p": 47,
      "y0": 135.4,
      "y1": 187.2
     }
    ],
    "communio": [
     {
      "p": 47,
      "y0": 179.2,
      "y1": 519.3
     }
    ]
   }
  },
  "die-29-decembris": {
   "titulo": "Die 29 decembris",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 50,
   "cantos": {
    "communio": [
     {
      "p": 49,
      "y0": 101.4,
      "y1": 185.5
     }
    ],
    "introitus": [
     {
      "p": 49,
      "y0": 177.5,
      "y1": 209.4
     }
    ],
    "graduale": [
     {
      "p": 49,
      "y0": 201.4,
      "y1": 227.4
     }
    ],
    "alleluia": [
     {
      "p": 49,
      "y0": 219.4,
      "y1": 251.5
     }
    ],
    "offertorium": [
     {
      "p": 49,
      "y0": 243.5,
      "y1": 519.3
     },
     {
      "p": 50,
      "y0": 0,
      "y1": 234.8
     }
    ]
   }
  },
  "sollemnitas-sanctae-dei-genetricis-mariae": {
   "titulo": "Sollemnitas Sanctae Dei Genetricis Mariae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 50,
   "cantos": {
    "communio": [
     {
      "p": 49,
      "y0": 101.4,
      "y1": 185.5
     }
    ],
    "introitus": [
     {
      "p": 49,
      "y0": 177.5,
      "y1": 209.4
     }
    ],
    "graduale": [
     {
      "p": 49,
      "y0": 201.4,
      "y1": 227.4
     }
    ],
    "alleluia": [
     {
      "p": 49,
      "y0": 219.4,
      "y1": 251.5
     }
    ],
    "offertorium": [
     {
      "p": 49,
      "y0": 243.5,
      "y1": 519.3
     },
     {
      "p": 50,
      "y0": 0,
      "y1": 234.8
     }
    ]
   }
  },
  "dominica-secunda-post-nativitatem": {
   "titulo": "Dominica Secunda post Nativitatem",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 50,
   "cantos": {
    "communio": [
     {
      "p": 49,
      "y0": 101.4,
      "y1": 185.5
     }
    ],
    "introitus": [
     {
      "p": 49,
      "y0": 177.5,
      "y1": 209.4
     }
    ],
    "graduale": [
     {
      "p": 49,
      "y0": 201.4,
      "y1": 227.4
     }
    ],
    "alleluia": [
     {
      "p": 49,
      "y0": 219.4,
      "y1": 251.5
     }
    ],
    "offertorium": [
     {
      "p": 49,
      "y0": 243.5,
      "y1": 519.3
     },
     {
      "p": 50,
      "y0": 0,
      "y1": 234.8
     }
    ]
   }
  },
  "in-feriis-temporis-nativitatis": {
   "titulo": "In feriis temporis Nativitatis",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 52,
   "cantos": {
    "alleluia": [
     {
      "p": 51,
      "y0": 258.4,
      "y1": 277.4
     }
    ],
    "offertorium": [
     {
      "p": 51,
      "y0": 269.4,
      "y1": 289.5
     }
    ],
    "communio": [
     {
      "p": 51,
      "y0": 281.5,
      "y1": 519.3
     }
    ]
   }
  },
  "die-4-ianuarii": {
   "titulo": "Die 4 ianuarii",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 52,
   "cantos": {
    "alleluia": [
     {
      "p": 51,
      "y0": 258.4,
      "y1": 277.4
     }
    ],
    "offertorium": [
     {
      "p": 51,
      "y0": 269.4,
      "y1": 289.5
     }
    ],
    "communio": [
     {
      "p": 51,
      "y0": 281.5,
      "y1": 519.3
     }
    ]
   }
  },
  "in-epiphania-domini": {
   "titulo": "In Epiphania Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 53,
   "cantos": {
    "graduale": [
     {
      "p": 53,
      "y0": 138.2,
      "y1": 519.3
     },
     {
      "p": 54,
      "y0": 0,
      "y1": 255.39999999999998
     }
    ],
    "offertorium": [
     {
      "p": 54,
      "y0": 247.39999999999998,
      "y1": 519.3
     }
    ]
   }
  },
  "in-feriis-post-epiphaniam": {
   "titulo": "In feriis post Epiphaniam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 56,
   "cantos": {
    "communio": [
     {
      "p": 55,
      "y0": 29.799999999999997,
      "y1": 351.0
     }
    ],
    "introitus": [
     {
      "p": 55,
      "y0": 343.0,
      "y1": 359.2
     }
    ],
    "graduale": [
     {
      "p": 55,
      "y0": 351.2,
      "y1": 519.3
     },
     {
      "p": 56,
      "y0": 0,
      "y1": 187.1
     }
    ],
    "alleluia": [
     {
      "p": 56,
      "y0": 179.1,
      "y1": 519.3
     },
     {
      "p": 57,
      "y0": 0,
      "y1": 40.1
     }
    ]
   }
  },
  "die-7-ianuarii": {
   "titulo": "Die 7 ianuarii",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 56,
   "cantos": {
    "communio": [
     {
      "p": 55,
      "y0": 29.799999999999997,
      "y1": 351.0
     }
    ],
    "introitus": [
     {
      "p": 55,
      "y0": 343.0,
      "y1": 359.2
     }
    ],
    "graduale": [
     {
      "p": 55,
      "y0": 351.2,
      "y1": 519.3
     },
     {
      "p": 56,
      "y0": 0,
      "y1": 187.1
     }
    ],
    "alleluia": [
     {
      "p": 56,
      "y0": 179.1,
      "y1": 519.3
     },
     {
      "p": 57,
      "y0": 0,
      "y1": 40.1
     }
    ]
   }
  },
  "die-8-ianuarii-vel-feria-tertia-post-epiphaniam": {
   "titulo": "Die 8 ianuarii, vel feria tertia post Epiphaniam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 56,
   "cantos": {
    "communio": [
     {
      "p": 55,
      "y0": 29.799999999999997,
      "y1": 351.0
     }
    ],
    "introitus": [
     {
      "p": 55,
      "y0": 343.0,
      "y1": 359.2
     }
    ],
    "graduale": [
     {
      "p": 55,
      "y0": 351.2,
      "y1": 519.3
     },
     {
      "p": 56,
      "y0": 0,
      "y1": 187.1
     }
    ],
    "alleluia": [
     {
      "p": 56,
      "y0": 179.1,
      "y1": 519.3
     },
     {
      "p": 57,
      "y0": 0,
      "y1": 40.1
     }
    ]
   }
  },
  "in-baptismate-domini": {
   "titulo": "In Baptismate Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 56,
   "cantos": {
    "communio": [
     {
      "p": 55,
      "y0": 29.799999999999997,
      "y1": 351.0
     }
    ],
    "introitus": [
     {
      "p": 55,
      "y0": 343.0,
      "y1": 359.2
     }
    ],
    "graduale": [
     {
      "p": 55,
      "y0": 351.2,
      "y1": 519.3
     },
     {
      "p": 56,
      "y0": 0,
      "y1": 187.1
     }
    ],
    "alleluia": [
     {
      "p": 56,
      "y0": 179.1,
      "y1": 519.3
     },
     {
      "p": 57,
      "y0": 0,
      "y1": 40.1
     }
    ]
   }
  },
  "tempus-quadragesimae": {
   "titulo": "Tempus Quadragesimae",
   "ruta": [
    "Proprium de Tempore"
   ],
   "pagina": 59,
   "cantos": {
    "introitus": [
     {
      "p": 58,
      "y0": 150.0,
      "y1": 519.3
     },
     {
      "p": 59,
      "y0": 0,
      "y1": 83.0
     }
    ],
    "graduale": [
     {
      "p": 59,
      "y0": 75.0,
      "y1": 519.3
     },
     {
      "p": 60,
      "y0": 0,
      "y1": 39.0
     }
    ],
    "tractus": [
     {
      "p": 60,
      "y0": 31.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta-cinerum": {
   "titulo": "Feria Quarta Cinerum",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 59,
   "cantos": {
    "introitus": [
     {
      "p": 58,
      "y0": 150.0,
      "y1": 519.3
     },
     {
      "p": 59,
      "y0": 0,
      "y1": 83.0
     }
    ],
    "graduale": [
     {
      "p": 59,
      "y0": 75.0,
      "y1": 519.3
     },
     {
      "p": 60,
      "y0": 0,
      "y1": 39.0
     }
    ],
    "tractus": [
     {
      "p": 60,
      "y0": 31.0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-ritus-initiales-et-liturgiam-verbi": {
   "titulo": "Ad Ritus Initiales et Liturgiam Verbi",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Feria Quarta Cinerum"
   ],
   "pagina": 59,
   "cantos": {
    "introitus": [
     {
      "p": 58,
      "y0": 150.0,
      "y1": 519.3
     },
     {
      "p": 59,
      "y0": 0,
      "y1": 83.0
     }
    ],
    "graduale": [
     {
      "p": 59,
      "y0": 75.0,
      "y1": 519.3
     },
     {
      "p": 60,
      "y0": 0,
      "y1": 39.0
     }
    ],
    "tractus": [
     {
      "p": 60,
      "y0": 31.0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-liturgiam-eucharisticam": {
   "titulo": "Ad Liturgiam Eucharisticam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Feria Quarta Cinerum"
   ],
   "pagina": 64,
   "cantos": {
    "offertorium": [
     {
      "p": 63,
      "y0": 146.5,
      "y1": 205.3
     }
    ],
    "communio": [
     {
      "p": 63,
      "y0": 197.3,
      "y1": 428.6
     }
    ],
    "introitus": [
     {
      "p": 63,
      "y0": 420.6,
      "y1": 442.9
     }
    ],
    "graduale": [
     {
      "p": 63,
      "y0": 434.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-post-cineres": {
   "titulo": "Feria Quinta post Cineres",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 64,
   "cantos": {
    "offertorium": [
     {
      "p": 63,
      "y0": 146.5,
      "y1": 205.3
     }
    ],
    "communio": [
     {
      "p": 63,
      "y0": 197.3,
      "y1": 428.6
     }
    ],
    "introitus": [
     {
      "p": 63,
      "y0": 420.6,
      "y1": 442.9
     }
    ],
    "graduale": [
     {
      "p": 63,
      "y0": 434.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-post-cineres": {
   "titulo": "Feria Sexta post Cineres",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 65,
   "cantos": {
    "introitus": [
     {
      "p": 64,
      "y0": 60.599999999999994,
      "y1": 275.8
     }
    ],
    "graduale": [
     {
      "p": 64,
      "y0": 267.8,
      "y1": 287.9
     }
    ],
    "offertorium": [
     {
      "p": 64,
      "y0": 279.9,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-post-cineres": {
   "titulo": "Sabbato post Cineres",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 66,
   "cantos": {
    "graduale": [
     {
      "p": 65,
      "y0": 384.0,
      "y1": 519.3
     },
     {
      "p": 66,
      "y0": 0,
      "y1": 480.4
     }
    ],
    "offertorium": [
     {
      "p": 66,
      "y0": 472.4,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-prima-quadragesimae": {
   "titulo": "Hebdomada Prima Quadragesimae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 68,
   "cantos": {
    "introitus": [
     {
      "p": 67,
      "y0": 324.4,
      "y1": 519.3
     },
     {
      "p": 68,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 69,
      "y0": 0,
      "y1": 37.0
     }
    ],
    "tractus": [
     {
      "p": 69,
      "y0": 29.0,
      "y1": 519.3
     },
     {
      "p": 70,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 71,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 72,
      "y0": 0,
      "y1": 452.1
     }
    ],
    "offertorium": [
     {
      "p": 72,
      "y0": 444.1,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 68,
   "cantos": {
    "introitus": [
     {
      "p": 67,
      "y0": 324.4,
      "y1": 519.3
     },
     {
      "p": 68,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 69,
      "y0": 0,
      "y1": 37.0
     }
    ],
    "tractus": [
     {
      "p": 69,
      "y0": 29.0,
      "y1": 519.3
     },
     {
      "p": 70,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 71,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 72,
      "y0": 0,
      "y1": 452.1
     }
    ],
    "offertorium": [
     {
      "p": 72,
      "y0": 444.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p74": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 74,
   "cantos": {
    "introitus": [
     {
      "p": 73,
      "y0": 383.3,
      "y1": 519.3
     },
     {
      "p": 74,
      "y0": 0,
      "y1": 248.9
     }
    ],
    "graduale": [
     {
      "p": 74,
      "y0": 240.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-tertia-p76": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 76,
   "cantos": {
    "communio": [
     {
      "p": 75,
      "y0": 108.4,
      "y1": 396.0
     }
    ],
    "introitus": [
     {
      "p": 75,
      "y0": 388.0,
      "y1": 519.3
     },
     {
      "p": 76,
      "y0": 0,
      "y1": 200.9
     }
    ],
    "graduale": [
     {
      "p": 76,
      "y0": 192.9,
      "y1": 213.0
     }
    ],
    "offertorium": [
     {
      "p": 76,
      "y0": 205.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta-p78": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 78,
   "cantos": {
    "introitus": [
     {
      "p": 77,
      "y0": 45.3,
      "y1": 451.6
     }
    ],
    "graduale": [
     {
      "p": 77,
      "y0": 443.6,
      "y1": 519.3
     },
     {
      "p": 78,
      "y0": 0,
      "y1": 356.8
     }
    ],
    "offertorium": [
     {
      "p": 78,
      "y0": 348.8,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-p80": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 80,
   "cantos": {
    "graduale": [
     {
      "p": 79,
      "y0": 351.2,
      "y1": 371.1
     }
    ],
    "offertorium": [
     {
      "p": 79,
      "y0": 363.1,
      "y1": 392.9
     }
    ],
    "communio": [
     {
      "p": 79,
      "y0": 384.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-p81": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 81,
   "cantos": {
    "introitus": [
     {
      "p": 80,
      "y0": 215.1,
      "y1": 519.3
     },
     {
      "p": 81,
      "y0": 0,
      "y1": 38.7
     }
    ],
    "graduale": [
     {
      "p": 81,
      "y0": 30.700000000000003,
      "y1": 297.2
     }
    ],
    "offertorium": [
     {
      "p": 81,
      "y0": 289.2,
      "y1": 323.2
     }
    ],
    "communio": [
     {
      "p": 81,
      "y0": 315.2,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-p83": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Prima Quadragesimae"
   ],
   "pagina": 83,
   "cantos": {
    "introitus": [
     {
      "p": 82,
      "y0": 44.2,
      "y1": 519.3
     },
     {
      "p": 83,
      "y0": 0,
      "y1": 214.0
     }
    ],
    "offertorium": [
     {
      "p": 83,
      "y0": 206.0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-secunda-quadragesimae": {
   "titulo": "Hebdomada Secunda Quadragesimae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 85,
   "cantos": {
    "introitus": [
     {
      "p": 84,
      "y0": 151.8,
      "y1": 394.6
     }
    ],
    "graduale": [
     {
      "p": 84,
      "y0": 386.6,
      "y1": 519.3
     },
     {
      "p": 85,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 86,
      "y0": 0,
      "y1": 335.1
     }
    ],
    "offertorium": [
     {
      "p": 86,
      "y0": 327.1,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-p85": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 85,
   "cantos": {
    "introitus": [
     {
      "p": 84,
      "y0": 151.8,
      "y1": 394.6
     }
    ],
    "graduale": [
     {
      "p": 84,
      "y0": 386.6,
      "y1": 519.3
     },
     {
      "p": 85,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 86,
      "y0": 0,
      "y1": 335.1
     }
    ],
    "offertorium": [
     {
      "p": 86,
      "y0": 327.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p88": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 88,
   "cantos": {
    "introitus": [
     {
      "p": 87,
      "y0": 66.8,
      "y1": 353.9
     }
    ],
    "graduale": [
     {
      "p": 87,
      "y0": 345.9,
      "y1": 365.9
     }
    ],
    "offertorium": [
     {
      "p": 87,
      "y0": 357.9,
      "y1": 378.0
     }
    ],
    "communio": [
     {
      "p": 87,
      "y0": 370.0,
      "y1": 519.3
     },
     {
      "p": 88,
      "y0": 0,
      "y1": 419.1
     }
    ]
   }
  },
  "feria-tertia-p88": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 88,
   "cantos": {
    "introitus": [
     {
      "p": 87,
      "y0": 66.8,
      "y1": 353.9
     }
    ],
    "graduale": [
     {
      "p": 87,
      "y0": 345.9,
      "y1": 365.9
     }
    ],
    "offertorium": [
     {
      "p": 87,
      "y0": 357.9,
      "y1": 378.0
     }
    ],
    "communio": [
     {
      "p": 87,
      "y0": 370.0,
      "y1": 519.3
     },
     {
      "p": 88,
      "y0": 0,
      "y1": 419.1
     }
    ]
   }
  },
  "feria-quarta-p90": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 90,
   "cantos": {
    "communio": [
     {
      "p": 89,
      "y0": 141.6,
      "y1": 232.7
     }
    ],
    "introitus": [
     {
      "p": 89,
      "y0": 224.7,
      "y1": 240.0
     }
    ],
    "graduale": [
     {
      "p": 89,
      "y0": 232.0,
      "y1": 254.0
     }
    ],
    "offertorium": [
     {
      "p": 89,
      "y0": 246.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-p91": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 91,
   "cantos": {
    "introitus": [
     {
      "p": 90,
      "y0": 48.6,
      "y1": 68.4
     }
    ],
    "graduale": [
     {
      "p": 90,
      "y0": 60.400000000000006,
      "y1": 105.1
     }
    ],
    "offertorium": [
     {
      "p": 90,
      "y0": 97.1,
      "y1": 325.8
     }
    ],
    "communio": [
     {
      "p": 90,
      "y0": 317.8,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-p91": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 91,
   "cantos": {
    "introitus": [
     {
      "p": 90,
      "y0": 48.6,
      "y1": 68.4
     }
    ],
    "graduale": [
     {
      "p": 90,
      "y0": 60.400000000000006,
      "y1": 105.1
     }
    ],
    "offertorium": [
     {
      "p": 90,
      "y0": 97.1,
      "y1": 325.8
     }
    ],
    "communio": [
     {
      "p": 90,
      "y0": 317.8,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-p92": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Secunda Quadragesimae"
   ],
   "pagina": 92,
   "cantos": {
    "graduale": [
     {
      "p": 91,
      "y0": 130.2,
      "y1": 150.3
     }
    ],
    "offertorium": [
     {
      "p": 91,
      "y0": 142.3,
      "y1": 181.1
     }
    ],
    "communio": [
     {
      "p": 91,
      "y0": 173.1,
      "y1": 324.5
     }
    ],
    "introitus": [
     {
      "p": 91,
      "y0": 316.5,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-tertia-quadragesimae": {
   "titulo": "Hebdomada Tertia Quadragesimae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 93,
   "cantos": {
    "introitus": [
     {
      "p": 92,
      "y0": 87.5,
      "y1": 447.1
     }
    ],
    "graduale": [
     {
      "p": 92,
      "y0": 439.1,
      "y1": 519.3
     },
     {
      "p": 93,
      "y0": 0,
      "y1": 438.3
     }
    ],
    "tractus": [
     {
      "p": 93,
      "y0": 430.3,
      "y1": 519.3
     },
     {
      "p": 94,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 95,
      "y0": 0,
      "y1": 81.2
     }
    ],
    "offertorium": [
     {
      "p": 95,
      "y0": 73.2,
      "y1": 122.1
     }
    ],
    "communio": [
     {
      "p": 95,
      "y0": 114.1,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-p93": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 93,
   "cantos": {
    "introitus": [
     {
      "p": 92,
      "y0": 87.5,
      "y1": 447.1
     }
    ],
    "graduale": [
     {
      "p": 92,
      "y0": 439.1,
      "y1": 519.3
     },
     {
      "p": 93,
      "y0": 0,
      "y1": 438.3
     }
    ],
    "tractus": [
     {
      "p": 93,
      "y0": 430.3,
      "y1": 519.3
     },
     {
      "p": 94,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 95,
      "y0": 0,
      "y1": 81.2
     }
    ],
    "offertorium": [
     {
      "p": 95,
      "y0": 73.2,
      "y1": 122.1
     }
    ],
    "communio": [
     {
      "p": 95,
      "y0": 114.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p97": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 97,
   "cantos": {
    "introitus": [
     {
      "p": 96,
      "y0": 79.5,
      "y1": 360.7
     }
    ],
    "graduale": [
     {
      "p": 96,
      "y0": 352.7,
      "y1": 395.8
     }
    ],
    "offertorium": [
     {
      "p": 96,
      "y0": 387.8,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-tertia-p98": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 98,
   "cantos": {
    "introitus": [
     {
      "p": 97,
      "y0": 411.7,
      "y1": 445.3
     }
    ],
    "graduale": [
     {
      "p": 97,
      "y0": 437.3,
      "y1": 519.3
     },
     {
      "p": 98,
      "y0": 0,
      "y1": 362.2
     }
    ],
    "offertorium": [
     {
      "p": 98,
      "y0": 354.2,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta-p100": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 100,
   "cantos": {
    "introitus": [
     {
      "p": 99,
      "y0": 170.2,
      "y1": 446.6
     }
    ],
    "graduale": [
     {
      "p": 99,
      "y0": 438.6,
      "y1": 519.3
     },
     {
      "p": 100,
      "y0": 0,
      "y1": 335.1
     }
    ],
    "offertorium": [
     {
      "p": 100,
      "y0": 327.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-p102": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 102,
   "cantos": {
    "communio": [
     {
      "p": 101,
      "y0": 71.0,
      "y1": 116.6
     }
    ],
    "introitus": [
     {
      "p": 101,
      "y0": 108.6,
      "y1": 128.7
     }
    ],
    "graduale": [
     {
      "p": 101,
      "y0": 120.69999999999999,
      "y1": 140.7
     }
    ],
    "offertorium": [
     {
      "p": 101,
      "y0": 132.7,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-p102": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 102,
   "cantos": {
    "communio": [
     {
      "p": 101,
      "y0": 71.0,
      "y1": 116.6
     }
    ],
    "introitus": [
     {
      "p": 101,
      "y0": 108.6,
      "y1": 128.7
     }
    ],
    "graduale": [
     {
      "p": 101,
      "y0": 120.69999999999999,
      "y1": 140.7
     }
    ],
    "offertorium": [
     {
      "p": 101,
      "y0": 132.7,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-p103": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Tertia Quadragesimae"
   ],
   "pagina": 103,
   "cantos": {
    "graduale": [
     {
      "p": 102,
      "y0": 24.5,
      "y1": 44.4
     }
    ],
    "offertorium": [
     {
      "p": 102,
      "y0": 36.4,
      "y1": 56.5
     }
    ],
    "communio": [
     {
      "p": 102,
      "y0": 48.5,
      "y1": 129.0
     }
    ],
    "introitus": [
     {
      "p": 102,
      "y0": 121.0,
      "y1": 519.3
     },
     {
      "p": 103,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-quarta-quadragesimae": {
   "titulo": "Hebdomada Quarta Quadragesimae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 105,
   "cantos": {
    "offertorium": [
     {
      "p": 104,
      "y0": 76.5,
      "y1": 519.3
     },
     {
      "p": 105,
      "y0": 0,
      "y1": 231.2
     }
    ],
    "tractus": [
     {
      "p": 105,
      "y0": 223.2,
      "y1": 519.3
     },
     {
      "p": 106,
      "y0": 0,
      "y1": 210.6
     }
    ],
    "communio": [
     {
      "p": 106,
      "y0": 473.5,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-p105": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 105,
   "cantos": {
    "offertorium": [
     {
      "p": 104,
      "y0": 76.5,
      "y1": 519.3
     },
     {
      "p": 105,
      "y0": 0,
      "y1": 231.2
     }
    ],
    "tractus": [
     {
      "p": 105,
      "y0": 223.2,
      "y1": 519.3
     },
     {
      "p": 106,
      "y0": 0,
      "y1": 210.6
     }
    ],
    "communio": [
     {
      "p": 106,
      "y0": 473.5,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p108": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 108,
   "cantos": {
    "communio": [
     {
      "p": 107,
      "y0": 44.6,
      "y1": 230.4
     }
    ],
    "offertorium": [
     {
      "p": 107,
      "y0": 222.4,
      "y1": 519.3
     },
     {
      "p": 108,
      "y0": 0,
      "y1": 86.2
     }
    ],
    "graduale": [
     {
      "p": 108,
      "y0": 78.2,
      "y1": 519.3
     },
     {
      "p": 109,
      "y0": 0,
      "y1": 280.1
     }
    ]
   }
  },
  "feria-tertia-p111": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 111,
   "cantos": {
    "introitus": [
     {
      "p": 110,
      "y0": 55.3,
      "y1": 337.0
     }
    ],
    "graduale": [
     {
      "p": 110,
      "y0": 329.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta-p112": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 112,
   "cantos": {
    "offertorium": [
     {
      "p": 111,
      "y0": 366.7,
      "y1": 386.7
     }
    ],
    "communio": [
     {
      "p": 111,
      "y0": 378.7,
      "y1": 441.9
     }
    ],
    "introitus": [
     {
      "p": 111,
      "y0": 433.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-p113": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 113,
   "cantos": {
    "graduale": [
     {
      "p": 112,
      "y0": 247.60000000000002,
      "y1": 267.2
     }
    ],
    "offertorium": [
     {
      "p": 112,
      "y0": 259.2,
      "y1": 279.2
     }
    ],
    "communio": [
     {
      "p": 112,
      "y0": 271.2,
      "y1": 335.9
     }
    ],
    "introitus": [
     {
      "p": 112,
      "y0": 327.9,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-p113": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 113,
   "cantos": {
    "graduale": [
     {
      "p": 112,
      "y0": 247.60000000000002,
      "y1": 267.2
     }
    ],
    "offertorium": [
     {
      "p": 112,
      "y0": 259.2,
      "y1": 279.2
     }
    ],
    "communio": [
     {
      "p": 112,
      "y0": 271.2,
      "y1": 335.9
     }
    ],
    "introitus": [
     {
      "p": 112,
      "y0": 327.9,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-p114": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quarta Quadragesimae"
   ],
   "pagina": 114,
   "cantos": {
    "graduale": [
     {
      "p": 113,
      "y0": 240.2,
      "y1": 260.3
     }
    ],
    "offertorium": [
     {
      "p": 113,
      "y0": 252.3,
      "y1": 272.3
     }
    ],
    "communio": [
     {
      "p": 113,
      "y0": 264.3,
      "y1": 343.5
     }
    ],
    "introitus": [
     {
      "p": 113,
      "y0": 335.5,
      "y1": 519.3
     },
     {
      "p": 114,
      "y0": 0,
      "y1": 239.9
     }
    ]
   }
  },
  "hebdomada-quinta-quadragesimae": {
   "titulo": "Hebdomada Quinta Quadragesimae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 117,
   "cantos": {
    "introitus": [
     {
      "p": 116,
      "y0": 97.9,
      "y1": 519.3
     },
     {
      "p": 117,
      "y0": 0,
      "y1": 42.0
     }
    ],
    "graduale": [
     {
      "p": 117,
      "y0": 34.0,
      "y1": 519.3
     },
     {
      "p": 118,
      "y0": 0,
      "y1": 136.8
     }
    ],
    "tractus": [
     {
      "p": 118,
      "y0": 128.8,
      "y1": 519.3
     },
     {
      "p": 119,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 120,
      "y0": 0,
      "y1": 62.2
     }
    ],
    "communio": [
     {
      "p": 120,
      "y0": 54.2,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-p117": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 117,
   "cantos": {
    "introitus": [
     {
      "p": 116,
      "y0": 97.9,
      "y1": 519.3
     },
     {
      "p": 117,
      "y0": 0,
      "y1": 42.0
     }
    ],
    "graduale": [
     {
      "p": 117,
      "y0": 34.0,
      "y1": 519.3
     },
     {
      "p": 118,
      "y0": 0,
      "y1": 136.8
     }
    ],
    "tractus": [
     {
      "p": 118,
      "y0": 128.8,
      "y1": 519.3
     },
     {
      "p": 119,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 120,
      "y0": 0,
      "y1": 62.2
     }
    ],
    "communio": [
     {
      "p": 120,
      "y0": 54.2,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p122": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 122,
   "cantos": {
    "introitus": [
     {
      "p": 121,
      "y0": 72.0,
      "y1": 327.7
     }
    ],
    "graduale": [
     {
      "p": 121,
      "y0": 319.7,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-tertia-p123": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 123,
   "cantos": {
    "offertorium": [
     {
      "p": 122,
      "y0": 214.5,
      "y1": 261.5
     }
    ],
    "communio": [
     {
      "p": 122,
      "y0": 253.5,
      "y1": 394.3
     }
    ],
    "introitus": [
     {
      "p": 122,
      "y0": 386.3,
      "y1": 519.3
     },
     {
      "p": 123,
      "y0": 0,
      "y1": 150.2
     }
    ],
    "graduale": [
     {
      "p": 123,
      "y0": 142.2,
      "y1": 481.0
     }
    ]
   }
  },
  "feria-quarta-p125": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 125,
   "cantos": {
    "communio": [
     {
      "p": 124,
      "y0": 30.6,
      "y1": 192.1
     }
    ],
    "introitus": [
     {
      "p": 124,
      "y0": 184.1,
      "y1": 519.3
     },
     {
      "p": 125,
      "y0": 0,
      "y1": 28.700000000000003
     }
    ],
    "graduale": [
     {
      "p": 125,
      "y0": 20.700000000000003,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-p127": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 127,
   "cantos": {
    "introitus": [
     {
      "p": 126,
      "y0": 131.7,
      "y1": 151.8
     }
    ],
    "graduale": [
     {
      "p": 126,
      "y0": 143.8,
      "y1": 163.7
     }
    ],
    "offertorium": [
     {
      "p": 126,
      "y0": 155.7,
      "y1": 175.8
     }
    ],
    "communio": [
     {
      "p": 126,
      "y0": 167.8,
      "y1": 519.3
     },
     {
      "p": 127,
      "y0": 0,
      "y1": 106.7
     }
    ]
   }
  },
  "feria-sexta-p127": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 127,
   "cantos": {
    "introitus": [
     {
      "p": 126,
      "y0": 131.7,
      "y1": 151.8
     }
    ],
    "graduale": [
     {
      "p": 126,
      "y0": 143.8,
      "y1": 163.7
     }
    ],
    "offertorium": [
     {
      "p": 126,
      "y0": 155.7,
      "y1": 175.8
     }
    ],
    "communio": [
     {
      "p": 126,
      "y0": 167.8,
      "y1": 519.3
     },
     {
      "p": 127,
      "y0": 0,
      "y1": 106.7
     }
    ]
   }
  },
  "sabbato-p129": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Quinta Quadragesimae"
   ],
   "pagina": 129,
   "cantos": {
    "introitus": [
     {
      "p": 128,
      "y0": 441.7,
      "y1": 519.3
     },
     {
      "p": 129,
      "y0": 0,
      "y1": 393.4
     }
    ],
    "graduale": [
     {
      "p": 129,
      "y0": 385.4,
      "y1": 519.3
     },
     {
      "p": 130,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 131,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 132,
      "y0": 0,
      "y1": 361.8
     }
    ],
    "offertorium": [
     {
      "p": 132,
      "y0": 353.8,
      "y1": 373.9
     }
    ],
    "communio": [
     {
      "p": 132,
      "y0": 365.9,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam": {
   "titulo": "Ad Missam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Dominica in Palmis de Passione Domini"
   ],
   "pagina": 141,
   "cantos": {
    "graduale": [
     {
      "p": 144,
      "y0": 57.900000000000006,
      "y1": 399.6
     }
    ],
    "offertorium": [
     {
      "p": 144,
      "y0": 391.6,
      "y1": 519.3
     },
     {
      "p": 145,
      "y0": 0,
      "y1": 326.8
     }
    ],
    "communio": [
     {
      "p": 145,
      "y0": 318.8,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-secunda-p147": {
   "titulo": "Feria Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta"
   ],
   "pagina": 147,
   "cantos": {
    "introitus": [
     {
      "p": 146,
      "y0": 54.8,
      "y1": 393.5
     }
    ],
    "graduale": [
     {
      "p": 146,
      "y0": 385.5,
      "y1": 519.3
     },
     {
      "p": 147,
      "y0": 0,
      "y1": 391.8
     }
    ],
    "offertorium": [
     {
      "p": 147,
      "y0": 383.8,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-tertia-p149": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta"
   ],
   "pagina": 149,
   "cantos": {
    "introitus": [
     {
      "p": 148,
      "y0": 414.2,
      "y1": 450.3
     }
    ],
    "graduale": [
     {
      "p": 148,
      "y0": 442.3,
      "y1": 519.3
     },
     {
      "p": 149,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 150,
      "y0": 0,
      "y1": 13.5
     }
    ],
    "offertorium": [
     {
      "p": 150,
      "y0": 5.5,
      "y1": 194.0
     }
    ],
    "communio": [
     {
      "p": 150,
      "y0": 186.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quarta-p152": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta"
   ],
   "pagina": 152,
   "cantos": {
    "introitus": [
     {
      "p": 151,
      "y0": 61.7,
      "y1": 450.8
     }
    ],
    "graduale": [
     {
      "p": 151,
      "y0": 442.8,
      "y1": 519.3
     },
     {
      "p": 152,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 153,
      "y0": 0,
      "y1": 236.3
     }
    ],
    "communio": [
     {
      "p": 153,
      "y0": 228.3,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-quinta-ad-missam-chrismatis": {
   "titulo": "Feria Quinta ad Missam Chrismatis",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta"
   ],
   "pagina": 155,
   "cantos": {
    "introitus": [
     {
      "p": 154,
      "y0": 139.1,
      "y1": 159.2
     }
    ],
    "graduale": [
     {
      "p": 154,
      "y0": 151.2,
      "y1": 189.6
     }
    ],
    "tractus": [
     {
      "p": 154,
      "y0": 181.6,
      "y1": 519.3
     },
     {
      "p": 155,
      "y0": 0,
      "y1": 314.1
     }
    ],
    "offertorium": [
     {
      "p": 155,
      "y0": 306.1,
      "y1": 519.3
     },
     {
      "p": 156,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 157,
      "y0": 0,
      "y1": 327.1
     }
    ],
    "communio": [
     {
      "p": 157,
      "y0": 319.1,
      "y1": 519.3
     }
    ]
   }
  },
  "sacrum-triduum-paschale": {
   "titulo": "Sacrum Triduum Paschale",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta"
   ],
   "pagina": 159,
   "cantos": {
    "graduale": [
     {
      "p": 159,
      "y0": 260.9,
      "y1": 303.4
     }
    ],
    "tractus": [
     {
      "p": 159,
      "y0": 295.4,
      "y1": 519.3
     }
    ]
   }
  },
  "missa-vespertina-in-cena-domini": {
   "titulo": "Missa Vespertina in Cena Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale"
   ],
   "pagina": 159,
   "cantos": {
    "graduale": [
     {
      "p": 159,
      "y0": 260.9,
      "y1": 303.4
     }
    ],
    "tractus": [
     {
      "p": 159,
      "y0": 295.4,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-liturgiam-verbi": {
   "titulo": "Ad Liturgiam Verbi",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale",
    "Missa Vespertina in Cena Domini"
   ],
   "pagina": 159,
   "cantos": {
    "graduale": [
     {
      "p": 159,
      "y0": 260.9,
      "y1": 303.4
     }
    ],
    "tractus": [
     {
      "p": 159,
      "y0": 295.4,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-liturgiam-eucharisticam-p165": {
   "titulo": "Ad Liturgiam Eucharisticam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale",
    "Missa Vespertina in Cena Domini"
   ],
   "pagina": 165,
   "cantos": {
    "offertorium": [
     {
      "p": 164,
      "y0": 70.5,
      "y1": 519.3
     },
     {
      "p": 165,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-translationem-ss-mi-sacramenti": {
   "titulo": "Ad Translationem Ss.mi Sacramenti",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale",
    "Missa Vespertina in Cena Domini"
   ],
   "pagina": 167,
   "cantos": {
    "communio": [
     {
      "p": 166,
      "y0": 27.299999999999997,
      "y1": 519.3
     },
     {
      "p": 167,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-in-passione-domini": {
   "titulo": "Feria Sexta in Passione Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale"
   ],
   "pagina": 169,
   "cantos": {
    "tractus": [
     {
      "p": 168,
      "y0": 233.0,
      "y1": 519.3
     },
     {
      "p": 169,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-liturgiam-verbi-p169": {
   "titulo": "Ad Liturgiam Verbi",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Quadragesimae",
    "Hebdomada Sancta",
    "Sacrum Triduum Paschale",
    "Feria Sexta in Passione Domini"
   ],
   "pagina": 169,
   "cantos": {
    "tractus": [
     {
      "p": 168,
      "y0": 233.0,
      "y1": 519.3
     },
     {
      "p": 169,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-liturgiam-baptismalem": {
   "titulo": "Ad Liturgiam Baptismalem",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Dominica Paschae in Resurrectione Domini",
    "Ad Vigiliam Paschalem in Nocte Sancta"
   ],
   "pagina": 189,
   "cantos": {
    "offertorium": [
     {
      "p": 190,
      "y0": 279.4,
      "y1": 519.3
     },
     {
      "p": 191,
      "y0": 0,
      "y1": 31.700000000000003
     }
    ],
    "communio": [
     {
      "p": 191,
      "y0": 23.700000000000003,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-die-p193": {
   "titulo": "Ad Missam in Die",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Dominica Paschae in Resurrectione Domini"
   ],
   "pagina": 193,
   "cantos": {
    "offertorium": [
     {
      "p": 195,
      "y0": 186.2,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-tertia-p199": {
   "titulo": "Feria Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Infra Octavam Paschae"
   ],
   "pagina": 199,
   "cantos": {
    "offertorium": [
     {
      "p": 198,
      "y0": 58.2,
      "y1": 519.3
     },
     {
      "p": 199,
      "y0": 0,
      "y1": 162.9
     }
    ],
    "graduale": [
     {
      "p": 199,
      "y0": 154.9,
      "y1": 519.3
     },
     {
      "p": 200,
      "y0": 0,
      "y1": 270.9
     }
    ]
   }
  },
  "feria-quarta-p202": {
   "titulo": "Feria Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Infra Octavam Paschae"
   ],
   "pagina": 202,
   "cantos": {
    "communio": [
     {
      "p": 201,
      "y0": 24.200000000000003,
      "y1": 314.5
     }
    ],
    "introitus": [
     {
      "p": 201,
      "y0": 306.5,
      "y1": 519.3
     },
     {
      "p": 202,
      "y0": 0,
      "y1": 162.2
     }
    ],
    "graduale": [
     {
      "p": 202,
      "y0": 154.2,
      "y1": 519.3
     },
     {
      "p": 203,
      "y0": 0,
      "y1": 159.4
     }
    ],
    "offertorium": [
     {
      "p": 203,
      "y0": 151.4,
      "y1": 446.5
     }
    ]
   }
  },
  "feria-quinta-p205": {
   "titulo": "Feria Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Infra Octavam Paschae"
   ],
   "pagina": 205,
   "cantos": {
    "introitus": [
     {
      "p": 204,
      "y0": 212.0,
      "y1": 519.3
     },
     {
      "p": 205,
      "y0": 0,
      "y1": 71.0
     }
    ],
    "graduale": [
     {
      "p": 205,
      "y0": 63.0,
      "y1": 519.3
     },
     {
      "p": 206,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-p208": {
   "titulo": "Feria Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Infra Octavam Paschae"
   ],
   "pagina": 208,
   "cantos": {
    "introitus": [
     {
      "p": 207,
      "y0": 203.7,
      "y1": 519.3
     },
     {
      "p": 208,
      "y0": 0,
      "y1": 34.3
     }
    ],
    "graduale": [
     {
      "p": 208,
      "y0": 26.299999999999997,
      "y1": 519.3
     },
     {
      "p": 209,
      "y0": 0,
      "y1": 25.3
     }
    ],
    "offertorium": [
     {
      "p": 209,
      "y0": 17.3,
      "y1": 379.0
     }
    ],
    "communio": [
     {
      "p": 209,
      "y0": 371.0,
      "y1": 519.3
     }
    ]
   }
  },
  "sabbato-p211": {
   "titulo": "Sabbato",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Infra Octavam Paschae"
   ],
   "pagina": 211,
   "cantos": {
    "offertorium": [
     {
      "p": 211,
      "y0": 436.5,
      "y1": 456.5
     }
    ],
    "communio": [
     {
      "p": 211,
      "y0": 448.5,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-secunda-paschae": {
   "titulo": "Hebdomada Secunda Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 213,
   "cantos": {
    "introitus": [
     {
      "p": 212,
      "y0": 29.4,
      "y1": 519.3
     },
     {
      "p": 213,
      "y0": 0,
      "y1": 393.0
     }
    ],
    "alleluia": [
     {
      "p": 213,
      "y0": 385.0,
      "y1": 519.3
     },
     {
      "p": 214,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-tertia-paschae": {
   "titulo": "Hebdomada Tertia Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 216,
   "cantos": {
    "introitus": [
     {
      "p": 215,
      "y0": 226.8,
      "y1": 519.3
     },
     {
      "p": 216,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 217,
      "y0": 0,
      "y1": 267.4
     }
    ],
    "offertorium": [
     {
      "p": 217,
      "y0": 259.4,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-quarta-paschae": {
   "titulo": "Hebdomada Quarta Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 219,
   "cantos": {
    "communio": [
     {
      "p": 218,
      "y0": 28.799999999999997,
      "y1": 394.3
     }
    ],
    "introitus": [
     {
      "p": 218,
      "y0": 386.3,
      "y1": 519.3
     },
     {
      "p": 219,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 220,
      "y0": 0,
      "y1": 168.1
     }
    ],
    "offertorium": [
     {
      "p": 220,
      "y0": 160.1,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-quinta-paschae": {
   "titulo": "Hebdomada Quinta Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 222,
   "cantos": {
    "introitus": [
     {
      "p": 221,
      "y0": 159.7,
      "y1": 519.3
     },
     {
      "p": 222,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 223,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 224,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-sexta-paschae": {
   "titulo": "Hebdomada Sexta Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 226,
   "cantos": {
    "introitus": [
     {
      "p": 225,
      "y0": 179.2,
      "y1": 519.3
     },
     {
      "p": 226,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 227,
      "y0": 0,
      "y1": 221.9
     }
    ],
    "offertorium": [
     {
      "p": 227,
      "y0": 213.9,
      "y1": 519.3
     },
     {
      "p": 228,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 229,
      "y0": 0,
      "y1": 58.599999999999994
     }
    ],
    "communio": [
     {
      "p": 229,
      "y0": 50.599999999999994,
      "y1": 519.3
     },
     {
      "p": 230,
      "y0": 0,
      "y1": 84.5
     }
    ]
   }
  },
  "in-ascensione-domini": {
   "titulo": "In Ascensione Domini",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 232,
   "cantos": {
    "offertorium": [
     {
      "p": 233,
      "y0": 31.4,
      "y1": 519.3
     },
     {
      "p": 234,
      "y0": 0,
      "y1": 215.0
     }
    ],
    "communio": [
     {
      "p": 234,
      "y0": 207.0,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-sexta-et-sabbato-post-ascensionem": {
   "titulo": "Feria Sexta et Sabbato post Ascensionem",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 236,
   "cantos": {
    "introitus": [
     {
      "p": 235,
      "y0": 65.4,
      "y1": 519.3
     },
     {
      "p": 236,
      "y0": 0,
      "y1": 200.2
     }
    ],
    "alleluia": [
     {
      "p": 236,
      "y0": 192.2,
      "y1": 227.3
     }
    ],
    "offertorium": [
     {
      "p": 236,
      "y0": 219.3,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-septima-paschae": {
   "titulo": "Hebdomada Septima Paschae",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 238,
   "cantos": {
    "communio": [
     {
      "p": 237,
      "y0": 83.0,
      "y1": 176.7
     }
    ],
    "introitus": [
     {
      "p": 237,
      "y0": 168.7,
      "y1": 519.3
     },
     {
      "p": 238,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-p238": {
   "titulo": "Dominica",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Hebdomada Septima Paschae"
   ],
   "pagina": 238,
   "cantos": {
    "communio": [
     {
      "p": 237,
      "y0": 83.0,
      "y1": 176.7
     }
    ],
    "introitus": [
     {
      "p": 237,
      "y0": 168.7,
      "y1": 519.3
     },
     {
      "p": 238,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "feriis-secunda-et-quinta": {
   "titulo": "Feriis Secunda et Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Hebdomada Septima Paschae"
   ],
   "pagina": 240,
   "cantos": {
    "alleluia": [
     {
      "p": 239,
      "y0": 12.8,
      "y1": 41.4
     }
    ],
    "offertorium": [
     {
      "p": 239,
      "y0": 33.4,
      "y1": 78.8
     }
    ],
    "communio": [
     {
      "p": 239,
      "y0": 70.8,
      "y1": 395.1
     }
    ],
    "introitus": [
     {
      "p": 239,
      "y0": 387.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feriis-tertia-et-sexta": {
   "titulo": "Feriis Tertia et Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Hebdomada Septima Paschae"
   ],
   "pagina": 241,
   "cantos": {
    "alleluia": [
     {
      "p": 240,
      "y0": 243.60000000000002,
      "y1": 262.3
     }
    ],
    "offertorium": [
     {
      "p": 240,
      "y0": 254.3,
      "y1": 274.3
     }
    ],
    "communio": [
     {
      "p": 240,
      "y0": 266.3,
      "y1": 336.0
     }
    ],
    "introitus": [
     {
      "p": 240,
      "y0": 328.0,
      "y1": 519.3
     },
     {
      "p": 241,
      "y0": 0,
      "y1": 404.6
     }
    ]
   }
  },
  "feria-quarta-et-sabbato-ad-missam-matutinam": {
   "titulo": "Feria Quarta, et Sabbato ad Missam Matutinam",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Hebdomada Septima Paschae"
   ],
   "pagina": 243,
   "cantos": {
    "communio": [
     {
      "p": 242,
      "y0": 160.8,
      "y1": 284.6
     }
    ],
    "introitus": [
     {
      "p": 242,
      "y0": 276.6,
      "y1": 519.3
     },
     {
      "p": 243,
      "y0": 0,
      "y1": 146.8
     }
    ],
    "alleluia": [
     {
      "p": 243,
      "y0": 138.8,
      "y1": 168.5
     }
    ],
    "offertorium": [
     {
      "p": 243,
      "y0": 160.5,
      "y1": 192.1
     }
    ]
   }
  },
  "dominica-pentecostes": {
   "titulo": "Dominica Pentecostes",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale"
   ],
   "pagina": 245,
   "cantos": {
    "introitus": [
     {
      "p": 244,
      "y0": 154.8,
      "y1": 519.3
     },
     {
      "p": 245,
      "y0": 0,
      "y1": 58.5
     }
    ],
    "offertorium": [
     {
      "p": 246,
      "y0": 443.7,
      "y1": 519.3
     },
     {
      "p": 247,
      "y0": 0,
      "y1": 205.2
     }
    ],
    "communio": [
     {
      "p": 247,
      "y0": 197.2,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-vigilia-p245": {
   "titulo": "Ad Missam in Vigilia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Dominica Pentecostes"
   ],
   "pagina": 245,
   "cantos": {
    "introitus": [
     {
      "p": 244,
      "y0": 154.8,
      "y1": 519.3
     },
     {
      "p": 245,
      "y0": 0,
      "y1": 58.5
     }
    ],
    "offertorium": [
     {
      "p": 246,
      "y0": 443.7,
      "y1": 519.3
     },
     {
      "p": 247,
      "y0": 0,
      "y1": 205.2
     }
    ],
    "communio": [
     {
      "p": 247,
      "y0": 197.2,
      "y1": 519.3
     }
    ]
   }
  },
  "ad-missam-in-die-p249": {
   "titulo": "Ad Missam in Die",
   "ruta": [
    "Proprium de Tempore",
    "Tempus Paschale",
    "Dominica Pentecostes"
   ],
   "pagina": 249,
   "cantos": {
    "offertorium": [
     {
      "p": 251,
      "y0": 240.1,
      "y1": 519.3
     },
     {
      "p": 252,
      "y0": 0,
      "y1": 41.7
     }
    ],
    "communio": [
     {
      "p": 252,
      "y0": 33.7,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-secunda": {
   "titulo": "Hebdomada Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 257,
   "cantos": {
    "introitus": [
     {
      "p": 256,
      "y0": 326.6,
      "y1": 519.3
     },
     {
      "p": 257,
      "y0": 0,
      "y1": 134.7
     }
    ],
    "graduale": [
     {
      "p": 257,
      "y0": 126.69999999999999,
      "y1": 519.3
     },
     {
      "p": 258,
      "y0": 0,
      "y1": 473.1
     }
    ],
    "offertorium": [
     {
      "p": 258,
      "y0": 465.1,
      "y1": 485.1
     }
    ],
    "communio": [
     {
      "p": 258,
      "y0": 477.1,
      "y1": 519.3
     },
     {
      "p": 259,
      "y0": 0,
      "y1": 63.7
     }
    ]
   }
  },
  "hebdomada-tertia": {
   "titulo": "Hebdomada Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 261,
   "cantos": {
    "introitus": [
     {
      "p": 260,
      "y0": 184.9,
      "y1": 519.3
     },
     {
      "p": 261,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 262,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 263,
      "y0": 0,
      "y1": 40.5
     }
    ],
    "offertorium": [
     {
      "p": 263,
      "y0": 32.5,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-quarta": {
   "titulo": "Hebdomada Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 265,
   "cantos": {
    "graduale": [
     {
      "p": 265,
      "y0": 190.8,
      "y1": 519.3
     },
     {
      "p": 266,
      "y0": 0,
      "y1": 343.6
     }
    ],
    "offertorium": [
     {
      "p": 266,
      "y0": 335.6,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-quinta": {
   "titulo": "Hebdomada Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 268,
   "cantos": {
    "introitus": [
     {
      "p": 267,
      "y0": 279.9,
      "y1": 519.3
     },
     {
      "p": 268,
      "y0": 0,
      "y1": 95.5
     }
    ],
    "graduale": [
     {
      "p": 268,
      "y0": 87.5,
      "y1": 519.3
     },
     {
      "p": 269,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 270,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-sexta": {
   "titulo": "Hebdomada Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 272,
   "cantos": {
    "introitus": [
     {
      "p": 271,
      "y0": 52.0,
      "y1": 389.7
     }
    ],
    "graduale": [
     {
      "p": 271,
      "y0": 381.7,
      "y1": 519.3
     },
     {
      "p": 272,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 273,
      "y0": 0,
      "y1": 185.9
     }
    ],
    "offertorium": [
     {
      "p": 273,
      "y0": 177.9,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-septima": {
   "titulo": "Hebdomada Septima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 275,
   "cantos": {
    "introitus": [
     {
      "p": 274,
      "y0": 278.3,
      "y1": 519.3
     },
     {
      "p": 275,
      "y0": 0,
      "y1": 140.7
     }
    ],
    "graduale": [
     {
      "p": 275,
      "y0": 132.7,
      "y1": 519.3
     },
     {
      "p": 276,
      "y0": 0,
      "y1": 300.5
     }
    ],
    "offertorium": [
     {
      "p": 276,
      "y0": 292.5,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-octava": {
   "titulo": "Hebdomada Octava",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 278,
   "cantos": {
    "introitus": [
     {
      "p": 277,
      "y0": 238.9,
      "y1": 519.3
     },
     {
      "p": 278,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 279,
      "y0": 0,
      "y1": 280.3
     }
    ],
    "offertorium": [
     {
      "p": 279,
      "y0": 272.3,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-nona": {
   "titulo": "Hebdomada Nona",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 281,
   "cantos": {
    "graduale": [
     {
      "p": 281,
      "y0": 85.9,
      "y1": 519.3
     },
     {
      "p": 282,
      "y0": 0,
      "y1": 391.3
     }
    ],
    "offertorium": [
     {
      "p": 282,
      "y0": 383.3,
      "y1": 519.3
     },
     {
      "p": 283,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima": {
   "titulo": "Hebdomada Decima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 285,
   "cantos": {
    "introitus": [
     {
      "p": 284,
      "y0": 58.7,
      "y1": 519.3
     },
     {
      "p": 285,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 286,
      "y0": 0,
      "y1": 206.8
     }
    ],
    "offertorium": [
     {
      "p": 286,
      "y0": 198.8,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-undecima": {
   "titulo": "Hebdomada Undecima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 288,
   "cantos": {
    "graduale": [
     {
      "p": 288,
      "y0": 30.799999999999997,
      "y1": 519.3
     },
     {
      "p": 289,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-undecima-p291": {
   "titulo": "Hebdomada Undecima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 291,
   "cantos": {
    "introitus": [
     {
      "p": 290,
      "y0": 370.8,
      "y1": 519.3
     },
     {
      "p": 291,
      "y0": 0,
      "y1": 295.4
     }
    ],
    "graduale": [
     {
      "p": 291,
      "y0": 287.4,
      "y1": 519.3
     },
     {
      "p": 292,
      "y0": 0,
      "y1": 482.3
     }
    ],
    "offertorium": [
     {
      "p": 292,
      "y0": 474.3,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-tertia": {
   "titulo": "Hebdomada Decima Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 294,
   "cantos": {
    "graduale": [
     {
      "p": 294,
      "y0": 32.8,
      "y1": 519.3
     },
     {
      "p": 295,
      "y0": 0,
      "y1": 225.8
     }
    ],
    "offertorium": [
     {
      "p": 295,
      "y0": 217.8,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-quarta": {
   "titulo": "Hebdomada Decima Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 297,
   "cantos": {
    "introitus": [
     {
      "p": 296,
      "y0": 274.5,
      "y1": 519.3
     },
     {
      "p": 297,
      "y0": 0,
      "y1": 146.2
     }
    ],
    "graduale": [
     {
      "p": 297,
      "y0": 138.2,
      "y1": 519.3
     },
     {
      "p": 298,
      "y0": 0,
      "y1": 334.8
     }
    ],
    "offertorium": [
     {
      "p": 298,
      "y0": 326.8,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-quinta": {
   "titulo": "Hebdomada Decima Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 300,
   "cantos": {
    "introitus": [
     {
      "p": 299,
      "y0": 337.1,
      "y1": 519.3
     },
     {
      "p": 300,
      "y0": 0,
      "y1": 332.9
     }
    ],
    "graduale": [
     {
      "p": 300,
      "y0": 324.9,
      "y1": 519.3
     },
     {
      "p": 301,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 302,
      "y0": 0,
      "y1": 241.4
     }
    ],
    "offertorium": [
     {
      "p": 302,
      "y0": 233.4,
      "y1": 273.3
     }
    ],
    "communio": [
     {
      "p": 302,
      "y0": 265.3,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-sexta": {
   "titulo": "Hebdomada Decima Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 304,
   "cantos": {
    "introitus": [
     {
      "p": 303,
      "y0": 165.6,
      "y1": 519.3
     },
     {
      "p": 304,
      "y0": 0,
      "y1": 39.6
     }
    ],
    "graduale": [
     {
      "p": 304,
      "y0": 31.6,
      "y1": 519.3
     },
     {
      "p": 305,
      "y0": 0,
      "y1": 167.8
     }
    ],
    "offertorium": [
     {
      "p": 305,
      "y0": 159.8,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-septima": {
   "titulo": "Hebdomada Decima Septima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 307,
   "cantos": {
    "introitus": [
     {
      "p": 306,
      "y0": 172.5,
      "y1": 519.3
     },
     {
      "p": 307,
      "y0": 0,
      "y1": 58.5
     }
    ],
    "graduale": [
     {
      "p": 307,
      "y0": 441.4,
      "y1": 519.3
     },
     {
      "p": 308,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 309,
      "y0": 0,
      "y1": 214.0
     }
    ],
    "offertorium": [
     {
      "p": 309,
      "y0": 206.0,
      "y1": 519.3
     },
     {
      "p": 310,
      "y0": 0,
      "y1": 37.2
     }
    ],
    "communio": [
     {
      "p": 310,
      "y0": 29.200000000000003,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-octava": {
   "titulo": "Hebdomada Decima Octava",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 312,
   "cantos": {
    "introitus": [
     {
      "p": 311,
      "y0": 204.4,
      "y1": 519.3
     },
     {
      "p": 312,
      "y0": 0,
      "y1": 39.5
     }
    ],
    "graduale": [
     {
      "p": 312,
      "y0": 31.5,
      "y1": 519.3
     },
     {
      "p": 313,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 314,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-decima-nona": {
   "titulo": "Hebdomada Decima Nona",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 316,
   "cantos": {
    "introitus": [
     {
      "p": 315,
      "y0": 385.8,
      "y1": 519.3
     },
     {
      "p": 316,
      "y0": 0,
      "y1": 281.6
     }
    ],
    "graduale": [
     {
      "p": 316,
      "y0": 273.6,
      "y1": 519.3
     },
     {
      "p": 317,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 318,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima": {
   "titulo": "Hebdomada Vigesima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 320,
   "cantos": {
    "introitus": [
     {
      "p": 319,
      "y0": 126.30000000000001,
      "y1": 519.3
     },
     {
      "p": 320,
      "y0": 0,
      "y1": 25.9
     }
    ],
    "graduale": [
     {
      "p": 320,
      "y0": 17.9,
      "y1": 519.3
     },
     {
      "p": 321,
      "y0": 0,
      "y1": 172.3
     }
    ],
    "offertorium": [
     {
      "p": 321,
      "y0": 164.3,
      "y1": 451.6
     }
    ],
    "communio": [
     {
      "p": 321,
      "y0": 443.6,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-prima": {
   "titulo": "Hebdomada Vigesima Prima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 323,
   "cantos": {
    "introitus": [
     {
      "p": 322,
      "y0": 172.7,
      "y1": 519.3
     },
     {
      "p": 323,
      "y0": 0,
      "y1": 45.8
     }
    ],
    "graduale": [
     {
      "p": 323,
      "y0": 37.8,
      "y1": 519.3
     },
     {
      "p": 324,
      "y0": 0,
      "y1": 331.0
     }
    ],
    "offertorium": [
     {
      "p": 324,
      "y0": 323.0,
      "y1": 519.3
     },
     {
      "p": 325,
      "y0": 0,
      "y1": 142.9
     }
    ],
    "communio": [
     {
      "p": 325,
      "y0": 134.9,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-secunda": {
   "titulo": "Hebdomada Vigesima Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 327,
   "cantos": {
    "introitus": [
     {
      "p": 326,
      "y0": 62.099999999999994,
      "y1": 383.4
     }
    ],
    "graduale": [
     {
      "p": 326,
      "y0": 375.4,
      "y1": 519.3
     },
     {
      "p": 327,
      "y0": 0,
      "y1": 269.0
     }
    ],
    "offertorium": [
     {
      "p": 327,
      "y0": 261.0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-tertia": {
   "titulo": "Hebdomada Vigesima Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 329,
   "cantos": {
    "introitus": [
     {
      "p": 328,
      "y0": 334.2,
      "y1": 519.3
     },
     {
      "p": 329,
      "y0": 0,
      "y1": 86.6
     }
    ],
    "graduale": [
     {
      "p": 329,
      "y0": 78.6,
      "y1": 519.3
     },
     {
      "p": 330,
      "y0": 0,
      "y1": 291.7
     }
    ],
    "offertorium": [
     {
      "p": 330,
      "y0": 283.7,
      "y1": 519.3
     },
     {
      "p": 331,
      "y0": 0,
      "y1": 194.4
     }
    ],
    "communio": [
     {
      "p": 331,
      "y0": 186.4,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-quarta": {
   "titulo": "Hebdomada Vigesima Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 333,
   "cantos": {
    "introitus": [
     {
      "p": 332,
      "y0": 55.7,
      "y1": 341.0
     }
    ],
    "graduale": [
     {
      "p": 332,
      "y0": 333.0,
      "y1": 519.3
     },
     {
      "p": 333,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 334,
      "y0": 0,
      "y1": 395.9
     }
    ],
    "communio": [
     {
      "p": 334,
      "y0": 387.9,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-quinta": {
   "titulo": "Hebdomada Vigesima Quinta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 336,
   "cantos": {
    "introitus": [
     {
      "p": 335,
      "y0": 194.8,
      "y1": 519.3
     },
     {
      "p": 336,
      "y0": 0,
      "y1": 11.0
     }
    ],
    "graduale": [
     {
      "p": 336,
      "y0": 3.0,
      "y1": 519.3
     },
     {
      "p": 337,
      "y0": 0,
      "y1": 184.1
     }
    ],
    "offertorium": [
     {
      "p": 337,
      "y0": 176.1,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-sexta": {
   "titulo": "Hebdomada Vigesima Sexta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 339,
   "cantos": {
    "introitus": [
     {
      "p": 338,
      "y0": 272.1,
      "y1": 519.3
     },
     {
      "p": 339,
      "y0": 0,
      "y1": 234.5
     }
    ],
    "graduale": [
     {
      "p": 339,
      "y0": 226.5,
      "y1": 519.3
     },
     {
      "p": 340,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 341,
      "y0": 0,
      "y1": 395.0
     }
    ],
    "offertorium": [
     {
      "p": 341,
      "y0": 387.0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-septima": {
   "titulo": "Hebdomada Vigesima Septima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 343,
   "cantos": {
    "communio": [
     {
      "p": 342,
      "y0": 126.1,
      "y1": 355.4
     }
    ],
    "introitus": [
     {
      "p": 342,
      "y0": 347.4,
      "y1": 519.3
     },
     {
      "p": 343,
      "y0": 0,
      "y1": 344.8
     }
    ],
    "graduale": [
     {
      "p": 343,
      "y0": 336.8,
      "y1": 519.3
     },
     {
      "p": 344,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 345,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-octava": {
   "titulo": "Hebdomada Vigesima Octava",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 347,
   "cantos": {
    "communio": [
     {
      "p": 346,
      "y0": 89.6,
      "y1": 442.0
     }
    ],
    "introitus": [
     {
      "p": 346,
      "y0": 434.0,
      "y1": 519.3
     },
     {
      "p": 347,
      "y0": 0,
      "y1": 278.3
     }
    ],
    "graduale": [
     {
      "p": 347,
      "y0": 270.3,
      "y1": 519.3
     },
     {
      "p": 348,
      "y0": 0,
      "y1": 449.1
     }
    ],
    "offertorium": [
     {
      "p": 348,
      "y0": 441.1,
      "y1": 519.3
     },
     {
      "p": 349,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-vigesima-nona": {
   "titulo": "Hebdomada Vigesima Nona",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 351,
   "cantos": {
    "introitus": [
     {
      "p": 350,
      "y0": 72.3,
      "y1": 446.9
     }
    ],
    "graduale": [
     {
      "p": 350,
      "y0": 438.9,
      "y1": 519.3
     },
     {
      "p": 351,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 352,
      "y0": 0,
      "y1": 296.7
     }
    ],
    "offertorium": [
     {
      "p": 352,
      "y0": 288.7,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-trigesima": {
   "titulo": "Hebdomada Trigesima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 354,
   "cantos": {
    "introitus": [
     {
      "p": 353,
      "y0": 276.8,
      "y1": 519.3
     },
     {
      "p": 354,
      "y0": 0,
      "y1": 95.9
     }
    ],
    "graduale": [
     {
      "p": 354,
      "y0": 87.9,
      "y1": 519.3
     },
     {
      "p": 355,
      "y0": 0,
      "y1": 155.5
     }
    ],
    "offertorium": [
     {
      "p": 355,
      "y0": 147.5,
      "y1": 319.9
     }
    ],
    "communio": [
     {
      "p": 355,
      "y0": 311.9,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-trigesima-prima": {
   "titulo": "Hebdomada Trigesima Prima",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 357,
   "cantos": {
    "introitus": [
     {
      "p": 356,
      "y0": 65.7,
      "y1": 357.5
     }
    ],
    "graduale": [
     {
      "p": 356,
      "y0": 349.5,
      "y1": 519.3
     },
     {
      "p": 357,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 358,
      "y0": 0,
      "y1": 101.1
     }
    ],
    "offertorium": [
     {
      "p": 358,
      "y0": 93.1,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-trigesima-secunda": {
   "titulo": "Hebdomada Trigesima Secunda",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 360,
   "cantos": {
    "introitus": [
     {
      "p": 359,
      "y0": 166.0,
      "y1": 390.0
     }
    ],
    "graduale": [
     {
      "p": 359,
      "y0": 382.0,
      "y1": 519.3
     },
     {
      "p": 360,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 361,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-trigesima-tertia": {
   "titulo": "Hebdomada Trigesima Tertia",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 363,
   "cantos": {
    "introitus": [
     {
      "p": 362,
      "y0": 61.599999999999994,
      "y1": 519.3
     },
     {
      "p": 363,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 364,
      "y0": 0,
      "y1": 148.1
     }
    ],
    "offertorium": [
     {
      "p": 364,
      "y0": 140.1,
      "y1": 376.1
     }
    ],
    "communio": [
     {
      "p": 364,
      "y0": 368.1,
      "y1": 519.3
     }
    ]
   }
  },
  "hebdomada-trigesima-quarta": {
   "titulo": "Hebdomada Trigesima Quarta",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 366,
   "cantos": {
    "introitus": [
     {
      "p": 365,
      "y0": 148.7,
      "y1": 421.8
     }
    ],
    "graduale": [
     {
      "p": 365,
      "y0": 413.8,
      "y1": 421.8
     }
    ],
    "alleluia": [
     {
      "p": 365,
      "y0": 413.8,
      "y1": 438.9
     }
    ],
    "offertorium": [
     {
      "p": 365,
      "y0": 430.9,
      "y1": 519.3
     },
     {
      "p": 366,
      "y0": 0,
      "y1": 161.0
     }
    ],
    "communio": [
     {
      "p": 366,
      "y0": 153.0,
      "y1": 519.3
     }
    ]
   }
  },
  "sollemnitates-domini-tempore-per-annum-occurrentes": {
   "titulo": "Sollemnitates Domini Tempore per Annum Occurrentes",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum"
   ],
   "pagina": 368,
   "cantos": {
    "graduale": [
     {
      "p": 368,
      "y0": 28.9,
      "y1": 519.3
     },
     {
      "p": 369,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 370,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 371,
      "y0": 0,
      "y1": 399.2
     }
    ],
    "offertorium": [
     {
      "p": 371,
      "y0": 391.2,
      "y1": 519.3
     },
     {
      "p": 372,
      "y0": 0,
      "y1": 220.5
     }
    ],
    "communio": [
     {
      "p": 372,
      "y0": 212.5,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-i-post-pentecosten-sanctissimae-trinitatis": {
   "titulo": "Dominica I post Pentecosten — Sanctissimae Trinitatis",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum",
    "Sollemnitates Domini Tempore per Annum Occurrentes"
   ],
   "pagina": 368,
   "cantos": {
    "graduale": [
     {
      "p": 368,
      "y0": 28.9,
      "y1": 519.3
     },
     {
      "p": 369,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 370,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 371,
      "y0": 0,
      "y1": 399.2
     }
    ],
    "offertorium": [
     {
      "p": 371,
      "y0": 391.2,
      "y1": 519.3
     },
     {
      "p": 372,
      "y0": 0,
      "y1": 220.5
     }
    ],
    "communio": [
     {
      "p": 372,
      "y0": 212.5,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-v-post-dom-ss-mae-trinitatis-ss-mi-corporis-et-sanguinis-christi": {
   "titulo": "Feria V post dom. Ss.mae Trinitatis — Ss.mi Corporis et Sanguinis Christi",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum",
    "Sollemnitates Domini Tempore per Annum Occurrentes"
   ],
   "pagina": 374,
   "cantos": {
    "graduale": [
     {
      "p": 374,
      "y0": 134.6,
      "y1": 519.3
     },
     {
      "p": 375,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 376,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 377,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 378,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 379,
      "y0": 0,
      "y1": 145.3
     }
    ],
    "offertorium": [
     {
      "p": 379,
      "y0": 137.3,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-vi-post-dom-ii-post-pentecosten-sacratissimi-cordis-iesu": {
   "titulo": "Feria VI post dom. II post Pentecosten — Sacratissimi Cordis Iesu",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum",
    "Sollemnitates Domini Tempore per Annum Occurrentes"
   ],
   "pagina": 381,
   "cantos": {
    "communio": [
     {
      "p": 383,
      "y0": 178.4,
      "y1": 519.3
     }
    ]
   }
  },
  "dominica-ultima-per-annum-d-n-iesu-christi-universorum-regis": {
   "titulo": "Dominica ultima per Annum — D. N. Iesu Christi Universorum Regis",
   "ruta": [
    "Proprium de Tempore",
    "Tempus per annum",
    "Sollemnitates Domini Tempore per Annum Occurrentes"
   ],
   "pagina": 385,
   "cantos": {
    "graduale": [
     {
      "p": 385,
      "y0": 33.0,
      "y1": 519.3
     },
     {
      "p": 386,
      "y0": 0,
      "y1": 281.1
     }
    ],
    "offertorium": [
     {
      "p": 386,
      "y0": 273.1,
      "y1": 519.3
     }
    ]
   }
  },
  "antiphonae-eucharisticae-pro-communione-ad-libitum-adhibendae": {
   "titulo": "Antiphonae Eucharisticae pro Communione ad Libitum Adhibendae",
   "ruta": [
    "Proprium de Tempore"
   ],
   "pagina": 388,
   "cantos": {
    "communio": [
     {
      "p": 387,
      "y0": 32.9,
      "y1": 519.3
     }
    ]
   }
  },
  "commune-dedicationis-ecclesiae": {
   "titulo": "Commune Dedicationis Ecclesiae",
   "ruta": [
    "Communia"
   ],
   "pagina": 392,
   "cantos": {
    "introitus": [
     {
      "p": 391,
      "y0": 109.5,
      "y1": 446.7
     }
    ],
    "graduale": [
     {
      "p": 391,
      "y0": 438.7,
      "y1": 519.3
     }
    ]
   }
  },
  "in-ipsa-ecclesia-dedicata": {
   "titulo": "In ipsa ecclesia dedicata",
   "ruta": [
    "Communia",
    "Commune Dedicationis Ecclesiae"
   ],
   "pagina": 392,
   "cantos": {
    "introitus": [
     {
      "p": 391,
      "y0": 109.5,
      "y1": 446.7
     }
    ],
    "graduale": [
     {
      "p": 391,
      "y0": 438.7,
      "y1": 519.3
     }
    ]
   }
  },
  "in-aliis-ecclesiis": {
   "titulo": "In aliis ecclesiis",
   "ruta": [
    "Communia",
    "Commune Dedicationis Ecclesiae"
   ],
   "pagina": 393,
   "cantos": {
    "introitus": [
     {
      "p": 396,
      "y0": 436.9,
      "y1": 469.0
     }
    ],
    "offertorium": [
     {
      "p": 396,
      "y0": 461.0,
      "y1": 480.9
     }
    ],
    "communio": [
     {
      "p": 396,
      "y0": 472.9,
      "y1": 519.3
     }
    ]
   }
  },
  "commune-apostolorum-vel-martyrum-tempore-paschali": {
   "titulo": "Commune Apostolorum vel Martyrum — Tempore paschali",
   "ruta": [
    "Communia"
   ],
   "pagina": 434,
   "cantos": {
    "communio": [
     {
      "p": 433,
      "y0": 132.0,
      "y1": 519.3
     },
     {
      "p": 434,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 435,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "pro-apostolis": {
   "titulo": "Pro Apostolis",
   "ruta": [
    "Communia",
    "Commune Apostolorum vel Martyrum — Tempore paschali"
   ],
   "pagina": 434,
   "cantos": {
    "communio": [
     {
      "p": 433,
      "y0": 132.0,
      "y1": 519.3
     },
     {
      "p": 434,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 435,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "pro-pluribus-apostolis-vel-martyribus": {
   "titulo": "Pro pluribus Apostolis vel martyribus",
   "ruta": [
    "Communia",
    "Commune Apostolorum vel Martyrum — Tempore paschali"
   ],
   "pagina": 434,
   "cantos": {
    "communio": [
     {
      "p": 433,
      "y0": 132.0,
      "y1": 519.3
     },
     {
      "p": 434,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 435,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "pro-uno-apostolo-vel-martyre": {
   "titulo": "Pro uno Apostolo vel martyre",
   "ruta": [
    "Communia",
    "Commune Apostolorum vel Martyrum — Tempore paschali"
   ],
   "pagina": 437,
   "cantos": {
    "introitus": [
     {
      "p": 436,
      "y0": 381.8,
      "y1": 519.3
     },
     {
      "p": 437,
      "y0": 0,
      "y1": 256.3
     }
    ]
   }
  },
  "commune-martyrum-extra-tempus-paschale": {
   "titulo": "Commune Martyrum — Extra tempus paschale",
   "ruta": [
    "Communia"
   ],
   "pagina": 440,
   "cantos": {
    "introitus": [
     {
      "p": 439,
      "y0": 102.3,
      "y1": 519.3
     },
     {
      "p": 440,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "pro-papis-vel-episcopis": {
   "titulo": "Pro papis vel episcopis",
   "ruta": [
    "Communia",
    "Commune Martyrum — Extra tempus paschale"
   ],
   "pagina": 440,
   "cantos": {
    "introitus": [
     {
      "p": 439,
      "y0": 102.3,
      "y1": 519.3
     },
     {
      "p": 440,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "pro-presbyteris": {
   "titulo": "Pro presbyteris",
   "ruta": [
    "Communia",
    "Commune Martyrum — Extra tempus paschale"
   ],
   "pagina": 442,
   "cantos": {
    "offertorium": [
     {
      "p": 441,
      "y0": 136.4,
      "y1": 519.3
     },
     {
      "p": 442,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 443,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "commune-doctorum-ecclesiae": {
   "titulo": "Commune Doctorum Ecclesiae",
   "ruta": [
    "Communia"
   ],
   "pagina": 488,
   "cantos": {
    "tractus": [
     {
      "p": 490,
      "y0": 474.0,
      "y1": 519.3
     },
     {
      "p": 491,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  },
  "ianuarius": {
   "titulo": "Ianuarius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 527,
   "cantos": {
    "introitus": [
     {
      "p": 526,
      "y0": 100.2,
      "y1": 120.1
     }
    ],
    "graduale": [
     {
      "p": 526,
      "y0": 112.1,
      "y1": 132.2
     }
    ],
    "alleluia": [
     {
      "p": 526,
      "y0": 124.19999999999999,
      "y1": 144.3
     }
    ],
    "offertorium": [
     {
      "p": 526,
      "y0": 136.3,
      "y1": 156.3
     }
    ],
    "communio": [
     {
      "p": 526,
      "y0": 148.3,
      "y1": 519.3
     },
     {
      "p": 527,
      "y0": 0,
      "y1": 76.6
     }
    ]
   }
  },
  "februarius": {
   "titulo": "Februarius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 533,
   "cantos": {
    "introitus": [
     {
      "p": 537,
      "y0": 70.8,
      "y1": 112.6
     }
    ],
    "graduale": [
     {
      "p": 537,
      "y0": 104.6,
      "y1": 427.2
     }
    ],
    "offertorium": [
     {
      "p": 537,
      "y0": 419.2,
      "y1": 450.3
     }
    ],
    "communio": [
     {
      "p": 537,
      "y0": 442.3,
      "y1": 519.3
     },
     {
      "p": 538,
      "y0": 0,
      "y1": 211.9
     }
    ],
    "alleluia": [
     {
      "p": 538,
      "y0": 228.0,
      "y1": 248.0
     }
    ]
   }
  },
  "martius": {
   "titulo": "Martius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 545,
   "cantos": {
    "introitus": [
     {
      "p": 544,
      "y0": 105.3,
      "y1": 125.4
     }
    ],
    "graduale": [
     {
      "p": 544,
      "y0": 117.4,
      "y1": 137.5
     }
    ],
    "alleluia": [
     {
      "p": 544,
      "y0": 129.5,
      "y1": 149.6
     }
    ],
    "offertorium": [
     {
      "p": 544,
      "y0": 141.6,
      "y1": 161.6
     }
    ],
    "communio": [
     {
      "p": 544,
      "y0": 153.6,
      "y1": 519.3
     },
     {
      "p": 545,
      "y0": 0,
      "y1": 85.1
     }
    ],
    "tractus": [
     {
      "p": 545,
      "y0": 340.9,
      "y1": 519.3
     },
     {
      "p": 546,
      "y0": 0,
      "y1": 179.1
     }
    ]
   }
  },
  "aprilis": {
   "titulo": "Aprilis",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 548,
   "cantos": {
    "introitus": [
     {
      "p": 547,
      "y0": 107.8,
      "y1": 128.4
     }
    ],
    "graduale": [
     {
      "p": 547,
      "y0": 120.4,
      "y1": 159.8
     }
    ],
    "alleluia": [
     {
      "p": 547,
      "y0": 151.8,
      "y1": 178.0
     }
    ],
    "offertorium": [
     {
      "p": 547,
      "y0": 170.0,
      "y1": 190.0
     }
    ],
    "communio": [
     {
      "p": 547,
      "y0": 182.0,
      "y1": 519.3
     },
     {
      "p": 548,
      "y0": 0,
      "y1": 174.1
     }
    ]
   }
  },
  "maius": {
   "titulo": "Maius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 552,
   "cantos": {
    "introitus": [
     {
      "p": 551,
      "y0": 88.4,
      "y1": 519.3
     },
     {
      "p": 552,
      "y0": 0,
      "y1": 235.3
     }
    ],
    "offertorium": [
     {
      "p": 552,
      "y0": 227.3,
      "y1": 247.5
     }
    ],
    "communio": [
     {
      "p": 552,
      "y0": 239.5,
      "y1": 303.5
     }
    ],
    "alleluia": [
     {
      "p": 552,
      "y0": 322.7,
      "y1": 519.3
     },
     {
      "p": 553,
      "y0": 0,
      "y1": 408.9
     }
    ],
    "graduale": [
     {
      "p": 554,
      "y0": 365.6,
      "y1": 519.3
     },
     {
      "p": 555,
      "y0": 0,
      "y1": 32.3
     }
    ]
   }
  },
  "iunius": {
   "titulo": "Iunius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 559,
   "cantos": {
    "introitus": [
     {
      "p": 558,
      "y0": 87.0,
      "y1": 107.0
     }
    ],
    "graduale": [
     {
      "p": 558,
      "y0": 99.0,
      "y1": 119.2
     }
    ],
    "alleluia": [
     {
      "p": 558,
      "y0": 111.2,
      "y1": 131.3
     }
    ],
    "offertorium": [
     {
      "p": 558,
      "y0": 123.30000000000001,
      "y1": 143.2
     }
    ],
    "communio": [
     {
      "p": 558,
      "y0": 135.2,
      "y1": 519.3
     },
     {
      "p": 559,
      "y0": 0,
      "y1": 66.9
     }
    ]
   }
  },
  "iulius": {
   "titulo": "Iulius",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 572,
   "cantos": {
    "introitus": [
     {
      "p": 571,
      "y0": 81.1,
      "y1": 101.3
     }
    ],
    "graduale": [
     {
      "p": 571,
      "y0": 93.3,
      "y1": 113.4
     }
    ],
    "alleluia": [
     {
      "p": 571,
      "y0": 105.4,
      "y1": 125.5
     }
    ],
    "offertorium": [
     {
      "p": 571,
      "y0": 117.5,
      "y1": 137.5
     }
    ],
    "communio": [
     {
      "p": 571,
      "y0": 129.5,
      "y1": 519.3
     },
     {
      "p": 572,
      "y0": 0,
      "y1": 72.8
     }
    ]
   }
  },
  "augustus": {
   "titulo": "Augustus",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 578,
   "cantos": {
    "introitus": [
     {
      "p": 577,
      "y0": 112.0,
      "y1": 132.1
     }
    ],
    "graduale": [
     {
      "p": 577,
      "y0": 124.1,
      "y1": 144.2
     }
    ],
    "alleluia": [
     {
      "p": 577,
      "y0": 136.2,
      "y1": 156.3
     }
    ],
    "offertorium": [
     {
      "p": 577,
      "y0": 148.3,
      "y1": 168.2
     }
    ],
    "communio": [
     {
      "p": 577,
      "y0": 160.2,
      "y1": 519.3
     },
     {
      "p": 578,
      "y0": 0,
      "y1": 82.7
     }
    ]
   }
  },
  "september": {
   "titulo": "September",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 591,
   "cantos": {
    "introitus": [
     {
      "p": 590,
      "y0": 117.5,
      "y1": 137.6
     }
    ],
    "graduale": [
     {
      "p": 590,
      "y0": 129.6,
      "y1": 149.8
     }
    ],
    "alleluia": [
     {
      "p": 590,
      "y0": 141.8,
      "y1": 161.9
     }
    ],
    "offertorium": [
     {
      "p": 590,
      "y0": 153.9,
      "y1": 173.8
     }
    ],
    "communio": [
     {
      "p": 590,
      "y0": 165.8,
      "y1": 519.3
     },
     {
      "p": 591,
      "y0": 0,
      "y1": 196.7
     }
    ]
   }
  },
  "october": {
   "titulo": "October",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 606,
   "cantos": {
    "introitus": [
     {
      "p": 605,
      "y0": 103.4,
      "y1": 123.5
     }
    ],
    "graduale": [
     {
      "p": 605,
      "y0": 115.5,
      "y1": 135.6
     }
    ],
    "alleluia": [
     {
      "p": 605,
      "y0": 127.6,
      "y1": 147.8
     }
    ],
    "offertorium": [
     {
      "p": 605,
      "y0": 139.8,
      "y1": 159.8
     }
    ],
    "communio": [
     {
      "p": 605,
      "y0": 151.8,
      "y1": 519.3
     },
     {
      "p": 606,
      "y0": 0,
      "y1": 70.0
     }
    ]
   }
  },
  "november": {
   "titulo": "November",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 613,
   "cantos": {
    "graduale": [
     {
      "p": 612,
      "y0": 422.0,
      "y1": 519.3
     },
     {
      "p": 613,
      "y0": 0,
      "y1": 277.1
     }
    ],
    "offertorium": [
     {
      "p": 613,
      "y0": 269.1,
      "y1": 289.1
     }
    ],
    "communio": [
     {
      "p": 613,
      "y0": 281.1,
      "y1": 438.1
     }
    ],
    "introitus": [
     {
      "p": 613,
      "y0": 430.1,
      "y1": 450.0
     }
    ],
    "alleluia": [
     {
      "p": 613,
      "y0": 454.0,
      "y1": 519.3
     },
     {
      "p": 614,
      "y0": 0,
      "y1": 72.1
     }
    ]
   }
  },
  "december": {
   "titulo": "December",
   "ruta": [
    "Proprium de Sanctis"
   ],
   "pagina": 621,
   "cantos": {
    "introitus": [
     {
      "p": 620,
      "y0": 85.0,
      "y1": 104.8
     }
    ],
    "graduale": [
     {
      "p": 620,
      "y0": 96.8,
      "y1": 117.0
     }
    ],
    "alleluia": [
     {
      "p": 620,
      "y0": 109.0,
      "y1": 129.1
     }
    ],
    "offertorium": [
     {
      "p": 620,
      "y0": 121.1,
      "y1": 141.3
     }
    ],
    "communio": [
     {
      "p": 620,
      "y0": 133.3,
      "y1": 519.3
     },
     {
      "p": 621,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 622,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 623,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 624,
      "y0": 0,
      "y1": 45.2
     }
    ]
   }
  },
  "missae-rituales": {
   "titulo": "Missae Rituales",
   "ruta": [
    "Missae Rituales ad Diversa et Votivae"
   ],
   "pagina": 635,
   "cantos": {
    "introitus": [
     {
      "p": 634,
      "y0": 149.2,
      "y1": 169.2
     }
    ],
    "graduale": [
     {
      "p": 634,
      "y0": 161.2,
      "y1": 181.2
     }
    ],
    "alleluia": [
     {
      "p": 634,
      "y0": 173.2,
      "y1": 205.3
     }
    ],
    "offertorium": [
     {
      "p": 634,
      "y0": 197.3,
      "y1": 217.3
     }
    ],
    "communio": [
     {
      "p": 634,
      "y0": 209.3,
      "y1": 519.3
     },
     {
      "p": 635,
      "y0": 0,
      "y1": 66.2
     }
    ]
   }
  },
  "missae-ad-diversa": {
   "titulo": "Missae ad Diversa",
   "ruta": [
    "Missae Rituales ad Diversa et Votivae"
   ],
   "pagina": 642,
   "cantos": {
    "introitus": [
     {
      "p": 641,
      "y0": 117.9,
      "y1": 136.7
     }
    ],
    "graduale": [
     {
      "p": 641,
      "y0": 128.7,
      "y1": 149.9
     }
    ],
    "alleluia": [
     {
      "p": 641,
      "y0": 141.9,
      "y1": 162.1
     }
    ],
    "offertorium": [
     {
      "p": 641,
      "y0": 154.1,
      "y1": 174.0
     }
    ],
    "communio": [
     {
      "p": 641,
      "y0": 166.0,
      "y1": 519.3
     },
     {
      "p": 642,
      "y0": 0,
      "y1": 62.2
     }
    ]
   }
  },
  "missae-votivae": {
   "titulo": "Missae Votivae",
   "ruta": [
    "Missae Rituales ad Diversa et Votivae"
   ],
   "pagina": 650,
   "cantos": {
    "offertorium": [
     {
      "p": 649,
      "y0": 143.8,
      "y1": 209.9
     }
    ],
    "introitus": [
     {
      "p": 649,
      "y0": 201.9,
      "y1": 258.3
     }
    ],
    "graduale": [
     {
      "p": 649,
      "y0": 250.3,
      "y1": 270.1
     }
    ],
    "alleluia": [
     {
      "p": 649,
      "y0": 262.1,
      "y1": 282.4
     }
    ],
    "tractus": [
     {
      "p": 649,
      "y0": 274.4,
      "y1": 330.2
     }
    ],
    "communio": [
     {
      "p": 649,
      "y0": 322.2,
      "y1": 519.3
     },
     {
      "p": 650,
      "y0": 0,
      "y1": 55.2
     }
    ]
   }
  },
  "2-missa-in-exsequiis-parvuli-baptizati": {
   "titulo": "2. Missa in exsequiis parvuli baptizati",
   "ruta": [
    "Liturgia Defunctorum"
   ],
   "pagina": 668,
   "cantos": {
    "introitus": [
     {
      "p": 667,
      "y0": 50.400000000000006,
      "y1": 69.7
     }
    ],
    "alleluia": [
     {
      "p": 667,
      "y0": 61.7,
      "y1": 117.8
     }
    ],
    "offertorium": [
     {
      "p": 667,
      "y0": 109.8,
      "y1": 130.5
     }
    ],
    "communio": [
     {
      "p": 667,
      "y0": 122.5,
      "y1": 258.0
     }
    ],
    "graduale": [
     {
      "p": 667,
      "y0": 250.0,
      "y1": 519.3
     }
    ]
   }
  },
  "missae-propriae-ordinis-sancti-benedicti": {
   "titulo": "Missae Propriae Ordinis Sancti Benedicti",
   "ruta": [],
   "pagina": 846,
   "cantos": {
    "introitus": [
     {
      "p": 845,
      "y0": 262.1,
      "y1": 282.1
     }
    ],
    "graduale": [
     {
      "p": 845,
      "y0": 274.1,
      "y1": 294.1
     }
    ],
    "alleluia": [
     {
      "p": 845,
      "y0": 286.1,
      "y1": 306.3
     }
    ],
    "offertorium": [
     {
      "p": 845,
      "y0": 298.3,
      "y1": 318.1
     }
    ],
    "communio": [
     {
      "p": 845,
      "y0": 310.1,
      "y1": 519.3
     },
     {
      "p": 846,
      "y0": 0,
      "y1": 72.3
     }
    ]
   }
  },
  "ianuarius-p846": {
   "titulo": "Ianuarius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 846,
   "cantos": {
    "introitus": [
     {
      "p": 845,
      "y0": 262.1,
      "y1": 282.1
     }
    ],
    "graduale": [
     {
      "p": 845,
      "y0": 274.1,
      "y1": 294.1
     }
    ],
    "alleluia": [
     {
      "p": 845,
      "y0": 286.1,
      "y1": 306.3
     }
    ],
    "offertorium": [
     {
      "p": 845,
      "y0": 298.3,
      "y1": 318.1
     }
    ],
    "communio": [
     {
      "p": 845,
      "y0": 310.1,
      "y1": 519.3
     },
     {
      "p": 846,
      "y0": 0,
      "y1": 72.3
     }
    ]
   }
  },
  "februarius-p848": {
   "titulo": "Februarius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 848,
   "cantos": {
    "introitus": [
     {
      "p": 847,
      "y0": 106.1,
      "y1": 126.19999999999999
     }
    ],
    "graduale": [
     {
      "p": 847,
      "y0": 118.19999999999999,
      "y1": 138.2
     }
    ],
    "alleluia": [
     {
      "p": 847,
      "y0": 130.2,
      "y1": 150.4
     }
    ],
    "offertorium": [
     {
      "p": 847,
      "y0": 142.4,
      "y1": 162.4
     }
    ],
    "communio": [
     {
      "p": 847,
      "y0": 154.4,
      "y1": 519.3
     }
    ]
   }
  },
  "martius-p848": {
   "titulo": "Martius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 848,
   "cantos": {
    "introitus": [
     {
      "p": 847,
      "y0": 106.1,
      "y1": 126.19999999999999
     }
    ],
    "graduale": [
     {
      "p": 847,
      "y0": 118.19999999999999,
      "y1": 138.2
     }
    ],
    "alleluia": [
     {
      "p": 847,
      "y0": 130.2,
      "y1": 150.4
     }
    ],
    "offertorium": [
     {
      "p": 847,
      "y0": 142.4,
      "y1": 162.4
     }
    ],
    "communio": [
     {
      "p": 847,
      "y0": 154.4,
      "y1": 519.3
     }
    ]
   }
  },
  "aprilis-p849": {
   "titulo": "Aprilis",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 849,
   "cantos": {
    "graduale": [
     {
      "p": 848,
      "y0": 308.6,
      "y1": 328.8
     }
    ],
    "offertorium": [
     {
      "p": 848,
      "y0": 320.8,
      "y1": 340.7
     }
    ],
    "communio": [
     {
      "p": 848,
      "y0": 332.7,
      "y1": 443.9
     }
    ],
    "introitus": [
     {
      "p": 848,
      "y0": 435.9,
      "y1": 456.0
     }
    ],
    "alleluia": [
     {
      "p": 848,
      "y0": 448.0,
      "y1": 519.3
     }
    ]
   }
  },
  "maius-p850": {
   "titulo": "Maius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 850,
   "cantos": {
    "introitus": [
     {
      "p": 849,
      "y0": 63.5,
      "y1": 83.6
     }
    ],
    "alleluia": [
     {
      "p": 849,
      "y0": 75.6,
      "y1": 95.7
     }
    ],
    "offertorium": [
     {
      "p": 849,
      "y0": 87.7,
      "y1": 107.7
     }
    ],
    "communio": [
     {
      "p": 849,
      "y0": 99.7,
      "y1": 331.7
     }
    ],
    "graduale": [
     {
      "p": 849,
      "y0": 323.7,
      "y1": 519.3
     },
     {
      "p": 850,
      "y0": 0,
      "y1": 82.4
     }
    ]
   }
  },
  "iunius-p855": {
   "titulo": "Iunius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 855,
   "cantos": {
    "introitus": [
     {
      "p": 854,
      "y0": 107.8,
      "y1": 128.0
     }
    ],
    "graduale": [
     {
      "p": 854,
      "y0": 120.0,
      "y1": 140.0
     }
    ],
    "alleluia": [
     {
      "p": 854,
      "y0": 132.0,
      "y1": 152.2
     }
    ],
    "offertorium": [
     {
      "p": 854,
      "y0": 144.2,
      "y1": 164.2
     }
    ],
    "communio": [
     {
      "p": 854,
      "y0": 156.2,
      "y1": 519.3
     },
     {
      "p": 855,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 856,
      "y0": 0,
      "y1": 39.8
     }
    ]
   }
  },
  "iulius-p855": {
   "titulo": "Iulius",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 855,
   "cantos": {
    "introitus": [
     {
      "p": 854,
      "y0": 107.8,
      "y1": 128.0
     }
    ],
    "graduale": [
     {
      "p": 854,
      "y0": 120.0,
      "y1": 140.0
     }
    ],
    "alleluia": [
     {
      "p": 854,
      "y0": 132.0,
      "y1": 152.2
     }
    ],
    "offertorium": [
     {
      "p": 854,
      "y0": 144.2,
      "y1": 164.2
     }
    ],
    "communio": [
     {
      "p": 854,
      "y0": 156.2,
      "y1": 519.3
     },
     {
      "p": 855,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 856,
      "y0": 0,
      "y1": 39.8
     }
    ]
   }
  },
  "augustus-p860": {
   "titulo": "Augustus",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 860,
   "cantos": {
    "alleluia": [
     {
      "p": 859,
      "y0": 23.1,
      "y1": 42.8
     }
    ],
    "offertorium": [
     {
      "p": 859,
      "y0": 34.8,
      "y1": 54.8
     }
    ],
    "communio": [
     {
      "p": 859,
      "y0": 46.8,
      "y1": 140.6
     }
    ],
    "introitus": [
     {
      "p": 859,
      "y0": 132.6,
      "y1": 152.6
     }
    ],
    "graduale": [
     {
      "p": 859,
      "y0": 144.6,
      "y1": 519.3
     }
    ]
   }
  },
  "september-p861": {
   "titulo": "September",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 861,
   "cantos": {
    "introitus": [
     {
      "p": 860,
      "y0": 84.2,
      "y1": 104.2
     }
    ],
    "graduale": [
     {
      "p": 860,
      "y0": 96.2,
      "y1": 116.3
     }
    ],
    "alleluia": [
     {
      "p": 860,
      "y0": 108.3,
      "y1": 128.4
     }
    ],
    "offertorium": [
     {
      "p": 860,
      "y0": 120.4,
      "y1": 140.7
     }
    ],
    "communio": [
     {
      "p": 860,
      "y0": 132.7,
      "y1": 519.3
     }
    ]
   }
  },
  "october-p862": {
   "titulo": "October",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 862,
   "cantos": {
    "introitus": [
     {
      "p": 861,
      "y0": 84.7,
      "y1": 104.8
     }
    ],
    "graduale": [
     {
      "p": 861,
      "y0": 96.8,
      "y1": 116.8
     }
    ],
    "alleluia": [
     {
      "p": 861,
      "y0": 108.8,
      "y1": 128.9
     }
    ],
    "offertorium": [
     {
      "p": 861,
      "y0": 120.9,
      "y1": 141.1
     }
    ],
    "communio": [
     {
      "p": 861,
      "y0": 133.1,
      "y1": 519.3
     }
    ]
   }
  },
  "november-p862": {
   "titulo": "November",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 862,
   "cantos": {
    "introitus": [
     {
      "p": 861,
      "y0": 84.7,
      "y1": 104.8
     }
    ],
    "graduale": [
     {
      "p": 861,
      "y0": 96.8,
      "y1": 116.8
     }
    ],
    "alleluia": [
     {
      "p": 861,
      "y0": 108.8,
      "y1": 128.9
     }
    ],
    "offertorium": [
     {
      "p": 861,
      "y0": 120.9,
      "y1": 141.1
     }
    ],
    "communio": [
     {
      "p": 861,
      "y0": 133.1,
      "y1": 519.3
     }
    ]
   }
  },
  "december-p863": {
   "titulo": "December",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 863,
   "cantos": {
    "introitus": [
     {
      "p": 862,
      "y0": 58.599999999999994,
      "y1": 78.5
     }
    ],
    "graduale": [
     {
      "p": 862,
      "y0": 70.5,
      "y1": 90.7
     }
    ],
    "alleluia": [
     {
      "p": 862,
      "y0": 82.7,
      "y1": 102.0
     }
    ],
    "offertorium": [
     {
      "p": 862,
      "y0": 94.0,
      "y1": 114.1
     }
    ],
    "communio": [
     {
      "p": 862,
      "y0": 106.1,
      "y1": 519.3
     }
    ]
   }
  },
  "feria-v-hebdomadae-sanctae": {
   "titulo": "Feria V Hebdomadae Sanctae",
   "ruta": [
    "Missae Propriae Ordinis Sancti Benedicti"
   ],
   "pagina": 871,
   "cantos": {
    "offertorium": [
     {
      "p": 873,
      "y0": 235.9,
      "y1": 519.3
     },
     {
      "p": 874,
      "y0": 0,
      "y1": 519.3
     },
     {
      "p": 875,
      "y0": 0,
      "y1": 519.3
     }
    ]
   }
  }
 },
 "simplex": {
  "tempus-adventus": {
   "titulo": "Tempus Adventus",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore"
   ],
   "pagina": 66,
   "cantos": {
    "introitus": [
     {
      "p": 65,
      "y0": 104.7,
      "y1": 576.0
     },
     {
      "p": 66,
      "y0": 0,
      "y1": 179.7
     }
    ],
    "graduale": [
     {
      "p": 66,
      "y0": 171.7,
      "y1": 576.0
     },
     {
      "p": 67,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 68,
      "y0": 0,
      "y1": 56.9
     }
    ],
    "alleluia": [
     {
      "p": 68,
      "y0": 48.9,
      "y1": 442.5
     }
    ],
    "offertorium": [
     {
      "p": 68,
      "y0": 434.5,
      "y1": 576.0
     },
     {
      "p": 69,
      "y0": 0,
      "y1": 394.4
     }
    ],
    "communio": [
     {
      "p": 69,
      "y0": 386.4,
      "y1": 576.0
     },
     {
      "p": 70,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-i": {
   "titulo": "Missa I",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Adventus"
   ],
   "pagina": 66,
   "cantos": {
    "introitus": [
     {
      "p": 65,
      "y0": 104.7,
      "y1": 576.0
     },
     {
      "p": 66,
      "y0": 0,
      "y1": 179.7
     }
    ],
    "graduale": [
     {
      "p": 66,
      "y0": 171.7,
      "y1": 576.0
     },
     {
      "p": 67,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 68,
      "y0": 0,
      "y1": 56.9
     }
    ],
    "alleluia": [
     {
      "p": 68,
      "y0": 48.9,
      "y1": 442.5
     }
    ],
    "offertorium": [
     {
      "p": 68,
      "y0": 434.5,
      "y1": 576.0
     },
     {
      "p": 69,
      "y0": 0,
      "y1": 394.4
     }
    ],
    "communio": [
     {
      "p": 69,
      "y0": 386.4,
      "y1": 576.0
     },
     {
      "p": 70,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-ii": {
   "titulo": "Missa II",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Adventus"
   ],
   "pagina": 72,
   "cantos": {
    "introitus": [
     {
      "p": 71,
      "y0": 77.8,
      "y1": 576.0
     },
     {
      "p": 72,
      "y0": 0,
      "y1": 58.3
     }
    ],
    "graduale": [
     {
      "p": 72,
      "y0": 50.3,
      "y1": 576.0
     },
     {
      "p": 73,
      "y0": 0,
      "y1": 277.5
     }
    ],
    "alleluia": [
     {
      "p": 73,
      "y0": 269.5,
      "y1": 576.0
     },
     {
      "p": 74,
      "y0": 0,
      "y1": 121.8
     }
    ],
    "offertorium": [
     {
      "p": 74,
      "y0": 113.8,
      "y1": 576.0
     },
     {
      "p": 75,
      "y0": 0,
      "y1": 93.0
     }
    ],
    "communio": [
     {
      "p": 75,
      "y0": 85.0,
      "y1": 575.0
     }
    ]
   }
  },
  "tempus-nativitatis": {
   "titulo": "Tempus Nativitatis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore"
   ],
   "pagina": 77,
   "cantos": {
    "introitus": [
     {
      "p": 76,
      "y0": 114.4,
      "y1": 576.0
     },
     {
      "p": 77,
      "y0": 0,
      "y1": 66.0
     }
    ],
    "graduale": [
     {
      "p": 77,
      "y0": 58.0,
      "y1": 576.0
     },
     {
      "p": 78,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 79,
      "y0": 0,
      "y1": 152.6
     }
    ],
    "offertorium": [
     {
      "p": 79,
      "y0": 144.6,
      "y1": 576.0
     },
     {
      "p": 80,
      "y0": 0,
      "y1": 58.2
     }
    ],
    "communio": [
     {
      "p": 80,
      "y0": 50.2,
      "y1": 576.0
     },
     {
      "p": 81,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-nativitate-domini": {
   "titulo": "In Nativitate Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 77,
   "cantos": {
    "introitus": [
     {
      "p": 76,
      "y0": 114.4,
      "y1": 576.0
     },
     {
      "p": 77,
      "y0": 0,
      "y1": 66.0
     }
    ],
    "graduale": [
     {
      "p": 77,
      "y0": 58.0,
      "y1": 576.0
     },
     {
      "p": 78,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 79,
      "y0": 0,
      "y1": 152.6
     }
    ],
    "offertorium": [
     {
      "p": 79,
      "y0": 144.6,
      "y1": 576.0
     },
     {
      "p": 80,
      "y0": 0,
      "y1": 58.2
     }
    ],
    "communio": [
     {
      "p": 80,
      "y0": 50.2,
      "y1": 576.0
     },
     {
      "p": 81,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "s-familiae-iesu-mariae-et-ioseph": {
   "titulo": "S. Familiae Iesu, Mariae et Ioseph",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 83,
   "cantos": {
    "introitus": [
     {
      "p": 82,
      "y0": 105.7,
      "y1": 576.0
     },
     {
      "p": 83,
      "y0": 0,
      "y1": 58.5
     }
    ],
    "graduale": [
     {
      "p": 83,
      "y0": 50.5,
      "y1": 576.0
     },
     {
      "p": 84,
      "y0": 0,
      "y1": 260.7
     }
    ],
    "alleluia": [
     {
      "p": 84,
      "y0": 252.7,
      "y1": 576.0
     },
     {
      "p": 85,
      "y0": 0,
      "y1": 186.9
     }
    ],
    "offertorium": [
     {
      "p": 85,
      "y0": 178.9,
      "y1": 576.0
     },
     {
      "p": 86,
      "y0": 0,
      "y1": 110.1
     }
    ],
    "communio": [
     {
      "p": 86,
      "y0": 102.1,
      "y1": 576.0
     },
     {
      "p": 87,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-epiphania-domini": {
   "titulo": "In Epiphania Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Nativitatis"
   ],
   "pagina": 89,
   "cantos": {
    "introitus": [
     {
      "p": 88,
      "y0": 103.5,
      "y1": 576.0
     },
     {
      "p": 89,
      "y0": 0,
      "y1": 56.9
     }
    ],
    "graduale": [
     {
      "p": 89,
      "y0": 48.9,
      "y1": 576.0
     },
     {
      "p": 90,
      "y0": 0,
      "y1": 444.8
     }
    ],
    "alleluia": [
     {
      "p": 90,
      "y0": 436.8,
      "y1": 576.0
     },
     {
      "p": 91,
      "y0": 0,
      "y1": 336.9
     }
    ],
    "offertorium": [
     {
      "p": 91,
      "y0": 328.9,
      "y1": 576.0
     },
     {
      "p": 92,
      "y0": 0,
      "y1": 275.9
     }
    ],
    "communio": [
     {
      "p": 92,
      "y0": 267.9,
      "y1": 576.0
     },
     {
      "p": 93,
      "y0": 0,
      "y1": 423.5
     }
    ]
   }
  },
  "tempus-quadragesimae": {
   "titulo": "Tempus Quadragesimae",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore"
   ],
   "pagina": 95,
   "cantos": {
    "introitus": [
     {
      "p": 94,
      "y0": 134.9,
      "y1": 576.0
     },
     {
      "p": 95,
      "y0": 0,
      "y1": 404.6
     }
    ],
    "graduale": [
     {
      "p": 95,
      "y0": 396.6,
      "y1": 576.0
     },
     {
      "p": 96,
      "y0": 0,
      "y1": 352.5
     }
    ],
    "offertorium": [
     {
      "p": 100,
      "y0": 66.0,
      "y1": 412.4
     }
    ],
    "communio": [
     {
      "p": 100,
      "y0": 404.4,
      "y1": 576.0
     },
     {
      "p": 101,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "feria-iv-cinerum": {
   "titulo": "Feria IV cinerum",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 95,
   "cantos": {
    "introitus": [
     {
      "p": 94,
      "y0": 134.9,
      "y1": 576.0
     },
     {
      "p": 95,
      "y0": 0,
      "y1": 404.6
     }
    ],
    "graduale": [
     {
      "p": 95,
      "y0": 396.6,
      "y1": 576.0
     },
     {
      "p": 96,
      "y0": 0,
      "y1": 352.5
     }
    ],
    "offertorium": [
     {
      "p": 100,
      "y0": 66.0,
      "y1": 412.4
     }
    ],
    "communio": [
     {
      "p": 100,
      "y0": 404.4,
      "y1": 576.0
     },
     {
      "p": 101,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-i": {
   "titulo": "Dominica I",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 103,
   "cantos": {
    "introitus": [
     {
      "p": 102,
      "y0": 76.9,
      "y1": 576.0
     },
     {
      "p": 103,
      "y0": 0,
      "y1": 146.6
     }
    ],
    "graduale": [
     {
      "p": 103,
      "y0": 138.6,
      "y1": 576.0
     },
     {
      "p": 104,
      "y0": 0,
      "y1": 206.6
     }
    ],
    "alleluia": [
     {
      "p": 105,
      "y0": 49.5,
      "y1": 576.0
     },
     {
      "p": 106,
      "y0": 0,
      "y1": 162.8
     }
    ],
    "offertorium": [
     {
      "p": 106,
      "y0": 154.8,
      "y1": 576.0
     },
     {
      "p": 107,
      "y0": 0,
      "y1": 57.2
     }
    ],
    "communio": [
     {
      "p": 107,
      "y0": 49.2,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-ii-iii": {
   "titulo": "Dominica II & III",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 109,
   "cantos": {
    "introitus": [
     {
      "p": 108,
      "y0": 264.1,
      "y1": 576.0
     },
     {
      "p": 109,
      "y0": 0,
      "y1": 291.7
     }
    ],
    "graduale": [
     {
      "p": 109,
      "y0": 283.7,
      "y1": 576.0
     },
     {
      "p": 110,
      "y0": 0,
      "y1": 325.1
     }
    ],
    "alleluia": [
     {
      "p": 111,
      "y0": 195.0,
      "y1": 576.0
     },
     {
      "p": 112,
      "y0": 0,
      "y1": 255.10000000000002
     }
    ],
    "offertorium": [
     {
      "p": 112,
      "y0": 247.10000000000002,
      "y1": 576.0
     },
     {
      "p": 113,
      "y0": 0,
      "y1": 232.9
     }
    ],
    "communio": [
     {
      "p": 113,
      "y0": 224.9,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-iv": {
   "titulo": "Dominica IV",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 115,
   "cantos": {
    "introitus": [
     {
      "p": 114,
      "y0": 260.4,
      "y1": 576.0
     },
     {
      "p": 115,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 116,
      "y0": 0,
      "y1": 402.7
     }
    ],
    "graduale": [
     {
      "p": 116,
      "y0": 394.7,
      "y1": 576.0
     },
     {
      "p": 117,
      "y0": 0,
      "y1": 345.9
     }
    ],
    "alleluia": [
     {
      "p": 117,
      "y0": 337.9,
      "y1": 576.0
     },
     {
      "p": 118,
      "y0": 0,
      "y1": 418.5
     }
    ],
    "offertorium": [
     {
      "p": 118,
      "y0": 410.5,
      "y1": 576.0
     },
     {
      "p": 119,
      "y0": 0,
      "y1": 269.2
     }
    ],
    "communio": [
     {
      "p": 119,
      "y0": 261.2,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-v": {
   "titulo": "Dominica V",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Quadragesimae"
   ],
   "pagina": 121,
   "cantos": {
    "introitus": [
     {
      "p": 120,
      "y0": 314.0,
      "y1": 576.0
     },
     {
      "p": 121,
      "y0": 0,
      "y1": 398.2
     }
    ],
    "graduale": [
     {
      "p": 121,
      "y0": 390.2,
      "y1": 576.0
     },
     {
      "p": 122,
      "y0": 0,
      "y1": 454.6
     }
    ],
    "alleluia": [
     {
      "p": 123,
      "y0": 329.4,
      "y1": 576.0
     },
     {
      "p": 124,
      "y0": 0,
      "y1": 330.7
     }
    ],
    "offertorium": [
     {
      "p": 124,
      "y0": 322.7,
      "y1": 576.0
     },
     {
      "p": 125,
      "y0": 0,
      "y1": 264.3
     }
    ],
    "communio": [
     {
      "p": 125,
      "y0": 256.3,
      "y1": 576.0
     },
     {
      "p": 126,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "feria-v-missa-chrismatis": {
   "titulo": "Feria V Missa Chrismatis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Hebdomada Sancta"
   ],
   "pagina": 136,
   "cantos": {
    "introitus": [
     {
      "p": 135,
      "y0": 120.1,
      "y1": 576.0
     },
     {
      "p": 136,
      "y0": 0,
      "y1": 214.3
     }
    ],
    "graduale": [
     {
      "p": 136,
      "y0": 206.3,
      "y1": 576.0
     },
     {
      "p": 137,
      "y0": 0,
      "y1": 101.9
     }
    ],
    "communio": [
     {
      "p": 140,
      "y0": 50.400000000000006,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-in-cena-domini": {
   "titulo": "Missa in Cena Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Hebdomada Sancta"
   ],
   "pagina": 142,
   "cantos": {
    "introitus": [
     {
      "p": 141,
      "y0": 401.6,
      "y1": 576.0
     },
     {
      "p": 142,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 143,
      "y0": 0,
      "y1": 57.1
     }
    ],
    "graduale": [
     {
      "p": 143,
      "y0": 49.1,
      "y1": 576.0
     },
     {
      "p": 144,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 145,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 146,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 147,
      "y0": 0,
      "y1": 383.2
     }
    ],
    "communio": [
     {
      "p": 147,
      "y0": 375.2,
      "y1": 576.0
     },
     {
      "p": 148,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 149,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 150,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "feria-vi-in-passione-domini": {
   "titulo": "Feria VI in Passione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Hebdomada Sancta"
   ],
   "pagina": 152,
   "cantos": {
    "graduale": [
     {
      "p": 151,
      "y0": 115.30000000000001,
      "y1": 576.0
     },
     {
      "p": 152,
      "y0": 0,
      "y1": 216.6
     }
    ]
   }
  },
  "dominica-paschae-in-resurrectione-domini": {
   "titulo": "Dominica Paschae in Resurrectione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Hebdomada Sancta"
   ],
   "pagina": 156,
   "cantos": {
    "graduale": [
     {
      "p": 155,
      "y0": 177.0,
      "y1": 576.0
     },
     {
      "p": 156,
      "y0": 0,
      "y1": 197.5
     }
    ],
    "alleluia": [
     {
      "p": 159,
      "y0": 338.1,
      "y1": 576.0
     },
     {
      "p": 160,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 161,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 162,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 163,
      "y0": 0,
      "y1": 186.4
     }
    ],
    "offertorium": [
     {
      "p": 163,
      "y0": 178.4,
      "y1": 576.0
     },
     {
      "p": 164,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-resurrectionis": {
   "titulo": "Dominica Resurrectionis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Hebdomada Sancta"
   ],
   "pagina": 166,
   "cantos": {
    "graduale": [
     {
      "p": 167,
      "y0": 368.6,
      "y1": 576.0
     },
     {
      "p": 168,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 169,
      "y0": 0,
      "y1": 61.099999999999994
     }
    ],
    "alleluia": [
     {
      "p": 169,
      "y0": 53.099999999999994,
      "y1": 576.0
     },
     {
      "p": 170,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 171,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 172,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 173,
      "y0": 0,
      "y1": 331.8
     }
    ],
    "offertorium": [
     {
      "p": 173,
      "y0": 323.8,
      "y1": 576.0
     },
     {
      "p": 174,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 175,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 176,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "tempus-paschale": {
   "titulo": "Tempus Paschale",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore"
   ],
   "pagina": 178,
   "cantos": {
    "introitus": [
     {
      "p": 177,
      "y0": 93.4,
      "y1": 576.0
     },
     {
      "p": 178,
      "y0": 0,
      "y1": 269.2
     }
    ],
    "alleluia": [
     {
      "p": 178,
      "y0": 261.2,
      "y1": 576.0
     },
     {
      "p": 179,
      "y0": 0,
      "y1": 223.9
     }
    ],
    "offertorium": [
     {
      "p": 181,
      "y0": 49.3,
      "y1": 576.0
     },
     {
      "p": 182,
      "y0": 0,
      "y1": 58.2
     }
    ],
    "communio": [
     {
      "p": 182,
      "y0": 50.2,
      "y1": 576.0
     },
     {
      "p": 183,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-i-p178": {
   "titulo": "Missa I",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Paschale"
   ],
   "pagina": 178,
   "cantos": {
    "introitus": [
     {
      "p": 177,
      "y0": 93.4,
      "y1": 576.0
     },
     {
      "p": 178,
      "y0": 0,
      "y1": 269.2
     }
    ],
    "alleluia": [
     {
      "p": 178,
      "y0": 261.2,
      "y1": 576.0
     },
     {
      "p": 179,
      "y0": 0,
      "y1": 223.9
     }
    ],
    "offertorium": [
     {
      "p": 181,
      "y0": 49.3,
      "y1": 576.0
     },
     {
      "p": 182,
      "y0": 0,
      "y1": 58.2
     }
    ],
    "communio": [
     {
      "p": 182,
      "y0": 50.2,
      "y1": 576.0
     },
     {
      "p": 183,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-ii-p185": {
   "titulo": "Missa II",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Paschale"
   ],
   "pagina": 185,
   "cantos": {
    "introitus": [
     {
      "p": 184,
      "y0": 85.3,
      "y1": 576.0
     },
     {
      "p": 185,
      "y0": 0,
      "y1": 208.3
     }
    ],
    "alleluia": [
     {
      "p": 185,
      "y0": 200.3,
      "y1": 576.0
     },
     {
      "p": 186,
      "y0": 0,
      "y1": 125.69999999999999
     }
    ],
    "offertorium": [
     {
      "p": 187,
      "y0": 158.5,
      "y1": 576.0
     },
     {
      "p": 188,
      "y0": 0,
      "y1": 59.0
     }
    ],
    "communio": [
     {
      "p": 188,
      "y0": 51.0,
      "y1": 576.0
     },
     {
      "p": 189,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-ascensione-domini": {
   "titulo": "In Ascensione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Paschale"
   ],
   "pagina": 191,
   "cantos": {
    "introitus": [
     {
      "p": 190,
      "y0": 95.1,
      "y1": 576.0
     },
     {
      "p": 191,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 192,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 193,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 194,
      "y0": 0,
      "y1": 168.4
     }
    ],
    "alleluia": [
     {
      "p": 194,
      "y0": 160.4,
      "y1": 408.4
     }
    ],
    "offertorium": [
     {
      "p": 194,
      "y0": 400.4,
      "y1": 576.0
     },
     {
      "p": 195,
      "y0": 0,
      "y1": 307.1
     }
    ],
    "communio": [
     {
      "p": 195,
      "y0": 299.1,
      "y1": 576.0
     },
     {
      "p": 196,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "dominica-pentecostes": {
   "titulo": "Dominica Pentecostes",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus Paschale"
   ],
   "pagina": 198,
   "cantos": {
    "introitus": [
     {
      "p": 197,
      "y0": 95.1,
      "y1": 576.0
     },
     {
      "p": 198,
      "y0": 0,
      "y1": 181.8
     }
    ],
    "alleluia": [
     {
      "p": 198,
      "y0": 173.8,
      "y1": 576.0
     },
     {
      "p": 199,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 200,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 201,
      "y0": 0,
      "y1": 398.2
     }
    ],
    "offertorium": [
     {
      "p": 204,
      "y0": 227.3,
      "y1": 576.0
     },
     {
      "p": 205,
      "y0": 0,
      "y1": 278.5
     }
    ],
    "communio": [
     {
      "p": 205,
      "y0": 270.5,
      "y1": 576.0
     },
     {
      "p": 206,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "tempus-per-annum": {
   "titulo": "Tempus per annum",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore"
   ],
   "pagina": 208,
   "cantos": {
    "introitus": [
     {
      "p": 207,
      "y0": 104.6,
      "y1": 576.0
     },
     {
      "p": 208,
      "y0": 0,
      "y1": 180.1
     }
    ],
    "graduale": [
     {
      "p": 208,
      "y0": 172.1,
      "y1": 576.0
     },
     {
      "p": 209,
      "y0": 0,
      "y1": 455.8
     }
    ],
    "alleluia": [
     {
      "p": 209,
      "y0": 447.8,
      "y1": 576.0
     },
     {
      "p": 210,
      "y0": 0,
      "y1": 297.8
     }
    ],
    "offertorium": [
     {
      "p": 210,
      "y0": 289.8,
      "y1": 576.0
     },
     {
      "p": 211,
      "y0": 0,
      "y1": 306.0
     }
    ],
    "communio": [
     {
      "p": 211,
      "y0": 298.0,
      "y1": 576.0
     },
     {
      "p": 212,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "sanctissimae-trinitatis": {
   "titulo": "Sanctissimae Trinitatis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 208,
   "cantos": {
    "introitus": [
     {
      "p": 207,
      "y0": 104.6,
      "y1": 576.0
     },
     {
      "p": 208,
      "y0": 0,
      "y1": 180.1
     }
    ],
    "graduale": [
     {
      "p": 208,
      "y0": 172.1,
      "y1": 576.0
     },
     {
      "p": 209,
      "y0": 0,
      "y1": 455.8
     }
    ],
    "alleluia": [
     {
      "p": 209,
      "y0": 447.8,
      "y1": 576.0
     },
     {
      "p": 210,
      "y0": 0,
      "y1": 297.8
     }
    ],
    "offertorium": [
     {
      "p": 210,
      "y0": 289.8,
      "y1": 576.0
     },
     {
      "p": 211,
      "y0": 0,
      "y1": 306.0
     }
    ],
    "communio": [
     {
      "p": 211,
      "y0": 298.0,
      "y1": 576.0
     },
     {
      "p": 212,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "ss-mi-corporis-et-sanguinis-christi": {
   "titulo": "SS.mi Corporis et Sanguinis Christi",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 214,
   "cantos": {
    "introitus": [
     {
      "p": 213,
      "y0": 124.69999999999999,
      "y1": 576.0
     },
     {
      "p": 214,
      "y0": 0,
      "y1": 223.6
     }
    ],
    "graduale": [
     {
      "p": 214,
      "y0": 215.6,
      "y1": 576.0
     },
     {
      "p": 215,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 216,
      "y0": 0,
      "y1": 162.1
     }
    ],
    "alleluia": [
     {
      "p": 216,
      "y0": 154.1,
      "y1": 576.0
     },
     {
      "p": 217,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 218,
      "y0": 0,
      "y1": 271.7
     }
    ],
    "offertorium": [
     {
      "p": 218,
      "y0": 263.7,
      "y1": 576.0
     },
     {
      "p": 219,
      "y0": 0,
      "y1": 257.8
     }
    ],
    "communio": [
     {
      "p": 219,
      "y0": 249.8,
      "y1": 575.0
     },
     {
      "p": 220,
      "y0": 0,
      "y1": 575.0
     }
    ]
   }
  },
  "sacratissimi-cordis-iesu": {
   "titulo": "Sacratissimi Cordis Iesu",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 222,
   "cantos": {
    "introitus": [
     {
      "p": 221,
      "y0": 114.80000000000001,
      "y1": 576.0
     },
     {
      "p": 222,
      "y0": 0,
      "y1": 258.9
     }
    ],
    "graduale": [
     {
      "p": 222,
      "y0": 250.89999999999998,
      "y1": 575.0
     },
     {
      "p": 223,
      "y0": 0,
      "y1": 455.3
     }
    ],
    "alleluia": [
     {
      "p": 223,
      "y0": 447.3,
      "y1": 576.0
     },
     {
      "p": 224,
      "y0": 0,
      "y1": 402.9
     }
    ],
    "offertorium": [
     {
      "p": 224,
      "y0": 394.9,
      "y1": 576.0
     },
     {
      "p": 225,
      "y0": 0,
      "y1": 399.1
     }
    ],
    "communio": [
     {
      "p": 225,
      "y0": 391.1,
      "y1": 576.0
     },
     {
      "p": 226,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-i-p228": {
   "titulo": "Missa I",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 228,
   "cantos": {
    "introitus": [
     {
      "p": 227,
      "y0": 88.9,
      "y1": 576.0
     },
     {
      "p": 228,
      "y0": 0,
      "y1": 241.8
     }
    ],
    "graduale": [
     {
      "p": 228,
      "y0": 233.8,
      "y1": 576.0
     },
     {
      "p": 229,
      "y0": 0,
      "y1": 388.5
     }
    ],
    "alleluia": [
     {
      "p": 229,
      "y0": 380.5,
      "y1": 576.0
     },
     {
      "p": 230,
      "y0": 0,
      "y1": 573.1
     },
     {
      "p": 231,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-ii-p233": {
   "titulo": "Missa II",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 233,
   "cantos": {
    "introitus": [
     {
      "p": 232,
      "y0": 178.5,
      "y1": 575.0
     },
     {
      "p": 233,
      "y0": 0,
      "y1": 298.2
     }
    ],
    "graduale": [
     {
      "p": 233,
      "y0": 290.2,
      "y1": 576.0
     },
     {
      "p": 234,
      "y0": 0,
      "y1": 453.2
     }
    ],
    "alleluia": [
     {
      "p": 234,
      "y0": 445.2,
      "y1": 576.0
     },
     {
      "p": 235,
      "y0": 0,
      "y1": 446.9
     }
    ],
    "offertorium": [
     {
      "p": 235,
      "y0": 438.9,
      "y1": 576.0
     },
     {
      "p": 236,
      "y0": 0,
      "y1": 328.9
     }
    ],
    "communio": [
     {
      "p": 236,
      "y0": 320.9,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-iii": {
   "titulo": "Missa III",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 238,
   "cantos": {
    "introitus": [
     {
      "p": 237,
      "y0": 319.3,
      "y1": 576.0
     },
     {
      "p": 238,
      "y0": 0,
      "y1": 397.3
     }
    ],
    "graduale": [
     {
      "p": 238,
      "y0": 389.3,
      "y1": 576.0
     },
     {
      "p": 239,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 240,
      "y0": 0,
      "y1": 173.9
     }
    ],
    "alleluia": [
     {
      "p": 240,
      "y0": 165.9,
      "y1": 576.0
     },
     {
      "p": 241,
      "y0": 0,
      "y1": 451.6
     }
    ],
    "communio": [
     {
      "p": 241,
      "y0": 443.6,
      "y1": 576.0
     },
     {
      "p": 242,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-iv": {
   "titulo": "Missa IV",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 244,
   "cantos": {
    "introitus": [
     {
      "p": 243,
      "y0": 200.9,
      "y1": 576.0
     },
     {
      "p": 244,
      "y0": 0,
      "y1": 339.8
     }
    ],
    "graduale": [
     {
      "p": 244,
      "y0": 331.8,
      "y1": 576.0
     },
     {
      "p": 245,
      "y0": 0,
      "y1": 574.1
     },
     {
      "p": 246,
      "y0": 0,
      "y1": 111.0
     }
    ],
    "alleluia": [
     {
      "p": 246,
      "y0": 103.0,
      "y1": 576.0
     },
     {
      "p": 247,
      "y0": 0,
      "y1": 59.3
     }
    ],
    "offertorium": [
     {
      "p": 247,
      "y0": 51.3,
      "y1": 457.9
     }
    ],
    "communio": [
     {
      "p": 247,
      "y0": 449.9,
      "y1": 576.0
     },
     {
      "p": 248,
      "y0": 0,
      "y1": 575.0
     }
    ]
   }
  },
  "missa-v": {
   "titulo": "Missa V",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 250,
   "cantos": {
    "introitus": [
     {
      "p": 249,
      "y0": 91.6,
      "y1": 573.1
     },
     {
      "p": 250,
      "y0": 0,
      "y1": 170.6
     }
    ],
    "graduale": [
     {
      "p": 250,
      "y0": 162.6,
      "y1": 574.1
     },
     {
      "p": 251,
      "y0": 0,
      "y1": 401.3
     }
    ],
    "alleluia": [
     {
      "p": 251,
      "y0": 393.3,
      "y1": 576.0
     },
     {
      "p": 252,
      "y0": 0,
      "y1": 574.1
     },
     {
      "p": 253,
      "y0": 0,
      "y1": 58.3
     }
    ],
    "communio": [
     {
      "p": 253,
      "y0": 50.3,
      "y1": 575.0
     }
    ]
   }
  },
  "missa-vi": {
   "titulo": "Missa VI",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 255,
   "cantos": {
    "introitus": [
     {
      "p": 254,
      "y0": 84.3,
      "y1": 573.1
     },
     {
      "p": 255,
      "y0": 0,
      "y1": 164.8
     }
    ],
    "graduale": [
     {
      "p": 255,
      "y0": 156.8,
      "y1": 209.4
     }
    ],
    "offertorium": [
     {
      "p": 255,
      "y0": 201.4,
      "y1": 575.0
     },
     {
      "p": 256,
      "y0": 0,
      "y1": 143.0
     }
    ],
    "communio": [
     {
      "p": 256,
      "y0": 135.0,
      "y1": 574.1
     }
    ]
   }
  },
  "missa-vii": {
   "titulo": "Missa VII",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 258,
   "cantos": {
    "introitus": [
     {
      "p": 257,
      "y0": 198.1,
      "y1": 576.0
     },
     {
      "p": 258,
      "y0": 0,
      "y1": 105.2
     }
    ],
    "graduale": [
     {
      "p": 258,
      "y0": 97.2,
      "y1": 153.1
     }
    ],
    "offertorium": [
     {
      "p": 258,
      "y0": 145.1,
      "y1": 576.0
     },
     {
      "p": 259,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "missa-viii": {
   "titulo": "Missa VIII",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 261,
   "cantos": {
    "introitus": [
     {
      "p": 260,
      "y0": 226.6,
      "y1": 576.0
     },
     {
      "p": 261,
      "y0": 0,
      "y1": 187.1
     }
    ],
    "graduale": [
     {
      "p": 261,
      "y0": 179.1,
      "y1": 573.1
     },
     {
      "p": 262,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 263,
      "y0": 0,
      "y1": 58.0
     }
    ],
    "alleluia": [
     {
      "p": 263,
      "y0": 50.0,
      "y1": 574.1
     },
     {
      "p": 264,
      "y0": 0,
      "y1": 56.6
     }
    ],
    "offertorium": [
     {
      "p": 264,
      "y0": 48.6,
      "y1": 574.1
     }
    ]
   }
  },
  "domini-nostri-iesu-christi-universorum-regis": {
   "titulo": "Domini nostri Iesu Christi universorum Regis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium de tempore",
    "Tempus per annum"
   ],
   "pagina": 266,
   "cantos": {
    "introitus": [
     {
      "p": 265,
      "y0": 145.1,
      "y1": 576.0
     },
     {
      "p": 266,
      "y0": 0,
      "y1": 239.0
     }
    ],
    "graduale": [
     {
      "p": 266,
      "y0": 231.0,
      "y1": 275.3
     }
    ],
    "offertorium": [
     {
      "p": 266,
      "y0": 267.3,
      "y1": 575.0
     },
     {
      "p": 267,
      "y0": 0,
      "y1": 142.5
     }
    ],
    "communio": [
     {
      "p": 267,
      "y0": 134.5,
      "y1": 575.0
     },
     {
      "p": 268,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-praesentatione-domini": {
   "titulo": "In Praesentatione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 272,
   "cantos": {
    "introitus": [
     {
      "p": 273,
      "y0": 447.1,
      "y1": 576.0
     },
     {
      "p": 274,
      "y0": 0,
      "y1": 573.1
     },
     {
      "p": 275,
      "y0": 0,
      "y1": 197.8
     }
    ],
    "graduale": [
     {
      "p": 275,
      "y0": 189.8,
      "y1": 573.1
     },
     {
      "p": 276,
      "y0": 0,
      "y1": 59.7
     }
    ],
    "alleluia": [
     {
      "p": 276,
      "y0": 51.7,
      "y1": 396.9
     }
    ],
    "offertorium": [
     {
      "p": 276,
      "y0": 388.9,
      "y1": 576.0
     },
     {
      "p": 277,
      "y0": 0,
      "y1": 401.9
     }
    ],
    "communio": [
     {
      "p": 277,
      "y0": 393.9,
      "y1": 573.1
     },
     {
      "p": 278,
      "y0": 0,
      "y1": 573.1
     }
    ]
   }
  },
  "santi-ioseph-sponsi-b-mariae-virginis": {
   "titulo": "Santi Ioseph sponsi B. Mariae Virginis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 280,
   "cantos": {
    "introitus": [
     {
      "p": 279,
      "y0": 121.80000000000001,
      "y1": 574.1
     },
     {
      "p": 280,
      "y0": 0,
      "y1": 220.0
     }
    ],
    "graduale": [
     {
      "p": 280,
      "y0": 212.0,
      "y1": 264.6
     }
    ],
    "offertorium": [
     {
      "p": 280,
      "y0": 256.6,
      "y1": 574.1
     },
     {
      "p": 281,
      "y0": 0,
      "y1": 270.8
     }
    ],
    "communio": [
     {
      "p": 281,
      "y0": 262.8,
      "y1": 576.0
     },
     {
      "p": 282,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-annuntiatione-domini": {
   "titulo": "In Annuntiatione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 284,
   "cantos": {
    "introitus": [
     {
      "p": 283,
      "y0": 108.9,
      "y1": 574.1
     },
     {
      "p": 284,
      "y0": 0,
      "y1": 283.0
     }
    ],
    "graduale": [
     {
      "p": 284,
      "y0": 275.0,
      "y1": 338.3
     }
    ],
    "offertorium": [
     {
      "p": 284,
      "y0": 330.3,
      "y1": 576.0
     },
     {
      "p": 285,
      "y0": 0,
      "y1": 329.0
     }
    ],
    "communio": [
     {
      "p": 285,
      "y0": 321.0,
      "y1": 576.0
     },
     {
      "p": 286,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-nativitate-sancti-ioannis-baptistae": {
   "titulo": "In Nativitate sancti Ioannis Baptistae",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 288,
   "cantos": {
    "introitus": [
     {
      "p": 287,
      "y0": 124.4,
      "y1": 576.0
     },
     {
      "p": 288,
      "y0": 0,
      "y1": 173.7
     }
    ],
    "graduale": [
     {
      "p": 288,
      "y0": 165.7,
      "y1": 576.0
     },
     {
      "p": 289,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 290,
      "y0": 0,
      "y1": 303.8
     }
    ],
    "alleluia": [
     {
      "p": 290,
      "y0": 295.8,
      "y1": 576.0
     },
     {
      "p": 291,
      "y0": 0,
      "y1": 327.7
     }
    ],
    "offertorium": [
     {
      "p": 291,
      "y0": 319.7,
      "y1": 576.0
     },
     {
      "p": 292,
      "y0": 0,
      "y1": 308.0
     }
    ],
    "communio": [
     {
      "p": 292,
      "y0": 300.0,
      "y1": 576.0
     },
     {
      "p": 293,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "sanctorum-petri-et-pauli-apostolorum": {
   "titulo": "Sanctorum Petri et Pauli Apostolorum",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 295,
   "cantos": {
    "introitus": [
     {
      "p": 294,
      "y0": 140.9,
      "y1": 576.0
     },
     {
      "p": 295,
      "y0": 0,
      "y1": 167.1
     }
    ],
    "graduale": [
     {
      "p": 295,
      "y0": 159.1,
      "y1": 576.0
     },
     {
      "p": 296,
      "y0": 0,
      "y1": 417.5
     }
    ],
    "alleluia": [
     {
      "p": 296,
      "y0": 409.5,
      "y1": 576.0
     },
     {
      "p": 297,
      "y0": 0,
      "y1": 402.4
     }
    ],
    "offertorium": [
     {
      "p": 297,
      "y0": 394.4,
      "y1": 576.0
     },
     {
      "p": 298,
      "y0": 0,
      "y1": 407.2
     }
    ],
    "communio": [
     {
      "p": 298,
      "y0": 399.2,
      "y1": 576.0
     },
     {
      "p": 299,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-transfiguratione-domini": {
   "titulo": "In Transfiguratione Domini",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 301,
   "cantos": {
    "introitus": [
     {
      "p": 300,
      "y0": 115.30000000000001,
      "y1": 576.0
     },
     {
      "p": 301,
      "y0": 0,
      "y1": 272.3
     }
    ],
    "graduale": [
     {
      "p": 301,
      "y0": 264.3,
      "y1": 576.0
     },
     {
      "p": 302,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 303,
      "y0": 0,
      "y1": 57.5
     }
    ],
    "alleluia": [
     {
      "p": 303,
      "y0": 49.5,
      "y1": 412.0
     }
    ],
    "offertorium": [
     {
      "p": 303,
      "y0": 404.0,
      "y1": 576.0
     },
     {
      "p": 304,
      "y0": 0,
      "y1": 268.3
     }
    ],
    "communio": [
     {
      "p": 304,
      "y0": 260.3,
      "y1": 575.0
     },
     {
      "p": 305,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-assumptione-b-mariae-virginis": {
   "titulo": "In Assumptione B. Mariae Virginis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 307,
   "cantos": {
    "introitus": [
     {
      "p": 306,
      "y0": 110.1,
      "y1": 574.1
     },
     {
      "p": 307,
      "y0": 0,
      "y1": 268.9
     }
    ],
    "graduale": [
     {
      "p": 307,
      "y0": 260.9,
      "y1": 574.1
     },
     {
      "p": 308,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 309,
      "y0": 0,
      "y1": 255.5
     }
    ],
    "alleluia": [
     {
      "p": 309,
      "y0": 247.5,
      "y1": 576.0
     },
     {
      "p": 310,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 311,
      "y0": 0,
      "y1": 458.2
     }
    ],
    "offertorium": [
     {
      "p": 311,
      "y0": 450.2,
      "y1": 576.0
     },
     {
      "p": 312,
      "y0": 0,
      "y1": 401.8
     }
    ],
    "communio": [
     {
      "p": 312,
      "y0": 393.8,
      "y1": 576.0
     },
     {
      "p": 313,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-nativitate-b-mariae-virginis": {
   "titulo": "In Nativitate B. Mariae Virginis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 315,
   "cantos": {
    "introitus": [
     {
      "p": 314,
      "y0": 109.1,
      "y1": 576.0
     },
     {
      "p": 315,
      "y0": 0,
      "y1": 204.7
     }
    ],
    "graduale": [
     {
      "p": 315,
      "y0": 196.7,
      "y1": 249.8
     }
    ],
    "offertorium": [
     {
      "p": 315,
      "y0": 241.8,
      "y1": 292.5
     }
    ],
    "communio": [
     {
      "p": 315,
      "y0": 284.5,
      "y1": 576.0
     },
     {
      "p": 316,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-exaltatione-sanctae-crucis": {
   "titulo": "In Exaltatione sanctae Crucis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 318,
   "cantos": {
    "introitus": [
     {
      "p": 317,
      "y0": 115.9,
      "y1": 166.4
     }
    ],
    "graduale": [
     {
      "p": 317,
      "y0": 158.4,
      "y1": 576.0
     },
     {
      "p": 318,
      "y0": 0,
      "y1": 291.8
     }
    ],
    "alleluia": [
     {
      "p": 318,
      "y0": 283.8,
      "y1": 576.0
     },
     {
      "p": 319,
      "y0": 0,
      "y1": 213.5
     }
    ],
    "offertorium": [
     {
      "p": 319,
      "y0": 205.5,
      "y1": 576.0
     },
     {
      "p": 320,
      "y0": 0,
      "y1": 206.5
     }
    ],
    "communio": [
     {
      "p": 320,
      "y0": 198.5,
      "y1": 576.0
     },
     {
      "p": 321,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "ss-michaelis-gabrielis-et-raphaelis-archangelorum": {
   "titulo": "Ss. Michaelis, Gabrielis et Raphaelis, archangelorum",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 323,
   "cantos": {
    "introitus": [
     {
      "p": 322,
      "y0": 130.8,
      "y1": 576.0
     },
     {
      "p": 323,
      "y0": 0,
      "y1": 284.5
     }
    ],
    "graduale": [
     {
      "p": 323,
      "y0": 276.5,
      "y1": 576.0
     },
     {
      "p": 324,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 325,
      "y0": 0,
      "y1": 269.6
     }
    ],
    "alleluia": [
     {
      "p": 325,
      "y0": 261.6,
      "y1": 576.0
     },
     {
      "p": 326,
      "y0": 0,
      "y1": 281.5
     }
    ],
    "offertorium": [
     {
      "p": 326,
      "y0": 273.5,
      "y1": 576.0
     },
     {
      "p": 327,
      "y0": 0,
      "y1": 158.2
     }
    ],
    "communio": [
     {
      "p": 327,
      "y0": 150.2,
      "y1": 576.0
     },
     {
      "p": 328,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "omnium-sanctorum": {
   "titulo": "Omnium Sanctorum",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 330,
   "cantos": {
    "introitus": [
     {
      "p": 329,
      "y0": 110.0,
      "y1": 576.0
     },
     {
      "p": 330,
      "y0": 0,
      "y1": 225.2
     }
    ],
    "graduale": [
     {
      "p": 330,
      "y0": 217.2,
      "y1": 576.0
     },
     {
      "p": 331,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 332,
      "y0": 0,
      "y1": 56.8
     }
    ],
    "alleluia": [
     {
      "p": 332,
      "y0": 48.8,
      "y1": 576.0
     },
     {
      "p": 333,
      "y0": 0,
      "y1": 56.5
     }
    ],
    "offertorium": [
     {
      "p": 333,
      "y0": 48.5,
      "y1": 450.6
     }
    ],
    "communio": [
     {
      "p": 333,
      "y0": 442.6,
      "y1": 576.0
     },
     {
      "p": 334,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-conceptione-immaculata-b-mariae-virginis": {
   "titulo": "In Conceptione immaculata B. Mariae Virginis",
   "ruta": [
    "III. Graduale simplex",
    "Proprium Sanctorum"
   ],
   "pagina": 336,
   "cantos": {
    "introitus": [
     {
      "p": 335,
      "y0": 126.1,
      "y1": 576.0
     },
     {
      "p": 336,
      "y0": 0,
      "y1": 243.7
     }
    ],
    "graduale": [
     {
      "p": 336,
      "y0": 235.7,
      "y1": 576.0
     },
     {
      "p": 337,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 338,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 339,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 340,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "commune-dedicationis-ecclesiae": {
   "titulo": "Commune dedicationis ecclesiae",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 344,
   "cantos": {
    "introitus": [
     {
      "p": 343,
      "y0": 85.3,
      "y1": 576.0
     },
     {
      "p": 344,
      "y0": 0,
      "y1": 212.3
     }
    ],
    "graduale": [
     {
      "p": 344,
      "y0": 204.3,
      "y1": 452.3
     }
    ],
    "alleluia": [
     {
      "p": 344,
      "y0": 444.3,
      "y1": 576.0
     },
     {
      "p": 345,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 346,
      "y0": 0,
      "y1": 326.4
     }
    ],
    "communio": [
     {
      "p": 346,
      "y0": 318.4,
      "y1": 576.0
     },
     {
      "p": 347,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "commune-beatae-mariae-virginis": {
   "titulo": "Commune beatae Mariae Virginis",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 349,
   "cantos": {
    "introitus": [
     {
      "p": 348,
      "y0": 111.5,
      "y1": 576.0
     },
     {
      "p": 349,
      "y0": 0,
      "y1": 259.3
     }
    ],
    "graduale": [
     {
      "p": 349,
      "y0": 251.3,
      "y1": 307.8
     }
    ],
    "offertorium": [
     {
      "p": 349,
      "y0": 299.8,
      "y1": 576.0
     },
     {
      "p": 350,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "commune-apostolorum": {
   "titulo": "Commune Apostolorum",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 352,
   "cantos": {
    "introitus": [
     {
      "p": 351,
      "y0": 91.0,
      "y1": 576.0
     },
     {
      "p": 352,
      "y0": 0,
      "y1": 139.8
     }
    ],
    "graduale": [
     {
      "p": 352,
      "y0": 131.8,
      "y1": 180.6
     }
    ],
    "offertorium": [
     {
      "p": 352,
      "y0": 172.6,
      "y1": 576.0
     },
     {
      "p": 353,
      "y0": 0,
      "y1": 57.0
     }
    ],
    "communio": [
     {
      "p": 353,
      "y0": 49.0,
      "y1": 576.0
     },
     {
      "p": 354,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "commune-martyrum": {
   "titulo": "Commune Martyrum",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 356,
   "cantos": {
    "graduale": [
     {
      "p": 357,
      "y0": 390.1,
      "y1": 576.0
     },
     {
      "p": 358,
      "y0": 0,
      "y1": 457.9
     }
    ],
    "alleluia": [
     {
      "p": 360,
      "y0": 214.4,
      "y1": 576.0
     },
     {
      "p": 361,
      "y0": 0,
      "y1": 236.2
     }
    ]
   }
  },
  "commune-sanctorum": {
   "titulo": "Commune Sanctorum",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 368,
   "cantos": {
    "graduale": [
     {
      "p": 369,
      "y0": 86.4,
      "y1": 576.0
     },
     {
      "p": 370,
      "y0": 0,
      "y1": 55.8
     }
    ]
   }
  },
  "pro-doctoribus": {
   "titulo": "Pro doctoribus",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 372,
   "cantos": {
    "graduale": [
     {
      "p": 371,
      "y0": 72.2,
      "y1": 576.0
     },
     {
      "p": 372,
      "y0": 0,
      "y1": 359.9
     }
    ],
    "alleluia": [
     {
      "p": 372,
      "y0": 351.9,
      "y1": 576.0
     },
     {
      "p": 373,
      "y0": 0,
      "y1": 307.6
     }
    ]
   }
  },
  "commune-sanctarum": {
   "titulo": "Commune Sanctarum",
   "ruta": [
    "III. Graduale simplex",
    "Communia"
   ],
   "pagina": 380,
   "cantos": {
    "graduale": [
     {
      "p": 381,
      "y0": 257.3,
      "y1": 576.0
     },
     {
      "p": 382,
      "y0": 0,
      "y1": 91.8
     }
    ],
    "alleluia": [
     {
      "p": 382,
      "y0": 83.8,
      "y1": 576.0
     },
     {
      "p": 383,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 384,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 385,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 386,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 387,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 388,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "i-missae-rituales": {
   "titulo": "i. Missae rituales",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae"
   ],
   "pagina": 392,
   "cantos": {
    "introitus": [
     {
      "p": 391,
      "y0": 103.2,
      "y1": 576.0
     },
     {
      "p": 392,
      "y0": 0,
      "y1": 296.7
     }
    ],
    "graduale": [
     {
      "p": 392,
      "y0": 288.7,
      "y1": 576.0
     },
     {
      "p": 393,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 394,
      "y0": 0,
      "y1": 55.9
     }
    ],
    "alleluia": [
     {
      "p": 394,
      "y0": 47.9,
      "y1": 396.9
     }
    ],
    "offertorium": [
     {
      "p": 394,
      "y0": 388.9,
      "y1": 576.0
     },
     {
      "p": 395,
      "y0": 0,
      "y1": 354.7
     }
    ],
    "communio": [
     {
      "p": 395,
      "y0": 346.7,
      "y1": 576.0
     },
     {
      "p": 396,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "pro-sponsis": {
   "titulo": "Pro sponsis",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "i. Missae rituales"
   ],
   "pagina": 392,
   "cantos": {
    "introitus": [
     {
      "p": 391,
      "y0": 103.2,
      "y1": 576.0
     },
     {
      "p": 392,
      "y0": 0,
      "y1": 296.7
     }
    ],
    "graduale": [
     {
      "p": 392,
      "y0": 288.7,
      "y1": 576.0
     },
     {
      "p": 393,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 394,
      "y0": 0,
      "y1": 55.9
     }
    ],
    "alleluia": [
     {
      "p": 394,
      "y0": 47.9,
      "y1": 396.9
     }
    ],
    "offertorium": [
     {
      "p": 394,
      "y0": 388.9,
      "y1": 576.0
     },
     {
      "p": 395,
      "y0": 0,
      "y1": 354.7
     }
    ],
    "communio": [
     {
      "p": 395,
      "y0": 346.7,
      "y1": 576.0
     },
     {
      "p": 396,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "in-professione-religiosa": {
   "titulo": "In professione religiosa",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "i. Missae rituales"
   ],
   "pagina": 398,
   "cantos": {
    "introitus": [
     {
      "p": 397,
      "y0": 87.9,
      "y1": 108.4
     }
    ],
    "graduale": [
     {
      "p": 397,
      "y0": 100.4,
      "y1": 133.6
     }
    ],
    "alleluia": [
     {
      "p": 397,
      "y0": 125.6,
      "y1": 146.5
     }
    ],
    "offertorium": [
     {
      "p": 397,
      "y0": 138.5,
      "y1": 159.0
     }
    ],
    "communio": [
     {
      "p": 397,
      "y0": 151.0,
      "y1": 576.0
     }
    ]
   }
  },
  "ii-missae-pro-variis-necessitatibus": {
   "titulo": "ii. Missae pro variis necessitatibus",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae"
   ],
   "pagina": 399,
   "cantos": {
    "introitus": [
     {
      "p": 398,
      "y0": 132.3,
      "y1": 277.1
     }
    ],
    "graduale": [
     {
      "p": 398,
      "y0": 269.1,
      "y1": 302.3
     }
    ],
    "offertorium": [
     {
      "p": 398,
      "y0": 294.3,
      "y1": 323.2
     }
    ],
    "communio": [
     {
      "p": 398,
      "y0": 315.2,
      "y1": 575.0
     }
    ]
   }
  },
  "in-anniversario-papae-vel-episcopi": {
   "titulo": "In anniversario Papae vel Episcopi",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "ii. Missae pro variis necessitatibus"
   ],
   "pagina": 399,
   "cantos": {
    "introitus": [
     {
      "p": 398,
      "y0": 132.3,
      "y1": 277.1
     }
    ],
    "graduale": [
     {
      "p": 398,
      "y0": 269.1,
      "y1": 302.3
     }
    ],
    "offertorium": [
     {
      "p": 398,
      "y0": 294.3,
      "y1": 323.2
     }
    ],
    "communio": [
     {
      "p": 398,
      "y0": 315.2,
      "y1": 575.0
     }
    ]
   }
  },
  "pro-vocationibus": {
   "titulo": "Pro vocationibus",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "ii. Missae pro variis necessitatibus"
   ],
   "pagina": 400,
   "cantos": {
    "introitus": [
     {
      "p": 399,
      "y0": 86.0,
      "y1": 576.0
     },
     {
      "p": 400,
      "y0": 0,
      "y1": 102.1
     }
    ],
    "graduale": [
     {
      "p": 400,
      "y0": 94.1,
      "y1": 127.4
     }
    ],
    "alleluia": [
     {
      "p": 400,
      "y0": 119.4,
      "y1": 140.1
     }
    ],
    "offertorium": [
     {
      "p": 400,
      "y0": 132.1,
      "y1": 152.8
     }
    ],
    "communio": [
     {
      "p": 400,
      "y0": 144.8,
      "y1": 576.0
     }
    ]
   }
  },
  "pro-unitate-christianorum": {
   "titulo": "Pro unitate Christianorum",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "ii. Missae pro variis necessitatibus"
   ],
   "pagina": 402,
   "cantos": {
    "introitus": [
     {
      "p": 401,
      "y0": 96.3,
      "y1": 245.9
     }
    ],
    "graduale": [
     {
      "p": 401,
      "y0": 237.9,
      "y1": 258.6
     }
    ],
    "alleluia": [
     {
      "p": 401,
      "y0": 250.60000000000002,
      "y1": 271.1
     }
    ],
    "offertorium": [
     {
      "p": 401,
      "y0": 263.1,
      "y1": 283.6
     }
    ],
    "communio": [
     {
      "p": 401,
      "y0": 275.6,
      "y1": 576.0
     }
    ]
   }
  },
  "pro-pace-et-iustitia-servanda": {
   "titulo": "Pro pace et iustitia servanda",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "ii. Missae pro variis necessitatibus"
   ],
   "pagina": 402,
   "cantos": {
    "introitus": [
     {
      "p": 401,
      "y0": 96.3,
      "y1": 245.9
     }
    ],
    "graduale": [
     {
      "p": 401,
      "y0": 237.9,
      "y1": 258.6
     }
    ],
    "alleluia": [
     {
      "p": 401,
      "y0": 250.60000000000002,
      "y1": 271.1
     }
    ],
    "offertorium": [
     {
      "p": 401,
      "y0": 263.1,
      "y1": 283.6
     }
    ],
    "communio": [
     {
      "p": 401,
      "y0": 275.6,
      "y1": 576.0
     }
    ]
   }
  },
  "in-quacumque-necessitate": {
   "titulo": "In quacumque necessitate",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "ii. Missae pro variis necessitatibus"
   ],
   "pagina": 403,
   "cantos": {
    "introitus": [
     {
      "p": 402,
      "y0": 91.5,
      "y1": 576.0
     },
     {
      "p": 403,
      "y0": 0,
      "y1": 172.7
     }
    ],
    "graduale": [
     {
      "p": 403,
      "y0": 164.7,
      "y1": 210.6
     }
    ],
    "alleluia": [
     {
      "p": 403,
      "y0": 202.6,
      "y1": 576.0
     },
     {
      "p": 404,
      "y0": 0,
      "y1": 283.9
     }
    ],
    "offertorium": [
     {
      "p": 404,
      "y0": 275.9,
      "y1": 576.0
     },
     {
      "p": 405,
      "y0": 0,
      "y1": 206.4
     }
    ],
    "communio": [
     {
      "p": 405,
      "y0": 198.4,
      "y1": 576.0
     },
     {
      "p": 406,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "iii-missae-votivae": {
   "titulo": "iii. Missae votivae",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae"
   ],
   "pagina": 408,
   "cantos": {
    "introitus": [
     {
      "p": 407,
      "y0": 286.5,
      "y1": 576.0
     },
     {
      "p": 408,
      "y0": 0,
      "y1": 294.6
     }
    ],
    "graduale": [
     {
      "p": 408,
      "y0": 286.6,
      "y1": 307.1
     }
    ],
    "alleluia": [
     {
      "p": 408,
      "y0": 299.1,
      "y1": 336.6
     }
    ],
    "offertorium": [
     {
      "p": 408,
      "y0": 328.6,
      "y1": 576.0
     },
     {
      "p": 409,
      "y0": 0,
      "y1": 55.6
     }
    ],
    "communio": [
     {
      "p": 409,
      "y0": 47.6,
      "y1": 576.0
     },
     {
      "p": 410,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "de-ss-ma-trinitate": {
   "titulo": "De Ss.ma Trinitate",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "iii. Missae votivae"
   ],
   "pagina": 208,
   "cantos": {
    "introitus": [
     {
      "p": 207,
      "y0": 104.6,
      "y1": 576.0
     },
     {
      "p": 208,
      "y0": 0,
      "y1": 180.1
     }
    ],
    "graduale": [
     {
      "p": 208,
      "y0": 172.1,
      "y1": 576.0
     },
     {
      "p": 209,
      "y0": 0,
      "y1": 455.8
     }
    ],
    "alleluia": [
     {
      "p": 209,
      "y0": 447.8,
      "y1": 576.0
     },
     {
      "p": 210,
      "y0": 0,
      "y1": 297.8
     }
    ],
    "offertorium": [
     {
      "p": 210,
      "y0": 289.8,
      "y1": 576.0
     },
     {
      "p": 211,
      "y0": 0,
      "y1": 306.0
     }
    ],
    "communio": [
     {
      "p": 211,
      "y0": 298.0,
      "y1": 576.0
     },
     {
      "p": 212,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 213,
      "y0": 0,
      "y1": 132.7
     }
    ]
   }
  },
  "de-mysterio-sanctae-crucis": {
   "titulo": "De mysterio sanctae Crucis",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "iii. Missae votivae"
   ],
   "pagina": 318,
   "cantos": {
    "introitus": [
     {
      "p": 317,
      "y0": 115.9,
      "y1": 166.4
     }
    ],
    "graduale": [
     {
      "p": 317,
      "y0": 158.4,
      "y1": 576.0
     },
     {
      "p": 318,
      "y0": 0,
      "y1": 291.8
     }
    ],
    "alleluia": [
     {
      "p": 318,
      "y0": 283.8,
      "y1": 576.0
     },
     {
      "p": 319,
      "y0": 0,
      "y1": 213.5
     }
    ],
    "offertorium": [
     {
      "p": 319,
      "y0": 205.5,
      "y1": 576.0
     },
     {
      "p": 320,
      "y0": 0,
      "y1": 206.5
     }
    ],
    "communio": [
     {
      "p": 320,
      "y0": 198.5,
      "y1": 576.0
     },
     {
      "p": 321,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 322,
      "y0": 0,
      "y1": 138.8
     }
    ]
   }
  },
  "de-ss-ma-eucharistia": {
   "titulo": "De SS.ma Eucharistia",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "iii. Missae votivae"
   ],
   "pagina": 214,
   "cantos": {
    "introitus": [
     {
      "p": 213,
      "y0": 124.69999999999999,
      "y1": 576.0
     },
     {
      "p": 214,
      "y0": 0,
      "y1": 223.6
     }
    ],
    "graduale": [
     {
      "p": 214,
      "y0": 215.6,
      "y1": 576.0
     },
     {
      "p": 215,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 216,
      "y0": 0,
      "y1": 162.1
     }
    ],
    "alleluia": [
     {
      "p": 216,
      "y0": 154.1,
      "y1": 576.0
     },
     {
      "p": 217,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 218,
      "y0": 0,
      "y1": 271.7
     }
    ],
    "offertorium": [
     {
      "p": 218,
      "y0": 263.7,
      "y1": 576.0
     },
     {
      "p": 219,
      "y0": 0,
      "y1": 257.8
     }
    ],
    "communio": [
     {
      "p": 219,
      "y0": 249.8,
      "y1": 575.0
     },
     {
      "p": 220,
      "y0": 0,
      "y1": 575.0
     }
    ]
   }
  },
  "de-sacratissimo-corde-iesu": {
   "titulo": "De sacratissimo Corde Iesu",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "iii. Missae votivae"
   ],
   "pagina": 222,
   "cantos": {
    "introitus": [
     {
      "p": 221,
      "y0": 114.80000000000001,
      "y1": 576.0
     },
     {
      "p": 222,
      "y0": 0,
      "y1": 258.9
     }
    ],
    "graduale": [
     {
      "p": 222,
      "y0": 250.89999999999998,
      "y1": 575.0
     },
     {
      "p": 223,
      "y0": 0,
      "y1": 455.3
     }
    ],
    "alleluia": [
     {
      "p": 223,
      "y0": 447.3,
      "y1": 576.0
     },
     {
      "p": 224,
      "y0": 0,
      "y1": 402.9
     }
    ],
    "offertorium": [
     {
      "p": 224,
      "y0": 394.9,
      "y1": 576.0
     },
     {
      "p": 225,
      "y0": 0,
      "y1": 399.1
     }
    ],
    "communio": [
     {
      "p": 225,
      "y0": 391.1,
      "y1": 576.0
     },
     {
      "p": 226,
      "y0": 0,
      "y1": 576.0
     },
     {
      "p": 227,
      "y0": 0,
      "y1": 96.9
     }
    ]
   }
  },
  "de-spiritu-sancto": {
   "titulo": "De Spiritu Sancto",
   "ruta": [
    "III. Graduale simplex",
    "Missae rituales, pro variis necessitatibus et votivae",
    "iii. Missae votivae"
   ],
   "pagina": 408,
   "cantos": {
    "introitus": [
     {
      "p": 407,
      "y0": 286.5,
      "y1": 576.0
     },
     {
      "p": 408,
      "y0": 0,
      "y1": 294.6
     }
    ],
    "graduale": [
     {
      "p": 408,
      "y0": 286.6,
      "y1": 307.1
     }
    ],
    "alleluia": [
     {
      "p": 408,
      "y0": 299.1,
      "y1": 336.6
     }
    ],
    "offertorium": [
     {
      "p": 408,
      "y0": 328.6,
      "y1": 576.0
     },
     {
      "p": 409,
      "y0": 0,
      "y1": 55.6
     }
    ],
    "communio": [
     {
      "p": 409,
      "y0": 47.6,
      "y1": 576.0
     },
     {
      "p": 410,
      "y0": 0,
      "y1": 576.0
     }
    ]
   }
  },
  "i-missa-pro-defunctis": {
   "titulo": "I. Missa pro defunctis",
   "ruta": [
    "III. Graduale simplex",
    "Liturgia defunctorum"
   ],
   "pagina": 414,
   "cantos": {
    "graduale": [
     {
      "p": 416,
      "y0": 159.2,
      "y1": 576.0
     },
     {
      "p": 417,
      "y0": 0,
      "y1": 59.0
     }
    ],
    "alleluia": [
     {
      "p": 419,
      "y0": 360.1,
      "y1": 576.0
     },
     {
      "p": 420,
      "y0": 0,
      "y1": 222.6
     }
    ]
   }
  }
 }
} as const;
