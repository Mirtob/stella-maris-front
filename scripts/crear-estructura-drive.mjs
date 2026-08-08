#!/usr/bin/env node
/**
 * Crea en Drive la estructura de carpetas de partituras descrita en
 * docs/dev/ESTRUCTURA-DRIVE.md.
 *
 *   # 1) Ver qué haría, sin tocar nada (por defecto):
 *   node scripts/crear-estructura-drive.mjs
 *
 *   # 2) Crearlo de verdad — PowerShell (Windows):
 *   $env:DRIVE_TOKEN = "ya29.a0..."
 *   node scripts/crear-estructura-drive.mjs --apply
 *   Remove-Item Env:DRIVE_TOKEN        # limpiar al terminar
 *
 *   # 2-bis) Lo mismo en bash / Git Bash:
 *   DRIVE_TOKEN="ya29.a0..." node scripts/crear-estructura-drive.mjs --apply
 *
 * Opciones:
 *   --apply              crea de verdad (sin esto solo imprime el plan)
 *   --todos-los-tiempos  subcarpetas de tiempo para TODOS los momentos,
 *                        no solo los de canto variable
 *
 * ── Cómo obtener DRIVE_TOKEN (token temporal, ~1 hora) ──────────────────────
 *   1. https://developers.google.com/oauthplayground
 *   2. En la lista, Drive API v3 → marca  https://www.googleapis.com/auth/drive
 *   3. "Authorize APIs" → entra con la cuenta DUEÑA del Drive de partituras
 *   4. "Exchange authorization code for tokens" → copia el access_token
 *
 * El token vive solo en la variable de entorno de esta terminal y caduca solo.
 * El script NO lo guarda en ningún archivo.
 *
 * Es IDEMPOTENTE: mira qué carpetas ya existen y crea únicamente las que faltan,
 * así que se puede volver a correr sin duplicar nada.
 */

import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ALL_SEASONS = process.argv.includes('--todos-los-tiempos');
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const API = 'https://www.googleapis.com/drive/v3/files';

// ── Estructura deseada ──────────────────────────────────────────────────────
// Nombres EXACTOS de las etiquetas de MOMENT_OPTIONS (src/components/songs/SongManager.tsx).
// Sin barras: "/" es el separador de rutas y partiría el nivel en dos.
const MOMENTS = [
  'Entrada',
  'Rito de Aspersión',
  'Salmo',
  'Aleluya',
  'Post Evangelio',
  'Respuesta a Oración Universal',
  'Ofertorio',
  'Comunión',
  'Salida',
  'Exposición',
];

// Los ocho tiempos de LITURGICAL_SEASON_LABELS (src/types.ts).
const SEASONS = [
  'Adviento', 'Navidad', 'Tiempo Ordinario', 'Cuaresma',
  'Semana Santa', 'Pascua', 'Pentecostés', 'Corpus Christi',
];

// Momentos donde el canto cambia de verdad con el tiempo litúrgico. En el resto,
// las subcarpetas quedarían casi siempre vacías y solo estorban al navegar.
const SEASONAL_MOMENTS = ['Entrada', 'Ofertorio', 'Comunión', 'Salida'];

// El ordinario vive aparte: una carpeta por Misa dentro de "Misas".
const ORDINARY_ROOT = 'Misas';

// ── Config ──────────────────────────────────────────────────────────────────
function readEnvLocal() {
  const p = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return {};
  return Object.fromEntries(
    fs.readFileSync(p, 'utf8').split(/\r?\n/)
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

const env = readEnvLocal();
const ROOT = process.env.DRIVE_ROOT_FOLDER || env.VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER;
const TOKEN = (process.env.DRIVE_TOKEN || '').trim();
const API_KEY = env.VITE_GOOGLE_DRIVE_API_KEY;

if (!ROOT) {
  console.error('Falta la carpeta raíz: define VITE_GOOGLE_DRIVE_SHEET_MUSIC_FOLDER en .env.local');
  process.exit(1);
}
if (APPLY && !TOKEN) {
  console.error('Falta DRIVE_TOKEN. Con --apply hace falta un token OAuth (ver la cabecera del script).');
  process.exit(1);
}

/** Cabeceras: con token vamos autenticados; sin él, solo lectura con API key. */
const authParams = () => (TOKEN ? '' : `&key=${encodeURIComponent(API_KEY || '')}`);
const authHeaders = () => (TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {});

async function listChildren(folderId) {
  const out = [];
  let pageToken;
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
    const pt = pageToken ? `&pageToken=${pageToken}` : '';
    const url = `${API}?q=${q}&fields=nextPageToken,files(id,name,mimeType)&pageSize=1000${pt}${authParams()}`;
    const r = await fetch(url, { headers: authHeaders() });
    const j = await r.json();
    if (j.error) throw new Error(`Drive: ${j.error.message}`);
    out.push(...(j.files || []));
    pageToken = j.nextPageToken;
  } while (pageToken);
  return out;
}

async function createFolder(name, parentId) {
  const r = await fetch(`${API}?fields=id,name`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  const j = await r.json();
  if (j.error) throw new Error(`No se pudo crear "${name}": ${j.error.message}`);
  return j.id;
}

/** Compara como lo hace la app: sin acentos ni mayúsculas. */
const key = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

let created = 0;
let existing = 0;

/** Devuelve el id de la subcarpeta `name` dentro de `parentId`, creándola si falta. */
async function ensureFolder(name, parentId, indent) {
  const children = await listChildren(parentId);
  const hit = children.find((c) => c.mimeType === FOLDER_MIME && key(c.name) === key(name));
  if (hit) {
    existing++;
    console.log(`${indent}· ${name}  (ya existe)`);
    return hit.id;
  }
  created++;
  if (!APPLY) {
    console.log(`${indent}+ ${name}  (se crearía)`);
    return null; // en simulación no hay id: no se puede bajar un nivel
  }
  const id = await createFolder(name, parentId);
  console.log(`${indent}+ ${name}  ✔ creada`);
  return id;
}

// ── Ejecución ───────────────────────────────────────────────────────────────
console.log(APPLY
  ? '── CREANDO la estructura en Drive ──'
  : '── SIMULACIÓN (nada se modifica). Agrega --apply para crear ──');
console.log(`raíz: ${ROOT}\n`);

for (const moment of MOMENTS) {
  const momentId = await ensureFolder(moment, ROOT, '');
  const wantsSeasons = ALL_SEASONS || SEASONAL_MOMENTS.includes(moment);
  if (!wantsSeasons) continue;
  if (!momentId) {
    // Simulación sobre una carpeta que aún no existe: sus hijas también faltarían.
    for (const s of SEASONS) {
      created++;
      console.log(`   + ${moment} - ${s}  (se crearía)`);
    }
    continue;
  }
  for (const s of SEASONS) await ensureFolder(`${moment} - ${s}`, momentId, '   ');
}

await ensureFolder(ORDINARY_ROOT, ROOT, '');

console.log(`\nya existían: ${existing}`);
console.log(APPLY ? `creadas:     ${created}` : `se crearían: ${created}`);
if (!APPLY) console.log('\nVuelve a correrlo con --apply (y DRIVE_TOKEN) para crearlas.');
console.log('\nLas carpetas de cada Misa (p. ej. "Misas/Misa Nebreda") NO se crean aquí:');
console.log('dependen del repertorio de cada parroquia. Créalas a mano según haga falta.');
