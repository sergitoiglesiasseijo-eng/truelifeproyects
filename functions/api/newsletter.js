// POST /api/newsletter — alta en la Carta TrueLife.
// Conectar proveedor: definir NEWSLETTER_PROVIDER + credenciales en Cloudflare (Settings → Variables). No hay proveedor por defecto.
import { json, notConfigured, isEmail, guard, readBody } from '../_lib/http.js';

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  if (!body) return json({ error: 'bad_request', message: 'Solicitud no válida.' }, 400);
  const blocked = await guard(request, env, body);
  if (blocked) return blocked;
  if (!isEmail(body.email)) return json({ error: 'email', message: 'Introduce un email válido.' }, 422);
  if (!body.consent) return json({ error: 'consent', message: 'Necesitamos tu consentimiento para suscribirte.' }, 422);

  switch (env.NEWSLETTER_PROVIDER) {
    // case 'mailerlite': …  case 'buttondown': …  case 'brevo': …  (implementar al elegir proveedor)
    default:
      return notConfigured('El envío de la newsletter');
  }
}
