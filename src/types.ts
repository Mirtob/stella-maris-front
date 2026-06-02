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
  recommendedCategories?: string[]; // Partes de la Misa donde se recomienda usar este canto
  liturgicalSeason?: string; // Tiempo litúrgico recomendado
  lyrics?: string; // Letra del canto con acordes (para guitarristas) o sin acordes
  originalKey?: string; // Tonalidad original del canto (ej: "G", "Am")
  isLiturgical?: boolean; // Si el canto es litúrgico (apropiado para la Misa) o no litúrgico (solo para eventos extra-litúrgicos)
  nonLiturgicalCategory?: 'Adoración' | 'Procesión' | 'Mariano' | 'Reflexión' | 'Evangelización' | 'Otro'; // Categoría para cantos no litúrgicos
  approvalStatus?: 'pending' | 'approved' | 'rejected'; // Estado de aprobación por el administrador
  approvedBy?: string; // ID del administrador que aprobó el canto
  approvedAt?: string; // Fecha de aprobación
  rejectionReason?: string; // Razón de rechazo si fue rechazado
}

export type UserRole = 'Coro' | 'Pueblo fiel' | 'Admin';
export type InstrumentType = 'Coro' | 'Guitarra' | 'Órgano';

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
}

export interface PublishedCantoral {
  id: string;
  choirId: string;
  choirName: string;
  parishName: string;
  date: string; // Fecha calendario
  liturgicalDate: string; // Calendario litúrgico (ej: "1er Domingo de Adviento")
  massTime: string; // Horario de la Misa (ej: "10:00 AM")
  songs: Song[];
  createdAt: string;
  publishedBy?: string;
  publishedAt?: string;
  status: 'draft' | 'published'; // Estado del cantoral
  isDraft?: boolean; // DEPRECATED: usar 'status'
  isSuggestion?: boolean; // Si es una sugerencia del sistema
}