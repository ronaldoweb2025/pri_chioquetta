// Reserva da rota Cloudflare Pages Functions. Não lê, grava ou encaminha dados.
// Implementar somente depois de aprovar docs/INTEGRACAO-GOOGLE-SHEETS.md.
export function onRequest({request}) {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ok:false,code:'method_not_allowed'}), {status:405,headers:{...headers,Allow:'POST'}});
  }
  return new Response(JSON.stringify({ok:false,code:'integration_not_enabled',message:'O envio ainda não está disponível. Nenhum lead foi registrado.'}), {status:503,headers});
}
