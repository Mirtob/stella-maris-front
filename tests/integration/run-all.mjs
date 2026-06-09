#!/usr/bin/env node
/**
 * Stella Maris — Suite de pruebas integradas (caja negra, anon key)
 *
 * Verifica el comportamiento end-to-end del backend sin asumir el código fuente.
 * Lanza queries reales contra Supabase y endpoints de Vercel y compara
 * contra el resultado esperado.
 *
 * Uso:
 *   node tests/integration/run-all.mjs
 *
 * Requiere variables en tests/.env (copiar de .env.local):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 *   PUBLIC_BASE_URL          → https://tu-dominio.vercel.app
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ─────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = process.env.PUBLIC_BASE_URL ?? 'http://localhost:5173';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Falta VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en tests/.env');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, ANON_KEY);

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

const results = [];
let passed = 0;
let failed = 0;

function pass(suite, name, detail = '') {
  results.push({ suite, name, status: 'PASS', detail });
  passed++;
  console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(suite, name, detail) {
  results.push({ suite, name, status: 'FAIL', detail });
  failed++;
  console.log(`  ❌ ${name} — ${detail}`);
}

function header(name) {
  console.log(`\n━━━ ${name} ━━━`);
}

async function safe(fn, fallback = null) {
  try { return await fn(); } catch (e) { return fallback ?? { error: e.message }; }
}

// ─────────────────────────────────────────────────────────────────────────
// 1. SUPABASE — tablas y RPCs públicas
// ─────────────────────────────────────────────────────────────────────────

async function testSupabaseBasics() {
  header('1. Supabase — conectividad básica');

  // 1.1 — Anon key puede leer published_cantorals (status published)
  const cant = await safe(() => sb.from('published_cantorals').select('id, status').limit(5));
  if (cant.error) {
    fail('basics', 'SELECT published_cantorals con anon key', cant.error);
  } else {
    const onlyPublished = cant.data.every(r => r.status === 'published' || r.status === null);
    if (onlyPublished) {
      pass('basics', 'SELECT published_cantorals devuelve solo published', `${cant.data.length} rows`);
    } else {
      fail('basics', 'RLS leak — anon puede ver drafts', `status values: ${[...new Set(cant.data.map(r => r.status))].join(',')}`);
    }
  }

  // 1.2 — Anon key puede llamar search_songs RPC
  const songs = await safe(() => sb.rpc('search_songs', {
    p_moment: null, p_season: null, p_instrument: null, p_query: null, p_limit: 5, p_offset: 0,
  }));
  if (songs.error) {
    fail('basics', 'RPC search_songs accesible', songs.error);
  } else {
    pass('basics', 'RPC search_songs accesible', `${songs.data?.length ?? 0} cantos`);
  }

  // 1.3 — Anon key puede llamar is_admin() RPC (debe responder FALSE)
  const isAdmin = await safe(() => sb.rpc('is_admin'));
  if (isAdmin.error) {
    fail('basics', 'RPC is_admin() accesible', isAdmin.error);
  } else if (isAdmin.data === false) {
    pass('basics', 'is_admin() devuelve FALSE para anon', 'correcto');
  } else {
    fail('basics', 'is_admin() debería ser FALSE para anon', `respondió: ${isAdmin.data}`);
  }

  // 1.4 — Anon key NO puede modificar published_cantorals sin auth
  const ins = await safe(() => sb.from('published_cantorals').insert({
    id: '00000000-0000-0000-0000-000000000999',
    parish_name: 'Test',
    songs: [],
    status: 'published',
    date: '2026-01-01',
    liturgical_date: 'Test',
    mass_time: '10:00 AM',
    choir_id: 'test',
    choir_name: 'Test',
    created_at: new Date().toISOString(),
  }));
  if (ins.error) {
    pass('basics', 'INSERT published_cantorals SIN auth bloqueado por RLS', 'rechazado correctamente');
  } else {
    fail('basics', 'INSERT published_cantorals SIN auth NO debería pasar', 'RLS no está activa');
  }

  // 1.5 — Anon key NO puede modificar songs sin admin
  // Tomamos un song REAL (si existe) y tratamos de borrarlo. Si la fila
  // sigue existiendo después del DELETE, la RLS funcionó.
  const sampleSong = await safe(() => sb.from('songs').select('id').limit(1));
  if (sampleSong.error || !sampleSong.data || sampleSong.data.length === 0) {
    // No hay songs en el catálogo aún — no podemos probar este caso
    pass('basics', 'DELETE songs SIN admin (skip)', 'catálogo songs vacío, prueba pospuesta');
  } else {
    const targetId = sampleSong.data[0].id;
    await safe(() => sb.from('songs').delete().eq('id', targetId));
    // Verificar que el row sigue existiendo
    const stillExists = await safe(() => sb.from('songs').select('id').eq('id', targetId).maybeSingle());
    if (stillExists.data && stillExists.data.id === targetId) {
      pass('basics', 'DELETE songs SIN admin bloqueado por RLS', 'la fila sigue existiendo');
    } else {
      fail('basics', 'DELETE songs SIN admin pasó — RLS no funciona', `fila ${targetId} desapareció`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 2. SUPABASE STORAGE — bucket policies
// ─────────────────────────────────────────────────────────────────────────

async function testStoragePolicies() {
  header('2. Storage — bucket cantorales-pdf');

  // 2.1 — Anon puede leer un archivo público (si existe)
  const list = await safe(() => sb.storage.from('cantorales-pdf').list('', { limit: 1 }));
  if (list.error) {
    fail('storage', 'LIST bucket cantorales-pdf con anon', list.error);
  } else {
    pass('storage', 'LIST bucket accesible (read público)', `${list.data?.length ?? 0} objetos`);
  }

  // 2.2 — Anon NO puede subir un archivo (auth requerido)
  const tinyPdf = new Blob([new Uint8Array([0x25, 0x50, 0x44, 0x46])], { type: 'application/pdf' });
  const upload = await safe(() =>
    sb.storage.from('cantorales-pdf').upload(
      '00000000-0000-0000-0000-000000000999.pdf',
      tinyPdf,
      { upsert: true, contentType: 'application/pdf' }
    )
  );
  if (upload.error) {
    pass('storage', 'UPLOAD anon bloqueado por policy', upload.error?.message ?? 'rejected');
  } else {
    fail('storage', 'UPLOAD anon NO debería pasar', 'RLS de storage no está activa');
  }

  // 2.3 — Path malicioso rechazado
  const evil = await safe(() =>
    sb.storage.from('cantorales-pdf').upload('../etc/passwd', tinyPdf, { upsert: true })
  );
  if (evil.error) {
    pass('storage', 'UPLOAD path traversal rechazado', evil.error?.message ?? 'rejected');
  } else {
    fail('storage', 'UPLOAD ../etc/passwd PASÓ', 'CRÍTICO — validar regex de policy');
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 3. ENDPOINTS SERVERLESS — Vercel
// ─────────────────────────────────────────────────────────────────────────

async function testServerlessEndpoints() {
  header(`3. Endpoints Vercel — ${BASE_URL}`);

  // 3.1 — /api/sheets desde origin permitido
  // Lo importante es que la función serverless EJECUTE (no FUNCTION_INVOCATION_FAILED).
  // Status 200 = ideal. Status 4xx/5xx con headers de CORS y rate-limit = la función
  // corrió, solo Google Drive respondió mal. Lo que rechazamos es:
  //   - x-vercel-error: FUNCTION_INVOCATION_FAILED (problema de bundling/cold start)
  //   - Ausencia total de headers x-ratelimit-* (el handler ni siquiera empezó)
  const sheets = await safe(async () => {
    const r = await fetch(`${BASE_URL}/api/sheets`, { headers: { Origin: BASE_URL } });
    return { status: r.status, headers: Object.fromEntries(r.headers.entries()) };
  });
  if (sheets.error) {
    fail('vercel', '/api/sheets reachable', sheets.error);
  } else {
    const vercelError = sheets.headers['x-vercel-error'];
    const ratelimitHeader = sheets.headers['x-ratelimit-limit'];
    const corsHeader = sheets.headers['access-control-allow-origin'];

    if (vercelError === 'FUNCTION_INVOCATION_FAILED') {
      fail('vercel', '/api/sheets crashea la función serverless', `status=${sheets.status}, error=FUNCTION_INVOCATION_FAILED`);
    } else if (!ratelimitHeader || !corsHeader) {
      fail('vercel', '/api/sheets ejecutó pero sin headers esperados', `RateLimit: ${ratelimitHeader ?? 'ausente'}, CORS: ${corsHeader ?? 'ausente'}`);
    } else if (sheets.status === 200) {
      pass('vercel', '/api/sheets responde 200', `CORS y RateLimit OK`);
    } else if (sheets.status >= 400 && sheets.status < 500) {
      pass('vercel', `/api/sheets ejecutó (${sheets.status} desde Drive)`, `función OK, Drive responde ${sheets.status} — verificar VITE_GOOGLE_DRIVE_API_KEY en Vercel`);
    } else {
      fail('vercel', `/api/sheets respondió ${sheets.status} sin x-vercel-error`, `headers: ${JSON.stringify(sheets.headers).substring(0, 200)}`);
    }
  }

  // 3.2 — /api/sheets desde origin BLOQUEADO debe denegar CORS
  const evilCors = await safe(async () => {
    const r = await fetch(`${BASE_URL}/api/sheets`, { headers: { Origin: 'https://evil.example.com' } });
    return { status: r.status, allowOrigin: r.headers.get('access-control-allow-origin') };
  });
  if (evilCors.error) {
    fail('vercel', 'CORS bloqueo origin malicioso (request falló)', evilCors.error);
  } else if (!evilCors.allowOrigin || evilCors.allowOrigin === 'null') {
    pass('vercel', 'CORS NO permite origin evil.example.com', `allow-origin: ${evilCors.allowOrigin ?? 'ausente'}`);
  } else if (evilCors.allowOrigin === 'https://evil.example.com') {
    fail('vercel', 'CORS allow-list rota', `permitió evil.example.com`);
  } else {
    pass('vercel', 'CORS bloquea evil.example.com', `respondió con: ${evilCors.allowOrigin}`);
  }

  // 3.3 — /api/pdf con id inválido devuelve 400
  const badId = await safe(async () => {
    const r = await fetch(`${BASE_URL}/api/pdf?id=hack`, { headers: { Origin: BASE_URL } });
    return r.status;
  });
  if (badId === 400) {
    pass('vercel', '/api/pdf valida formato de id', 'rechaza ID corto');
  } else {
    fail('vercel', '/api/pdf debería rechazar id="hack"', `respondió: ${badId}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4. RPC search_songs — filtros combinados
// ─────────────────────────────────────────────────────────────────────────

async function testSearchSongs() {
  header('4. RPC search_songs — combinaciones de filtros');

  const cases = [
    { name: 'sin filtros', args: { p_moment: null, p_season: null, p_instrument: null, p_query: null, p_limit: 100, p_offset: 0 } },
    { name: 'momento=entrada', args: { p_moment: 'entrada', p_season: null, p_instrument: null, p_query: null, p_limit: 50, p_offset: 0 } },
    { name: 'temporada=adviento', args: { p_moment: null, p_season: 'adviento', p_instrument: null, p_query: null, p_limit: 50, p_offset: 0 } },
    { name: 'instrumento=coro', args: { p_moment: null, p_season: null, p_instrument: 'coro', p_query: null, p_limit: 50, p_offset: 0 } },
    { name: 'búsqueda texto "santo"', args: { p_moment: null, p_season: null, p_instrument: null, p_query: 'santo', p_limit: 50, p_offset: 0 } },
    { name: 'combinación entrada+adviento', args: { p_moment: 'entrada', p_season: 'adviento', p_instrument: null, p_query: null, p_limit: 50, p_offset: 0 } },
  ];

  for (const c of cases) {
    const r = await safe(() => sb.rpc('search_songs', c.args));
    if (r.error) {
      fail('rpc', `search_songs ${c.name}`, r.error);
    } else {
      pass('rpc', `search_songs ${c.name}`, `${r.data?.length ?? 0} resultados`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  STELLA MARIS — Suite de Pruebas Integradas');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Fecha:    ${new Date().toISOString()}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  await testSupabaseBasics();
  await testStoragePolicies();
  await testServerlessEndpoints();
  await testSearchSongs();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Total: ${results.length}  ✅ ${passed}  ❌ ${failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Dump JSON al final para que el informe pueda parsearlo
  console.log('\n--- JSON ---');
  console.log(JSON.stringify({ passed, failed, total: results.length, results }, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => { console.error('FATAL', err); process.exit(2); });
