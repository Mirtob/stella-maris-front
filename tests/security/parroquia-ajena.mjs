#!/usr/bin/env node
/**
 * ¿Puede un coro publicar en la parroquia de otro?
 *
 * Crea una cuenta desechable de **Coro**, le declara una parroquia, y prueba las tres
 * combinaciones que importan: su parroquia (debe poder), una capilla suya (debe poder)
 * y una parroquia ajena (no debe poder). Al final borra todo lo que creó.
 *
 * OPT-IN — escribe en producción. Correr:
 *   node tests/security/parroquia-ajena.mjs
 *
 * Va con la migración 20260824_scope_por_parroquia. Antes de aplicarla, el caso de la
 * parroquia ajena sale en rojo: ese es el agujero que cierra.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env'), 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const SB = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
const BASE = (env.PUBLIC_BASE_URL || 'https://stella-maris-front.vercel.app').replace(/\/$/, '');

const PROPIA = 'Parroquia QA Propia (Prueba) - Diócesis de Prueba';
const CAPILLA = `${PROPIA} · Capilla QA`;
const AJENA = 'Parroquia QA Ajena (Prueba) - Diócesis de Prueba';

let ok = 0, fail = 0;
const bien = (n, d = '') => { ok++; console.log(`  ✅ ${n}${d ? ` — ${d}` : ''}`); };
const mal = (n, d = '') => { fail++; console.log(`  ❌ ${n}${d ? ` — ${d}` : ''}`); };

const usuario = 'qa-par-' + Math.random().toString(36).slice(2, 7);
const clave = 'QaParroquia!' + Math.floor(Math.random() * 10000);

console.log(`\n=== Publicar fuera de la parroquia (cuenta desechable: ${usuario}) ===\n`);

const alta = await fetch(`${BASE}/api/signup-username`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: usuario, password: clave, name: 'QA Parroquia', role: 'Coro', instruments: ['Guitarra'] }),
});
if (!alta.ok) {
  console.log(`No se pudo crear la cuenta (http=${alta.status}). Si es 429, espera 15 min.`);
  process.exit(1);
}
const sesion = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: `${usuario}@usuario.stellamaris.app`, password: clave }),
})).json();
const TOKEN = sesion.access_token;
const UID = sesion.user?.id;
if (!TOKEN) { console.log('No se pudo iniciar sesión.'); process.exit(1); }
const H = { apikey: ANON, Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };

// El usuario declara su parroquia, igual que hace la app al terminar el registro.
const perfil = await fetch(`${SB}/rest/v1/user_profiles?id=eq.${UID}`, {
  method: 'PATCH', headers: H,
  body: JSON.stringify({ parishes: [PROPIA], parish_name: PROPIA }),
});
console.log(`  parroquia declarada: ${perfil.status === 200 ? PROPIA : 'ERROR http=' + perfil.status}\n`);

const creados = [];
/** Intenta publicar un cantoral en esa unidad. */
async function publicar(unidad) {
  const id = crypto.randomUUID();
  const r = await fetch(`${SB}/rest/v1/published_cantorals`, {
    method: 'POST', headers: H,
    body: JSON.stringify({
      id, choir_id: crypto.randomUUID(), choir_name: 'QA',
      parish_name: unidad, date: '2026-12-28',
      liturgical_date: 'PRUEBA DE PERMISOS', mass_time: '23:57',
      status: 'published', songs: [], published_by: 'QA',
    }),
  });
  if (r.status === 201) creados.push(id);
  return r.status;
}
/** Intenta agregar una celebración con ese alcance. */
async function celebrar(unidad) {
  const id = crypto.randomUUID();
  const r = await fetch(`${SB}/rest/v1/custom_liturgical_dates`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ id, name: 'QA PERMISOS', date: '2026-12-28', type: 'feast', scope: unidad }),
  });
  if (r.status === 201) creados.push({ cld: id });
  return r.status;
}

const propia = await publicar(PROPIA);
propia === 201 ? bien('publica en SU parroquia') : mal('NO puede publicar en su propia parroquia', `http=${propia}`);

const capilla = await publicar(CAPILLA);
capilla === 201 ? bien('publica en una capilla suya') : mal('NO puede publicar en su capilla', `http=${capilla}`);

const ajena = await publicar(AJENA);
ajena === 201 ? mal('PUBLICÓ en una parroquia ajena') : bien('no puede publicar en parroquia ajena', `http=${ajena}`);

const celPropia = await celebrar(PROPIA);
celPropia === 201 ? bien('agrega celebración en SU parroquia') : mal('NO puede agregar celebración propia', `http=${celPropia}`);

const celAjena = await celebrar(AJENA);
celAjena === 201 ? mal('AGREGÓ celebración en parroquia ajena') : bien('no puede agregar celebración ajena', `http=${celAjena}`);

const global = await celebrar('global');
global === 201 ? mal('creó una celebración GLOBAL sin ser admin') : bien('no puede crear celebraciones globales', `http=${global}`);

// ── Limpieza ────────────────────────────────────────────────────────────────
for (const c of creados) {
  if (typeof c === 'string') await fetch(`${SB}/rest/v1/published_cantorals?id=eq.${c}`, { method: 'DELETE', headers: H });
  else await fetch(`${SB}/rest/v1/custom_liturgical_dates?id=eq.${c.cld}`, { method: 'DELETE', headers: H });
}
const borrado = await fetch(`${BASE}/api/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` } });
console.log(`\nLimpieza: ${creados.length} fila(s) borradas, cuenta ${borrado.status === 200 ? 'borrada' : 'NO borrada (http=' + borrado.status + ')'}.`);
console.log(`\n${ok} correctos, ${fail} problemas.`);
if (borrado.status !== 200) console.log(`⚠️  Borra a mano la cuenta ${usuario} desde el panel de administración.`);
process.exit(fail > 0 ? 1 : 0);
