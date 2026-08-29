/**
 * Detección de teléfono y navegador para el módulo «Instalar aplicación».
 *
 * Del lanzamiento del 29-ago-2026: en Android casi nadie logró instalar la app y en
 * iPhone casi nadie logró activar los avisos. Las dos cosas dependen de reconocer
 * bien DÓNDE está parada la persona:
 *
 *   · si abrió el enlace dentro de WhatsApp/Instagram, no se puede instalar y hay que
 *     sacarla a Chrome (era el caso que dejaba a la gente dando vueltas sin saberlo);
 *   · en iPhone solo Safari instala, y los avisos piden iOS 16.4+ Y la app instalada;
 *   · en Android el menú se llama distinto según el navegador, así que hay que saber
 *     cuál es para dar el paso correcto.
 */
import { detectPlatform, canInstallHere, browserToUse } from '../../src/utils/installPlatform';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

/** Simula el navegador: detectPlatform lee navigator.userAgent.
 *  En Node moderno `navigator` es de solo lectura, así que se redefine la propiedad. */
function conUA(ua: string, platform = 'Linux armv8l', maxTouchPoints = 5) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: ua, platform, maxTouchPoints },
    configurable: true,
    writable: true,
  });
}

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  androidSamsung: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
  androidEdge: 'Mozilla/5.0 (Linux; Android 13; moto g) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 EdgA/120.0.0.0',
  androidFirefox: 'Mozilla/5.0 (Android 13; Mobile; rv:126.0) Gecko/126.0 Firefox/126.0',
  androidOpera: 'Mozilla/5.0 (Linux; Android 13; CPH2211) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 OPR/79.0.0.0',
  whatsapp: 'Mozilla/5.0 (Linux; Android 13; SM-A536E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36',
  instagram: 'Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 Instagram 300.0.0.0',
  facebook: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]',
  iosSafari17: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iosSafari15: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/122.0 Mobile/15E148 Safari/604.1',
  escritorioChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

console.log('\n== Android: qué navegador es (para dar el paso correcto) ==');
conUA(UA.androidChrome);
check('Chrome', [detectPlatform().os, detectPlatform().browser], ['android', 'chrome']);
conUA(UA.androidSamsung);
check('Samsung Internet no se confunde con Chrome', detectPlatform().browser, 'samsung');
check('y se nombra bien', detectPlatform().browserName, 'Samsung Internet');
conUA(UA.androidEdge);
check('Edge no se confunde con Chrome', detectPlatform().browser, 'edge');
conUA(UA.androidOpera);
check('Opera no se confunde con Chrome', detectPlatform().browser, 'opera');
conUA(UA.androidFirefox);
check('Firefox', detectPlatform().browser, 'firefox');

console.log('\n== Navegador dentro de otra app: no se puede instalar ==');
for (const [nombre, ua] of [['WhatsApp (webview)', UA.whatsapp], ['Instagram', UA.instagram], ['Facebook', UA.facebook]] as const) {
  conUA(ua, /iPhone/.test(ua) ? 'iPhone' : 'Linux armv8l');
  const p = detectPlatform();
  check(`${nombre}: se detecta`, p.inApp, true);
  check(`${nombre}: no ofrece instalar aquí`, canInstallHere(p), false);
}

console.log('\n== iPhone ==');
conUA(UA.iosSafari17, 'iPhone');
let p = detectPlatform();
check('Safari 17 instala', canInstallHere(p), true);
check('Safari 17 admite avisos (con la app instalada)', p.iosSupportsPush, true);
check('lee la versión de iOS', p.iosVersion, 17);

conUA(UA.iosSafari15, 'iPhone');
p = detectPlatform();
check('iOS 15 instala igual', canInstallHere(p), true);
check('pero NO admite avisos (piden 16.4+)', p.iosSupportsPush, false);

conUA(UA.iosChrome, 'iPhone');
p = detectPlatform();
check('Chrome en iPhone NO puede instalar', canInstallHere(p), false);
check('y hay que mandarla a Safari', browserToUse(p), 'Safari');

console.log('\n== Escritorio ==');
conUA(UA.escritorioChrome, 'Win32', 0);
p = detectPlatform();
check('Chrome de escritorio instala', [p.os, canInstallHere(p)], ['desktop', true]);
check('en Android se manda a Chrome', browserToUse({ ...p, os: 'android' }), 'Chrome');

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
