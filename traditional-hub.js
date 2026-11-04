import {featureCatalog,featureGroups} from './feature-catalog.js';
import {normalizeSite} from './site-renderer.js';
import {icon} from './hub-icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons=['monitor','users','church','chat','radio','book','wallet','calendar','gear','image'];
const quick=[['crm','Abrir CRM','users'],['membros','Cadastrar Membro','users'],['visitantes','Registrar Visitante','user'],['escalas','Nova Escala','calendar'],['ordem-culto','Ordem do Culto','clipboard'],['blog','Publicar Conteúdo','edit'],['eventos','Criar Evento','calendarplus']];
const evt=[['12','NOV','Reunião com Líderes','Quinta · 19h'],['14','NOV','Culto das Mulheres','Sábado · 18h'],['21','NOV','Culto dos Adolescentes','Sábado · 18h']];
const urlOf=(base,id)=>`${base}/recurso/${encodeURIComponent(id)}`;
const moduleColors=['clay','olive','brown','sage','garnet','olive','copper','garnet','moss','bronze'];

export function renderTraditionalHub(raw,demoId){
 const s=normalizeSite(raw),id=encodeURIComponent(demoId),base=`/demo/${id}`;
 const logo=s.logo_data?`<img class="th-logo" src="${esc(s.logo_data)}" alt="Logotipo da igreja">`:`<span class="th-logo-fallback" aria-hidden="true">${icon('church',43)}</span>`;
 const nav=featureGroups.map((group,i)=>{
   const members=featureCatalog.filter(f=>f.category===group);
   return `<details class="th-nav-group hub-menu-group" data-group="${i}"><summary><span class="th-nav-icon">${icon(icons[i],23)}</span><span>${esc(group)}</span><span class="th-chevron">${icon('chevron',16)}</span></summary><div class="th-nav-children">${members.map(f=>`<a href="${urlOf(base,f.id)}" data-feature="${esc(f.name)}">${esc(f.name)}${icon('arrow',12)}</a>`).join('')}</div></details>`;
 }).join('');
 const modules=featureGroups.map((group,i)=>{
   const members=featureCatalog.filter(f=>f.category===group);
   return `<article class="th-module th-module-${i} th-module-${moduleColors[i]}"><span class="th-module-ico">${icon(icons[i],30)}</span><div><h3>${esc(group)}</h3><p>${members.length} recursos · demonstração</p></div><button type="button" data-expand="${i}" aria-label="Explorar ${esc(group)}">${icon('chevron',19)}</button></article>`;
 }).join('');
 const allFeatures=featureCatalog.map(f=>`<a href="${urlOf(base,f.id)}" data-search="${esc((f.category+' '+f.name).toLocaleLowerCase('pt-BR'))}"><span>${icon('layers',17)}</span><span>${esc(f.name)}<small>${esc(f.category)}</small></span>${icon('arrow',14)}</a>`).join('');
 const metricData=[['users','Membros','1.248','+12 neste mês'],['user','Visitantes','197','+28 neste mês'],['calendar','Eventos ativos','12','3 nesta semana'],['heart','Pedidos de oração','54','+7 hoje'],['coins','Dízimos e Ofertas','R$ 42.680,00','Dados de exemplo']];
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#392319"><title>Hub Tradicional · ${esc(s.name)} · Elovia</title><meta name="description" content="Painel de demonstração da igreja no modelo tradicional"><link rel="stylesheet" href="/traditional-hub.css"><script src="/demo-hub.js" defer></script></head><body style="--church-color:${esc(s.color)}">
 <div class="th-app">
  <aside class="th-sidebar" id="hub-sidebar"><button type="button" id="hub-sidebar-close" class="th-sidebar-close" aria-label="Fechar menu">✕</button>
   <a href="${base}/hub" class="th-brand">${logo}<span><strong>${esc(s.name)}</strong><small>${esc(s.location||'Plataforma da igreja')}</small></span></a>
   <nav class="th-nav" aria-label="Navegação principal"><a class="th-active" aria-current="page" href="${base}/hub">${icon('home',23)}<span>Início</span></a><a class="th-crm-entry" href="${base}/crm">${icon('users',23)}<span>CRM da igreja</span></a>${nav}</nav>
   <div class="th-sidebar-bottom">
    <div class="th-premium">${icon('checkcircle',26)}<span><strong>Todos os módulos ativos</strong><small>74 recursos acessíveis no teste</small></span>${icon('graduation',19)}</div>
    <div class="th-storage"><div>${icon('cloud',19)}<strong>Armazenamento</strong><small>Exemplo visual</small></div><div class="th-storage-line"><span></span></div></div>
    <a href="/montar?demo=${id}" class="th-settings">${icon('gear',21)}<span>Configurações da Plataforma<small>Identidade visual, usuários e preferências</small></span></a>
    <div class="th-bottom-links"><a href="${base}">Site público</a><a href="/">Voltar à Elovia</a></div>
   </div>
  </aside>
  <div class="th-right">
   <header class="th-topbar"><button type="button" id="hub-menu-toggle" class="th-menu-toggle" aria-label="Abrir menu" aria-expanded="false">${icon('menu',20)}</button><div class="th-search">${icon('search',23)}<input id="hub-search-input" aria-label="Buscar funcionalidades" type="search" placeholder="Buscar na plataforma (membros, eventos, conteúdos, relatórios...)" autocomplete="off"></div><div class="th-user"><span class="th-online"><i></i> Demonstração</span><a href="${base}/recurso/notificacoes" class="th-tool" aria-label="Notificações">${icon('bell',21)}</a><a href="${base}/recurso/documentos" class="th-tool" aria-label="Ajuda">${icon('help',21)}<span>Ajuda</span></a><details class="th-profile"><summary><span class="th-user-avatar">${esc(s.name.slice(0,1).toUpperCase())}</span><span class="th-user-name"><b>Administrador</b><small>${esc(s.name)}</small></span>${icon('chevron',16)}</summary><div class="th-profile-pop"><a href="${base}">Site público</a><a href="/montar?demo=${id}">Personalizar igreja</a><a href="/">Voltar à Elovia</a></div></details></div></header>
   <div class="hub-search-results" id="hub-search-results" hidden><div class="hub-search-results-head">Resultados do catálogo <button type="button" id="hub-search-close">Fechar ✕</button></div><div id="hub-search-list">${allFeatures}</div><p id="hub-search-empty" hidden>Nenhum recurso encontrado.</p></div>
   <main class="th-main">
    <section class="th-welcome"><div><span class="th-line"></span><div><small>ÁREA DE GESTÃO · MODELO TRADICIONAL</small><h1>Bom dia, ${esc(s.name)}</h1><p>Servindo a Deus, edificando vidas e cuidando da nossa comunidade.</p></div></div></section>
    <section class="th-metrics" aria-label="Indicadores de exemplo">${metricData.map(([ico,label,value,note])=>`<article class="th-metric"><span>${icon(ico,30)}</span><div><small>${label}</small><strong>${value}</strong><em>${note}</em></div></article>`).join('')}</section>
    <div class="th-content">
     <section class="th-top-grid">
      <article class="th-card th-events"><div class="th-card-head"><h2>${icon('calendar',20)} Próximos Eventos</h2><a href="${urlOf(base,'eventos')}">Ver agenda ${icon('arrow',14)}</a></div><div class="th-event-list">${evt.map(([day,mon,title,detail])=>`<a href="${urlOf(base,'eventos')}" class="th-event"><time><b>${day}</b><small>${mon}</small></time><span><strong>${title}</strong><small>${detail}</small></span>${icon('chevron',17)}</a>`).join('')}</div></article>
      <article class="th-card th-message"><div class="th-card-head"><h2>${icon('play',20)} Mensagem em Destaque</h2></div><div class="th-message-body"><a href="${urlOf(base,'pregacoes')}" class="th-message-art" aria-label="Explorar mensagens"></a><div><h3>Firmes na Palavra</h3><small>2 Timóteo 3.16–17</small><p>Uma mensagem sobre fé e perseverança em nossa caminhada cristã.</p><a class="th-card-button" href="${urlOf(base,'pregacoes')}">${icon('play',14)} Explorar mensagens</a></div></div></article>
      <article class="th-card th-radio"><div class="th-card-head"><h2>${icon('radio',20)} Rádio Central</h2></div><div class="th-radio-content"><div class="th-mic"></div><div><strong>Rádio Central</strong><p>Programação de exemplo para a comunidade</p></div></div><div class="th-radio-controls"><a href="${urlOf(base,'radio')}">${icon('play',15)}</a><span>Prévia de áudio</span><div class="th-radio-track"><i></i></div>${icon('audio',17)}</div></article>
      <article class="th-card th-calendar hub-calendar"><div class="th-card-head"><h2>${icon('calendar',20)} Calendário</h2></div><div class="th-calendar-nav"><button type="button" id="hub-prev-month" aria-label="Mês anterior">‹</button><h3 id="hub-calendar-title">Novembro de 2026</h3><button type="button" id="hub-next-month" aria-label="Próximo mês">›</button></div><div id="hub-calendar-grid" class="hub-calendar-grid"></div></article>
     </section>
     <section class="th-bottom-grid">
      <article class="th-card th-tasks"><div class="th-card-head"><h2>${icon('clipboard',21)} Tarefas da Equipe</h2><a href="${urlOf(base,'tarefas')}">Ver todas ${icon('arrow',13)}</a></div>${['Confirmar escala de louvor do próximo culto','Enviar comunicados da semana','Atualizar programação do site','Conferir inscrições do encontro'].map((title,i)=>`<label class="hub-task"><input type="checkbox" ${i===2?'checked':''}><span>${title}</span></label>`).join('')}</article>
      <article class="th-card th-quick"><div class="th-card-head"><h2>${icon('bolt',20)} Acesso Rápido</h2></div><div class="th-quick-grid">${quick.map(([feature,label,ico])=>`<a href="${feature==='crm'?base+'/crm':feature==='membros'?base+'/crm?view=people&new=membro':feature==='visitantes'?base+'/crm?view=people&new=visitante':feature==='eventos'?base+'/crm?view=events&new=events':urlOf(base,feature)}">${icon(ico,27)}<small>${label}</small></a>`).join('')}</div></article>
      <article class="th-card th-links"><div class="th-card-head"><h2>${icon('link',20)} Links Úteis</h2></div><a href="${base}">${icon('monitor',15)} Site da igreja ${icon('external',13)}</a><a href="${urlOf(base,'ao-vivo')}">${icon('radio',15)} Transmissões ${icon('external',13)}</a><a href="${urlOf(base,'membros')}">${icon('users',15)} Área do membro ${icon('external',13)}</a><a href="${urlOf(base,'documentos')}">${icon('file',15)} Materiais de discipulado ${icon('external',13)}</a><a href="/montar?demo=${id}">${icon('gear',15)} Configurações ${icon('external',13)}</a></article>
     </section>
     <section class="th-card th-categories" id="todos-modulos"><div class="th-card-head"><div><h2>${icon('layers',22)} Áreas da Plataforma</h2></div><button id="hub-expand-all" type="button">Explorar todos ${icon('arrow',14)}</button></div><div class="th-module-grid">${modules}</div></section>
    </div>
    <footer class="th-footer">Elovia · Demonstração sem cobrança · Dados e conteúdos de exemplo · <a href="${base}">Ver página pública</a></footer>
   </main>
  </div>
 </div></body></html>`;
}
