# Proposta de captação — aguardando aprovação

Cloudflare Pages Functions é a arquitetura definida. Esta entrega não ativa coleta, não configura serviços externos e não gera credenciais. A rota reservada retorna falha explícita, nunca “lead recebido”.

## Fluxo recomendado

Visitante → `POST /api/leads` → validação e proteção contra abuso → gravação durável no Cloudflare D1 → encaminhamento para Google Sheets → atendimento da Pri.

Recomendo manter o registro durável como fonte recuperável e usar a planilha como ferramenta operacional. Enviar diretamente ao Sheets sem persistência é mais simples, mas pode perder tentativas em indisponibilidade e dificulta retentativas. D1 é uma adição proposta, a aprovar e provisionar; não existe banco criado nesta entrega.

Na implementação futura, a Function valida schema, limites de tamanho, WhatsApp normalizado, consentimento, origem, JSON e tamanho máximo do corpo. Adicionar Turnstile com validação no servidor e proteção de taxa compatível com o plano escolhido. Honeypot pode complementar. Não aceitar indiscriminadamente qualquer origem.

Gravar um `lead_id` idempotente e timestamp UTC com estado `pending_sheet`. Só confirmar recebimento ao visitante após persistência durável. Tentar a cópia à planilha sem bloquear indefinidamente a resposta. Se falhar, manter pendência para reprocessamento e alerta operacional. A resposta não deve afirmar que o contato já ocorreu. Reprocessamento, prazo de recuperação e responsável pelas falhas devem ser definidos antes da campanha.

Uma Function de Pages não oferece, sozinha, um agendamento periódico de recuperação. Proponho um Worker agendado separado para drenar pendências do D1, se aprovado. Não tratar `waitUntil` como fila garantida. Uma eventual integração com Queue também precisa ser desenhada e provisionada, sem presumir que já existe.

No envio à planilha, usar conta de serviço Google com acesso apenas ao documento-alvo, credenciais nos secrets da Cloudflare e API Sheets no servidor. Utilizar `values.append` com `valueInputOption=RAW` para que texto do visitante não vire fórmula. WhatsApp fica como texto. Nenhum ID de planilha privado, token ou chave deve ser incluído em `config.js`, `dist`, logs de navegador ou Git.

Evitar duplicidade por `lead_id` tanto no registro durável quanto na cópia à planilha. Como Sheets não oferece unicidade transacional por coluna, desenhar a recuperação de falhas parciais: antes de repetir um append de resultado incerto, consultar a coluna de IDs e reconciliar. Não prometer “exactly once” sem resolver essas falhas.

## Dados propostos

`lead_id`, `created_at_utc`, `nome`, `pais_residencia`, `whatsapp_e164`, `objetivo`, `faixa_investimento`, `interesse_principal`, `pagina_origem`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `consentimento_at`, `versao_consentimento`, `sheet_sync_status`.

Colunas comerciais adicionais da planilha: responsável, status comercial, último contato e observações. Evitar dados de documentos ou renda no formulário inicial. Não enviar dados pessoais ao Pixel ou incluí-los em URLs. Logs de falha devem usar identificadores e códigos, sem corpo completo dos leads.

## Variáveis e bindings a provisionar depois

- Binding D1 `LEADS_DB`, migrations e permissões adequadas.
- Secrets `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` e `TURNSTILE_SECRET_KEY`.
- Variável protegida `SHEETS_SPREADSHEET_ID`, nome de aba/range e configuração de origem autorizada.
- Chave pública Turnstile no frontend, quando existir.
- Processo de reprocessamento, alertas e política de retenção/exclusão coordenada entre banco e planilha.

`.dev.vars.example` contém apenas nomes vazios; `.dev.vars` e `.env` estão excluídos do Git. Não há segredo real cadastrado. Preview e produção devem usar bancos/planilhas distintos, para que testes nunca entrem no atendimento real.

## Mudanças necessárias antes da ativação

Implementar a persistência e a autenticação Google, migrar a Function reservada para o fluxo aprovado, criar os testes de falha/retentativa, substituir o modo de formulário de prévia por modo real e revisar a CSP. A política atual usa `connect-src 'none'` e `form-action 'none'`, impedindo envios no navegador; será necessário permitir o endpoint da própria origem e os recursos aprovados de Turnstile. A página atual não envia POST para a rota.

Finalizar política e base aplicável ao tratamento com responsável de privacidade; definir retenção, canal de direitos e transferências internacionais pertinentes. Aprovar os textos de consentimento e recibo. Testar telefone internacional, consentimento ausente, spam, indisponibilidade de D1/Google, clique duplo, duplicatas, timeout com append incerto e rastreamento por UTM. Só depois autorizar coleta real.

## Referências primárias consultadas

- [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [Bindings e secrets em Pages Functions](https://developers.cloudflare.com/pages/functions/bindings/)
- [Google Sheets API: values.append](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append)

Documentação consultada em 13/11/2026. A escolha por persistência durável e reconciliação é uma recomendação técnica para esta operação; não é uma integração existente.
