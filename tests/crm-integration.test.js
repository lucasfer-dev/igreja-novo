import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const config=(template='moderno')=>({name:'Igreja Teste do CRM',headline:'Uma família',description:'Comunidade de teste',location:'Rio de Janeiro',template,color:'#dca64f',logo_data:'',modules:['site','eventos','oracao']});
const payloadPeople={name:'Mariana Teste',kind:'visitante',stage:'novo',email:'mariana@example.test',phone:'21900000000',ministry:'',notes:'Acompanhamento de teste'};
const setup=async(t)=>{
 const tmp=mkdtempSync(join(tmpdir(),'elovia-crm-'));
 const port=43000+Math.floor(Math.random()*1200),base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(tmp,'db.sqlite'),ADMIN_USER:'admin',ADMIN_PASSWORD:'senha-super-forte-para-testes'},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/montar')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,40));}
 assert.ok(ready,'servidor não iniciou');
 const api=async(path,method='GET',body,cookie='',csrf='')=>{const r=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 return {base,api};
};
test('CRM demonstração: pessoas, atividades, tarefas, grupos, eventos e presença têm CRUD e isolamento',async t=>{
 const {base,api}=await setup(t);
 const a=await api('/api/demo-sites','POST',config('moderno'));const b=await api('/api/demo-sites','POST',config('tradicional'));
 assert.equal(a.status,201);assert.equal(b.status,201);
 const idA=a.data.id,idB=b.data.id,apiA=`/api/demo/${idA}/crm`,apiB=`/api/demo/${idB}/crm`;
 for(const model of [a,b]){
  const page=await fetch(base+`/demo/${model.data.id}/crm`);assert.equal(page.status,200);
  const html=await page.text();assert.match(html,/Plataforma da igreja · Gestão e site/);
  assert.match(html,/crm.css/);assert.match(html,/crm-client.js/);
 }
 const seeded=await api(apiA+'/seed','POST',{});assert.equal(seeded.status,201);
 assert.equal((await api(apiA+'/seed','POST',{})).status,409,'seed deve ser idempotente');
 assert.equal((await api(apiA+'/people')).data.items.length,6);
 assert.equal((await api(apiB+'/people')).data.items.length,0,'demo B não pode ver a demo A');
 const created=await api(apiB+'/people','POST',payloadPeople);assert.equal(created.status,201);
 const pid=created.data.id;
 const modification=await api(apiA+'/people/'+pid,'PATCH',{...payloadPeople,name:'Tentativa indevida'});assert.equal(modification.status,404);
 const update=await api(apiB+'/people/'+pid,'PATCH',{...payloadPeople,kind:'membro',stage:'integrado'});assert.equal(update.status,200);
 assert.equal((await api(apiB+'/people')).data.items[0].stage,'integrado');
 const act=await api(apiB+'/activities','POST',{person_id:pid,channel:'whatsapp',summary:'Primeiro contato realizado',occurred_at:'2026-11-04T10:00'});assert.equal(act.status,201);
 assert.equal((await api(apiA+'/activities/'+act.data.id,'DELETE')).status,404);
 const task=await api(apiB+'/tasks','POST',{title:'Acompanhar pessoa',details:'Contato pastoral',due_at:'2026-11-20',status:'todo',assigned_to:'Secretaria',person_id:pid});assert.equal(task.status,201);
 const group=await api(apiB+'/groups','POST',{name:'Louvor',leader:'Pessoa',description:'Equipe de música'});assert.equal(group.status,201);
 const ev=await api(apiB+'/events','POST',{title:'Culto especial',starts_at:'2026-11-20T19:30',location:'Salão',description:'Teste'});assert.equal(ev.status,201);
 const publicDemo=await fetch(base+`/demo/${idB}`).then(r=>r.text());assert.match(publicDemo,/Culto especial/);
 const attend=await api(apiB+'/attendance','POST',{person_id:pid,event_id:ev.data.id,status:'presente'});assert.equal(attend.status,201);
 assert.equal((await api(apiB+'/attendance')).data.items.length,1);
 assert.equal((await api(apiB+'/attendance','POST',{person_id:pid,event_id:ev.data.id,status:'presente'})).status,409);
 const otherPerson=(await api(apiA+'/people')).data.items[0].id;
 assert.equal((await api(apiB+'/attendance','POST',{person_id:otherPerson,event_id:ev.data.id,status:'presente'})).status,404);
 const summary=await api(apiB+'/summary');assert.equal(summary.status,200);assert.equal(summary.data.members,1);assert.equal(summary.data.pending,1);assert.equal(summary.data.events,1);
 const csv=await fetch(base+apiB+'/export/people');assert.equal(csv.status,200);assert.match(await csv.text(),/Mariana Teste/);
 assert.equal((await api(apiB+'/people/'+pid,'DELETE')).status,200);
 assert.equal((await api(apiB+'/activities')).data.items.length,0,'a atividade deve acompanhar o relacionamento excluído');
 assert.equal((await api(apiB+'/attendance')).data.items.length,0,'a presença deve respeitar remoção da pessoa');
 assert.equal((await api(apiB+'/tasks/'+task.data.id,'DELETE')).status,200);
 assert.equal((await api(apiB+'/events/'+ev.data.id,'DELETE')).status,200);
 assert.equal((await api(apiB+'/groups/'+group.data.id,'DELETE')).status,200);
 assert.equal((await api(apiB+'/people')).data.items.length,0);
 assert.equal((await api('/api/demo/'+'0'.repeat(40)+'/crm/people')).status,404);
});

