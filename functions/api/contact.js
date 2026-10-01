// POST /api/contact — formulario de contacto.
// Conectar: CONTACT_TO_EMAIL + proveedor de email transaccional (p. ej. Resend con RESEND_API_KEY).
import { json, notConfigured, isEmail, guard, readBody } from '../_lib/http.js';

const REASONS = ['Pregunta general', 'Soporte', 'Colaboración', 'Prensa/contenido', 'Otro'];

export async function onRequestPost({ request, env }) {
  const b = await readBody(request);
  if (!b) return json({ error: 'bad_request', message: 'Solicitud no válida.' }, 400);
  const blocked = await guard(request, env, b);
  if (blocked) return blocked;
  if (!b.name || b.name.length < 2 || b.name.length > 120) return json({ error: 'name', message: 'Indica tu nombre.' }, 422);
  if (!isEmail(b.email)) return json({ error: 'email', message: 'Introduce un email válido.' }, 422);
  if (!REASONS.includes(b.reason)) return json({ error: 'reason', message: 'Elige un motivo.' }, 422);
  if (!b.message || b.message.length < 10 || b.message.length > 5000) return json({ error: 'message', message: 'Escribe un mensaje de al menos 10 caracteres.' }, 422);
  if (!b.consent) return json({ error: 'consent', message: 'Necesitamos que aceptes la política de privacidad.' }, 422);

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL) return notConfigured('El formulario de contacto');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || 'TrueLife <onboarding@resend.dev>',
      to: [env.CONTACT_TO_EMAIL],
      reply_to: b.email,
      subject: `[TrueLife] ${b.reason} — ${b.name}`,
      text: `${b.message}\n\n— ${b.name} <${b.email}>`,
    }),
  });
  return r.ok ? json({ ok: true, message: 'Mensaje enviado. Te responderemos lo antes posible.' }) : json({ error: 'send_failed', message: 'No hemos podido enviar el mensaje. Inténtalo de nuevo.' }, 502);
}
