import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';

// Recuperación de clave self-service para cuentas usuario/clave.
// El login es por usuario → el email de auth es sintético, así que el reset
// nativo de Supabase no le llega al usuario. Aquí enviamos un CÓDIGO al correo
// de recuperación (o al que ingrese) usando Resend, y lo validamos server-side.
// El estado del código vive en user_metadata (no requiere tabla nueva).
//
// Endpoint PÚBLICO (el usuario olvidó su clave, no puede autenticarse).
const USERNAME_EMAIL_DOMAIN = 'usuario.stellamaris.app';
const CODE_TTL_MIN = 15;
const MAX_ATTEMPTS = 5;

function safeParse(s: string): any { try { return JSON.parse(s); } catch { return {}; } }
function hashCode(code: string, salt: string): string {
  return createHash('sha256').update(`${code}:${salt}`).digest('hex');
}
function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!d) return '***';
  return `${u.slice(0, 1)}***@${d}`;
}

async function findUserByEmail(url: string, svc: Record<string, string>, email: string): Promise<any | null> {
  for (let page = 1; page <= 10; page++) {
    const r = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: svc });
    if (!r.ok) return null;
    const data = await r.json();
    const users: any[] = Array.isArray(data) ? data : (data.users || []);
    const found = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < 200) break;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // trim(): defensivo ante variables de entorno con espacios/saltos de línea.
  const URL = (process.env.VITE_SUPABASE_URL || '').trim();
  const SERVICE = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  const RESEND_KEY = (process.env.RESEND_API_KEY || '').trim();
  const RESEND_FROM = (process.env.RESEND_FROM || 'Stella Maris <onboarding@resend.dev>').trim();
  if (!URL || !SERVICE) return res.status(500).json({ error: 'Configuración del servidor incompleta' });

  const svc = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' };
  const body = typeof req.body === 'string' ? safeParse(req.body) : (req.body || {});
  const action = body.action;

  // ── Recuperar USUARIO olvidado a partir del correo de respaldo ──────────────
  // El usuario no recuerda su nombre; con su correo de respaldo le enviamos el/los
  // usuario(s) asociado(s). Privacidad: respuesta SIEMPRE genérica (no revela si el
  // correo existe) y el nombre viaja SOLO al correo, nunca en la respuesta HTTP.
  if (action === 'find-username') {
    const emailIn = String(body.email || '').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailIn)) {
      return res.status(400).json({ error: 'Correo inválido' });
    }
    try {
      const q = `${URL}/rest/v1/user_profiles?recovery_email=ilike.${encodeURIComponent(emailIn)}&select=email,name`;
      const pr = await fetch(q, { headers: svc });
      const rows: any[] = pr.ok ? await pr.json() : [];
      // El nombre de usuario es la parte local del email sintético de auth.
      const usernames = rows
        .map((r) => String(r.email || ''))
        .filter((e) => e.toLowerCase().endsWith(`@${USERNAME_EMAIL_DOMAIN}`))
        .map((e) => e.split('@')[0]);

      if (usernames.length > 0 && RESEND_KEY) {
        const lista = usernames.map((u) => `• ${u}`).join('\n');
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [emailIn],
            subject: 'Tu usuario en Stella Maris',
            text: `Nos pediste recordar tu nombre de usuario.\n\n${usernames.length === 1 ? 'Tu usuario es:' : 'Tus usuarios son:'}\n${lista}\n\nInicia sesión con tu usuario y tu clave. Si olvidaste la clave, usa "¿Olvidaste tu clave?".\n\nSi no fuiste tú, ignora este correo.`,
          }),
        }).catch(() => undefined);
      }
      // Respuesta genérica siempre (no filtra existencia del correo).
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Error del servidor' });
    }
  }

  const username = String(body.username || '').trim().toLowerCase();
  if (!username) return res.status(400).json({ error: 'Falta el usuario' });
  const email = `${username}@${USERNAME_EMAIL_DOMAIN}`;

  try {
    const user = await findUserByEmail(URL, svc, email);
    if (!user) return res.status(404).json({ error: 'No existe ese usuario' });
    const uid = user.id;
    const meta = user.user_metadata || {};

    if (action === 'request') {
      if (!RESEND_KEY) return res.status(500).json({ error: 'Envío de correo no configurado (RESEND_API_KEY)' });

      // Correo destino: el de recuperación guardado, o el que ingrese el usuario.
      const profRes = await fetch(`${URL}/rest/v1/user_profiles?id=eq.${uid}&select=recovery_email`, { headers: svc });
      const prof = profRes.ok ? await profRes.json() : [];
      const storedRecovery = (prof[0]?.recovery_email || '').trim();
      const provided = String(body.email || '').trim();

      let target = storedRecovery;
      if (!target) {
        if (!provided) return res.status(200).json({ needsEmail: true });
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(provided)) return res.status(400).json({ error: 'Correo inválido' });
        target = provided;
        // Guardarlo como correo de recuperación para la próxima vez.
        await fetch(`${URL}/rest/v1/user_profiles?id=eq.${uid}`, {
          method: 'PATCH', headers: { ...svc, Prefer: 'return=minimal' },
          body: JSON.stringify({ recovery_email: provided }),
        });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
      const expISO = new Date(Date.now() + CODE_TTL_MIN * 60_000).toISOString();
      await fetch(`${URL}/auth/v1/admin/users/${uid}`, {
        method: 'PUT', headers: svc,
        body: JSON.stringify({ user_metadata: { ...meta, pwd_reset_hash: hashCode(code, uid), pwd_reset_exp: expISO, pwd_reset_attempts: 0 } }),
      });

      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: RESEND_FROM,
          to: [target],
          subject: 'Código para recuperar tu clave — Stella Maris',
          text: `Tu código para recuperar la clave de la cuenta "${username}" es: ${code}\n\nVence en ${CODE_TTL_MIN} minutos. Si no pediste esto, ignora este correo.`,
        }),
      });
      if (!sent.ok) return res.status(502).json({ error: 'No se pudo enviar el correo' });

      return res.status(200).json({ sent: true, to: maskEmail(target) });
    }

    if (action === 'confirm') {
      const code = String(body.code || '').trim();
      const newPassword = String(body.password || '');
      if (newPassword.length < 6) return res.status(400).json({ error: 'La clave debe tener al menos 6 caracteres' });
      if (!/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Código inválido' });

      const exp = meta.pwd_reset_exp ? Date.parse(meta.pwd_reset_exp) : 0;
      const attempts = Number(meta.pwd_reset_attempts || 0);
      if (!meta.pwd_reset_hash || !exp) return res.status(400).json({ error: 'No hay un código activo. Pídelo de nuevo.' });
      if (Date.now() > exp) return res.status(400).json({ error: 'El código venció. Pídelo de nuevo.' });
      if (attempts >= MAX_ATTEMPTS) return res.status(429).json({ error: 'Demasiados intentos. Pide un código nuevo.' });

      if (hashCode(code, uid) !== meta.pwd_reset_hash) {
        await fetch(`${URL}/auth/v1/admin/users/${uid}`, {
          method: 'PUT', headers: svc,
          body: JSON.stringify({ user_metadata: { ...meta, pwd_reset_attempts: attempts + 1 } }),
        });
        return res.status(400).json({ error: 'Código incorrecto' });
      }

      // OK: cambiar clave y limpiar el código del metadata.
      const cleanMeta = { ...meta };
      delete cleanMeta.pwd_reset_hash; delete cleanMeta.pwd_reset_exp; delete cleanMeta.pwd_reset_attempts;
      const upd = await fetch(`${URL}/auth/v1/admin/users/${uid}`, {
        method: 'PUT', headers: svc,
        body: JSON.stringify({ password: newPassword, user_metadata: cleanMeta }),
      });
      if (!upd.ok) return res.status(400).json({ error: 'No se pudo cambiar la clave' });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'Acción no reconocida' });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || 'Error del servidor' });
  }
}
