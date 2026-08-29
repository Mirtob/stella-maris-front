/**
 * Qué teléfono y qué navegador tiene delante la persona que quiere instalar la app.
 *
 * Nace del lanzamiento del 29-ago-2026: en Android casi nadie logró instalarla desde
 * el QR. El motivo de fondo es que el menú del navegador NO se llama igual ni está en
 * el mismo lugar en todos los teléfonos — "Instalar aplicación", "Agregar a pantalla
 * de inicio", "Instalar app", ⋮ o ≡ según Chrome, Samsung Internet, Edge, Firefox o
 * Opera. Explicar "abre los tres puntos" no alcanza.
 *
 * Con esto el módulo de instalación puede:
 *  · dar el botón de UN TOQUE cuando el navegador lo permite (lo normal en Android);
 *  · si no, dar el paso EXACTO de ESE navegador, con su nombre y su ícono;
 *  · detectar el caso que dejaba a la gente atrapada: haber abierto el enlace dentro
 *    de WhatsApp / Instagram / Facebook, donde instalar es imposible y lo único que
 *    sirve es abrirlo en Chrome o Safari.
 *
 * Todo sale del user-agent: es una heurística, no una verdad absoluta. Por eso la
 * pantalla ofrece siempre una salida manual además del camino detectado.
 */

export type InstallOs = 'android' | 'ios' | 'desktop' | 'unknown';

export type InstallBrowser =
  | 'chrome'
  | 'edge'
  | 'samsung'
  | 'firefox'
  | 'opera'
  | 'safari'
  | 'in-app'   // WhatsApp, Instagram, Facebook, TikTok… (no pueden instalar)
  | 'other';

export interface InstallPlatform {
  os: InstallOs;
  browser: InstallBrowser;
  /** Nombre para mostrar ("Chrome", "Samsung Internet", "Safari"…). */
  browserName: string;
  /** Navegador embebido dentro de otra app (WhatsApp, Instagram…): no puede instalar. */
  inApp: boolean;
  /** Versión mayor de iOS, si se pudo leer (16, 17, 18…). `null` si no aplica. */
  iosVersion: number | null;
  /** iOS admite notificaciones push desde 16.4, y SOLO con la app instalada. */
  iosSupportsPush: boolean;
}

const ua = (): string => (typeof navigator === 'undefined' ? '' : navigator.userAgent || '');

/** iPhone/iPad. El iPad moderno se declara Mac, así que se mira también el táctil. */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(ua())
    || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);
}

/** Versión mayor de iOS leída del user-agent ("OS 17_4" → 17). */
export function iosMajorVersion(): number | null {
  const m = ua().match(/OS (\d+)[._]/);
  return m ? Number(m[1]) : null;
}

/**
 * Navegador embebido en otra app. Son la causa silenciosa de la mitad de los
 * fracasos: quien abre el enlace desde el chat de la parroquia no está en Chrome ni
 * en Safari, y ahí no existe la opción de instalar por ningún lado.
 */
function detectInApp(u: string): boolean {
  return /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|MicroMessenger|GSA\/|\[LinkedInApp\]/i.test(u)
    // WebView de Android: el marcador "; wv" lo declara explícitamente.
    || /;\s*wv\)/i.test(u);
}

export function detectPlatform(): InstallPlatform {
  const u = ua();
  const ios = isIosDevice();
  const android = /android/i.test(u);
  const os: InstallOs = ios ? 'ios' : android ? 'android' : (u ? 'desktop' : 'unknown');

  const inApp = detectInApp(u);

  // El orden importa: Edge y Opera también dicen "Chrome" en su user-agent, y
  // Samsung Internet dice "Chrome" y "SamsungBrowser". Se busca lo más específico
  // primero para no rotular todo como Chrome.
  let browser: InstallBrowser = 'other';
  let browserName = 'tu navegador';
  if (inApp) {
    browser = 'in-app';
    browserName = 'el navegador de otra app';
  } else if (/SamsungBrowser/i.test(u)) {
    browser = 'samsung'; browserName = 'Samsung Internet';
  } else if (/EdgA?\//i.test(u)) {
    browser = 'edge'; browserName = 'Edge';
  } else if (/OPR\/|OPT\/|Opera/i.test(u)) {
    browser = 'opera'; browserName = 'Opera';
  } else if (/FxiOS|Firefox/i.test(u)) {
    browser = 'firefox'; browserName = 'Firefox';
  } else if (/CriOS/i.test(u)) {
    // Chrome DENTRO de iOS: no puede instalar (en iOS solo instala Safari).
    browser = 'chrome'; browserName = 'Chrome';
  } else if (/Chrome|Chromium/i.test(u)) {
    browser = 'chrome'; browserName = 'Chrome';
  } else if (/Safari/i.test(u)) {
    browser = 'safari'; browserName = 'Safari';
  }

  const iosVersion = ios ? iosMajorVersion() : null;

  return {
    os,
    browser,
    browserName,
    inApp,
    iosVersion,
    // 16.4 es el mínimo. Con solo el mayor no se distingue 16.0 de 16.4, así que
    // 16 se da por bueno y la pantalla avisa "iOS 16.4 o superior".
    iosSupportsPush: ios && iosVersion !== null && iosVersion >= 16,
  };
}

/**
 * ¿Se puede instalar en ESTE navegador?
 *
 *  · iOS: SOLO Safari (Chrome, Firefox y Edge en iPhone no pueden: Apple no se lo
 *    permite). Es exactamente lo que dejaba a la gente dando vueltas.
 *  · Android: cualquier navegador serio, menos los embebidos en otra app.
 *  · Escritorio: Chrome, Edge y Opera.
 */
export function canInstallHere(p: InstallPlatform): boolean {
  if (p.inApp) return false;
  if (p.os === 'ios') return p.browser === 'safari';
  if (p.os === 'android') return p.browser !== 'other';
  return p.browser === 'chrome' || p.browser === 'edge' || p.browser === 'opera';
}

/** Nombre del navegador al que hay que llevar a la persona si en este no se puede. */
export function browserToUse(p: InstallPlatform): string {
  return p.os === 'ios' ? 'Safari' : 'Chrome';
}
