# Entrega local para aprovação

13 de novembro de 2026.

## Resultado

Primeira landing page funcional criada na pasta `C:\Users\Usuario\Documents\A- Clientes e Prceiros\Pri Chioquetta\Site`.

Abrir `dist/index.html` no navegador ou executar `node tools/serve.mjs` nessa pasta e acessar o endereço local impresso. Para editar os dados e reconstruir: `config.js` e `node tools/build.mjs`.

A referência desktop foi preservada em cores, tipografia, hero dividido, título com quebras editoriais, apresentação pessoal, fachada vertical e encerramento com formulário. O hero mobile apresenta a foto da cidade imediatamente após texto e CTA. A captura provisória de Instagram foi substituída pelo retrato profissional disponível para revisão, com nome completo, profissão e CRECI informados pelo usuário.

## Arquivos criados e alterados

Não havia código anterior. Todos os arquivos de implementação são novos; nenhum original de mídia foi modificado. Foram preservados os 21 arquivos que estavam na raiz da pasta na hora da instalação, com mesmo tamanho e data de modificação.

Arquivos centrais: `config.js`, `templates/index.html`, `styles/main.css`, `scripts/main.js`, `functions/api/leads.js`, `tools/build.mjs`, `tools/serve.mjs`, `package.json`, `_headers`, `.gitignore`, `.dev.vars.example`, `.github/pull_request_template.md`, `README.md`, documentos e evidências em `docs`/`validacao`. Foram acrescentados 35 arquivos de imagem otimizados e um favicon dentro de `assets`.

O build gera `dist/index.html`, CSS, JS, assets, robots, sitemap e rotas da Function. A saída pública não contém MP4, mídia original, documentação de trabalho ou configuração privada.

## Comportamento entregue

- Carrossel com três imagens, duas visíveis a partir de 768 px e uma no mobile, sem autoplay; setas laterais, limites, movimento suave, teclado e toque nativo. Legendas e aviso de perspectivas ilustrativas preservados.
- CTA consistente: “Quero conhecer as oportunidades”.
- Formulário com quatro dados principais, consentimento desmarcado e qualificação opcional expansível. Nenhuma faixa de preço inventada.
- Nenhuma integração ativa, falso recibo de lead, Pixel, cookie, POST ou armazenamento no navegador. A validação é local e explicitamente identificada como prévia.
- Configuração centralizada para marca, corretora, CRECI, imóvel, imagens, legendas, contatos, links, textos e CTA; HTML renderizado no build para leitura sem JavaScript e SEO.
- WebP com alternativa JPG, tamanhos responsivos, hero prioritário, imagens abaixo adiadas e ausência de fontes ou bibliotecas externas.
- SEO básico e Open Graph prontos, com `noindex` enquanto a página é de aprovação. Canonical usa o domínio pretendido; DNS não foi alterado.

## Evidências

Capturas completas: `validacao/pagina-320.png`, `pagina-375.png`, `pagina-430.png`, `pagina-768.png`, `pagina-1280.png` e `pagina-1440.png`. Há capturas do hero e da galeria nas mesmas seis larguras.

Testes das seis larguras aprovados em Edge/Chromium: ausência de overflow, imagens, identificação, setas, teclado, formulário e metadados. Toque emulado por CDP nas três larguras mobile. Ver `docs/VALIDACAO.md` e `validacao/resultados.json` para resultados e limitações. Não houve teste em aparelho físico nem deploy de preview remoto.

## Git

Repositório local criado nesta pasta, com `origin` apontando para `https://github.com/ronaldoweb2025/pri_chioquetta.git` e branch `feat/landing-pri-itapema`.

Três commits organizam preparação, implementação e validação. Autor técnico local: Codex; nenhuma identidade do usuário foi presumida. Não houve fetch, push, PR, alteração da main remota, conexão Cloudflare ou publicação. O histórico remoto ainda deverá ser conferido quando a sincronização for autorizada.

## Próximas aprovações

1. Revisar esta versão visual e os textos.
2. Confirmar autorização comercial do retrato, direitos dos materiais e vínculo vigente das perspectivas.
3. Fornecer WhatsApp oficial, se desejar o atalho; definir faixas reais de investimento, se forem usadas.
4. Aprovar a proposta `docs/INTEGRACAO-GOOGLE-SHEETS.md`: Pages Functions, persistência durável proposta e Google Sheets. Nenhuma conta, banco ou chave foi criado.
5. Finalizar política/consentimento e operação de atendimento.
6. Autorizar separadamente sincronização GitHub, PR e configuração de preview/produção Cloudflare. Domínio permanece fora desta execução.
