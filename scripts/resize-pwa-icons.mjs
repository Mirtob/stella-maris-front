#!/usr/bin/env node
/**
 * T15 hotfix — Re-genera los íconos PWA a sus dimensiones reales.
 *
 * Bug detectado: /icon-192.png, /icon-512.png y /apple-touch-icon.png eran
 * todos copias del mismo PNG de 1024x1024. Chrome rechaza esos íconos para
 * el install banner ("ícono no tiene el tamaño declarado") y consumen
 * 1.1MB cada uno cuando deberían pesar ~15KB.
 *
 * Estrategia: usar el Chromium de Playwright (ya instalado) para hacer el
 * resize via canvas — no requiere sharp ni jimp.
 *
 * Uso: node scripts/resize-pwa-icons.mjs
 */

import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const TARGETS = [
  { src: 'public/icon-512.png',        out: 'public/icon-192.png',        size: 192 },
  { src: 'public/icon-512.png',        out: 'public/icon-512.png',        size: 512 },
  { src: 'public/icon-512.png',        out: 'public/apple-touch-icon.png', size: 180 },
  // F3 — Logo importado via figma:asset/ por 8 componentes. Estaba en 1024x1024
  // a 1.2MB, descargado por cada primer load. Se muestra a max 224px en
  // Onboarding y 96px en otros. 384 con downscale de buena calidad es nítido
  // hasta @2x DPR sin pesar como antes.
  { src: 'src/assets/44767b9307cb7c59bba6fc5a03063ff51488551e.png',
    out: 'src/assets/44767b9307cb7c59bba6fc5a03063ff51488551e.png', size: 384 },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // HTML mínimo con un canvas
  await page.setContent(`<canvas id="c" width="1024" height="1024"></canvas>`);

  for (const t of TARGETS) {
    const srcPath = resolve(root, t.src);
    const outPath = resolve(root, t.out);
    const srcBytes = readFileSync(srcPath);
    const srcDataUrl = `data:image/png;base64,${srcBytes.toString('base64')}`;

    const dataUrl = await page.evaluate(async ({ srcDataUrl, size }) => {
      return await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, size, size);
          res(canvas.toDataURL('image/png'));
        };
        img.onerror = () => rej('img load failed');
        img.src = srcDataUrl;
      });
    }, { srcDataUrl, size: t.size });

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    writeFileSync(outPath, Buffer.from(base64, 'base64'));
    const sizeKb = (Buffer.byteLength(Buffer.from(base64, 'base64')) / 1024).toFixed(1);
    console.log(`[OK] ${t.out}  ->  ${t.size}x${t.size}  (${sizeKb} KB)`);
  }

  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
