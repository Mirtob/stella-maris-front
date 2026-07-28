// Afiche con QR al canal de YouTube + llamado a suscribirse.
// El enlace abre el canal y dispara el diálogo de suscripción (?sub_confirmation=1).
// Uso: node scripts/build-qr-youtube.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
import QRCode from 'qrcode';

const CHANNEL_ID = 'UCedHkUw2L74J-5XE8p7gLpg';
const HANDLE = '@stellamarismusicacatolica';
const URL = `https://www.youtube.com/channel/${CHANNEL_ID}?sub_confirmation=1`;
const OUT = 'C:/Users/gusta/Downloads/QR-YouTube-Stella-Maris.png';

// Logo embebido (WebP del bundle) + QR embebido como data URI (rojo oscuro, alto contraste).
const logo = readFileSync('src/assets/logo-stella-maris.webp').toString('base64');
const qr = await QRCode.toDataURL(URL, { width: 900, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#8f0f0f', light: '#ffffff' } });

// A5 vertical a 300 dpi = 1748 x 2480 px.
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1748px;height:2480px}
  body{
    font-family:Georgia,'Times New Roman',serif; color:#1a1a1a;
    background:#ffffff;
    display:flex; flex-direction:column; align-items:center; text-align:center;
    padding:120px 130px 90px;
  }
  .halo{ position:relative; width:340px; height:340px; }
  .logo{ width:340px; height:340px; border-radius:50%; object-fit:cover; position:relative;
    box-shadow:0 18px 44px rgba(15,35,80,.26); border:8px solid rgba(255,255,255,.9); }
  .brand{ font-size:66px; font-weight:bold; letter-spacing:-.5px; margin-top:30px; color:#12285e; }
  .tag{ font-size:32px; color:#8a6a2f; font-style:italic; margin-top:6px; }
  .rule{ width:300px; height:4px; margin:46px auto 40px; border-radius:3px;
    background:linear-gradient(90deg,transparent,#cc0000,transparent); }
  .hook{ font-size:66px; font-weight:bold; color:#12285e; line-height:1.2; max-width:1330px; }
  .hook .accent{ color:#c4302b; }
  .sub{ font-size:40px; color:#4a4f5c; margin-top:26px; max-width:1250px; }
  .arrow{ font-size:44px; color:#c4302b; margin:26px 0 34px; font-weight:bold; }
  .qr-card{ background:#fff; padding:40px; border-radius:38px;
    box-shadow:0 22px 52px rgba(140,20,20,.20); border:4px solid #f0d6d6; }
  .qr-card img{ width:560px; height:560px; display:block; }
  .subscribe{ display:inline-flex; align-items:center; gap:22px; margin-top:44px;
    background:#c4302b; color:#fff; font-family:Arial,Helvetica,sans-serif; font-weight:bold;
    font-size:46px; padding:26px 54px; border-radius:20px; box-shadow:0 14px 30px rgba(196,48,43,.35); }
  .play{ display:inline-flex; align-items:center; justify-content:center; width:70px; height:50px;
    background:#fff; border-radius:12px; color:#c4302b; font-size:34px; }
  .handle{ margin-top:30px; font-size:40px; color:#8f0f0f; font-weight:bold; font-family:Arial,Helvetica,sans-serif; }
  .foot{ margin-top:auto; font-size:30px; color:#6b6f7a; padding-top:30px; }
</style></head><body>
  <div class="halo"><img class="logo" src="data:image/webp;base64,${logo}"/></div>
  <div class="brand">Stella Maris</div>
  <div class="tag">Música Católica</div>
  <div class="rule"></div>
  <div class="hook">¿Quieres <span class="accent">volver a escuchar</span> estos cantos?</div>
  <div class="sub">Encuéntralos en nuestro canal de YouTube — y no te pierdas los próximos.</div>
  <div class="arrow">Escanea aquí ↓</div>
  <div class="qr-card"><img src="${qr}"/></div>
  <div class="subscribe"><span class="play">&#9654;</span> Suscríbete al canal</div>
  <div class="handle">${HANDLE}</div>
  <div class="foot">Al escanear se abre el canal y podrás <b>suscribirte</b> con un toque.</div>
</body></html>`;

const tmp = 'scripts/.qr-youtube.tmp.html';
writeFileSync(tmp, html, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1748, height: 2480 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(resolve(tmp)).href, { waitUntil: 'load' });
await page.screenshot({ path: OUT, type: 'png' });
await browser.close();
console.log('Afiche YouTube generado:', OUT);
