// ARCHIVO GENERADO por scripts/import-kyriale.py - NO editar a mano.
//
// Las Misas del ordinario en gregoriano (Kyriale). Cada una trae su Kyrie, su Gloria,
// su Sanctus y su Agnus; las que no traen Gloria es porque no lo llevan - en ferias,
// Adviento y Cuaresma el Gloria no se canta.
//
// La imagen de cada parte es /kyriale/<libro>/<numero>/<parte>.webp

export interface MisaKyriale {
  /** Numero romano con que el libro la nombra ("XI"). */
  numero: string;
  /** Nombre tradicional, el que usa todo el mundo ("Orbis factor"). */
  nombre: string;
  /** Para que la propone el libro, en castellano. Vacio si el libro no lo dice. */
  uso: string;
  /** Pagina del PDF donde empieza. */
  pagina: number;
  /** Partes que existen y tienen imagen. */
  partes: readonly string[];
}

export const KYRIALE_DATA: Record<'romanum' | 'simplex', Record<string, MisaKyriale>> =
{
 "romanum": {
  "I": {
   "numero": "I",
   "nombre": "Lux et origo",
   "uso": "Tiempo pascual",
   "pagina": 700,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "II": {
   "numero": "II",
   "nombre": "Kyrie fons bonitatis",
   "uso": "",
   "pagina": 705,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "III": {
   "numero": "III",
   "nombre": "Kyrie Deus sempiterne",
   "uso": "",
   "pagina": 708,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "IV": {
   "numero": "IV",
   "nombre": "Cunctipotens genitor Deus",
   "uso": "Fiestas de los Apóstoles",
   "pagina": 715,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "V": {
   "numero": "V",
   "nombre": "Kyrie magnae Deus potentiae",
   "uso": "",
   "pagina": 718,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "VI": {
   "numero": "VI",
   "nombre": "Kyrie rex genitor",
   "uso": "",
   "pagina": 721,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "VII": {
   "numero": "VII",
   "nombre": "Kyrie rex splendens",
   "uso": "",
   "pagina": 725,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "VIII": {
   "numero": "VIII",
   "nombre": "De Angelis",
   "uso": "",
   "pagina": 728,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "IX": {
   "numero": "IX",
   "nombre": "Cum iubilo",
   "uso": "Solemnidades y fiestas de la Virgen",
   "pagina": 731,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "X": {
   "numero": "X",
   "nombre": "Alme Pater",
   "uso": "Fiestas y memorias de la Virgen",
   "pagina": 735,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XI": {
   "numero": "XI",
   "nombre": "Orbis factor",
   "uso": "Domingos del Tiempo Ordinario",
   "pagina": 738,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XII": {
   "numero": "XII",
   "nombre": "Pater cuncta",
   "uso": "",
   "pagina": 741,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XIII": {
   "numero": "XIII",
   "nombre": "Stelliferi Conditor orbis",
   "uso": "",
   "pagina": 744,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XIV": {
   "numero": "XIV",
   "nombre": "Iesu redemptor",
   "uso": "",
   "pagina": 747,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XV": {
   "numero": "XV",
   "nombre": "Dominator Deus",
   "uso": "",
   "pagina": 750,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "XVI": {
   "numero": "XVI",
   "nombre": "",
   "uso": "Ferias del Tiempo Ordinario",
   "pagina": 753,
   "partes": [
    "kyrie",
    "sanctus",
    "agnus"
   ]
  },
  "XVII": {
   "numero": "XVII",
   "nombre": "Kyrie salve",
   "uso": "Domingos de Adviento y Cuaresma",
   "pagina": 754,
   "partes": [
    "kyrie",
    "sanctus",
    "agnus"
   ]
  },
  "XVIII": {
   "numero": "XVIII",
   "nombre": "Deus Genitor alme",
   "uso": "Ferias de Adviento y Cuaresma, y Misa de difuntos",
   "pagina": 757,
   "partes": [
    "kyrie",
    "sanctus",
    "agnus"
   ]
  }
 },
 "simplex": {
  "I": {
   "numero": "I",
   "nombre": "",
   "uso": "",
   "pagina": 34,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "II": {
   "numero": "II",
   "nombre": "",
   "uso": "",
   "pagina": 36,
   "partes": [
    "kyrie",
    "gloria",
    "agnus"
   ]
  },
  "III": {
   "numero": "III",
   "nombre": "",
   "uso": "",
   "pagina": 39,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "IV": {
   "numero": "IV",
   "nombre": "",
   "uso": "",
   "pagina": 43,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  },
  "V": {
   "numero": "V",
   "nombre": "",
   "uso": "",
   "pagina": 47,
   "partes": [
    "kyrie",
    "gloria",
    "sanctus",
    "agnus"
   ]
  }
 }
} as const;

/** Un tono del Padre Nuestro. La imagen es /kyriale/<libro>/pater/<tono>.webp */
export interface TonoPaterNoster {
  /** Como lo rotula el libro: "A", "B", "C". */
  tono: string;
  /** Pagina del PDF. */
  pagina: number;
}

export const PATER_NOSTER_DATA: Record<string, readonly TonoPaterNoster[]> =
{
 "romanum": [
  {
   "tono": "A",
   "pagina": 802
  },
  {
   "tono": "B",
   "pagina": 803
  },
  {
   "tono": "C",
   "pagina": 804
  }
 ],
 "simplex": []
} as const;
