// Somente servidor local e respostas simuladas. Nenhum envio ao Google.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.FORM_TEST_URL||'http://127.0.0.1:4183/';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname),'Teste limitado ao ambiente local.');
const server=process.env.FORM_TEST_URL?null:spawn(process.execPath,[path.join(root,'tools/serve.mjs')],{cwd:root,env:{...process.env,PORT:'4183'},windowsHide:true});
let browser;const report=[];
try{
  if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  for(const width of [375,1440]){
    const page=await browser.newPage({viewport:{width,height:1000}});const requests=[];const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    let scenario='error';let release;
    await page.route('**/api/leads',async route=>{
      const payload=route.request().postDataJSON();requests.push(payload);
      const json=(status,value)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
      if(scenario==='error')return json(503,{ok:false,code:'integration_not_enabled'});
      if(scenario==='html')return route.fulfill({status:200,contentType:'text/html',body:'<html>login</html>'});
      if(scenario==='unconfirmed')return json(200,{ok:true});
      if(scenario==='rate')return json(429,{ok:false,code:'rate_limited'});
      if(scenario==='success'){
        await new Promise(resolve=>{release=resolve;});
        return json(200,{ok:true,saved:true,request_id:payload.request_id});
      }
      throw Error('Cenário inesperado');
    });
    await page.goto(new URL('?utm_source=teste_local',base).href,{waitUntil:'networkidle'});
    await page.locator('#name').fill('TESTE SINTÉTICO');await page.locator('#country').selectOption('Outro país');
    await page.locator('#whatsapp').fill('+999123456789');await page.locator('#objective').selectOption('Férias');await page.locator('#consent').check();
    await page.locator('.form-submit').click();
    assert.ok((await page.locator('.form-result').innerText()).includes('Nenhum dado foi enviado ou armazenado'));assert.equal(requests.length,0);
    // Modo live somente nesta página de teste; config de entrega permanece preview.
    await page.locator('form').evaluate(form=>{form.dataset.mode='live';});
    for(const value of ['error','html','unconfirmed','rate']){
      scenario=value;await page.locator('.form-submit').click();
      await page.waitForFunction(()=>!document.querySelector('form').hasAttribute('aria-busy'));
      const message=await page.locator('.form-result').innerText();assert.ok(!message.includes('Recebemos seu interesse'));
      assert.equal(await page.locator('#name').inputValue(),'TESTE SINTÉTICO');assert.equal(await page.locator('#whatsapp').inputValue(),'+999123456789');assert.equal(await page.locator('#consent').isChecked(),true);
    }
    assert.equal(new Set(requests.map(r=>r.request_id)).size,1,'Retentativas preservam o request_id');
    assert.ok(requests.every(r=>r.utm_source==='teste_local'&&r.consent===true&&r.website===''));
    scenario='success';const count=requests.length;
    await page.locator('.form-submit').click();
    await page.waitForFunction(()=>document.querySelector('form').hasAttribute('aria-busy'));
    assert.equal(await page.locator('.form-submit').isDisabled(),true);
    await page.locator('form').evaluate(form=>form.requestSubmit());
    await page.waitForTimeout(50);assert.equal(requests.length,count+1,'Clique duplo não envia novamente');
    assert.equal(typeof release,'function');release();
    await page.waitForFunction(()=>!document.querySelector('form').hasAttribute('aria-busy'));
    assert.equal(await page.locator('.form-result').innerText(),'Recebemos seu interesse. A Pri fará contato pelo WhatsApp informado.');
    assert.equal(await page.locator('.form-submit').innerText(),'Quero conhecer as oportunidades');
    assert.deepEqual(errors,[]);
    report.push({width,result:'aprovado',previewPosts:0,failuresPreserveFields:true,htmlAndMissingReceiptRejected:true,retryIdPreserved:true,doubleClickBlocked:true,successRequiresSavedReceipt:true,externalGoogleRequests:0});
    await page.close();
  }
  await fs.writeFile(path.join(root,'validacao/formulario-integracao-browser.json'),JSON.stringify(report,null,2));
  console.log('Formulário 375/1440 px: preview, erros, HTML, recibo, retentativa e clique duplo aprovados com respostas simuladas.');
}finally{await browser?.close();server?.kill();}
