/* Projeto Apps Script que escreve na planilha existente. Sem bibliotecas externas. */
var EXPECTED_HEADERS = ['Recebido em','Nome','País de residência','WhatsApp internacional','Objetivo de compra','Consentimento registrado','Origem','Status do atendimento','Último contato','Próximo retorno','Observações'];
var DEFAULT_SPREADSHEET_ID = '16NO-6dfCGy9Zk5fI0Gg4FLYMCCLHoPf8EKkegxXtCnU';
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json_({ok:false,code:'method_not_allowed'}); }
function reject_(code) { var error=new Error(code);error.safeCode=code;throw error; }
function hex_(bytes) { return bytes.map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2);}).join(''); }
function digest_(value) { return hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8)); }
function hmac_(value,secret) { return hex_(Utilities.computeHmacSha256Signature(value,secret,Utilities.Charset.UTF_8)); }
function same_(a,b) { if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;var diff=0;for(var i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0; }
function text_(value,max,required) {
  if(typeof value!=='string'||value.length>max||/[\u0000-\u001f\u007f]/.test(value))reject_('invalid_data');
  var result=value.normalize('NFC').trim().replace(/\s+/g,' ');if(required&&!result)reject_('invalid_data');return result;
}
function safeCell_(value) { return /^[=+\-@]/.test(value)?"'"+value:value; }
function config_() {
  var props=PropertiesService.getScriptProperties();var secret=props.getProperty('LEADS_SHARED_SECRET')||'';
  if(!/^[A-Za-z0-9_-]{43,128}$/.test(secret))reject_('configuration_error');
  return {props:props,secret:secret,spreadsheetId:props.getProperty('SPREADSHEET_ID')||DEFAULT_SPREADSHEET_ID,sheetName:props.getProperty('SHEET_NAME')||'Leads Landing'};
}
function sheet_(config) {
  var spreadsheet=SpreadsheetApp.openById(config.spreadsheetId);var sheet=spreadsheet.getSheetByName(config.sheetName);
  if(!sheet)reject_('sheet_not_found');
  var headers=sheet.getRange(1,1,1,EXPECTED_HEADERS.length).getDisplayValues()[0];var map={};
  headers.forEach(function(header,index){var key=String(header).trim();if(map[key]!==undefined)reject_('headers_mismatch');map[key]=index;});
  EXPECTED_HEADERS.forEach(function(header){if(map[header]===undefined)reject_('headers_mismatch');});
  return {sheet:sheet,map:map};
}
// Executar para autorizar e verificar acesso. Não escreve nem cria planilhas.
function verificarConfiguracao() {
  var state=sheet_(config_());console.log('Configuração e cabeçalhos conferidos. Nenhuma linha foi gravada.');
  return {ok:true,sheet:state.sheet.getName(),headers:EXPECTED_HEADERS.slice()};
}
function verifyLead_(lead) {
  if(!lead||typeof lead!=='object'||Array.isArray(lead))reject_('invalid_data');
  lead.name=text_(lead.name,100,true);if(lead.name.length<2)reject_('invalid_data');
  lead.country=text_(lead.country,80,true);lead.objective=text_(lead.objective,80,true);lead.whatsapp=text_(lead.whatsapp,16,true);
  if(!/^\+[1-9]\d{7,14}$/.test(lead.whatsapp)||lead.consent!==true)reject_('invalid_data');
  if(['Moradia','Férias','Investimento','Ainda estou avaliando'].indexOf(lead.objective)===-1)reject_('invalid_data');
  lead.consent_version=text_(lead.consent_version,64,true);lead.consent_text=text_(lead.consent_text,1200,true);
  if(!/^\d{4}-\d\d-\d\dT/.test(lead.consent_at||'')||!isFinite(new Date(lead.consent_at).getTime()))reject_('invalid_data');
  lead.investment=text_(lead.investment,100,false);lead.interest=text_(lead.interest,100,false);
  if(!/^[0-9a-f]{64}$/.test(lead.rate_key||''))reject_('invalid_data');
  if(!lead.utm||typeof lead.utm!=='object')reject_('invalid_data');
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(key){lead.utm[key]=text_(lead.utm[key],200,false);});
  return lead;
}
function fingerprint_(lead) {
  // Exclui horário e IP: uma retentativa do mesmo preenchimento tem o mesmo hash.
  return digest_(JSON.stringify([lead.name,lead.country,lead.whatsapp,lead.objective,lead.consent_version,lead.investment,lead.interest,lead.utm]));
}
function doPost(e) {
  var lock;
  try {
    var config=config_();if(config.props.getProperty('LEADS_ENABLED')!=='true')reject_('integration_not_enabled');
    var raw=e&&e.postData&&e.postData.contents;if(typeof raw!=='string'||raw.length>16384)reject_('invalid_data');
    var message;try{message=JSON.parse(raw);}catch(ignore){reject_('invalid_data');}
    if(message.version!==1||!Number.isSafeInteger(message.timestamp)||Math.abs(Date.now()-message.timestamp)>300000||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(message.request_id||'')||typeof message.payload!=='string'||message.payload.length>10000)reject_('invalid_signature');
    var expected=hmac_(message.version+'\n'+message.timestamp+'\n'+message.request_id+'\n'+message.payload,config.secret);
    if(!same_(expected,message.signature))reject_('invalid_signature');
    var lead;try{lead=verifyLead_(JSON.parse(message.payload));}catch(error){reject_('invalid_data');}
    var fingerprint=fingerprint_(lead);
    lock=LockService.getScriptLock();if(!lock.tryLock(10000))reject_('busy');
    var state=sheet_(config);var sheet=state.sheet;var map=state.map;var now=Date.now();var lastRow=sheet.getLastRow();
    // Notas e dados da aba fornecem deduplicação sem novas colunas ou abas.
    // Janela de 2.000 registros recentes, para o fluxo inicial da landing.
    if(lastRow>=2){
      var first=Math.max(2,lastRow-1999);var count=lastRow-first+1;
      var rows=sheet.getRange(first,1,count,EXPECTED_HEADERS.length).getValues();
      var notes=sheet.getRange(first,map['Recebido em']+1,count,1).getNotes();
      for(var i=rows.length-1;i>=0;i--){
        var row=rows[i];var received=row[map['Recebido em']];
        if(!(received instanceof Date)||!isFinite(received.getTime())||!row[map['Nome']]||row[map['Origem']]!=='Landing Pri Chioquetta')continue;
        var meta;try{meta=JSON.parse(notes[i][0]||'{}');}catch(ignore){meta={};}
        if(meta.request_id===message.request_id){
          if(meta.fingerprint!==fingerprint)reject_('idempotency_conflict');
          return json_({ok:true,saved:true,request_id:message.request_id,duplicate:true});
        }
        if(String(row[map['WhatsApp internacional']]).replace(/^'/,'')===lead.whatsapp&&now-received.getTime()>=0&&now-received.getTime()<600000){
          if(meta.fingerprint===fingerprint)return json_({ok:true,saved:true,request_id:message.request_id,duplicate:true});
          reject_('rate_limited');
        }
      }
    }
    // Limite básico por IP pseudonimizado, sob lock. Cache é best-effort.
    var cache=CacheService.getScriptCache();var rateKey='pri-rate:'+lead.rate_key;
    var attempts=Number(cache.get(rateKey)||0);if(attempts>=5)reject_('rate_limited');cache.put(rateKey,String(attempts+1),600);
    var output=EXPECTED_HEADERS.map(function(){return '';});
    output[map['Recebido em']]=new Date(now);output[map['Nome']]=safeCell_(lead.name);output[map['País de residência']]=safeCell_(lead.country);
    output[map['WhatsApp internacional']]=safeCell_(lead.whatsapp);output[map['Objetivo de compra']]=safeCell_(lead.objective);
    output[map['Consentimento registrado']]='Sim — '+lead.consent_at+' — '+lead.consent_version;
    output[map['Origem']]='Landing Pri Chioquetta';output[map['Status do atendimento']]='Novo';
    // Último contato, Próximo retorno e Observações permanecem vazios.
    var target=lastRow+1;if(target>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),1);
    var metadata={request_id:message.request_id,fingerprint:fingerprint,consent_text:lead.consent_text,consent_at:lead.consent_at,consent_version:lead.consent_version,investment:lead.investment,interest:lead.interest,utm:lead.utm};
    // Nota antes dos valores: falha anterior à escrita não produz recibo de sucesso.
    sheet.getRange(target,map['Recebido em']+1).setNote(JSON.stringify(metadata));
    sheet.getRange(target,1,1,EXPECTED_HEADERS.length).setValues([output]);SpreadsheetApp.flush();
    return json_({ok:true,saved:true,request_id:message.request_id});
  } catch(error) {
    // ContentService pode responder HTTP 200 mesmo em erro. Conferir ok E saved.
    return json_({ok:false,code:error.safeCode||'write_failed'});
  } finally {if(lock&&lock.hasLock())lock.releaseLock();}
}
