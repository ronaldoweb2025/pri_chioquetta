export const MAX_BODY_BYTES = 8192;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class LeadError extends Error {
  constructor(code, status = 422) { super(code); this.code = code; this.status = status; }
}
export async function readLimitedText(stream, max = MAX_BODY_BYTES) {
  if (!stream) throw new LeadError('invalid_data');
  const reader = stream.getReader(); const chunks = []; let length = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > max) { await reader.cancel(); throw new LeadError('payload_too_large', 413); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', {fatal:true}).decode(bytes);
}
export async function hmac(secret, value) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
export function cleanText(value, max, required = true) {
  if (typeof value !== 'string') { if (!required && value == null) return ''; throw new LeadError('invalid_data'); }
  const result = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  if ((required && !result) || result.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw new LeadError('invalid_data');
  return result;
}
export function normalizeLead(body, site, now = Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new LeadError('invalid_data');
  if (typeof body.website !== 'string' || body.website.trim()) throw new LeadError('spam_rejected', 400);
  if (!UUID.test(body.request_id || '')) throw new LeadError('invalid_data');
  if (!Number.isSafeInteger(body.started_at) || now - body.started_at < 1500 || now - body.started_at > 86400000) throw new LeadError('spam_rejected', 400);
  const name = cleanText(body.name, 100); if (name.length < 2) throw new LeadError('invalid_data');
  const country = cleanText(body.country, 80); const objective = cleanText(body.objective, 80);
  if (!site.form.countries.includes(country) || !site.form.objectives.includes(objective)) throw new LeadError('invalid_data');
  const phone = cleanText(body.whatsapp, 30).replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{7,14}$/.test(phone)) throw new LeadError('invalid_data');
  if (body.consent !== true || body.consent_version !== site.form.consentVersion) throw new LeadError('invalid_data');
  const investment = cleanText(body.investment, 100, false); const interest = cleanText(body.interest, 100, false);
  if ((investment && !site.form.investmentRanges.includes(investment)) || (interest && !site.form.interests.includes(interest))) throw new LeadError('invalid_data');
  const utm = {};
  for (const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']) utm[key] = cleanText(body[key], 200, false);
  return {name, country, whatsapp:phone, objective, consent:true, consent_version:site.form.consentVersion, consent_text:site.form.consent, consent_at:new Date(now).toISOString(), investment, interest, utm};
}
export function appsScriptUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' || url.username || url.password || url.port || url.search || url.hash || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)) throw new Error();
    return url.href;
  } catch { throw new LeadError('integration_not_enabled', 503); }
}
export async function postToAppsScript(url, envelope, signal) {
  let currentUrl = url;
  let response = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(envelope), redirect:'manual', signal});
  // ContentService redireciona para googleusercontent. Não reenviar o corpo assinado.
  for (let count = 0; [301,302,303].includes(response.status) && count < 3; count++) {
    const next = new URL(response.headers.get('location') || '', currentUrl);
    if (next.protocol !== 'https:' || next.hostname !== 'script.googleusercontent.com' || next.username || next.password || next.port) throw new LeadError('upstream_failure', 502);
    currentUrl = next.href;
    response = await fetch(currentUrl, {method:'GET', redirect:'manual', signal});
  }
  if (!response.ok || !/application\/json/i.test(response.headers.get('content-type') || '')) throw new LeadError('upstream_failure', 502);
  try { return JSON.parse(await readLimitedText(response.body, 4096)); }
  catch { throw new LeadError('upstream_failure', 502); }
}
