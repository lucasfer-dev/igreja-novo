(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const apiBase=document.body.dataset.crmApi;
const live=document.body.dataset.crmLive==='1';
const opts={kind:[['visitante','Visitante'],['membro','Membro']],stage:[['novo','Novo'],['contatado','Contatado'],['acompanhamento','Em acompanhamento'],['integrado','Integrado'],['inativo','Inativo']],channel:[['whatsapp','WhatsApp'],['telefone','Telefone'],['presencial','Presencial'],['email','E-mail'],['outro','Outro']],status:[['todo','Pendente'],['done','Concluída']],attendance:[['presente','Presente'],['ausente','Ausente']]};
const resources=['people','activities','tasks','events','groups','attendance'];
const names={people:'contato',activities:'acompanhamento',tasks:'tarefa',events:'evento',groups:'grupo',attendance:'presença'};
const headings={overview:['Visão geral','Acompanhe sua comunidade em um só lugar, com registros reais e organizados.'],people:['Pessoas e visitantes','Cadastre, segmente e acompanhe membros e novos visitantes.'],activities:['Acompanhamentos','Registre contatos, visitas e ações pastorais em cada jornada.'],tasks:['Tarefas e retornos','Organize pendências da equipe e não perca o próximo contato.'],events:['Agenda de eventos','Planeje encontros, cultos e atividades da comunidade.'],groups:['Grupos e ministérios','Organize grupos, ministérios e responsáveis.'],attendance:['Controle de presença','Registre quem participou dos eventos cadastrados.']};
let initialNew=new URLSearchParams(location.search).get('new');
const state={view:new URLSearchParams(location.search).get('view')||'overview',data:Object.fromEntries(resources.map(r=>[r,[]])),search:'',edit:null,filterKind:'todos',csrf:''};
if(!headings[state.view])state.view='overview';
function notice(msg,error=false){const n=$('#crm-feedback');n.textContent=msg;n.style.color=error?'#ee9e9e':'var(--accent)';}
async function api(path='',method='GET',payload){const res=await fetch(apiBase+path,{method,credentials:'same-origin',headers:{...(payload?{'Content-Type':'application/json'}:{}),...(state.csrf?{'X-CSRF-Token':state.csrf}:{})},body:payload?JSON.stringify(payload):undefined});let data;try{data=await res.json();}catch{throw new Error('Resposta inesperada do servidor');}if(!res.ok)throw new Error(data.error||'Não foi possível concluir a operação');return data;}
async function load(){
  try{
   if(live){const a=await fetch('/api/church/me',{credentials:'same-origin'});if(!a.ok){location.href='/igreja/entrar';return;}const me=await a.json();state.csrf=me.csrf;}
   const collections=await Promise.all(resources.map(r=>api('/'+r)));
   resources.forEach((r,i)=>{state.data[r]=collections[i].items;});
   updateStats();render();
   if(initialNew){const kind=initialNew;initialNew=null;const query=new URLSearchParams(location.search);query.delete('new');history.replaceState({},'',location.pathname+(query.size?'?'+query:''));if(kind==='membro'||kind==='visitante'){openForm('people','',{kind,stage:'novo'});}else if(definitions[kind])openForm(kind);}
  }catch(e){notice(e.message,true);$('#crm-workspace').innerHTML=`<div class="crm-empty"><strong>Não foi possível carregar o CRM</strong><p>${escapeHTML(e.message)}</p><button class="crm-outline" data-action="retry">Tentar novamente</button></div>`;}
}
function updateStats(){const a=state.data;$('#crm-stat-contacts').textContent=a.people.length;$('#crm-stat-visitors').textContent=a.people.filter(x=>x.kind==='visitante').length;$('#crm-stat-pending').textContent=a.tasks.filter(x=>x.status==='todo').length;$('#crm-stat-events').textContent=a.events.length;}
const personName=id=>state.data.people.find(x=>x.id===id)?.name||'—';
const eventName=id=>state.data.events.find(x=>x.id===id)?.title||'—';
function niceDate(v){if(!v)return 'Sem data';const [date]=v.split('T');const p=date.split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:v;}
const lower=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const filtered=(res,searchCols)=>state.data[res].filter(x=>!state.search||lower(searchCols.map(k=>x[k]||'').join(' ')).includes(lower(state.search)));
const button=(action,label,id='',cls='')=>`<button type="button" class="${cls}" data-action="${action}" data-resource="${escapeHTML(id?resourceForAction(action):'')}" data-id="${escapeHTML(id)}">${escapeHTML(label)}</button>`;
const resourceForAction=a=>({open:'people',convert:'people'})[a]||'';
const editDelete=(resource,id)=>`<div class="crm-row-actions"><button type="button" data-action="edit" data-resource="${resource}" data-id="${id}">Editar</button><button type="button" class="danger" data-action="delete" data-resource="${resource}" data-id="${id}">Excluir</button></div>`;
function empty(title,text,resource){return `<div class="crm-empty"><strong>${title}</strong><p>${text}</p><button type="button" class="crm-primary" data-action="new" data-resource="${resource}">+ Criar ${names[resource]}</button></div>`;}
function summaryPanel(title,content,to){return `<section class="crm-panel"><h2>${title}<button type="button" data-nav="${to}">Ver todos →</button></h2>${content}</section>`;}
function overview(){const a=state.data;
  const newest=a.people.slice(0,5).map(x=>`<div class="crm-list-item"><span class="crm-list-avatar">${escapeHTML(x.name.slice(0,1).toUpperCase())}</span><div class="crm-list-info"><strong>${escapeHTML(x.name)}</strong><small>${x.kind==='membro'?'Membro':'Visitante'} · ${escapeHTML(x.stage)}</small></div><button data-action="open" data-id="${x.id}">Ver</button></div>`).join('')||empty('Ainda não há contatos','Cadastre a primeira pessoa para iniciar os acompanhamentos.','people');
  const tasks=a.tasks.filter(x=>x.status==='todo').slice(0,5).map(x=>`<div class="crm-list-item"><div class="crm-list-info"><strong>${escapeHTML(x.title)}</strong><small>${x.due_at?'Prazo '+niceDate(x.due_at):'Sem prazo'} · ${escapeHTML(x.assigned_to||'Sem responsável')}</small></div><button data-action="done" data-id="${x.id}">Concluir</button></div>`).join('')||empty('Sem tarefas pendentes','Registre as próximas ações da equipe.','tasks');
  const ev=a.events.slice(0,5).map(x=>`<div class="crm-list-item"><div class="crm-list-info"><strong>${escapeHTML(x.title)}</strong><small>${niceDate(x.starts_at)} · ${escapeHTML(x.location||'Local a definir')}</small></div><button data-action="edit" data-resource="events" data-id="${x.id}">Editar</button></div>`).join('')||empty('Nenhum evento cadastrado','Adicione os encontros da igreja.','events');
 return `<div class="crm-grid">${summaryPanel('Pessoas recentes',newest,'people')}${summaryPanel('Próximos retornos',tasks,'tasks')}${summaryPanel('Eventos e cultos',ev,'events')}${summaryPanel('Movimentação do CRM',`<div class="crm-list-item"><div class="crm-list-info"><strong>${a.activities.length} acompanhamentos registrados</strong><small>Histórico de contatos realizados</small></div></div><div class="crm-list-item"><div class="crm-list-info"><strong>${a.groups.length} grupos ou ministérios</strong><small>Equipes organizadas no sistema</small></div></div><div class="crm-list-item"><div class="crm-list-info"><strong>${a.attendance.length} presenças registradas</strong><small>Participações em eventos</small></div></div>`,'activities')}</div>`;
}
function people(){let items=filtered('people',['name','kind','email','phone','stage','ministry']);if(state.filterKind!=='todos')items=items.filter(x=>x.kind===state.filterKind);
 const kindSelect=`<div class="crm-toolbar-actions" style="margin-bottom:17px"><button data-kind="todos" class="crm-outline">Todos (${state.data.people.length})</button><button data-kind="membro" class="crm-outline">Membros (${state.data.people.filter(x=>x.kind==='membro').length})</button><button data-kind="visitante" class="crm-outline">Visitantes (${state.data.people.filter(x=>x.kind==='visitante').length})</button></div>`;
 if(!items.length)return kindSelect+empty('Nenhuma pessoa encontrada','Cadastre membros e visitantes ou ajuste os filtros.','people');
 return kindSelect+`<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Nome</th><th>Tipo</th><th>Etapa</th><th>Contato</th><th>Ministério</th><th>Ações</th></tr></thead><tbody>${items.map(p=>`<tr><td><strong>${escapeHTML(p.name)}</strong><small>Cadastrado ${niceDate(p.created_at)}</small></td><td><span class="crm-badge ${p.kind==='membro'?'member':'visitor'}">${p.kind==='membro'?'Membro':'Visitante'}</span></td><td>${escapeHTML(p.stage)}</td><td>${escapeHTML(p.phone||p.email||'—')}</td><td>${escapeHTML(p.ministry||'—')}</td><td><div class="crm-row-actions"><button data-action="open" data-id="${p.id}">Histórico</button><button data-action="edit" data-resource="people" data-id="${p.id}">Editar</button><button class="danger" data-action="delete" data-resource="people" data-id="${p.id}">Excluir</button></div></td></tr>`).join('')}</tbody></table></div><div id="crm-person-detail"></div>`;
}
function details(id){const p=state.data.people.find(x=>x.id===id);if(!p)return;
 const acts=state.data.activities.filter(x=>x.person_id===id);
 const tasks=state.data.tasks.filter(x=>x.person_id===id);
 const el=$('#crm-person-detail');if(!el)return;
 el.innerHTML=`<section class="crm-panel crm-people-detail"><h2>${escapeHTML(p.name)} · Histórico de relacionamento <button data-action="close-detail">Fechar ✕</button></h2><p>${escapeHTML(p.phone||'Sem telefone')} · ${escapeHTML(p.email||'Sem e-mail')} · ${escapeHTML(p.stage)}</p><div class="crm-card-actions"><button data-action="new" data-resource="activities" data-person="${id}">+ Registrar contato</button><button data-action="new" data-resource="tasks" data-person="${id}">+ Criar retorno</button>${p.kind==='visitante'?`<button data-action="convert" data-id="${id}">Converter em membro</button>`:''}</div><h3 style="margin-top:23px">Últimas interações</h3>${acts.length?acts.map(x=>`<div class="crm-list-item"><div class="crm-list-info"><strong>${escapeHTML(x.summary)}</strong><small>${escapeHTML(x.channel)} · ${niceDate(x.occurred_at)}</small></div></div>`).join(''):'<p>Ainda não há interações registradas.</p>'}<h3 style="margin-top:23px">Tarefas relacionadas</h3>${tasks.length?tasks.map(x=>`<div class="crm-list-item"><div class="crm-list-info"><strong>${escapeHTML(x.title)}</strong><small>${x.status==='done'?'Concluída':'Pendente'} · ${niceDate(x.due_at)}</small></div></div>`).join(''):'<p>Não há tarefas vinculadas.</p>'}</section>`;el.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function activities(){const items=state.data.activities.filter(x=>!state.search||lower(personName(x.person_id)+' '+x.summary+' '+x.channel).includes(lower(state.search)));
 if(!items.length)return empty('Nenhum acompanhamento encontrado','Registre visitas, conversas ou contatos realizados.','activities');
 return `<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Pessoa</th><th>Canal</th><th>Registro</th><th>Quando</th><th>Ações</th></tr></thead><tbody>${items.map(x=>`<tr><td><strong>${escapeHTML(personName(x.person_id))}</strong></td><td>${escapeHTML(x.channel)}</td><td>${escapeHTML(x.summary)}</td><td>${niceDate(x.occurred_at)}</td><td>${editDelete('activities',x.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function tasks(){const items=filtered('tasks',['title','details','assigned_to']);
 return `<div class="crm-board">${[['todo','Pendentes'],['done','Concluídas']].map(([status,label])=>`<section class="crm-board-column"><h2>${label} · ${items.filter(x=>x.status===status).length}</h2>${items.filter(x=>x.status===status).map(t=>`<article class="crm-task-card"><strong>${escapeHTML(t.title)}</strong><small>${t.due_at?'Prazo: '+niceDate(t.due_at):'Sem prazo'} · ${escapeHTML(t.assigned_to||'Sem responsável')}</small>${t.person_id?`<small>Contato: ${escapeHTML(personName(t.person_id))}</small>`:''}<div class="crm-card-actions"><button data-action="${status==='todo'?'done':'undo'}" data-id="${t.id}">${status==='todo'?'Concluir':'Reabrir'}</button><button data-action="edit" data-resource="tasks" data-id="${t.id}">Editar</button><button data-action="delete" data-resource="tasks" data-id="${t.id}">Excluir</button></div></article>`).join('')||'<p class="crm-empty">Nenhum item aqui.</p>'}</section>`).join('')}</div>`;
}
function cards(resource,fields){const items=filtered(resource,fields);if(!items.length)return empty('Ainda não há registros nesta seção','Adicione o primeiro registro para organizar a comunidade.',resource);
 return `<div class="crm-card-grid">${items.map(x=>`<article class="crm-panel"><div class="crm-meta"><span>${resource==='events'?'EVENTO':'GRUPO / MINISTÉRIO'}</span></div><h2>${escapeHTML(x.title||x.name)}</h2><p>${escapeHTML(x.description||'Sem descrição')}</p><div class="crm-meta"><span>${resource==='events'?niceDate(x.starts_at)+' · '+escapeHTML(x.location||'Local não definido'):'Responsável: '+escapeHTML(x.leader||'A definir')}</span></div><div class="crm-card-actions">${resource==='events'?`<button data-action="new" data-resource="attendance" data-event="${x.id}">+ Presença</button>`:''}<button data-action="edit" data-resource="${resource}" data-id="${x.id}">Editar</button><button data-action="delete" data-resource="${resource}" data-id="${x.id}">Excluir</button></div></article>`).join('')}</div>`;
}
function attendance(){const items=state.data.attendance.filter(x=>!state.search||lower(personName(x.person_id)+' '+eventName(x.event_id)).includes(lower(state.search)));
 if(!items.length)return empty('Nenhuma presença registrada','Cadastre um evento e uma pessoa para registrar participações.','attendance');
 return `<div class="crm-table-wrap"><table class="crm-table"><thead><tr><th>Pessoa</th><th>Evento</th><th>Situação</th><th>Data de registro</th><th>Ações</th></tr></thead><tbody>${items.map(x=>`<tr><td>${escapeHTML(personName(x.person_id))}</td><td>${escapeHTML(eventName(x.event_id))}</td><td><span class="crm-badge ${x.status==='presente'?'member':'visitor'}">${escapeHTML(x.status)}</span></td><td>${niceDate(x.created_at)}</td><td>${editDelete('attendance',x.id)}</td></tr>`).join('')}</tbody></table></div>`;
}
function render(){if(!headings[state.view])state.view='overview';$('#crm-heading').textContent=headings[state.view][0];$('#crm-subtitle').textContent=headings[state.view][1];$$('[data-nav]').forEach(el=>{if(el.classList.contains('crm-primary'))return;if(el.dataset.nav===state.view)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
 const current={overview,people,activities,tasks,events:()=>cards('events',['title','location','description']),groups:()=>cards('groups',['name','leader','description']),attendance}[state.view];
 $('#crm-workspace').innerHTML=current();$('#crm-create').textContent={overview:'+ Novo contato',people:'+ Nova pessoa',activities:'+ Registrar contato',tasks:'+ Nova tarefa',events:'+ Novo evento',groups:'+ Novo grupo',attendance:'+ Registrar presença'}[state.view];
 $('#crm-export').hidden=state.view==='attendance';
}
function setView(v){if(!headings[v])return;state.view=v;state.search='';$('#crm-filter').value='';history.replaceState({},'',location.pathname+'?view='+encodeURIComponent(v));render();$('#crm-sidebar').classList.remove('is-open');window.scrollTo({top:0,behavior:'smooth'});}
const definitions={
 people:[['name','Nome completo','text',true],['kind','Tipo','select',true,opts.kind],['stage','Etapa do acompanhamento','select',true,opts.stage],['email','E-mail','email'],['phone','Telefone / WhatsApp','tel'],['ministry','Ministério / grupo','text'],['notes','Observações internas','textarea']],
 activities:[['person_id','Pessoa','people',true],['channel','Canal','select',true,opts.channel],['summary','Resumo do contato','textarea',true],['occurred_at','Data','datetime-local']],
 tasks:[['title','Tarefa','text',true],['details','Descrição','textarea'],['due_at','Prazo','date'],['status','Situação','select',true,opts.status],['assigned_to','Responsável','text'],['person_id','Pessoa relacionada (opcional)','people']],
 events:[['title','Título do evento','text',true],['starts_at','Data e horário','datetime-local'],['location','Local','text'],['description','Descrição','textarea']],
 groups:[['name','Nome do ministério ou grupo','text',true],['leader','Responsável','text'],['description','Descrição','textarea']],
 attendance:[['person_id','Pessoa','people',true],['event_id','Evento','events',true],['status','Situação','select',true,opts.attendance]]
};
function fieldMarkup([key,label,type,required,values],item){const value=String(item?.[key]??'');const title=escapeHTML(label)+(required?' *':'');const req=required?' required':'';
 let control='';
 if(type==='select'||type==='people'||type==='events'){
  const options=type==='people'?state.data.people.map(x=>[x.id,x.name]):type==='events'?state.data.events.map(x=>[x.id,x.title]):values;
  control=`<select name="${key}"${req}><option value="">${required?'Selecione':'Nenhum'}</option>${options.map(([v,l])=>`<option value="${escapeHTML(v)}" ${String(v)===value?'selected':''}>${escapeHTML(l)}</option>`).join('')}</select>`;
 }else if(type==='textarea')control=`<textarea name="${key}" maxlength="1800"${req}>${escapeHTML(value)}</textarea>`;
 else control=`<input type="${type}" name="${key}" value="${escapeHTML(type==='datetime-local'?value.substring(0,16):value)}"${req} maxlength="200">`;
 return `<label class="${type==='textarea'?'full':''}">${title}${control}</label>`;
}
function openForm(resource,id='',preselect={}){if(!definitions[resource])return;const item=id?state.data[resource].find(x=>x.id===id):{...preselect};if(id&&!item){notice('Registro não encontrado',true);return;}
 state.edit={resource,id};$('#crm-dialog-title').textContent=(id?'Editar ':'Novo ')+names[resource];$('#crm-form-fields').innerHTML=definitions[resource].map(d=>fieldMarkup(d,item)).join('');$('#crm-dialog').showModal();}
async function save(e){e.preventDefault();if(!state.edit)return;const form=$('#crm-form');if(!form.reportValidity())return;const {resource,id}=state.edit;const payload=Object.fromEntries(new FormData(form).entries());const button=$('#crm-save');button.disabled=true;button.textContent='Salvando...';try{await api('/'+resource+(id?'/'+id:''),id?'PATCH':'POST',payload);$('#crm-dialog').close();state.edit=null;await load();notice('Registro salvo com sucesso.');}catch(error){notice(error.message,true);}finally{button.disabled=false;button.textContent='Salvar registro';}}
async function deleteRecord(resource,id){if(!confirm('Excluir este registro? A ação não poderá ser desfeita.'))return;try{await api('/'+resource+'/'+id,'DELETE');await load();notice('Registro excluído.');}catch(e){notice(e.message,true);}}
async function updateOne(resource,id,changes){const item=state.data[resource].find(x=>x.id===id);if(!item)return;const payload=Object.fromEntries(definitions[resource].map(x=>[x[0],item[x[0]]??'']));Object.assign(payload,changes);try{await api('/'+resource+'/'+id,'PATCH',payload);await load();notice('Alteração salva.');}catch(e){notice(e.message,true);}}
async function seed(){if(!confirm('Adicionar registros fictícios a esta demonstração? Eles ficarão salvos até serem excluídos.'))return;try{await api('/seed','POST',{});await load();notice('Dados fictícios de exemplo adicionados.');}catch(e){notice(e.message,true);}}
document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){setView(nav.dataset.nav);return;}
 const kind=e.target.closest('[data-kind]');if(kind){state.filterKind=kind.dataset.kind;render();return;}
 const btn=e.target.closest('[data-action]');if(!btn)return;
 const act=btn.dataset.action,res=btn.dataset.resource,id=btn.dataset.id;
 if(act==='new'){openForm(res||({overview:'people',people:'people',activities:'activities',tasks:'tasks',events:'events',groups:'groups',attendance:'attendance'}[state.view]),'',{person_id:btn.dataset.person||'',event_id:btn.dataset.event||''});return;}
 if(act==='edit')openForm(res,id);
 if(act==='delete')deleteRecord(res,id);
 if(act==='open'){setView('people');details(id);}
 if(act==='close-detail'){$('#crm-person-detail')?.remove();}
 if(act==='convert')updateOne('people',id,{kind:'membro',stage:'integrado'});
 if(act==='done'||act==='undo')updateOne('tasks',id,{status:act==='done'?'done':'todo'});
 if(act==='retry')load();
});
$('#crm-create').addEventListener('click',()=>openForm(state.view==='overview'?'people':state.view));
$('#crm-filter').addEventListener('input',e=>{state.search=e.target.value.trim();render();});
$('#crm-export').addEventListener('click',()=>{location.href=apiBase+'/export/people';});
$('#crm-seed')?.addEventListener('click',seed);
$('#crm-form').addEventListener('submit',save);
$('#crm-close').addEventListener('click',()=>$('#crm-dialog').close());
$('#crm-cancel').addEventListener('click',()=>$('#crm-dialog').close());
$('#crm-menu-open').addEventListener('click',()=>$('#crm-sidebar').classList.add('is-open'));
$('#crm-menu-close').addEventListener('click',()=>$('#crm-sidebar').classList.remove('is-open'));
load();
})();
