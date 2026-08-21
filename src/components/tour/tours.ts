import { TourStep } from './Tour';

// ── Persistencia (por rol, en localStorage) ──────────────────────────────────
const SEEN_PREFIX = 'stella_maris_tour_seen_';

/** ¿El usuario ya vio el tour de este rol? (true ante error → no molestar en bucle) */
export function hasSeenTour(role: string): boolean {
  try { return localStorage.getItem(SEEN_PREFIX + role) === '1'; } catch { return true; }
}
export function markTourSeen(role: string): void {
  try { localStorage.setItem(SEEN_PREFIX + role, '1'); } catch { /* modo privado */ }
}
/** Para el botón "Ver tutorial de nuevo". */
export function resetTour(role: string): void {
  try { localStorage.removeItem(SEEN_PREFIX + role); } catch { /* noop */ }
}

// ── Tips contextuales (F4) ────────────────────────────────────────────────────
// Pequeños coachmarks que se disparan la 1ª vez que entras a una pantalla profunda
// (constructor de categorías, Modo Atril). Persistencia propia por id de tip.
const TIP_PREFIX = 'stella_maris_tip_seen_';

export function hasSeenTip(id: string): boolean {
  try { return localStorage.getItem(TIP_PREFIX + id) === '1'; } catch { return true; }
}
export function markTipSeen(id: string): void {
  try { localStorage.setItem(TIP_PREFIX + id, '1'); } catch { /* modo privado */ }
}

// Registros para poder reiniciar TODO desde Ajustes.
const ALL_ROLES = ['Pueblo fiel', 'Coro', 'Admin'];
const ALL_TIP_IDS = ['constructor', 'atril'];

/** Reinicia todos los tutoriales: tours por rol + tips contextuales. */
export function resetAllTutorials(): void {
  try {
    ALL_ROLES.forEach((r) => localStorage.removeItem(SEEN_PREFIX + r));
    ALL_TIP_IDS.forEach((t) => localStorage.removeItem(TIP_PREFIX + t));
  } catch { /* noop */ }
}

// ── Guion: Pueblo fiel (F1) ──────────────────────────────────────────────────
// Los pasos con `target` se saltan solos si el elemento no está (skipIfMissing),
// p. ej. cuando la parroquia aún no tiene cantorales publicados.
export const puebloFielTour: TourStep[] = [
  {
    id: 'intro',
    title: '¡Bienvenido a Stella Maris! 🙏',
    body: 'En 30 segundos te muestro cómo seguir la Misa con los cantos de tu parroquia.',
  },
  {
    id: 'misas',
    target: 'pf-misas',
    skipIfMissing: true,
    title: 'Las Misas de tu parroquia',
    body: 'Aquí aparecen los cantorales que prepara el coro para las próximas semanas. Toca una Misa para abrirla.',
  },
  {
    id: 'escuchar',
    target: 'pf-escuchar',
    skipIfMissing: true,
    title: 'Escuchar los cantos 🎧',
    body: '"Escuchar cantos" reproduce todos los cantos de la Misa, uno tras otro, como una radio. Sirve para practicar o rezar en casa.',
  },
  {
    id: 'ver-cantos',
    target: 'pf-ver-cantos',
    skipIfMissing: true,
    title: 'Ver la letra',
    body: 'Con "Ver Cantos" y "Ver Ordinario" sigues la letra de cada canto y el orden de la Misa.',
  },
  {
    id: 'notificaciones',
    target: 'pf-notifications',
    skipIfMissing: true,
    title: 'Avisos de cantorales nuevos 🔔',
    body: 'La campana te avisa cuando el coro publica un cantoral nuevo de tu parroquia.',
  },
  {
    id: 'menu',
    target: 'app-menu',
    title: 'Tu menú',
    body: 'Desde aquí cambias de parroquia o capilla, ves el calendario litúrgico y activas el modo oscuro.',
  },
  {
    id: 'fin',
    title: '¡Listo! ✝️',
    body: 'Eso es todo. Puedes volver a ver este tutorial desde el menú. ¡Buena celebración!',
  },
];

