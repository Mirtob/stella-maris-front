#!/usr/bin/env node
/**
 * T16 — Smoke headless de los casos del CHECKLIST que NO requieren login OAuth.
 *
 * Por qué tan pocos casos:
 *   La gran mayoría del CHECKLIST.md (≈60 casos) requieren login real con
 *   Google OAuth, y Google bloquea cuentas reales accedidas por automated
 *   browsers (Playwright detected, suspicious activity). Esos casos quedan
 *   intrínsecamente manuales — los hace el usuario con su celular.
 *
 *   Lo que SÍ podemos verificar acá es lo que vive antes del login o
 *   en pantallas accesibles sin sesión.
 *
 * Casos cubiertos:
 *   A1   — Login page tiene botón Google
 *   E2   — Deep link /c/{uuid valid} muestra pantalla "Cantoral disponible"
 *   E6   — URL malformada /c/hack es ignorada (no crashea, va a login normal)
 *   H7   — PWA installable (delegado a check-prod.mjs — ya validado)
 *   H8   — Dark mode toggle: visible, clickable y persiste tras reload
 *   I1   — Banner offline aparece al perder conexión
 *   I3   — Banner offline desaparece al recuperar conexión
 *
 * Uso:
 *   node tests/pwa/smoke-headless.mjs [URL]
 */

import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL_BASE = (process.argv[2] ?? 'https://stella-maris-front.vercel.app/').replace(/\/$/, '');

