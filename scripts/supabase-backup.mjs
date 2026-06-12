#!/usr/bin/env node
/**
 * Stella Maris - Backup script para Supabase (opción casera, free tier)
 *
 * Descarga el contenido de todas las tablas usuario-managed y lo guarda
 * como JSON. Pensado para correr por GitHub Actions (ver .github/workflows/backup.yml)
 * pero también se puede ejecutar localmente.
 *
 * Uso:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/supabase-backup.mjs
 *
 * Output: backup-<timestamp>.json en CWD.
 *
 * IMPORTANTE: requiere la SERVICE_ROLE_KEY (no anon key), porque necesita
 * leer TODAS las filas saltándose RLS. Esa key es secreta — nunca commitearla.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno');
  process.exit(1);
}

// Tablas a respaldar (orden importa para restore — primero las padres)
const TABLES = [
  'admins',
  'songs',
  'user_profiles',
  'published_cantorals',
  'cantoral_songs',
];

// Tablas cuyo fallo invalida el backup: si alguna de estas no se puede leer,
// el backup quedó incompleto y debe fallar LOUD (no guardar un backup vacío en silencio).
const CORE_TABLES = ['songs', 'user_profiles', 'published_cantorals'];

async function fetchTable(table) {
  let allRows = [];
  let from = 0;
  const PAGE_SIZE = 1000;

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&offset=${from}&limit=${PAGE_SIZE}`;
    const r = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Range-Unit': 'items',
      },
    });

    if (!r.ok) {
      const txt = await r.text();
      throw new Error(`Error fetching ${table}: HTTP ${r.status} — ${txt}`);
    }

    const data = await r.json();
    allRows = allRows.concat(data);
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

async function main() {
  console.log('🔁 Iniciando backup de Supabase...');
  console.log(`   URL: ${SUPABASE_URL}`);
  console.log(`   Tablas: ${TABLES.join(', ')}`);

  const backup = {
    timestamp: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {},
  };

  for (const table of TABLES) {
    process.stdout.write(`   📄 ${table}... `);
    try {
      const rows = await fetchTable(table);
      backup.tables[table] = rows;
      console.log(`${rows.length} filas`);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      backup.tables[table] = { error: err.message };
    }
  }

  // Storage objects (PDFs) — listado, no descarga del contenido
  process.stdout.write('   📦 storage.cantorales-pdf metadata... ');
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/list/cantorales-pdf`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ limit: 1000, offset: 0 }),
    });
    if (r.ok) {
      const objs = await r.json();
      backup.storage = { 'cantorales-pdf': objs };
      console.log(`${objs.length} objetos`);
    } else {
      console.log('saltado');
    }
  } catch {
    console.log('saltado');
  }

  // Escribir el JSON
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${ts}.json`;
  const outPath = resolve(process.cwd(), filename);
  writeFileSync(outPath, JSON.stringify(backup, null, 2));

  const sizeKb = (Buffer.byteLength(JSON.stringify(backup)) / 1024).toFixed(1);
  console.log(`\n✅ Backup completo: ${filename} (${sizeKb} KB)`);

  // Resumen para los logs
  console.log('\n--- Resumen ---');
  for (const [t, data] of Object.entries(backup.tables)) {
    if (Array.isArray(data)) {
      console.log(`  ${t}: ${data.length} filas`);
    } else {
      console.log(`  ${t}: ERROR (${data.error})`);
    }
  }

  // Falla LOUD si alguna tabla crítica no se pudo leer: un backup que silenciosamente
  // no respalda los datos reales es peor que un backup que falla y avisa.
  const failedCore = CORE_TABLES.filter((t) => !Array.isArray(backup.tables[t]));
  if (failedCore.length > 0) {
    console.error(`\n💥 Backup INCOMPLETO — tablas críticas fallaron: ${failedCore.join(', ')}`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Backup falló:', err);
  process.exit(1);
});
