// Registro de pedidos y entrega digital. SOLO servidor.
// La URL privada de duplicación de Notion vive en env.NOTION_DUPLICATE_URL_ORGANIZA_TU_VIDA (secreto de Cloudflare) y
// únicamente se envía por email al comprador tras validar el pago. Nunca se incluye en HTML, JS ni respuestas de la API.
export async function recordOrder(env, order) {
  // TODO al elegir almacenamiento: Cloudflare D1 (env.DB.prepare(...).bind(...).run()) o KV (env.ORDERS.put(order.id, JSON.stringify(order))).
  if (env.ORDERS) await env.ORDERS.put(order.id, JSON.stringify({ ...order, at: new Date().toISOString() }));
}

export async function deliver(env, { email, product, orderId }) {
  const secretUrl = product === 'organiza-tu-vida' ? env.NOTION_DUPLICATE_URL_ORGANIZA_TU_VIDA : null;
  if (!secretUrl || !env.RESEND_API_KEY || !email) return; // sin configuración no se entrega nada; revisar logs/pedido
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL || 'TrueLife <onboarding@resend.dev>',
      to: [email],
      subject: 'Tu plantilla Organiza tu Vida',
      text: `Gracias por tu compra (${orderId}).\n\nDuplica la plantilla en tu Notion desde este enlace personal:\n${secretUrl}\n\nSi algo falla, responde a este email.`,
    }),
  });
}
