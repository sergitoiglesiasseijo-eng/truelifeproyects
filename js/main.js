/* TrueLife V1 — JS mínimo, sin dependencias. Todo es mejora progresiva. */
(() => {
  const d = document;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => [...r.querySelectorAll(s)];
  const meta = (n) => $(`meta[name="${n}"]`)?.content || '';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- analítica (solo con proveedor configurado + consentimiento) ---- */
  const provider = meta('tl:analytics');
  const consent = () => localStorage.getItem('tl-consent') === 'granted';
  const track = (event, params = {}) => {
    if (!provider || !consent()) return;
    (window.dataLayer = window.dataLayer || []).push({ event, ...params }); // ← conectar aquí el proveedor elegido
  };
  window.TL = { track };
  meta('tl:events').split(',').filter(Boolean).forEach((e) => track(e));
  d.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (t) track(t.dataset.track, { href: t.getAttribute('href') || undefined });
  });

  /* ---- consentimiento ---- */
  const banner = $('[data-cookie]');
  if (banner) {
    if (!localStorage.getItem('tl-consent')) banner.hidden = false;
    banner.addEventListener('click', (e) => {
      const b = e.target.closest('[data-consent]');
      if (!b) return;
      localStorage.setItem('tl-consent', b.dataset.consent === 'grant' ? 'granted' : 'denied');
      banner.hidden = true;
    });
  }

  /* ---- reveal ---- */
  const targets = $$('[data-reveal], .h-hero, .h-page, .h1, .h2, .h-sign');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((t) => io.observe(t));
  } else targets.forEach((t) => t.classList.add('is-in'));

  /* ---- vistas (newsletter_view, shop_view, product_view) ---- */
  $$('[data-view]').forEach((el) => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { track(el.dataset.view); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(el);
  });

  /* ---- header ---- */
  const hdr = $('[data-header]');
  const onScroll = () => hdr.classList.toggle('is-solid', scrollY > 24);
  onScroll(); addEventListener('scroll', onScroll, { passive: true });

  /* ---- menú móvil ---- */
  const burger = $('.burger'), menu = $('#menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    d.body.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); $('a', menu).focus(); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduce ? 0 : 400); burger.focus(); }
  };
  burger?.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', (e) => {
    if (menu.hidden) return;
    if (e.key === 'Escape') setMenu(false);
    if (e.key === 'Tab') {
      const f = [...$$('a,button', menu), burger].filter((x) => !x.disabled);
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width: 900px)').addEventListener('change', (m) => { if (m.matches && !menu.hidden) setMenu(false); });

  /* ---- hora local en el hero ---- */
  const clock = $('[data-clock]');
  if (clock) {
    const tick = () => { clock.textContent = 'Ahora ' + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }); };
    tick(); setInterval(tick, 30000);
  }

  /* ---- índice de principios ---- */
  const secs = $$('[data-pr-section]');
  if (secs.length && 'IntersectionObserver' in window) {
    const links = $$('[data-pr]');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const n = en.target.dataset.prSection;
        secs.forEach((s) => s.classList.toggle('is-active', s === en.target));
        links.forEach((l) => l.classList.toggle('is-active', l.dataset.pr === n));
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  /* ---- filtros de recursos ---- */
  const chips = $$('[data-filter]');
  if (chips.length) {
    const cards = $$('[data-resources] .rcard'), empty = $('[data-empty]'), title = $('[data-empty-title]');
    chips.forEach((c) => c.addEventListener('click', () => {
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      const f = c.dataset.filter; let n = 0;
      cards.forEach((card) => { const show = f === 'todo' || card.dataset.tags.split(' ').includes(f); card.hidden = !show; if (show) n++; });
      empty.hidden = n > 0;
      title.textContent = f === 'todo' ? 'Todavía no hay recursos publicados.' : `Todavía no hay recursos en “${c.textContent}”.`;
    }));
  }

  /* ---- formularios: validación real + estados idle/loading/success/error ---- */
  const T0 = Date.now();
  const msgs = { valueMissing: 'Este campo es obligatorio.', typeMismatch: 'Introduce un email válido, por ejemplo tu@email.com.', tooShort: 'Es demasiado corto.' };
  $$('form[data-form]').forEach((form) => {
    const msg = $('[data-msg]', form);
    const setState = (s, text = '') => { form.dataset.state = s; msg.textContent = text; };
    const checkField = (el) => {
      const err = $(`[data-err="${el.name}"]`, form);
      const ok = el.checkValidity();
      el.setAttribute('aria-invalid', String(!ok));
      const key = ['valueMissing', 'typeMismatch', 'tooShort'].find((k) => el.validity[k]);
      const text = ok ? '' : (el.type === 'checkbox' ? 'Necesitamos que lo aceptes para continuar.' : msgs[key] || 'Revisa este campo.');
      if (err) err.textContent = text;
      return ok;
    };
    const fields = $$('input:not([type=hidden]):not(.hp input), select, textarea', form).filter((el) => el.name !== 'website');
    fields.forEach((el) => el.addEventListener('blur', () => el.value !== '' && checkField(el)));
    fields.forEach((el) => el.addEventListener('input', () => el.getAttribute('aria-invalid') === 'true' && checkField(el)));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.dataset.state === 'loading') return;
      const bad = fields.filter((el) => !checkField(el));
      if (bad.length) { bad[0].focus(); setState('idle', 'Revisa los campos marcados.'); return; }
      const data = Object.fromEntries(new FormData(form));
      data.t = String(Date.now() - T0);
      setState('loading', 'Enviando…');
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'No hemos podido enviarlo. Inténtalo de nuevo en unos minutos.');
        setState('success', json.message || (form.dataset.form === 'newsletter' ? 'Listo. Revisa tu email para confirmar la suscripción.' : 'Mensaje enviado. Te responderemos lo antes posible.'));
        form.reset(); track(form.dataset.event);
      } catch (err) {
        setState('error', err instanceof TypeError ? 'No hay conexión con el servidor. Inténtalo de nuevo.' : err.message);
      }
    });
  });

  /* ---- checkout (arquitectura lista; el servidor decide) ---- */
  $$('[data-checkout]').forEach((btn) => {
    const note = btn.parentElement.querySelector('[data-checkout-note]');
    btn.addEventListener('click', async () => {
      if (btn.classList.contains('is-loading')) return;
      if (meta('tl:commerce') !== '1') { note.textContent = 'La compra todavía no está abierta. Estamos cerrando los últimos detalles del producto.'; return; }
      btn.classList.add('is-loading'); note.textContent = '';
      track('begin_checkout', { product: btn.dataset.checkout });
      try {
        const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: btn.dataset.checkout }) });
        const json = await res.json();
        if (!res.ok || !json.url) throw new Error(json.message || 'No hemos podido iniciar la compra.');
        location.href = json.url;
      } catch (err) { btn.classList.remove('is-loading'); note.textContent = (err.message || 'No hemos podido iniciar la compra.') + ' Inténtalo de nuevo o escríbenos.'; }
    });
  });
})();
