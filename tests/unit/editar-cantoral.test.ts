/**
 * Editar un cantoral ya publicado.
 *
 * Reportado el 30-ago-2026: al editar un cantoral publicado el constructor borraba la
 * fecha y la hora, y al terminar "el cantoral se vuelve a republicar mandando de nuevo
 * las notificaciones".
 *
 * Las dos cosas eran el mismo problema encadenado:
 *   1. El constructor arrancaba siempre en "hoy, 10:00, Misa del día" y no reponía los
 *      datos del cantoral que se estaba editando.
 *   2. Para averiguar la fecha había que salir a mirar el listado — y salir del
 *      constructor CANCELABA la edición, dejando el borrador cargado. Al volver,
 *      "guardar" publicaba un cantoral NUEVO, con su aviso push.
 *
 * Aquí se fija la conversión de horario (el dato que se perdía) en los dos sentidos.
 */
import { massTimeTo24h, massTimeTo12h, resolveMassType } from '../../src/utils/massType';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}

console.log('\n== El horario guardado vuelve al constructor ==');
check('mañana', massTimeTo24h('09:30 AM'), '09:30');
check('mediodía', massTimeTo24h('12:00 PM'), '12:00');
check('tarde (la vespertina del sábado)', massTimeTo24h('07:00 PM'), '19:00');
check('medianoche: 12 AM son las 00', massTimeTo24h('12:15 AM'), '00:15');
check('una sola cifra de hora', massTimeTo24h('7:05 PM'), '19:05');
check('espacios de sobra', massTimeTo24h('  07:00   pm '), '19:00');
check('sin AM/PM se toma como 24 h', massTimeTo24h('19:00'), '19:00');
check('texto que no es hora', massTimeTo24h('a las siete'), null);
check('vacío', massTimeTo24h(''), null);
check('hora imposible', massTimeTo24h('25:00'), null);
check('minutos imposibles', massTimeTo24h('10:75'), null);

console.log('\n== Y vuelve a salir en el formato que se guarda ==');
check('mañana', massTimeTo12h('09:30'), '09:30 AM');
check('mediodía', massTimeTo12h('12:00'), '12:00 PM');
check('tarde', massTimeTo12h('19:00'), '07:00 PM');
check('medianoche', massTimeTo12h('00:15'), '12:15 AM');

console.log('\n== Ida y vuelta: la hora no se corre ni se pierde ==');
for (const h of ['00:00', '06:30', '09:00', '11:59', '12:00', '12:30', '18:00', '19:30', '23:45']) {
  check(`${h} sobrevive el viaje`, massTimeTo24h(massTimeTo12h(h)), h);
}

console.log('\n== El tipo de Misa tampoco se pierde ==');
// Una vespertina editada no puede volver a guardarse como "Misa del día": cambiaria
// la ventana de vigencia y el cantoral desapareceria de la vista del pueblo.
check('vespertina', resolveMassType({ massType: 'visperas_i' }), 'visperas_i');
check('II vísperas', resolveMassType({ massType: 'visperas_ii' }), 'visperas_ii');
check('fila antigua con vigil=true', resolveMassType({ vigil: true }), 'visperas_i');
check('fila antigua sin nada', resolveMassType({}), 'dia');

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
