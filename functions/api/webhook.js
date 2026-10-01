// POST /api/webhook — Stripe → registro de pedido, email y entrega digital (tras validar el pago).
// Variables: STRIPE_WEBHOOK_SECRET. La entrega vive en _lib/delivery.js y lee el secreto de Notion desde env.
import { json, notConfigured } from '../_lib/http.js';
import { recordOrder, deliver } from '../_lib/delivery.js';

async function verify(payload, header, secret) {
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=')));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${parts.t}.${payload}`));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 300;
  return fresh && hex === parts.v1;
}

export async function onRequestPost({ request, env }) {
  if (!env.STRIPE_WEBHOOK_SECRET) return notConfigured('El webhook de pagos');
  const payload = await request.text();
  const header = request.headers.get('Stripe-Signature') || '';
  if (!(await verify(payload, header, env.STRIPE_WEBHOOK_SECRET))) return json({ error: 'signature' }, 400);

  const event = JSON.parse(payload);
  if (event.type === 'checkout.session.completed') {
    const s = event.data.object;
    if (s.payment_status === 'paid') {
      await recordOrder(env, { id: s.id, email: s.customer_details?.email, product: s.metadata?.product, amount: s.amount_total, currency: s.currency });
      await deliver(env, { email: s.customer_details?.email, product: s.metadata?.product, orderId: s.id });
    }
  }
  return json({ received: true });
}
