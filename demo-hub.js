import {renderTraditionalHub} from './traditional-hub.js';
import {featureCatalog,featureGroups} from './feature-catalog.js';
import {normalizeSite} from './site-renderer.js';
import {icon} from './hub-icons.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons=['monitor','users','church','chat','radio','book','wallet','calendar','bolt','image'];
const quick=[['crm','Abrir CRM','users'],['membros','Cadastrar membro','userplus'],['visitantes','Registrar visitante','user'],['escalas','Nova escala','calendar'],['ordem-culto','Ordem do culto','clipboard'],['avisos','Enviar comunicado','send'],['blog','Publicar conteúdo','edit'],['eventos','Criar evento','calendarplus'],['ao-vivo','Abrir transmissão','radio'],['dizimos','Dízimos/ofertas','heart'],['relatorios','Gerar relatório','chart']];
const sampleEvents=[['12','NOV','Reunião com líderes','Quinta · 19h'],['14','NOV','Culto de mulheres','Sábado · 18h'],['21','NOV','Culto de adolescentes','Sábado · 18h']];
const stats=[['users','1.428','Membros'],['userplus','87','Visitantes no mês'],['calendar','12','Eventos ativos'],['radio','2.845','Visualizações de lives'],['heart','64','Pedidos de oração'],['chart','R$ 18.540','Ofertas do mês']];
const groupGradients=['blue','green','orange','purple','red','violet','teal','amber','sky','pink'];

