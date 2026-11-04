(()=>{
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const sidebar=$('#hub-sidebar'), toggle=$('#hub-menu-toggle');
 const closeNav=()=>{sidebar.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Abrir menu');};
 toggle?.addEventListener('click',()=>{const open=sidebar.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
 $('#hub-sidebar-close')?.addEventListener('click',closeNav);
 document.addEventListener('click',e=>{if(sidebar.classList.contains('is-open')&&!sidebar.contains(e.target)&&!toggle?.contains(e.target))closeNav();});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNav();$('#hub-search-results').hidden=true;}});
 const search=$('#hub-search-input'),results=$('#hub-search-results'),empty=$('#hub-search-empty');
 function filter(){const term=search.value.trim().toLocaleLowerCase('pt-BR');results.hidden=!term;let count=0;$$('#hub-search-list [data-search]').forEach(link=>{const match=link.dataset.search.includes(term);link.hidden=!match;if(match)count++;});empty.hidden=count!==0;}
 search?.addEventListener('input',filter);
 $('#hub-search-close')?.addEventListener('click',()=>{results.hidden=true;search.value='';});
 $$('[data-expand]').forEach(btn=>btn.addEventListener('click',()=>{const group=document.querySelector(`[data-group="${btn.dataset.expand}"]`);if(group){group.open=true;sidebar.classList.add('is-open');toggle?.setAttribute('aria-expanded','true');group.scrollIntoView({block:'center',behavior:'smooth'});}}));
 $('#hub-expand-all')?.addEventListener('click',()=>{$$('.hub-menu-group').forEach(x=>x.open=true);sidebar.classList.add('is-open');toggle?.setAttribute('aria-expanded','true');sidebar.scrollTo({top:0,behavior:'smooth'});});
 let year=2026,month=10;
 const monthLabel=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'});
 function calendar(){const start=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),offset=start.getDay();$('#hub-calendar-title').textContent=monthLabel.format(start).replace(/^./,x=>x.toUpperCase());const grid=$('#hub-calendar-grid');grid.replaceChildren();'DSTQQSS'.split('').forEach(x=>{const day=document.createElement('b');day.className='hub-weekday';day.textContent=x;grid.append(day);});for(let i=0;i<offset;i++){grid.append(document.createElement('span'));}for(let day=1;day<=days;day++){const cell=document.createElement('span');cell.textContent=day;if(month===10&&year===2026&&[12,14,21].includes(day))cell.className='has-event';grid.append(cell);}}
 $('#hub-prev-month')?.addEventListener('click',()=>{month--;if(month<0){month=11;year--;}calendar();});
 $('#hub-next-month')?.addEventListener('click',()=>{month++;if(month>11){month=0;year++;}calendar();});
 calendar();
 // Atualiza os indicadores do HUB com registros reais do CRM da mesma demonstração.
 const route=location.pathname.match(/^\/demo\/([0-9a-f]{40})\/hub$/);
 if(route){
   const id=route[1],crm=`/demo/${id}/crm`;
   const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
   fetch(`/api/demo/${id}/crm/summary`,{credentials:'same-origin'}).then(r=>r.ok?r.json():null).then(data=>{
      if(!data)return;
      const metricBoxes=$$('.hub-metric, .th-metric');
      const values=metricBoxes.map(b=>b.querySelector('strong'));
      if(values.length===6){values[0].textContent=data.members;values[1].textContent=data.visitors;values[2].textContent=data.events;}
      if(values.length===5){values[0].textContent=data.members;values[1].textContent=data.visitors;values[2].textContent=data.events;}
      const events=$('.hub-event-list, .th-event-list');
      if(events&&data.upcoming_events.length){
        events.replaceChildren();
        data.upcoming_events.forEach(ev=>{
          const a=document.createElement('a');a.href=crm+'?view=events';a.className=events.classList.contains('th-event-list')?'th-event':'hub-event';
          const d=(ev.starts_at||'').split('T')[0].split('-');const day=d.length===3?d[2]:'—',mon=d.length===3?new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(new Date(Number(d[0]),Number(d[1])-1,1)).toUpperCase():'—';
          const tile=document.createElement(events.classList.contains('th-event-list')?'time':'span');tile.className=events.classList.contains('th-event-list')?'':'hub-date';
          const b=document.createElement('b');b.textContent=day;const small=document.createElement('small');small.textContent=mon;tile.append(b,small);
          const wrap=document.createElement(events.classList.contains('th-event-list')?'span':'div');const title=document.createElement('strong');title.textContent=ev.title;const sub=document.createElement('small');sub.textContent=(ev.starts_at||'').split('T')[1]||ev.location||'Evento da igreja';wrap.append(title,sub);a.append(tile,wrap);events.append(a);
        });
      }
      if(data.tasks.length){
        const parent=$('.hub-tasks, .th-tasks');
        if(parent){
          parent.querySelectorAll('.hub-task').forEach(x=>x.remove());
          const heading=parent.querySelector('.hub-card-head, .th-card-head');
          for(const task of data.tasks){const label=document.createElement('label');label.className='hub-task';const input=document.createElement('input');input.type='checkbox';const text=document.createElement('span');text.textContent=task.title;
            input.addEventListener('change',async()=>{input.disabled=true;try{const payload={title:task.title,details:task.details,due_at:task.due_at,status:input.checked?'done':'todo',assigned_to:task.assigned_to,person_id:task.person_id};const res=await fetch(`/api/demo/${id}/crm/tasks/${task.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});if(!res.ok)throw new Error('Não foi possível salvar');label.remove();}catch{input.checked=false;alert('Não foi possível salvar a tarefa.')}finally{input.disabled=false;}});
            label.append(input,text);heading?.after(label);
          }
        }
      }
   }).catch(()=>{});
 }
})();
