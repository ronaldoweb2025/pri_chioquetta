// Somente interações locais. Sem fetch, armazenamento, Pixel ou integrações ativas.
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
    form.addEventListener('submit', event => {
      event.preventDefault();
      validatePhone();
      if (!form.reportValidity()) return;
      result.textContent = result.dataset.message;
      result.hidden = false;
      result.focus({preventScroll: true});
      result.scrollIntoView({block: 'nearest', behavior: reduceMotion.matches ? 'instant' : 'smooth'});
      // Nenhuma mensagem de lead recebido: a integração depende de aprovação.
    });
    form.querySelector('[type="submit"]').disabled = false;
  }
})();
