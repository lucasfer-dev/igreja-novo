# Estratégia inicial — 03/11/2026

## Status

**Marca Elovia: provisória.** Busca exploratória na web não substitui pesquisa no INPI, domínio ou assessoria jurídica. Novera e Alvora já aparecem em negócios brasileiros de tecnologia e não devem ser tratadas como alternativas livres.

## Problema / tese

Igrejas pequenas e médias precisam de presença digital e gestão, mas encontram pacotes fechados e sistemas extensos. Proposta: **solução personalizável por módulos + implantação assistida + transparência mensal**.

### Posicionamento

"Tecnologia que conecta sua comunidade". Marca humana e contemporânea, sem parecer um sistema financeiro eclesial. Personalidade: cuidadosa, objetiva, confiável, acessível. Arquétipos: Cuidador (suporte) e Criador (personalização).

### Identidade

- Azul profundo #173D46 (marca e CTA)
- Verde sálvia #A6C8AE (apoio)
- Verde interativo #428878
- Fundo marfim #F8F7F2
- Corpo #173D46
- Família: system-ui / Inter se licenciado e hospedado localmente
- Superfícies arredondadas 12–18 px, borda verde-acinzentada, pouca sombra
- Símbolo inicial ◈ é um placeholder tipográfico, NÃO logo registrado

## Concorrência (amostra de páginas públicas)

- Planning Center: assinatura modular por produto e volume de uso, com nível gratuito para algumas funções. https://www.planningcenter.com/pricing
- ChurchTools: pacotes XS–XXL com limites por capacidade; faixa US$39–399/mês em tabela observada. https://church.tools/en/pricing/
- Tithely: website US$19/mês, church management US$72/mês, all-access US$119/mês na tabela consultada. https://get.tithe.ly/pricing
- Eclesion: Brasil, preço anual equivalente a R$9,90/mês no plano de entrada na tabela consultada. https://eclesion.com/
- Ecclesiato: desde R$97/mês, conforme publicação do fornecedor. https://ecclesiato.com.br/blog/quanto-custa-sistema-gestao-igreja
- Igreja em Ordem: R$59,90/119,90/249,90 mensais. https://igrejaemordem.com.br/

Preços são fotografias do mercado e podem mudar. Pesquisa qualitativa com clientes ainda não ocorreu. Não houve verificação completa de avaliações de usuários nem do onboarding dos concorrentes.

## Segmentos e hipóteses

1. Igreja pequena, até ~100 participantes (faixa hipotética): pastor com tempo limitado, deseja site e agenda; sensível a preço/implantação.
2. Igreja média, ~100–500 (hipótese): secretaria e mídia descentralizadas; precisa de membros, eventos e escalas; preocupa-se com migração.
3. Rede de congregações (hipótese): permissões por unidade, financeiro, SLA e relatórios consolidados; precisa de contrato e implantação personalizada.

Validar com 12–15 entrevistas antes de comprometer investimento pesado.

## Precificação para teste (hipótese, sem decisão final)

- Base de R$39/mês e itens modulares conforme catálogo original, sem alterar os valores fornecidos.
- Implantação de R$299 por igreja como **hipótese adicional** de custo inicial; editável em `/admin`.
- Pacote Site + Agenda: R$93/mês no catálogo atual (R$39 base + R$39 site + R$15 agenda).
- Pacote Gestão: R$137/mês (R$39 base + R$59 membros + R$39 escalas).
- Pacote Presença e Acolhimento: R$113/mês (R$39 base + R$39 site + R$35 visitantes).

**Cuidado:** os preços propostos não são orçamentos de custo operacional apurados. Margem e CAC ainda precisam ser validados com hosting, trabalho de implantação, suporte, impostos e meios de pagamento reais. Um valor-base muito baixo pode ser insustentável se houver suporte humano frequente. Calcular contribuição por cliente = receita líquida – infra – taxas – suporte – tributos variáveis. Revisar preço se contribuição for negativa.

## Lançamento

1. Entrevistar gestores de 12 igrejas e coletar tarefas repetitivas.
2. Vender um piloto assistido com escopo explícito e contrato.
3. Priorizar cinco módulos reais: site, eventos, membros, oração e escalas.
4. Implantar dois clientes-piloto; medir tempo de entrega, solicitações de suporte, custo por igreja e retenção.
5. Só automatizar pagamento depois dos fluxos operacionais e da infraestrutura multi-tenant.

## Decisões registradas

- D001: usar nome provisório e impedir presunção de disponibilidade legal.
- D002: versão alfa em Node + SQLite sem dependências para rodar localmente; não é arquitetura final para deploy distribuído.
- D003: orçamentos sempre recalculados pelo backend; preços congelados no pedido.
- D004: sem pagamento automático ou provisionamento; transparência em todas as páginas.
- D005: catálogo amplo vendido como **itens de proposta**, e não como módulos já entregues.

## Faltas críticas para produção

Tenant operacional e RBAC; contas reais de clientes; verificação de e-mail; filas e notificações; privacidade, consentimento e direitos LGPD; políticas contratuais; pagamentos; armazenamento seguro de uploads; domínios customizados; proteção anti-abuso distribuída; backup com restauração testada; auditoria externa; testes de carga e deploy HTTPS.
