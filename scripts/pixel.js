// Meta e Google Analytics: carregados apenas após a autorização de cookies.
(() => {
  const pixelId = '2379760082766894';
  const key = 'pri-marketing-consent-v2';
  const measurementId = 'G-LWXNKQVCG3';
  let analyticsInitialized = false;
  function enableAnalytics() {
    window['ga-disable-' + measurementId] = false;
    if (analyticsInitialized) return;
    analyticsInitialized = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {allow_google_signals: false, allow_ad_personalization_signals: false});
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(tag);
  }
  const banner = document.querySelector('#marketing-consent');
  if (!banner) return;
  let choice = null;
  let initialized = false;
  let leadTracked = false;
  document.addEventListener('pri:interest-submitted', () => {
    if (choice !== 'accepted' || !initialized || leadTracked) return;
    try {
      window.fbq('trackSingle', pixelId, 'Lead', {content_name: 'Formulario de interesse - Pri Chioquetta'});
      leadTracked = true;
    } catch { /* Uma falha de mensuração não interfere no formulário. */ }
  });
  try { const saved = JSON.parse(localStorage.getItem(key)); if (saved && Date.now() - saved.at < 180 * 86400000) choice = saved.value; } catch {}
  function enable() {
    enableAnalytics();
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
    else {
      window['ga-disable-' + measurementId] = true;
      if (initialized) window.fbq('consent', 'revoke');
    }
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
