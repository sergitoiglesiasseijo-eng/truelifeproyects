# TrueLife — archivos listos para subir

Esta carpeta es la web completa ya generada: HTML, CSS, JS y fuentes.
No hace falta instalar nada ni compilar nada — se sube tal cual.

## Opción A — Hosting 100% estático (Neocities, GitHub Pages, Netlify "drag & drop", Cloudflare Pages sin Functions...)

1. Sube TODO el contenido de esta carpeta a la raíz de tu hosting
   (el archivo `index.html` debe quedar en la raíz, no dentro de una subcarpeta).
2. Ya está. La web funciona entera: todas las páginas, el menú, las animaciones,
   los acordeones de FAQ, el filtro de recursos.
3. Lo único que NO funcionará sin más: el formulario de contacto, el alta a la
   newsletter y el botón de comprar "Organiza tu Vida" — necesitan un backend
   (ver Opción B) o puedes cambiar sus formularios por un servicio externo tipo
   Formspree / Getform / Mailchimp embed más adelante.

## Opción B — Cloudflare Pages (recomendado, con formularios y pagos funcionando)

1. Sube esta carpeta como sitio en Cloudflare Pages (build output = esta misma carpeta).
2. Copia también la carpeta `functions/` (está un nivel por encima de esta, en el
   paquete original del proyecto) a la raíz del repositorio que conecte con Pages.
   Cloudflare la detecta sola y activa `/api/newsletter`, `/api/contact`,
   `/api/checkout` y `/api/webhook`.
3. En Cloudflare Pages → Settings → Environment variables, añade las credenciales
   reales cuando las tengas (proveedor de newsletter, Resend, Stripe, etc.).
   Sin ellas, los formularios siguen funcionando pero responden con un aviso
   honesto de "todavía no está conectado" en vez de romperse.

## Archivos importantes

- `index.html`, `historia/`, `principios/`, `explora/`, `recursos/`, `tienda/`,
  `sobre-truelife/`, `contacto/`, `newsletter/`, `legal/`, `journal/`,
  `checkout/`, `mis-compras/`, `404.html` → todas las páginas del sitio.
- `css/styles.css`, `js/main.js`, `fonts/` → estilos, comportamiento y tipografía.
- `sitemap.xml`, `robots.txt` → SEO técnico.
- `_headers` → cabeceras de seguridad (Cloudflare Pages y Netlify las leen solas).
- `img/og.png` → imagen provisional para compartir en redes; sustitúyela cuando
  tengas la fotografía real de marca.

## Qué falta antes de considerarla "web final"

Precio y funcionalidades cerradas de "Organiza tu Vida", fotografía real de marca,
logo en SVG, handles de redes sociales, datos legales/fiscales, proveedor de pago
y de newsletter. Todo está preparado para sustituir cada uno de esos datos sin
tocar el diseño ni la estructura.
