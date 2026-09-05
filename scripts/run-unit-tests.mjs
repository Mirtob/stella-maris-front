#!/usr/bin/env node
/**
 * Corre TODAS las pruebas unitarias de tests/unit.
 *
 * Existían desde hace tiempo, pero solo como una lista de comandos copiables en
 * tests/unit/README.md: había que acordarse de cada archivo, uno por uno. Con 24
 * archivos eso significa que en la práctica nunca se corrían todas.
 *
 * Cada prueba es un .ts suelto que se empaqueta con esbuild y se ejecuta con node.
 * No hace falta ni navegador ni base de datos: son reglas puras (litúrgicas, de
 * partituras, de publicación).
 *
 *   npm run test:unit              → todas
 *   npm run test:unit calendario   → solo las que contengan "calendario" en el nombre
 */
import { readdirSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
// Se usa la API de esbuild, no `npx esbuild`: en Windows, lanzar un .cmd desde
// execFileSync falla con EINVAL desde Node 20.
import { buildSync } from 'esbuild';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(RAIZ, 'tests', 'unit');
const SALIDA = join(RAIZ, 'tests', 'output');
const filtro = process.argv[2];

mkdirSync(SALIDA, { recursive: true });

const archivos = readdirSync(DIR)
  .filter((f) => f.endsWith('.test.ts'))
  .filter((f) => !filtro || f.includes(filtro))
  .sort();

if (archivos.length === 0) {
  console.error(filtro ? `Ninguna prueba coincide con "${filtro}".` : 'No hay pruebas en tests/unit.');
  process.exit(1);
}

let ok = 0;
const fallidas = [];

for (const archivo of archivos) {
  const nombre = archivo.replace('.test.ts', '');
  const bundle = join(SALIDA, `_run-${nombre}.mjs`);
  try {
    buildSync({
      entryPoints: [join(DIR, archivo)],
      bundle: true, platform: 'node', format: 'esm', outfile: bundle, logLevel: 'error',
    });
  } catch (e) {
    fallidas.push([nombre, 'no compila: ' + String(e.message || e).slice(0, 300)]);
    console.log(`  ✗ ${nombre.padEnd(30)} no compila`);
    continue;
  }
  try {
    const salida = execFileSync(process.execPath, [bundle], { encoding: 'utf8' });
    // Cada archivo termina con un resumen "N ok, M fallas".
    const resumen = salida.split('\n').reverse().find((l) => /ok, \d+ fall/.test(l)) || '';
    console.log(`  ✓ ${nombre.padEnd(30)} ${resumen.trim()}`);
    ok++;
  } catch (e) {
    // Las pruebas salen con código 1 cuando algo falla; se enseña el detalle.
    const salida = String(e.stdout || '') + String(e.stderr || '');
    fallidas.push([nombre, salida.split('\n').filter((l) => l.includes('FAIL')).join('\n')]);
    console.log(`  ✗ ${nombre.padEnd(30)} CON FALLAS`);
  } finally {
    rmSync(bundle, { force: true });
  }
}

console.log(`\n${ok} archivos en verde, ${fallidas.length} con fallas.`);
for (const [nombre, detalle] of fallidas) {
  console.log(`\n── ${nombre} ──\n${detalle}`);
}
process.exit(fallidas.length ? 1 : 0);
