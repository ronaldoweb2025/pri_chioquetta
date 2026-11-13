# Preparação para GitHub + Cloudflare Pages

Nenhum push, PR, projeto Cloudflare, domínio, secret ou deploy foi criado nesta etapa. O usuário determinou explicitamente que essas ações aguardem sua aprovação.

## Estado local pretendido

- Origem: `https://github.com/ronaldoweb2025/pri_chioquetta.git`.
- Branch de trabalho: `feat/landing-pri-itapema`.
- Branch de produção futura: `main`, preservada nesta entrega.
- Build: `node tools/build.mjs`.
- Pasta de saída: `dist`.
- Framework: nenhum.
- Functions: `functions/api/leads.js` na raiz do projeto, fora de `dist`.
- Rotas Functions: `dist/_routes.json`, restritas a `/api/*`.
- Instalação: nenhuma dependência NPM necessária; basta Node.js atual compatível com ES modules e `fs.cp`.

O diretório público é exclusivamente `dist`; não usar a raiz inteira como saída, pois ela contém os materiais originais e os documentos de trabalho. O build copia apenas `assets`, `styles`, `scripts` e os arquivos públicos gerados. `dist` não é versionado; o Cloudflare o gera a partir do código.

## Fluxo após autorização

1. Conferir o histórico remoto. Não foi feito fetch nesta etapa. Se o GitHub já contiver commits na `main`, alinhar a branch com essa base preservando o histórico, sem force-push e sem sobrescrever arquivos remotos por presunção.
2. Fazer push somente da branch solicitada e abrir PR com as mudanças e evidências de QA. Não mesclar automaticamente.
3. Na conta correta da Cloudflare, conectar o repositório via integração Git e selecionar `main` como branch de produção, com o build e a saída acima.
4. Decidir junto ao usuário quando conectar Pages: a conexão inicial pode gerar um deploy da branch de produção. Para cumprir a revisão antes de produção, fazer essa conexão somente após autorização explícita para esse efeito ou configurar os controles de deploy adequados antes do primeiro build. Não presumir que conectar Git é uma ação neutra.
5. Habilitar prévias de branch para revisão e conferir o deploy de preview autorizado, ainda com `noindex` e formulário sem envio.
6. Aprovar copy, imagens, política e captação; autorizar merge do PR na `main`. O Pages poderá publicar automaticamente conforme a configuração aprovada.
7. Configurar domínio somente com autorização separada, confirmar posse/DNS/HTTPS e canonical. Só então habilitar indexação em `config.js`.

Secrets e bindings de preview precisam ser separados de produção. Não há necessidade de GitHub Actions ou tokens Cloudflare em arquivos para a integração Git nativa. O diretório `.github` contém apenas um modelo de PR, sem workflow de deploy.

## Teste local e limitações

`node tools/serve.mjs` serve o frontend estático, não emula Pages Functions. A rota reservada foi exercitada em teste de módulo e deve ser revalidada no ambiente Pages quando a publicação de preview for autorizada. O `_headers` é aplicado pelo Pages aos arquivos estáticos; o servidor de revisão local não o aplica automaticamente. A Function define seus próprios cabeçalhos de resposta.

O formulário e o JavaScript não fazem requisições de envio. A CSP está preparada para bloquear envios e conexões opcionais nesta versão. Rever explicitamente a política quando a integração, Turnstile ou um player incorporado forem aprovados.

Referências: [Integração GitHub do Pages](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/) e [Pages Functions](https://developers.cloudflare.com/pages/functions/).
