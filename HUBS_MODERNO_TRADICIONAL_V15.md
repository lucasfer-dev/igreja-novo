# Elovia v1.5 — Hubs Moderno e Tradicional

## O que foi efetivamente modificado

Este pacote **continua sendo o projeto único da Elovia**, atualizado a partir da v1.4. Não há uma nova aplicação paralela.

- **Moderno:** reprodução da hierarquia aprovada: menu lateral escuro, busca, boas-vindas com fotografia, 6 indicadores numa linha em desktop, transmissão, agenda, mensagem, rádio, calendário lateral, tarefas, links, 10 atalhos e 10 cards coloridos de áreas.
- **Tradicional:** layout próprio com sidebar marrom, superfícies creme, serifas, banner fotográfico, 5 indicadores, 4 cards centrais (eventos, mensagem, rádio e calendário), tarefas, atalhos, links e 10 cards em duas fileiras.
- Fotografias extraídas das referências visuais anteriormente produzidas para o projeto (sem usar uma screenshot inteira como plano de fundo).
- Ícones SVG vetoriais mantidos no código, sem dependência de biblioteca remota.
- Versões responsivas em desktop e celular, com drawer lateral que abre e fecha.
- Busca do catálogo, calendário navegável, cards de módulos e links para as telas de demonstração existentes.
- Logotipo e nome personalizado da igreja preservados.
- A cor personalizada continua disponível na interface dos dois temas.
- Os **74 recursos estão acessíveis para demonstração**, mas somente cinco possuem backend operacional nesta base. Os demais abrem interfaces demonstrativas; não há pagamentos ativados.

## Arquivos modificados ou criados

- `demo-hub.js`
- `traditional-hub.js`
- `hub-icons.js` (novo)
- `public/demo-hub.css`
- `public/traditional-hub.css`
- `public/demo-hub.js` (drawer móvel com botão de fechar)
- `public/assets/hub-modern-*.webp` e `hub-traditional-*.webp` (novos)
- `tests/hub-visual-contract.test.js` (novo)

## Testar no Windows

Na pasta `elovia-produto`, com Node.js 22.13+:

```powershell
npm start
```

Abra `http://localhost:3000/montar` e siga **Escolher modelo → Personalizar → Criar demonstração**.

Acesse o Hub com o modelo **Moderno** e repita com **Tradicional**. Para testar o menu no celular, reduza a janela ou use o modo de dispositivo do navegador.

Para os testes automatizados, execute `npm test`.

## Limites

Esta entrega é uma implementação visual real do projeto, testada com renderização Chromium em páginas de teste locais (a navegação direta ao localhost foi bloqueada pelo ambiente). **Não é uma garantia de equivalência pixel a pixel com a imagem conceitual**; itens como fontes do navegador e imagens geradas podem ter diferenças. Os indicadores, nomes de mídia e eventos do Hub são dados ilustrativos e não devem ser interpretados como registros reais.

## Conferência visual da implementação

As páginas foram renderizadas em Chromium a partir do HTML/CSS do próprio projeto, usando um ambiente isolado porque o navegador bloqueou `http://localhost`. Resoluções conferidas: 1672×941, 1338×900 e 390×844. Resultado: sem overflow horizontal, calendários renderizados, pesquisa por módulo funcional e menu móvel abrindo/fechando pelos controles. Os exemplos mostrados são fictícios.
