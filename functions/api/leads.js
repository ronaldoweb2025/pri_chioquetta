import site from '../../config.js';
import {LeadError, readLimitedText, normalizeLead, appsScriptUrl, postToAppsScript, hmac} from '../../lib/server/lead-security.js';

const HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function reply(status, code, extra = {}) {
  return new Response(JSON.stringify({ok:status === 200, code, ...extra}), {status, headers:{...HEADERS, ...(status === 405 ? {Allow:'POST'} : {}), ...(status === 429 ? {'Retry-After':'600'} : {})}});
}
export async function onRequest({request, env = {}}) {
  if (request.method !== 'POST') return reply(405, 'method_not_allowed');
  if (env.LEADS_ENABLED !== 'true') return reply(503, 'integration_not_enabled');
  try {
    const url = new URL(request.url);
    const allowed = String(env.ALLOWED_ORIGINS || url.origin).split(',').map(s => s.trim()).filter(Boolean);
    if (!allowed.includes(request.headers.get('origin')) || request.headers.get('sec-fetch-site') === 'cross-site') return reply(403, 'origin_not_allowed');
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply(415, 'unsupported_media_type');
    if (Number(request.headers.get('content-length')) > 8192) return reply(413, 'payload_too_large');
    const secret = env.LEADS_SHARED_SECRET;
    if (typeof secret !== 'string' || !/^[A-Za-z0-9_-]{43,128}$/.test(secret)) throw new LeadError('integration_not_enabled', 503);
    const destination = appsScriptUrl(env.APPS_SCRIPT_URL);
    let body;
    try { body = JSON.parse(await readLimitedText(request.body)); }
    catch (error) { if (error instanceof LeadError) throw error; throw new LeadError('invalid_data'); }
    const now = Date.now(); const lead = normalizeLead(body, site, now);
    const requestId = body.request_id.toLowerCase();
    // IP bruto não vai para Google, planilha ou logs.
    lead.rate_key = await hmac(secret, request.headers.get('cf-connecting-ip') || 'local-unknown');
    const envelope = {version:1, timestamp:now, request_id:requestId, payload:JSON.stringify(lead)};
    envelope.signature = await hmac(secret, `${envelope.version}\n${envelope.timestamp}\n${requestId}\n${envelope.payload}`);
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25000);
    let result;
    try { result = await postToAppsScript(destination, envelope, controller.signal); }
    catch (error) { if (controller.signal.aborted) throw new LeadError('upstream_timeout', 504); throw error; }
    finally { clearTimeout(timeout); }
    if (result?.ok === true && result.saved === true && result.request_id === requestId) return reply(200, 'saved', {saved:true, request_id:requestId});
    if (result?.code === 'rate_limited') throw new LeadError('rate_limited', 429);
    if (result?.code === 'idempotency_conflict') throw new LeadError('idempotency_conflict', 409);
    throw new LeadError('upstream_failure', 502);
  } catch (error) {
    // Nunca retornar exceções, corpo do lead, URL privada ou credenciais.
    if (error instanceof LeadError) return reply(error.status, error.code);
    return reply(502, 'upstream_failure');
  }
}
