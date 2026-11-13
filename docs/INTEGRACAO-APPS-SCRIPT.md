# Integração preparada — Pages Function → Apps Script → Google Sheets

Implementação local, sem push, deploy, criação de planilha ou gravação em Google Sheets. A ativação continua desligada. Os testes usam exclusivamente dados sintéticos, rede simulada e planilha em memória.

## 1. Destino conferido, sem modificações

Planilha existente: [Leads LP - Pri Chioquetta | Landing](https://docs.google.com/spreadsheets/d/16NO-6dfCGy9Zk5fI0Gg4FLYMCCLHoPf8EKkegxXtCnU/edit).

Conta proprietária informada: `stc.contadigital@gmail.com`. Aba confirmada por leitura: **Leads Landing**, sheetId **1015540119**, fuso **America/Sao_Paulo**. Cabeçalhos A1:K1 lidos e conferidos. Não foram lidas linhas de leads e não foi alterado o compartilhamento.

| Coluna existente | Origem no formulário/servidor |
|---|---|
| A — Recebido em | `new Date()` no Apps Script, automaticamente; exibição no fuso da planilha |
| B — Nome | `name` |
| C — País de residência | `country` |
| D — WhatsApp internacional | `whatsapp`, normalizado com + e DDI e gravado como texto |
| E — Objetivo de compra | `objective` |
| F — Consentimento registrado | `consent === true`, data/hora e `consent_version`; texto do aceite na nota de A |
| G — Origem | Constante do servidor: **Landing Pri Chioquetta** |
| H — Status do atendimento | Constante do servidor: **Novo** |
| I — Último contato | Vazio |
| J — Próximo retorno | Vazio |
| K — Observações | Vazio |

O formulário também já possui `investment` e `interest`, opcionais, e `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`, ocultos. Eles são preservados na **nota da célula “Recebido em”**, junto do identificador da submissão e do registro do consentimento. Não se cria coluna, aba ou planilha e “Observações” permanece vazia.

Os campos visíveis, os textos comerciais, o carrossel, as imagens e o CSS foram preservados. Acrescentou-se apenas um honeypot invisível e atributos de estado do formulário. Origem, status e timestamp não são aceitos do visitante como valores autoritativos.

## 2. Arquivos e responsabilidades

- `functions/api/leads.js`: endpoint público intermediário `/api/leads`; valida origem, tipo/tamanho do corpo, campos, consentimento e sinais básicos de spam; assina o payload e aguarda o recibo do Apps Script.
- `lib/server/lead-security.js`: validação e assinatura HMAC-SHA256 por Web Crypto, limites de leitura, normalização e redirecionamento seguro do ContentService. Não é copiado para dist.
- `integrations/google-apps-script/Code.gs`: código completo do Apps Script; valida assinatura e expiração, usa ScriptLock, deduplica e grava as 11 colunas na aba existente. Não é copiado para dist.
- `integrations/google-apps-script/appsscript.json`: manifesto, fuso e escopo de acesso a planilhas.
- `scripts/main.js`: mantém o carrossel existente e acrescenta o fluxo de envio com modo preview/live, bloqueio de clique duplo, timeout, recibo verificado e preservação dos dados em falhas.
- `templates/index.html`, `tools/build.mjs`, `config.js`: modo e mensagens do formulário, honeypot e textos de privacidade de acordo com o modo. O código comercial e os campos permanecem os mesmos.
- `_headers`: permite `connect-src 'self'` para o frontend falar apenas com sua própria Function. Apps Script continua inacessível ao JavaScript público. `form-action 'none'` impede envio nativo acidental fora do fluxo controlado.
- `.dev.vars.example`: somente nomes de configuração; nenhum segredo real cadastrado.

## 3. Proteções e recibo de sucesso

A comunicação entre os servidores usa assinatura HMAC sobre versão, timestamp, UUID e o JSON exato do payload. O segredo compartilhado nunca é enviado ao navegador nem incluído no corpo da requisição ao Apps Script. O script rejeita assinaturas inválidas e mensagens com mais de cinco minutos.

A Function aceita POST JSON de mesma origem ou de uma origem exata autorizada, limita o corpo a 8 kB, exige consentimento, valida os valores contra as opções do formulário, normaliza o WhatsApp e rejeita honeypot preenchido. Há um tempo mínimo de preenchimento de 1,5 segundo. Esses sinais não substituem uma proteção avançada contra bots.

O IP bruto não é enviado ao Google: a Function gera uma chave HMAC usada apenas no cache temporário anti-spam do Apps Script. Sob o mesmo ScriptLock, são permitidos até cinco novos cadastros por chave em dez minutos. CacheService é best-effort e pode ser descartado pelo provedor; esse limite é uma barreira básica, não um limite de tráfego garantido. Nenhum serviço Cloudflare adicional é exigido.

A deduplicação consulta as últimas **2.000 linhas** da própria aba e suas notas. O UUID permanece igual nas retentativas do mesmo preenchimento; se o registro já existe, o script devolve um recibo desse registro sem adicionar outra linha. Mesmo telefone/dados em dez minutos também não cria duplicata. Mesmo telefone com dados diferentes nessa janela retorna limite temporário. Se o volume aumentar ou registros forem movidos para fora dessa janela, revisar essa estratégia; ela não promete unicidade ilimitada. Não apagar as notas de integração se desejar preservar esse histórico de deduplicação.

O Apps Script grava a nota, os valores e executa `SpreadsheetApp.flush()` antes de confirmar. O frontend só mostra sucesso após a Function receber `ok:true`, `saved:true` e o UUID correspondente. HTTP 200, HTML de login, `ok:true` isolado e recibo de outra requisição **não** são sucesso. Falha e timeout preservam o formulário e permitem tentar novamente com o mesmo UUID. Como uma resposta pode se perder depois da gravação, o erro diz que não foi possível **confirmar** o envio, sem afirmar que nenhum dado foi salvo.

Dados iniciados por `=`, `+`, `-` ou `@` são escapados antes da gravação, impedindo fórmulas. O WhatsApp mantém o código internacional e não vira número de cálculo. Falhas retornam códigos controlados; exceções, URLs privadas, segredos e conteúdo do lead não são expostos ou registrados em logs da aplicação.

## 4. Criar e autorizar o Apps Script — somente preparação manual

Estas são instruções para o responsável, não ações já executadas. **Implantar o Web App é um deploy e continua dependendo da sua autorização.**

1. Entrar no Google com **stc.contadigital@gmail.com**. Conferir o avatar para evitar criar o script em outra conta.
2. Criar um projeto **independente** em [Google Apps Script](https://script.google.com/), por exemplo “Integração LP Pri Chioquetta”. Não criar outra planilha. O projeto independente evita compartilhar automaticamente o código/segredo com todos os editores da planilha.
3. Colar o conteúdo de `integrations/google-apps-script/Code.gs` no arquivo `Code.gs` do projeto.
4. Nas configurações do projeto, habilitar a exibição do manifesto e usar o conteúdo de `appsscript.json`. O script requer o escopo de planilhas para `openById`; seu código utiliza apenas o ID configurado. Não há necessidade de conta de serviço ou chave privada Google.
5. Nas **Propriedades do script**, cadastrar:

| Propriedade | Valor |
|---|---|
| `SPREADSHEET_ID` | `16NO-6dfCGy9Zk5fI0Gg4FLYMCCLHoPf8EKkegxXtCnU` |
| `SHEET_NAME` | `Leads Landing` |
| `LEADS_SHARED_SECRET` | Segredo novo e forte de 64 caracteres hexadecimais |
| `LEADS_ENABLED` | `false` inicialmente |

6. Para gerar o segredo no **seu terminal**, quando estiver pronto para configurá-lo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Não enviar o valor para o chat, não incluí-lo no código e não salvá-lo no Git. Copiar o mesmo valor para o Apps Script e para o secret da Cloudflare. A implementação exige caracteres ASCII alfanuméricos, `_` ou `-`, de 43 a 128 caracteres; o comando acima gera 64 caracteres válidos.

7. Selecionar `verificarConfiguracao` no editor e executar. Autorizar o projeto sob a conta proprietária. Essa função apenas verifica acesso, nome da aba e cabeçalhos; não escreve nenhuma linha. Se os cabeçalhos divergirem, o script falha fechado, sem corrigir a planilha automaticamente.

### Depois de autorizar especificamente a implantação

8. Criar uma implantação do tipo **Aplicativo da Web**. Executar como **Eu — stc.contadigital@gmail.com**. Acesso: **Qualquer pessoa**, pois a Function não possui sessão Google de navegador. A autenticação da gravação será a assinatura HMAC.
9. Isso torna acessível apenas o endpoint do script; **não torna a planilha pública**. Não alterar o compartilhamento da planilha. O endpoint GET não retorna leads ou dados da planilha.
10. Copiar a URL terminada em **`/exec`** para o secret Cloudflare `APPS_SCRIPT_URL`. Não usar `/dev` nem URL de editor.
11. Manter `LEADS_ENABLED=false` até autorizar o teste controlado. Ao atualizar o código do script, publicar uma nova versão da implantação existente, em vez de presumir que apenas salvar o editor atualiza `/exec`.

## 5. Configurar a Cloudflare — somente após autorização

No projeto Pages **já existente**, configurar separadamente os ambientes de preview e produção. Não criar outro projeto nem mudar domínio nesta tarefa.

| Variável | Tipo recomendado | Valor |
|---|---|---|
| `APPS_SCRIPT_URL` | Secret | URL `/exec` da implantação correta |
| `LEADS_SHARED_SECRET` | Secret | O mesmo segredo das propriedades do Apps Script |
| `LEADS_ENABLED` | Variável | `false` até autorizar a ativação; depois `true` |
| `ALLOWED_ORIGINS` | Variável | Origens exatas realmente usadas, separadas por vírgula; por exemplo o domínio final confirmado |

Não usar curinga em `ALLOWED_ORIGINS` nem incluir domínios de terceiros. Se a variável não existir, a Function aceita apenas o Origin igual à origem da própria URL solicitada. No teste local, usar `http://127.0.0.1:8788`.

O segredo não pertence a `config.js`, `dist`, GitHub, HTML, URL de query string ou JavaScript público. Não é necessário token OAuth Google no Cloudflare: o Apps Script executa sob a conta proprietária. Configurar variáveis e secrets na versão/ambiente correto e aplicá-los no próximo deployment autorizado.

## 6. Ativação e teste controlado — não executados nesta entrega

Há três condições independentes para envio real: **frontend em `live`**, **Function com `LEADS_ENABLED=true`** e **Apps Script com `LEADS_ENABLED=true`**. A entrega permanece com frontend `preview` e sem secrets reais. A falta de configuração fecha o envio, nunca simula sucesso.

Antes da captação, revisar o texto final do consentimento, `consentVersion`, informações de privacidade, prazo de retenção e canal oficial de atendimento/direitos. O texto funcional de privacidade não é uma certificação de conformidade. A apresentação comercial permanece intacta.

Após autorização explícita:

1. Conferir as propriedades e secrets, executar a verificação somente de leitura e manter as flags desligadas.
2. Preparar um ambiente de preview autorizado. Ativar o Apps Script e a Function somente para a configuração pretendida.
3. Alterar **apenas** `form.mode` para `live` em `config.js`, executar o build e implantar a prévia quando autorizado. O gerador aceita preview e live; preview continua sem envio.
4. Fazer um envio claramente sintético, por exemplo nome **TESTE CONTROLADO — EXCLUIR**, país **Outro país**, WhatsApp fictício **+999123456789**, objetivo **Férias** e aceite de teste do operador. Aguardar pelo menos dois segundos antes de enviar. Não usar dados de clientes.
5. Conferir a única linha criada na aba existente: data, campos, consentimento, origem, Novo e I:K vazias. Conferir a nota de A para opcionais e UTM. Não se criou essa linha nesta entrega.
6. Repetir o mesmo envio: não deve aparecer outra linha. Conferir um erro controlado com a flag da Function desligada: mensagem amigável e dados mantidos, sem falso sucesso.
7. Remover a linha sintética somente quando essa limpeza estiver autorizada. Não apagar linhas reais ou limpar a planilha inteira. Reativar/ativar produção somente após aprovação final.

### Testes locais que não escrevem no Google

```powershell
Set-Location -LiteralPath 'C:\Users\Usuario\Documents\A- Clientes e Prceiros\Pri Chioquetta\Site'
npm.cmd ci
npm.cmd run test:integration
npm.cmd run preview:cloudflare
```

`test:integration` utiliza uma implementação em memória dos serviços Apps Script, não a planilha real. `preview:cloudflare` compila e executa a Function no Wrangler, mas sem flag/secrets continua retornando 503. O modo preview do formulário nunca envia POST. O arquivo `.dev.vars.example` documenta os nomes; não foi criado `.dev.vars` com segredo real.

O teste de navegador em `tools/test-form-browser.mjs` também intercepta todas as respostas de `/api/leads` localmente. Exige a ferramenta Playwright do ambiente de QA; não é dependência de execução da landing. Confere erro, HTML inesperado, recibo incompleto, sucesso confirmado, preservação de campos, UUID de retentativa e clique duplo em 375 e 1440 px.

## 7. Manutenção

- Mudar cabeçalhos exige revisar o mapeamento; o script não renomeia nem cria colunas automaticamente. A ordem dos 11 cabeçalhos pode mudar, pois o mapeamento é por nome.
- Ao acrescentar objetivos em `config.js`, atualizar também a lista permitida no Apps Script. Os demais valores e limites são novamente validados no servidor.
- Se houver falhas, conferir códigos controlados nas respostas e execuções, sem registrar payloads ou segredos. Limites temporários preservam os dados no navegador.
- Apps Script/Google Sheets possuem quotas e não substituem um CRM ou fila durável. Para este fluxo inicial, uma falha devolve erro e depende de retentativa do visitante; não há fila de reprocessamento automático, pois ela não foi solicitada nesta arquitetura.
- Rotacionar o segredo nos dois ambientes de forma coordenada, durante uma janela de manutenção. Não publicar alterações de secrets ou código sem autorização.

## Referências primárias

- [Web Apps e execução como proprietário](https://developers.google.com/apps-script/guides/web)
- [ContentService e redirecionamento de respostas](https://developers.google.com/apps-script/guides/content)
- [LockService](https://developers.google.com/apps-script/reference/lock/lock-service)
- [Script Properties](https://developers.google.com/apps-script/guides/properties)
- [Métodos de Range](https://developers.google.com/apps-script/reference/spreadsheet/range)
