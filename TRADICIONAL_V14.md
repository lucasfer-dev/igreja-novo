# Elovia v1.4 — Hub tradicional

- Escolher **Moderno** mantém o hub escuro da v1.3.
- Escolher **Tradicional** abre um hub próprio, inspirado na direção visual aprovada: menu marrom, cabeçalho creme, cartão de boas-vindas com fotografia, títulos serifados, indicadores e cartões claros.
- O modelo escolhido controla a tela depois de **Criar e abrir minha igreja**.
- Nome, local, logotipo e cor de destaque continuam personalizados.
- As 10 categorias e os 74 módulos estão navegáveis em demonstração.
- Busca, calendário navegável, menu para celular, atalhos e links de recurso utilizam o JavaScript compartilhado.
- Os dados de agenda, estatísticas e mídia no hub são exemplos; não são métricas reais nem transmissões ativas.
- O Moderno não foi reestilizado.

## Arquivos principais

- `traditional-hub.js` — renderizador próprio do Tradicional
- `public/traditional-hub.css` — identidade visual clássica e responsividade
- `demo-hub.js` — encaminhamento por modelo
- `server.js` — exposição da folha de estilos
- `tests/traditional-hub.test.js` — regressão dos dois modelos

## Execução

```powershell
npm start
```

Abra `http://localhost:3000/montar`, escolha o modelo Tradicional, personalize, crie o site de teste e veja o hub.

## Status de verificação

11 testes automatizados passaram. A captura de tela do Chromium não concluiu neste ambiente; não houve homologação visual pixel a pixel. A interface é uma implementação em HTML/CSS/JS orientada pela imagem, não uma exportação editável dela.
