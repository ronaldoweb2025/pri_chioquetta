# Entrega da integração — pronta para configuração e autorização

## Estado

Código completo implementado localmente para **Cloudflare Pages Function → Google Apps Script → Google Sheets existente**. Não houve criação de planilha, Apps Script real, configuração de secrets, mudança de compartilhamento, push ou deploy. Não foi gravada nenhuma linha no Google Sheets e não foram utilizados dados de leads reais.

O cabeçalho da aba “Leads Landing” foi conferido com a conta proprietária informada, exclusivamente por leitura. O guia completo de configuração e ativação é [INTEGRACAO-APPS-SCRIPT.md](INTEGRACAO-APPS-SCRIPT.md).

## Arquivos novos

| Arquivo | Finalidade |
|---|---|
| `lib/server/lead-security.js` | Validação, limites de tamanho, HMAC e resposta/redirecionamento do Apps Script |
| `integrations/google-apps-script/Code.gs` | Código integral do Apps Script: assinatura, lock, deduplicação e gravação |
| `integrations/google-apps-script/appsscript.json` | Manifesto do Apps Script, escopo e fuso |
| `tests/integration.test.mjs` | Testes sintéticos com serviços Google simulados, sem rede real |
| `tools/test-form-browser.mjs` | Testes de preview/live com respostas da API interceptadas localmente |
| `docs/INTEGRACAO-APPS-SCRIPT.md` | Mapeamento, segurança, conta Google, secrets, autorização, deploy e teste controlado |
| `docs/ENTREGA-INTEGRACAO.md` | Este resumo e a lista de arquivos |

## Arquivos atualizados

| Arquivo | Alteração |
|---|---|
| `functions/api/leads.js` | Substitui a reserva de rota pelo endpoint completo, com ativação explícita |
| `scripts/main.js` | Envio real opcional, estados, recibo, retentativa e mensagens amigáveis; carrossel preservado |
| `templates/index.html` | Atributos de modo/feedback e honeypot invisível; campos e layout preservados |
| `config.js` | Mensagens de envio e erro; `form.mode` permanece `preview` |
| `tools/build.mjs` | Suporta preview/live, valida endpoint intermediário e ajusta avisos por modo |
| `_headers` | `connect-src 'self'`, mantendo Google inacessível diretamente pelo frontend |
| `.dev.vars.example` | Nomes e valores vazios de configuração, com ativação false |
| `package.json` | Comando `test:integration` e checagem do módulo de segurança |
| `tools/check-pages.mjs` | Confere a CSP adequada ao endpoint da própria origem |
| `tools/test-browser.mjs` | Adapta teste da rota à Function assíncrona |
| `docs/INTEGRACAO-GOOGLE-SHEETS.md` | Substitui a proposta antiga por referência à arquitetura Apps Script aprovada |
| `README.md` | Referência à implementação atual e aos testes |

`dist/` foi regenerado e não é versionado. Não contém o Apps Script, o módulo privado de segurança, testes ou secrets. CSS, imagens, vídeo e configuração editorial da galeria não foram alterados.

## Validação realizada

- 14 testes de backend aprovados com SpreadsheetApp, PropertiesService, LockService, CacheService e rede simulados.
- Assinatura inválida/expirada, origem proibida, corpo excessivo, ausência de consentimento, telefone inválido, honeypot, cabeçalhos incompatíveis, falha de gravação/flush e lock ocupado não geram sucesso.
- Reenvio com mesmo ID ou telefone/dados na janela não cria outra linha. Dados diferentes para o mesmo ID são rejeitados.
- Origem e status são definidos no servidor, I:K permanecem vazias, fórmulas são escapadas e opcionais/UTMs são preservados na nota.
- Navegador em 375 e 1440 px: erro HTTP, HTML inesperado, recibo incompleto e limite temporário preservam os dados; clique duplo não duplica; UUID permanece nas retentativas; sucesso só após recibo confirmado.
- Teste do frontend realizado também contra o Wrangler local e sua CSP, interceptando os envios no navegador, sem chamar Google.
- Function compilada no workerd e build limpo conferido: 62 recursos públicos válidos, rota desativada por padrão (GET 405 / POST 503).

Evidências locais: `validacao/formulario-integracao-browser.json`, `validacao/cloudflare-compatibilidade.json` e `validacao/integracao-entrega.json`. A pasta de validação mantém a política de Git ignore já existente no projeto; os arquivos locais de evidência não precisam ser publicados.

## Limites e próximos passos

Os testes do código Apps Script usam mocks fiéis do contrato; **a autorização OAuth, a implantação /exec e uma gravação no Google real ainda não foram realizadas**. Precisam das ações manuais e da autorização descritas no guia. A barreira contra spam é básica; deduplicação cobre os 2.000 registros recentes e não é garantia ilimitada de entrega única.

O frontend continua sem envio em modo preview e nenhum secret real foi criado. Para ativar, configurar o Apps Script sob `stc.contadigital@gmail.com`, cadastrar os mesmos secrets na Cloudflare, revisar consentimento/privacidade e autorizar o deploy e o teste sintético controlado. A branch principal publicada foi preservada; as alterações estão isoladas na branch de trabalho local `feat/landing-pri-itapema`.
