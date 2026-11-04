> **Direção do produto (v1.9):** cada igreja recebe um **site institucional integrado ao CRM e às ferramentas internas de gestão**. O catálogo comercial não faz parte da página pública. Veja [PRODUTO_INTEGRADO_V19.md](PRODUTO_INTEGRADO_V19.md) para os processos, integração, permissões e limitações.

> **Atualização v1.8:** CRM funcional para membros, visitantes, tarefas, eventos, grupos, presenças e acompanhamentos. Consulte [CRM_V18.md](CRM_V18.md) para instruções e limitações.

# Elovia — projeto único (Home visual v1)

**Continue sempre neste mesmo código.** A Home aprovada agora está em `home.js` e `public/home.css`; as demais rotas, APIs e banco já existentes foram mantidos. Para evoluir, leia [CONTINUIDADE.md](CONTINUIDADE.md).

**Para iniciar:** `npm start` (Node 22.13+; defina `ADMIN_PASSWORD` com 12+ caracteres para usar o painel). **Para testar:** `npm test`. URL: `http://127.0.0.1:3000/`.

---

# Elovia 0.4 — revisão funcional e de interface

**Comece pelo arquivo `COMECE_AQUI.md`.** As capacidades, testes e limitações atuais estão em `REVISAO_PRODUTO.md`.

# Elovia — plataforma comercial + operação de igrejas (beta local)

Esta edição possui dois produtos conectados: **vendas** (catálogo, orçamento, pedidos, acompanhamento e painel interno) e **operação multi-igrejas** (provisionamento por pedido, administração isolada de cada igreja, site público, eventos, membros, orações e escalas). Não são apenas mocks: os dados são armazenados em SQLite e os endpoints verificam acesso no servidor.

> **Situação verificável:** executada e testada localmente em Node.js 22.16.0, com suíte automatizada de integração. **Não está publicada nem homologada para dados reais, clientes pagantes ou uso público em produção.** A marca **Elovia é provisória** e não há garantia de registro no INPI.

## Windows / PowerShell — instalação

1. Instale Node.js 22.13 ou superior (preferencialmente 24 LTS). Não precisa de Docker nem `npm install`.
2. Extraia o ZIP, abra o PowerShell **dentro da pasta `elovia-produto/`**.
3. Execute:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="CrieAquiUmaSenhaUnicaMuitoForte123!"
npm start
```

4. Abra **http://127.0.0.1:3000**. O catálogo fica em `/montar`, pedidos em `/acompanhar`, equipe em `/admin` e clientes em `/igreja/entrar`.
5. Para testar os fluxos automatizados, pare o servidor e execute `npm test`.

O banco nasce automaticamente em `data/elovia.sqlite`, ignorado pelo Git. A senha inicial só é cadastrada **no primeiro start do banco**. Não apague o banco para redefini-la se houver dados importantes.

## Da compra à entrega — roteiro de validação manual

1. No site, clique em **Monte o site da sua igreja**, escolha o modelo, marque **Site institucional**, **Agenda**, **Membros**, **Orações** e **Escalas** e registre a solicitação. Guarde o ID e a chave exibidos.
2. No painel `/admin`, faça login e veja o pedido. Na aba **Igrejas**, insira o ID do pedido, um identificador simples como `igreja-exemplo`, usuário `pastor` e uma senha forte. Clique em **Criar igreja**.
3. Abra `/igreja/entrar`, use identificador, usuário e senha criados. Acesse o painel da igreja.
4. Publique um evento em **Eventos**, cadastre um membro em **Membros**, edite a apresentação em **Site**, crie uma escala e revise orações.
5. Acesse `/igreja/igreja-exemplo` e confirme que o evento é público e os membros não aparecem. Envie um pedido de oração pelo formulário público e volte ao painel para verificá-lo.
6. Crie uma segunda igreja e verifique que cada conta enxerga apenas os próprios registros. A suíte de integração verifica essas restrições usando HTTP.

## Escopo implementado

- Site comercial responsivo e catálogo de cinco módulos efetivamente implementados para solicitação de orçamento, com valor recalculado no backend.
- Pedido persistente, código de acompanhamento, histórico de status e preços congelados por pedido.
- Autenticação da equipe e de administradores das igrejas, senhas scrypt + salt, cookies HttpOnly, SameSite e CSRF nas mutações autenticadas.
- Provisionamento de uma igreja por solicitação, sem duplicação, módulos autorizados por tenant.
- Site público `/igreja/<slug>` com nome, apresentação, eventos e formulário reservado de orações quando habilitados.
- Painel de cada igreja com operações de criação, leitura, edição e exclusão para eventos, membros, escalas e orações, persistindo no banco.
- Escopo obrigatório por `church_id` nas operações privadas e validação de módulos por igreja no servidor.

## Limites que impedem afirmar “pronto para vender”

- **Sem assinatura, Pix/cartão, cobrança recorrente, conciliação ou nota fiscal.** O fluxo é de **solicitação de orçamento**, sem cobrança.
- **Sem envio de e-mails ou WhatsApp**, nem recuperação de senhas ou MFA; credenciais iniciais precisam de distribuição segura e rotação.
- **Banco SQLite local**: não adequado para deploy direto em Vercel serverless. Migração para PostgreSQL e isolamento validado por políticas no banco são recomendados antes de disponibilizar publicamente.
- Sem armazenamento de arquivos, CDN, domínios personalizados, ambientes de staging, backups automatizados, restauração testada, monitoramento, testes de carga ou avaliação externa de segurança.
- Sem termos comerciais e de privacidade, consentimento e fluxos de titulares LGPD, políticas de retenção e segurança para dados sensíveis. Não cadastre membros ou pedidos de oração reais até resolver esse ponto.
- Sem teste com igrejas reais, aceitação de usuários, evidência de interesse de compra ou validação de marca/domínio/INPI.
- Os demais 21 módulos estão registrados somente como roadmap interno e não são oferecidos para contratação. O site público é uma página configurável simples, não um construtor visual completo.

## Testes

```powershell
npm test
```

Testes HTTP isolados por banco temporário validam orçamento, pedido, atualização, catálogo, provisionamento, autenticação, CSRF, entrega de site, isolamento de dados de membros e eventos entre igrejas, habilitação de módulos e recebimento de orações.

## Observação de segurança

**Não exponha a porta local diretamente à internet.** Configure primeiro proxy TLS, infraestrutura persistente, política de segurança, banco e backups, gestão de segredos, autenticação robusta, limites distribuídos de requisições e revisão LGPD. Em produção, configure `NODE_ENV=production` para cookies com `Secure`, mas isso não substitui HTTPS ou hardening.
