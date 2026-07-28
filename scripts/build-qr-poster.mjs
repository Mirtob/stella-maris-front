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

// A5 vertical a 300 dpi = 1748 x 2480 px.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1748px;height:2480px}
  body{
    font-family:Georgia,'Times New Roman',serif; color:#0f2350;
    background:
      radial-gradient(120% 80% at 50% -10%, #dfe9ff 0%, transparent 55%),
      linear-gradient(180deg,#f7f3e8 0%, #efe7d3 100%);
    display:flex; flex-direction:column; align-items:center; text-align:center;
    padding:150px 130px 120px;
  }
  .halo{ position:relative; width:520px; height:520px; margin-top:40px; }
  .halo::before{ content:""; position:absolute; inset:-30px; border-radius:50%;
    background:radial-gradient(circle, rgba(58,110,220,.22), transparent 70%); }
  .logo{ width:520px; height:520px; border-radius:50%; object-fit:cover; position:relative;
    box-shadow:0 24px 60px rgba(15,35,80,.28); border:10px solid rgba(255,255,255,.85); }
  .brand{ font-size:118px; font-weight:bold; letter-spacing:-.5px; margin-top:70px; color:#12285e; }
  .tag{ font-size:52px; color:#8a6a2f; font-style:italic; margin-top:14px; }
  .rule{ width:360px; height:5px; margin:56px auto; border-radius:3px;
    background:linear-gradient(90deg,transparent,#b8912f,transparent); }
  .cta{ font-size:64px; font-weight:bold; color:#12285e; margin-bottom:8px; }
  .cta-sub{ font-size:40px; color:#4a4f5c; margin-bottom:44px; }
  .qr-card{ background:#fff; padding:52px; border-radius:44px;
    box-shadow:0 26px 60px rgba(15,35,80,.22); border:3px solid #e5ddc8; }
  .qr-card img{ width:820px; height:820px; display:block; }
  .url{ margin-top:40px; font-size:44px; color:#16307a; font-weight:bold; letter-spacing:.5px; }
  .foot{ margin-top:auto; font-size:34px; color:#6b6f7a; }
</style></head><body>
  <div class="halo"><img class="logo" src="data:image/webp;base64,${logo}"/></div>
  <div class="brand">Stella Maris</div>
  <div class="tag">Cantoral Litúrgico Católico</div>
  <div class="rule"></div>
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