// ── Guion: Coro (F2) ─────────────────────────────────────────────────────────
export const coroTour: TourStep[] = [
  {
    id: 'intro',
    title: '¡Hola, coro! 🎵',
    body: 'Te muestro cómo armar el cantoral del domingo y publicarlo para tu parroquia.',
  },
  {
    id: 'celebracion',
    target: 'coro-celebracion',
    skipIfMissing: true,
    title: '¿Para qué celebración?',
    body: 'En Cuaresma y Semana Santa puedes elegir el oficio (Jueves Santo, Vigilia, etc.). El constructor se adapta con el orden y los cantos que correspondan.',
  },
  {
    id: 'categorias',
    target: 'coro-categorias',
    skipIfMissing: true,
    title: 'Arma la Misa por momentos',
    body: 'Toca cada categoría (Entrada, Salmo, Ofertorio, Comunión…) y agrega un canto a cada momento de la Misa.',
  },
  {
    id: 'sugerencias',
    target: 'coro-sugerencias',
    skipIfMissing: true,
    title: 'Sugerencias litúrgicas',
    body: 'Te proponemos cantos según el tiempo litúrgico actual, para ayudarte a elegir.',
  },
  {
    id: 'publicar',
    target: 'coro-publicar',
    skipIfMissing: true,
    title: 'Publica el cantoral',
    body: 'Cuando termines, publícalo para tu parroquia. El Pueblo fiel lo verá y podrá escuchar los cantos.',
  },
  {
    id: 'atril',
    target: 'coro-atril',
    skipIfMissing: true,
    title: 'Modo Atril 🎼',
    body: 'Durante la Misa, abre el Modo Atril para leer el repertorio con letra, acordes, transpositor, zoom y desplazamiento automático.',
  },
  {
    id: 'menu',
    target: 'app-menu',
    title: 'Tu menú',
    body: 'En el menú tienes Mis Cantorales, Banco de Partituras, Calendario Litúrgico y los Cursos.',
  },
  {
    id: 'fin',
    title: '¡A cantar! ✝️',
    body: 'Eso es lo esencial. Puedes volver a ver este tutorial desde el menú.',
  },
];

// ── Guion: Admin / Canal (F3) ────────────────────────────────────────────────
export const adminTour: TourStep[] = [
  {
    id: 'intro',
    title: 'Panel de administración 🛡️',
    body: 'Desde aquí gestionas el contenido, los usuarios y las parroquias.',
  },
  {
    id: 'sync',
    target: 'admin-sync',
    skipIfMissing: true,
    title: 'Sincronizar YouTube',
    body: 'Importa los cantos del canal (los videos con su metadata). Es lo que llena el catálogo que ve el coro.',
  },
  {
    id: 'songs',
    target: 'admin-songs',
    skipIfMissing: true,
    title: 'Gestión de Cantos',
    body: 'Revisa, edita, aprueba/rechaza o elimina cantos del catálogo.',
  },
  {
    id: 'accounts',
    target: 'admin-accounts',
    skipIfMissing: true,
    title: 'Cuentas usuario/clave',
    body: 'Crea cuentas con usuario y clave para quienes no quieren usar correo, y restablece claves.',
  },
  {
    id: 'fin',
    title: 'Recuerda 📋',
    body: 'Para que aparezcan cantos, sube los videos con su bloque de metadata y sincroniza (ver el Manual del Canal).',
  },
];

/** Tours disponibles por rol. */
export const toursByRole: Record<string, TourStep[]> = {
  'Pueblo fiel': puebloFielTour,
  'Coro': coroTour,
  'Admin': adminTour,
};

// ── Tip contextual: constructor de cantorales (F4) ────────────────────────────
// Se dispara la 1ª vez que el coro abre una categoría para agregar cantos.
export const constructorTips: TourStep[] = [
  {
    id: 'buscar',
    target: 'constructor-buscar',
    skipIfMissing: true,
    title: 'Agrega un canto a este momento',
    body: 'Busca por título, autor o misa, o usa las sugerencias de arriba. Toca "Agregar" y el canto queda en el cantoral; la categoría se cierra sola.',
  },
];

// ── Tip contextual: Modo Atril (F4) ───────────────────────────────────────────
// Se dispara la 1ª vez que se abre el Modo Atril.
export const atrilTips: TourStep[] = [
  {
    id: 'intro',
    title: 'Modo Atril 🎼',
    body: 'Pensado para leer el repertorio durante la Misa, con la pantalla siempre encendida.',
  },
  {
    id: 'repertorio',
    target: 'atril-repertorio',
    skipIfMissing: true,
    title: 'Tu repertorio',
    body: 'Con este botón abres y cierras la lista de cantos para saltar a cualquiera. Va cerrada para no tapar la partitura: los cantos ya están en el orden de la Misa.',
  },
  {
    id: 'zoom',
    target: 'atril-zoom',
    skipIfMissing: true,
    title: 'Tamaño de letra',
    body: 'Agranda o reduce la letra para leerla cómoda desde tu posición.',
  },
  {
    id: 'transpositor',
    target: 'atril-transpositor',
    skipIfMissing: true,
    title: 'Transpositor 🎸',
    body: 'Sube o baja el tono medio tono a la vez (solo con acordes). El tono mostrado se actualiza al instante.',
  },
  {
    id: 'concentracion',
    target: 'atril-concentracion',
    skipIfMissing: true,
    title: 'Pantalla completa',
    body: 'Le da a la partitura toda la pantalla: esconde el repertorio y la barra de velocidad (queda un botón ▶ flotante). ESC vuelve atrás.',
  },
  {
    id: 'autoscroll',
    target: 'atril-autoscroll',
    skipIfMissing: true,
    title: 'Desplazamiento automático',
    body: 'Play hace avanzar la letra solo; ajusta la velocidad con la barra. Tocar la pantalla lo pausa.',
  },
];
