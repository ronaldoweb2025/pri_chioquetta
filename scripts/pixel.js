// Pixel da Meta: carregado apenas após a escolha de cookies de publicidade.
(() => {
  const pixelId = '2379760082766894';
  const key = 'pri-marketing-consent-v1';
  const banner = document.querySelector('#marketing-consent');
  if (!banner) return;
  let choice = null;
  let initialized = false;
  try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Date.now() - saved.at < 180 * 86400000) choice = saved.value; } catch {}
  function enable() {
    if (initialized) { window.fbq('consent', 'grant'); return; }
    initialized = true;
    !function(f,b,e,v,n,t,s) {
      if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
      s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
    }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('consent', 'grant');
    // Impede detecção automática de campos e eventos do formulário.
    window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq('init', pixelId);
    window.fbq('trackSingle', pixelId, 'PageView');
  }
  function save(value) {
    choice = value;
    try { localStorage.setItem(key, JSON.stringify({value, at: Date.now()})); } catch {}
    banner.hidden = true;
    if (value === 'accepted') enable();
    else if (initialized) window.fbq('consent', 'revoke');
  }
  banner.querySelector('[data-marketing-accept]').addEventListener('click', () => save('accepted'));
  banner.querySelector('[data-marketing-reject]').addEventListener('click', () => save('rejected'));
  document.querySelector('[data-marketing-preferences]').addEventListener('click', () => {
    banner.hidden = false;
    banner.querySelector('[data-marketing-reject]').focus();
  });
  banner.hidden = choice === 'accepted' || choice === 'rejected';
  if (choice === 'accepted') enable();
})();
