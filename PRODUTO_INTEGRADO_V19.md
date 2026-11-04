# Elovia v1.9 — Site institucional + CRM da igreja

## Definição do produto (fonte de verdade)

**A Elovia é a plataforma comercial que entrega para cada igreja um produto integrado: site institucional público + CRM e gestão internos.**

Cada igreja tem uma identidade visual (Moderno, Tradicional etc.), um conjunto de módulos habilitados por contrato e **uma base de dados própria por escopo lógico**. A interface muda com o modelo visual, mas pessoas, eventos, tarefas, histórico e permissões são compartilhados pelo site público e pelas áreas internas.

As 74 funcionalidades do catálogo **não são 74 cards obrigatórios na Home nem 74 microaplicativos isolados**. São capacidades organizadas em processos reais, ativadas conforme disponibilidade e assinatura. Funcionalidades ainda não implementadas devem aparecer como planejadas no painel administrativo, e nunca como funcionais sem backend.

## Superfícies do mesmo produto

1. **Elovia comercial:** escolha de modelo, customização, módulos, preços, solicitação, cadastro, cobrança futura e administração da operação SaaS.
2. **Site institucional da igreja (público):** identidade, apresentação, história, ministérios, eventos, conteúdos, oração, contato, formulários e participação. Não exibe valores comerciais nem botões de upgrade de módulos.
3. **CRM da igreja (restrito):** recepção, relacionamento, membros, visitantes, jornada pastoral, tarefas, equipes, eventos, presenças e comunicação. Usuários com diferentes papéis recebem acesso autorizado por módulo e permissão.
4. **Área de administração da igreja:** configurações, conteúdo publicado no site, acesso de usuários, contratação e extensões. Deve permanecer integrada ao CRM, sem criar registros paralelos.

## O que cada categoria significa operacionalmente

| Categoria do catálogo | Papel no produto | Dados e fluxos conectados |
|---|---|---|
| Site e presença digital | CMS e canais de entrada | Notícias, agenda, mídia, visitantes, pedidos de oração, formulários |
| Membros e visitantes | CRM e acolhimento | Contatos, jornada, visitas, batismos, histórico, check-in |
| Ministérios e cultos | Operação de equipes | Ministérios, voluntários, escalas, roteiro de culto, equipamentos |
| Comunicação e comunidade | Comunicação contextual | Segmentos, avisos, consentimentos, grupos, interações, notificações |
| Louvor, mídia e conteúdos | Biblioteca e operação de mídia | Pregações, playlists, rádio, vídeos e permissões de publicação |
| Educação e discipulado | Aprendizagem e acompanhamento | Inscrições, alunos, turmas, progresso, presença e certificados |
| Administração e patrimônio | Backoffice | Recebimentos, despesas, dízimos, ativos e auditoria |
| Eventos e inscrições | Jornada completa de eventos | Publicação no site, inscrição, confirmação, pagamento futuro e QR check-in |
| Ferramentas avançadas | Automação sobre dados autorizados | Regras, integração externa, IA, relatórios e limites de acesso |
| Mídia e comunicação visual | Fluxo editorial | Solicitação, produção, aprovação de artes e publicação no site |

## Jornada funcional entregue nesta versão

**Site institucional → CRM → equipe de recepção**

1. A pessoa acessa o site da igreja, mantendo o tema visual configurado.
2. Clica em **Sou novo aqui** e preenche nome + telefone ou e-mail + autorização explícita de contato.
3. O servidor valida, aplica limitação básica de envios e registra um **visitante** no banco da igreja.
4. O CRM registra uma **atividade de entrada pelo site** no histórico da pessoa e salva a versão/horário da declaração de consentimento.
5. É criada uma **tarefa pendente de acolhimento**, vinculada ao visitante, atribuída à equipe de recepção.
6. A equipe pode abrir o CRM, registrar um contato, atualizar a etapa, concluir a tarefa e posteriormente converter a pessoa em membro.
7. Novo envio do mesmo e-mail/telefone de um visitante tenta reutilizar o contato e não abrir mais de uma tarefa de acolhimento em aberto.
8. O site de uma igreja **sem o módulo de CRM habilitado** não oferece o formulário, e o backend recusa tentativas de gravar dados pela API.

