/**
 * Genera PDFs imprimibles de los manuales (docs/manuales/*.md) usando marked
 * (Markdown→HTML) + Playwright/Chromium (HTML→PDF). Salida: docs/manuales/pdf/.
 *
 * Uso:  node scripts/manuales-to-pdf.mjs
 * Requiere (dev/temporal):  npm install --no-save marked   (Playwright ya está)
 */
import { marked } from 'marked';
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(__dirname, '../docs/manuales');
const OUT = resolve(SRC, 'pdf');
mkdirSync(OUT, { recursive: true });

const FILES = [
  { md: 'MANUAL-PUEBLO-FIEL.md', pdf: 'Manual-Pueblo-fiel.pdf' },
  { md: 'MANUAL-CORO.md', pdf: 'Manual-Coro.pdf' },
  { md: 'MANUAL-CANAL-Y-CONTENIDO.md', pdf: 'Manual-Canal-y-Contenido.pdf' },
];

const CSS = `
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #1e293b;
         line-height: 1.55; font-size: 12.5px; }
  h1 { color: #0f2a52; font-size: 26px; border-bottom: 3px solid #c9a227; padding-bottom: 8px;
       margin: 0 0 14px; }
  h2 { color: #0f2a52; font-size: 18px; margin: 22px 0 8px; border-bottom: 1px solid #e2e8f0;
       padding-bottom: 4px; }
  h3 { color: #1e3a5f; font-size: 14.5px; margin: 16px 0 6px; }
  p, li { font-size: 12.5px; }
  a { color: #1d4ed8; text-decoration: none; }
  code { background: #f1f5f9; padding: 1px 5px; border-radius: 4px;
         font-family: "SFMono-Regular", Consolas, monospace; font-size: 11.5px; color: #0f172a; }
  pre { background: #0f172a; color: #e2e8f0; padding: 12px 14px; border-radius: 8px;
        overflow: auto; font-size: 11px; line-height: 1.45; }
  pre code { background: transparent; color: inherit; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 11.5px; }
  th, td { border: 1px solid #cbd5e1; padding: 6px 9px; text-align: left; vertical-align: top; }
  th { background: #eef2ff; color: #0f2a52; }
  tr:nth-child(even) td { background: #f8fafc; }
  blockquote { border-left: 4px solid #c9a227; background: #fffbeb; margin: 12px 0;
               padding: 8px 14px; border-radius: 0 6px 6px 0; }
  blockquote p { margin: 4px 0; }
  ul, ol { padding-left: 22px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 18px 0; }
  h1, h2, h3 { break-after: avoid; }
  table, pre, blockquote { break-inside: avoid; }
`;

function htmlFor(mdContent) {
  const body = marked.parse(mdContent);
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <style>${CSS}</style></head><body>${body}</body></html>`;
}

const FOOTER = `<div style="width:100%; font-size:8px; color:#94a3b8; padding:0 12mm;
  display:flex; justify-content:space-between;">
  <span>Stella Maris — Manual de usuario</span>
  <span>Pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;

const browser = await chromium.launch();
const page = await browser.newPage();

for (const f of FILES) {
  const md = readFileSync(resolve(SRC, f.md), 'utf8');
  const tmpHtml = resolve(OUT, f.md.replace(/\.md$/, '.html'));
  writeFileSync(tmpHtml, htmlFor(md), 'utf8');
  await page.goto('file://' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle' });
  await page.pdf({
    path: resolve(OUT, f.pdf),
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '15mm', right: '15mm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: FOOTER,
  });
  console.log('✓ ' + f.pdf);
}

await browser.close();
console.log('PDFs en: ' + OUT);
