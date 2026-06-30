/**
 * Canonical identifier for each moment of the Catholic Mass.
 * Used as the primary filter in the song catalog.
 * Maps to the 'mass_moment' column in Supabase.
 */
export type MassMoment =
  | 'entrada'
  | 'rito_aspersion'
  | 'kyrie'
  | 'gloria'
  | 'salmo'
  | 'aleluya'
  | 'post_evangelio'
  | 'respuesta_oracion_universal'
  | 'ofertorio'
  | 'santo'
  | 'aclamacion_consagracion'
  | 'amen_doxologia'
  | 'padre_nuestro'
  | 'tuyo_es_el_reino'
  | 'cordero'
  | 'comunion'
  | 'final'
  | 'exposicion'
  | 'no-liturgico';

/**
 * Canonical identifier for each liturgical season of the Catholic year.
 * A song can belong to multiple seasons (stored as an array in Supabase).
 * Empty array = valid for all seasons.
 */
export type LiturgicalSeason =
  | 'adviento'
  | 'navidad'
  | 'tiempo-ordinario'
  | 'cuaresma'
  | 'semana-santa'
  | 'pascua'
  | 'pentecostes'
  | 'corpus-christi';

/** Human-readable labels for display in filters and forms */
export const MASS_MOMENT_LABELS: Record<MassMoment, string> = {
  entrada:                       'Entrada',
  rito_aspersion:                'Rito de Aspersión',
  kyrie:                         'Kyrie / Acto Penitencial',
  gloria:                        'Gloria',
  salmo:                         'Salmo Responsorial',
  aleluya:                       'Aleluya / Aclamación',
  post_evangelio:                'Post Evangelio',
  respuesta_oracion_universal:   'Respuesta a Oración Universal',
  ofertorio:                     'Ofertorio',
  santo:                         'Santo',
  aclamacion_consagracion:       'Aclamación Consagración',
  amen_doxologia:                'Amén (Doxología)',
  padre_nuestro:                 'Padre Nuestro',
  tuyo_es_el_reino:              'Tuyo es el Reino',
  cordero:                       'Cordero de Dios',
  comunion:                      'Comunión',
  final:                         'Final / Salida',
  exposicion:                    'Exposición y Adoración',
  'no-liturgico':                'No litúrgico',
};

export const LITURGICAL_SEASON_LABELS: Record<LiturgicalSeason, string> = {
  adviento:          'Adviento',
  navidad:           'Navidad',
  'tiempo-ordinario':'Tiempo Ordinario',
  cuaresma:          'Cuaresma',
  'semana-santa':    'Semana Santa',
  pascua:            'Pascua',
  pentecostes:       'Pentecostés',
  'corpus-christi':  'Corpus Christi',
};

export interface Song {
  id: string;
  title: string;
  category: string;
  youtubeId: string;
  videoUrl?: string; // URL completa del video de YouTube
  sheetMusicUrl?: string;
  duration: string;
  artist?: string;
  author?: string;
  version?: 'Coro' | 'Guitarra' | 'Órgano';
  instrument?: 'Coro' | 'Guitarra' | 'Órgano'; // Alias de version para compatibilidad
  massName?: string; // Para agrupar Kyrie, Gloria, Santo, Cordero de la misma misa
  tags?: string[]; // Tags de YouTube para sugerencias según tiempo litúrgico
  thumbnailUrl?: string; // URL del thumbnail del video de YouTube
  uploadedAt?: string; // Fecha de subida
  views?: number; // Visualizaciones (opcional)
  recommendedCategories?: string[]; // Partes de la Misa (nombres) donde TAMBIÉN sirve este canto (derivado de extraMoments)
  extraMoments?: MassMoment[];       // Momentos ADICIONALES de la Misa (códigos) donde sirve, además del principal
  liturgicalSeason?: string; // Tiempo litúrgico recomendado
  lyrics?: string; // Letra del canto con acordes (para guitarristas) o sin acordes
  originalKey?: string; // Tonalidad original del canto (ej: "G", "Am")
  isLiturgical?: boolean; // Si el canto es litúrgico (apropiado para la Misa) o no litúrgico (solo para eventos extra-litúrgicos)
  nonLiturgicalCategory?: 'Adoración' | 'Procesión' | 'Mariano' | 'Reflexión' | 'Evangelización' | 'Otro'; // Categoría para cantos no litúrgicos
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // Estado de aprobación por el administrador
  approvedBy?: string; // ID del administrador que aprobó el canto
  approvedAt?: string; // Fecha de aprobación
  rejectionReason?: string; // Razón de rechazo si fue rechazado
  // ── Campos del catálogo Supabase (nuevos) ──────────────────────────────
  massMoment?: MassMoment;           // Momento canónico de la Misa (reemplaza 'category' a largo plazo)
  liturgicalSeasons?: LiturgicalSeason[]; // Tiempos litúrgicos válidos (array; vacío = todos)
  driveFileId?: string;              // ID del archivo en Google Drive (en vez de URL completa)
}

