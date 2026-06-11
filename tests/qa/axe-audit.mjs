#!/usr/bin/env node
/**
 * axe-core audit sobre cada pantalla pre-login.
 * Inyecta axe en el contexto del page, corre axe.run(), reporta hallazgos.
 */
import { chromium, devices } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL_BASE = (process.argv[2] ?? 'https://stella-maris-front.vercel.app').replace(/\/$/, '');

const AXE_SRC = readFileSync(resolve(__dirname, '../../node_modules/axe-core/axe.min.js'), 'utf8');

const SCREENS = [
  { name: 'login',          path: '/' },
  { name: 'deeplink-valid', path: '/c/00000000-0000-4000-8000-000000000001' },
  { name: 'deeplink-bad',   path: '/c/hack' },
];

const findings = {};

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ ...devices['Pixel 7'] });
  const page = await ctx.newPage();

  for (const s of SCREENS) {
    console.log(`\n=== ${s.name} ===`);
    await page.goto(URL_BASE + s.path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000); // splash
    await page.evaluate(AXE_SRC);
    const result = await page.evaluate(async () => {
      // @ts-ignore
      const r = await axe.run({
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
      });
      return {
        violations: r.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          nodes: v.nodes.slice(0, 5).map(n => ({
            target: n.target,
            html: n.html.slice(0, 200),
            failureSummary: n.failureSummary?.slice(0, 200),
          })),
          count: v.nodes.length,
        })),
        passes: r.passes.length,
        incomplete: r.incomplete.length,
      };
    });

    findings[s.name] = result;
    console.log(`  Passes: ${result.passes}  |  Violations: ${result.violations.length}  |  Incomplete: ${result.incomplete}`);
    result.violations.forEach(v => {
      console.log(`  [${v.impact || '?'}] ${v.id}: ${v.help}  (${v.count} nodos)`);
      v.nodes.slice(0, 2).forEach(n => {
        console.log(`         ${n.target.join(' > ')}`);
      });
    });
  }

  await ctx.close();
  await browser.close();

  const out = resolve(__dirname, 'screenshots', '_axe-findings.json');
  writeFileSync(out, JSON.stringify(findings, null, 2));
  console.log(`\nReporte completo -> ${out}`);
}

main().catch(e => { console.error(e); process.exit(1); });
