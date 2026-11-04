# Elovia — demonstrações instantâneas (v1.1)

## Execução no Windows

Requisitos: Node.js 22.13+ (recomendado Node 24 LTS).

1. Descompacte o ZIP.
2. Abra o PowerShell dentro da pasta `elovia-produto`.
3. Execute:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="UmaSenhaForteComMaisDe20Caracteres!"
npm start
```

4. Abra `http://127.0.0.1:3000`.
5. Clique **Começar a criar**.
6. Escolha um modelo, clique **Personalizar este modelo**, edite nome, título, texto, localização, cor e logo.
7. Clique **Criar e abrir minha igreja**. Você será direcionado a `/demo/<identificador-aleatorio>`.
8. Clique **Editar esta igreja** na faixa superior do site de demonstração para carregar novamente as escolhas.

Não precisa cadastrar dados pessoais e não há solicitação de orçamento ou pagamento nesse fluxo.

## O que foi feito

- Seis modelos selecionáveis: Moderno, Tradicional, Minimalista, Transmissões, Futurista e Personalizado.
- Estilos diferentes com CSS e assets separados, não apenas variação de cor.
- Prévia via `/api/site-preview` e site `/demo/:id` usam `renderChurchSite` de `site-renderer.js`.
- Foto de fundo sem textos de UI fixos: menus, títulos e botões são componentes HTML responsivos.
- Nome, título, descrição, local, cor e logotipo personalizados são persistidos num registro de demonstração SQLite.
- O site demo tem atalhos, seções, catálogo com módulos ativos e indisponíveis, e link de volta para edição.
- O fluxo comercial antigo e os painéis existentes foram preservados no código, mas não são exigidos nessa demonstração.

## Limites explícitos

Isto é **um site de demonstração persistido localmente**, não uma igreja publicada no seu domínio com hospedagem de produção. O endereço `/demo/<id>` é um link de teste, não um tenant autenticado. Não compartilhe dados sensíveis ou arquivos reais nele. Os módulos avançados permanecem não implementados; o botão de desbloqueio não cobra nem ativa funcionalidades.

Há conteúdo de exemplo sinalizado, sem dados reais ou alegações de transmissões ao vivo ativas. Não existe pagamento no modo de demonstração. Os sistemas operacionais reais de membros, agenda, oração e escalas seguem sendo parte separada do painel da igreja, com autenticação e permissões.

## Validação

Execute `npm test`. A suíte verifica os cinco fluxos de engenharia anteriores e a criação de sites de demonstração para os seis modelos, incluindo persistência e recusa de configurações inválidas. A inspeção visual automatizada no Chromium não foi concluída no ambiente de construção, portanto ainda deve ser feita localmente.

## Onde mexer em seguida

- `builder.js` — tela de modelos e personalização
- `public/builder-client.js` — interação, preview, upload e criação do site
- `public/builder.css` — UI/UX do configurador
- `site-renderer.js` — componentes reais da página de igreja
- `public/church-site.css` — estilos e composição por modelo
- `server.js` — rotas e persistência SQLite da demonstração
- `feature-catalog.js` — catálogo ampliado, com status operacional

Continue neste mesmo projeto.
