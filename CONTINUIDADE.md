# Elovia — projeto único, evolução contínua

**Este diretório é a base canônica do produto.** Não iniciar um novo projeto quando acrescentar telas. Preservar os endpoints e banco existentes; implementar cada funcionalidade no mesmo repositório, com testes.

## Estrutura

- `server.js` — roteamento HTTP, pedidos e catálogo; monta as páginas existentes.
- `home.js` — conteúdo e componentes da Home comercial (página `/`).
- `public/home.css` — design da Home, responsivo, tokens de cores navy/gold.
- `public/home.js` — interações acessíveis da Home, especialmente menu mobile.
- `public/assets/` — imagens locais decorativas da Home (prévias ilustrativas).
- `public/app.js`, `public/style.css` — interface comercial legada do configurador `/montar`, acompanhamento e admin.
- `tenants.js` e `public/tenant.js` — lógica e interface da igreja.
- `tests/` — testes de regressão dos fluxos existentes e Home.
- `data/` — banco SQLite local; **não versionar dados de clientes**.

## Rotas existentes

- `/` — Home com apresentação e links, **não** configura diretamente.
- `/montar` — configurador/solicitação; destino de `Começar a criar`.
- `/acompanhar` — acompanhamento de pedidos.
- `/igreja/entrar` — acesso operacional.
- `/admin` — operação da empresa.

## Adicionar a próxima tela

1. Criar o arquivo da tela, ou componente compartilhado, neste mesmo projeto.
2. Registrar a rota no `server.js`, sem remover as rotas existentes.
3. Reaproveitar os tokens navy/gold da Home quando se tratar do site comercial; manter escopo de CSS para evitar quebrar painéis existentes.
4. Conectar à lógica do backend antes de chamar funcional.
5. Adicionar testes dos fluxos e rodar `npm test`.
6. Conferir desktop e celular no navegador quando disponível.

## Executar

Requer Node.js >=22.13.0:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="substitua-por-uma-senha-forte"
npm start
```

Acessar `http://127.0.0.1:3000/`. Testes: `npm test`.

## Escopo desta entrega

**Implementado:** página inicial de apresentação, navegação e CTAs para rotas existentes, seções e layout CSS responsivo, FAQ em HTML nativo, menu mobile, imagens locais; backend anterior preservado.

**Ainda não validado visualmente por navegador nesta sessão:** captura automatizada do Chromium bloqueada pela política de navegador (`ERR_BLOCKED_BY_ADMINISTRATOR`). Revisar aparência manualmente ao abrir no Windows.

**Não prometido como produção:** a página não significa que pagamento recorrente, aplicativos nativos ou módulos planejados estejam disponíveis. O catálogo operacional segue limitado aos módulos realmente implementados. As imagens são visuais conceituais, não screenshots de clientes reais.