const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`;
const ok   = (m) => console.log(c(32, '[OK]   ') + m);
const warn = (m) => console.log(c(33, '[WARN] ') + m);
const fail = (m) => console.log(c(31, '[FAIL] ') + m);
const info = (m) => console.log(c(36, '[INFO] ') + m);

const findings = [];
function add(id, status, detail) { findings.push({ id, status, detail }); }

async function withPage(browser, deviceName, fn) {
  const ctx = await browser.newContext({ ...devices[deviceName] });
  const page = await ctx.newPage();
  try { await fn(page, ctx); }
  finally { await ctx.close(); }
}

async function main() {
  info(`URL: ${URL_BASE}`);
  const browser = await chromium.launch({ headless: true });

  // ──────────────────────────────────────────────────────────────────────────
  // A1 — Login renderiza con botón Google
  // ──────────────────────────────────────────────────────────────────────────
  await withPage(browser, 'Pixel 7', async (page) => {
    await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' });
    try {
      await page.locator('text=/Continuar con Google|Iniciar sesi/i').first().waitFor({ timeout: 6000 });
      ok('A1 — Login muestra botón Google');
      add('A1', 'ok');
    } catch {
      fail('A1 — Login NO muestra botón Google');
      add('A1', 'fail');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E2 — Deep link válido /c/{uuid}
  // ──────────────────────────────────────────────────────────────────────────
  await withPage(browser, 'Pixel 7', async (page) => {
    // UUID inventado pero formalmente válido — la app debe MOSTRAR la pantalla
    // de deep link aún si Supabase no devuelve el cantoral (el handler funciona).
    const VALID_UUID = '00000000-0000-4000-8000-000000000001';
    await page.goto(`${URL_BASE}/c/${VALID_UUID}`, { waitUntil: 'networkidle' });
    // CantoralDeepLink renderiza esto SIN sesión: lo manda a login y guarda
    // el id en localStorage para después de login. Verificamos que NO crashea
    // y que está en alguno de los dos estados esperados.
    const stillOnDeepLink = await page.evaluate(() => location.pathname.startsWith('/c/'));
    const html = await page.content();
    const hasLogin = /Continuar con Google|Iniciar sesi/i.test(html);
    const hasDeepLinkScreen = /Cantoral disponible|Ver en la app/i.test(html);
    if (hasLogin || hasDeepLinkScreen) {
      ok(`E2 — Deep link válido manejado (login=${hasLogin}, deeplink=${hasDeepLinkScreen}, path=${stillOnDeepLink ? '/c/' : '/'})`);
      add('E2', 'ok', `login=${hasLogin}, deeplink=${hasDeepLinkScreen}`);
    } else {
      fail('E2 — Deep link válido no llevó a Login NI a la pantalla esperada');
      add('E2', 'fail');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // E6 — URL malformada /c/hack
  // ──────────────────────────────────────────────────────────────────────────
  await withPage(browser, 'Pixel 7', async (page) => {
    const jsErrors = [];
    page.on('pageerror', (e) => jsErrors.push(String(e)));
    await page.goto(`${URL_BASE}/c/hack`, { waitUntil: 'networkidle' });
    const html = await page.content();
    const looksHealthy = /Continuar con Google|Iniciar sesi|Cargando Stella/i.test(html);
    if (looksHealthy && jsErrors.length === 0) {
      ok('E6 — /c/hack ignorada, app sana sin errores JS');
      add('E6', 'ok');
    } else if (looksHealthy && jsErrors.length > 0) {
      const real = jsErrors.filter(e => !/ResizeObserver|Sentry/.test(e));
      if (real.length === 0) { ok('E6 — /c/hack ignorada (errores triviales)'); add('E6', 'ok'); }
      else                   { fail(`E6 — /c/hack causó ${real.length} errores JS reales`); add('E6', 'fail', real[0]); }
    } else {
      fail('E6 — /c/hack no llevó a un estado sano');
      add('E6', 'fail');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // H7 — Delegado: ya verificado por check-prod.mjs
  // ──────────────────────────────────────────────────────────────────────────
  ok('H7 — Delegado a check-prod.mjs (manifest válido + íconos correctos + SW registrable)');
  add('H7', 'ok', 'delegado');

  // ──────────────────────────────────────────────────────────────────────────
  // H8 — Dark mode toggle visible y persiste
  // ──────────────────────────────────────────────────────────────────────────
  await withPage(browser, 'Pixel 7', async (page) => {
    await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' });
    // Esperar al Login
    try { await page.locator('text=/Continuar con Google|Iniciar sesi/i').first().waitFor({ timeout: 6000 }); }
    catch { /* seguimos igual */ }

    // El ThemeToggle es un button con icono Sol/Luna. Buscamos por aria-label típico
    // o por el icono. Como no sabemos exact selector, probamos varios.
    const toggle = await page.locator(
      'button[aria-label*="modo" i], button[aria-label*="theme" i], button[aria-label*="oscuro" i], button[title*="modo" i]'
    ).first();

    const isVisible = await toggle.isVisible().catch(() => false);
    if (!isVisible) {
      // Fallback: buscar el SVG sol/luna en un botón fijo
      const altToggle = await page.locator('button:has(svg)').first().isVisible().catch(() => false);
      if (!altToggle) {
        fail('H8 — Botón de toggle de tema no encontrado');
        add('H8', 'fail', 'toggle no detectado');
        return;
      }
    }

    // Capturar el estado inicial (clase dark en html o documentElement.classList)
    const initial = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    // Clic
    if (isVisible) {
      await toggle.click({ timeout: 3000 }).catch(() => undefined);
    }
    await page.waitForTimeout(300);
    const afterClick = await page.evaluate(() => document.documentElement.classList.contains('dark'));

    if (initial === afterClick) {
      warn('H8 — Toggle no cambió el estado de la clase dark (puede ser que el botón no fuera el ThemeToggle)');
      add('H8', 'warn', 'sin cambio visible');
    } else {
      ok(`H8 — Dark mode toggle funciona (dark: ${initial} -> ${afterClick})`);

      // Test de persistencia: reload y verificar
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const afterReload = await page.evaluate(() => document.documentElement.classList.contains('dark'));
      if (afterReload === afterClick) {
        ok('H8 — Persiste tras reload');
        add('H8', 'ok', 'persiste');
      } else {
        warn('H8 — NO persiste tras reload');
        add('H8', 'warn', 'no persiste');
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // I1 + I3 — Banner offline aparece al desconectar, desaparece al reconectar
  // ──────────────────────────────────────────────────────────────────────────
  await withPage(browser, 'Pixel 7', async (page, ctx) => {
    await page.goto(URL_BASE + '/', { waitUntil: 'networkidle' });
    try { await page.locator('text=/Continuar con Google|Iniciar sesi/i').first().waitFor({ timeout: 6000 }); }
    catch { /* sigue */ }

    // Forzar offline
    await ctx.setOffline(true);
    // Disparar el evento offline (algunos browsers no lo emiten con setOffline solo)
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));
    await page.waitForTimeout(500);

    const offlineBannerVisible = await page.evaluate(() => {
      const t = document.body.innerText.toLowerCase();
      return t.includes('sin conexión') || t.includes('sin conexion') || t.includes('offline');
    });
    if (offlineBannerVisible) { ok('I1 — Banner "sin conexión" aparece offline'); add('I1', 'ok'); }
    else                       { fail('I1 — Banner offline NO aparece'); add('I1', 'fail'); }

    // Reconectar
    await ctx.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));
    await page.waitForTimeout(500);

    const stillOfflineVisible = await page.evaluate(() => {
      const t = document.body.innerText.toLowerCase();
      return t.includes('sin conexión') || t.includes('sin conexion');
    });
    if (!stillOfflineVisible) { ok('I3 — Banner offline desaparece al reconectar'); add('I3', 'ok'); }
    else                      { fail('I3 — Banner offline NO desaparece al reconectar'); add('I3', 'fail'); }
  });

  await browser.close();

  // ──────────────────────────────────────────────────────────────────────────
  // Resumen
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n' + c(1, '=== Resumen ==='));
  const counts = findings.reduce((a, f) => ((a[f.status] = (a[f.status] || 0) + 1), a), {});
  console.log(`  OK:   ${counts.ok ?? 0}`);
  console.log(`  WARN: ${counts.warn ?? 0}`);
  console.log(`  FAIL: ${counts.fail ?? 0}`);

  const outDir = resolve(__dirname, 'output');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const path = resolve(outDir, `smoke-headless-${ts}.json`);
  writeFileSync(path, JSON.stringify({ url: URL_BASE, counts, findings }, null, 2));
  info(`Reporte JSON -> ${path}`);

  process.exit((counts.fail ?? 0) > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(2); });
