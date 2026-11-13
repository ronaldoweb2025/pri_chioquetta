# Landing page — Pri Chioquetta

Primeira versão funcional em HTML5, CSS3 e JavaScript puro. Design baseado nas prévias aprovadas de `analise-pri`, sem frameworks ou dependências de execução. Hospedagem preparada para **Cloudflare Pages**, com uma rota Pages Functions deliberadamente desativada. Sem PHP e sem Netlify.

## Abrir e editar

Requer Node.js para gerar e servir os arquivos; o site publicado executa somente HTML, CSS e JavaScript.

```powershell
node tools/build.mjs
node tools/serve.mjs
```

Abrir `http://127.0.0.1:4173`. Encerrar com Ctrl+C. Os equivalentes `npm run build`, `npm run preview` e `npm run check` também estão declarados. Não é necessário executar `npm install`.

O arquivo pronto é `dist/index.html`; também pode ser aberto diretamente no navegador para revisão básica. O servidor local é recomendado para reproduzir a navegação. A pasta `dist` contém apenas os arquivos públicos gerados, sem os materiais originais da raiz e sem os documentos internos.

## Estrutura

```text
config.js                       Conteúdo variável e referências das imagens
templates/index.html            Estrutura HTML semântica
styles/main.css                 Paleta, tipografia, layout e responsividade
scripts/main.js                 Carrossel e validação local do formulário
assets/images/                  Somente cópias otimizadas usadas na página
assets/favicon.svg              Ícone simples de inicial
functions/api/leads.js           Rota reservada; retorna 503 para POST
tools/build.mjs                 Gera dist sem bibliotecas externas
tools/serve.mjs                 Servidor local, sem backend de captação
tools/test-browser.mjs           QA com Playwright do ambiente de desenvolvimento
docs/                           Integração proposta, publicação e origem das imagens
validacao/                      Capturas reais de navegador e resultados
_headers                        Políticas de segurança para a prévia
.dev.vars.example               Somente nomes de secrets propostos; sem credenciais
dist/                           Saída para Cloudflare Pages (gerada, não versionada)
```

Os JPG/PNG/MP4 originais existentes na raiz foram preservados e excluídos do Git. Assets otimizados dentro de `assets` são versionados. O vídeo original não integra `dist`.

## Reutilizar para outro cliente da Ronaldo Web

1. Copiar o projeto para outra pasta/repositório, sem os originais da Pri, sem `.git` e sem `validacao`.
2. Editar `config.js`: marca, dados profissionais, CRECI, apresentação, imóvel, textos, imagens, legendas e CTA.
3. Adicionar as versões de imagem a `assets/images` e definir `name`, `widths`, `width`, `height` e `alt`. `name` é o nome sem tamanho e extensão: por exemplo `itapema-santa-catarina` referencia `itapema-santa-catarina-640.webp`, `-1280.webp`, `-1920.webp` e alternativas JPG.
4. Ajustar `hero.desktopTitleLines` para controlar as quebras no desktop. Se as linhas não recompõem exatamente `hero.title`, o gerador usa o título normal. No mobile a quebra é natural.
5. Atualizar `seo.siteUrl` e a imagem Open Graph 1200 × 630. Essa edição de metadados não configura um domínio.
6. Se houver WhatsApp oficial, preencher `broker.whatsapp` em formato internacional sem espaços, como `+DDINUMERO`. O link só aparece quando o valor é válido; nenhum número fictício foi cadastrado.
7. Manter `form.mode: 'preview'` até implementar e aprovar a integração. O build rejeita outro modo nesta versão.
8. Executar o build e revisar as telas novamente. O layout não precisa ser reconstruído.

O conteúdo é renderizado no build em HTML real, inclusive a galeria. Não depende de uma busca de JSON no navegador, e permanece legível com JavaScript desativado. O carrossel usa overflow horizontal nativo com Scroll Snap; o JavaScript acrescenta setas, estados inicial/final, indicador e navegação por teclado. Não existe rotação automática.

## Formulário nesta entrega

Nome, país, WhatsApp internacional e objetivo são obrigatórios, com aceite desmarcado. Faixa de investimento e interesse principal ficam em um bloco opcional, para não aumentar o atrito inicial. Sem tabela de preços confirmada, não foram inventadas faixas monetárias; as opções atuais permitem indicar que o visitante quer conversar ou ainda está definindo o valor.

O botão valida o preenchimento e informa explicitamente que nenhum dado foi enviado ou armazenado. Sem JavaScript, o envio fica desabilitado. Não há POST, fetch, localStorage, cookies ou Pixel. As UTMs permitidas são lidas apenas para campos ocultos da página atual; não são persistidas.

`/functions/api/leads.js` é somente uma reserva de rota, não uma integração. POST retorna 503, GET retorna 405; não lê o corpo da requisição nem grava informações. O servidor local estático também não recebe POST. A proposta para Cloudflare Pages Functions → registro durável → Google Sheets está em [docs/INTEGRACAO-GOOGLE-SHEETS.md](docs/INTEGRACAO-GOOGLE-SHEETS.md).

## Git e publicação

Remote solicitado: `https://github.com/ronaldoweb2025/pri_chioquetta.git`.

Branch local solicitada: `feat/landing-pri-itapema`.

Não executar push, abrir PR, conectar Cloudflare ou publicar sem aprovação do usuário. A branch `main` não foi alterada. O roteiro futuro está em [docs/CLOUDFLARE-PAGES.md](docs/CLOUDFLARE-PAGES.md). Não há workflow configurado que publique por conta própria.

## Antes de publicar

- Aprovar visual e textos, inclusive o CTA da versão final.
- Confirmar com a Pri autorização para o uso comercial do retrato e direitos dos materiais. O retrato está nesta prévia local e sua autorização comercial continua pendente.
- Confirmar vínculo com o empreendimento e versão vigente das três perspectivas da galeria. Não foram adicionados outros ambientes do acervo.
- Fornecer WhatsApp oficial, se desejar um atalho direto.
- Definir política de privacidade, responsável, canal de direitos e retenção.
- Aprovar a arquitetura da captação e fornecer acessos pelo mecanismo seguro apropriado, sem colar segredos em arquivos ou commits.
- Confirmar metadados do domínio; só depois remover o `noindex` de prévia. `robots.txt` de prévia não é controle de acesso.
- Autorizar separadamente push/PR e configuração de Cloudflare Pages. Uma prévia remota não foi criada nesta etapa.

As capturas foram feitas em navegador real nas seis larguras solicitadas. O teste de toque usa emulação CDP do Chromium, não aparelho físico. Os números de desempenho local não são uma nota Lighthouse nem uma garantia em rede móvel. Ver [docs/VALIDACAO.md](docs/VALIDACAO.md).
