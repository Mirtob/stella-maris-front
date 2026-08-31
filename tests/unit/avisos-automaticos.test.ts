/**
 * Los dos avisos AUTOMÁTICOS del cron diario.
 *
 *   1. Celebraciones próximas (7 y 1 día antes) → a quien tenga el topic 'celebrations'.
 *      OJO: son SOLO las celebraciones AGREGADAS a mano en la app. Las del calendario
 *      base (domingos y solemnidades) no disparan este aviso a propósito: avisar todos
 *      los domingos a toda la parroquia sería ruido.
 *   2. "Publica el cantoral" al Coro/Admin, 3 días antes. Como el cron corre TODOS los
 *      días, el domingo cae en la corrida del JUEVES (jueves + 3 = domingo).
 *
 * Lo que se fija aquí es la aritmética de fechas, que es de donde vienen los fallos
 * silenciosos: si el jueves apunta al domingo equivocado, o si el calendario base se
 * queda sin años, el aviso no sale y nadie se entera hasta que falta el cantoral.
 */
import {
  addDays, baseCelebrationsOn, solemnitiesOn, todayInSantiago, leadLabel, digestBody,
} from '../../api/cron/celebration-reminders';

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

const diaSemana = (ymd: string) => new Date(`${ymd}T12:00:00Z`).getUTCDay(); // 0=dom, 4=jue

console.log('\n== Sumar días no se descuadra en los bordes ==');
check('día normal', addDays('2026-08-30', 3), '2026-09-02');
check('cambio de mes', addDays('2026-08-30', 2), '2026-09-01');
check('cambio de año', addDays('2026-12-30', 3), '2027-01-02');
check('año bisiesto (29-feb existe)', addDays('2028-02-27', 2), '2028-02-29');
check('año NO bisiesto salta el 29', addDays('2027-02-27', 2), '2027-03-01');
check('hacia atrás', addDays('2026-03-01', -1), '2026-02-28');
// El cron corre a las 14:00 UTC y Chile cambia de horario el 1.er domingo de
// septiembre. La suma de días es aritmética pura sobre 'YYYY-MM-DD', así que el
// cambio de horario no puede correrla un día — que es el error clásico aquí.
check('el cambio de hora de Chile no corre el día', addDays('2026-09-05', 1), '2026-09-06');
check('ni al volver a hora de invierno', addDays('2026-04-04', 1), '2026-04-05');

console.log('\n== El jueves apunta al domingo, todo el año ==');
// Se recorren TODOS los jueves de 2026 y 2027: cada uno debe caer en un domingo que
// además exista en el calendario base, o el coro se queda sin recordatorio esa semana.
let jueves = 0;
const sinCelebracion: string[] = [];
const noEsDomingo: string[] = [];
for (let d = new Date(Date.UTC(2026, 0, 1)); d < new Date(Date.UTC(2028, 0, 1)); d.setUTCDate(d.getUTCDate() + 1)) {
  const hoy = d.toISOString().slice(0, 10);
  if (diaSemana(hoy) !== 4) continue;
  jueves++;
  const objetivo = addDays(hoy, 3);
  if (diaSemana(objetivo) !== 0) noEsDomingo.push(`${hoy}→${objetivo}`);
  if (baseCelebrationsOn(objetivo).length === 0) sinCelebracion.push(`${hoy}→${objetivo}`);
}
checkTrue(`se revisaron los ${jueves} jueves de 2026 y 2027`, jueves === 105, `fueron ${jueves}`);
checkTrue('todos caen en domingo', noEsDomingo.length === 0, noEsDomingo.slice(0, 5).join(', '));
checkTrue('todos tienen celebración en el calendario', sinCelebracion.length === 0, sinCelebracion.slice(0, 5).join(', '));

console.log('\n== El calendario base alcanza para rato ==');
// Si se acaba, el recordatorio del jueves deja de salir SIN dar ningún error.
checkTrue('llega al menos hasta fin de 2030',
  baseCelebrationsOn('2030-12-25').length > 0, 'falta la Navidad de 2030: regenera el calendario');