test('CRM da igreja: login, CSRF, controle de módulos, temas e isolamento entre igrejas',async t=>{
 const {base,api}=await setup(t);
 const orderPayload=(name,template,mods)=>({church:name,contact:'Pastor teste',email:'teste@igreja.test',phone:'21999999999',city:'Rio de Janeiro',state:'RJ',notes:'',template,color:'#dca64f',module_ids:mods});
 const orderA=await api('/api/orders','POST',orderPayload('Igreja A','moderno',['site','membros','eventos']));
 const orderB=await api('/api/orders','POST',orderPayload('Igreja B','tradicional',['site','membros']));
 const orderC=await api('/api/orders','POST',orderPayload('Igreja C','minimalista',['site']));
 for(const order of [orderA,orderB,orderC])assert.equal(order.status,201);
 const admin=await api('/api/admin/login','POST',{username:'admin',password:'senha-super-forte-para-testes'});
 assert.equal(admin.status,200);
 for(const [order,slug] of [[orderA,'igreja-crm-a'],[orderB,'igreja-crm-b'],[orderC,'igreja-crm-c']]){
  const pro=await api('/api/admin/provision','POST',{order_id:order.data.id,slug,username:'pastor',password:'senha-de-teste-forte-123'},admin.cookie,admin.data.csrf);
  assert.equal(pro.status,201);
 }
 const login=async slug=>api('/api/church/login','POST',{slug,username:'pastor',password:'senha-de-teste-forte-123'});
 const a=await login('igreja-crm-a'),b=await login('igreja-crm-b'),c=await login('igreja-crm-c');
 for(const item of [a,b,c])assert.equal(item.status,200);
 assert.equal((await fetch(base+'/igreja/crm')).status,401);
 assert.equal((await fetch(base+'/igreja/crm',{headers:{Cookie:a.cookie}})).status,200);
 const bPage=await fetch(base+'/igreja/crm',{headers:{Cookie:b.cookie}}).then(r=>r.text());assert.match(bPage,/crm-style-moderno crm-unified/);
 assert.equal((await fetch(base+'/igreja/crm',{headers:{Cookie:c.cookie}})).status,403);
 const path='/api/church/crm';
 assert.equal((await api(path+'/people','POST',payloadPeople,a.cookie)).status,403,'CSRF obrigatório');
 assert.equal((await api(path+'/people','POST',payloadPeople,c.cookie,c.data.csrf)).status,403,'módulo precisa estar ativo');
 const added=await api(path+'/people','POST',payloadPeople,a.cookie,a.data.csrf);assert.equal(added.status,201);
 assert.equal((await api(path+'/people','GET',undefined,b.cookie)).data.items.length,0);
 assert.equal((await api(path+'/people/'+added.data.id,'DELETE',{},b.cookie,b.data.csrf)).status,404);
 assert.equal((await api(path+'/events','GET',undefined,b.cookie)).status,403,'eventos exigem módulo contratado');
 const ev=await api(path+'/events','POST',{title:'Reunião',starts_at:'2026-11-20T18:00',location:'Sala',description:'Encontro'},a.cookie,a.data.csrf);assert.equal(ev.status,201);
 assert.equal((await api(path+'/events','GET',undefined,a.cookie)).data.items.length,1);
 assert.equal((await api('/api/church/events','GET',undefined,a.cookie)).data.items.length,1,'evento do CRM deve aparecer na agenda antiga');
 const member=await api(path+'/people','POST',{...payloadPeople,name:'Novo Membro',kind:'membro',stage:'integrado'},a.cookie,a.data.csrf);assert.equal(member.status,201);
 assert.ok((await api('/api/church/members','GET',undefined,a.cookie)).data.items.some(x=>x.name==='Novo Membro'),'membro do CRM aparece no painel anterior');
 const legacy=await api('/api/church/members','POST',{name:'Membro do Painel Antigo',email:'antigo@igreja.test',phone:'21999999990',notes:''},a.cookie,a.data.csrf);assert.equal(legacy.status,201);
 assert.ok((await api(path+'/people','GET',undefined,a.cookie)).data.items.some(x=>x.name==='Membro do Painel Antigo'),'membro antigo aparece no CRM');
 const exp=await fetch(base+path+'/export/people',{headers:{Cookie:a.cookie}});assert.equal(exp.status,200);assert.match(await exp.text(),/Mariana Teste/);
 assert.equal((await fetch(base+path+'/export/people')).status,401);
});
