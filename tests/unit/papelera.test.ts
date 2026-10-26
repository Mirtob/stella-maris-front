/**
 * Papelera de cantorales y registro de cambios (migración 20261028_papelera_y_registro).
 *
 * Dos cosas: las reglas puras de utils/papelera, y las garantías que tiene que seguir
 * dando el SQL. Si alguien recrea la policy de lectura sin `deleted_at IS NULL`, o el
 * índice único sin excluir la papelera, o quita el trigger que convierte el DELETE,
 * se caza aquí.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { DIAS_PAPELERA, diasRestantes, camposLegibles } from '../../src/utils/papelera';

let pass = 0, fail = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}\n       esperado: ${JSON.stringify(expected)}\n       obtenido: ${JSON.stringify(actual)}`); }
}
const checkTrue = (name: string, v: boolean) => check(name, v, true);

console.log('\n=== Papelera y registro de cambios ===\n');

// ── Días que quedan ─────────────────────────────────────────────────────────
const ahora = new Date('2026-10-28T12:00:00Z');
check('recién borrado → 30 días', diasRestantes('2026-10-28T12:00:00Z', ahora), DIAS_PAPELERA);
check('borrado hace 29,5 días → 1', diasRestantes('2026-09-29T00:00:00Z', ahora), 1);
check('vencido → 0, nunca negativo', diasRestantes('2026-01-01T00:00:00Z', ahora), 0);
check('fecha inválida → el máximo (no "se elimina hoy")', diasRestantes('basura', ahora), DIAS_PAPELERA);

// ── Detalle de una edición ──────────────────────────────────────────────────
check('columnas → castellano', camposLegibles('mass_time,songs'), ['hora', 'cantos']);
check('vigil y mass_type se dicen una vez', camposLegibles('mass_type,vigil'), ['tipo de Misa']);
check('lo técnico no se muestra', camposLegibles('id,choir_id,songs'), ['cantos']);
check('sin detalle → nada', camposLegibles(null), []);

// ── Garantías del SQL ───────────────────────────────────────────────────────
const sql = readFileSync(join(process.cwd(), 'supabase', 'migrations', '20261028_papelera_y_registro.sql'), 'utf8');

checkTrue('DIAS_PAPELERA calza con la purga del SQL',
  sql.includes(`deleted_at < now() - interval '${DIAS_PAPELERA} days'`));
checkTrue('el DELETE se convierte en papelera (trigger BEFORE DELETE)',
  /CREATE TRIGGER cantoral_borrar_a_papelera\s+BEFORE DELETE ON public\.published_cantorals/.test(sql));
checkTrue('lo que está en la papelera no se lee por la vía normal',
  /CREATE POLICY "cantorals_select"[\s\S]*?USING \(\s*deleted_at IS NULL/.test(sql));
checkTrue('un cantoral en la papelera no ocupa su Misa',
  /published_cantorals_mass_uk[\s\S]*?WHERE status = 'published' AND deleted_at IS NULL/.test(sql));
checkTrue('las columnas de la papelera no se tocan con un UPDATE normal',
  /CREATE TRIGGER cantoral_proteger_papelera\s+BEFORE UPDATE/.test(sql));
checkTrue('el registro lo llena un trigger, no la app',
  /CREATE TRIGGER cantoral_changes_log\s+AFTER INSERT OR UPDATE OR DELETE/.test(sql)
  && /REVOKE INSERT, UPDATE, DELETE ON public\.cantoral_changes FROM anon, authenticated/.test(sql));
checkTrue('eliminar definitivo es solo del admin principal',
  /borrar_cantoral_definitivo[\s\S]*?IF NOT public\.is_admin\(\) THEN RETURN FALSE/.test(sql));

// ── El servidor no avisa de lo que está en la papelera ──────────────────────
const notify = readFileSync(join(process.cwd(), 'api', 'notify-cantoral.ts'), 'utf8');
const cron = readFileSync(join(process.cwd(), 'api', 'cron', 'celebration-reminders.ts'), 'utf8');
checkTrue('notify-cantoral ignora la papelera', /published_cantorals\?id=in\.[^`]*deleted_at=is\.null/.test(notify));
checkTrue('el recordatorio no cuenta un cantoral en la papelera como publicado',
  /published_cantorals\?parish_name=[^`]*deleted_at=is\.null/.test(cron));

console.log(`\n${fail === 0 ? 'TODO OK' : 'HAY FALLAS'} — ${pass} ok, ${fail} fallidas\n`);
process.exit(fail === 0 ? 0 : 1);
