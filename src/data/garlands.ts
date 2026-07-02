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
import g8 from '../assets/garlands/garland-8.png';
import g9 from '../assets/garlands/garland-9.png';
import g10 from '../assets/garlands/garland-10.png';
import g11 from '../assets/garlands/garland-11.png';
import g12 from '../assets/garlands/garland-12.png';
import g13 from '../assets/garlands/garland-13.png';
import g14 from '../assets/garlands/garland-14.png';
import g15 from '../assets/garlands/garland-15.png';
import g16 from '../assets/garlands/garland-16.png';
import g17 from '../assets/garlands/garland-17.png';
import g18 from '../assets/garlands/garland-18.png';
import g19 from '../assets/garlands/garland-19.png';
import g20 from '../assets/garlands/garland-20.png';
import g21 from '../assets/garlands/garland-21.png';
import g22 from '../assets/garlands/garland-22.png';
import g23 from '../assets/garlands/garland-23.png';
import g24 from '../assets/garlands/garland-24.png';
import g25 from '../assets/garlands/garland-25.png';

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
  // Cenefas litúrgicas (set "Guirnaldas 2").
  { id: 'agnus-dei',            name: 'Agnus Dei y leones',       src: g8 },
  { id: 'gotico-roseton',       name: 'Gótico con rosetón',       src: g9 },
  { id: 'cornucopia-laurel',    name: 'Cornucopia y laurel',      src: g10 },
  { id: 'celta-dorado',         name: 'Nudos celtas dorados',     src: g11 },
  { id: 'crismon-roleos',       name: 'Crismón y roleos',         src: g12 },
  { id: 'sagrado-corazon-gotico', name: 'Sagrado Corazón gótico', src: g13 },
  { id: 'laudate-dominum',      name: 'Laudate Dominum',          src: g14 },
  { id: 'roleos-renacentistas', name: 'Roleos renacentistas',     src: g15 },
  { id: 'crismon-frutos',       name: 'Crismón y frutos',         src: g16 },
  { id: 'mariana-frutos',       name: 'Mariana con frutos',       src: g17 },
  { id: 'evangelistas-gotico',  name: 'Evangelistas (gótico)',    src: g18 },
  { id: 'vitral-santos',        name: 'Vitral gótico de santos',  src: g19 },
  { id: 'mosaico-bizantino',    name: 'Mosaico bizantino',        src: g20 },
  { id: 'vitral-roseton',       name: 'Vitral gótico rosetón',    src: g21 },
  { id: 'querubines-santos',    name: 'Querubines y santos',      src: g22 },
  { id: 'colmenas',             name: 'Colmenas y abejas',        src: g23 },
  { id: 'pedro-pablo',          name: 'San Pedro y San Pablo',    src: g24 },
  { id: 'sagrado-corazon-floral', name: 'Sagrado Corazón floral', src: g25 },
];

/** Guirnalda por defecto si el cantoral no trae una elegida. */
export const DEFAULT_GARLAND_ID = 'eucaristica';

export function getGarland(id?: string | null): GarlandStyle {
  return GARLANDS.find(g => g.id === id) ?? GARLANDS.find(g => g.id === DEFAULT_GARLAND_ID) ?? GARLANDS[0];
}
