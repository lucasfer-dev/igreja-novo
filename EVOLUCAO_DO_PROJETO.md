# Elovia — projeto único e evolutivo

Este repositório é a **fonte única de código** para a Elovia. Não gerar outra aplicação para cada nova tela, não duplicar bancos e não trocar as rotas antigas sem migração.

## Organização

- `server.js`: servidor HTTP, operações comerciais, autenticação e dados.
- `home.js`: HTML da Home comercial (`/`).
- `public/home.css`: design system e responsividade da Home.
- `public/home.js`: navegação mobile e melhorias progressivas.
- `public/assets/`: imagens otimizadas da Home e modelos.
- `public/style.css` e `public/app.js`: configurador, acompanhamento e administração legados. **Serão modernizados em fases, mantendo as APIs.**
- `tenants.js` e `public/tenant.js`: operação das igrejas.
- `tests/`: integração HTTP, preços, pedidos, sessões e isolamento.

## Fluxo comercial existente

1. `/` — apresentação e demonstração (Home, agora com tema azul-marinho e dourado).
2. `/montar` — identidade da igreja, módulos, orçamento e envio de solicitação.
3. `/acompanhar` — histórico do pedido por ID/chave privada.
4. `/admin` — equipe Elovia.
5. `/igreja/entrar` — painel da igreja após provisionamento.

Os cards de modelo apontam para `/montar?modelo=...`, que pré-seleciona o estilo no configurador.

## Regras para continuar construindo

1. Criar as próximas telas **neste repositório**, compartilhando cores, tipografia, componentes e dados quando apropriado.
2. Manter o esquema de dados compatível e usar migrações ao alterá-lo.
3. Testar pedido, orçamento, isolamento multi-igrejas e autenticação a cada alteração.
4. Evitar preços hardcoded na Home: o painel pode mudar o catálogo; preços atuais são exibidos no configurador.
5. Não confundir uma ilustração de interface com funcionalidade implementada.
6. Não cadastrar dados pessoais reais ou receber pagamentos antes da homologação de segurança, LGPD e ambiente produtivo.

## Próxima página a desenhar

`/montar`: transformar o configurador atual em fluxo multi-etapas com preview responsivo de verdade, preservando APIs `/api/catalog`, `/api/quote`, `/api/orders`.
