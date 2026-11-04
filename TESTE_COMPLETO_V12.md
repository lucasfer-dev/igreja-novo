# Elovia v1.2 — Demonstração com todos os recursos

## Como testar

1. Instale Node.js 22.13+.
2. Abra PowerShell na pasta `elovia-produto`.
3. Defina `ADMIN_USER` e `ADMIN_PASSWORD` (senha de 12+ caracteres) e rode `npm start`.
4. Acesse http://localhost:3000/montar.
5. Escolha um modelo (Moderno, Tradicional, Minimalista, Transmissões, Futurista ou Personalizado).
6. Personalize logo, nome, título, descrição, localização e cor.
7. A prévia mostrará os 74 recursos do catálogo do PDF como disponíveis na **demonstração**.
8. Clique em **Criar e abrir minha igreja**. Na página criada, abra **Todos os recursos** e acesse cada funcionalidade em **Explorar recurso**.

## Diferença entre demonstração e produto real

- O modo de teste **não cobra** nem cria assinatura.
- Os 74 recursos são exploráveis visualmente no modo de teste.
- Apenas os cinco módulos anteriores possuem operação de backend (site, agenda, membros, orações, escalas).
- Para os demais, a tela demonstra navegação e composição de UI, mas não cria registros nem executa integrações reais.
- Os dados e permissões de igrejas reais não são alterados pela demonstração.
- A mesma base de código e a identidade visual escolhida são preservadas.

## Arquivos modificados

- `server.js`: páginas de módulos em `/demo/:id/recurso/:recurso` e prévia completa.
- `site-renderer.js`: catálogo totalmente desbloqueado somente na demonstração, com navegação.
- `public/demo-feature.css`: interface das páginas de recursos demonstrativos.
- `builder.js`: texto da etapa de personalização.
- `tests/instant-demo.test.js` e `tests/live-preview.test.js`: testes atualizados.

## Validação

`npm test` — 9 de 9 testes passaram.
