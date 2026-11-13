# Validação da primeira versão funcional

13/11/2026 · Microsoft Edge / Chromium headless, em Windows.

## Resultado

| Largura | Carrossel visível | Toque | Overflow da página | Subrecursos iniciais |
|---|---|---|---|---|
| 320 px | 1 imagem(ns) | aprovado (CDP) | Não | 161.5 kB |
| 375 px | 1 imagem(ns) | aprovado (CDP) | Não | 161.5 kB |
| 430 px | 1 imagem(ns) | aprovado (CDP) | Não | 161.5 kB |
| 768 px | 2 imagem(ns) | não aplicável | Não | 281.6 kB |
| 1280 px | 2 imagem(ns) | não aplicável | Não | 281.6 kB |
| 1440 px | 2 imagem(ns) | não aplicável | Não | 453.8 kB |

Os valores de recursos são `encodedBodySize` dos subrecursos observados na primeira tela, antes do percurso pela página; não incluem o HTML (16,5 kB), cabeçalhos ou efeitos de compressão em produção. Incluem possíveis antecipações de imagens lazy do navegador. Não são nota Lighthouse nem medição em rede móvel.

## Verificações aprovadas

- Seis larguras sem overflow horizontal da página, inclusive depois das interações.
- Hero com foto WebP e `object-fit: cover`; no mobile a foto vem imediatamente depois do bloco de texto/CTA e antes da Pri.
- Identificação completa, profissão e CRECI presentes; retrato profissional no lugar da captura de Instagram.
- Três imagens da seleção anterior; duas por tela a partir de 768 px e uma abaixo desse limite.
- Setas, estados inicial/final e navegação por teclado (esquerda/direita, Home/End).
- Gesto nativo de deslize emulado por eventos de toque CDP nas três larguras mobile.
- Todas as imagens da página decodificadas, sem recursos com erro HTTP ou erros JavaScript.
- Validação de telefone internacional, campos obrigatórios e consentimento desmarcado. Campos de qualificação opcionais disponíveis em bloco expansível.
- Mensagem de validação explicita que não houve envio ou armazenamento; zero requisições POST durante os testes.
- Zero requisições externas, cookies, localStorage ou sessionStorage nesta versão.
- Leitura das UTMs permitidas na página atual, sem persistência ou transmissão.
- Um H1, title, description, metadados Open Graph, imagem OG 1200 × 630, idioma pt-BR, robots noindex e dimensões das imagens.
- Conteúdo em HTML acessível sem JavaScript, com envio desabilitado.
- Preferência por movimento reduzido respeitada.
- Function reservada testada como módulo: GET 405, POST 503 e `ok: false`.

## Capturas

Os arquivos em `validacao/pagina-LARGURA.png` são capturas completas do navegador, anteriores ao preenchimento de dados sintéticos. `hero-LARGURA.png` registra a primeira tela e `carrossel-LARGURA.png` registra a galeria. As seis versões foram revisadas visualmente, com atenção a recortes, legibilidade e alinhamento.

## Limites e pendências

- Toque emulado via Chromium/CDP; não é teste em aparelho físico.
- Desempenho medido em servidor local, sem simulação de rede móvel e sem Lighthouse.
- Pages Functions exercitada como módulo; deploy Cloudflare não realizado.
- A autorização comercial do retrato continua pendente; a exibição atual é de revisão local.
- Associação dos ambientes e direitos de uso precisam de confirmação antes da versão pública.
- Integração real, credenciais, banco, privacidade final, Cloudflare e domínio continuam pendentes.
- Não foi feita auditoria WCAG completa; foram verificados rótulos, foco, teclado, textos alternativos e movimento reduzido.
- Cabeçalhos de segurança do Pages foram conferidos no código; sua aplicação no Cloudflare deve ser validada na primeira prévia remota autorizada.

## Reproduzir o QA

O site não depende de Playwright. Para repetir somente os testes de desenvolvimento, usar uma instalação de Playwright já disponível e indicar `PLAYWRIGHT_MODULE` e, se necessário, `BROWSER_EXECUTABLE`; executar `node tools/test-browser.mjs`. O teste inicia e encerra seu próprio servidor em 127.0.0.1:4177 e não publica nada.

O JSON detalhado da execução está em `validacao/resultados.json`.