check('un domingo del Tiempo Ordinario', baseCelebrationsOn('2027-01-17'), ['2.º Domingo del Tiempo Ordinario']);
// Los domingos que caen en una FIESTA son los que faltaban: no se llaman "N.º Domingo
// de…" ni son solemnidad, y por eso se habian quedado fuera del calendario del cron.
check('domingo de la Sagrada Familia', baseCelebrationsOn('2026-12-27'), ['Sagrada Familia']);
check('domingo del Bautismo del Señor', baseCelebrationsOn('2027-01-10'), ['Bautismo del Señor']);
check('un día entre semana no trae nada', baseCelebrationsOn('2026-09-08'), []);

console.log('\n== Qué avisa el recordatorio de cercanía (y qué NO) ==');
// Pedido el 30-ago-2026: que avise de las solemnidades y de lo agregado a mano, pero
// NO de los domingos corrientes, "para que no quede con tanto ruido".
check('Navidad avisa', solemnitiesOn('2026-12-25'), ['Natividad del Señor']);
check('Pentecostés avisa aunque caiga en domingo', solemnitiesOn('2026-05-24'), ['Pentecostés']);
check('Corpus Christi avisa', solemnitiesOn('2026-06-07'), ['Corpus Christi']);
check('Cristo Rey avisa', solemnitiesOn('2026-11-22'), ['Jesucristo, Rey del Universo']);
check('la Asunción avisa (entre semana)', solemnitiesOn('2026-08-15'), ['Asunción de la Virgen María']);
check('un domingo corriente NO avisa', solemnitiesOn('2026-09-06'), []);
check('un domingo de Adviento NO avisa', solemnitiesOn('2026-12-13'), []);
check('la Sagrada Familia (fiesta) NO avisa', solemnitiesOn('2026-12-27'), []);
// Los seis dias de la Octava de Pascua son solemnidades de rango: avisarlos daba
// catorce dias seguidos de notificaciones alrededor de Semana Santa.
check('Domingo de Resurrección sí avisa', solemnitiesOn('2026-04-05'), ['Domingo de Resurrección']);
check('el Lunes de la Octava NO avisa', solemnitiesOn('2026-04-06'), []);
check('el Sábado de la Octava NO avisa', solemnitiesOn('2026-04-11'), []);

// El volumen es lo que decide si la gente sigue mirando los avisos o los apaga.
const solemnes2026: string[] = [];
for (let d = new Date(Date.UTC(2026, 0, 1)); d < new Date(Date.UTC(2027, 0, 1)); d.setUTCDate(d.getUTCDate() + 1)) {
  solemnes2026.push(...solemnitiesOn(d.toISOString().slice(0, 10)));
}
check('18 solemnidades en el año (las 24 menos la Octava)', solemnes2026.length, 18);
checkTrue('ninguna es un domingo corriente',
  !solemnes2026.some((n) => /Domingo del Tiempo|Domingo de Adviento|Domingo de Cuaresma/.test(n)),
  solemnes2026.join(', '));

console.log('\n== Las ventanas de 7 y 1 día del aviso de celebraciones ==');
check('a 7 días', addDays('2026-09-01', 7), '2026-09-08');
check('a 1 día', addDays('2026-09-01', 1), '2026-09-02');
check('rótulo de 1 día', leadLabel(1), 'mañana');
check('rótulo de 7 días', leadLabel(7), 'en 7 días');

console.log('\n== El texto del aviso no se desborda ==');
check('hasta 3 van enteras', digestBody(['A', 'B', 'C']), 'A · B · C');
check('de 4 en adelante se resume', digestBody(['A', 'B', 'C', 'D']), 'A · B · C y 1 más');
check('una sola', digestBody(['A']), 'A');

console.log('\n== La fecha de hoy se calcula en Chile, no en UTC ==');
// A las 02:00 UTC en Chile todavía es el día anterior: sin la zona horaria, el cron
// se saltaría un día entero de recordatorios.
const hoyChile = todayInSantiago();
checkTrue('tiene forma YYYY-MM-DD', /^\d{4}-\d{2}-\d{2}$/.test(hoyChile), hoyChile);
const enChile = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
check('coincide con el reloj de Chile', hoyChile, enChile);

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
