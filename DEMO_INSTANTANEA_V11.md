# Registro de alteração — v1.1

## Problema corrigido

O botão final exigia orçamento e solicitação comercial mesmo para quem só queria experimentar o site escolhido. As imagens de modelos e o renderizador da página real tinham experiências visuais desconectadas.

## Decisão de produto

O fluxo de teste passa a ser: **Escolha do modelo → Personalização → Abertura imediata do site demonstrativo**. Não cria pedido comercial, não simula aprovação de pagamento e não provisiona credenciais de igreja real.

## Implementação

- Tela de modelos reformulada com imagens fotográficas e áreas de conteúdo editáveis, seis modelos
- Hero, atalhos, agenda, destaques de mídia e recursos no site da igreja
- Mesmo `renderChurchSite` na prévia e na URL de demonstração
- Persistência de parâmetros visuais e logo no SQLite
- Endereço aleatório para cada teste, com botão para voltar ao editor
- Conteúdo de exemplo identificado, sem dados falsos de audiência, transmissões ou doações
- Módulos operacionais preservados; catálogo adicional não é desbloqueado sem autorização
- Testes de integração incluindo seis tipos de layout

## Pendências

Não é deploy de produção, nem homologação visual em todos os navegadores. O modo demo não substitui onboarding, pagamentos e gestão privada real de uma igreja cliente.
