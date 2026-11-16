// Carrossel e formulário. A URL pública do Apps Script é configurada no HTML gerado.
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
    function buildWhatsappUrl() {
      const contactLink = document.querySelector('.footer-whatsapp');
      if (!contactLink) return null;
      const phoneNumber = new URL(contactLink.href).pathname.replace(/\D/g, '');
      if (!/^[1-9]\d{7,14}$/.test(phoneNumber)) return null;

      const details = [
        'Olá, Pri! Acabei de enviar meu interesse pela sua página.',
        `Nome: ${form.elements.name.value.trim()}`,
        `País: ${form.elements.country.value}`,
        `Objetivo: ${form.elements.objective.value}`
      ];
      const interest = form.elements.interest?.value.trim();
      const investment = form.elements.investment?.value.trim();
      if (interest) details.push(`Interesse: ${interest}`);
      if (investment) details.push(`Faixa de investimento: ${investment}`);
      details.push('Podemos conversar sobre as oportunidades em Itapema?');

      return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(details.join('\n'))}`;
    }
    function showSuccess(message) {
      showMessage(message);
      const href = buildWhatsappUrl();
      if (!href) return;

      const link = document.createElement('a');
      link.className = 'form-whatsapp-cta';
      link.style.whiteSpace = 'nowrap';
      link.style.width = 'max-content';
      link.style.maxWidth = '100%';
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      const whatsappIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      whatsappIcon.setAttribute('class', 'form-whatsapp-icon');
      whatsappIcon.setAttribute('viewBox', '0 0 24 24');
      whatsappIcon.setAttribute('width', '20');
      whatsappIcon.setAttribute('height', '20');
      whatsappIcon.style.display = 'block';
      whatsappIcon.style.width = '20px';
      whatsappIcon.style.height = '20px';
      whatsappIcon.style.flex = '0 0 20px';
      whatsappIcon.setAttribute('fill', 'none');
      whatsappIcon.setAttribute('stroke', 'currentColor');
      whatsappIcon.setAttribute('stroke-width', '1.8');
      whatsappIcon.setAttribute('stroke-linecap', 'round');
      whatsappIcon.setAttribute('stroke-linejoin', 'round');
      whatsappIcon.setAttribute('aria-hidden', 'true');
      whatsappIcon.setAttribute('focusable', 'false');

      const bubblePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      bubblePath.setAttribute('d', 'M20 11.5a8.5 8.5 0 0 1-12.8 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 20 11.5Z');
      const phonePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      phonePath.setAttribute('d', 'M8.6 8.2c.2-.4.4-.4.7-.4h.6c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.6.7c-.2.2-.2.4-.1.6.6 1.1 1.5 2 2.6 2.6.2.1.4.1.6-.1l.7-.6c.2-.2.4-.2.7-.1l1.8.8c.3.1.4.3.4.5v.6c0 .3 0 .5-.4.7-.4.2-1.4.6-2.6.3-1.2-.3-2.7-1.1-4.1-2.5-1.4-1.4-2.2-2.9-2.5-4.1-.3-1.2.1-2.2.3-2.6z');
      whatsappIcon.append(bubblePath, phonePath);

      const buttonLabel = document.createElement('span');
      buttonLabel.textContent = 'Conversar com a Pri agora';
      buttonLabel.style.whiteSpace = 'nowrap';
      link.append(whatsappIcon, buttonLabel);

      const buttonWrap = document.createElement('div');
      buttonWrap.className = 'form-whatsapp-cta-wrap';
      buttonWrap.append(link);
      result.append(buttonWrap);
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
        await fetch(form.dataset.endpoint, {method:'POST', body:new URLSearchParams(data), mode:'no-cors'});
        showSuccess(form.dataset.success);
        // Mede formulário válido enviado; no-cors não confirma a gravação no Sheets.
        // O rastreamento é independente do atendimento e não recebe os campos do lead.
        document.dispatchEvent(new CustomEvent('pri:interest-submitted'));
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
