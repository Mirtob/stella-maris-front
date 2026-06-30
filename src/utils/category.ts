import { MassMoment, LiturgicalSeason } from '../types';

/**
 * Mapeo del `mass_moment` (valor en minúscula de la BD / catálogo Supabase) al
 * NOMBRE de categoría que usa toda la app (constructor, ordinario, PDF, reproductor).
 * Los cantos sincronizados llegan con el moment en minúscula; el resto de la app
 * espera el nombre con mayúscula (ej. 'Entrada', 'Comunión').
 */
export const MOMENT_TO_CATEGORY: Record<string, string> = {
  entrada: 'Entrada',
  rito_aspersion: 'Rito de Aspersión',
  kyrie: 'Kyrie',
  gloria: 'Gloria',
  salmo: 'Salmo',
  aleluya: 'Aleluya',
  post_evangelio: 'Post Evangelio',
  respuesta_oracion_universal: 'Respuesta a Oración Universal',
  ofertorio: 'Ofertorio',
  santo: 'Santo',
  aclamacion_consagracion: 'Aclamación Consagración',
  amen_doxologia: 'Amén (Doxología)',
  padre_nuestro: 'Padre Nuestro',
  tuyo_es_el_reino: 'Tuyo es el Reino',
  cordero: 'Cordero de Dios',
  comunion: 'Comunión',
  final: 'Salida',
  exposicion: 'Exposición y Procesión',
  'no-liturgico': 'No litúrgico',
};

/** Devuelve el nombre de categoría. Si ya viene con mayúscula, lo deja igual. */
export function normalizeCategory(category?: string | null): string {
  if (!category) return '';
  return MOMENT_TO_CATEGORY[category] ?? category;
}

/**
 * Inverso: NOMBRE de categoría (rótulo que ven los usuarios / metadata del video) →
 * código `mass_moment` de la BD. Incluye sinónimos/alias litúrgicos que colapsan al
 * conjunto acotado de momentos que admite la columna.
 */
export const CATEGORY_TO_MOMENT: Record<string, MassMoment> = {
  'Entrada':                  'entrada',
  'Kyrie':                    'kyrie',
  'Gloria':                   'gloria',
  'Salmo':                    'salmo',
  'Salmo AT 1-7':             'salmo',
  'Salmo Epistolar':          'salmo',
  'Aleluya':                  'aleluya',
  'Aleluya Triple':           'aleluya',
  'Aclamación al Evangelio':  'aleluya',
  'Secuencia de Pascua':      'aleluya',
  'Secuencia de Pentecostés': 'aleluya',
  'Secuencia de Corpus':      'aleluya',
  'Post Evangelio':              'post_evangelio',
  'Rito de Aspersión':           'rito_aspersion',
  'Respuesta a Oración Universal':'respuesta_oracion_universal',
  'Aclamación Consagración':     'aclamacion_consagracion',
  'Amén (Doxología)':            'amen_doxologia',
  'Tuyo es el Reino':            'tuyo_es_el_reino',
  'Ofertorio':                'ofertorio',
  'Santo':                    'santo',
  'Padre Nuestro':            'padre_nuestro',
  'Cordero de Dios':          'cordero',
  'Comunión':                 'comunion',
  'Salida':                   'final',
  'Kalenda Navideña':         'entrada',
  'Pregón Pascual':           'entrada',
  'Exposición y Procesión':   'exposicion',
  'Exposición':               'exposicion',
  'Adoración':                'no-liturgico',
  'Procesión':                'no-liturgico',
  'Mariano':                  'no-liturgico',
  'Reflexión':                'no-liturgico',
  'Evangelización':           'no-liturgico',
  'Otro':                     'no-liturgico',
};

/** Rótulo de categoría → código mass_moment (default 'no-liturgico'). */
export function categoryToMoment(category?: string | null): MassMoment {
  if (!category) return 'no-liturgico';
  return CATEGORY_TO_MOMENT[category.trim()] ?? 'no-liturgico';
}

/** Rótulo de temporada litúrgica → código canónico de la BD. */
export const SEASON_TO_CANONICAL: Record<string, LiturgicalSeason> = {
  'Adviento':          'adviento',
  'Navidad':           'navidad',
  'Ordinario':         'tiempo-ordinario',
  'Tiempo Ordinario':  'tiempo-ordinario',
  'Cuaresma':          'cuaresma',
  'Semana Santa':      'semana-santa',
  'Pascua':            'pascua',
  'Pentecostés':       'pentecostes',
  'Corpus Christi':    'corpus-christi',
};

/** Rótulo de temporada → código canónico, o null si no corresponde a un tiempo. */
export function seasonToCanonical(label?: string | null): LiturgicalSeason | null {
  if (!label) return null;
  return SEASON_TO_CANONICAL[label.trim()] ?? null;
}
