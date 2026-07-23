import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const SRC = 'src/assets/44767b9307cb7c59bba6fc5a03063ff51488551e.png';
const OUT = 'src/assets/logo-stella-maris.webp';
const SIZE = 384;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<canvas></canvas>');
const srcBytes = readFileSync(resolve(root, SRC));
const srcDataUrl = `data:image/png;base64,${srcBytes.toString('base64')}`;
const dataUrl = await page.evaluate(async ({ srcDataUrl, size }) => {
  return await new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, size, size);
      res(c.toDataURL('image/webp', 0.9));
    };
    img.onerror = () => rej('img load failed');
    img.src = srcDataUrl;
  });
}, { srcDataUrl, size: SIZE });
const base64 = dataUrl.replace(/^data:image\/webp;base64,/, '');
const buf = Buffer.from(base64, 'base64');
writeFileSync(resolve(root, OUT), buf);
console.log(`[OK] ${OUT} -> ${SIZE}x${SIZE} (${(buf.length/1024).toFixed(1)} KB)`);
await browser.close();
