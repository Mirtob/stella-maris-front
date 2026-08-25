/**
 * Perfil del usuario: quién manda y quién está repetido (src/utils/profileMerge.ts).
 *
 * Reportado el 24-ago-2026: el admin le cambió el rol a un usuario y "no cambió"; y un
 * fiel registrado en dos parroquias aparecía en el panel con una sola.
 *
 * La causa del rol: al abrir la app, el dispositivo usaba SU copia local del perfil y
 * encima la subía tal cual a Supabase. El cambio del admin no llegaba nunca y, peor, se
 * revertía solo. Estas pruebas fijan que lo permanente lo pone el servidor y que lo de
 * la sesión (con qué rol y parroquia entro hoy) lo pone el dispositivo.
 */
import { mergeProfile, idsDuplicados } from '../../src/utils/profileMerge';
import type { UserProfile } from '../../src/types';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

const PARROQUIA_A = 'Parroquia A - Diócesis de Prueba';
const PARROQUIA_B = 'Parroquia B - Diócesis de Prueba';

const perfil = (over: Partial<UserProfile> = {}): UserProfile => ({
  id: 'u1', email: 'u1@usuario.stellamaris.app', name: 'María Pérez',
  role: 'Pueblo fiel', parishes: [PARROQUIA_A], parishName: PARROQUIA_A, ...over,
});

console.log('\n== El caso reportado: el admin sube a alguien a Coro ==');
const enElServidor = perfil({ role: 'Coro', instruments: ['Guitarra'] });
const enElTelefono = perfil({ role: 'Pueblo fiel', activeRole: 'Pueblo fiel', activeParishName: PARROQUIA_A });
const fusionado = mergeProfile(enElServidor, enElTelefono);
check('el rol que llega es el del servidor', fusionado.role, 'Coro');
check('y con él, lo que el admin haya puesto', fusionado.instruments, ['Guitarra']);
check('la elección de sesión anterior se descarta', fusionado.activeRole, undefined);
check('…y también el recuerdo de la sesión previa', fusionado.lastSessionRole, undefined);
check('la parroquia activa del dispositivo se conserva', fusionado.activeParishName, PARROQUIA_A);

console.log('\n== Sin cambios del admin, la sesión sigue igual ==');
const igual = mergeProfile(perfil(), perfil({ activeRole: 'Pueblo fiel', lastSessionRole: 'Pueblo fiel', activeParishName: PARROQUIA_B }));
check('no se molesta al usuario pidiéndole elegir de nuevo', igual.activeRole, 'Pueblo fiel');
check('se recuerda la sesión previa', igual.lastSessionRole, 'Pueblo fiel');
check('sigue en la parroquia que eligió hoy', igual.activeParishName, PARROQUIA_B);

console.log('\n== Lo permanente lo pone el servidor, no el teléfono ==');
const conDosParroquias = mergeProfile(
  perfil({ parishes: [PARROQUIA_A, PARROQUIA_B], parishName: PARROQUIA_A, name: 'María Pérez Soto' }),
  perfil({ parishes: [PARROQUIA_A], name: 'María' }),
);
check('las parroquias son las del servidor', conDosParroquias.parishes, [PARROQUIA_A, PARROQUIA_B]);
check('el nombre también', conDosParroquias.name, 'María Pérez Soto');
check('un teléfono con datos viejos ya no los reimpone',
  mergeProfile(perfil({ role: 'Pueblo fiel' }), perfil({ role: 'Admin' })).role, 'Pueblo fiel');

console.log('\n== Fichas repetidas de la misma persona ==');
const gente = [
  { id: 'a', name: 'Juan Soto', recoveryEmail: undefined },
  { id: 'b', name: 'juan  soto', recoveryEmail: undefined },          // mismo nombre, otra caja
  { id: 'c', name: 'Pedro Ruiz', recoveryEmail: 'pedro@correo.cl' },
  { id: 'd', name: 'P. Ruiz', recoveryEmail: 'PEDRO@correo.cl' },     // mismo correo
  { id: 'e', name: 'Ana Vidal', recoveryEmail: 'ana@correo.cl' },     // única
];
const marcados = idsDuplicados(gente as any);
check('empareja por nombre aunque cambie la caja o los espacios', marcados.has('a') && marcados.has('b'), true);
check('empareja por correo de recuperación', marcados.has('c') && marcados.has('d'), true);
check('a quien no se repite no lo marca', marcados.has('e'), false);
check('en total marca cuatro fichas', marcados.size, 4);

console.log('\n== Nombres vacíos no cuentan como iguales ==');
const sinNombre = idsDuplicados([
  { id: 'x', name: '', recoveryEmail: undefined },
  { id: 'y', name: '   ', recoveryEmail: undefined },
] as any);
check('dos fichas sin nombre no son "la misma persona"', sinNombre.size, 0);

console.log(`\n${pass} ok, ${fail} fallas`);
if (fail > 0) process.exit(1);
