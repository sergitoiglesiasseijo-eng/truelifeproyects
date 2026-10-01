// POST /api/checkout — crea la sesión de pago (Stripe Checkout). Sin STRIPE_SECRET_KEY responde 501.
// Variables: STRIPE_SECRET_KEY, STRIPE_PRICE_ORGANIZA_TU_VIDA, SITE_URL. Ningún secreto llega al navegador.
import { json, notConfigured, readBody } from '../_lib/http.js';

const PRODUCTS = { 'organiza-tu-vida': 'STRIPE_PRICE_ORGANIZA_TU_VIDA' };

export async function onRequestPost({ request, env }) {
  const body = await readBody(request);
  const priceVar = PRODUCTS[body?.product];
  if (!priceVar) return json({ error: 'product', message: 'Producto no válido.' }, 400);
  if (!env.STRIPE_SECRET_KEY || !env[priceVar] || !env.SITE_URL) return notConfigured('El pago');

  const params = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': env[priceVar],
    'line_items[0][quantity]': '1',
    'metadata[product]': body.product,
    success_url: `${env.SITE_URL}/checkout/success/`,
    cancel_url: `${env.SITE_URL}/checkout/cancel/`,
  });
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const s = await r.json();
  return r.ok ? json({ url: s.url }) : json({ error: 'stripe', message: 'No hemos podido iniciar la compra.' }, 502);
}
