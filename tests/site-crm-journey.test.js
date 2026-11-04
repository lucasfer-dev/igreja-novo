import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

async function launch(t){
 const tmp=mkdtempSync(join(tmpdir(),'elovia-journey-'));
 const port=51000+Math.floor(Math.random()*1200),base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(tmp,'elovia.sqlite'),ADMIN_USER:'admin',ADMIN_PASSWORD:'senha-forte-teste-de-CRM'},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(base+'/montar')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,35));}
 assert.ok(ready,'servidor deve iniciar');
 const call=async(path,method='GET',data,cookie='',csrf='')=>{
  const response=await fetch(base+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{})},body:data?JSON.stringify(data):undefined});
  return {code:response.status,value:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
 };
 return {base,call};
}
const visitor={name:'Pessoa Visitante',email:'pessoa.teste@example.test',phone:'21900000000',message:'Gostaria de conhecer a igreja',consent:true,website:''};
const demoConfig=(template)=>({name:'Igreja para teste',template,headline:'Um lugar para pertencer',description:'Acolhimento e fé',location:'RJ',color:'#dca64f',logo_data:'',modules:['site','eventos','membros']});

test('site institucional -> CRM: visitante cria contato, atividade, tarefa e consentimento isolados',async t=>{
 const {base,call}=await launch(t);
 const a=await call('/api/demo-sites','POST',demoConfig('moderno'));
 const b=await call('/api/demo-sites','POST',demoConfig('tradicional'));
 assert.equal(a.code,201);assert.equal(b.code,201);
 const route=`/api/demo/${a.value.id}/visitors`,bRoute=`/api/demo/${b.value.id}/visitors`;
 const site=await fetch(base+a.value.url).then(r=>r.text());
 assert.match(site,/Sou novo aqui/);assert.match(site,/id="public-visitor"/);
 assert.match(site,/Equipe de recepção|equipe de recepção/);
 assert.doesNotMatch(site,/Referência: R\$|Solicitar desbloqueio/);
 const unconsented=await call(route,'POST',{...visitor,consent:false});assert.equal(unconsented.code,400);
 const noContact=await call(route,'POST',{...visitor,email:'',phone:''});assert.equal(noContact.code,400);
 const valid=await call(route,'POST',visitor);assert.equal(valid.code,201);assert.equal(valid.value.ok,true);
 const people=(await call(`/api/demo/${a.value.id}/crm/people`)).value.items;
 assert.equal(people.length,1);assert.equal(people[0].kind,'visitante');assert.equal(people[0].stage,'novo');
 const tasks=(await call(`/api/demo/${a.value.id}/crm/tasks`)).value.items;
 assert.equal(tasks.length,1);assert.equal(tasks[0].person_id,people[0].id);assert.match(tasks[0].title,/Acolher visitante/);
 const acts=(await call(`/api/demo/${a.value.id}/crm/activities`)).value.items;
 assert.equal(acts.length,1);assert.equal(acts[0].person_id,people[0].id);
 assert.equal((await call(route,'POST',visitor)).code,201);
 assert.equal((await call(`/api/demo/${a.value.id}/crm/people`)).value.items.length,1,'não deve duplicar visitante');
 assert.equal((await call(`/api/demo/${a.value.id}/crm/tasks`)).value.items.length,1,'não deve abrir tarefas duplicadas');
 assert.equal((await call(`/api/demo/${b.value.id}/crm/people`)).value.items.length,0);
 assert.equal((await call(`/api/demo/${'0'.repeat(40)}/visitors`,'POST',visitor)).code,404);
 assert.equal((await call(bRoute,'POST',visitor)).code,201);
 assert.equal((await call(`/api/demo/${b.value.id}/crm/people`)).value.items.length,1);
});

test('igreja real: cadastro público só existe com site + CRM habilitados, com escopo privado',async t=>{
 const {base,call}=await launch(t);
 const order=async(template,slug,modules)=>{
  const x=await call('/api/orders','POST',{church:slug,contact:'Pessoa Responsável',email:'responsavel@exemplo.test',phone:'21999999999',city:'RJ',state:'RJ',notes:'',template,color:'#c49b64',module_ids:modules});assert.equal(x.code,201);return x.value;
 };
 const oa=await order('moderno','Igreja A',['site','membros']);
 const ob=await order('tradicional','Igreja B',['site']);
 const admin=await call('/api/admin/login','POST',{username:'admin',password:'senha-forte-teste-de-CRM'});assert.equal(admin.code,200);
 for(const [o,slug] of [[oa,'igreja-visitante-a'],[ob,'igreja-visitante-b']]){
  const created=await call('/api/admin/provision','POST',{order_id:o.id,slug,username:'pastor',password:'senha-forte-pastor-123'},admin.cookie,admin.value.csrf);assert.equal(created.code,201);
 }
 const pageA=await fetch(base+'/igreja/igreja-visitante-a').then(r=>r.text());
 const pageB=await fetch(base+'/igreja/igreja-visitante-b').then(r=>r.text());
 assert.match(pageA,/id="public-visitor"/);assert.doesNotMatch(pageB,/id="public-visitor"/);
 assert.equal((await call('/api/public/igreja-visitante-b/visitors','POST',visitor)).code,404);
 assert.equal((await call('/api/public/igreja-visitante-a/visitors','POST',visitor)).code,201);
 const church=await call('/api/church/login','POST',{slug:'igreja-visitante-a',username:'pastor',password:'senha-forte-pastor-123'});assert.equal(church.code,200);
 const list=await call('/api/church/crm/people','GET',undefined,church.cookie);assert.equal(list.code,200);assert.equal(list.value.items.length,1);
 const tasks=await call('/api/church/crm/tasks','GET',undefined,church.cookie);assert.equal(tasks.code,200);assert.equal(tasks.value.items.length,1);
 assert.equal((await call('/api/church/crm/people')).code,401,'dados não são públicos');
});
