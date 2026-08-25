/**
 * Ir de visita a otra parroquia (src/utils/parishVisit.ts).
 *
 * Pedido el 24-ago-2026: mejorar el caso del usuario —de coro o de pueblo fiel— que
 * va a Misa a otra parroquia de la diócesis o del país. La visita es de sesión:
 * se cambia la parroquia activa, el perfil no se toca, y mientras dura se participa
 * como Pueblo fiel.
 */
import type { UserProfile } from '../../src/types';
import {
  esVisita, rolEfectivo, parroquiasDelPerfil, recordarVisita, MAX_VISITAS_RECIENTES,
} from '../../src/utils/parishVisit';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const CASA = 'San José - Diócesis de Valparaíso';
const OTRA = 'Catedral - Diócesis de Santiago';

const perfil = (extra: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1', email: 'u@x.cl', name: 'Usuario', role: 'Coro',
  parishes: [CASA], parishName: CASA,
  ...extra,
} as UserProfile);

console.log('\n== Qué cuenta como visita ==');
check('sin parroquia activa no hay visita', esVisita(perfil()), false);
check('en la propia no es visita', esVisita(perfil({ activeParishName: CASA })), false);
check('en una ajena sí es visita', esVisita(perfil({ activeParishName: OTRA })), true);
check('una capilla de la propia NO es visita',
  esVisita(perfil({ activeParishName: `${CASA} · Capilla del Carmen` })), false);
check('una capilla de una ajena sí es visita',
  esVisita(perfil({ activeParishName: `${OTRA} · Capilla de los Sagrados Corazones` })), true);
check('con varias parroquias, cualquiera de ellas es casa',
  esVisita(perfil({ parishes: [CASA, OTRA], activeParishName: OTRA })), false);
check('perfil antiguo con solo parishName',
  esVisita({ ...perfil({ activeParishName: OTRA }), parishes: undefined } as UserProfile), true);
check('el Admin nunca está de visita (alcance global)',
  esVisita(perfil({ role: 'Admin', activeParishName: OTRA })), false);
check('perfil sin ninguna parroquia: no se inventa una visita',
  esVisita({ ...perfil({ activeParishName: OTRA }), parishes: [], parishName: undefined } as UserProfile), false);

console.log('\n== Parroquias del perfil ==');
check('usa el arreglo cuando existe', parroquiasDelPerfil(perfil({ parishes: [CASA, OTRA] })), [CASA, OTRA]);
check('cae a parishName en perfiles antiguos',
  parroquiasDelPerfil({ parishes: undefined, parishName: CASA } as UserProfile), [CASA]);
check('sin nada, lista vacía', parroquiasDelPerfil({} as UserProfile), []);

console.log('\n== De visita se participa como Pueblo fiel ==');
check('un corista de visita no es Coro',
  rolEfectivo(perfil({ activeRole: 'Coro', activeParishName: OTRA })), 'Pueblo fiel');
check('en su parroquia sigue siendo Coro',
  rolEfectivo(perfil({ activeRole: 'Coro', activeParishName: CASA })), 'Coro');
check('el pueblo fiel de visita sigue igual',
  rolEfectivo(perfil({ role: 'Pueblo fiel', activeRole: 'Pueblo fiel', activeParishName: OTRA })), 'Pueblo fiel');
check('sin rol de sesión manda el permanente',
  rolEfectivo(perfil({ activeParishName: CASA })), 'Coro');
check('el Admin conserva su rol aunque mire otra parroquia',
  rolEfectivo(perfil({ role: 'Admin', activeRole: 'Admin', activeParishName: OTRA })), 'Admin');

console.log('\n== Visitas recientes ==');
check('se guarda la visitada', recordarVisita([], OTRA, [CASA]), [OTRA]);
check('la más reciente queda primera',
  recordarVisita(['A - D', OTRA], 'B - D', [CASA]), ['B - D', 'A - D', OTRA]);
check('no se duplica: se sube al principio',
  recordarVisita(['A - D', OTRA], OTRA, [CASA]), [OTRA, 'A - D']);
check('las propias no se guardan como visita', recordarVisita([OTRA], CASA, [CASA]), [OTRA]);
check('una capilla de la propia tampoco',
  recordarVisita([OTRA], `${CASA} · Capilla del Carmen`, [CASA]), [OTRA]);
check('la lista no crece sin límite',
  recordarVisita(['A - D', 'B - D', 'C - D'], 'D - D', [CASA]).length, MAX_VISITAS_RECIENTES);
check('vacío o espacios no ensucian la lista', recordarVisita([OTRA], '   ', [CASA]), [OTRA]);
check('sin lista previa funciona igual', recordarVisita(undefined, OTRA, [CASA]), [OTRA]);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
