# Elovia v1.0 — Modelos e recursos bloqueados

## Visual e personalização
- Modelos: Moderno, Tradicional, Minimalista, Transmissões, Futurista e Personalizado (sob medida).
- Cor principal editável no configurador. O renderizador é compartilhado entre prévia e publicação.
- O modelo Futurista é um novo tema de composição escura e ciano, independente da identidade comercial da Elovia.

## Catálogo
- 74 recursos distribuídos em 10 categorias, conforme a tabela mais recente enviada (PDF).
- Na prévia, todos os recursos estão visíveis: contratados/selecionados como ativos e demais como bloqueados.
- No site publicado, visitantes veem os recursos ativos. O administrador autenticado vê todas as categorias com opção de solicitar desbloqueio.
- O bloqueio visual não é a segurança: as APIs de membros, eventos, orações e escalas conferem os módulos no servidor.
- Recurso não operacional é marcado 'Em desenvolvimento'; sua solicitação registra interesse, não disponibiliza a função.

## Solicitações de upgrade
- `POST /api/church/upgrade-requests` exige sessão autenticada, responsável da igreja e CSRF.
- Persiste módulo e status. Rejeita módulos ativos, inexistentes e solicitações duplicadas abertas.
- `GET /api/church/features` mostra catálogo, módulos contratados e solicitações da igreja.
- `GET /api/admin/upgrade-requests` permite visualizar solicitações no painel da empresa.
- Não existe checkout nem ativação automática: antes disso é necessário integrar provedor de pagamentos, reconciliação por webhook e alterações seguras de entitlement no backend.
- Os preços do catálogo são hipóteses comerciais, não cobranças processadas.

## Limitações deliberadas
- Apenas site institucional, agenda, membros, pedidos de oração e escalas têm operação real.
- Outros módulos aparecem como opções de expansão, não são habilitados nem processam cobranças.
- Ainda pendentes: checkout recorrente, conciliação, implantação em produção e homologação visual em múltiplos dispositivos.

## Testes
`npm test`: oito suítes de integração e contrato, inclusive autenticação, CSRF, pedido duplicado e tentativa de acesso a módulo não contratado.
