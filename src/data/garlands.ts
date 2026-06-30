// Catálogo de guirnaldas (cenefas) para adornar el folleto PDF del Pueblo fiel.
// Cada una es una cenefa horizontal a todo el ancho; en el PDF se corta al medio
// (centro en blanco) para alojar el título del momento de la Misa, y en la portada
// se usa completa arriba y abajo del texto.
import g1 from '../assets/garlands/garland-1.png';
import g2 from '../assets/garlands/garland-2.png';
import g3 from '../assets/garlands/garland-3.png';
import g4 from '../assets/garlands/garland-4.png';
import g5 from '../assets/garlands/garland-5.png';
import g6 from '../assets/garlands/garland-6.png';
import g7 from '../assets/garlands/garland-7.png';

export interface GarlandStyle {
  id: string;
  name: string;
  /** URL del asset (resuelta por el bundler) para <img> y para el PDF. */
  src: string;
}

export const GARLANDS: GarlandStyle[] = [
  { id: 'vid',         name: 'Vid y uvas',            src: g1 },
  { id: 'gotico',      name: 'Gótico dorado',         src: g2 },
  { id: 'celta',       name: 'Nudo celta',            src: g3 },
  { id: 'rosas',       name: 'Rosas y medallones',    src: g4 },
  { id: 'eucaristica', name: 'Eucarística',           src: g5 },
  { id: 'cruces',      name: 'Cruces celtas',         src: g6 },
  { id: 'medallones',  name: 'Medallones esmaltados', src: g7 },
];

/** Guirnalda por defecto si el cantoral no trae una elegida. */
export const DEFAULT_GARLAND_ID = 'eucaristica';

export function getGarland(id?: string | null): GarlandStyle {
  return GARLANDS.find(g => g.id === id) ?? GARLANDS.find(g => g.id === DEFAULT_GARLAND_ID) ?? GARLANDS[0];
}
