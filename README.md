# Elovia · Igreja Novo

Repositório de implantação da **Elovia — plataforma modular para igrejas**.

## Código-fonte

A base vigente é a versão **v1.8**, com personalização de igrejas, Hubs Moderno e Tradicional, catálogo de 74 funcionalidades demonstrativas e CRM com cadastro, acompanhamento, tarefas, eventos, grupos, presença e exportação CSV.

**Status deste repositório:** inicializado para receber o código v1.8. Até a importação do pacote, este README **não representa um deploy completo**.

## Execução local da versão v1.8

- Node.js 22.13 ou superior
- `npm start`
- `npm test`
- Abrir `http://localhost:3000/montar`

## Atenção ao deploy Vercel

O backend atual usa SQLite em disco local e um processo HTTP Node permanente. A Vercel usa funções efêmeras; sem banco externo persistente (PostgreSQL/Supabase/Neon, por exemplo) e adaptador para Vercel Functions, **não publique os cadastros do CRM em produção**.

Nenhuma integração de pagamento foi homologada e vários módulos do catálogo são telas demonstrativas. Não incluir `.env`, `data/*.sqlite`, dados pessoais ou senhas no Git.
