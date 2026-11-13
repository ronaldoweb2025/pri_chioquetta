# Verificação de compatibilidade — Cloudflare Pages

13/11/2026. Teste executado localmente, sem login, push ou deploy.

## Resultado: aprovado para teste local de Pages

- `package.json`: ES modules, build em Node, sem dependências de runtime no frontend. Acrescentado Wrangler **4.161.0** como devDependency exata e `package-lock.json` para instalação reproduzível. Requer Node **22.12.0 ou superior**, conforme o requisito dessa versão do Wrangler; teste executado com Node 24.22.1.
- `tools/build.mjs`: executado também em uma pasta temporária inicialmente vazia. Criou `dist/index.html`, assets, CSS, JS, `_headers`, `_routes.json`, robots e sitemap. O HTML do build limpo coincidiu com o da pasta final.
- `dist`: conferidos **62 recursos referenciados** (incluindo variantes de imagens, CSS e JS), tanto no disco quanto por HTTP no Wrangler, com status 200, MIME adequado e conteúdo não vazio. A saída pública não contém `functions`, `node_modules`, `config.js`, `.dev.vars` ou README.
- `functions/api/leads.js`: na raiz do projeto, fora de dist. O Wrangler compilou e executou a Function no runtime local workerd. `dist/_routes.json` contém schema 1 e inclui apenas `/api/*`.
- A rota GET `/api/leads` retornou **405**, com `Allow: POST`. O POST sintético de auditoria retornou **503**, `ok: false`, código `integration_not_enabled` e `Cache-Control: no-store`. Nenhum lead foi registrado.
- O frontend compilado continua em modo `preview`. Testado no navegador em 375 e 1440 px contra o próprio Wrangler: campos válidos resultaram na mensagem “Preenchimento validado nesta prévia. Nenhum dado foi enviado ou armazenado…”, com **zero requisições POST**, sem erros JavaScript, falhas de imagens ou violações de CSP detectadas.
- As duas regras de `_headers` foram reconhecidas. Confirmados por HTTP `X-Content-Type-Options: nosniff` e a CSP de prévia, que bloqueia conexões e envios. A Function define seus próprios cabeçalhos de resposta.

## Comando exato — PowerShell

Na primeira execução, instalar as dependências de desenvolvimento travadas no lockfile:

```powershell
Set-Location -LiteralPath 'C:\Users\Usuario\Documents\A- Clientes e Prceiros\Pri Chioquetta\Site'
npm.cmd ci
npm.cmd run preview:cloudflare
```

Com as dependências já instaladas, basta `npm.cmd run preview:cloudflare` na pasta do projeto.

O script executa:

```text
npm run build && wrangler pages dev dist --ip 127.0.0.1 --port 8788 --compatibility-date=2026-11-13
```

Abrir **http://127.0.0.1:8788/**. Encerrar com **Ctrl+C**. Se essa porta estiver ocupada, encerrar a instância anterior antes de repetir o comando. Esse teste serve os arquivos compilados e executa as Functions localmente; não é um deploy de produção e não precisa autenticar uma conta Cloudflare.

`npm.cmd run preview` continua disponível para a visualização estática simples. Ele não executa Pages Functions. Para verificar a compatibilidade de produção, usar `preview:cloudflare`.

Com o Wrangler aberto em um terminal, é possível repetir a auditoria em outro:

```powershell
npm.cmd run check:pages
```

## Configuração futura de Pages

Build command: `npm run build`. Build output directory: `dist`. Project root: a pasta que contém `package.json` e `functions`. O diretório `functions` não deve ser movido para dentro de dist. Não é necessário criar um `wrangler.json` para executar esse comando, pois pasta, porta e data de compatibilidade são explícitas.

Nenhuma integração Google Sheets, secret, banco, conta Cloudflare ou configuração de domínio foi ativada. A coleta real ainda depende de aprovação e implementação. O teste local não substitui a conferência final da configuração da conta e de uma prévia remota, quando sua publicação for autorizada.

## Evidências e arquivos

- `validacao/cloudflare-compatibilidade.json`: build limpo, lista dos 62 recursos e respostas da Function.
- `validacao/cloudflare-browser.json`: testes do navegador contra o Wrangler, em mobile e desktop.
- `tools/check-pages.mjs`: auditoria repetível, restrita a endereços locais. O POST de teste é sintético e a Function permanece desativada.
- `package.json` e `package-lock.json`: versão exata do Wrangler e scripts de execução local. Nenhum arquivo de layout ou imagem foi alterado nesta verificação.

Referências primárias: [desenvolvimento local de Pages](https://developers.cloudflare.com/pages/functions/local-development/), [estrutura de Functions](https://developers.cloudflare.com/pages/functions/get-started/) e [rotas de invocação](https://developers.cloudflare.com/pages/functions/routing/).
