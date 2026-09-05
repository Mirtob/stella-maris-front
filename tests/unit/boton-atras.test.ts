/**
 * El botón "atrás" del teléfono (src/utils/navegacionAtras.ts).
 *
 * Reportado el 5-sep-2026: pulsar atrás en el teléfono o la tablet SACABA de la app.
 * La app cambia de pantalla con estado propio y nunca tocaba el historial del
 * navegador, así que para el teléfono era una sola página y atrás significaba salir.
 *
 * Estas pruebas fijan qué es "volver" en cada sitio, que es la parte que se puede
 * equivocar: el orden entre cerrar una capa, subir un nivel y salir.
 */
import {
  destinoAlVolver, registrarCapa, hayCapaAbierta, cerrarCapaDeArriba, VISTA_RAIZ,
} from '../../src/utils/navegacionAtras';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== Dentro del armazón: se sube a la raíz ==');
for (const vista of ['cantorals', 'history', 'liturgical-calendar', 'favorites', 'admin', 'sheet-music']) {
  check(`${vista} → ${VISTA_RAIZ}`, destinoAlVolver({ screen: 'app', view: vista }),
    { tipo: 'vista', vista: VISTA_RAIZ });
}

console.log('\n== En la raíz no hay a dónde volver ==');
// Aquí es donde la app debe DEJAR salir (con el aviso de "pulsa otra vez").
check('main → salir', destinoAlVolver({ screen: 'app', view: VISTA_RAIZ }), { tipo: 'salir' });

console.log('\n== Las sub-pantallas vuelven a donde se abrieron ==');
// El reproductor abierto desde el historial tiene que volver AL HISTORIAL, no al inicio.
check('reproductor abierto desde el historial',
  destinoAlVolver({ screen: 'player', returnView: 'history' }), { tipo: 'vista', vista: 'history' });
check('lista de reproducción desde cantorales',
  destinoAlVolver({ screen: 'playlist', returnView: 'cantorals' }), { tipo: 'vista', vista: 'cantorals' });
check('ajustes desde el calendario',
  destinoAlVolver({ screen: 'settings', returnView: 'liturgical-calendar' }),
  { tipo: 'vista', vista: 'liturgical-calendar' });

console.log('\n== Pantallas sueltas vuelven al inicio ==');
check('instalar → inicio', destinoAlVolver({ screen: 'install' }), { tipo: 'vista', vista: VISTA_RAIZ });
check('términos → inicio', destinoAlVolver({ screen: 'terms' }), { tipo: 'vista', vista: VISTA_RAIZ });
check('enlace de cantoral → inicio', destinoAlVolver({ screen: 'cantoral-link' }), { tipo: 'vista', vista: VISTA_RAIZ });

console.log('\n== Antes de entrar, atrás sale sin más ==');
// En el login o cargando no hay nada a lo que volver, y atrapar ahí sería peor.
for (const s of ['loading', 'login', 'callback', 'onboarding', 'profile-setup']) {
  check(`${s} → salir`, destinoAlVolver({ screen: s }), { tipo: 'salir' });
}

console.log('\n== Una capa abierta manda sobre todo lo demás ==');
// Es el caso del Modo Atril: atrás cierra el atril, no saca del cantoral.
check('en el atril, dentro de una vista',
  destinoAlVolver({ screen: 'app', view: 'cantorals', hayCapaAbierta: true }), { tipo: 'cerrar-capa' });
check('en el atril, en la raíz',
  destinoAlVolver({ screen: 'app', view: VISTA_RAIZ, hayCapaAbierta: true }), { tipo: 'cerrar-capa' });
check('la capa gana incluso a una sub-pantalla',
  destinoAlVolver({ screen: 'player', returnView: 'history', hayCapaAbierta: true }), { tipo: 'cerrar-capa' });

console.log('\n== El registro de capas ==');
check('al empezar no hay ninguna', hayCapaAbierta(), false);
let cerradas: string[] = [];
const bajaA = registrarCapa(() => cerradas.push('A'));
check('con una apuntada, sí hay', hayCapaAbierta(), true);
const bajaB = registrarCapa(() => cerradas.push('B'));
check('se cierra la de más arriba', (cerrarCapaDeArriba(), cerradas), ['B']);
check('queda la de abajo', hayCapaAbierta(), true);
check('y luego esa', (cerrarCapaDeArriba(), cerradas), ['B', 'A']);
check('ya no queda ninguna', hayCapaAbierta(), false);
check('cerrar sin capas no rompe', cerrarCapaDeArriba(), false);

console.log('\n== Darse de baja al cerrarse sola ==');
// Si la capa se cierra por su propio botón, tiene que dejar de contar.
cerradas = [];
const bajaC = registrarCapa(() => cerradas.push('C'));
bajaC();
check('ya no cuenta', hayCapaAbierta(), false);
check('y atrás vuelve a navegar',
  destinoAlVolver({ screen: 'app', view: 'history', hayCapaAbierta: hayCapaAbierta() }),
  { tipo: 'vista', vista: VISTA_RAIZ });
bajaA(); bajaB();

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
