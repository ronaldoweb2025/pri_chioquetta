# Ajustes para aprovação — cabeçalho, carrossel e mobile

13/11/2026. Sem push, PR, deploy ou alteração de integrações.

## Cabeçalho profissional

Nome “Pri Chioquetta” preservado em tipografia editorial. Subtítulo atualizado para “CORRETORA DE IMÓVEIS EM ITAPEMA” e linha discreta “CRECI-SC 78854F” abaixo. O CRECI vem dos dados profissionais centralizados em `config.js`. Esse ajuste não muda as dimensões do cabeçalho nem o conteúdo do Hero.

## Carrossel

Ordem em `gallery.items` no `config.js`:

1. Piscina — `piscina-a-02`.
2. Living — `living-a-01`.
3. Sacada — `sacada-02-a-01`.
4. Suíte — `suite-a-01`.
5. Salão de festas — `salao-de-festas-a-02`.
6. Sala de jogos — `sala-de-jogos-a-02`.
7. Brinquedoteca — `brinquedoteca-a-02`.

Cada objeto possui `title`, `caption` e `image` com basename real, dimensões, larguras disponíveis e alt. Para adicionar, remover ou trocar ambientes, editar somente essa lista e executar `node tools/build.mjs`. Não é necessário editar HTML ou JavaScript de interação. Manter arquivos referenciados em `assets/images`; o build valida se existem.

As três primeiras imagens já estavam em assets. As quatro restantes foram copiadas byte a byte dos arquivos WebP/JPG já existentes em `analise-pri/imagens-web`, sem gerar imagens novas ou substituir originais. Seus nomes foram preservados. O material de festas se chama originalmente “Salão de Festas - A - 02.jpeg”, correspondendo ao pedido de “Sala de Festas”.

Mantidos: duas imagens no desktop, uma no mobile, toque nativo, setas com limites, teclado, movimento suave, preferência por movimento reduzido, indicador e aviso de perspectivas ilustrativas. O JavaScript de interação permanece o mesmo; a quantidade vem do HTML gerado pela configuração. A fotografia de Itapema continua separada desta lista.

## Ajuste mobile solicitado durante esta revisão

Texto, cores, fontes e apresentação do Hero preservados. Apenas o CTA do Hero recebe largura pelo conteúdo, centralização e altura mínima de 46 px. Em telas muito estreitas, a legenda pode ocupar duas linhas para manter legibilidade e área de toque. O texto continua “Quero conhecer as oportunidades”.

A panorâmica não aparece mais sob o Hero no mobile. Ela aparece dentro da seção de contato, entre a chamada e os campos, em boa largura e com enquadramento de praia e edifícios. O desktop mantém sua panorâmica original no Hero e não mostra essa repetição na seção de contato. O formulário e sua lógica de prévia não foram alterados.

## Evidências

`validacao/hero-LARGURA.png`, `validacao/carrossel-LARGURA.png` e `validacao/pagina-LARGURA.png` contêm as capturas nas larguras 320, 375, 430, 768, 1280 e 1440. `resultados.json` registra os testes de setas, limites, títulos na ordem configurada, toque emulado, imagem antes dos campos e ausência de overflow.

`quantidades-galeria.json` registra o teste de configuração com 1, 2 e 7 imagens em mobile e desktop. O toque foi emulado em Chromium; não representa teste em aparelho físico.
