# ELOVIA — como testar a versão 0.4

**Requisitos:** Windows 10/11, Node.js 22.13 ou superior. Banco local SQLite, sem dependências externas ou Docker.

## Iniciar

Abra um terminal PowerShell na pasta `elovia-produto` e execute:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="CrieUmaSenhaExclusivaMuitoForte123!"
npm start
```

Abra http://127.0.0.1:3000.

## Fazer uma compra simulada e entregar a igreja

1. Vá em **Montar solução** (`/montar`). Escolha modelo e cor; marque site, eventos, membros, oração e escalas. Preencha o formulário e envie o orçamento. **Não há pagamento nesta versão.**
2. Copie o ID do pedido. Entre como equipe em `/admin` usando usuário e senha definidos ao iniciar.
3. Clique em **Igrejas**, informe ID do pedido, identificador `igreja-teste`, login `pastor` e senha inicial segura, depois provisione.
4. Vá a `/igreja/entrar`, informe `igreja-teste`, `pastor` e senha. O painel exibirá **Visão geral**, **Meu site**, **Agenda**, **Pessoas**, **Pedidos de oração**, **Escalas** e **Segurança**.
5. Em **Agenda**, clique em **+ Novo registro**, publique um evento e veja a lista atualizada. Em **Meu site**, configure apresentação e cor. Abra `/igreja/igreja-teste` e confira o evento publicado.
6. No site público envie um pedido de oração e confirme o recebimento no painel privado. Em **Segurança**, atualize a senha e verifique que precisa entrar novamente.

## Reexecutar testes e fazer backup

```powershell
npm test
npm run backup
```

Os backups ficam em `backups/` salvo configuração da variável `BACKUP_DIR`. **Armazene uma cópia fora do computador e teste restauração antes de confiar no mecanismo.**

## Limitações

A aplicação **não está pronta para exposição à internet** nem para armazenar informações reais de membros. Não há pagamento, monitoramento, operação remota, política LGPD completa ou autenticação com recuperação de senha. O nome Elovia é provisório. Leia `REVISAO_PRODUTO.md` para a lista completa de bloqueios.
