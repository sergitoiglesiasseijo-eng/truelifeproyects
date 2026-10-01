// Utilidades compartidas de las Pages Functions. Sin secretos en el cliente: todo viene de env.
export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export const notConfigured = (what) =>
  json({ error: 'not_configured', message: `${what} todavía no está conectado. Inténtalo más adelante.` }, 501);

export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Anti-spam básico: honeypot + tiempo mínimo + (opcional) Cloudflare Turnstile. */
export async function guard(request, env, body) {
  const origin = request.headers.get('Origin');
  if (origin && env.SITE_URL && origin !== env.SITE_URL) return json({ error: 'forbidden' }, 403);
  if (body.website) return json({ ok: true }); // bot: fingimos éxito
  if (Number(body.t) < 2500) return json({ error: 'too_fast', message: 'Inténtalo de nuevo.' }, 429);
  if (env.TURNSTILE_SECRET) {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: body.turnstile || '' }),
    });
    if (!(await r.json()).success) return json({ error: 'captcha', message: 'No hemos podido verificar que eres una persona.' }, 400);
  }
  return null;
}
export async function readBody(request) {
  try { return await request.json(); } catch { return null; }
}
