#!/usr/bin/env node
/**
 * Stella Maris — Prueba de carga controlada (BAJA)
 *
 * Dispara 35 requests en 60 segundos contra /api/sheets.
 * Verifica:
 *   - El rate-limit responde 429 cuando se excede el límite configurado (20/min)
 *   - Headers X-RateLimit-* presentes
 *   - El servidor no cae
 *
 * Uso:
 *   node tests/stress/rate-limit.mjs
 *
 * Variables (tests/.env):
 *   PUBLIC_BASE_URL  → https://tu-dominio.vercel.app
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[k]) process.env[k] = v;
  }
}

const BASE = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';
const TOTAL_REQUESTS = 35;     // 35 requests
const WINDOW_SECONDS = 60;     // En 60 segundos
const TARGET_PATH = '/api/sheets';
const EXPECTED_LIMIT = 20;     // Según rate-limit.ts → 20 req/min para /api/sheets

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  STELLA MARIS — Prueba de Estrés (BAJA: 35 req/min)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Target:   ${BASE}${TARGET_PATH}`);
console.log(`  Requests: ${TOTAL_REQUESTS} en ${WINDOW_SECONDS}s`);
console.log(`  Esperado: ~${EXPECTED_LIMIT} OK + ${TOTAL_REQUESTS - EXPECTED_LIMIT} con 429`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const stats = {
  ok200: 0,
  rate429: 0,
  other4xx: 0,
  server5xx: 0,
  network: 0,
  totalMs: 0,
  rateLimitHeaderSeen: false,
  minRateLimitRemaining: Infinity,
};

const intervalMs = (WINDOW_SECONDS * 1000) / TOTAL_REQUESTS;
const t0 = Date.now();

for (let i = 1; i <= TOTAL_REQUESTS; i++) {
  const reqStart = Date.now();
  try {
    const r = await fetch(`${BASE}${TARGET_PATH}`, {
      headers: { Origin: BASE, 'User-Agent': 'StellaMarisStressTest/1.0' },
    });
    const elapsed = Date.now() - reqStart;
    stats.totalMs += elapsed;

    const remaining = r.headers.get('x-ratelimit-remaining');
    if (remaining !== null) {
      stats.rateLimitHeaderSeen = true;
      stats.minRateLimitRemaining = Math.min(stats.minRateLimitRemaining, parseInt(remaining, 10));
    }

    let bucket;
    if (r.status === 200) { stats.ok200++; bucket = 'OK'; }
    else if (r.status === 429) { stats.rate429++; bucket = '429'; }
    else if (r.status >= 500) { stats.server5xx++; bucket = `${r.status}`; }
    else { stats.other4xx++; bucket = `${r.status}`; }

    console.log(
      `  [${String(i).padStart(2, '0')}/${TOTAL_REQUESTS}] ${bucket.padEnd(4)} ${elapsed}ms` +
      (remaining !== null ? `  remaining=${remaining}` : '')
    );
  } catch (e) {
    stats.network++;
    console.log(`  [${String(i).padStart(2, '0')}/${TOTAL_REQUESTS}] NETWORK ERROR — ${e.message}`);
  }

  // Esperar el intervalo restante para mantener la cadencia
  const sinceStart = Date.now() - t0;
  const targetMs = i * intervalMs;
  const delay = Math.max(0, targetMs - sinceStart);
  if (i < TOTAL_REQUESTS) await new Promise(res => setTimeout(res, delay));
}

const totalElapsed = ((Date.now() - t0) / 1000).toFixed(1);
const avgMs = (stats.totalMs / (stats.ok200 + stats.rate429 + stats.other4xx)).toFixed(0);

console.log('\n━━━ Resumen ━━━');
console.log(`  Duración total:       ${totalElapsed}s`);
console.log(`  200 OK:                ${stats.ok200}`);
console.log(`  429 Rate Limit:        ${stats.rate429}`);
console.log(`  4xx otros:             ${stats.other4xx}`);
console.log(`  5xx server errors:     ${stats.server5xx}`);
console.log(`  Network errors:        ${stats.network}`);
console.log(`  Latencia promedio:     ${avgMs}ms`);
console.log(`  Headers X-RateLimit:   ${stats.rateLimitHeaderSeen ? 'SÍ' : 'NO'}`);
console.log(`  Min remaining visto:   ${stats.minRateLimitRemaining === Infinity ? 'N/A' : stats.minRateLimitRemaining}`);

console.log('\n━━━ Veredictos ━━━');
const verdicts = [];

if (stats.rate429 > 0) {
  verdicts.push(`✅ Rate limit ACTIVO: ${stats.rate429} requests recibieron 429`);
} else {
  verdicts.push(`⚠️ Rate limit NO disparó (esperaba >${TOTAL_REQUESTS - EXPECTED_LIMIT} 429s)`);
}

if (stats.rateLimitHeaderSeen) {
  verdicts.push(`✅ Headers X-RateLimit-* presentes`);
} else {
  verdicts.push(`⚠️ Headers X-RateLimit-* NO vistos`);
}

if (stats.server5xx > 0) {
  verdicts.push(`❌ ${stats.server5xx} respuestas 5xx — el servidor falló bajo carga`);
} else {
  verdicts.push(`✅ Cero 5xx — el servidor manejó la carga`);
}

if (stats.network > 0) {
  verdicts.push(`⚠️ ${stats.network} errores de red`);
}

for (const v of verdicts) console.log(`  ${v}`);

console.log('\n--- JSON ---');
console.log(JSON.stringify({ stats, totalElapsed, avgMs, verdicts }, null, 2));
