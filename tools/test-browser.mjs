// Ferramenta de QA, não é dependência do site. Usa Playwright já disponível no ambiente.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/leads.js';
import config from '../config.js';
const require = createRequire(import.meta.url);
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'validacao');
await fs.mkdir(out, {recursive:true});
const port = '4177';
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [path.join(root,'tools/serve.mjs')], {cwd:root,env:{...process.env,PORT:port},windowsHide:true});
let browser;
const results = {date:'2026-11-13',engine:'Microsoft Edge (Chromium), headless',viewports:[],checks:[],limitations:['Toque emulado via Chromium/CDP; não é teste em aparelho físico.','Desempenho medido em servidor local, sem simulação de rede móvel e sem Lighthouse.','Pages Functions exercitada como módulo; deploy Cloudflare não realizado.']};
try {
  await new Promise((resolve,reject) => {
    const timer=setTimeout(()=>reject(new Error('Servidor de QA não iniciou.')),10000);
    server.stdout.once('data',()=>{clearTimeout(timer);resolve();});
    server.once('error',reject);
  });
  browser = await playwright.chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  for (const width of [320,375,430,768,1280,1440]) {
    const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,isMobile:width<768,hasTouch:width<768});
    const page=await context.newPage();
    const errors=[];const writes=[];const failed=[];const external=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('request',req=>{
      if(!['GET','HEAD'].includes(req.method())) writes.push(req.method()+' '+req.url());
      if(!req.url().startsWith(base))external.push(req.url());
    });
    page.on('response',res=>{if(res.status()>=400)failed.push(`${res.status()} ${res.url()}`);});
    const started=Date.now();
    const response=await page.goto(`${base}/?utm_source=meta&utm_medium=paid_social&utm_campaign=itapema_teste`,{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    const initial=await page.evaluate(()=>({
      documentWidth:document.documentElement.scrollWidth, viewportWidth:innerWidth,
      heroSrc:document.querySelector('.hero-image img').currentSrc,
      heroTop:document.querySelector('.hero-image').getBoundingClientRect().top,
      heroCopyBottom:document.querySelector('.hero-copy').getBoundingClientRect().bottom,
      brokerTop:document.querySelector('.broker').getBoundingClientRect().top,
      heroHeight:document.querySelector('.hero').getBoundingClientRect().height,
      creci:document.querySelector('.broker-credentials').textContent,
      imageFit:getComputedStyle(document.querySelector('.hero-image img')).objectFit,
      bytes:performance.getEntriesByType('resource').reduce((sum,r)=>sum+r.encodedBodySize,0),
      domContentLoadedMs:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd
    }));
    assert.ok(initial.documentWidth<=width+1,`Overflow inicial em ${width}`);
    assert.ok(initial.heroSrc.includes('itapema-santa-catarina')&&initial.heroSrc.endsWith('.webp'));
    assert.equal(initial.imageFit,'cover');
    assert.ok(initial.creci.includes('Priscila Charlise Chioquetta')&&initial.creci.includes('78854F'));
    if(width<768){
      assert.equal(await page.locator('.hero-image').isVisible(),true);
      const panorama=await page.locator('.hero-image').boundingBox();
      assert.ok(panorama.height>=180);
      assert.ok(Math.abs(panorama.y+panorama.height-initial.brokerTop)<=1);
      assert.equal(await page.locator('.hero-note').evaluate(el=>getComputedStyle(el).textAlign),'center');
      const cta=await page.locator('.hero .button').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,available:el.parentElement.clientWidth-parseFloat(getComputedStyle(el.parentElement).paddingLeft)-parseFloat(getComputedStyle(el.parentElement).paddingRight)}));
      assert.ok(cta.width<cta.available);assert.ok(cta.height>=46);
    }
    assert.equal(await page.locator('.brand-subtitle').innerText(),'CORRETORA DE IMÓVEIS EM ITAPEMA');
    assert.equal(await page.locator('.brand-creci').innerText(),'CRECI-SC 78854F');
    assert.equal(await page.locator('.contact-panorama').count(),0);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('meta[property="og:image"]').count(),1);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex, nofollow');
    assert.equal(await page.locator('.hero .button').textContent(),'Quero conhecer as oportunidades');
    assert.equal(await page.locator('[name="utm_campaign"]').inputValue(),'itapema_teste');
    await page.screenshot({path:path.join(out,`hero-${width}.png`)});
    // Despertar imagens lazy antes das capturas completas e conferir sua decodificação.
    await page.evaluate(async()=>{
      for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,45));}
      const renderedImages=[...document.images].filter(im=>im.getClientRects().length>0);
      // No QA, conferir também os slides fora da área visível, sem esperar um gesto manual.
      renderedImages.forEach(im=>{im.loading='eager';});
      await Promise.all(renderedImages.map(im=>im.decode()));
      window.scrollTo({top:0,behavior:'instant'});
    });
    await page.screenshot({path:path.join(out,`pagina-${width}.png`),fullPage:true});
    const broken=await page.evaluate(()=>[...document.images].filter(im=>im.getClientRects().length>0&&(!im.complete||!im.naturalWidth)).map(im=>im.src));
    assert.deepEqual(broken,[]);
    const ratio=await page.locator('.gallery-track').evaluate(el=>el.clientWidth/el.firstElementChild.getBoundingClientRect().width);
    assert.equal(await page.locator('.gallery-card').count(),config.gallery.items.length);
    assert.deepEqual(await page.locator('.gallery-card figcaption h3').allTextContents(),config.gallery.items.map(item=>item.title));
    assert.ok(await page.locator('.gallery-track').evaluate(el=>!el.innerHTML.includes('itapema-santa-catarina')));
    assert.ok(width<768 ? Math.abs(ratio-1)<.02 : ratio>2 && ratio<2.15,`Número de imagens por tela em ${width}: ${ratio}`);
    await page.locator('.gallery-section').scrollIntoViewIfNeeded();
    await page.locator('.gallery-section').screenshot({path:path.join(out,`carrossel-${width}.png`)});
    assert.equal(await page.locator('.carousel-prev').isDisabled(),true);
    let moves=0;
    while(!await page.locator('.carousel-next').isDisabled()&&moves<config.gallery.items.length){
      const before=await page.locator('.gallery-track').evaluate(el=>el.scrollLeft);
      await page.locator('.carousel-next').click();await page.waitForTimeout(550);
      assert.ok(await page.locator('.gallery-track').evaluate(el=>el.scrollLeft)>before);
      moves++;
    }
    assert.equal(await page.locator('.carousel-next').isDisabled(),true);
    assert.ok((await page.locator('.gallery-status').innerText()).endsWith(`de ${config.gallery.items.length}`));
    await page.locator('.gallery-track').focus();await page.keyboard.press('Home');await page.waitForTimeout(100);
    assert.equal(await page.locator('.carousel-prev').isDisabled(),true);
    await page.keyboard.press('ArrowRight');await page.waitForTimeout(700);
    assert.ok(await page.locator('.gallery-track').evaluate(el=>el.scrollLeft)>10);
    await page.keyboard.press('Home');await page.waitForTimeout(100);
    let touch='não aplicável';
    if(width<768){
      const track=page.locator('.gallery-track');await track.scrollIntoViewIfNeeded();
      const r=await track.boundingBox();const x=r.x+r.width*.82;const y=r.y+Math.min(80,r.height/3);
      const session=await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=12;step++){
        await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-(r.width*.68)*step/12,y}]});
        await page.waitForTimeout(16);
      }
      await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await page.waitForTimeout(800);
      assert.ok(await track.evaluate(el=>el.scrollLeft)>20,`Deslize por toque em ${width}`);touch='aprovado (CDP)';
      await session.detach();
    }
    // Formulário: somente dados sintéticos; nenhum registro é enviado.
    await page.locator('#name').fill('Pessoa de teste');
    await page.locator('#country').selectOption('Portugal');
    await page.locator('#objective').selectOption('Férias');
    await page.locator('#whatsapp').fill('912345678');
    assert.equal(await page.locator('#whatsapp').evaluate(el=>el.checkValidity()),false);
    await page.locator('#whatsapp').fill('+351 912 345 678');
    assert.equal(await page.locator('#interest-form').evaluate(el=>el.checkValidity()),false);
    await page.locator('#consent').check();
    assert.equal(await page.locator('#interest-form').evaluate(el=>el.checkValidity()),true);
    await page.locator('.form-submit').click();
    assert.ok((await page.locator('.form-result').textContent()).includes('Nenhum dado foi enviado ou armazenado'));
    await page.locator('.optional-fields summary').click();
    await page.locator('#interest').selectOption('Ainda estou avaliando');
    assert.deepEqual(writes,[]);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
    const end=await page.evaluate(()=>({width:document.documentElement.scrollWidth,cookies:document.cookie,localStorage:localStorage.length,sessionStorage:sessionStorage.length}));
    assert.ok(end.width<=width+1,`Overflow final em ${width}`);assert.equal(end.cookies,'');assert.equal(end.localStorage,0);assert.equal(end.sessionStorage,0);
    results.viewports.push({width,height:1000,result:'aprovado',carouselVisible:width<768?1:2,touch,initialResourceBytes:initial.bytes,domContentLoadedMs:Math.round(initial.domContentLoadedMs),...initial,elapsedMs:Date.now()-started,postRequests:writes.length,externalRequests:external.length});
    await context.close();console.log(`${width}px: aprovado; carrossel, formulário, imagens e overflow.`);
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:900}});
  const page=await nojs.newPage();await page.goto(base);
  assert.equal(await page.locator('h1').textContent(),'Seu próximo capítulo no Brasil pode começar em Itapema.');
  assert.equal(await page.locator('.form-submit').isDisabled(),true);await nojs.close();
  results.checks.push('HTML e conteúdo acessíveis sem JavaScript; submit permanece desabilitado.');
  const reduced=await browser.newContext({reducedMotion:'reduce'});const rp=await reduced.newPage();await rp.goto(base);
  assert.equal(await rp.locator('.gallery-track').evaluate(el=>getComputedStyle(el).scrollBehavior),'auto');await reduced.close();
  results.checks.push('Preferência por movimento reduzido respeitada.');
  for(const method of ['GET','POST']){
    const res=onRequest({request:new Request('https://example.test/api/leads',{method})});
    assert.equal(res.status,method==='POST'?503:405);assert.equal((await res.json()).ok,false);
  }
  results.checks.push('Pages Function: GET 405 e POST 503; nenhum falso sucesso ou envio.');
  await fs.writeFile(path.join(out,'resultados.json'),JSON.stringify(results,null,2));
  console.log('QA concluído. Evidências em validacao/.');
} finally {
  await browser?.close();server.kill();
}
