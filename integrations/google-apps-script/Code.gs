var SHEET_ID = '16NO-6dfCGy9Zk5fI0Gg4FLYMCCLHoPf8EKkegxXtCnU';
var SHEET_NAME = 'Leads Landing';

function doGet() {
  return ContentService.createTextOutput('ok');
}

function doPost(e) {
  try {
    var p = (e && e.parameter) || {};
    if (p.website) return ContentService.createTextOutput('ok');
    if (!p.name || !p.whatsapp || p.consent !== 'true') throw new Error('dados incompletos');

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('aba Leads Landing não encontrada');

    var now = new Date();
    var row = [
      now,
      t(p.name),
      t(p.country),
      t(p.whatsapp),
      t(p.objective),
      true,
      'Landing Pri Chioquetta',
      'Novo',
      '',
      '',
      ''
    ];

    sheet.appendRow(row);
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1).setNote(JSON.stringify({
      consent_at: t(p.consent_at),
      consent_version: t(p.consent_version),
      consent_text: t(p.consent_text),
      investment: t(p.investment),
      interest: t(p.interest),
      utm_source: t(p.utm_source),
      utm_medium: t(p.utm_medium),
      utm_campaign: t(p.utm_campaign),
      utm_content: t(p.utm_content),
      utm_term: t(p.utm_term)
    }));

    return ContentService.createTextOutput('ok');
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return ContentService.createTextOutput('erro: ' + String(err && err.message || err));
  }
}

function t(v) {
  v = String(v || '').trim().slice(0, 300);
  return /^[=+\\-@]/.test(v) ? "'" + v : v;
}

function teste() {
  return doPost({parameter: {
    name: 'Teste integração Apps Script',
    country: 'Portugal',
    whatsapp: '+351911111111',
    objective: 'Moradia',
    consent: 'true',
    consent_at: new Date().toISOString(),
    consent_version: 'teste-manual',
    consent_text: 'Teste técnico autorizado'
  }});
}
