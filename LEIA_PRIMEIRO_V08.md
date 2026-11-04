# Elovia 0.8 — prévia real do site da igreja

## O que foi corrigido

Antes, o configurador desenhava uma miniatura artificial que não era o mesmo site entregue após o pedido. A v0.8 **eliminou esse renderizador duplicado**.

Agora o mesmo arquivo `site-renderer.js`, acompanhado de `public/church-site.css`, produz:

1. A miniatura dos modelos no passo 1;
2. A prévia editável do passo 2;
3. O site público real em `/igreja/<identificador>`;
4. A prévia do editor pós-entrega no painel da igreja.

O layout e os componentes são compartilhados. O conteúdo é diferente apenas quando a igreja já publicou eventos reais, atualizou dados, ou quando o modelo é do tipo **Personalizado** e aguarda trabalho sob medida.

## O que reage na prévia

- Cinco modelos, com troca dentro da etapa de personalização;
- Nome da igreja;
- Título principal;
- Descrição;
- Localização;
- Cor;
- Logotipo PNG/JPEG/WebP otimizado;
- Módulos públicos (site, eventos, pedidos de oração);
- Visualização desktop/celular;
- Modo ampliado (tecla ESC fecha).

O site institucional vem pré-selecionado no fluxo "Começar a criar", para não simular um site que não está incluído no orçamento.

## Persistência

A API `/api/site-preview` renderiza a prévia com a configuração atual, **sem salvar** enquanto a pessoa edita. Ao enviar a solicitação, o pedido salva o título, descrição, localização, cor, modelo e logo. Quando a equipe provisiona a igreja, esses campos são transferidos para a plataforma pública. Migrações aditivas preservam o banco anterior.

O formulário de oração do site publicado usa a API de pedidos de oração já existente. Eventos publicados no painel passam a aparecer automaticamente no site quando o módulo está ativo.

## Abrir no Windows

Instale Node.js 22.13+ e, na pasta `elovia-produto`, execute:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="UmaSenhaForteComMaisDe20Caracteres!"
npm start
```

Visite `http://127.0.0.1:3000/montar` e avance para o passo 2.

## Testes e limitações

Execute `npm test`. Foram aprovadas **5 suítes**, incluindo a prova de que a prévia usa o renderizador compartilhado e que as personalizações chegam ao site público depois do provisionamento e continuam editáveis.

**Homologação visual no navegador:** não foi concluída neste ambiente, porque o navegador automatizado retornou `ERR_BLOCKED_BY_ADMINISTRATOR` inclusive em navegações locais. Os testes HTTP/integração passaram; a revisão visual final deve ser feita no navegador do seu computador.

**Modelo Personalizado:** é um ponto de partida visual, não a promessa de que um projeto sob medida esteja pronto antes da análise da equipe.

**Escopo funcional:** ainda há cinco módulos operacionais disponíveis para contratação; os demais módulos do catálogo ampliado não são declarados como concluídos.

**Produção:** não há cobrança automatizada nem deploy/homologação pública de segurança; este pacote é uma base local funcional, não uma certificação de SaaS comercial pronto.
