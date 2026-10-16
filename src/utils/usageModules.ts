/**
 * Módulos que cuenta el registro de uso (tabla `usage_events`).
 *
 * La clave es la que se guarda en la base (minúsculas y guiones, como exige el
 * CHECK de la migración 20261016_usage_events); el rótulo es lo que ve el admin.
 * Una pantalla nueva que se quiera medir se agrega AQUÍ y en `routeModule`.
 */

export const USAGE_MODULE_LABEL: Record<string, string> = {
  'inicio':              'Inicio',
  'cantorals':           'Cantorales publicados',
  'manage-cantorals':    'Armar cantoral',
  'history':             'Historial',
  'liturgy':             'Liturgia',
  'liturgical-calendar': 'Calendario litúrgico',
  'favorites':           'Mis cantos',
  'sheet-music':         'Partituras',
  'courses':             'Cursos',
  'theory':              'Teoría musical',
  'instruments':         'Instrumentos',
  'choir-invitations':   'Coros invitados',
  'admin':               'Panel administrativo',
  'reproductor':         'Reproductor de video',
  'cantoral':            'Ver un cantoral',
  'cantoral-qr':         'Cantoral por enlace / QR',
  'ajustes':             'Ajustes',
  'instalar':            'Instalar la app',
  'atril':               'Modo Atril',
};

export const usageModuleLabel = (module: string): string =>
  USAGE_MODULE_LABEL[module] ?? module;

/** Lo mínimo de la ruta de App.tsx que hace falta para saber el módulo. */
export type UsageRoute = { screen: string; view?: string };

/**
 * Módulo de una pantalla, o `null` si no se cuenta (carga, login, configuración
 * inicial, la demo pública sin sesión, errores).
 */
export function routeModule(route: UsageRoute): string | null {
  switch (route.screen) {
    case 'app': {
      const view = route.view ?? 'main';
      if (view === 'main') return 'inicio';
      return view in USAGE_MODULE_LABEL ? view : null;
    }
    case 'player':        return 'reproductor';
    case 'playlist':      return 'cantoral';
    case 'cantoral-link': return 'cantoral-qr';
    case 'settings':      return 'ajustes';
    case 'install':       return 'instalar';
    default:              return null;
  }
}

/**
 * Serie diaria COMPLETA de los últimos `days` días: la base solo devuelve los días
 * con visitas, y un gráfico que se salta los días vacíos miente sobre la actividad.
 * Las fechas son 'YYYY-MM-DD' (hora de Chile, como las agrupa usage_summary).
 */
export function fillDays<T extends { day: string; visits: number; users: number }>(
  byDay: T[], days: number, today: Date = new Date(),
): { day: string; visits: number; users: number }[] {
  const seen = new Map(byDay.map((d) => [d.day, d]));
  const out: { day: string; visits: number; users: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i, 12);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const hit = seen.get(key);
    out.push({ day: key, visits: hit?.visits ?? 0, users: hit?.users ?? 0 });
  }
  return out;
}
