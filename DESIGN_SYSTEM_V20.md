# Elovia · Design system e direção de produto v2
Atualizado em 04/11/2026.

## Princípio do produto
A Elovia vende **uma plataforma integrada** de presença digital e CRM organizacional para igrejas. **Site da igreja + CRM de pessoas + operações de culto** são superfícies conectadas de um único produto, não aplicativos ou cartões isolados. Na vitrine comercial, vender primeiro o problema resolvido, mostrar a solução e somente depois apresentar módulos e preços.

## Identidade
- Marca: Elovia (provisória, sem promessa de registro).
- Assinatura: "O digital a serviço de pessoas. Uma igreja mais próxima."
- Posicionamento: acolhimento humano com tecnologia confiável. Referências conceituais de produto: Planning Center (informação modular), Breeze (simplicidade operacional), dashboards editoriais de SaaS. Usar referências para qualidade de hierarquia, nunca copiar composição, ícones, textos, logos ou imagens de terceiros.
- Paleta principal da **vitrine**: navy `#081321`, navy elevado `#0b1a2a`, surface `#15273a`, ouro `#eab86b`, ouro claro `#ffd999`, branco quente `#f6f3ee`, cinza de apoio `#9dabbc`.
- Tipografia da vitrine: Manrope, títulos peso 800, tracking negativo e ritmo editorial; DM Sans em texto. Fallbacks do sistema.
- Gradientes apenas quando fazem sentido para profundidade visual; atenção especial ao contraste.
- Bordas de superfícies 1px discretas, cantos entre 9 e 20px, sombras leves; evitar cartões genéricos em excesso.
- Microinterações leves, respeitando `prefers-reduced-motion`.

## Arquitetura da experiência
1. **Comercial** `/`: proposta de valor → preview realista (claramente fictício) → três superfícies → fluxo do visitante → módulos → personalização → preços exemplificativos → dúvidas → CTA.
2. **Personalização** `/montar`: escolher modelo visual, inserir identidade, cores, logo e visualizar o site; sem simular assinatura ativa.
3. **Site de igreja** `/igreja/<slug>` ou `/demo/<id>`: institucional, nunca exibir upsell comercial a visitantes; formulários somente para capacidades disponíveis.
4. **CRM** `/demo/<id>/crm` e área de igreja autenticada: navegação naval navy, conteúdo claro, cards KPI com **dados reais**, tarefas de acompanhamento, pessoas, grupos, eventos, presença. No tema Moderno, o workspace usa visual claro; demais temas continuam isolados por classe.
5. **Hub**: manter links com o site e o CRM, acesso ao catálogo administrativo apenas para perfis autorizados.

## Hierarquia e conteúdo
- Navegação curta, objetivos claros, textos em PT-BR sem jargões de engenharia.
- CTAs principais: "Começar minha plataforma", "Personalizar minha igreja" e "Ver recursos".
- Diferenciar **exemplos fictícios / dados de demonstração** de dados reais e métricas verificadas.
- Não afirmar que 74 recursos já estão prontos. O documento do cliente descreve 74 funcionalidades em 10 áreas, mas o backend operacional atual possui apenas site, eventos, membros, oração e escalas, com subconjuntos de operações do CRM já funcionais.
- Na vitrine, os valores individuais exibidos são **exemplos da tabela do cliente**. Mensalidade base e implantação continuam no orçamento dinâmico; nenhuma cobrança automática é feita.

## Regras de implementação
1. Não substituir interface funcional por cards vazios; cada recurso novo precisa de gatilho → persistência → validação → permissão → testes.
2. Não criar dados de membros reais no SQLite temporário da Vercel; adequar para PostgreSQL persistente com isolamento multi-tenant, RLS, segurança e LGPD antes de produção comercial.
3. Respeitar as rotas e a lógica já existentes; mudança de design é progressiva, não reescrever o sistema sem preservar fluxos.
4. Componentes acessíveis, foco visível, navegação por teclado, layouts desktop/tablet/mobile e feedback de operações.
5. Priorizar telas com dados verdadeiros e jornada completa sobre quantidade de módulos superficiais.
6. Verificar `npm test` e responsividade antes de promover versões de produção. Builds READY da Vercel provam compilação/deploy, não testes E2E nem disponibilidade real.

## Escopo entregue nesta alteração
- `home.js` e `public/home.css`: landing premium responsiva, previews estilizados em CSS, narrativa site→CRM e catálogo de 10 áreas.
- `public/crm.css`: identidade premium do tema moderno no painel, preservando formulários e ações.
- `server.js`: preço de cinco módulos operacionais alinhado à tabela do briefing, para instalações novas.
- Mantidas as demais rotas, visualização e a arquitetura operacional anterior.

## Próximas etapas reais
1. Resolver persistência serverless e segredos num PostgreSQL multi-tenant, RLS e auditoria; garantir fluxo de autenticação seguro.
2. Completar jornada de evento: cadastro → site → inscrição → check-in → relatório.
3. Permissões de papéis pastor/líder/secretaria/mídia e política de consentimento, dados sensíveis e privacidade.
4. CMS robusto, imagens e documentos, com aprovação editorial.
5. Cobrança recorrente apenas após validação do MVP; respeitar preço contratado por cada igreja.

Fonte das funcionalidades e valores: briefing do cliente, "Documento sem título-2.pdf".