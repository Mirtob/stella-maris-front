/**
 * Fronteras de la revisión de seguridad del 26-oct-2026.
 *
 * Cada caso es un agujero real que se cerró. La prueba lee el repo (SQL, endpoints,
 * frontend) y caza la vuelta atrás silenciosa: no sustituye a probar contra la base
 * (tests/security/parroquia-ajena.mjs), pero corre en cada `npm run test:unit`.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

let pass = 0, fail = 0;
function checkTrue(name: string, ok: boolean, detalle = '') {
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detalle ? `\n       ${detalle}` : ''}`); }
}

const RAIZ = process.cwd();
const MIG = join(RAIZ, 'supabase', 'migrations');
const migraciones = readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort();

/** Texto de la ÚLTIMA migración (por nombre) que cumple `re`: esa es la que manda. */
function ultima(re: RegExp): { archivo: string; sql: string } | null {
  for (let i = migraciones.length - 1; i >= 0; i--) {
    const sql = readFileSync(join(MIG, migraciones[i]), 'utf8');
    if (re.test(sql)) return { archivo: migraciones[i], sql };
  }
  return null;
}

/** Cuerpo de una sentencia CREATE … desde `inicio` hasta el `;` que la cierra. */
function sentencia(sql: string, inicio: RegExp): string {
  const m = inicio.exec(sql);
  if (!m) return '';
  const resto = sql.slice(m.index);
  const fin = resto.search(/\$\$;|\);\s*$/m);
  return fin === -1 ? resto : resto.slice(0, fin + 3);
}

console.log('\n=== Seguridad de los datos ===\n');

// ── 1. Sin parroquia declarada no se cubre ninguna ────────────────────────────
// Un Coro sin parroquia borraba y publicaba cantorales en TODAS las parroquias.
{
  const re = /CREATE OR REPLACE FUNCTION public\.user_covers_parish\(/;
  const u = ultima(re);
  const cuerpo = u ? sentencia(u.sql, re) : '';
  checkTrue('user_covers_parish delega en la versión estricta',
    /user_covers_parish_strict\(p_unidad\)/.test(cuerpo),
    `última definición: ${u?.archivo ?? '(ninguna)'}`);
  checkTrue('user_covers_parish ya no deja pasar perfiles sin parroquia',
    !/array_length\(p\.parishes, 1\), 0\) = 0/.test(cuerpo));
}

// ── 2. El directorio de coros no es público ───────────────────────────────────
{
  const re = /CREATE POLICY "choir_contacts_read"/;
  const u = ultima(re);
  const cuerpo = u ? sentencia(u.sql, re) : '';
  checkTrue('choir_contacts_read exige Coro/Admin con parroquia',
    /role IN \('Coro', 'Admin'\)/.test(cuerpo) && !/USING \(\(select auth\.uid\(\)\) IS NOT NULL\)/.test(cuerpo),
    `última definición: ${u?.archivo ?? '(ninguna)'}`);
}

// ── 3. La recuperación de clave no acepta un correo ajeno ─────────────────────
{
  const api = readFileSync(join(RAIZ, 'api', 'recover-password.ts'), 'utf8');
  const request = api.slice(api.indexOf("action === 'request'"), api.indexOf("action === 'confirm'"));
  checkTrue('recover-password (request) no lee un correo del cuerpo',
    !/body\.email/.test(request));
  checkTrue('recover-password (request) no escribe recovery_email',
    !/recovery_email:/.test(request));
  checkTrue('el código sale de crypto.randomInt', /randomInt\(/.test(api) && !/Math\.random/.test(api));
}

// ── 4. Endpoints que gastan o avisan piden credenciales ───────────────────────
{
  const suggest = readFileSync(join(RAIZ, 'api', 'suggest.ts'), 'utf8');
  checkTrue('/api/suggest exige sesión de Coro/Admin', /callerIsChoirOrAdmin\(token\)/.test(suggest));
  checkTrue('/api/suggest topa la cantidad de cantos', /slice\(0, MAX_SONGS\)/.test(suggest));

  const notify = readFileSync(join(RAIZ, 'api', 'notify-cantoral.ts'), 'utf8');
  checkTrue('notify-cantoral solo avisa de cantorales de quien llama',
    /soloLosDeQuienAvisa\(token, vigentes\)/.test(notify));
}

// ── 5. Ninguna clave secreta entra al bundle ──────────────────────────────────
// Todo `import.meta.env.VITE_*` termina en el JS público. Solo valen las públicas
// por diseño (anon key de Supabase, clave pública VAPID).
{
  const PUBLICAS = new Set(['VITE_SUPABASE_ANON_KEY', 'VITE_VAPID_PUBLIC_KEY']);
  const archivos: string[] = [];
  const recorrer = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) recorrer(p);
      else if (/\.(ts|tsx)$/.test(n)) archivos.push(p);
    }
  };
  recorrer(join(RAIZ, 'src'));
  const fugas: string[] = [];
  for (const f of archivos) {
    const txt = readFileSync(f, 'utf8');
    for (const m of txt.matchAll(/import\.meta\.env\.(VITE_[A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD)[A-Z0-9_]*)/g)) {
      if (!PUBLICAS.has(m[1])) fugas.push(`${f.slice(RAIZ.length + 1)}: ${m[1]}`);
    }
  }
  checkTrue('el frontend no lee claves secretas con VITE_', fugas.length === 0, fugas.join('; '));
}

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
