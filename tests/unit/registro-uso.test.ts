import { routeModule, usageModuleLabel, fillDays, USAGE_MODULE_LABEL } from '../../src/utils/usageModules';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Qué pantalla cuenta como qué módulo ==');
check('inicio', routeModule({ screen: 'app', view: 'main' }), 'inicio');
check('vista de la app', routeModule({ screen: 'app', view: 'manage-cantorals' }), 'manage-cantorals');
check('reproductor', routeModule({ screen: 'player' }), 'reproductor');
check('cantoral abierto', routeModule({ screen: 'playlist' }), 'cantoral');
check('login no cuenta', routeModule({ screen: 'login' }), null);
check('carga no cuenta', routeModule({ screen: 'loading' }), null);
check('demo pública no cuenta', routeModule({ screen: 'demo' }), null);
check('vista desconocida no cuenta', routeModule({ screen: 'app', view: 'algo-raro' }), null);

console.log('\n== Las claves cumplen el CHECK de la base ==');
check('todas en minúsculas y guiones',
  Object.keys(USAGE_MODULE_LABEL).filter((k) => !/^[a-z0-9-]{1,40}$/.test(k)), []);
check('rótulo en español', usageModuleLabel('atril'), 'Modo Atril');
check('clave sin rótulo se muestra tal cual', usageModuleLabel('nuevo-modulo'), 'nuevo-modulo');

console.log('\n== Serie diaria sin huecos ==');
const hoy = new Date(2026, 9, 16, 9);
const serie = fillDays([{ day: '2026-10-14', visits: 5, users: 2 }], 4, hoy);
check('4 días seguidos', serie.map((d) => d.day), ['2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16']);
check('vacíos en cero', serie.map((d) => d.visits), [0, 5, 0, 0]);
check('cruza fin de mes', fillDays([], 3, new Date(2026, 10, 1)).map((d) => d.day), ['2026-10-30', '2026-10-31', '2026-11-01']);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail) process.exit(1);
