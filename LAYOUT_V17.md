# Elovia v1.7 — margens externas e horizontalidade

Esta revisão parte da versão v1.6 sem mudar as funcionalidades do projeto.

## Correção da interface

- Os **paddings internos dos cards voltaram aos valores da v1.5**.
- Aumentamos **gap entre cards** e **margem entre seções**, preservando tamanho compacto dentro de cada card.
- Hub **Moderno**: seis indicadores em uma linha no desktop, quatro cards principais lado a lado, dez atalhos em linha, e catálogo em grade horizontal. Entre 1191 e 1460 px, calendário/tarefas/links passam para uma faixa horizontal abaixo dos módulos para não espremer os quatro cards.
- Hub **Tradicional**: cinco indicadores e quatro cards centrais em linha; a identidade creme/marrom e sua composição permanecem próprias.
- Em telas estreitas, a distribuição se adapta para evitar rolagem horizontal.
- Nenhuma rota, módulo, permissão, comportamento financeiro ou personalização foi alterada.

## Verificações

- `npm test` executa os testes de integrações e um contrato adicional de layout.
- A interface foi renderizada com Chromium em 1440px e 390px, verificando o número de colunas e ausência de rolagem horizontal. Esses testes de aparência foram feitos com HTML real do renderizador, porém sem acionar a API ou renderizar o calendário via JS externo.

A demo mantém dados de exemplo; isso não indica operações reais para todos os 74 recursos.
