// Portada/afiche con logo + QR + rótulo de descarga (para folleto de concierto).
// Uso: node scripts/build-qr-poster.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import QRCode from 'qrcode';

const URL = 'https://stella-maris-front.vercel.app/';
const OUT = 'C:/Users/gusta/Downloads/Portada-Concierto-Stella-Maris.png';

// Logo embebido (WebP del bundle) + QR embebido como data URI.
const logo = readFileSync('src/assets/logo-stella-maris.webp').toString('base64');
const qr = await QRCode.toDataURL(URL, { width: 900, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#16307a', light: '#ffffff' } });

// Datos del concierto.
const CONCERT = {
  fecha: 'Sábado 29 de agosto de 2026',
  coro: 'Coro Parroquia Santísimo Sacramento de Pirque',
  lugar: 'Santuario Inmaculada Concepción de Maipo',
};

// A5 vertical a 300 dpi = 1748 x 2480 px.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1748px;height:2480px}
  body{
    font-family:Georgia,'Times New Roman',serif; color:#0f2350;
    background:
      radial-gradient(120% 80% at 50% -8%, #dfe9ff 0%, transparent 52%),
      linear-gradient(180deg,#f7f3e8 0%, #efe7d3 100%);
    display:flex; flex-direction:column; align-items:center; text-align:center;
    padding:120px 130px 90px;
  }
  .halo{ position:relative; width:360px; height:360px; }
  .halo::before{ content:""; position:absolute; inset:-24px; border-radius:50%;
    background:radial-gradient(circle, rgba(58,110,220,.22), transparent 70%); }
  .logo{ width:360px; height:360px; border-radius:50%; object-fit:cover; position:relative;
    box-shadow:0 20px 48px rgba(15,35,80,.28); border:8px solid rgba(255,255,255,.85); }
  .brand{ font-size:74px; font-weight:bold; letter-spacing:-.5px; margin-top:34px; color:#12285e; }
  .tag{ font-size:34px; color:#8a6a2f; font-style:italic; margin-top:6px; }
  .rule{ width:300px; height:4px; margin:44px auto 36px; border-radius:3px;
    background:linear-gradient(90deg,transparent,#b8912f,transparent); }
  .event-label{ font-size:40px; letter-spacing:14px; text-transform:uppercase; color:#8a6a2f; font-weight:bold; }
  .coro{ font-size:62px; font-weight:bold; color:#12285e; line-height:1.15; margin:22px auto 0; max-width:1300px; }
  .fecha{ font-size:52px; color:#16307a; font-style:italic; margin-top:26px; }
  .lugar{ font-size:44px; color:#4a4f5c; margin-top:14px; max-width:1250px; }
  .rule2{ width:300px; height:4px; margin:44px auto 40px; border-radius:3px;
    background:linear-gradient(90deg,transparent,#b8912f,transparent); }
  .cta{ font-size:46px; font-weight:bold; color:#12285e; margin-bottom:6px; }
  .cta-sub{ font-size:32px; color:#4a4f5c; margin-bottom:32px; }
  .qr-card{ background:#fff; padding:40px; border-radius:38px;
    box-shadow:0 22px 52px rgba(15,35,80,.22); border:3px solid #e5ddc8; }
  .qr-card img{ width:560px; height:560px; display:block; }
  .url{ margin-top:28px; font-size:36px; color:#16307a; font-weight:bold; letter-spacing:.5px; }
  .foot{ margin-top:auto; font-size:28px; color:#6b6f7a; padding-top:34px; }
</style></head><body>
  <div class="halo"><img class="logo" src="data:image/webp;base64,${logo}"/></div>
  <div class="brand">Stella Maris</div>
  <div class="tag">Cantoral Litúrgico Católico</div>
  <div class="rule"></div>
  <div class="event-label">Concierto</div>
  <div class="coro">${CONCERT.coro}</div>
  <div class="fecha">${CONCERT.fecha}</div>
  <div class="lugar">${CONCERT.lugar}</div>
  <div class="rule2"></div>
  <div class="cta">Escanea para descargar la app</div>
  <div class="cta-sub">Sigue los cantos de la Misa en tu teléfono</div>
  <div class="qr-card"><img src="${qr}"/></div>
  <div class="url">stella-maris-front.vercel.app</div>
  <div class="foot">Instálala: <b>Agregar a pantalla de inicio</b> (iPhone) · <b>Instalar app</b> (Android)</div>
</body></html>`;

const tmp = 'scripts/.qr-poster.tmp.html';
writeFileSync(tmp, html, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1748, height: 2480 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(tmp)).href, { waitUntil: 'load' });
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log('Portada generada:', OUT);
