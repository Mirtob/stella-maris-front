#!/usr/bin/env node
/**
 * Auto-ataque: escalada de privilegios con una sesión REAL.
 *
 * Crea una cuenta desechable de "Pueblo fiel" por la vía normal (el registro
 * autoservicio de la app), intenta hacer con ella todo lo que no debería poder, y
 * la borra al terminar. Es la única forma de probar de verdad las políticas RLS:
 * el resto de la suite corre con la anon key y solo cubre al anónimo.
 *
 * OPT-IN — escribe en producción (una cuenta, que después borra). Correr:
 *   node tests/security/escalada.mjs
 *
 * Hallazgo que originó esta prueba (23-ago-2026): `cantorals_insert` solo pedía
 * estar autenticado, así que una cuenta cualquiera publicaba un cantoral visible
 * para todos. Corregido en la migración 20260823_publish_requires_choir.
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

let ok = 0, fail = 0;
const pass = (n, d = '') => { ok++; console.log(`  ✅ ${n}${d ? ` — ${d}` : ''}`); };
const bad = (n, d = '') => { fail++; console.log(`  ❌ ESCALÓ ${n}${d ? ` — ${d}` : ''}`); };

const usuario = 'qa-sec-' + Math.random().toString(36).slice(2, 8);
const clave = 'QaSeguridad!' + Math.floor(Math.random() * 10000);
const correo = `${usuario}@usuario.stellamaris.app`;

console.log(`\n=== Auto-ataque de escalada (cuenta desechable: ${usuario}) ===\n`);

// ── Alta + sesión ────────────────────────────────────────────────────────────
const alta = await fetch(`${BASE}/api/signup-username`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: usuario, password: clave, name: 'QA Seguridad', role: 'Pueblo fiel' }),
});
if (!alta.ok) {
  console.log(`No se pudo crear la cuenta de prueba (http=${alta.status}). ` +
    'Si es 429, el límite de registros por IP está haciendo su trabajo: espera 15 min.');
  process.exit(1);
}
const sesion = await (await fetch(`${SB}/auth/v1/token?grant_type=password`, {
  method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: correo, password: clave }),
})).json();
const TOKEN = sesion.access_token;
const UID = sesion.user?.id;
if (!TOKEN) { console.log('No se pudo iniciar sesión con la cuenta de prueba.'); process.exit(1); }

const H = { apikey: ANON, Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
const rest = async (metodo, ruta, body) => {
  const r = await fetch(`${SB}/rest/v1/${ruta}`, { method: metodo, headers: H, body: body && JSON.stringify(body) });
  const t = await r.text();
  let filas = 0, code = null;
  try { const d = JSON.parse(t || '[]'); if (Array.isArray(d)) filas = d.length; else code = d.code; } catch { /* sin cuerpo */ }
  return { status: r.status, filas, code, texto: t.replace(/\s+/g, ' ').slice(0, 100) };
};
/** Escribir debe fallar, o al menos no tocar ninguna fila. */
const bloqueado = r => r.status >= 400 || r.filas === 0;

// ── Lectura de datos ajenos ─────────────────────────────────────────────────
const perfiles = await rest('GET', 'user_profiles?select=id,email,role');
perfiles.filas <= 1
  ? pass('user_profiles: solo ve su propia ficha', `${perfiles.filas} fila(s)`)
  : bad('user_profiles: ve fichas ajenas', `${perfiles.filas} filas`);

for (const [tabla, ruta] of [
  ['admins', 'admins?select=*'],
  ['push_subscriptions', 'push_subscriptions?select=*'],
  ['survey_responses', 'survey_responses?select=*'],
  ['cron_runs', 'cron_runs?select=*'],
]) {
  const r = await rest('GET', ruta);
  r.filas === 0 ? pass(`${tabla}: no lee nada`) : bad(`${tabla}: leyó ${r.filas} filas`);
}

// ── Escritura y escalada ────────────────────────────────────────────────────
const casos = [
  ['ascenderse a Admin', () => rest('PATCH', `user_profiles?id=eq.${UID}`, { role: 'Admin' })],
  ['agregarse a la tabla admins', () => rest('POST', 'admins', { email: correo })],
  ['insertar un canto', () => rest('POST', 'songs', { title: 'ATAQUE QA', mass_moment: 'entrada' })],
  ['renombrar cantos ajenos', () => rest('PATCH', 'songs?title=neq.zzz', { title: 'HACKEADO' })],
  ['borrar el catálogo', () => rest('DELETE', 'songs?id=neq.00000000-0000-0000-0000-000000000000')],
  ['crear etiquetas de canto', () => rest('POST', 'song_tags', { label: 'ATAQUE QA' })],
  ['crear parroquias', () => rest('POST', 'custom_parishes', { name: 'ATAQUE QA' })],
  ['borrar cantorales ajenos', () => rest('DELETE', 'published_cantorals?id=neq.00000000-0000-0000-0000-000000000000')],
];
for (const [nombre, fn] of casos) {
  const r = await fn();
  bloqueado(r) ? pass(nombre + ': bloqueado', `http=${r.status}${r.code ? ' ' + r.code : ''}`)
               : bad(nombre, r.texto);
}

// ── El caso que originó la prueba: publicar un cantoral ─────────────────────
const falso = {
  id: crypto.randomUUID(), choir_id: crypto.randomUUID(), choir_name: 'QA',
  parish_name: 'ATAQUE QA - BORRAR', date: '2026-12-31',
  liturgical_date: 'PRUEBA DE SEGURIDAD', mass_time: '23:59',
  status: 'published', songs: [], published_by: 'ATAQUE QA',
};
const pub = await rest('POST', 'published_cantorals', falso);
if (pub.status === 201) {
  const anon = await (await fetch(`${SB}/rest/v1/published_cantorals?id=eq.${falso.id}&select=id`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } })).json();
  bad('publicar un cantoral siendo Pueblo fiel',
    `quedó publicado y ${anon.length ? 'visible hasta para anónimos' : 'visible'}`);
  await rest('DELETE', `published_cantorals?id=eq.${falso.id}`);   // limpieza inmediata
} else {
  pass('publicar un cantoral siendo Pueblo fiel: bloqueado', `http=${pub.status} ${pub.code || ''}`);
}

// ── Endpoints privilegiados con un token real pero sin rol ──────────────────
for (const [nombre, ruta, cuerpo, esperado] of [
  ['api/admin-users', '/api/admin-users', { action: 'list' }, [401, 403]],
  ['api/notify-cantoral', '/api/notify-cantoral', { cantoralId: crypto.randomUUID() }, [403]],
]) {
  const r = await fetch(BASE + ruta, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(cuerpo),
  });
  esperado.includes(r.status) ? pass(`${nombre}: rechaza al Pueblo fiel`, `http=${r.status}`)
                              : bad(nombre, `http=${r.status}`);
}

// ── Limpieza ────────────────────────────────────────────────────────────────
const borrado = await fetch(`${BASE}/api/delete-account`, { method: 'POST', headers: { Authorization: `Bearer ${TOKEN}` } });
console.log(`\nLimpieza: cuenta de prueba borrada (http=${borrado.status}).`);
console.log(`\n${ok} bloqueos correctos, ${fail} escaladas.`);
if (borrado.status !== 200) {
  console.log(`⚠️  Borra a mano la cuenta ${usuario} desde el panel de administración.`);
}
process.exit(fail > 0 ? 1 : 0);
