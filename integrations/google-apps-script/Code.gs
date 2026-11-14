/* Recebe o formulário diretamente do navegador e grava na planilha STC existente. */
var EXPECTED_HEADERS = ['Recebido em','Nome','País de residência','WhatsApp internacional','Objetivo de compra','Consentimento registrado','Origem','Status do atendimento','Último contato','Próximo retorno','Observações'];
var DEFAULT_SPREADSHEET_ID = '16NO-6dfCGy9Zk5fI0Gg4FLYMCCLHoPf8EKkegxXtCnU';
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function doGet() { return json_({ok:true,service:'Pri Chioquetta Leads'}); }
function clean_(value,max,required) {
  var s=String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ');
  if(s.length>max || (required&&!s)) throw new Error('invalid_data');
  return s;
}
function safe_(value) { return /^[=+\-@]/.test(value) ? "'"+value : value; }
function doPost(e) {
  var lock;
  try {
    var p=(e&&e.parameter)||{};
    var name=clean_(p.name,100,true), country=clean_(p.country,80,true);
    var whatsapp=clean_(p.whatsapp,20,true).replace(/[\s().-]/g,'');
    var objective=clean_(p.objective,80,true);
    if(name.length<2 || !/^\+[1-9]\d{7,14}$/.test(whatsapp) || p.consent!=='true') throw new Error('invalid_data');
    if(['Moradia','Férias','Investimento','Ainda estou avaliando'].indexOf(objective)<0) throw new Error('invalid_data');
    var props=PropertiesService.getScriptProperties();
    var ss=SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID')||DEFAULT_SPREADSHEET_ID);
    var sheet=ss.getSheetByName(props.getProperty('SHEET_NAME')||'Leads Landing');
    if(!sheet) throw new Error('sheet_not_found');
    var headers=sheet.getRange(1,1,1,EXPECTED_HEADERS.length).getDisplayValues()[0], map={};
    headers.forEach(function(h,i){h=String(h).trim();if(map[h]!==undefined)throw new Error('headers_mismatch');map[h]=i;});
    EXPECTED_HEADERS.forEach(function(h){if(map[h]===undefined)throw new Error('headers_mismatch');});
    lock=LockService.getScriptLock(); if(!lock.tryLock(10000)) throw new Error('busy');
    var now=new Date(), last=sheet.getLastRow();
    if(last>=2) {
      var first=Math.max(2,last-199), rows=sheet.getRange(first,1,last-first+1,EXPECTED_HEADERS.length).getValues();
      for(var i=rows.length-1;i>=0;i--) {
        var d=rows[i][map['Recebido em']];
        if(d instanceof Date && now-d>=0 && now-d<600000 && String(rows[i][map['WhatsApp internacional']]).replace(/^'/,'')===whatsapp)
          return json_({ok:true,saved:true,duplicate:true});
      }
    }
    var row=EXPECTED_HEADERS.map(function(){return '';});
    row[map['Recebido em']]=now; row[map['Nome']]=safe_(name);
    row[map['País de residência']]=safe_(country); row[map['WhatsApp internacional']]=safe_(whatsapp);
    row[map['Objetivo de compra']]=safe_(objective);
    row[map['Consentimento registrado']]='Sim — '+now.toISOString()+' — '+clean_(p.consent_version||'landing-pri-2026-11-14',64,true);
    row[map['Origem']]='Landing Pri Chioquetta'; row[map['Status do atendimento']]='Novo';
    var target=last+1; if(target>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),1);
    var metadata={consent_text:clean_(p.consent_text||'Aceite registrado no formulário',1200,true),investment:clean_(p.investment,100,false),interest:clean_(p.interest,100,false),utm_source:clean_(p.utm_source,200,false),utm_medium:clean_(p.utm_medium,200,false),utm_campaign:clean_(p.utm_campaign,200,false),utm_content:clean_(p.utm_content,200,false),utm_term:clean_(p.utm_term,200,false)};
    sheet.getRange(target,map['Recebido em']+1).setNote(JSON.stringify(metadata));
    sheet.getRange(target,1,1,EXPECTED_HEADERS.length).setValues([row]); SpreadsheetApp.flush();
    return json_({ok:true,saved:true});
  } catch(err) { return json_({ok:false,code:String(err&&err.message||'write_failed').slice(0,60)}); }
  finally { if(lock&&lock.hasLock())lock.releaseLock(); }
}
