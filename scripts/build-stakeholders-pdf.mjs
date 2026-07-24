// Genera el PDF del Informe Final de Entrega para stakeholders.
// Uso: node scripts/build-stakeholders-pdf.mjs
// Reutiliza el mismo motor md→HTML + Chromium de build-informe-pdf.mjs.
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'C:/Users/gusta/Downloads/Informe-Final-Stakeholders-StellaMaris.pdf';

const FILES = [
  { title: 'Informe Final de Entrega', file: 'docs/entrega/INFORME-FINAL-STAKEHOLDERS.md' },
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/^\[ \]\s/, '☐ ')
    .replace(/^\[[xX]\]\s/, '☑ ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    if (line.trim().startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(esc(lines[i])); i++; }
      i++;
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      continue;
    }

    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
      const rows = [];
      const header = line;
      i += 2;
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const th = cells(header).map((c) => `<th>${inline(c)}</th>`).join('');
      const trs = rows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`);
      continue;
    }

    if (line.trim().startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
      const paras = [];
      let cur = [];
      for (const b of buf) { if (b.trim() === '') { if (cur.length) { paras.push(cur.join(' ')); cur = []; } } else cur.push(b); }
      if (cur.length) paras.push(cur.join(' '));
      out.push(`<blockquote>${paras.map((p) => `<p>${inline(p)}</p>`).join('')}</blockquote>`);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }

    if (line.trim() === '---') { out.push('<hr>'); i++; continue; }

    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) {
        items.push(inline(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, '')));
        i++;
      }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map((it) => `<li>${it}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }

    if (line.trim() === '') { i++; continue; }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|>|\||```|---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

const sections = FILES
  .map((f) => `<section>${mdToHtml(readFileSync(f.file, 'utf8'))}</section>`)
  .join('\n');

const today = new Date().toISOString().slice(0, 10);
const cover = `
<div class="cover">
  <div class="star">✶</div>
  <h1 class="cover-title">Informe Final de Entrega</h1>
  <p class="cover-sub">Estado · QA · Operación · Costos · Riesgos · Hoja de ruta</p>
  <p class="cover-org">Stella Maris · Cantoral Litúrgico Católico</p>
  <div class="cover-note">
    <p>Documento de cierre para <strong>stakeholders</strong>: qué se entregó y en qué estado,
    resultados del <strong>aseguramiento de calidad</strong>, cómo <strong>operar la aplicación
    desde cualquier computador o teléfono</strong>, costos, riesgos, mapa de la documentación y una
    <strong>hoja de ruta de versiones anuales con valor estimado</strong>.</p>
    <p>Cifras económicas <em>estimativas</em> (no tasación formal). El estado vigente se mantiene en
    <code>docs/INFORME-FINAL.md</code>.</p>
    <p class="cover-date">Generado: ${today}</p>
  </div>
</div>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  :root{ --ink:#1f2430; --soft:#4a4f5c; --gold:#9a7636; --blue:#2d4a7a; --line:#d6d3c8; }
  *{box-sizing:border-box}
  body{ font-family:Georgia,'Times New Roman',serif; color:var(--ink); line-height:1.5; font-size:11pt; margin:0; }
  section{ page-break-before:always; }
  .cover{ page-break-after:always; text-align:center; padding-top:120px; }
  .cover .star{ color:var(--gold); font-size:52pt; }
  .cover-title{ font-size:34pt; margin:6px 0 4px; letter-spacing:-.01em; }
  .cover-sub{ font-size:12.5pt; color:var(--soft); margin:0; }
  .cover-org{ font-size:12pt; color:var(--gold); font-weight:bold; margin:8px 0 40px; }
  .cover-note{ text-align:left; max-width:520px; margin:0 auto; font-size:11pt; color:var(--soft);
    border-top:2px solid var(--line); padding-top:22px; }
  .cover-date{ color:var(--gold); font-weight:bold; margin-top:16px; }
  h1{ font-size:19pt; color:var(--ink); border-bottom:2px solid var(--gold); padding-bottom:6px; margin:0 0 12px; }
  h2{ font-size:13pt; color:var(--blue); margin:20px 0 4px; }
  h3{ font-size:11.5pt; color:var(--ink); margin:14px 0 4px; }
  p{ margin:0 0 8px; }
  strong{ color:var(--ink); }
  blockquote{ margin:8px 0 14px; padding:9px 15px; border-left:3px solid var(--gold);
    background:#faf7ef; font-size:10.5pt; }
  blockquote p{ margin:0 0 6px; } blockquote p:last-child{ margin-bottom:0; }
  hr{ border:none; border-top:1px solid var(--line); margin:15px 0; }
  code{ font-family:'Courier New',monospace; font-size:9.5pt; background:#eef0f4; padding:1px 4px; border-radius:3px; }
  pre{ background:#f4f2ea; border:1px solid var(--line); border-radius:5px; padding:9px 11px; font-size:9pt;
    white-space:pre-wrap; }
  pre code{ background:none; padding:0; }
  ul,ol{ margin:0 0 10px; padding-left:22px; } li{ margin:0 0 3px; }
  table{ border-collapse:collapse; width:100%; margin:8px 0 14px; font-size:9.5pt; }
  th,td{ border:1px solid var(--line); padding:5px 7px; text-align:left; vertical-align:top; }
  th{ background:#eceadf; }
  tr,h2,h3,blockquote{ page-break-inside:avoid; }
</style></head><body>${cover}${sections}</body></html>`;

const tmp = 'scripts/.stakeholders.tmp.html';
writeFileSync(tmp, html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + process.cwd().replace(/\\/g, '/') + '/' + tmp, { waitUntil: 'load' });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font-size:8pt;color:#9a8;text-align:center;font-family:Georgia,serif;">Stella Maris · Informe Final de Entrega — <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', OUT);
