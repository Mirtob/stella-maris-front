/**
 * Lo que se cuenta cuando alguien se atasca al entrar (src/utils/diagnosticoEntrada.ts).
 *
 * Del 8-sep-2026: un usuario no podía entrar desde su teléfono mientras su tablet
 * funcionaba. La renovación del token se quedaba colgada y no dejaba NI RASTRO — no era
 * un error, era silencio. Nos enteramos porque él lo dijo; nadie sabe cuánta gente lo
 * sufrió y cerró la app sin más.
 *
 * Estas pruebas fijan las dos cosas que tiene que cumplir el aviso: que NUNCA reviente
 * (corre justo cuando algo ya va mal) y que no lleve nada que identifique a nadie.
 */
import { entornoDeEntrada } from '../../src/utils/diagnosticoEntrada';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const g = globalThis as any;
const limpiar = () => { delete g.navigator; delete g.window; delete g.document; };

console.log('\n== Sin navegador (o con todo roto) no revienta ==');
// Es lo primero que importa: esto se ejecuta cuando la app ya está en problemas.
limpiar();
const vacio = entornoDeEntrada();
check('devuelve algo', typeof vacio, 'object');
check('plataforma con valor', vacio.plataforma, 'otro');
check('conexión desconocida', vacio.conexion, 'desconocida');
check('se asume en línea', vacio.enLinea, true);

console.log('\n== Con accesos que lanzan excepción, tampoco ==');
g.navigator = { get userAgent(): string { throw new Error('bloqueado'); },
                get onLine(): boolean { throw new Error('bloqueado'); } };
g.document = { get visibilityState(): string { throw new Error('bloqueado'); } };
g.window = { matchMedia() { throw new Error('bloqueado'); } };
const roto = entornoDeEntrada();
check('sigue devolviendo un objeto', typeof roto, 'object');
check('plataforma por defecto', roto.plataforma, 'otro');
check('visibilidad desconocida', roto.visibilidad, 'desconocida');

console.log('\n== El caso reportado: iPhone instalado, con mala red ==');
limpiar();
g.navigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15',
  onLine: true, connection: { effectiveType: '2g' }, standalone: true,
};
g.document = { visibilityState: 'visible' };
g.window = { matchMedia: () => ({ matches: true }) };
const iphone = entornoDeEntrada();
check('reconoce iOS', iphone.plataforma, 'ios');
check('sabe que está instalada', iphone.instalada, true);
check('anota la red mala', iphone.conexion, '2g');
check('y que estaba en pantalla', iphone.visibilidad, 'visible');

console.log('\n== Android en el navegador, reanudado de segundo plano ==');
limpiar();
g.navigator = { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)', onLine: false, connection: { effectiveType: '4g' } };
g.document = { visibilityState: 'hidden' };
g.window = { matchMedia: () => ({ matches: false }) };
const android = entornoDeEntrada();
check('reconoce Android', android.plataforma, 'android');
check('no instalada', android.instalada, false);
check('sin conexión', android.enLinea, false);
check('estaba en segundo plano', android.visibilidad, 'hidden');

console.log('\n== Nada que identifique a nadie ==');
// Es la regla que no se puede romper: esto se manda fuera. Ni correo, ni nombre, ni
// parroquia, ni identificadores de usuario.
limpiar();
g.navigator = { userAgent: 'Mozilla/5.0 (iPhone) gustavus.tobar@gmail.com', onLine: true };
g.document = { visibilityState: 'visible' };
g.window = { matchMedia: () => ({ matches: false }) };
const texto = JSON.stringify(entornoDeEntrada());
check('no viaja el user agent entero', /Mozilla/.test(texto), false);
check('ni nada que parezca un correo', /@/.test(texto), false);
check('las claves son solo las previstas',
  Object.keys(entornoDeEntrada()).sort(),
  ['conexion', 'enLinea', 'instalada', 'plataforma', 'visibilidad']);
limpiar();

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
