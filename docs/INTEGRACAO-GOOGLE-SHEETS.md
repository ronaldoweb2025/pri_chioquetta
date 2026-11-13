# Integração com Google Sheets — arquitetura atual

A arquitetura aprovada foi atualizada para **Cloudflare Pages Function → Google Apps Script → planilha existente**. A proposta anterior de D1 e conta de serviço não é utilizada nesta implementação.

O guia completo, com mapeamento inspecionado, código, secrets, autorização, ativação e teste controlado, está em [INTEGRACAO-APPS-SCRIPT.md](INTEGRACAO-APPS-SCRIPT.md).

A integração está preparada em código e permanece desligada até configurar as duas pontas e autorizar o deploy. Nenhum lead foi escrito na planilha nesta entrega.