**Não há disparo automático de mensagens.** A autorização de contato é apenas para a equipe realizar o acompanhamento, não representa consentimento para marketing ou mensagens em massa.

## O que foi mudado no código

- `visitor-intake.js`: serviço da jornada de recepção, validação, duplicidade simples, consentimento e criação de atividades/tarefas transacionais.
- `server.js`: endpoints de demonstração isolados por token para testar o fluxo sem cobrança.
- `tenants.js`: endpoint público real com verificação de habilitação dos módulos site + membros/CRM.
- `site-renderer.js`: site público limpo de cartões comerciais e nova seção de visitantes; modelos preservados.
- `public/tenant.js`: envio com feedback, validação e estado de carregamento.
- `public/church-site.css`: seção responsiva em todos os temas, mantendo a paleta de cada modelo.
- `tests/site-crm-journey.test.js`: testes integrados de ponta a ponta e isolamento.

## Regras de arquitetura para todas as próximas entregas

- Cada recurso deve possuir **gatilho real + dados persistidos + regras de negócio + interface para operar + controle de autorização + teste**. Ícone e card não equivalem a funcionalidade pronta.
- Módulos pertencem à **plataforma da igreja**; a aparência dos temas é uma camada de apresentação. Não duplicar os processos por modelo.
- Um cadastro de visitante feito pelo site deve aparecer no mesmo CRM que a equipe utiliza. O mesmo vale para inscrições, oração, cursos, atendimento e comunicação, respeitando confidencialidade e permissões.
- As telas públicas não devem mostrar controles comerciais da Elovia. O catálogo de upgrades fica em **Configurações / Módulos** para responsáveis autorizados.
- A página inicial do CRM deve priorizar **próximas ações reais**: novos visitantes, retornos vencendo, oração pendente, escalas, inscrições, materiais a aprovar. Não números fictícios.

## Próximos fluxos de domínio (ainda não implementados)

1. **Evento completo:** equipe cria evento → aparece no site → pessoa se inscreve → entra no CRM → check-in atualiza a participação → relatório.
2. **Cuidado pastoral:** pedido reservado no site → triagem privada → responsável → histórico mínimo de encaminhamento → conclusão. Restringir dados sensíveis.
3. **Escalas:** líder monta escala → voluntário confirma → gera ordem do culto → registra presença/alteração.
4. **Conteúdo:** equipe envia material → revisão editorial → publicação no site e na biblioteca → relatórios reais.
5. **Financeiro:** após integração confiável, conciliação de pagamentos/dízimos, permissões e auditoria. Nunca simular transações.

## Estado e limitações honestos

- Esta versão **não conclui os 74 backends**. O CRM atual mantém CRUD de contatos, acompanhamentos, tarefas, eventos, grupos e presença; a jornada pública de visitantes é o primeiro fluxo totalmente conectado ao site.
- O SQLite é adequado **somente para execução local / desenvolvimento** nesta configuração. Antes do deploy funcional na Vercel, a API precisa ser adaptada a funções serverless e usar um banco persistente (por exemplo PostgreSQL), além de armazenamento de arquivos e gestão de segredos.
- Dados de teste devem ser fictícios. Antes de operar com dados reais, faltam políticas de privacidade, retenção, exclusão e gestão de consentimento, auditoria completa, revisão de LGPD, acesso por papel e testes de segurança.
- A captura de tela automatizada foi bloqueada pelo ambiente; os testes automatizados validam os endpoints e renderização HTML, mas **não homologam a aparência pixel a pixel**.

## Como testar a jornada

1. `npm start` com Node.js 22.13+.
2. Acesse `/montar`, crie uma demonstração no modelo Moderno ou Tradicional.
3. Clique **Ver site** no Hub; no site, abra **Sou novo aqui**.
4. Informe dados fictícios e marque a autorização.
5. Volte ao Hub → **CRM da igreja** → **Pessoas e visitantes** e **Tarefas e retornos**.
6. Registre contato de acompanhamento e conclua a tarefa para verificar o processo real.
