import {normalizeSite} from './site-renderer.js';
import {featureGroups,featureCatalog} from './feature-catalog.js';
import {icon} from './hub-icons.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categoryIcons=['monitor','users','church','chat','radio','book','wallet','calendar','bolt','image'];
export function renderCRM(raw,{demoId='',live=false}={}){
 const s=normalizeSite(raw),isTraditional=s.template==='tradicional';
 const base=live?'/igreja/painel':`/demo/${encodeURIComponent(demoId)}`;
 const hubLink=live?'/igreja/painel':base+'/hub';
 const api=live?'/api/church/crm':`/api/demo/${encodeURIComponent(demoId)}/crm`;
 const logo=s.logo_data?`<img src="${esc(s.logo_data)}" alt="Logotipo de ${esc(s.name)}">`:`<span class="crm-logo-icon">${icon(isTraditional?'church':'bird',30)}</span>`;
 const categoryNav=featureGroups.map((c,i)=>{
  const main=['Gestão de membros e visitantes','Ministérios e organização dos cultos','Eventos e inscrições','Administração e patrimônio'].includes(c);
  const categoryLink=main?`<button type="button" data-nav="${i===1?'groups':i===2?'events':i===3?'tasks':'people'}">${icon(categoryIcons[i],18)}<span>${esc(c)}</span></button>`:
   `<details><summary>${icon(categoryIcons[i],18)}<span>${esc(c)}</span>${icon('chevron',13)}</summary><div>${featureCatalog.filter(f=>f.category===c).map(f=>`<a href="${live?'/igreja/painel':base+'/recurso/'+encodeURIComponent(f.id)}">${esc(f.name)}</a>`).join('')}</div></details>`;
  return categoryLink;
 }).join('');
 const tabs=[['overview','Visão geral','home'],['people','Pessoas e visitantes','users'],['activities','Acompanhamentos','chat'],['tasks','Tarefas e retornos','clipboard'],['events','Eventos','calendar'],['groups','Grupos e ministérios','church'],['attendance','Presença','checkcircle']];
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="${isTraditional?'#392419':'#06121f'}"><meta name="description" content="CRM de gestão de membros, visitantes e acompanhamento da igreja"><title>CRM · ${esc(s.name)} · Elovia</title><link rel="stylesheet" href="/crm.css"><script src="/crm-client.js" defer></script></head>
 <body class="crm-style-${esc(s.template)}" style="--crm-accent:${esc(s.color)}" data-crm-api="${esc(api)}" data-crm-live="${live?'1':'0'}">
 <div class="crm-shell">
  <aside class="crm-sidebar" id="crm-sidebar">
   <div class="crm-identity">${logo}<div><strong>${esc(s.name)}</strong><small>${esc(s.location||'Plataforma da igreja')}</small></div><button type="button" id="crm-menu-close" class="crm-mobile-close" aria-label="Fechar menu">✕</button></div>
   <div class="crm-side-scroll"><div class="crm-side-label">ESPAÇO DE TRABALHO</div><a class="crm-side-item" href="${hubLink}">${icon('home',19)}<span>Hub da igreja</span></a><div class="crm-side-item crm-side-active">${icon('users',19)}<span>CRM de pessoas</span></div>
   <nav class="crm-tabs" aria-label="Seções do CRM">${tabs.map(([id,label,ico])=>`<button type="button" data-nav="${id}" ${id==='overview'?'aria-current="page"':''}>${icon(ico,17)}<span>${label}</span></button>`).join('')}</nav>
   <div class="crm-side-label crm-side-label-extra">MÓDULOS DA PLATAFORMA</div><nav class="crm-categories" aria-label="Outros recursos da igreja">${categoryNav}</nav></div>
   <div class="crm-side-footer"><span class="crm-live-indicator">● ${live?'Área autenticada':'Demonstração com dados de teste'}</span><a href="${hubLink}">← Voltar ao Hub</a></div>
  </aside>
  <div class="crm-main-column"><header class="crm-topbar"><button type="button" id="crm-menu-open" class="crm-menu-toggle" aria-label="Abrir menu">${icon('menu',21)}</button><div class="crm-topbar-title"><small>PLATAFORMA DA IGREJA</small><strong>CRM · Relacionamento e cuidado</strong></div><div class="crm-topbar-right"><span class="crm-topbar-mode">${live?'Ambiente da igreja':'Modo demonstração'}</span><a class="crm-view-site" href="${live?'/igreja/painel':base}">${icon('external',15)} ${live?'Painel':'Ver site'}</a><span class="crm-topbar-avatar">${esc(s.name.slice(0,1).toUpperCase())}</span></div></header>
  <main class="crm-main"><div class="crm-page-heading"><div><span class="crm-eyebrow">PESSOAS · COMUNIDADE · ORGANIZAÇÃO</span><h1 id="crm-heading">Visão geral</h1><p id="crm-subtitle">Acompanhe sua comunidade em um só lugar, com registros reais e organizados.</p></div><button type="button" class="crm-primary" id="crm-create">+ Novo contato</button></div>
  <div class="crm-alert" role="note">${live?'Os registros são privados, vinculados à sua igreja e acessíveis apenas a usuários autenticados.':'Ambiente de teste: os dados ficam salvos nesta demonstração local. Não use informações pessoais reais aqui.'}</div>
  <section class="crm-stats" aria-label="Indicadores reais do CRM"><article><span>${icon('users',26)}</span><div><strong id="crm-stat-contacts">0</strong><small>Contatos cadastrados</small></div></article><article><span>${icon('userplus',26)}</span><div><strong id="crm-stat-visitors">0</strong><small>Visitantes</small></div></article><article><span>${icon('clipboard',26)}</span><div><strong id="crm-stat-pending">0</strong><small>Tarefas pendentes</small></div></article><article><span>${icon('calendar',26)}</span><div><strong id="crm-stat-events">0</strong><small>Eventos cadastrados</small></div></article></section>
  <div class="crm-toolbar"><div class="crm-toolbar-search">${icon('search',18)}<input type="search" id="crm-filter" placeholder="Buscar nesta seção..." aria-label="Pesquisar registros"></div><div class="crm-toolbar-actions"><button type="button" id="crm-export" class="crm-outline">${icon('file',16)} Exportar contatos CSV</button>${live?'':`<button type="button" id="crm-seed" class="crm-outline">Popular dados fictícios</button>`}</div></div>
  <div id="crm-feedback" role="status" aria-live="polite"></div><div id="crm-workspace" aria-live="polite"><div class="crm-loading">Carregando dados do CRM...</div></div>
  <footer class="crm-footer">Elovia CRM · ${esc(s.name)} · ${live?'Acesso restrito':'Demonstração local, sem cobrança'}</footer>
  </main></div></div>
  <dialog class="crm-dialog" id="crm-dialog"><form id="crm-form"><div class="crm-dialog-heading"><div><small>CADASTRO E ORGANIZAÇÃO</small><h2 id="crm-dialog-title">Novo registro</h2></div><button type="button" id="crm-close" aria-label="Fechar formulário">✕</button></div><div id="crm-form-fields" class="crm-fields"></div><div class="crm-dialog-actions"><button type="button" id="crm-cancel" class="crm-outline">Cancelar</button><button class="crm-primary" type="submit" id="crm-save">Salvar registro</button></div></form></dialog>
 </body></html>`;
}
