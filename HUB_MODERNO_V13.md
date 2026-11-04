# Elovia v1.3 — Hub moderno para demonstração completa

## Acesso

1. `npm start`
2. Abra `http://localhost:3000/montar`
3. Escolha **Moderno** e personalize nome, cor, logo e demais campos.
4. Clique em **Criar e abrir minha igreja**. Agora o sistema abre diretamente a página `/demo/<id>/hub`.
5. No topo do hub, **Ver site** abre a página pública criada para essa igreja.
6. **Personalizar** permite voltar ao configurador.

## O que foi construído

- Sidebar com as 10 categorias e os 74 recursos da tabela enviada.
- Pesquisa de funcionalidades com resultados vinculados às páginas de demonstração.
- Dashboard moderno em azul-marinho com cor de destaque escolhida no configurador.
- 6 indicadores de exemplo, transmissão, eventos, mensagem, rádio e atalhos.
- Calendário navegável, checklists interativos locais e links úteis.
- Grade de categorias e atalhos para todos os recursos.
- Layout responsivo, com menu lateral recolhível no celular.
- Integração com o fluxo de demonstração existente. Sem criar projetos paralelos.

## Limite importante

- O **hub é uma demonstração funcional de navegação**, não a implementação operacional completa dos 74 módulos.
- Os números e conteúdos do dashboard são exemplos identificados. Não são dados reais da igreja.
- Os módulos sem backend levam às telas demonstrativas existentes, também identificadas.
- O painel administrativo real em `/igreja/painel` continua separado e protegido por login. O modo demo não interfere em assinaturas nem permissões reais.
- Não há simulação de pagamento nem concessão de acesso a uma igreja real.

## Arquivos alterados ou adicionados

- `demo-hub.js` (novo)
- `public/demo-hub.css` (novo)
- `public/demo-hub.js` (novo)
- `server.js` (rota + assets)
- `site-renderer.js` (atalhos entre hub e site público)
- `public/builder-client.js` (abertura direta do hub)
- `tests/demo-hub.test.js` (teste HTTP)

## Testes

Execute `npm test` na raiz para validar o backend e o fluxo existente.
