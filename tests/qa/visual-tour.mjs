#!/usr/bin/env node
/**
 * QA visual tour — recorre cada pantalla accesible sin OAuth en mobile y desktop
 * y captura screenshots para inspección manual.
 */
import { chromium, devices } from 'playwright';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL_BASE = (process.argv[2] ?? 'https://stella-maris-front.vercel.app').replace(/\/$/, '');

const OUT = resolve(__dirname, 'screenshots');
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const SCREENS = [
  { name: 'home-login',    path: '/' },
  { name: 'deeplink-valid', path: '/c/00000000-0000-4000-8000-000000000001' },
  { name: 'deeplink-bad',   path: '/c/hack' },
  { name: 'deeplink-empty', path: '/c/' },
  { name: 'random-404',     path: '/no-existe' },
];

const VIEWPORTS = [
  { name: 'iphone13', device: 'iPhone 13' },
  { name: 'pixel7',   device: 'Pixel 7' },
  { name: 'desktop',  device: null, viewport: { width: 1440, height: 900 } },
];

const findings = [];

function add(severity, screen, viewport, msg) {
  findings.push({ severity, screen, viewport, msg });
  const tag = severity === 'P0' ? '[\x1b[31mP0\x1b[0m]'
           : severity === 'P1' ? '[\x1b[33mP1\x1b[0m]'
           : severity === 'P2' ? '[\x1b[36mP2\x1b[0m]'
           : '[\x1b[90mP3\x1b[0m]';
  console.log(`${tag} ${screen} (${viewport}): ${msg}`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    const ctxOpts = vp.device ? { ...devices[vp.device] } : { viewport: vp.viewport };
    const ctx = await browser.newContext(ctxOpts);
    const page = await ctx.newPage();

    const consoleErrors = [];
    page.on('pageerror', e => consoleErrors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    for (const s of SCREENS) {
      const tag = `${s.name}_${vp.name}`;
      consoleErrors.length = 0;
      try {
        const resp = await page.goto(URL_BASE + s.path, { waitUntil: 'networkidle', timeout: 30000 });

        // Esperar al primer estado estable (Login o deep link o lo que sea)
        await page.waitForTimeout(3000); // dar tiempo al setTimeout del splash

        const png = resolve(OUT, `${tag}.png`);
        await page.screenshot({ path: png, fullPage: true });

        // Auto-checks por pantalla
        if (resp && !resp.ok() && s.path !== '/no-existe') {
          add('P0', s.name, vp.name, `HTTP ${resp.status()}`);
        }

        const realErrors = consoleErrors.filter(e =>
          !/ResizeObserver/.test(e) &&
          !/Sentry/.test(e) &&
          !/the server responded with a status of 4/.test(e) &&
          !/AbortError/.test(e)
        );
        if (realErrors.length > 0) {
          realErrors.slice(0, 3).forEach(e => add('P1', s.name, vp.name, 'JS error: ' + e.slice(0, 100)));
        }

        // ¿Hay texto visible?
        const bodyText = (await page.evaluate(() => document.body.innerText)).slice(0, 200);
        if (!bodyText.trim()) {
          add('P0', s.name, vp.name, 'Body sin texto visible');
        }

        // ¿Hay layout shift después del estado estable?
        const cls = await page.evaluate(() => {
          return new Promise(res => {
            let total = 0;
            const obs = new PerformanceObserver(list => {
              for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) total += entry.value;
              }
            });
            try { obs.observe({ type: 'layout-shift', buffered: true }); } catch { return res(null); }
            setTimeout(() => { obs.disconnect(); res(total); }, 1500);
          });
        });
        if (cls !== null && cls > 0.1) {
          add('P2', s.name, vp.name, `CLS=${cls.toFixed(3)} (>0.1)`);
        }

        // Tap targets < 44px en mobile
        if (vp.device) {
          const smallTargets = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button, a[href], [role="button"]'));
            const small = [];
            for (const el of btns) {
              const r = el.getBoundingClientRect();
              if (r.width === 0 || r.height === 0) continue; // invisible
              if (r.width < 44 || r.height < 44) {
                small.push({
                  tag: el.tagName,
                  text: (el.textContent || '').trim().slice(0, 30),
                  w: Math.round(r.width),
                  h: Math.round(r.height),
                });
              }
            }
            return small;
          });
          if (smallTargets.length > 0) {
            const summary = smallTargets.slice(0, 5).map(t => `${t.tag}[${t.w}x${t.h}]"${t.text}"`).join(', ');
            add('P2', s.name, vp.name, `${smallTargets.length} tap targets <44px: ${summary}`);
          }
        }

      } catch (err) {
        add('P0', s.name, vp.name, `Excepción: ${String(err).slice(0, 100)}`);
      }
    }

    await ctx.close();
  }

  await browser.close();

  // Resumen
  console.log('\n=== Resumen ===');
  ['P0', 'P1', 'P2', 'P3'].forEach(p => {
    const n = findings.filter(f => f.severity === p).length;
    console.log(`  ${p}: ${n}`);
  });

  const reportPath = resolve(OUT, '_findings.json');
  writeFileSync(reportPath, JSON.stringify(findings, null, 2));
  console.log(`\nReporte -> ${reportPath}`);
  console.log(`Screenshots -> ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
