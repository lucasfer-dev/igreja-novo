# Elovia — Modelos v0.9

A seleção de modelos recupera as imagens de alta qualidade aprovadas anteriormente; não utiliza mais miniaturas feitas com iframes diminuídos.

Os modelos não são a mesma página com outra cor. Agora têm composições próprias:

- **Moderno:** hero escuro dividido, fotografia lateral e linha de três destaques.
- **Tradicional:** fotografia de igreja, título centralizado, tipografia serifada e apresentação institucional.
- **Minimalista:** hero dividido com fundo claro, grandes espaços em branco, tipografia limpa e imagem separada.
- **Transmissões:** imagem de ambiente de culto, estrutura audiovisual com moldura e seções de conteúdo.
- **Personalizado:** direção visual de referência, marcada como projeto sob medida; depende de definição com a equipe.

O renderizador é `site-renderer.js`, chamado tanto pela prévia do configurador quanto pelas rotas públicas. Cada modelo recebe os mesmos dados (nome, mensagem, logo, cor, módulos e agenda), mas aplica uma linguagem visual própria.

Arquivos: `builder.js`, `site-renderer.js`, `public/builder.css`, `public/church-site.css`, `public/assets/church-*.webp`, `tests/template-identity.test.js`.

## Observação sobre validação

Aprovados testes de renderização e fluxos de ponta a ponta. Ainda falta a aprovação visual humana no navegador real e a substituição das imagens de apresentação pelos materiais finais da igreja antes da publicação pública.
