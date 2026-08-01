#!/usr/bin/env node
/**
 * Rota CRON_SECRET en Vercel (Production + Preview) y deja el endpoint del cron
 * exigiendo el secreto NUEVO.
 *
 *   node scripts/rotate-cron-secret.mjs
 *
 * Qué hace, en orden:
 *   1. Genera un secreto nuevo (32 bytes aleatorios, base64url).
 *   2. Borra el CRON_SECRET viejo de Production y Preview y sube el nuevo.
 *   3. Fuerza un redeploy: las funciones serverless leen las env vars en el BUILD,
 *      así que sin esto el endpoint seguiría validando contra el secreto viejo.
 *   4. Verifica contra producción que el secreto viejo da 401 y el nuevo da 200.
 *
 * Requiere el CLI de Vercel autenticado y el proyecto linkeado (`npx vercel link`).
 * El secreto nuevo se imprime UNA sola vez: Vercel lo cifra y no lo vuelve a mostrar.
 */

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';

const ENDPOINT = 'https://stella-maris-front.vercel.app/api/cron/celebration-reminders?dry=1';
const ENVS = ['production', 'preview'];
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const run = (args, opts = {}) =>
  execFileSync(npx, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], ...opts });

/** `vercel env rm` pregunta por consola; --yes lo salta. Si no existe, seguimos igual. */
function removeIfPresent(env) {
  try {
    run(['vercel', 'env', 'rm', 'CRON_SECRET', env, '--yes']);
    console.log(`   - borrado el anterior en ${env}`);
  } catch {
    console.log(`   - no había uno previo en ${env}`);
  }
}

async function statusWith(bearer) {
  const r = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${bearer}` } });
  return r.status;
}

const oldSecret = (process.env.CRON_SECRET_OLD || '').trim(); // opcional, solo para verificar
const secret = randomBytes(32).toString('base64url');

console.log('1) Secreto nuevo generado.\n');

console.log('2) Actualizando en Vercel…');
for (const env of ENVS) {
  removeIfPresent(env);
  run(['vercel', 'env', 'add', 'CRON_SECRET', env], { input: secret });
  console.log(`   + subido a ${env}`);
}

console.log('\n3) Redeploy a producción (las funciones leen las env vars en el build)…');
run(['vercel', '--prod', '--yes'], { stdio: ['pipe', 'inherit', 'inherit'] });

console.log('\n4) Verificando contra producción…');
if (oldSecret) {
  const before = await statusWith(oldSecret);
  console.log(`   secreto VIEJO → HTTP ${before} ${before === 401 ? '✅ (rechazado)' : '❌ ¡todavía sirve!'}`);
}
const after = await statusWith(secret);
console.log(`   secreto NUEVO → HTTP ${after} ${after === 200 ? '✅' : '❌ revisar'}`);

console.log('\n=============================================================');
console.log('CRON_SECRET nuevo (guárdalo, Vercel no lo vuelve a mostrar):');
console.log(`\n  ${secret}\n`);
console.log('=============================================================');
console.log('Si alguna rutina o cron externo usaba el secreto viejo, actualízalo.');
