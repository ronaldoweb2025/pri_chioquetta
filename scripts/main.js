// Carrossel e formulário. Tokens e URL do Apps Script existem apenas no servidor.
(() => {
  const track = document.querySelector('.gallery-track');
  const previous = document.querySelector('.carousel-prev');
  const next = document.querySelector('.carousel-next');
  const status = document.querySelector('.gallery-status');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (track && previous && next && status) {
    const cards = [...track.children];
    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const position = () => Math.max(0, track.scrollLeft);
    function update() {
      const max = maxScroll();
      const fits = max <= 2;
      previous.hidden = next.hidden = status.hidden = fits;
      previous.disabled = position() <= 2;
      next.disabled = position() >= max - 2;
      const viewport = track.getBoundingClientRect();
      const visible = cards.filter(card => {
        const r = card.getBoundingClientRect();
        return Math.min(r.right, viewport.right) - Math.max(r.left, viewport.left) > r.width / 2;
      });
      if (visible.length) {
        const first = cards.indexOf(visible[0]) + 1;
        const last = cards.indexOf(visible.at(-1)) + 1;
        status.textContent = `${first === last ? first : `${first}–${last}`} de ${cards.length}`;
      }
    }
    function move(direction) {
      if (!cards.length) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = cards[0].getBoundingClientRect().width + gap;
      const target = Math.min(maxScroll(), Math.max(0, Math.round(position() / step) * step + direction * step));
      track.scrollTo({left: target, behavior: reduceMotion.matches ? 'instant' : 'smooth'});
    }
    previous.addEventListener('click', () => move(-1));
    next.addEventListener('click', () => move(1));
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault(); track.scrollTo({left: event.key === 'Home' ? 0 : maxScroll(), behavior: 'instant'});
      }
    });
    // O toque é nativo do overflow horizontal + Scroll Snap; não bloqueia a rolagem vertical.
    let frame;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(update);
    }, {passive: true});
    new ResizeObserver(update).observe(track);
    update();
  }

  const form = document.querySelector('#interest-form');
  if (form) {
    const phone = form.elements.whatsapp;
    const result = form.querySelector('.form-result');
    const submit = form.querySelector('[type="submit"]');
    const startedAt = Date.now();
    const originalLabel = submit.textContent;
    let sending = false;
    let submission = null;
    function showMessage(message) {
      result.textContent = message;
      result.hidden = false;
      result.focus({preventScroll:true});
      result.scrollIntoView({block:'nearest', behavior:reduceMotion.matches ? 'instant' : 'smooth'});
    }
    function validatePhone() {
      const value = phone.value.trim();
      // Forma internacional; não presume o DDI pelo país de residência.
      const compact = value.replace(/[\s().-]/g, '');
      phone.setCustomValidity(value && !/^\+[1-9]\d{7,14}$/.test(compact)
        ? 'Informe +, o código do país e o número. Exemplo: +351 912 345 678.' : '');
    }
    phone.addEventListener('input', validatePhone);
    form.addEventListener('input', () => { result.hidden = true; });
    const params = new URLSearchParams(location.search);
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = params.get(key) || '';
      // UTMs permanecem somente na página atual; nenhuma persistência ou envio.
      form.elements.namedItem(key).value = value.replace(/[\u0000-\u001f<>]/g, '').slice(0, 200);
    }
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (sending) return;
      validatePhone();
      if (!form.reportValidity()) return;
      if (form.dataset.mode === 'preview') { showMessage(result.dataset.message); return; }
      if (form.dataset.mode !== 'live') { showMessage(form.dataset.error); return; }
      const data = new FormData(form);
      data.set('consent', form.elements.consent.checked ? 'true' : 'false');
      data.set('consent_at', new Date().toISOString());
      data.set('consent_text', form.elements.consent.closest('.consent').innerText.trim());
      sending = true; submit.disabled = true; submit.textContent = form.dataset.sending;
      form.setAttribute('aria-busy','true'); result.hidden = true;
      try {
        // Envio direto ao Apps Script, no mesmo padrão simples do site-teste-imersao.
        // Em no-cors o navegador não expõe o recibo do Google ao JavaScript.
        await fetch(form.dataset.endpoint, {method:'POST', body:data, mode:'no-cors'});
        showMessage('A solicitação foi encaminhada, mas o Google não permite confirmar automaticamente se a gravação foi concluída. Seus dados foram mantidos no formulário. Se não aparecer na planilha, você poderá tentar novamente.');
      } catch {
        showMessage(form.dataset.error);
      }
      finally {
        sending = false; submit.disabled = false; submit.textContent = originalLabel;
        form.removeAttribute('aria-busy');
      }
    });
    submit.disabled = false;
  }
})();
