#!/usr/bin/env node
/**
 * T15 — Chequeos automáticos de PWA sobre producción.
 *
 * Verifica lo que se puede sin un dispositivo real:
 *   - Manifest válido y referenciado
 *   - Service worker registrable (no implica que cachee)
 *   - Meta tags PWA (theme-color, apple-mobile-web-app-*)
 *   - Íconos efectivamente accesibles + dimensiones reales
 *   - Login screen renderiza sin errores de JS
 *   - Comportamiento "offline-like" (la app NO depende de un SW que cachee, así
 *     que offline-after-install NO debería funcionar — lo confirmamos abajo)
 *
 * Lo que NO podemos verificar acá:
 *   - Add to Home Screen real en iOS Safari
 *   - Install banner Chrome Android (requiere user gesture + heurísticas)
 *   - Splash screen rendering (depende del SO)
 *
 * Uso:
 *   node tests/pwa/check-prod.mjs [URL]
 *
 * Salida:
 *   Reporte legible en stdout + JSON en tests/pwa/output/pwa-report-<ts>.json
 */

import { chromium, devices } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL_ARG = process.argv[2] ?? 'https://stella-maris-front.vercel.app/';

// Colores ASCII (no Unicode, PowerShell-safe)
const c = (n, s) => `\x1b[${n}m${s}\x1b[0m`;
const ok = (m) => console.log(c(32, '[OK]   ') + m);
const warn = (m) => console.log(c(33, '[WARN] ') + m);
const fail = (m) => console.log(c(31, '[FAIL] ') + m);
const info = (m) => console.log(c(36, '[INFO] ') + m);
const heading = (m) => console.log('\n' + c(1, '=== ' + m + ' ==='));

const findings = [];
function add(name, status, detail) {
  findings.push({ name, status, detail });
}

