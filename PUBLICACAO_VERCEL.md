# Publicação da Elovia na Vercel

## Status técnico da v1.8

Esta aplicação foi construída para um processo Node.js permanente, com banco SQLite local em `data/elovia.sqlite`. Os testes locais passam (`npm test`), mas isso **não equivale** a compatibilidade com Vercel Functions.

A Vercel executa funções efêmeras com filesystem sem persistência. Logo, **NÃO é seguro colocar este backend em produção na Vercel e gravar registros de CRM no SQLite local**. A plataforma poderia perder dados após reinícios e escalonamento.

Para produção, migrar o armazenamento para banco externo persistente (PostgreSQL gerenciado, por exemplo) com controle de acesso e migrations, e adaptar a entrada HTTP do servidor para Vercel Functions. Manter `DB_FILE` apenas para desenvolvimento local.

Depois disso: configurar variáveis de ambiente e segredos no painel, configurar domínio, e validar cadastro/login/CRM/multi-igrejas com deploy de preview antes de produção.

Não enviar `.env`, dados pessoais ou `data/*.sqlite` para GitHub.
