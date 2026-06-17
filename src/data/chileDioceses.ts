export interface Chapel {
  id: string;
  name: string;
  address?: string;
}

export interface Parish {
  id: string;
  name: string;
  address?: string;
  city?: string;
  chapels?: Chapel[];
}

export interface Diocese {
  id: string;
  name: string;
  region: string;
  parishes: Parish[];
}

// Diócesis de Chile organizadas por región
export const chileDioceses: Diocese[] = [
  // REGIÓN DE ARICA Y PARINACOTA
  {
    id: 'arica',
    name: 'Diócesis de Arica',
    region: 'Arica y Parinacota',
    parishes: [
      { id: 'pu-idelfonso', name: 'Parroquia San Idelfonso (Putre)', city: 'Putre' },
      { id: 'pu-jeronimo', name: 'Parroquia San Jerónimo (Valle de Lluta)', city: 'Valle de Lluta' },
      { id: 'pu-miguel', name: 'Parroquia San Miguel Arcángel (Valle de Azapa)', city: 'Valle de Azapa' },
      { id: 'pu-carmen', name: 'Parroquia Virgen del Carmen (Belén)', city: 'Putre' },
      { id: 'ar-tours', name: 'Parroquia San Miguel de Tours (Codpa)', city: 'Camarones' },
      { id: 'ar-esteban', name: 'Parroquia San Esteban (Tacora 1)', city: 'Arica' },
      { id: 'ar-inmaculada', name: 'Parroquia Inmaculada Concepción (Perez Zucovic)', city: 'Arica' },
      { id: 'ar-hermano', name: 'Parroquia Cristo hermano de los hombres (Tacora 1)', city: 'Arica' },
      { id: 'ar-pedro', name: 'Parroquia san Pedro (Porvenir)', city: 'Arica' },
      { id: 'ar-resurreccion', name: 'Parroquia La Resurrección (Industriales 4)', city: 'Arica' },
      { id: 'ar-rosario', name: 'Parroquia Nuestra Señora del Rosario de las Peñas (Baquedano)', city: 'Arica' },
      { id: 'arica-sagrada', name: 'Parroquia Sagrada Familia (Templo)', city: 'Arica' },
      { id: 'arica-tucapel', name: 'Parroquia Nuestra Señora del Carmen (Tucapel)', city: 'Arica' },
      { id: 'arica-pablo', name: 'Parroquia San Pablo (Poblacion Frei)', city: 'Arica' },
      { id: 'arica-salvador', name: 'Parroquia Cristo Salvador (Poblacion Cabo Aroca)', city: 'Arica' },
      { id: 'arica-jose', name: 'Parroquia San José Obrero (Quiane)', city: 'Arica' },
      { id: 'arica-catedral', name: 'Catedral San Marcos de Arica (catedral)', city: 'Arica' },
      { id: 'arica-ignacio', name: 'Parroquia San Ignacio de Loyola (Pablo Picasso)', city: 'Arica' },
      { id: 'arica-anunciacion', name: 'Parroquia La Anunciación (Terminal Agro)', city: 'Arica' },
      { id: 'arica-juan', name: 'Parroquia San Juan Bosco (18 de septiembre)', city: 'Arica' },
      { id: 'arica-sagrado', name: 'Parroquia Sagrado Corazón (Jose Miguel Carrera)', city: 'Arica' },
      { id: 'arica-jesus', name: 'Parroquia Jesus de Nazaret (Cerro la Cruz)', city: 'Arica' },
    ]
  },

  // REGIÓN DE TARAPACÁ
  {
    id: 'iquique',
    name: 'Diócesis de Iquique',
    region: 'Tarapacá',
    parishes: [
      { id: 'iquique-catedral', name: 'Catedral Nuestra Señora del Carmen', city: 'Iquique' },
      { id: 'iquique-concepcion', name: 'Parroquia Inmaculada Concepción', city: 'Iquique' },
      { id: 'iquique-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'Iquique' },
      { id: 'iquique-pedro', name: 'Parroquia San Pedro', city: 'Iquique' },
      { id: 'alto-hospicio', name: 'Parroquia San Francisco de Asís', city: 'Alto Hospicio' },
      { id: 'pica', name: 'Parroquia San Andrés', city: 'Pica' },
      { id: 'pozo-almonte', name: 'Parroquia Santa Rosa de Lima', city: 'Pozo Almonte' },
    ]
  },

  // REGIÓN DE ANTOFAGASTA
  {
    id: 'antofagasta',
    name: 'Arquidiócesis de Antofagasta',
    region: 'Antofagasta',
    parishes: [
      { id: 'anto-transfiguracion', name: 'Parroquia La Transfiguración del Señor', city: 'Antofagasta' },
      { id: 'anto-madre-dios', name: 'Parroquia Madre de Dios', city: 'Antofagasta' },
      { id: 'anto-fatima', name: 'Parroquia Nuestra Señora del Rosario de Fátima', city: 'Antofagasta' },
      { id: 'anto-inmaculada', name: 'Parroquia Inmaculada Concepción (Basílica Corazón de María)', city: 'Antofagasta' },
      { id: 'anto-catedral', name: 'Catedral San José', city: 'Antofagasta' },
      { id: 'anto-lourdes', name: 'Santuario Nuestra Señora de Lourdes', city: 'Antofagasta' },
      { id: 'anto-san-francisco', name: 'Parroquia San Francisco', city: 'Antofagasta' },
      { id: 'anto-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Antofagasta' },
      { id: 'anto-buen-pastor', name: 'Parroquia Buen Pastor', city: 'Antofagasta' },
      { id: 'anto-merced', name: 'Parroquia Nuestra Señora de la Merced', city: 'Antofagasta' },
      { id: 'anto-doce-apostoles', name: 'Parroquia Los Doce Apóstoles', city: 'Antofagasta' },
      { id: 'anto-cristo-redentor', name: 'Parroquia Cristo Redentor', city: 'Antofagasta' },
      { id: 'anto-san-pablo', name: 'Parroquia San Pablo', city: 'Antofagasta' },
      { id: 'anto-guadalupe', name: 'Parroquia Nuestra Señora de Guadalupe', city: 'Antofagasta' },
      { id: 'anto-esperanza', name: 'Parroquia Nuestra Señora de La Esperanza', city: 'Antofagasta' },
      { id: 'anto-mejillones', name: 'Parroquia Corazón de María', city: 'Mejillones' },
      { id: 'anto-tocopilla-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Tocopilla' },
      { id: 'anto-tocopilla-sagrado', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Tocopilla' },
      { id: 'anto-taltal', name: 'Parroquia San Francisco Javier', city: 'Taltal' },
      { id: 'anto-maria-elena', name: 'Parroquia San Rafael Arcángel', city: 'María Elena' },
      { id: 'anto-baquedano', name: 'Parroquia Jesús Crucificado', city: 'Baquedano' },
    ]
  },

  {
    id: 'calama',
    name: 'Diócesis de San Juan Bautista de Calama',
    region: 'Antofagasta',
    parishes: [
      { id: 'cal-catedral', name: 'Catedral San Juan Bautista', city: 'Calama' },
      { id: 'cal-lourdes', name: 'Parroquia Nuestra Señora de Lourdes', city: 'Calama' },
      { id: 'cal-ayquina', name: 'Parroquia Guadalupe de Ayquina', city: 'Ayquina' },
      { id: 'cal-san-jose-obrero', name: 'Parroquia San José Obrero', city: 'Calama' },
      { id: 'cal-san-pablo', name: 'Parroquia San Pablo', city: 'Calama' },
      { id: 'cal-asuncion', name: 'Parroquia Asunción de la Virgen', city: 'Calama' },
      { id: 'cal-merced', name: 'Parroquia Nuestra Señora de la Merced', city: 'Calama' },
      { id: 'cal-jesus-obrero', name: 'Parroquia Jesús Obrero', city: 'Calama' },
      { id: 'cal-el-salvador', name: 'Parroquia El Salvador', city: 'Calama' },
      { id: 'cal-chiu-chiu', name: 'Parroquia San Francisco de Asís de Chiu Chiu', city: 'Chiu Chiu' },
      { id: 'cal-san-pedro', name: 'Parroquia San Pedro de Atacama', city: 'San Pedro de Atacama' },
    ]
  },
  // REGIÓN DE ATACAMA
  {
    id: 'copiapo',
    name: 'Diócesis de Copiapó',
    region: 'Atacama',
    parishes: [
      { id: 'copiapo-catedral', name: 'Catedral Nuestra Señora del Rosario', city: 'Copiapó' },
      { id: 'copiapo-candelaria', name: 'Parroquia Nuestra Señora de la Candelaria', city: 'Copiapó' },
      { id: 'copiapo-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'Copiapó' },
      { id: 'vallenar', name: 'Parroquia Nuestra Señora del Rosario', city: 'Vallenar' },
      { id: 'chanaral', name: 'Parroquia San Vicente Ferrer', city: 'Chañaral' },
      { id: 'caldera', name: 'Parroquia San Vicente de Paul', city: 'Caldera' },
      { id: 'diego-almagro', name: 'Parroquia Nuestra Señora de Fátima', city: 'Diego de Almagro' },
    ]
  },

  // REGIÓN DE COQUIMBO
  {
    id: 'la-serena',
    name: 'Arquidiócesis de La Serena',
    region: 'Coquimbo',
    parishes: [
      { id: 'serena-catedral', name: 'Catedral de La Serena', city: 'La Serena' },
      { id: 'serena-san-francisco', name: 'Parroquia San Francisco', city: 'La Serena' },
      { id: 'serena-santo-domingo', name: 'Parroquia Santo Domingo', city: 'La Serena' },
      { id: 'serena-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'La Serena' },
      { id: 'coquimbo', name: 'Parroquia Nuestra Señora de Andacollo', city: 'Coquimbo' },
      { id: 'ovalle', name: 'Parroquia Nuestra Señora de la Merced', city: 'Ovalle' },
      { id: 'vicuna', name: 'Parroquia Nuestra Señora de la Merced', city: 'Vicuña' },
      { id: 'illapel', name: 'Parroquia Nuestra Señora del Rosario', city: 'Illapel' },
      { id: 'andacollo', name: 'Santuario de Andacollo', city: 'Andacollo' },
    ]
  },

  // REGIÓN DE VALPARAÍSO
  {
    id: 'valparaiso',
    name: 'Arquidiócesis de Valparaíso',
    region: 'Valparaíso',
    parishes: [
      { id: 'valpo-matriz', name: 'Iglesia Matriz del Salvador', city: 'Valparaíso' },
      { id: 'valpo-12-apostoles', name: 'Parroquia de los Doce Apóstoles', city: 'Valparaíso' },
      { id: 'valpo-espiritu', name: 'Parroquia Espíritu Santo', city: 'Valparaíso' },
      { id: 'valpo-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'Valparaíso' },
      { id: 'vina-mar', name: 'Parroquia Nuestra Señora de Dolores', city: 'Viña del Mar' },
      { id: 'quilpue', name: 'Parroquia San Pedro', city: 'Quilpué' },
      { id: 'quillota', name: 'Parroquia San Martín de Tours', city: 'Quillota' },
      { id: 'san-felipe', name: 'Parroquia Nuestra Señora de la Merced', city: 'San Felipe' },
      { id: 'los-andes', name: 'Parroquia Santa Rosa de Los Andes', city: 'Los Andes' },
      { id: 'casablanca', name: 'Parroquia Nuestra Señora del Carmen', city: 'Casablanca' },
    ]
  },

  {
    id: 'san-felipe',
    name: 'Diócesis de San Felipe',
    region: 'Valparaíso',
    parishes: [
      { id: 'sf-catedral', name: 'Catedral Nuestra Señora de la Merced', city: 'San Felipe' },
      { id: 'sf-andres', name: 'Parroquia San Andrés', city: 'San Felipe' },
      { id: 'andes', name: 'Parroquia Santa Rosa de Los Andes', city: 'Los Andes' },
      { id: 'la-ligua', name: 'Parroquia La Asunción', city: 'La Ligua' },
      { id: 'petorca', name: 'Parroquia San Antonio de Petorca', city: 'Petorca' },
      { id: 'cabildo', name: 'Parroquia Santa Teresa de Los Andes', city: 'Cabildo' },
    ]
  },

  // REGIÓN METROPOLITANA
  {
    id: 'santiago',
    name: 'Arquidiócesis de Santiago',
    region: 'Metropolitana',
    parishes: [
      { id: 'catedral-santiago', name: 'Catedral Metropolitana de Santiago', city: 'Santiago Centro' },
      { id: 'recoleta-franciscana', name: 'Iglesia de la Recoleta Franciscana', city: 'Recoleta' },
      { id: 'san-francisco', name: 'Iglesia de San Francisco', city: 'Santiago Centro' },
      { id: 'santo-domingo', name: 'Iglesia de Santo Domingo', city: 'Santiago Centro' },
      { id: 'san-agustin', name: 'Iglesia de San Agustín', city: 'Santiago Centro' },
      { id: 'santa-ana', name: 'Parroquia Santa Ana', city: 'Santiago Centro' },
      { id: 'providencia-pedro-pablo', name: 'Parroquia San Pedro y San Pablo', city: 'Providencia' },
      { id: 'las-condes-kennedy', name: 'Parroquia Nuestra Señora de Kennedy', city: 'Las Condes' },
      { id: 'las-condes-andacollo', name: 'Parroquia Nuestra Señora de Andacollo', city: 'Las Condes' },
      { id: 'nunoa-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Ñuñoa' },
      { id: 'nunoa-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'Ñuñoa' },
      { id: 'la-florida-jose', name: 'Parroquia San José', city: 'La Florida' },
      { id: 'maipu-carmen', name: 'Templo Votivo de Maipú', city: 'Maipú' },
      { id: 'pudahuel', name: 'Parroquia San Francisco de Asís', city: 'Pudahuel' },
      { id: 'cerrillos', name: 'Parroquia San Luis Beltrán', city: 'Cerrillos' },
      { id: 'estacion-central', name: 'Parroquia Santa Filomena', city: 'Estación Central' },
      { id: 'quinta-normal', name: 'Parroquia San Luis Gonzaga', city: 'Quinta Normal' },
      { id: 'renca', name: 'Parroquia Nuestra Señora de la Divina Providencia', city: 'Renca' },
      { id: 'quilicura', name: 'Parroquia San Pablo', city: 'Quilicura' },
      { id: 'colina', name: 'Parroquia Santa Rosa de Lima', city: 'Colina' },
      { id: 'lampa', name: 'Parroquia Nuestra Señora del Rosario', city: 'Lampa' },
      { id: 'puente-alto', name: 'Parroquia Nuestra Señora de la Merced', city: 'Puente Alto' },
      { id: 'san-bernardo', name: 'Parroquia San Bernardo Abad', city: 'San Bernardo' },
      { id: 'buin', name: 'Parroquia Nuestra Señora de las Mercedes', city: 'Buin' },
      { id: 'paine', name: 'Parroquia San Saturnino', city: 'Paine' },
      { id: 'talagante', name: 'Parroquia Nuestra Señora del Carmen', city: 'Talagante' },
      { id: 'melipilla', name: 'Parroquia San José', city: 'Melipilla' },
    ]
  },

  {
    id: 'san-bernardo',
    name: 'Diócesis de San Bernardo',
    region: 'Metropolitana',
    parishes: [
      { id: 'lp-ascension', name: 'Parroquia la Ascensión del Señor (La Pintana)', city: 'La Pintana' },
      { id: 'lp-ricardo', name: 'Parroquia San Ricardo (La Pintana)', city: 'La Pintana' },
      { id: 'lp-huerto', name: 'Parroquia Nuestra Señor del Huerto (La Pintana)', city: 'La Pintana' },
      { id: 'lp-reconciliacion', name: 'Parroquia Nuestra Señora de la Reconciliación (La Pintana)', city: 'La Pintana' },
      { id: 'lp-pastor', name: 'Parroquia Jesús el Buen Pastor (La Pintana)', city: 'La Pintana' },
      { id: 'lp-josemaria', name: 'Iglesia Rectoral san Josemaría Escrivá de Balaguer (La Pintana)', city: 'La Pintana' },
      { id: 'mp-inmaculada', name: 'Santuario Inmaculada Concepción (Maipo)', city: 'Maipo' },
      { id: 'buin-centro', name: 'Parroquia Santos Angeles custodios (Plaza de armas)', city: 'Buin' },
      { id: 'buin-norte', name: 'Parroquia San José Patriarca de la Esperanza (Nuevo Buin)', city: 'Buin' },
      { id: 'aj-corpus', name: 'Parroquia Corpus Christi (Alto Jahuel)', city: 'Alto Jahuel' },
      { id: 'lin-familia', name: 'Parroquia Sagrada familia (Linderos)', city: 'Linderos' },
      { id: 'vdp-rosario', name: 'Parroquia Virgen del Rosario (Valdivia de Paine)', city: 'Valdivia de Paine' },
      { id: 'buin-sur', name: 'Parroquia Sagrado Corazón de Jesús (Villaseca)', city: 'Buin' },
      { id: 'paine-santa-maria-virgen', name: 'Parroquia Santa Maria Virgen (Paine)', city: 'Paine' },
      { id: 'hul-avila', name: 'Parroquia Santa Teresa de Ávila (Huelquen)', city: 'Huelquen' },
      { id: 'hos-carmen', name: 'Parroquia Nuestra Señora del Carmen (Hospital)', city: 'Hospital' },
      { id: 'ch-guadalupe', name: 'Parroquia Nuestra Señora de Guadalupe (Champa)', city: 'Champa' },
      { id: 'pin-jose', name: 'Parroquia San José (Pintue)', city: 'Pintue' },
      { id: 'calera-agustin', name: 'Parroquia San Agustín (Calera de Tango)', city: 'Calera de Tango' },
      { id: 'eb-marcos', name: 'Parroquia San Marcos (El Bosque)', city: 'El Bosque' },
      { id: 'eb-espiritu-santo', name: 'Parroquia Espíritu Santo (El Bosque)', city: 'El Bosque' },
      { id: 'eb-teresa', name: 'Parroquia Santa Teresa de los andes (El Bosque)', city: 'El Bosque' },
      { id: 'eb-molino', name: 'Parroquia Nuestra Señora del Molino (El Bosque)', city: 'El Bosque' },
      { id: 'eb-carmen', name: 'Parroquia Nuestra del Carmen (Gran Avenida)', city: 'El Bosque' },
      { id: 'eb-dolores', name: 'Parroquia Nuestra Señora de Los Dolores, María Madre de la Iglesia (El Bosque)', city: 'El Bosque' },
      { id: 'sb-catedral', name: 'Parroquia San Bernardo, catedral (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-angeles', name: 'Parroquia Nuestra Señora de los Ángeles (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-rosario', name: 'Parroquia Nuestra Señora del Rosario (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-lourdes', name: 'Parroquia Nuestra Señora de Lourdes (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-trinidad', name: 'Parroquia Santísima Trinidad (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-misericordia', name: 'Parroquia Nuestra Señora de la Misericordia (Lo Herrera)', city: 'San Bernardo' },
      { id: 'sb-redentor', name: 'Parroquia Santísimo Redentor (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-clemente', name: 'Parroquia San Clemente (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-fatima', name: 'Parroquia Nuestra Señora del Rosario de Fátima (Plaza Guarello)', city: 'San Bernardo' },
      { id: 'sb-victor', name: 'Parroquia San Víctor (Maestranza)', city: 'San Bernardo' },
      { id: 'sb-edmundo', name: 'Parroquia San Edmundo, rey y mártir (Los Morros)', city: 'San Bernardo' },  
      { id: 'sb-vicente', name: 'Parroquia San Vicente de Paul (El Manzano)', city: 'San Bernardo' },
      { id: 'sb-camilo', name: 'Parroquia San Camillo de Lellis (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-magdalena', name: 'Parroquia Santa María Magdalena (San Bernardo)', city: 'San Bernardo' },
      { id: 'sb-ignacio', name: 'Parroquia San Ignacio de Loyola (Avda. America)', city: 'San Bernardo' },
      { id: 'sb-divino', name: 'Parroquia Divino Maestro (San Bernardo)', city: 'San Bernardo' },
      { id: 'pirque-santisimo', name: 'Parroquia Santisímo Sacramento (Pirque)', city: 'Pirque' },
           
    ]
  },

  {
    id: 'melipilla',
    name: 'Diócesis de Melipilla',
    region: 'Metropolitana',
    parishes: [
      { id: 'meli-catedral', name: 'Catedral San José', city: 'Melipilla' },
      { id: 'meli-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Melipilla' },
      { id: 'talagante-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Talagante' },
      { id: 'isla-maipo', name: 'Parroquia Nuestra Señora de la Merced', city: 'Isla de Maipo' },
      { id: 'curacavi', name: 'Parroquia Nuestra Señora de la Merced', city: 'Curacaví' },
      { id: 'maria-pinto', name: 'Parroquia Nuestra Señora de la Merced', city: 'María Pinto' },
    ]
  },

  // REGIÓN DE O'HIGGINS
  {
    id: 'rancagua',
    name: 'Diócesis de Rancagua',
    region: "O'Higgins",
    parishes: [
      { id: 'rancagua-catedral', name: 'Catedral Nuestra Señora de la Merced', city: 'Rancagua' },
      { id: 'rancagua-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Rancagua' },
      { id: 'rancagua-sagrario', name: 'Parroquia El Sagrario', city: 'Rancagua' },
      { id: 'san-fernando', name: 'Parroquia San Fernando Rey', city: 'San Fernando' },
      { id: 'santa-cruz', name: 'Parroquia Santa Cruz', city: 'Santa Cruz' },
      { id: 'rengo', name: 'Parroquia Nuestra Señora de la Merced', city: 'Rengo' },
      { id: 'machali', name: 'Parroquia San José', city: 'Machalí' },
      { id: 'graneros', name: 'Parroquia Santa Filomena', city: 'Graneros' },
      { id: 'pichilemu', name: 'Parroquia Nuestra Señora de la Gracia', city: 'Pichilemu' },
    ]
  },

  // REGIÓN DEL MAULE
  {
    id: 'talca',
    name: 'Diócesis de Talca',
    region: 'Maule',
    parishes: [
      { id: 'talca-catedral', name: 'Catedral de Talca', city: 'Talca' },
      { id: 'talca-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Talca' },
      { id: 'talca-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Talca' },
      { id: 'curico', name: 'Parroquia San Francisco de Asís', city: 'Curicó' },
      { id: 'molina', name: 'Parroquia Nuestra Señora de las Mercedes', city: 'Molina' },
      { id: 'linares', name: 'Parroquia San Ambrosio', city: 'Linares' },
      { id: 'parral', name: 'Parroquia San José', city: 'Parral' },
      { id: 'constitucion', name: 'Parroquia Nuestra Señora de la Asunción', city: 'Constitución' },
    ]
  },

  {
    id: 'linares',
    name: 'Diócesis de Linares',
    region: 'Maule',
    parishes: [
      { id: 'lin-catedral', name: 'Catedral San Ambrosio', city: 'Linares' },
      { id: 'lin-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Linares' },
      { id: 'parral-jose', name: 'Parroquia San José', city: 'Parral' },
      { id: 'cauquenes', name: 'Parroquia Nuestra Señora de las Mercedes', city: 'Cauquenes' },
      { id: 'chanco', name: 'Parroquia Nuestra Señora de las Mercedes', city: 'Chanco' },
    ]
  },

  {
    id: 'curico',
    name: 'Diócesis de Curicó',
    region: 'Maule',
    parishes: [
      { id: 'cur-catedral', name: 'Catedral San Francisco de Asís', city: 'Curicó' },
      { id: 'cur-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Curicó' },
      { id: 'molina-mercedes', name: 'Parroquia Nuestra Señora de las Mercedes', city: 'Molina' },
      { id: 'teno', name: 'Parroquia Nuestra Señora de la Merced', city: 'Teno' },
      { id: 'rauco', name: 'Parroquia San Francisco de Asís', city: 'Rauco' },
    ]
  },

  // REGIÓN DEL ÑUBLE
  {
    id: 'chillan',
    name: 'Diócesis de Chillán',
    region: 'Ñuble',
    parishes: [
      { id: 'chillan-catedral', name: 'Catedral de Chillán', city: 'Chillán' },
      { id: 'chillan-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Chillán' },
      { id: 'chillan-francisco', name: 'Parroquia San Francisco', city: 'Chillán' },
      { id: 'san-carlos', name: 'Parroquia San Carlos Borromeo', city: 'San Carlos' },
      { id: 'quirihue', name: 'Parroquia San Gregorio Magno', city: 'Quirihue' },
      { id: 'bulnes', name: 'Parroquia Santa Cruz', city: 'Bulnes' },
      { id: 'chillan-viejo', name: 'Parroquia Nuestra Señora de la Merced', city: 'Chillán Viejo' },
    ]
  },

  // REGIÓN DEL BÍO-BÍO
  {
    id: 'concepcion',
    name: 'Arquidiócesis de Concepción',
    region: 'Biobío',
    parishes: [
      { id: 'conce-catedral', name: 'Catedral de Concepción', city: 'Concepción' },
      { id: 'conce-sagrario', name: 'Parroquia El Sagrario', city: 'Concepción' },
      { id: 'conce-universidad', name: 'Parroquia Universitaria Cristo Rey', city: 'Concepción' },
      { id: 'talcahuano', name: 'Parroquia San Vicente de Paul', city: 'Talcahuano' },
      { id: 'tome', name: 'Parroquia San José', city: 'Tomé' },
      { id: 'penco', name: 'Parroquia Nuestra Señora de la Asunción', city: 'Penco' },
      { id: 'coronel', name: 'Parroquia San Pedro', city: 'Coronel' },
      { id: 'lota', name: 'Parroquia San Matías', city: 'Lota' },
      { id: 'hualpen', name: 'Parroquia Nuestra Señora de la Asunción', city: 'Hualpén' },
      { id: 'san-pedro', name: 'Parroquia San Pedro de la Paz', city: 'San Pedro de la Paz' },
    ]
  },

  {
    id: 'los-angeles',
    name: 'Diócesis de Los Ángeles',
    region: 'Biobío',
    parishes: [
      { id: 'la-catedral', name: 'Catedral de Los Ángeles', city: 'Los Ángeles' },
      { id: 'la-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Los Ángeles' },
      { id: 'nacimiento', name: 'Parroquia Nuestra Señora de la Merced', city: 'Nacimiento' },
      { id: 'mulchen', name: 'Parroquia Nuestra Señora del Rosario', city: 'Mulchén' },
      { id: 'santa-barbara', name: 'Parroquia Santa Bárbara', city: 'Santa Bárbara' },
      { id: 'angol', name: 'Parroquia San Buenaventura', city: 'Angol' },
      { id: 'collipulli', name: 'Parroquia Nuestra Señora del Carmen', city: 'Collipulli' },
    ]
  },

  // REGIÓN DE LA ARAUCANÍA
  {
    id: 'temuco',
    name: 'Diócesis de Temuco',
    region: 'Araucanía',
    parishes: [
      { id: 'temuco-catedral', name: 'Catedral de Temuco', city: 'Temuco' },
      { id: 'temuco-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Temuco' },
      { id: 'temuco-francisco', name: 'Parroquia San Francisco', city: 'Temuco' },
      { id: 'villarrica', name: 'Parroquia Nuestra Señora del Carmen', city: 'Villarrica' },
      { id: 'pucon', name: 'Parroquia Nuestra Señora de la Asunción', city: 'Pucón' },
      { id: 'lautaro', name: 'Parroquia San José', city: 'Lautaro' },
      { id: 'nueva-imperial', name: 'Parroquia Inmaculada Concepción', city: 'Nueva Imperial' },
      { id: 'pitrufquen', name: 'Parroquia San Sebastián', city: 'Pitrufquén' },
    ]
  },

  {
    id: 'villarrica',
    name: 'Diócesis de Villarrica',
    region: 'Araucanía',
    parishes: [
      { id: 'vill-catedral', name: 'Catedral Nuestra Señora del Carmen', city: 'Villarrica' },
      { id: 'vill-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Villarrica' },
      { id: 'pucon-asuncion', name: 'Parroquia Nuestra Señora de la Asunción', city: 'Pucón' },
      { id: 'curarrehue', name: 'Parroquia San Sebastián', city: 'Curarrehue' },
      { id: 'cunco', name: 'Parroquia San José', city: 'Cunco' },
    ]
  },

  // REGIÓN DE LOS RÍOS
  {
    id: 'valdivia',
    name: 'Diócesis de Valdivia',
    region: 'Los Ríos',
    parishes: [
      { id: 'valdivia-catedral', name: 'Catedral Nuestra Señora del Rosario', city: 'Valdivia' },
      { id: 'valdivia-francisco', name: 'Parroquia San Francisco', city: 'Valdivia' },
      { id: 'valdivia-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Valdivia' },
      { id: 'la-union', name: 'Parroquia Nuestra Señora de la Asunción', city: 'La Unión' },
      { id: 'rio-bueno', name: 'Parroquia San José', city: 'Río Bueno' },
      { id: 'panguipulli', name: 'Parroquia San Sebastián', city: 'Panguipulli' },
      { id: 'futrono', name: 'Parroquia Nuestra Señora del Carmen', city: 'Futrono' },
    ]
  },

  // REGIÓN DE LOS LAGOS
  {
    id: 'puerto-montt',
    name: 'Diócesis de Puerto Montt',
    region: 'Los Lagos',
    parishes: [
      { id: 'pm-catedral', name: 'Catedral de Puerto Montt', city: 'Puerto Montt' },
      { id: 'pm-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Puerto Montt' },
      { id: 'pm-francisco', name: 'Parroquia San Francisco Javier', city: 'Puerto Montt' },
      { id: 'puerto-varas', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Puerto Varas' },
      { id: 'osorno', name: 'Parroquia San Mateo', city: 'Osorno' },
      { id: 'ancud', name: 'Parroquia Nuestra Señora de Gracia', city: 'Ancud' },
      { id: 'castro', name: 'Parroquia San Francisco', city: 'Castro' },
      { id: 'quellon', name: 'Parroquia Nuestra Señora del Rosario', city: 'Quellón' },
    ]
  },

  {
    id: 'ancud',
    name: 'Diócesis de Ancud',
    region: 'Los Lagos',
    parishes: [
      { id: 'anc-catedral', name: 'Catedral Nuestra Señora de Gracia', city: 'Ancud' },
      { id: 'anc-carmen', name: 'Parroquia Nuestra Señora del Carmen', city: 'Ancud' },
      { id: 'castro-francisco', name: 'Parroquia San Francisco', city: 'Castro' },
      { id: 'quellon-rosario', name: 'Parroquia Nuestra Señora del Rosario', city: 'Quellón' },
      { id: 'achao', name: 'Parroquia Santa María de Achao', city: 'Achao' },
      { id: 'dalcahue', name: 'Parroquia Nuestra Señora de los Dolores', city: 'Dalcahue' },
    ]
  },

  {
    id: 'osorno',
    name: 'Diócesis de Osorno',
    region: 'Los Lagos',
    parishes: [
      { id: 'oso-catedral', name: 'Catedral San Mateo', city: 'Osorno' },
      { id: 'oso-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Osorno' },
      { id: 'oso-francisco', name: 'Parroquia San Francisco', city: 'Osorno' },
      { id: 'purranque', name: 'Parroquia San Judas Tadeo', city: 'Purranque' },
      { id: 'rio-negro', name: 'Parroquia Nuestra Señora del Rosario', city: 'Río Negro' },
      { id: 'san-pablo', name: 'Parroquia San Pablo', city: 'San Pablo' },
    ]
  },

  // REGIÓN DE AYSÉN
  {
    id: 'aysen',
    name: 'Diócesis de Aysén',
    region: 'Aysén',
    parishes: [
      { id: 'coyhaique-catedral', name: 'Catedral de Coyhaique', city: 'Coyhaique' },
      { id: 'coyhaique-corazon', name: 'Parroquia Sagrado Corazón de Jesús', city: 'Coyhaique' },
      { id: 'puerto-aysen', name: 'Parroquia Nuestra Señora del Rosario', city: 'Puerto Aysén' },
      { id: 'puerto-cisnes', name: 'Parroquia San Rafael', city: 'Puerto Cisnes' },
      { id: 'chile-chico', name: 'Parroquia Nuestra Señora del Rosario', city: 'Chile Chico' },
      { id: 'cochrane', name: 'Parroquia San José', city: 'Cochrane' },
    ]
  },

  // REGIÓN DE MAGALLANES
  {
    id: 'punta-arenas',
    name: 'Diócesis de Punta Arenas',
    region: 'Magallanes y Antártica Chilena',
    parishes: [
      { id: 'pa-catedral', name: 'Catedral Sagrado Corazón de Jesús', city: 'Punta Arenas' },
      { id: 'pa-fatima', name: 'Parroquia Nuestra Señora de Fátima', city: 'Punta Arenas' },
      { id: 'pa-saleciana', name: 'Parroquia María Auxiliadora', city: 'Punta Arenas' },
      { id: 'puerto-natales', name: 'Parroquia Nuestra Señora del Carmen', city: 'Puerto Natales' },
      { id: 'porvenir', name: 'Parroquia Nuestra Señora del Carmen', city: 'Porvenir' },
      { id: 'puerto-williams', name: 'Parroquia Nuestra Señora de la Candelaria', city: 'Puerto Williams' },
    ]
  },
];

// Función para obtener todas las parroquias de una diócesis
export function getParishesByDiocese(dioceseId: string): Parish[] {
  const diocese = chileDioceses.find(d => d.id === dioceseId);
  return diocese ? diocese.parishes : [];
}

// Función para obtener todas las capillas de una parroquia
export function getChapelsByParish(dioceseId: string, parishId: string): Chapel[] {
  const diocese = chileDioceses.find(d => d.id === dioceseId);
  if (!diocese) return [];
  
  const parish = diocese.parishes.find(p => p.id === parishId);
  return parish?.chapels || [];
}

// Función para buscar parroquias por nombre
export function searchParishes(searchTerm: string): { diocese: Diocese; parish: Parish }[] {
  const results: { diocese: Diocese; parish: Parish }[] = [];
  
  chileDioceses.forEach(diocese => {
    diocese.parishes.forEach(parish => {
      if (
        parish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parish.city?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        results.push({ diocese, parish });
      }
    });
  });
  
  return results;
}
