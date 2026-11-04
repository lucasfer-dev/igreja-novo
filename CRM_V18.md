# Elovia v1.8 — CRM funcional integrado

## O que foi entregue

Esta versão parte **diretamente da v1.7** e preserva os modelos, páginas comerciais, construtor de demonstrações, Hubs Moderno e Tradicional, navegação pelos 74 recursos e painel anterior da igreja.

O CRM acrescenta operações reais e persistentes em SQLite, com telas de uso diário:

- **Pessoas:** cadastrar, pesquisar, editar, converter visitante em membro e excluir; estágios do relacionamento e notas internas.
- **Acompanhamentos:** registro de ligações, mensagens, e-mails e encontros vinculados à pessoa.
- **Tarefas:** cadastro, edição, responsável, prazo, vínculo com contato, concluir/reabrir e excluir.
- **Eventos:** cadastro, edição e exclusão com data, local e descrição.
- **Grupos e ministérios:** cadastro, edição, líder e descrição.
- **Presenças:** vincular pessoa a evento, registrar presença/ausência; bloqueio de registro duplicado.
- **Visão geral:** indicadores calculados com dados gravados, listas de contatos, tarefas e eventos.
- **CSV:** exportação de contatos com proteção contra fórmulas em planilhas.

As interfaces respeitam a identidade escolhida no construtor:
- **Moderno:** azul-marinho com dourado e a estrutura de navegação do Hub Moderno.
- **Tradicional:** marrom com creme e a estrutura de navegação do Hub Tradicional.
- **Minimalista, Transmissões, Futurista e Personalizado:** variações de cores e contraste usando a mesma experiência de CRM, sem afirmar que seus hubs já possuem designs independentes finalizados.

## Como experimentar imediatamente (sem pagamento)

1. Inicie o servidor com `npm start` usando Node.js 22.13 ou superior.
2. Abra `http://localhost:3000/montar`.
3. Escolha o modelo desejado e personalize nome, cores e logo.
4. Clique em **Criar e abrir minha igreja** e acesse **CRM da igreja** no Hub.
5. Opcional: clique em **Popular dados fictícios** para inserir exemplos claros de teste.
6. Experimente **+ Novo contato**, editar, histórico, acompanhamento, tarefas, eventos e presença.
7. Retorne ao Hub para ver os números atualizados (membros, visitantes e eventos) e tarefas cadastradas.
8. Reabra o mesmo endereço: os dados ficam guardados no SQLite dessa instalação.

**Aviso de privacidade:** os endereços `/demo/<chave>` são demonstrações controladas por um token secreto na URL. Qualquer pessoa que possua o link pode abrir seus dados de teste. Nunca inclua dados pessoais verdadeiros, pagamentos ou informações sigilosas nessa demonstração. Compartilhe apenas o resultado de uma igreja fictícia.

## Área autenticada de uma igreja real

Para as igrejas provisionadas pelo fluxo administrativo, o CRM está em `/igreja/crm` após login em `/igreja/entrar`.

- Precisa de autenticação e do módulo **Gestão de membros** ativado.
- Eventos e presença requerem também o módulo **Agenda de eventos** ativado.
- Todas as requisições são isoladas por ID da igreja no backend, com token CSRF para gravações.
- Apenas a conta responsável pode excluir registros pelo CRM; editores podem criar e editar.
- Membros e eventos criados no CRM são refletidos nos módulos operacionais anteriores. Membros e eventos já cadastrados antes desta versão são importados para o CRM na primeira consulta.
- Backups continuam disponíveis por `npm run backup`.

## O que não significa

Os **74 recursos do catálogo** continuam navegáveis na demonstração, mas **não são 74 backends prontos**. Os seis conjuntos de dados acima possuem CRUD funcional; recursos como pagamentos, IA, rádio, transmissões, chat, integração de WhatsApp, campanhas e assinaturas continuam requerendo implementação e testes adicionais.

Não há integração real de pagamentos, cobrança recorrente, envio de WhatsApp/e-mail ou infraestrutura de produção. O produto não está homologado para uso com dados pessoais reais em produção: faltam revisão de privacidade/LGPD, políticas de retenção, auditoria abrangente, testes de penetração, implantação HTTPS e revisão de infraestrutura.

## Arquitetura e arquivos adicionados

- `crm-server.js`: schema SQLite, API de leitura e escrita, validação, scoping e integração com membros/eventos legados.
- `crm-view.js`: interface HTML do CRM com o tema da igreja e navegação.
- `public/crm-client.js`: busca, formulários, histórico, ações e atualização dos registros no navegador.
- `public/crm.css`: design responsivo e variações por modelo.
- `tests/crm-integration.test.js`: operações e restrições de acesso.

Alterados: `server.js`, `tenants.js`, `demo-hub.js`, `traditional-hub.js`, `public/demo-hub.js`, `public/demo-hub.css`, `public/traditional-hub.css`, `public/style.css`.

## Testes realizados

- `npm test`: **16 testes automatizados aprovados**, incluindo criação de duas demonstrações isoladas, operações CRUD, exportação CSV, relacionamentos pessoa-evento, acesso autenticado, restrição de módulo, CSRF, sincronização com o painel legado e os fluxos comerciais preexistentes.
- Testes HTTP independentes das rotas e CRUD da demonstração também aprovados.
- **Limitação:** a inspeção visual automática no Chromium foi bloqueada pelo ambiente. A interface está codificada de maneira responsiva, mas não foi homologada visualmente em diferentes navegadores/dispositivos reais nesta execução.

### Salvando sua instalação anterior

Se você já usa a Elovia, preserve **`data/elovia.sqlite`** (e faça um backup consistente com `npm run backup` antes de parar o servidor). O novo código aplica as migrações SQLite de forma aditiva. O ZIP não contém banco de testes e não deve sobrescrever seus dados.