export function renderDemoHub(raw,demoId){
 if(raw.template==='tradicional')return renderTraditionalHub(raw,demoId);
 const s=normalizeSite(raw),slug=encodeURIComponent(demoId),url=`/demo/${slug}`;
 const menu=featureGroups.map((group,i)=>{
   const members=featureCatalog.filter(f=>f.category===group);
   return `<details class="hub-menu-group" data-group="${i}"><summary><span class="hub-menu-icon">${icon(icons[i],21)}</span><span>${esc(group)}</span><span class="hub-menu-chev">${icon('chevron',15)}</span></summary><div class="hub-menu-children">${members.map(f=>`<a href="${url}/recurso/${f.id}" data-feature="${esc(f.name)}">${esc(f.name)} ${icon('arrow',12)}</a>`).join('')}</div></details>`;
 }).join('');
 const moduleCards=featureGroups.map((group,i)=>{
   const members=featureCatalog.filter(f=>f.category===group);
   return `<article class="hub-module hub-module-${i} hub-tint-${groupGradients[i]}"><div class="hub-module-title"><span class="hub-module-icon">${icon(icons[i],30)}</span></div><h3>${esc(group)}</h3><p>${members.length} recursos disponíveis para teste</p><div class="hub-module-bottom"><span>${icon('checkcircle',14)} Acessível</span><button type="button" data-expand="${i}" aria-label="Explorar ${esc(group)}">${icon('arrow',17)}</button></div></article>`;
 }).join('');
 const logo=s.logo_data?`<img src="${esc(s.logo_data)}" alt="Logotipo da igreja" class="hub-logo">`:`<span class="hub-brand-mark" aria-hidden="true">${icon('bird',41)}</span>`;
 const allFeatures=featureCatalog.map(f=>`<a href="${url}/recurso/${f.id}" data-search="${esc((f.category+' '+f.name).toLocaleLowerCase('pt-BR'))}"><span>${icon('layers',17)}</span><span>${esc(f.name)}<small>${esc(f.category)}</small></span><span>${icon('arrow',15)}</span></a>`).join('');
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#06121f"><meta name="description" content="Hub de demonstração da igreja."><title>Painel · ${esc(s.name)} · Elovia</title><link rel="stylesheet" href="/demo-hub.css"><script src="/demo-hub.js" defer></script></head>
 <body class="hub-theme-${esc(s.template)}" style="--church-color:${esc(s.color)}">
 <div class="hub-app">
  <aside class="hub-sidebar" id="hub-sidebar"><button type="button" id="hub-sidebar-close" class="hub-sidebar-close" aria-label="Fechar menu">✕</button>
   <a href="${url}/hub" class="hub-identity">${logo}<div><strong>${esc(s.name)}</strong><small>${esc(s.location||'Plataforma da igreja')}</small></div></a>
   <nav class="hub-nav" aria-label="Menu da plataforma">
    <a href="${url}/hub" class="hub-nav-home" aria-current="page">${icon('home',21)}<span>Início</span></a>
    <a href="${url}/crm" class="hub-nav-home hub-crm-entry">${icon('users',21)}<span>CRM da igreja</span></a>
    <p class="hub-nav-label">PLATAFORMA COMPLETA</p>
    ${menu}
   </nav>
   <div class="hub-sidebar-bottom">
    <div class="hub-nav-bottom">${icon('graduation',25)}<span><strong>Todos os módulos acessíveis</strong><small>74 módulos · modo teste</small></span></div>
    <div class="hub-storage"><span>Armazenamento <small>Exemplo visual</small></span><div class="hub-storage-track"><span></span></div></div>
    <a class="hub-sidebar-link hub-settings" href="/montar?demo=${slug}">${icon('gear',19)}<span>Configurações</span></a>
    <div class="hub-sidebar-sub-links"><a href="${url}">Site público</a><a href="/">Voltar à Elovia</a></div>
   </div>
  </aside>
  <div class="hub-right">
   <header class="hub-topbar">
    <button type="button" id="hub-menu-toggle" class="hub-icon-button" aria-label="Abrir menu" aria-expanded="false">${icon('menu',21)}</button>
    <div class="hub-search">${icon('search',23)}<input type="search" id="hub-search-input" placeholder="Buscar pessoas, eventos, conteúdos, módulos..." aria-label="Buscar funcionalidades" autocomplete="off"></div>
    <div class="hub-top-right"><span class="hub-demo-tag"><i></i> Modo demonstração</span><a class="hub-top-link" href="${url}" title="Abrir site público">${icon('external',17)} <span>Ver site</span></a><a class="hub-round-btn" href="${url}/recurso/notificacoes" aria-label="Notificações">${icon('bell',21)}</a><a class="hub-round-btn" href="${url}/recurso/documentos" aria-label="Central de ajuda">${icon('help',21)}</a><details class="hub-profile"><summary><span class="hub-avatar">${esc(s.name.slice(0,1).toUpperCase())}</span><span>Administrador<small>${esc(s.name)}</small></span>${icon('chevron',15)}</summary><div class="hub-profile-pop"><a href="/montar?demo=${slug}">Personalizar igreja</a><a href="${url}">Site público</a><a href="/">Voltar à Elovia</a></div></details></div>
   </header>
   <div class="hub-search-results" id="hub-search-results" hidden><div class="hub-search-results-head">Resultados do catálogo <button type="button" id="hub-search-close">Fechar ✕</button></div><div id="hub-search-list">${allFeatures}</div><p id="hub-search-empty" hidden>Nenhum recurso encontrado.</p></div>
   <main class="hub-main">
    <section class="hub-welcome"><div><span class="hub-eyebrow">PAINEL DA SUA IGREJA · DEMONSTRAÇÃO</span><h1>Bom dia, ${esc(s.name)} <span class="hub-welcome-spark">👋</span></h1><p>Aqui está o resumo da sua igreja hoje.</p></div></section>
    <section class="hub-metrics" aria-label="Indicadores de demonstração">${stats.map(([ico,value,label])=>`<article class="hub-metric">${icon(ico,34)}<div><strong>${value}</strong><small>${label}</small></div></article>`).join('')}</section>
    <div class="hub-dashboard-main">
     <div class="hub-primary-column">
      <section class="hub-content-grid">
       <article class="hub-live card"><div class="hub-live-media"><span class="hub-live-label">EXEMPLO DE TRANSMISSÃO</span><a href="${url}/recurso/ao-vivo" class="hub-live-hit" aria-label="Explorar transmissões">${icon('play',34)}</a></div><div class="hub-live-info"><strong>Culto da Família</strong><small>Veja como uma transmissão aparece no painel</small></div></article>
       <article class="hub-events card"><div class="hub-card-head"><h2>${icon('calendar',20)} Próximos Eventos</h2><a href="${url}/recurso/eventos">Ver agenda ${icon('arrow',14)}</a></div><div class="hub-event-list">${sampleEvents.map(([day,mon,name,info])=>`<a href="${url}/recurso/eventos" class="hub-event"><span class="hub-date"><b>${day}</b><small>${mon}</small></span><div><strong>${name}</strong><small>${info}</small></div>${icon('chevron',15)}</a>`).join('')}</div></article>
       <article class="hub-sermon card"><div class="hub-card-head"><h2>Mensagem em Destaque</h2></div><a href="${url}/recurso/pregacoes" class="hub-sermon-media"><span>Firmes na Fé</span><small>Mensagem ilustrativa</small></a></article>
       <article class="hub-radio card"><div class="hub-card-head"><h2>${icon('headphones',20)} Rádio Central</h2><a href="${url}/recurso/radio" aria-label="Abrir rádio">${icon('external',15)}</a></div><div class="hub-radio-art"></div><div class="hub-radio-control"><a href="${url}/recurso/radio" aria-label="Explorar rádio">${icon('play',20)}</a><div class="hub-radio-track"><span></span></div>${icon('audio',18)}</div></article>
      </section>
      <section class="hub-actions card"><div class="hub-card-head"><h2>${icon('bolt',19)} Acesso Rápido</h2></div><div class="hub-quick-grid">${quick.map(([id,label,ico])=>`<a href="${id==='crm'?url+'/crm':id==='membros'?url+'/crm?view=people&new=membro':id==='visitantes'?url+'/crm?view=people&new=visitante':id==='eventos'?url+'/crm?view=events&new=events':url+'/recurso/'+id}">${icon(ico,27)}<small>${esc(label)}</small></a>`).join('')}</div></section>
      <section class="hub-categories card" id="todos-modulos"><div class="hub-card-head"><div><h2>${icon('layers',21)} Todos os módulos da plataforma</h2></div><button type="button" id="hub-expand-all">Gerenciar módulos ${icon('arrow',17)}</button></div><div class="hub-module-grid">${moduleCards}</div></section>
     </div>
     <aside class="hub-side-column">
      <section class="hub-calendar card"><div class="hub-card-head"><div><h2 id="hub-calendar-title">Novembro de 2026</h2></div><div class="hub-calendar-arrows"><button type="button" id="hub-prev-month" aria-label="Mês anterior">‹</button><button type="button" id="hub-next-month" aria-label="Próximo mês">›</button></div></div><div id="hub-calendar-grid" class="hub-calendar-grid"></div></section>
      <section class="hub-tasks card"><div class="hub-card-head"><h2>${icon('clipboard',19)} Tarefas da Equipe</h2></div>${['Confirmar escala de domingo','Publicar devocional da semana','Aprovar artes do próximo evento','Enviar comunicado aos membros'].map((task,i)=>`<label class="hub-task"><input type="checkbox" ${i===0?'checked':''}><span>${task}</span></label>`).join('')}<a class="hub-small-link" href="${url}/recurso/tarefas">Ver todas as tarefas ${icon('arrow',13)}</a></section>
      <section class="hub-links card"><div class="hub-card-head"><h2>${icon('link',19)} Links Úteis</h2></div><a href="${url}">${icon('monitor',17)} Página pública do site ${icon('external',14)}</a><a href="${url}/recurso/documentos">${icon('help',17)} Central de ajuda ${icon('external',14)}</a><a href="/montar?demo=${slug}">${icon('gear',17)} Personalizar igreja ${icon('external',14)}</a><a href="${url}/recurso/assistente-ia">${icon('bolt',17)} Novidades da plataforma ${icon('external',14)}</a></section>
     </aside>
    </div>
    <div class="hub-demo-caption">MODO DEMONSTRAÇÃO · Números, agenda e imagens ilustrativos. Módulos em desenvolvimento abrem telas de apresentação, sem operações reais.</div>
   </main>
  </div>
 </div></body></html>`;
}
