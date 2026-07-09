// Genera un PDF con todos los guiones de formación, para compartir con los formadores.
// Uso: node scripts/build-guiones-pdf.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const DIR = 'docs/formacion';
const OUT = 'C:/Users/gusta/Downloads/Guiones-Formacion-StellaMaris.pdf';

const FILES = [
  'guiones-trimestre-1.md',
  'guiones-trimestre-2.md',
  'guiones-trimestre-3.md',
  'guiones-trimestre-4.md',
  'guiones-ano-2.md',
  'guiones-ano-3.md',
];

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');

function mdToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    let line = lines[i];

    // Bloque de código ``` ```
    if (line.trim().startsWith('```')) {
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { buf.push(esc(lines[i])); i++; }
      i++;
      out.push(`<pre><code>${buf.join('\n')}</code></pre>`);
      continue;
    }

    // Tabla
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|[-:\s|]+\|\s*$/.test(lines[i + 1])) {
      const rows = [];
      const header = line;
      i += 2; // saltar separador
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i]); i++; }
      const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      const th = cells(header).map((c) => `<th>${inline(c)}</th>`).join('');
      const trs = rows.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('');
      out.push(`<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`);
      continue;
    }

    // Cita (guion)
    if (line.trim().startsWith('>')) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      const paras = [];
      let cur = [];
      for (const b of buf) { if (b.trim() === '') { if (cur.length) { paras.push(cur.join(' ')); cur = []; } } else cur.push(b); }
      if (cur.length) paras.push(cur.join(' '));
      out.push(`<blockquote>${paras.map((p) => `<p>${inline(p)}</p>`).join('')}</blockquote>`);
      continue;
    }

    // Encabezados
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) { const lvl = h[1].length; out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); i++; continue; }

    // Regla
    if (line.trim() === '---') { out.push('<hr>'); i++; continue; }

    // Listas
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

    // Párrafo / vacío
    if (line.trim() === '') { i++; continue; }
    const buf = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|>|\||```|---|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) { buf.push(lines[i]); i++; }
    out.push(`<p>${inline(buf.join(' '))}</p>`);
  }
  return out.join('\n');
}

const sections = FILES.map((f) => `<section>${mdToHtml(readFileSync(`${DIR}/${f}`, 'utf8'))}</section>`).join('\n');

const cover = `
<div class="cover">
  <div class="star">✶</div>
  <h1 class="cover-title">Camino de formación</h1>
  <p class="cover-sub">Guiones de grabación · Músico litúrgico católico</p>
  <p class="cover-org">Stella Maris · Música Católica</p>
  <div class="cover-note">
    <p><strong>Para los formadores.</strong> Este documento reúne los guiones de las cápsulas de
    formación (videos de 5–12 min). Cada guion sigue la misma estructura:
    <em>gancho → desarrollo → la fuente (cita del Magisterio) → ejemplo → cierre + reto</em>.</p>
    <p>El tono es cálido y formativo: se habla a un coro, no se da una clase. Al final de cada
    cápsula, la app presenta un breve cuestionario (ya cargado).</p>
    <p>Todo el contenido se ancla en el Magisterio de la Iglesia (Sacrosanctum Concilium, Musicam
    Sacram, san Pío X, la IGMR, el Catecismo, entre otros). Se agradece la revisión teológica de
    quien preste su servicio.</p>
  </div>
</div>`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  :root{ --ink:#221d2e; --soft:#4a4557; --gold:#9a7636; --violet:#5b3f7a; --line:#d8cfb8; }
  *{box-sizing:border-box}
  body{ font-family:Georgia,'Times New Roman',serif; color:var(--ink); line-height:1.5; font-size:11.5pt; margin:0; }
  section{ page-break-before:always; }
  .cover{ page-break-after:always; text-align:center; padding-top:130px; }
  .cover .star{ color:var(--gold); font-size:52pt; }
  .cover-title{ font-size:34pt; margin:6px 0 4px; letter-spacing:-.01em; }
  .cover-sub{ font-size:14pt; color:var(--soft); margin:0; }
  .cover-org{ font-size:12pt; color:var(--gold); font-weight:bold; margin:8px 0 40px; }
  .cover-note{ text-align:left; max-width:520px; margin:0 auto; font-size:11pt; color:var(--soft);
    border-top:2px solid var(--line); padding-top:22px; }
  h1{ font-size:20pt; color:var(--ink); border-bottom:2px solid var(--gold); padding-bottom:6px; margin:0 0 14px; }
  h2{ font-size:13pt; color:var(--violet); margin:22px 0 4px; }
  h3{ font-size:12pt; color:var(--ink); margin:16px 0 4px; }
  p{ margin:0 0 8px; }
  strong{ color:var(--ink); }
  blockquote{ margin:8px 0 14px; padding:10px 16px; border-left:3px solid var(--gold);
    background:#faf6ec; font-size:11pt; }
  blockquote p{ margin:0 0 7px; }
  blockquote p:last-child{ margin-bottom:0; }
  hr{ border:none; border-top:1px solid var(--line); margin:16px 0; }
  code{ font-family:'Courier New',monospace; font-size:10pt; background:#f0ece0; padding:1px 4px; border-radius:3px; }
  pre{ background:#f4f0e6; border:1px solid var(--line); border-radius:5px; padding:10px 12px; font-size:9.5pt;
    white-space:pre-wrap; }
  pre code{ background:none; padding:0; }
  ul,ol{ margin:0 0 10px; padding-left:22px; }
  li{ margin:0 0 4px; }
  table{ border-collapse:collapse; width:100%; margin:8px 0 14px; font-size:10pt; }
  th,td{ border:1px solid var(--line); padding:5px 8px; text-align:left; vertical-align:top; }
  th{ background:#efe9db; }
  h2,h3,blockquote,table{ page-break-inside:avoid; }
</style></head><body>${cover}${sections}</body></html>`;

const tmp = 'scripts/.guiones.tmp.html';
writeFileSync(tmp, html, 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file://' + process.cwd().replace(/\\/g, '/') + '/' + tmp, { waitUntil: 'load' });
await page.pdf({
  path: OUT,
  format: 'A4',
  printBackground: true,
  margin: { top: '18mm', bottom: '18mm', left: '18mm', right: '18mm' },
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font-size:8pt;color:#9a8; text-align:center;font-family:Georgia,serif;">Stella Maris · Camino de formación — <span class="pageNumber"></span>/<span class="totalPages"></span></div>',
});
await browser.close();
console.log('PDF generado:', OUT);
