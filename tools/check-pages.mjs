// Auditoria de build limpo + servidor local Wrangler já iniciado. Sem deploy.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=new URL(process.argv[2]||'http://127.0.0.1:8788/');
assert.ok(['127.0.0.1','localhost','[::1]'].includes(base.hostname),'Teste restrito ao servidor local.');
const temporary=await fs.mkdtemp(path.join(os.tmpdir(),'pri-pages-audit-'));
const report={checkedAt:new Date().toISOString(),url:base.href,checks:[],assets:[]};
try{
  for(const entry of ['package.json','config.js','templates','styles','scripts','assets','_headers']) {
    await fs.cp(path.join(root,entry),path.join(temporary,entry),{recursive:true});
  }
  await fs.mkdir(path.join(temporary,'tools'));
  await fs.copyFile(path.join(root,'tools/build.mjs'),path.join(temporary,'tools/build.mjs'));
  execFileSync(process.execPath,[path.join(temporary,'tools/build.mjs')],{cwd:temporary,windowsHide:true});
  const clean=path.join(temporary,'dist');
  const html=await fs.readFile(path.join(clean,'index.html'),'utf8');
  const currentHtml=await fs.readFile(path.join(root,'dist/index.html'),'utf8');
  assert.equal(html,currentHtml,'O build limpo deve reproduzir o HTML atual.');
  assert.ok(!html.includes('{{'));
  const route=JSON.parse(await fs.readFile(path.join(clean,'_routes.json'),'utf8'));
  assert.equal(route.version,1);assert.deepEqual(route.include,['/api/*']);
  await fs.access(path.join(root,'functions/api/leads.js'));
  for(const privateEntry of ['functions','node_modules','config.js','.dev.vars','README.md']) {
    await assert.rejects(fs.access(path.join(clean,privateEntry)));
  }
  report.checks.push('Build em diretório temporário vazio reproduziu dist/index.html.','Functions na raiz; dist sem código privado, node_modules ou arquivos de configuração.','Rotas de Functions restritas a /api/*.');
  const localResources=new Set([...html.matchAll(/(?:assets|styles|scripts)\/[a-z0-9/_.-]+\.(?:webp|jpg|svg|css|js)/gi)].map(m=>m[0]));
  for(const resource of localResources){
    await fs.access(path.join(clean,resource));
    const response=await fetch(new URL(resource,base));
    assert.equal(response.status,200,resource);
    const type=response.headers.get('content-type')||'';
    const expected=resource.endsWith('.webp')?'image/webp':resource.endsWith('.jpg')?'image/jpeg':resource.endsWith('.svg')?'image/svg+xml':resource.endsWith('.css')?'text/css':'javascript';
    assert.ok(type.includes(expected),`${resource}: ${type}`);
    assert.ok((await response.arrayBuffer()).byteLength>0);
    report.assets.push({path:resource,status:200,contentType:type});
  }
  const page=await fetch(base);assert.equal(page.status,200);
  const served=await page.text();assert.equal(served,currentHtml);
  const policy=page.headers.get('content-security-policy')||'';
  assert.ok(policy.includes("connect-src 'self'")&&policy.includes("form-action 'none'"));
  assert.equal(page.headers.get('x-content-type-options'),'nosniff');
  report.checks.push(`${localResources.size} recursos públicos referenciados validados em disco e por HTTP no Wrangler.`,'CSP e X-Content-Type-Options aplicados no servidor Pages local.');
  const post=await fetch(new URL('/api/leads',base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({probe:'compatibility-check'})});
  assert.equal(post.status,503);assert.equal(post.headers.get('cache-control'),'no-store');
  const postBody=await post.json();assert.equal(postBody.ok,false);assert.equal(postBody.code,'integration_not_enabled');
  const get=await fetch(new URL('/api/leads',base));assert.equal(get.status,405);assert.equal(get.headers.get('allow'),'POST');
  assert.ok(served.includes('data-mode="preview"')&&served.includes('Nenhum dado foi enviado ou armazenado'));
  report.api={getStatus:get.status,postStatus:post.status,postBody};
  report.checks.push('Function executada pelo workerd: GET 405, POST 503, ok:false e integração desativada.','Formulário compilado permanece em modo preview e não afirma recebimento de lead.');
  report.result='aprovado';
  await fs.mkdir(path.join(root,'validacao'),{recursive:true});
  await fs.writeFile(path.join(root,'validacao/cloudflare-compatibilidade.json'),JSON.stringify(report,null,2));
  console.log(`Cloudflare local aprovado: build limpo, ${localResources.size} recursos, headers e Function GET 405 / POST 503.`);
}finally{
  // Apagar somente o diretório temporário criado por esta auditoria, nunca dist ou o projeto.
  const resolved=path.resolve(temporary);
  if(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('pri-pages-audit-')&&resolved!==root){
    await fs.rm(resolved,{recursive:true,force:true});
  }
}
