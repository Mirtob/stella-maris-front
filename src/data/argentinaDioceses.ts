import { Diocese } from './chileDioceses';

// Estructura eclesiástica de Argentina (Conferencia Episcopal Argentina / AICA).
// 'region' = PROVINCIA ECLESIÁSTICA (agrupa la arquidiócesis metropolitana y sus
// diócesis sufragáneas + prelaturas territoriales en el <optgroup> del ParishPicker).
//
// Cobertura: las 14 provincias eclesiásticas con sus 14 arquidiócesis metropolitanas,
// las diócesis sufragáneas y las 4 prelaturas territoriales (Deán Funes, Esquel,
// Cafayate, Humahuaca). Incluye la nueva provincia de Mercedes-Luján (metropolitana
// desde 2019). Cada jurisdicción trae su catedral verificada en fuentes oficiales;
// las parroquias listadas son la catedral + parroquias principales (Mercedes-Luján
// se carga completa como referencia). Fuentes: episcopado.org, AICA, GCatholic,
// Wikipedia (anexos de parroquias por diócesis).
export const argentinaDioceses: Diocese[] = [
  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE BUENOS AIRES
  // ──────────────────────────────────────────────
  {
    id: 'ar-buenos-aires',
    name: 'Arquidiócesis de Buenos Aires',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-buenos-aires-catedral-metropolitana-de-la-santisima-trinidad', name: 'Catedral Metropolitana de la Santísima Trinidad' },
      { id: 'ar-buenos-aires-nuestra-senora-del-pilar', name: 'Nuestra Señora del Pilar' },
      { id: 'ar-buenos-aires-san-benito-abad', name: 'San Benito Abad' },
      { id: 'ar-buenos-aires-san-carlos-borromeo-y-maria-auxiliadora', name: 'San Carlos Borromeo y María Auxiliadora' },
      { id: 'ar-buenos-aires-inmaculada-concepcion-belgrano', name: 'Inmaculada Concepción (Belgrano)' },
      { id: 'ar-buenos-aires-san-ignacio-de-loyola', name: 'San Ignacio de Loyola' },
    ],
  },
  {
    id: 'ar-avellaneda-lanus',
    name: 'Diócesis de Avellaneda-Lanús',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-avellaneda-lanus-catedral-nuestra-senora-de-la-asuncion', name: 'Catedral Nuestra Señora de la Asunción' },
      { id: 'ar-avellaneda-lanus-san-judas-tadeo', name: 'San Judas Tadeo' },
      { id: 'ar-avellaneda-lanus-nuestra-senora-del-rosario', name: 'Nuestra Señora del Rosario' },
    ],
  },
  {
    id: 'ar-san-isidro',
    name: 'Diócesis de San Isidro',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-san-isidro-catedral-de-san-isidro-labrador', name: 'Catedral de San Isidro Labrador' },
      { id: 'ar-san-isidro-nuestra-senora-de-aranzazu', name: 'Nuestra Señora de Aránzazu' },
      { id: 'ar-san-isidro-purisima-concepcion', name: 'Purísima Concepción' },
    ],
  },
  {
    id: 'ar-quilmes',
    name: 'Diócesis de Quilmes',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-quilmes-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
      { id: 'ar-quilmes-nuestra-senora-de-lujan', name: 'Nuestra Señora de Luján' },
      { id: 'ar-quilmes-san-cayetano', name: 'San Cayetano' },
    ],
  },
  {
    id: 'ar-san-martin',
    name: 'Diócesis de San Martín',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-san-martin-catedral-jesus-amoroso', name: 'Catedral Jesús Amoroso' },
      { id: 'ar-san-martin-nuestra-senora-de-la-merced', name: 'Nuestra Señora de la Merced' },
    ],
  },
  {
    id: 'ar-gregorio-de-laferrere',
    name: 'Diócesis de Gregorio de Laferrère',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-gregorio-de-laferrere-catedral-cristo-rey', name: 'Catedral Cristo Rey' },
    ],
  },
  {
    id: 'ar-lomas-de-zamora',
    name: 'Diócesis de Lomas de Zamora',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-lomas-de-zamora-catedral-nuestra-senora-de-la-paz', name: 'Catedral Nuestra Señora de la Paz' },
    ],
  },
  {
    id: 'ar-moron',
    name: 'Diócesis de Morón',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-moron-catedral-inmaculada-concepcion-del-buen-viaje', name: 'Catedral Basílica Inmaculada Concepción del Buen Viaje' },
    ],
  },
  {
    id: 'ar-san-justo',
    name: 'Diócesis de San Justo',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-san-justo-catedral-santos-justo-y-pastor', name: 'Catedral Santos Justo y Pastor' },
    ],
  },
  {
    id: 'ar-san-miguel',
    name: 'Diócesis de San Miguel',
    region: 'Provincia Eclesiástica de Buenos Aires',
    parishes: [
      { id: 'ar-san-miguel-catedral-san-miguel-arcangel', name: 'Catedral San Miguel Arcángel' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE LA PLATA
  // ──────────────────────────────────────────────
  {
    id: 'ar-la-plata',
    name: 'Arquidiócesis de La Plata',
    region: 'Provincia Eclesiástica de La Plata',
    parishes: [
      { id: 'ar-la-plata-catedral-metropolitana-de-la-inmaculada-concepcion', name: 'Catedral Metropolitana de la Inmaculada Concepción' },
      { id: 'ar-la-plata-nuestra-senora-de-la-merced', name: 'Nuestra Señora de la Merced' },
      { id: 'ar-la-plata-basilica-sagrado-corazon-de-jesus', name: 'Basílica Sagrado Corazón de Jesús' },
      { id: 'ar-la-plata-san-pio-x', name: 'San Pío X' },
    ],
  },
  {
    id: 'ar-mar-del-plata',
    name: 'Diócesis de Mar del Plata',
    region: 'Provincia Eclesiástica de La Plata',
    parishes: [
      { id: 'ar-mar-del-plata-catedral-de-los-santos-pedro-y-cecilia', name: 'Catedral de los Santos Pedro y Cecilia' },
      { id: 'ar-mar-del-plata-nuestra-senora-de-la-asuncion', name: 'Nuestra Señora de la Asunción' },
      { id: 'ar-mar-del-plata-san-jose', name: 'San José' },
    ],
  },
  {
    id: 'ar-azul',
    name: 'Diócesis de Azul',
    region: 'Provincia Eclesiástica de La Plata',
    parishes: [
      { id: 'ar-azul-catedral-nuestra-senora-del-rosario', name: 'Catedral Nuestra Señora del Rosario' },
      { id: 'ar-azul-san-juan-bautista', name: 'San Juan Bautista' },
    ],
  },
  {
    id: 'ar-chascomus',
    name: 'Diócesis de Chascomús',
    region: 'Provincia Eclesiástica de La Plata',
    parishes: [
      { id: 'ar-chascomus-catedral-nuestra-senora-de-la-merced', name: 'Catedral Nuestra Señora de la Merced' },
      { id: 'ar-chascomus-san-jose-de-flores', name: 'San José de Flores' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE MERCEDES-LUJÁN
  // (metropolitana desde 2019; lista de parroquias completa)
  // ──────────────────────────────────────────────
  {
    id: 'ar-mercedes-lujan',
    name: 'Arquidiócesis de Mercedes-Luján',
    region: 'Provincia Eclesiástica de Mercedes-Luján',
    parishes: [
      { id: 'ar-mercedes-lujan-catedral-basilica-nuestra-senora-de-las-mercedes', name: 'Catedral Metropolitana Basílica Nuestra Señora de las Mercedes', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-basilica-santuario-nuestra-senora-de-lujan', name: 'Basílica Santuario Nuestra Señora de Luján', city: 'Luján' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-pilar-agustin-roca', name: 'Nuestra Señora del Pilar', city: 'Agustín Roca' },
      { id: 'ar-mercedes-lujan-inmaculada-concepcion-alberdi', name: 'Inmaculada Concepción', city: 'Alberdi' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-rosario-alberti', name: 'Nuestra Señora del Rosario', city: 'Alberti' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-rosario-alem', name: 'Nuestra Señora del Rosario', city: 'Alem' },
      { id: 'ar-mercedes-lujan-sagrada-familia-carboni', name: 'Sagrada Familia', city: 'Carboni' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-carmen-de-areco', name: 'Nuestra Señora del Carmen de Areco', city: 'Carmen de Areco' },
      { id: 'ar-mercedes-lujan-nuestra-senora-de-la-asuncion-chacabuco', name: 'Nuestra Señora de la Asunción', city: 'Chacabuco' },
      { id: 'ar-mercedes-lujan-santos-arcangeles-chacabuco', name: 'Santos Arcángeles Miguel, Gabriel y Rafael', city: 'Chacabuco' },
      { id: 'ar-mercedes-lujan-san-isidro-labrador-chacabuco', name: 'San Isidro Labrador', city: 'Chacabuco' },
      { id: 'ar-mercedes-lujan-cristo-obrero-chivilcoy', name: 'Cristo Obrero', city: 'Chivilcoy' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-carmen-chivilcoy', name: 'Nuestra Señora del Carmen', city: 'Chivilcoy' },
      { id: 'ar-mercedes-lujan-san-cayetano-chivilcoy', name: 'San Cayetano', city: 'Chivilcoy' },
      { id: 'ar-mercedes-lujan-santisima-eucaristia-chivilcoy', name: 'Santísima Eucaristía', city: 'Chivilcoy' },
      { id: 'ar-mercedes-lujan-san-pedro-apostol-chivilcoy', name: 'San Pedro Apóstol', city: 'Chivilcoy' },
      { id: 'ar-mercedes-lujan-san-vicente-palotti-empalme-lobos', name: 'San Vicente Palotti', city: 'Empalme Lobos' },
      { id: 'ar-mercedes-lujan-san-cipriano-general-las-heras', name: 'San Cipriano', city: 'General Las Heras' },
      { id: 'ar-mercedes-lujan-medalla-milagrosa-general-rodriguez', name: 'Nuestra Señora de la Medalla Milagrosa', city: 'General Rodríguez' },
      { id: 'ar-mercedes-lujan-nuestra-senora-de-la-salud-general-rodriguez', name: 'Nuestra Señora de la Salud', city: 'General Rodríguez' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-carmen-general-rodriguez', name: 'Nuestra Señora del Carmen', city: 'General Rodríguez' },
      { id: 'ar-mercedes-lujan-san-luis-gonzaga-jauregui', name: 'San Luis Gonzaga', city: 'Jáuregui' },
      { id: 'ar-mercedes-lujan-cristo-redentor-junin', name: 'Cristo Redentor', city: 'Junín' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-carmen-junin', name: 'Nuestra Señora del Carmen', city: 'Junín' },
      { id: 'ar-mercedes-lujan-sagrado-corazon-de-jesus-junin', name: 'Sagrado Corazón de Jesús', city: 'Junín' },
      { id: 'ar-mercedes-lujan-san-francisco-de-asis-junin', name: 'San Francisco de Asís', city: 'Junín' },
      { id: 'ar-mercedes-lujan-san-jose-junin', name: 'San José', city: 'Junín' },
      { id: 'ar-mercedes-lujan-san-ignacio-de-loyola-junin', name: 'San Ignacio de Loyola', city: 'Junín' },
      { id: 'ar-mercedes-lujan-inmaculada-concepcion-las-malvinas', name: 'Inmaculada Concepción', city: 'Las Malvinas' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-carmen-lobos', name: 'Nuestra Señora del Carmen', city: 'Lobos' },
      { id: 'ar-mercedes-lujan-sagrada-familia-lujan', name: 'Sagrada Familia', city: 'Luján' },
      { id: 'ar-mercedes-lujan-sagrado-corazon-de-jesus-lujan', name: 'Sagrado Corazón de Jesús', city: 'Luján' },
      { id: 'ar-mercedes-lujan-san-cayetano-lujan', name: 'San Cayetano', city: 'Luján' },
      { id: 'ar-mercedes-lujan-san-demetrio-y-san-bernardo-lujan', name: 'San Demetrio y San Bernardo', city: 'Luján' },
      { id: 'ar-mercedes-lujan-santa-elena-lujan', name: 'Santa Elena', city: 'Luján' },
      { id: 'ar-mercedes-lujan-san-marcos-evangelista-marcos-paz', name: 'San Marcos Evangelista', city: 'Marcos Paz' },
      { id: 'ar-mercedes-lujan-nuestra-senora-de-lujan-marcos-paz', name: 'Nuestra Señora de Luján', city: 'Marcos Paz' },
      { id: 'ar-mercedes-lujan-san-jose-obrero-mercedes', name: 'San José Obrero', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-san-luis-gonzaga-mercedes', name: 'San Luis Gonzaga', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-san-patricio-mercedes', name: 'San Patricio', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-san-vicente-de-paul-mercedes', name: 'San Vicente de Paúl', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-cristo-rey-mercedes', name: 'Cristo Rey', city: 'Mercedes' },
      { id: 'ar-mercedes-lujan-san-jose-moquehua', name: 'San José', city: 'Moquehuá' },
      { id: 'ar-mercedes-lujan-san-lorenzo-martir-navarro', name: 'San Lorenzo Mártir', city: 'Navarro' },
      { id: 'ar-mercedes-lujan-san-jose-ohiggins', name: 'San José', city: "O'Higgins" },
      { id: 'ar-mercedes-lujan-san-roque-open-door', name: 'San Roque', city: 'Open Door' },
      { id: 'ar-mercedes-lujan-inmaculada-concepcion-rawson', name: 'Inmaculada Concepción', city: 'Rawson' },
      { id: 'ar-mercedes-lujan-san-andres-apostol-san-andres-de-giles', name: 'San Andrés Apóstol', city: 'San Andrés de Giles' },
      { id: 'ar-mercedes-lujan-nuestra-senora-del-rosario-suipacha', name: 'Nuestra Señora del Rosario', city: 'Suipacha' },
      { id: 'ar-mercedes-lujan-san-jose-torres', name: 'San José', city: 'Torres' },
      { id: 'ar-mercedes-lujan-sagrado-corazon-de-jesus-vedia', name: 'Sagrado Corazón de Jesús', city: 'Vedia' },
    ],
  },
  {
    id: 'ar-merlo-moreno',
    name: 'Diócesis de Merlo-Moreno',
    region: 'Provincia Eclesiástica de Mercedes-Luján',
    parishes: [
      { id: 'ar-merlo-moreno-catedral-nuestra-senora-del-rosario', name: 'Catedral Nuestra Señora del Rosario', city: 'Moreno' },
    ],
  },
  {
    id: 'ar-nueve-de-julio',
    name: 'Diócesis de Nueve de Julio',
    region: 'Provincia Eclesiástica de Mercedes-Luján',
    parishes: [
      { id: 'ar-nueve-de-julio-catedral-santo-domingo-de-guzman', name: 'Catedral Santo Domingo de Guzmán', city: 'Nueve de Julio' },
    ],
  },
  {
    id: 'ar-zarate-campana',
    name: 'Diócesis de Zárate-Campana',
    region: 'Provincia Eclesiástica de Mercedes-Luján',
    parishes: [
      { id: 'ar-zarate-campana-catedral-santa-florentina', name: 'Catedral Santa Florentina', city: 'Campana' },
      { id: 'ar-zarate-campana-cocatedral-natividad-del-senor', name: 'Co-Catedral Natividad de Nuestro Señor Jesucristo', city: 'Belén de Escobar' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE CÓRDOBA
  // ──────────────────────────────────────────────
  {
    id: 'ar-cordoba',
    name: 'Arquidiócesis de Córdoba',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-cordoba-catedral-metropolitana-nuestra-senora-de-la-asuncion', name: 'Catedral Metropolitana Nuestra Señora de la Asunción' },
      { id: 'ar-cordoba-sagrado-corazon-de-jesus-los-capuchinos', name: 'Sagrado Corazón de Jesús (Los Capuchinos)' },
      { id: 'ar-cordoba-basilica-nuestra-senora-de-la-merced', name: 'Basílica Nuestra Señora de la Merced' },
      { id: 'ar-cordoba-santo-domingo', name: 'Santo Domingo' },
    ],
  },
  {
    id: 'ar-villa-de-la-concepcion-del-rio-cuarto',
    name: 'Diócesis de Villa de la Concepción del Río Cuarto',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-villa-de-la-concepcion-del-rio-cuarto-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
      { id: 'ar-villa-de-la-concepcion-del-rio-cuarto-nuestra-senora-de-la-merced', name: 'Nuestra Señora de la Merced' },
    ],
  },
  {
    id: 'ar-villa-maria',
    name: 'Diócesis de Villa María',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-villa-maria-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
      { id: 'ar-villa-maria-santisima-trinidad', name: 'Santísima Trinidad' },
    ],
  },
  {
    id: 'ar-san-francisco',
    name: 'Diócesis de San Francisco',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-san-francisco-catedral-san-francisco-de-asis', name: 'Catedral San Francisco de Asís' },
    ],
  },
  {
    id: 'ar-cruz-del-eje',
    name: 'Diócesis de Cruz del Eje',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-cruz-del-eje-catedral-nuestra-senora-del-carmen', name: 'Catedral Nuestra Señora del Carmen' },
    ],
  },
  {
    id: 'ar-dean-funes',
    name: 'Prelatura Territorial de Deán Funes',
    region: 'Provincia Eclesiástica de Córdoba',
    parishes: [
      { id: 'ar-dean-funes-catedral-nuestra-senora-del-carmen', name: 'Catedral Nuestra Señora del Carmen', city: 'Deán Funes' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE MENDOZA
  // ──────────────────────────────────────────────
  {
    id: 'ar-mendoza',
    name: 'Arquidiócesis de Mendoza',
    region: 'Provincia Eclesiástica de Mendoza',
    parishes: [
      { id: 'ar-mendoza-catedral-nuestra-senora-de-loreto', name: 'Catedral Nuestra Señora de Loreto' },
      { id: 'ar-mendoza-basilica-de-san-francisco-solano', name: 'Basílica de San Francisco Solano' },
      { id: 'ar-mendoza-santiago-apostol-y-san-nicolas', name: 'Santiago Apóstol y San Nicolás' },
      { id: 'ar-mendoza-nuestra-senora-de-la-carrodilla', name: 'Nuestra Señora de la Carrodilla' },
    ],
  },
  {
    id: 'ar-san-rafael',
    name: 'Diócesis de San Rafael',
    region: 'Provincia Eclesiástica de Mendoza',
    parishes: [
      { id: 'ar-san-rafael-catedral-san-rafael-arcangel', name: 'Catedral San Rafael Arcángel' },
      { id: 'ar-san-rafael-nuestra-senora-de-lourdes', name: 'Nuestra Señora de Lourdes' },
    ],
  },
  {
    id: 'ar-neuquen',
    name: 'Diócesis de Neuquén',
    region: 'Provincia Eclesiástica de Mendoza',
    parishes: [
      { id: 'ar-neuquen-catedral-maria-auxiliadora', name: 'Catedral María Auxiliadora' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE SAN JUAN DE CUYO
  // ──────────────────────────────────────────────
  {
    id: 'ar-san-juan-de-cuyo',
    name: 'Arquidiócesis de San Juan de Cuyo',
    region: 'Provincia Eclesiástica de San Juan de Cuyo',
    parishes: [
      { id: 'ar-san-juan-de-cuyo-catedral-de-san-juan-bautista', name: 'Catedral de San Juan Bautista' },
      { id: 'ar-san-juan-de-cuyo-nuestra-senora-de-la-merced', name: 'Nuestra Señora de la Merced' },
      { id: 'ar-san-juan-de-cuyo-inmaculada-concepcion', name: 'Inmaculada Concepción' },
    ],
  },
  {
    id: 'ar-san-luis',
    name: 'Diócesis de San Luis',
    region: 'Provincia Eclesiástica de San Juan de Cuyo',
    parishes: [
      { id: 'ar-san-luis-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
      { id: 'ar-san-luis-nuestra-senora-del-carmen', name: 'Nuestra Señora del Carmen' },
    ],
  },
  {
    id: 'ar-la-rioja',
    name: 'Diócesis de La Rioja',
    region: 'Provincia Eclesiástica de San Juan de Cuyo',
    parishes: [
      { id: 'ar-la-rioja-catedral-basilica-san-nicolas-de-bari', name: 'Catedral Basílica San Nicolás de Bari', city: 'La Rioja' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE ROSARIO
  // ──────────────────────────────────────────────
  {
    id: 'ar-rosario',
    name: 'Arquidiócesis de Rosario',
    region: 'Provincia Eclesiástica de Rosario',
    parishes: [
      { id: 'ar-rosario-catedral-basilica-nuestra-senora-del-rosario', name: 'Catedral Basílica Nuestra Señora del Rosario' },
      { id: 'ar-rosario-nuestra-senora-de-lourdes', name: 'Nuestra Señora de Lourdes' },
      { id: 'ar-rosario-san-jose', name: 'San José' },
    ],
  },
  {
    id: 'ar-san-nicolas-de-los-arroyos',
    name: 'Diócesis de San Nicolás de los Arroyos',
    region: 'Provincia Eclesiástica de Rosario',
    parishes: [
      { id: 'ar-san-nicolas-de-los-arroyos-catedral-de-san-nicolas-de-bari', name: 'Catedral de San Nicolás de Bari' },
      { id: 'ar-san-nicolas-de-los-arroyos-santuario-maria-del-rosario-de-san-nicolas', name: 'Santuario María del Rosario de San Nicolás' },
    ],
  },
  {
    id: 'ar-venado-tuerto',
    name: 'Diócesis de Venado Tuerto',
    region: 'Provincia Eclesiástica de Rosario',
    parishes: [
      { id: 'ar-venado-tuerto-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE SANTA FE
  // ──────────────────────────────────────────────
  {
    id: 'ar-santa-fe-de-la-vera-cruz',
    name: 'Arquidiócesis de Santa Fe de la Vera Cruz',
    region: 'Provincia Eclesiástica de Santa Fe',
    parishes: [
      { id: 'ar-santa-fe-de-la-vera-cruz-catedral-metropolitana-todos-los-santos', name: 'Catedral Metropolitana Todos los Santos' },
      { id: 'ar-santa-fe-de-la-vera-cruz-nuestra-senora-de-guadalupe', name: 'Nuestra Señora de Guadalupe' },
      { id: 'ar-santa-fe-de-la-vera-cruz-nuestra-senora-del-carmen', name: 'Nuestra Señora del Carmen' },
    ],
  },
  {
    id: 'ar-rafaela',
    name: 'Diócesis de Rafaela',
    region: 'Provincia Eclesiástica de Santa Fe',
    parishes: [
      { id: 'ar-rafaela-catedral-san-rafael', name: 'Catedral San Rafael' },
    ],
  },
  {
    id: 'ar-reconquista',
    name: 'Diócesis de Reconquista',
    region: 'Provincia Eclesiástica de Santa Fe',
    parishes: [
      { id: 'ar-reconquista-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE PARANÁ
  // ──────────────────────────────────────────────
  {
    id: 'ar-parana',
    name: 'Arquidiócesis de Paraná',
    region: 'Provincia Eclesiástica de Paraná',
    parishes: [
      { id: 'ar-parana-catedral-metropolitana-nuestra-senora-del-rosario', name: 'Catedral Metropolitana Nuestra Señora del Rosario' },
      { id: 'ar-parana-san-miguel-arcangel', name: 'San Miguel Arcángel' },
    ],
  },
  {
    id: 'ar-concordia',
    name: 'Diócesis de Concordia',
    region: 'Provincia Eclesiástica de Paraná',
    parishes: [
      { id: 'ar-concordia-catedral-san-antonio-de-padua', name: 'Catedral San Antonio de Padua' },
    ],
  },
  {
    id: 'ar-gualeguaychu',
    name: 'Diócesis de Gualeguaychú',
    region: 'Provincia Eclesiástica de Paraná',
    parishes: [
      { id: 'ar-gualeguaychu-catedral-san-jose', name: 'Catedral San José' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE SALTA
  // ──────────────────────────────────────────────
  {
    id: 'ar-salta',
    name: 'Arquidiócesis de Salta',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-salta-catedral-basilica-de-san-felipe-y-santiago', name: 'Catedral Basílica de San Felipe y Santiago' },
      { id: 'ar-salta-nuestra-senora-del-transito', name: 'Nuestra Señora del Tránsito' },
      { id: 'ar-salta-san-alfonso', name: 'San Alfonso' },
    ],
  },
  {
    id: 'ar-jujuy',
    name: 'Diócesis de Jujuy',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-jujuy-catedral-de-san-salvador-de-jujuy', name: 'Catedral de San Salvador de Jujuy' },
      { id: 'ar-jujuy-nuestra-senora-del-rosario', name: 'Nuestra Señora del Rosario' },
    ],
  },
  {
    id: 'ar-catamarca',
    name: 'Diócesis de Catamarca',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-catamarca-catedral-basilica-de-nuestra-senora-del-valle', name: 'Catedral Basílica de Nuestra Señora del Valle' },
      { id: 'ar-catamarca-san-jose', name: 'San José' },
    ],
  },
  {
    id: 'ar-san-ramon-de-la-nueva-oran',
    name: 'Diócesis de San Ramón de la Nueva Orán',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-san-ramon-de-la-nueva-oran-catedral-san-ramon-nonato', name: 'Catedral San Ramón Nonato' },
    ],
  },
  {
    id: 'ar-cafayate',
    name: 'Prelatura Territorial de Cafayate',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-cafayate-catedral-nuestra-senora-del-rosario', name: 'Catedral Nuestra Señora del Rosario', city: 'Cafayate' },
    ],
  },
  {
    id: 'ar-humahuaca',
    name: 'Prelatura Territorial de Humahuaca',
    region: 'Provincia Eclesiástica de Salta',
    parishes: [
      { id: 'ar-humahuaca-catedral-nuestra-senora-de-la-candelaria', name: 'Catedral Nuestra Señora de la Candelaria', city: 'Humahuaca' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE TUCUMÁN
  // ──────────────────────────────────────────────
  {
    id: 'ar-tucuman',
    name: 'Arquidiócesis de Tucumán',
    region: 'Provincia Eclesiástica de Tucumán',
    parishes: [
      { id: 'ar-tucuman-catedral-de-nuestra-senora-de-la-encarnacion', name: 'Catedral de Nuestra Señora de la Encarnación' },
      { id: 'ar-tucuman-basilica-de-nuestra-senora-de-la-merced', name: 'Basílica de Nuestra Señora de la Merced' },
      { id: 'ar-tucuman-san-gerardo', name: 'San Gerardo' },
    ],
  },
  {
    id: 'ar-santiago-del-estero',
    name: 'Arquidiócesis de Santiago del Estero',
    region: 'Provincia Eclesiástica de Tucumán',
    parishes: [
      { id: 'ar-santiago-del-estero-catedral-basilica-de-nuestra-senora-del-carmen', name: 'Catedral Basílica de Nuestra Señora del Carmen' },
      { id: 'ar-santiago-del-estero-san-francisco-solano', name: 'San Francisco Solano' },
      { id: 'ar-santiago-del-estero-santo-domingo', name: 'Santo Domingo' },
    ],
  },
  {
    id: 'ar-la-santisima-concepcion',
    name: 'Diócesis de la Santísima Concepción',
    region: 'Provincia Eclesiástica de Tucumán',
    parishes: [
      { id: 'ar-la-santisima-concepcion-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
    ],
  },
  {
    id: 'ar-anatuya',
    name: 'Diócesis de Añatuya',
    region: 'Provincia Eclesiástica de Tucumán',
    parishes: [
      { id: 'ar-anatuya-catedral-nuestra-senora-del-valle', name: 'Catedral Nuestra Señora del Valle' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE CORRIENTES
  // ──────────────────────────────────────────────
  {
    id: 'ar-corrientes',
    name: 'Arquidiócesis de Corrientes',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-corrientes-catedral-nuestra-senora-del-rosario', name: 'Catedral Nuestra Señora del Rosario' },
      { id: 'ar-corrientes-santuario-de-nuestra-senora-de-itati', name: 'Santuario de Nuestra Señora de Itatí' },
      { id: 'ar-corrientes-san-francisco-dasis', name: 'San Francisco d\'Asís' },
    ],
  },
  {
    id: 'ar-posadas',
    name: 'Diócesis de Posadas',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-posadas-catedral-san-jose', name: 'Catedral San José' },
    ],
  },
  {
    id: 'ar-goya',
    name: 'Diócesis de Goya',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-goya-catedral-nuestra-senora-del-rosario', name: 'Catedral Nuestra Señora del Rosario' },
    ],
  },
  {
    id: 'ar-puerto-iguazu',
    name: 'Diócesis de Puerto Iguazú',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-puerto-iguazu-catedral-virgen-del-carmen', name: 'Catedral Virgen del Carmen' },
    ],
  },
  {
    id: 'ar-santo-tome',
    name: 'Diócesis de Santo Tomé',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-santo-tome-catedral-inmaculada-concepcion', name: 'Catedral Inmaculada Concepción' },
    ],
  },
  {
    id: 'ar-obera',
    name: 'Diócesis de Oberá',
    region: 'Provincia Eclesiástica de Corrientes',
    parishes: [
      { id: 'ar-obera-catedral-san-antonio-de-padua', name: 'Catedral San Antonio de Padua', city: 'Oberá' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE RESISTENCIA
  // ──────────────────────────────────────────────
  {
    id: 'ar-resistencia',
    name: 'Arquidiócesis de Resistencia',
    region: 'Provincia Eclesiástica de Resistencia',
    parishes: [
      { id: 'ar-resistencia-catedral-san-fernando-rey', name: 'Catedral San Fernando Rey' },
      { id: 'ar-resistencia-nuestra-senora-de-la-asuncion', name: 'Nuestra Señora de la Asunción' },
    ],
  },
  {
    id: 'ar-formosa',
    name: 'Diócesis de Formosa',
    region: 'Provincia Eclesiástica de Resistencia',
    parishes: [
      { id: 'ar-formosa-catedral-nuestra-senora-del-carmen', name: 'Catedral Nuestra Señora del Carmen' },
    ],
  },
  {
    id: 'ar-san-roque-de-presidencia-roque-saenz-pena',
    name: 'Diócesis de San Roque de Presidencia Roque Sáenz Peña',
    region: 'Provincia Eclesiástica de Resistencia',
    parishes: [
      { id: 'ar-san-roque-de-presidencia-roque-saenz-pena-catedral-san-roque', name: 'Catedral San Roque' },
    ],
  },

  // ──────────────────────────────────────────────
  // PROVINCIA ECLESIÁSTICA DE BAHÍA BLANCA
  // ──────────────────────────────────────────────
  {
    id: 'ar-bahia-blanca',
    name: 'Arquidiócesis de Bahía Blanca',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-bahia-blanca-catedral-nuestra-senora-de-la-merced', name: 'Catedral Nuestra Señora de la Merced' },
      { id: 'ar-bahia-blanca-san-jose', name: 'San José' },
      { id: 'ar-bahia-blanca-santa-teresita-del-nino-jesus', name: 'Santa Teresita del Niño Jesús' },
    ],
  },
  {
    id: 'ar-alto-valle-del-rio-negro',
    name: 'Diócesis de Alto Valle del Río Negro',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-alto-valle-del-rio-negro-catedral-nuestra-senora-del-carmen', name: 'Catedral Nuestra Señora del Carmen', city: 'General Roca' },
    ],
  },
  {
    id: 'ar-viedma',
    name: 'Diócesis de Viedma',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-viedma-catedral-nuestra-senora-de-la-merced', name: 'Catedral Nuestra Señora de la Merced' },
    ],
  },
  {
    id: 'ar-san-carlos-de-bariloche',
    name: 'Diócesis de San Carlos de Bariloche',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-san-carlos-de-bariloche-catedral-nuestra-senora-del-nahuel-huapi', name: 'Catedral Nuestra Señora del Nahuel Huapi' },
    ],
  },
  {
    id: 'ar-rio-gallegos',
    name: 'Diócesis de Río Gallegos',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-rio-gallegos-catedral-nuestra-senora-de-lujan', name: 'Catedral Nuestra Señora de Luján' },
    ],
  },
  {
    id: 'ar-comodoro-rivadavia',
    name: 'Diócesis de Comodoro Rivadavia',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-comodoro-rivadavia-catedral-san-juan-bosco', name: 'Catedral San Juan Bosco' },
    ],
  },
  {
    id: 'ar-rawson',
    name: 'Diócesis de Rawson',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-rawson-catedral-maria-auxiliadora', name: 'Catedral María Auxiliadora', city: 'Trelew' },
    ],
  },
  {
    id: 'ar-santa-rosa',
    name: 'Diócesis de Santa Rosa',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-santa-rosa-catedral-santa-rosa-de-lima', name: 'Catedral Santa Rosa de Lima', city: 'Santa Rosa' },
    ],
  },
  {
    id: 'ar-esquel',
    name: 'Prelatura Territorial de Esquel',
    region: 'Provincia Eclesiástica de Bahía Blanca',
    parishes: [
      { id: 'ar-esquel-catedral-sagrado-corazon-de-jesus', name: 'Catedral del Sagrado Corazón de Jesús', city: 'Esquel' },
    ],
  },
];
