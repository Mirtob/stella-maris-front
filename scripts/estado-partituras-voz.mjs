#!/usr/bin/env node
/**
 * ¿Qué partes de qué Misas ya tienen su partitura de VOZ en el folleto?
 *
 * En el folleto del pueblo solo entra el archivo que termina en "-Voz" (ver
 * utils/ordinarySheetMusic). El resto de las voces son del coro y se abren en el Modo
 * Atril. Este informe cruza el catálogo con el Drive real y dice, parte por parte, si el
 * folleto va a traer partitura o va a caer a la letra — sin tener que generar un folleto
 * por Misa para averiguarlo.
 *
 * NO usa una copia de las reglas: empaqueta las de verdad con esbuild y llama a las
 * mismas funciones que corre la app. Un informe que se rige por otras reglas que el
 * programa miente, y esa mentira es peor que no tener informe.
 *
 *   node scripts/estado-partituras-voz.mjs
 *   node scripts/estado-partituras-voz.mjs --local    (lee /api/sheets del dev server)
 */
import { readFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildSync } from 'esbuild';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROD = 'https://stella-maris-front.vercel.app';
const local = process.argv.includes('--local');
const BASE = local ? 'http://localhost:5173' : PROD;

// ── Las reglas de verdad, empaquetadas desde el código de la app ─────────────
const TMP = join(RAIZ, 'tests', 'output');
mkdirSync(TMP, { recursive: true });
const bundle = join(TMP, '_estado-partituras.mjs');
buildSync({
  stdin: {
    contents: `export { pickOrdinarySheet, esLaVoz } from ${JSON.stringify(join(RAIZ, 'src/utils/ordinarySheetMusic.ts'))};`,
    resolveDir: RAIZ,
    loader: 'ts',
  },
  bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'error',
});
const { pickOrdinarySheet, esLaVoz } = await import(pathToFileURL(bundle).href);

// ── Datos ────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(join(RAIZ, '.env.local'), 'utf8').split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);

const songs = await (await fetch(
  `${env.VITE_SUPABASE_URL}/rest/v1/songs?select=title,mass_moment,mass_name&mass_name=not.is.null`,
  { headers: { apikey: env.VITE_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}` } },
)).json();

const hoja = await (await fetch(`${BASE}/api/sheets?fresh=1`)).json();
const files = hoja.files ?? [];
if (hoja.truncated) console.log('  ! El árbol de Drive vino TRUNCADO: faltan archivos por listar.\n');

// El momento de la Misa, en la categoría que usan las reglas.
const CATEGORIA = {
  kyrie: 'Kyrie', gloria: 'Gloria', santo: 'Santo',
  cordero: 'Cordero de Dios', padre_nuestro: 'Padre Nuestro',
};
const PARTES = ['Kyrie', 'Gloria', 'Santo', 'Cordero de Dios', 'Padre Nuestro'];

const soloVoz = files.filter(esLaVoz);

// ── Informe ──────────────────────────────────────────────────────────────────
const misas = new Map();
for (const s of songs) {
  const cat = CATEGORIA[s.mass_moment];
  if (!cat) continue;
  if (!misas.has(s.mass_name)) misas.set(s.mass_name, new Map());
  misas.get(s.mass_name).set(cat, s.title);
}

let listas = 0, conHuecos = 0, totalCon = 0, totalSin = 0;
const filas = [];
for (const [misa, partes] of [...misas.entries()].sort()) {
  const detalle = PARTES.filter((p) => partes.has(p)).map((parte) => {
    const elegido = pickOrdinarySheet(parte, misa, soloVoz);
    if (elegido) totalCon++; else totalSin++;
    return { parte, archivo: elegido?.name ?? null };
  });
  const faltan = detalle.filter((d) => !d.archivo).length;
  if (faltan === 0) listas++; else conHuecos++;
  filas.push({ misa, detalle, faltan });
}

console.log(`PARTITURAS "-Voz" PARA EL FOLLETO — ${misas.size} Misas en el catálogo\n`);
for (const { misa, detalle, faltan } of filas) {
  console.log(`${faltan === 0 ? '[completa]' : '[ faltan ]'} ${misa}`);
  for (const { parte, archivo } of detalle) {
    console.log(archivo
      ? `     ok   ${parte.padEnd(16)} ${archivo}`
      : `     --   ${parte.padEnd(16)} (sin archivo -Voz: el folleto imprimirá la letra)`);
  }
  console.log('');
}
console.log(`Misas completas: ${listas} · con huecos: ${conHuecos}`);
console.log(`Partes con partitura: ${totalCon} · sin ella: ${totalSin}`);

rmSync(bundle, { force: true });
