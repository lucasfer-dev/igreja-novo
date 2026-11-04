# Revisão de engenharia — versão 0.4

## O que mudou

- Painel da igreja remodelado como uma aplicação de trabalho: navegação lateral, cabeçalho contextual, indicadores calculados no banco, agenda recente, pesquisa local em listas, criação/edição em gaveta lateral, ações com feedback e estados vazios.
- Seção de identidade digital: editor do conteúdo e cor da página pública com prévia de alterações; cinco modelos de apresentação aplicam variações reais de layout e estilo à página da igreja.
- Seção de segurança: administrador da igreja altera sua própria senha, com verificação da senha atual, política mínima de senha e invalidação de todas as sessões atuais.
- Endpoint de indicadores com contagens calculadas somente para os módulos contratados e para a igreja autenticada.
- Ferramenta de backup consistente SQLite (`npm run backup`) com `VACUUM INTO` e verificação de integridade.
- Testes de integração ampliados para indicadores exclusivos por igreja, senhas inválidas, alteração de senha, invalidação de sessão e novo login.

## Verificações executadas

- `npm test`: 2 suítes automatizadas passaram, sem falhas.
- `npm run backup`: snapshot gerado e verificado em banco local temporário.
- Teste via requests HTTP: pedido, autenticação administrativa e provisionamento de uma igreja realizados com sucesso.
- Teste navegador Chromium via Playwright **não concluído**: o ambiente bloqueou a navegação para `127.0.0.1` com `ERR_BLOCKED_BY_ADMINISTRATOR`. Portanto, nenhuma homologação visual no browser pode ser afirmada.

## O que não foi resolvido (impeditivos reais para produção pública)

- Infraestrutura: PostgreSQL gerenciado, deploy e domínio final, observabilidade, backups remotos automáticos e teste de restauração operacional em servidor.
- Comercial: meio de pagamento recorrente, faturamento, contratos, suporte com SLA, monitoramento de disponibilidade.
- Identidade: marca e domínio ainda sem validação jurídica.
- Segurança e privacidade: revisão externa, proteção anti-bots para formulários públicos, fluxo LGPD (especialmente dados que podem revelar crença religiosa), exportação/exclusão conforme política definida, recuperação de acesso e autenticação mais robusta.
- Qualidade: testes de navegador, testes de acessibilidade, mobile em dispositivos reais, carga e UAT com igrejas reais.
- Produto: temas configuráveis mais completos, upload de mídia, domínios próprios e fluxos de usuários em equipe.

**Status responsável:** protótipo operacional de avaliação local, com persistência e testes de integração; **não homologado para venda com dados de clientes reais**.
