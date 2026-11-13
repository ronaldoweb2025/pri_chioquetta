// QA da configuração: 1, 2 e 7 slides. Modificações temporárias só no checkout local.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawn,execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import config from '../config.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'config.js');const original=await fs.readFile(file,'utf8');
const server=spawn(process.execPath,[path.join(root,'tools/serve.mjs')],{env:{...process.env,PORT:'4181'},windowsHide:true});
let browser;const results=[];
try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  for(const count of [1,2,7]){
    await fs.writeFile(file,'export default '+JSON.stringify({...config,gallery:{...config.gallery,items:config.gallery.items.slice(0,count)}},null,2)+';\n');
    execFileSync(process.execPath,[path.join(root,'tools/build.mjs')],{cwd:root,windowsHide:true});
    for(const width of [375,1440]){
      const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
      await page.goto(`http://127.0.0.1:4181/?count=${count}`,{waitUntil:'networkidle'});
      assert.equal(await page.locator('.gallery-card').count(),count);
      const fits=count<=(width<768?1:2);
      assert.equal(await page.locator('.carousel-next').isHidden(),fits);
      if(!fits){
        await page.locator('.gallery-track').focus();await page.keyboard.press('End');
        await page.waitForTimeout(100);
        assert.equal(await page.locator('.carousel-next').isDisabled(),true);
        assert.ok((await page.locator('.gallery-status').innerText()).endsWith(`de ${count}`));
      }
      results.push({count,width,result:'aprovado'});await page.close();
    }
  }
  await fs.writeFile(path.join(root,'validacao/quantidades-galeria.json'),JSON.stringify(results,null,2));
  console.log('Configuração com 1, 2 e 7 slides aprovada em 375 e 1440 px.');
}finally{
  await fs.writeFile(file,original);
  execFileSync(process.execPath,[path.join(root,'tools/build.mjs')],{cwd:root,windowsHide:true});
  await browser?.close();server.kill();
}
