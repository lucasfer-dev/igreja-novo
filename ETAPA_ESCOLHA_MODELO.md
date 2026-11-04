# Elovia — Fluxo "Começar a criar"

Esta entrega altera **o projeto principal** (`elovia-produto/`), sem criar outro aplicativo.

## Rotas

- `/`: Home comercial aprovada.
- `/montar`: novo fluxo de cinco etapas, com o mesmo sistema visual da Home.
- `/montar?modelo=tradicional` (ou `moderno`, `minimalista`, `transmissoes`, `personalizado`): inicia com o modelo pré-selecionado.
- `/acompanhar`: consulta um pedido enviado usando número e chave.
- `/admin`: equipe acompanha o pedido.

## Fluxo implementado

1. **Modelo:** cinco escolhas reais, com cartões e seleção persistente enquanto navega.
2. **Personalização:** nome da igreja, paleta de cores, logotipo para **prévia local** e campo de referências.
3. **Funcionalidades:** catálogo obtido em `/api/catalog`, pesquisa, filtros, seleção de módulos realmente contratáveis.
4. **Orçamento:** chama `/api/quote` para calcular valores oficiais no servidor (mensalidade e taxa de implantação).
5. **Cadastro:** valida campos e envia para `/api/orders`, registra no SQLite e mostra número/chave para acompanhar a solicitação.

**Limitações transparentes:** o upload de logotipo ainda não persiste nem é enviado ao backend; a prévia da personalização é conceitual; nenhum pagamento é cobrado nesta etapa; apenas cinco módulos implementados são contratáveis, não os demais recursos descritos no PDF de expansão. A tabela de preços do PDF novo ainda não foi migrada para o banco, pois seria uma mudança comercial distinta que precisa ser conciliada com os módulos efetivamente entregues.

## Arquivos novos

- `builder.js`: HTML sem framework do fluxo.
- `public/builder.css`: estilos responsivos exclusivos do configurador.
- `public/builder-client.js`: lógica das etapas, prévia, filtros, orçamento e pedido.
- `tests/builder.test.js`: teste estático das etapas, modelos e integrações.

`server.js` foi modificado apenas para servir essa tela e seus assets, mantendo as APIs anteriores.

## Execução local

Requer Node.js >= 22.13.0 e uma senha de administração forte:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="DefinaUmaSenhaForteComMaisDe20Caracteres!"
npm start
```

Abra `http://localhost:3000` e pressione **Começar a criar**.

## Validação

`npm test`: quatro suítes aprovadas. Requisição HTTP a `/montar`: 200. A tentativa de screenshot com o Chromium do ambiente não finalizou; falta aprovação visual completa em browsers reais.