export type UserRole = 'Coro' | 'Pueblo fiel' | 'Admin';
export type InstrumentType = 'Guitarra' | 'Órgano';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  instruments?: InstrumentType[]; // Arreglo de instrumentos que el coro puede usar
  instrument?: InstrumentType; // Mantener por compatibilidad, pero ahora se usa instruments[]
  photoUrl?: string;
  parishName?: string; // Parroquia única (compatibilidad retroactiva)
  parishes?: string[]; // Arreglo de parroquias que el usuario pertenece (multi-parroquia)
  activeParishName?: string; // Parroquia activa en esta sesión
  activeRole?: UserRole; // Rol efectivo en esta sesión (Coro puede participar como Pueblo fiel en otra parroquia)
  lastSessionRole?: UserRole;  // Rol elegido en la sesión anterior — persiste tras logout para sugerirlo en el próximo dialog
  lastSessionParish?: string;  // Parroquia elegida en la sesión anterior — persiste tras logout
  recoveryEmail?: string;      // T13 — Email alternativo para recuperación de cuenta. Solo lo usa el admin en flujos de recovery.
}

/** Tipo de horario litúrgico de una Misa de domingo/solemnidad de precepto. */
export type MassType = 'visperas_i' | 'dia' | 'visperas_ii';

export interface PublishedCantoral {
  id: string;
  choirId: string;
  choirName: string;
  parishName: string;
  date: string; // Fecha calendario (para una Misa vespertina, la víspera por la tarde)
  liturgicalDate: string; // Calendario litúrgico (ej: "1er Domingo de Adviento")
  massTime: string; // Horario de la Misa (ej: "10:00 AM")
  /**
   * Tipo de horario litúrgico (domingos y solemnidades de precepto):
   *  - 'visperas_i'  → I Vísperas: tarde del día ANTERIOR (15:00–23:59). `date` = día anterior.
   *  - 'dia'         → Misa del día: mismo día, 00:00–15:00.
   *  - 'visperas_ii' → II Vísperas: mismo día, 15:01–23:59.
   * `liturgicalDate` siempre mantiene la celebración del día.
   */
  massType?: MassType;
  /** DEPRECATED: equivale a massType === 'visperas_i'. Se mantiene por compatibilidad. */
  vigil?: boolean;
  songs: Song[];
  createdAt: string;
  publishedBy?: string;
  publishedAt?: string;
  status: 'draft' | 'published'; // Estado del cantoral
  isDraft?: boolean; // DEPRECATED: usar 'status'
  isSuggestion?: boolean; // Si es una sugerencia del sistema
  pdfUrl?: string; // URL pública del PDF generado en Supabase Storage
  garland?: string; // Id de la guirnalda elegida para adornar el folleto PDF (ver data/garlands)
  pdfFont?: string; // Id de la fuente del folleto PDF (ver data/pdfStyle)
  pdfSize?: string; // Id del tamaño/escala del folleto PDF (ver data/pdfStyle)
}