import {test} from 'node:test';
import assert from 'node:assert/strict';
import cryptoNode from 'node:crypto';
import vm from 'node:vm';
import fs from 'node:fs/promises';
import {onRequest} from '../functions/api/leads.js';
import {normalizeLead,hmac,postToAppsScript} from '../lib/server/lead-security.js';
import site from '../config.js';

// Segredo fictício de fixture, sem qualquer relação com um serviço real.
const SECRET='a'.repeat(64);
const ID='11111111-1111-4111-8111-111111111111';
const ENV={LEADS_ENABLED:'true',LEADS_SHARED_SECRET:SECRET,APPS_SCRIPT_URL:'https://script.google.com/macros/s/FAKE_TEST_ONLY/exec'};
const GAS_SOURCE=await fs.readFile(new URL('../integrations/google-apps-script/Code.gs',import.meta.url),'utf8');
function body(overrides={}){
  return {name:'Pessoa Sintética',country:'Portugal',whatsapp:'+351 912 345 678',objective:'Férias',consent:true,consent_version:site.form.consentVersion,investment:'',interest:'',website:'',started_at:Date.now()-5000,request_id:ID,...overrides};
}
function request(value=body(),headers={}){
  return new Request('https://local.test/api/leads',{method:'POST',headers:{Origin:'https://local.test','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10',...headers},body:typeof value==='string'?value:JSON.stringify(value)});
}
function mockGas({headers,failWrite=false,failFlush=false,lockBusy=false}={}){
  const defaultHeaders=['Recebido em','Nome','País de residência','WhatsApp internacional','Objetivo de compra','Consentimento registrado','Origem','Status do atendimento','Último contato','Próximo retorno','Observações'];
  const rows=[headers||defaultHeaders];const notes=new Map();const cache=new Map();const writes=[];let locked=false;let flushes=0;
  const props={LEADS_SHARED_SECRET:SECRET,LEADS_ENABLED:'true',SPREADSHEET_ID:'MOCK_SHEET_ONLY',SHEET_NAME:'Leads Landing'};
  const sheet={
    getName:()=> 'Leads Landing',getLastRow:()=>rows.length,getMaxRows:()=>1000,insertRowsAfter:()=>{},
    getRange(r,c,n=1,m=1){return{
      getDisplayValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>String(rows[r-1+i]?.[c-1+j]??''))),
      getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>rows[r-1+i]?.[c-1+j]??'')),
      getNotes:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>notes.get(`${r+i}:${c+j}`)||'')),
      setNote(value){assert.equal(locked,true);notes.set(`${r}:${c}`,value);},
      setValues(values){
        assert.equal(locked,true);if(failWrite)throw Error('Synthetic write failure');
        writes.push(...values);
        values.forEach((row,i)=>{rows[r-1+i]=row.map(value=>typeof value==='string'&&value.startsWith("'")?value.slice(1):value);});
      }
    };}
  };
  const sandbox={Date,Number,console:{log:()=>{}},
    PropertiesService:{getScriptProperties:()=>({getProperty:key=>props[key]??null})},
    LockService:{getScriptLock:()=>({tryLock:()=>{if(lockBusy)return false;locked=true;return true;},hasLock:()=>locked,releaseLock:()=>{locked=false;}})},
    CacheService:{getScriptCache:()=>({get:key=>cache.get(key)??null,put:(key,value)=>cache.set(key,value)})},
    SpreadsheetApp:{openById:id=>{assert.equal(id,'MOCK_SHEET_ONLY');return{getSheetByName:name=>name==='Leads Landing'?sheet:null};},flush:()=>{flushes++;if(failFlush)throw Error('Synthetic flush failure');}},
    ContentService:{MimeType:{JSON:'application/json'},createTextOutput:value=>({setMimeType(){return this;},getContent:()=>value})},
    Utilities:{Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,value)=>[...cryptoNode.createHash('sha256').update(value).digest()],computeHmacSha256Signature:(value,key)=>[...cryptoNode.createHmac('sha256',key).update(value).digest()]}
  };
  vm.createContext(sandbox);vm.runInContext(GAS_SOURCE,sandbox,{timeout:1000});
  return {rows,notes,props,writes,get locked(){return locked;},get flushes(){return flushes;},verify:()=>sandbox.verificarConfiguracao(),post:message=>JSON.parse(sandbox.doPost({postData:{contents:JSON.stringify(message)}}).getContent())};
}
async function envelope(value=body(),overrides={}){
  const lead=normalizeLead(value,site);lead.rate_key='b'.repeat(64);
  const message={version:1,timestamp:Date.now(),request_id:value.request_id,payload:JSON.stringify(lead),...overrides};
  message.signature=await hmac(SECRET,`${message.version}\n${message.timestamp}\n${message.request_id}\n${message.payload}`);
  return message;
}
function replaceFetch(t,fn){const original=globalThis.fetch;globalThis.fetch=fn;t.after(()=>{globalThis.fetch=original;});}

