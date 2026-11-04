# Registro de validação — Elovia

## Evidência reproduzível

Comando: `npm test` no diretório do projeto. O teste inicia servidores Node locais em portas aleatórias, cria bases SQLite em diretórios temporários e usa chamadas HTTP reais para endpoints.

- Fluxo 1: catálogo → orçamento → pedido → sessão administrativa → mudança de status → acompanhamento → alterações de preço preservando preço antigo.
- Fluxo 2: pedidos para duas igrejas → provisionamento → sessões isoladas → criação de membros → tentativa de excluir membro de outra igreja (404) → bloqueio de operação sem CSRF (403) → eventos em site público → pedido de oração → exclusão legítima.

### O que esta evidência **não** demonstra

Deploy em nuvem, compatibilidade operacional em todos os Windows, segurança auditada por terceiros, suporte a alta concorrência, integração com intermediadores, conformidade legal, validação comercial, nem satisfação de clientes.

## Critérios de aceite para piloto

Antes de qualquer piloto real: migrar banco para Postgres com segregação endurecida, ativar TLS, regras de acesso e registro de auditoria, criar privacidade/termos e tratamento de dados sensíveis, fluxo de convite/alteração de senha, backup e restauração, observabilidade e testes de carga. Rodar testes de isolamento contra o serviço implantado, não apenas contra o servidor local.
