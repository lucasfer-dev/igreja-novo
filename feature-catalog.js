/** Catálogo de referência comercial baseado na tabela enviada. Valores em centavos BRL.
 *  status operacional de cada módulo é independente da disponibilidade comercial.
 *  Nunca habilitar módulos somente por clique na interface. */
const groups = [
 ['Site e presença digital', [
 ['site','Site institucional completo',2990],['eventos','Agenda de eventos e cultos',990],['galeria','Galeria de fotos e vídeos',990],['pregacoes','Biblioteca de pregações',1490],['ao-vivo','Transmissões ao vivo',1490],['pagina-ministerios','Página de ministérios',690],['blog','Blog e notícias',990],['oracao','Pedidos de oração',990]]],
 ['Gestão de membros e visitantes', [
 ['membros','Gestão completa de membros',3490],['visitantes','Gestão de visitantes',2490],['mensagens-visitantes','Mensagens automáticas para visitantes',2990],['carteirinha','Carteirinha digital',990],['presenca','Controle de presença',1990],['batismos','Gestão de batismos e novos convertidos',1990],['diretorio','Diretório interno de membros',1490]]],
 ['Ministérios e organização dos cultos', [
 ['escalas','Escalas ministeriais',2990],['ordem-culto','Ordem do culto',1490],['louvor','Gestão do ministério de louvor',1990],['repertorio','Repertório de músicas e cifras',1790],['voluntarios','Gestão de voluntários',1990],['reservas','Reserva de salas e espaços',1490],['equipamentos','Gestão de equipamentos',1490]]],
 ['Comunicação e comunidade', [
 ['avisos','Central de avisos e comunicados',1790],['notificacoes','Notificações para membros',1790],['chat','Chat e grupos de conversa',4990],['rede-social','Rede social interna da igreja',7490],['enquetes','Enquetes e votações',990],['email','Comunicados por e-mail',1490],['whatsapp','Integração com WhatsApp',2490]]],
 ['Louvor, mídia e conteúdos', [
 ['radio','Rádio online do ministério',3990],['musicas','Player e biblioteca de músicas',1490],['podcasts','Podcasts da igreja',1790],['estudos','Biblioteca de estudos bíblicos',1490],['devocionais','Devocionais e planos de leitura',1790],['boletins','Boletins digitais',990],['atas','Ata de assembleia',990],['documentos','Biblioteca de documentos e downloads',1490]]],
 ['Educação, discipulado e pequenos grupos', [
 ['ebd','Gestão da Escola Bíblica Dominical',2490],['cursos','Plataforma de cursos online',4490],['discipulado','Trilhas de discipulado',2990],['avaliacoes','Avaliações e questionários',1490],['certificados','Certificados digitais',990],['celulas','Gestão de células e pequenos grupos',2990],['relatorios-celulas','Relatórios de células',1790],['revista','Revista de Estudos',990]]],
 ['Administração e patrimônio', [
 ['financeiro','Gestão financeira completa',4990],['dizimos','Registro de dízimos e ofertas',1990],['patrimonio','Gestão de patrimônio e materiais',2990],['emprestimos','Empréstimo de equipamentos',1490],['fornecedores','Gestão de fornecedores',1490],['congregacoes','Gestão de múltiplas congregações',3990],['relatorios','Relatórios administrativos',1990],['tarefas','Gestão de tarefas internas',1490]]],
 ['Eventos e inscrições', [
 ['inscricoes','Inscrições e gestão de participantes',1990],['ingressos','Ingressos digitais',1790],['checkin','Check-in por QR Code',1990],['congressos','Gestão de congressos e retiros',2990],['pagamentos-eventos','Inscrições com pagamento',2990],['certificados-eventos','Certificados de participação',990]]],
 ['Ferramentas avançadas', [
 ['assistente-ia','Assistente virtual com IA',5990],['chatbot','Chatbot de atendimento',4490],['automacao','Automação de mensagens',3990],['dashboards','Dashboard e relatórios inteligentes',3490],['google-agenda','Integração com Google Agenda',1490],['google-forms','Integração com Google Forms',990],['permissoes-avancadas','Permissões administrativas avançadas',1990],['api','API para integrações externas',5990]]],
 ['Mídia e comunicação visual', [
 ['social-planejamento','Planejamento de conteúdos e campanhas para redes sociais',2490],['aprovacao-artes','Gestão de tarefas e aprovação de artes e vídeos',2490],['banco-midia','Banco de fotos, vídeos e identidade visual',1990],['producao-live','Gestão de transmissões e checklists',1990],['escala-midia','Escalas da equipe de mídia',1490],['agendamento-social','Agendamento e relatórios das redes sociais',3490],['roteiros-ia','Criação de legendas e roteiros com IA',2490]]]
];
export const featureCatalog = Object.freeze(groups.flatMap(([category,rows])=>rows.map(([id,name,price_cents])=>Object.freeze({id,name,price_cents,category,operational:['site','eventos','membros','oracao','escalas'].includes(id)}))));
export const findFeature = id=>featureCatalog.find(f=>f.id===id);
export const featureGroups = groups.map(([category])=>category);