test('Function: permanece desativada sem flag e não faz chamadas externas',async t=>{
  replaceFetch(t,()=>{throw Error('Não deveria chamar Google');});
  assert.equal((await onRequest({request:request()})).status,503);
  assert.equal((await onRequest({request:new Request('https://local.test/api/leads')})).status,405);
});
test('Function: valida origem, MIME, JSON, tamanho, consentimento, telefone e honeypot',async t=>{
  replaceFetch(t,()=>{throw Error('Não deveria chamar Google');});
  for(const [req,status] of [
    [request(body(),{Origin:'https://outro.test'}),403],
    [request(body(),{'Content-Type':'text/plain'}),415],
    [request('{'),422],
    [request('x'.repeat(9000)),413],
    [request(body({consent:false})),422],
    [request(body({whatsapp:'912345678'})),422],
    [request(body({website:'bot.test'})),400],
    [request(body({started_at:Date.now()+86400000})),400],
    [request(body({objective:'Objetivo inválido'})),422],
    [request(body({request_id:'not-a-uuid'})),422]
  ])assert.equal((await onRequest({request:req,env:ENV})).status,status);
});
test('Function + Apps Script: gravação simulada respeita as 11 colunas e confirma só após flush',async t=>{
  const gas=mockGas();
  replaceFetch(t,async(url,options)=>{
    assert.equal(url,ENV.APPS_SCRIPT_URL);
    const message=JSON.parse(options.body);assert.ok(!options.body.includes(SECRET));
    assert.ok(!message.payload.includes('192.0.2.10'));
    const result=gas.post(message);return Response.json(result);
  });
  const response=await onRequest({request:request(),env:ENV});
  assert.equal(response.status,200);assert.equal((await response.json()).saved,true);
  assert.equal(gas.rows.length,2);assert.equal(gas.flushes,1);assert.equal(gas.locked,false);
  const row=gas.rows[1];assert.ok(row[0] instanceof Date);assert.equal(row[1],'Pessoa Sintética');assert.equal(row[2],'Portugal');assert.equal(row[3],'+351912345678');assert.equal(row[4],'Férias');assert.ok(row[5].startsWith('Sim — '));assert.equal(row[6],'Landing Pri Chioquetta');assert.equal(row[7],'Novo');assert.deepEqual(Array.from(row.slice(8)),['','','']);
  assert.equal(JSON.parse(gas.notes.get('2:1')).request_id,ID);
});
test('Function: HTTP 200 sem confirmação válida, HTML, falha ou recibo de outro ID nunca viram sucesso',async t=>{
  let current;
  replaceFetch(t,async()=>current);
  for(const response of [Response.json({ok:false,code:'write_failed'}),Response.json({ok:true}),Response.json({ok:true,saved:true,request_id:'outro'}),new Response('<html>login</html>',{headers:{'Content-Type':'text/html'}}),new Response('erro',{status:500})]){
    current=response;assert.equal((await onRequest({request:request(),env:ENV})).status,502);
  }
});
test('Function: erro de rede é amigável e não expõe URL, segredo ou dados',async t=>{
  replaceFetch(t,async()=>{throw Error(SECRET+' private-url');});
  const response=await onRequest({request:request(),env:ENV});assert.equal(response.status,502);const text=await response.text();assert.ok(!text.includes(SECRET)&&!text.includes('private-url'));
});
test('Function: URL de destino não pode ser arbitrária ou /dev',async t=>{
  replaceFetch(t,()=>{throw Error('Não deveria chamar Google');});
  for(const url of ['http://127.0.0.1/private','https://evil.test/macros/s/x/exec','https://script.google.com/macros/s/x/dev','https://script.google.com/macros/s/x/exec?token=bad'])assert.equal((await onRequest({request:request(),env:{...ENV,APPS_SCRIPT_URL:url}})).status,503);
});
test('ContentService: redirecionamento permitido segue GET, sem repassar o corpo',async t=>{
  const calls=[];replaceFetch(t,async(url,options)=>{calls.push({url,...options});return calls.length===1?new Response(null,{status:302,headers:{Location:'https://script.googleusercontent.com/macros/echo?fake=1'}}):Response.json({ok:true});});
  assert.equal((await postToAppsScript(ENV.APPS_SCRIPT_URL,{fake:'synthetic'})).ok,true);assert.equal(calls[1].method,'GET');assert.equal(calls[1].body,undefined);
});
test('ContentService: não segue redirecionamento para outro host',async t=>{
  let calls=0;replaceFetch(t,async()=>{calls++;return new Response(null,{status:302,headers:{Location:'https://evil.test'}});});
  await assert.rejects(postToAppsScript(ENV.APPS_SCRIPT_URL,{}));assert.equal(calls,1);
});
test('Apps Script: autorização de configuração não escreve; flags, assinatura e expiração falham fechadas',async()=>{
  const gas=mockGas();assert.equal(gas.verify().ok,true);assert.equal(gas.rows.length,1);
  const valid=await envelope();gas.props.LEADS_ENABLED='false';assert.equal(gas.post(valid).code,'integration_not_enabled');gas.props.LEADS_ENABLED='true';
  assert.equal(gas.post({...valid,signature:'0'.repeat(64)}).code,'invalid_signature');
  assert.equal(gas.post(await envelope(body(),{timestamp:Date.now()-360000})).code,'invalid_signature');assert.equal(gas.rows.length,1);
});
test('Apps Script: retentativa e telefone repetido não geram linhas duplicadas',async()=>{
  const gas=mockGas();const message=await envelope();assert.equal(gas.post(message).saved,true);assert.equal(gas.post(message).duplicate,true);
  const samePhone=await envelope(body({request_id:cryptoNode.randomUUID()}));assert.equal(gas.post(samePhone).duplicate,true);assert.equal(gas.rows.length,2);
  assert.equal(gas.post(await envelope(body({name:'Nome alterado'}))).code,'idempotency_conflict');
  assert.equal(gas.post(await envelope(body({name:'Outro nome',request_id:cryptoNode.randomUUID()}))).code,'rate_limited');assert.equal(gas.rows.length,2);
});
test('Apps Script: lock ocupado, falha de escrita e de flush não confirmam envio',async()=>{
  const message=await envelope();
  for(const options of [{lockBusy:true},{failWrite:true},{failFlush:true}]){const gas=mockGas(options);assert.equal(gas.post(message).ok,false);assert.equal(gas.locked,false);}
});
test('Apps Script: cabeçalhos incompatíveis não são alterados; ordem diferente é mapeada',async()=>{
  const invalid=mockGas({headers:Array(11).fill('Coluna errada')});assert.equal(invalid.post(await envelope()).code,'headers_mismatch');assert.equal(invalid.rows.length,1);
  const headers=['Observações','Próximo retorno','Último contato','Status do atendimento','Origem','Consentimento registrado','Objetivo de compra','WhatsApp internacional','País de residência','Nome','Recebido em'];
  const reordered=mockGas({headers});assert.equal(reordered.post(await envelope()).ok,true);assert.equal(reordered.rows[1][9],'Pessoa Sintética');assert.equal(reordered.rows[1][0],'');
});
test('Apps Script: fórmulas são neutralizadas e opcionais/UTMs ficam só na nota',async()=>{
  const gas=mockGas();const data=body({name:'=IMPORTXML("fake")',investment:site.form.investmentRanges[0],interest:site.form.interests[0],utm_campaign:'teste_controlado'});
  assert.equal(gas.post(await envelope(data)).ok,true);
  assert.equal(gas.writes[0][1],"'"+data.name);assert.ok(gas.writes[0][3].startsWith("'+"));
  const note=JSON.parse(gas.notes.get('2:1'));assert.equal(note.investment,data.investment);assert.equal(note.utm.utm_campaign,'teste_controlado');assert.equal(gas.rows[1][10],'');
});
test('Apps Script: limite básico permite cinco cadastros distintos por chave e bloqueia o sexto',async()=>{
  const gas=mockGas();
  for(let i=0;i<6;i++){
    const result=gas.post(await envelope(body({request_id:cryptoNode.randomUUID(),whatsapp:'+35191234567'+i})));
    assert.equal(result.ok,i<5);
    if(i===5)assert.equal(result.code,'rate_limited');
  }
  assert.equal(gas.rows.length,6);
});