async function main() {
  info(`URL: ${URL_ARG}`);
  const startedAt = new Date().toISOString();

  const browser = await chromium.launch({ headless: true });
  const iphone = devices['iPhone 13'];
  const pixel = devices['Pixel 7'];

  // ──────────────────────────────────────────────────────────────────────────
  heading('1. iOS Safari (iPhone 13 emulado)');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ ...iphone });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    const resp = await page.goto(URL_ARG, { waitUntil: 'networkidle', timeout: 30000 });
    if (!resp || !resp.ok()) {
      fail(`Página principal: HTTP ${resp ? resp.status() : 'no response'}`);
      add('ios:load', 'fail', `HTTP ${resp ? resp.status() : 'NO_RESPONSE'}`);
    } else {
      ok(`Página principal cargó (HTTP ${resp.status()})`);
      add('ios:load', 'ok', `HTTP ${resp.status()}`);
    }

    // Meta tags PWA
    const meta = await page.evaluate(() => ({
      themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute('content'),
      appleCapable: document.querySelector('meta[name="apple-mobile-web-app-capable"]')?.getAttribute('content'),
      appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]')?.getAttribute('content'),
      appleStatusBar: document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')?.getAttribute('content'),
      manifestHref: document.querySelector('link[rel="manifest"]')?.getAttribute('href'),
      appleTouchIcon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href'),
      viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
    }));
    if (meta.themeColor)    { ok(`theme-color: ${meta.themeColor}`); add('ios:theme-color', 'ok', meta.themeColor); }
    else                    { fail('theme-color ausente'); add('ios:theme-color', 'fail'); }
    if (meta.appleCapable === 'yes') { ok('apple-mobile-web-app-capable=yes'); add('ios:capable', 'ok'); }
    else                    { warn(`apple-mobile-web-app-capable=${meta.appleCapable}`); add('ios:capable', 'warn', meta.appleCapable); }
    if (meta.appleTitle)    { ok(`apple-mobile-web-app-title: ${meta.appleTitle}`); add('ios:title', 'ok'); }
    else                    { warn('apple-mobile-web-app-title ausente'); add('ios:title', 'warn'); }
    if (meta.appleTouchIcon){ ok(`apple-touch-icon: ${meta.appleTouchIcon}`); add('ios:apple-icon', 'ok'); }
    else                    { fail('apple-touch-icon ausente'); add('ios:apple-icon', 'fail'); }
    if (meta.manifestHref)  { ok(`manifest link: ${meta.manifestHref}`); add('ios:manifest-link', 'ok'); }
    else                    { fail('Manifest no referenciado en <head>'); add('ios:manifest-link', 'fail'); }

    // Esperar al Login (la app muestra splash 2500ms antes de cambiar a Login).
    // networkidle puede volver antes del setTimeout, así que esperamos al botón explícito.
    const loginLocator = page.locator('text=/Continuar con Google|Iniciar sesi/i').first();
    try {
      await loginLocator.waitFor({ timeout: 6000 });
      ok('Login screen renderizó (botón Google detectado)');
      add('ios:login-render', 'ok');
    } catch {
      fail('Login screen no detectado en iPhone (timeout 6s)');
      add('ios:login-render', 'fail', 'timeout 6s');
    }

    if (consoleErrors.length === 0) {
      ok('Sin errores de JS en iPhone');
      add('ios:js-errors', 'ok', '0 errores');
    } else {
      // Filtrar errores conocidos no críticos
      const real = consoleErrors.filter(e =>
        !/ResizeObserver/.test(e) &&
        !/Sentry/.test(e) &&
        !/AbortError/.test(e)
      );
      if (real.length === 0) {
        ok(`Sin errores críticos en iPhone (${consoleErrors.length} ignorables)`);
        add('ios:js-errors', 'ok', `${consoleErrors.length} ignorables`);
      } else {
        fail(`Errores JS en iPhone: ${real.length}`);
        real.slice(0, 3).forEach(e => console.log('       ' + e.slice(0, 120)));
        add('ios:js-errors', 'fail', real.slice(0, 3).join(' | '));
      }
    }

    // Screenshot
    const screenshotDir = resolve(__dirname, 'output');
    if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: resolve(screenshotDir, 'ios-login.png'), fullPage: false });
    info('Screenshot iPhone -> tests/pwa/output/ios-login.png');

    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  heading('2. Chrome Android (Pixel 7 emulado)');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ ...pixel });
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    const resp = await page.goto(URL_ARG, { waitUntil: 'networkidle', timeout: 30000 });
    if (resp && resp.ok()) { ok(`Página cargó en Android (HTTP ${resp.status()})`); add('android:load', 'ok'); }
    else                    { fail('Página NO cargó en Android'); add('android:load', 'fail'); }

    // Manifest fetch (re-validate via browser context)
    const manifestData = await page.evaluate(async () => {
      try {
        const r = await fetch('/manifest.webmanifest');
        if (!r.ok) return { error: `HTTP ${r.status}` };
        return await r.json();
      } catch (e) { return { error: String(e) }; }
    });
    if (manifestData.error) {
      fail(`Manifest fetch falló: ${manifestData.error}`);
      add('android:manifest-fetch', 'fail', manifestData.error);
    } else {
      ok(`Manifest válido (display=${manifestData.display}, ${manifestData.icons?.length ?? 0} íconos)`);
      add('android:manifest-fetch', 'ok', `display=${manifestData.display}`);
      // Validar campos requeridos por Chrome para installability
      const required = ['name', 'short_name', 'start_url', 'display', 'icons'];
      const missing = required.filter(k => !manifestData[k]);
      if (missing.length) {
        fail(`Campos requeridos faltantes: ${missing.join(', ')}`);
        add('android:manifest-required', 'fail', missing.join(','));
      } else {
        ok('Todos los campos requeridos presentes');
        add('android:manifest-required', 'ok');
      }
      // Validar íconos 192 y 512
      const has192 = (manifestData.icons || []).some(i => /(^|\s)192x192(\s|$)/.test(i.sizes));
      const has512 = (manifestData.icons || []).some(i => /(^|\s)512x512(\s|$)/.test(i.sizes));
      if (has192 && has512) { ok('Iconos 192x192 y 512x512 declarados'); add('android:icons-sizes', 'ok'); }
      else                  { fail(`Faltan tamaños: 192=${has192} 512=${has512}`); add('android:icons-sizes', 'fail'); }
      const hasMaskable = (manifestData.icons || []).some(i => /maskable/.test(i.purpose ?? ''));
      if (hasMaskable) { ok('Hay ícono maskable (para Android adaptive)'); add('android:maskable', 'ok'); }
      else             { warn('Sin ícono maskable — splash redondo en Android se cortará'); add('android:maskable', 'warn'); }
    }

    // SW registrable
    const swInfo = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { error: 'no-support' };
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        return {
          scope: reg.scope,
          active: !!reg.active,
          installing: !!reg.installing,
          waiting: !!reg.waiting,
        };
      } catch (e) { return { error: String(e) }; }
    });
    if (swInfo.error) {
      fail(`SW registration: ${swInfo.error}`);
      add('android:sw-register', 'fail', swInfo.error);
    } else {
      ok(`SW registrable (scope=${swInfo.scope})`);
      add('android:sw-register', 'ok', swInfo.scope);
    }

    // Verificar dimensiones reales de los íconos vs. lo declarado
    const iconCheck = await page.evaluate(async () => {
      async function dim(url) {
        return new Promise(res => {
          const img = new Image();
          img.onload = () => res({ url, w: img.naturalWidth, h: img.naturalHeight });
          img.onerror = () => res({ url, error: 'load-failed' });
          img.src = url;
        });
      }
      return Promise.all([dim('/icon-192.png'), dim('/icon-512.png'), dim('/apple-touch-icon.png')]);
    });
    iconCheck.forEach(i => {
      if (i.error) {
        fail(`${i.url}: ${i.error}`);
        add(`icon:${i.url}`, 'fail', i.error);
      } else {
        const expectedFromName = /icon-(\d+)\.png/.exec(i.url)?.[1];
        if (expectedFromName && (i.w !== parseInt(expectedFromName) || i.h !== parseInt(expectedFromName))) {
          fail(`${i.url} es ${i.w}x${i.h} pero el nombre dice ${expectedFromName}x${expectedFromName}`);
          add(`icon:${i.url}`, 'fail', `actual ${i.w}x${i.h}, expected ${expectedFromName}`);
        } else {
          ok(`${i.url}: ${i.w}x${i.h}`);
          add(`icon:${i.url}`, 'ok', `${i.w}x${i.h}`);
        }
      }
    });

    if (consoleErrors.length === 0) {
      ok('Sin errores de JS en Android');
      add('android:js-errors', 'ok');
    } else {
      const real = consoleErrors.filter(e =>
        !/ResizeObserver/.test(e) && !/Sentry/.test(e) && !/AbortError/.test(e)
      );
      if (real.length === 0) { ok(`Sin errores críticos en Android (${consoleErrors.length} ignorables)`); add('android:js-errors', 'ok'); }
      else                   { fail(`Errores JS en Android: ${real.length}`); real.slice(0,3).forEach(e => console.log('       '+e.slice(0,120))); add('android:js-errors', 'fail', real.slice(0,3).join('|')); }
    }

    await page.screenshot({ path: resolve(__dirname, 'output', 'android-login.png') });
    info('Screenshot Pixel -> tests/pwa/output/android-login.png');

    await ctx.close();
  }

  // ──────────────────────────────────────────────────────────────────────────
  heading('3. Offline behavior');
  // ──────────────────────────────────────────────────────────────────────────
  {
    const ctx = await browser.newContext({ ...pixel });
    const page = await ctx.newPage();
    await page.goto(URL_ARG, { waitUntil: 'networkidle', timeout: 30000 });
    // Forzar offline y recargar
    await ctx.setOffline(true);
    let offlineWorked = false;
    let offlineError = null;
    try {
      const r = await page.reload({ waitUntil: 'domcontentloaded', timeout: 8000 });
      offlineWorked = r && r.ok();
    } catch (e) {
      offlineError = String(e).slice(0, 120);
    }
    if (offlineWorked) {
      ok('La app carga offline tras visita previa');
      add('offline:reload', 'ok');
    } else {
      warn('La app NO carga offline — el SW actual no cachea (intencional: sw.js solo se desregistra)');
      add('offline:reload', 'warn', offlineError ?? 'no cache');
    }
    await ctx.close();
  }

  await browser.close();

  // ──────────────────────────────────────────────────────────────────────────
  heading('Resumen');
  // ──────────────────────────────────────────────────────────────────────────
  const counts = findings.reduce((acc, f) => { acc[f.status] = (acc[f.status] || 0) + 1; return acc; }, {});
  console.log(`  OK:   ${counts.ok ?? 0}`);
  console.log(`  WARN: ${counts.warn ?? 0}`);
  console.log(`  FAIL: ${counts.fail ?? 0}`);

  const outDir = resolve(__dirname, 'output');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const reportPath = resolve(outDir, `pwa-report-${startedAt.replace(/[:.]/g, '-').slice(0, 19)}.json`);
  writeFileSync(reportPath, JSON.stringify({ url: URL_ARG, startedAt, counts, findings }, null, 2));
  info(`Reporte JSON -> ${reportPath}`);

  process.exit((counts.fail ?? 0) > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(2); });
