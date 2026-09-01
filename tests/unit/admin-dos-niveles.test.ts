/**
 * Dos niveles de administrador (migración 20260901_admin_solo_cantos).
 *
 * Pedido el 1-sep-2026: entran personas a ayudar con el catálogo y solo el correo
 * principal conserva el acceso total. La regla de diseño es **cerrado por omisión**:
 *
 *   · `is_admin()` significa ADMIN PLENO. La usan ~20 policies repartidas por todo el
 *     esquema, así que redefinirla cierra todas de una vez — y deja cerrada también
 *     cualquiera que se escriba mañana sin acordarse de esto.
 *   · `is_song_admin()` es lo único que se abre al ayudante, y SOLO en `songs` y
 *     `song_tags`.
 *
 * Esta prueba lee el SQL del repo y vigila esa frontera: si alguien abre otra tabla al
 * ayudante, o afloja is_admin(), lo caza aquí. No sustituye a probarlo contra la base,
 * pero es lo que evita el descuido silencioso.
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { PRINCIPAL_ADMIN_EMAIL, isPrincipalAdminEmail } from '../../src/config/admin';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
function checkTrue(name: string, cond: boolean, detalle = '') {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${detalle ? `\n       ${detalle}` : ''}`); }
}

const DIR = join(process.cwd(), 'supabase', 'migrations');
// El perfilamiento son dos migraciones: la que parte los niveles y la que le quita el
// borrado al ayudante. Se leen juntas porque juntas definen la frontera.
const PAQUETE = ['20260901_admin_solo_cantos.sql', '20260902_songs_borrado_solo_principal.sql'];
const migracion = readFileSync(join(DIR, PAQUETE[0]), 'utf8');
const borrado = readFileSync(join(DIR, PAQUETE[1]), 'utf8');

console.log('\n== El correo principal es uno solo y está en los dos lados ==');
check('el de la app', PRINCIPAL_ADMIN_EMAIL, 'gustavus.tobar@gmail.com');
checkTrue('y el mismo en la migración', migracion.includes(PRINCIPAL_ADMIN_EMAIL));
check('reconoce el correo con mayúsculas y espacios', isPrincipalAdminEmail('  Gustavus.Tobar@Gmail.com '), true);
check('no reconoce a otro', isPrincipalAdminEmail('ayudante@gmail.com'), false);
check('ni a vacío', isPrincipalAdminEmail(''), false);

console.log('\n== is_admin() = admin PLENO ==');
const cuerpoIsAdmin = migracion.slice(
  migracion.indexOf('FUNCTION public.is_admin()'),
  migracion.indexOf('FUNCTION public.is_song_admin()'),
);
checkTrue("exige role = 'principal'", /role\s*=\s*'principal'/.test(cuerpoIsAdmin), cuerpoIsAdmin.slice(0, 200));
checkTrue('NO acepta al ayudante', !/'songs'/.test(cuerpoIsAdmin));

console.log('\n== is_song_admin() = principal o ayudante ==');
const cuerpoIsSong = migracion.slice(
  migracion.indexOf('FUNCTION public.is_song_admin()'),
  migracion.indexOf('FUNCTION public.admin_level()'),
);
checkTrue('acepta los dos niveles', /'principal'\s*,\s*'songs'/.test(cuerpoIsSong), cuerpoIsSong.slice(0, 200));

console.log('\n== Al ayudante SOLO se le abren cantos y etiquetas ==');
// Cada policy que use is_song_admin tiene que estar sobre una de estas dos tablas.
const PERMITIDAS = ['public.songs', 'public.song_tags', 'public.admins'];
const politicas = [...migracion.matchAll(/CREATE POLICY "([^"]+)" ON ([\w.]+)([\s\S]*?);/g)]
  .map((m) => ({ nombre: m[1], tabla: m[2], cuerpo: m[3] }));
checkTrue(`se revisaron ${politicas.length} policies`, politicas.length >= 6, `fueron ${politicas.length}`);

const abiertas = politicas.filter((p) => p.cuerpo.includes('is_song_admin'));
const fuera = abiertas.filter((p) => !PERMITIDAS.includes(p.tabla));
checkTrue('ninguna otra tabla se le abre al ayudante',
  fuera.length === 0, fuera.map((p) => `${p.nombre} sobre ${p.tabla}`).join(', '));
check('tablas abiertas al ayudante',
  [...new Set(abiertas.map((p) => p.tabla))].sort(), ['public.admins', 'public.song_tags', 'public.songs']);

// Sobre `admins` el ayudante solo puede LEER: si pudiera escribir, se ascendería solo.
const adminsPolicies = politicas.filter((p) => p.tabla === 'public.admins');
const adminsEscritura = adminsPolicies.filter((p) => /FOR ALL|FOR INSERT|FOR UPDATE|FOR DELETE/.test(p.cuerpo));
checkTrue('escribir en `admins` exige ser el principal',
  adminsEscritura.length > 0 && adminsEscritura.every((p) => p.cuerpo.includes('is_admin') && !p.cuerpo.includes('is_song_admin')),
  adminsEscritura.map((p) => p.nombre).join(', '));

console.log('\n== El resto del esquema sigue cerrado (fail-safe) ==');
// Ninguna migración anterior debe haber usado is_song_admin: no existía. Y ninguna
// debe conceder acceso por correo suelto en vez de por la tabla `admins`.
const otras = readdirSync(DIR).filter((f) => f.endsWith('.sql') && !PAQUETE.includes(f));
const conSongAdmin = otras.filter((f) => readFileSync(join(DIR, f), 'utf8').includes('is_song_admin'));
check('ninguna otra migración abre nada al ayudante', conSongAdmin, []);

console.log('\n== Borrar del catálogo es solo del principal ==');
// El ayudante sube y transcribe: INSERT y UPDATE. Un DELETE no tiene vuelta atrás y se
// lleva letra, acordes, partituras y etiquetas de un canto que puede estar en
// cantorales ya publicados.
const pols = (sql: string) =>
  [...sql.matchAll(/CREATE POLICY "([^"]+)" ON ([\w.]+)([\s\S]*?);/g)]
    .map((m) => ({ nombre: m[1], tabla: m[2], cuerpo: m[3] }));
const delBorrado = pols(borrado);

const porOperacion = (tabla: string, op: string) =>
  delBorrado.find((x) => x.tabla === tabla && x.cuerpo.includes(`FOR ${op}`));

checkTrue('el DELETE de songs exige ser el principal',
  !!porOperacion('public.songs', 'DELETE')?.cuerpo.match(/is_admin/) &&
  !porOperacion('public.songs', 'DELETE')!.cuerpo.includes('is_song_admin'));
checkTrue('el DELETE de las etiquetas también',
  !!porOperacion('public.song_tags', 'DELETE')?.cuerpo.match(/is_admin/) &&
  !porOperacion('public.song_tags', 'DELETE')!.cuerpo.includes('is_song_admin'));

// Subir y transcribir siguen siendo del ayudante: si esto se cerrara, no podría trabajar.
checkTrue('el ayudante sigue pudiendo subir', !!porOperacion('public.songs', 'INSERT')?.cuerpo.includes('is_song_admin'));
checkTrue('y transcribir', !!porOperacion('public.songs', 'UPDATE')?.cuerpo.includes('is_song_admin'));
checkTrue('y ver los cantos aún no aprobados', !!porOperacion('public.songs', 'SELECT')?.cuerpo.includes('is_song_admin'));

// Una policy FOR ALL volveria a meter el borrado por la puerta de atras.
checkTrue('no queda ninguna policy FOR ALL sobre songs',
  !delBorrado.some((x) => x.tabla === 'public.songs' && /FOR ALL/.test(x.cuerpo)) &&
  borrado.includes('DROP POLICY IF EXISTS "songs_admin_all"'));

const nuevaDefaultMinima = /ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'songs'/.test(migracion);
checkTrue("quien se agregue sin decir nada entra como 'songs'", nuevaDefaultMinima);
checkTrue('el nivel está acotado por CHECK',
  /CHECK \(role IN \('principal', 'songs'\)\)/.test(migracion));

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
