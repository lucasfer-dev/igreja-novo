import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
const tmp=mkdtempSync(join(tmpdir(),'elovia-test-'));const port=18000+Math.floor(Math.random()*10000);
const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(tmp,'db.sqlite'),ADMIN_USER:'tester',ADMIN_PASSWORD:'strong-password-for-tests'},stdio:'ignore'});
const base=`http://127.0.0.1:${port}`;
async function call(path,method='GET',data,cookie='',csrf=''){const r=await fetch(base+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:data?JSON.stringify(data):undefined});return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
async function ready(){for(let i=0;i<80;i++){try{await fetch(base+'/api/catalog');return;}catch{await new Promise(r=>setTimeout(r,50));}}throw Error('Server not ready');}
test('fluxo completo: orçamento → pedido → admin → acompanhamento + preços',async t=>{t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});await ready();
 let catalog=(await call('/api/catalog')).json;assert.equal(catalog.modules.length,5);assert.equal(catalog.base_cents,3900);
 let q=await call('/api/quote','POST',{module_ids:['membros','eventos']});assert.equal(q.status,200);assert.equal(q.json.total_cents,11300);
 const order={church:'Comunidade Teste',contact:'Maria Teste',email:'maria@example.com',phone:'21999999999',city:'Rio de Janeiro',state:'RJ',notes:'Teste',template:'moderno',color:'#173d46',module_ids:['membros','eventos']};
 let created=await call('/api/orders','POST',order);assert.equal(created.status,201);assert.equal(created.json.total_cents,11300);
 let track=await call('/api/track','POST',{id:created.json.id,key:created.json.key});assert.equal(track.json.order.status,'recebido');
 assert.equal((await call('/api/track','POST',{id:created.json.id,key:'x'.repeat(48)})).status,404);
 assert.equal((await call('/api/admin/orders')).status,401);
 let login=await call('/api/admin/login','POST',{username:'tester',password:'strong-password-for-tests'});assert.equal(login.status,200);
 let {cookie}=login,csrf=login.json.csrf;
 assert.equal((await call('/api/admin/settings','PATCH',{base_cents:5000,setup_cents:45000},cookie)).status,403);
 assert.equal((await call('/api/admin/orders/'+created.json.id+'/status','POST',{status:'entregue'},cookie,csrf)).status,400);
 assert.equal((await call('/api/admin/orders/'+created.json.id+'/status','POST',{status:'aguardando_materiais',note:'Enviamos orientações'},cookie,csrf)).status,200);
 track=await call('/api/track','POST',{id:created.json.id,key:created.json.key});assert.equal(track.json.order.status,'aguardando_materiais');assert.equal(track.json.history.length,2);
 assert.equal((await call('/api/admin/settings','PATCH',{base_cents:5000,setup_cents:45000},cookie,csrf)).status,200);
 assert.equal((await call('/api/admin/modules/membros','PATCH',{name:'Gestão de membros',description:'Novo texto',price_cents:6900,active:true},cookie,csrf)).status,200);
 q=await call('/api/quote','POST',{module_ids:['membros','eventos']});assert.equal(q.json.total_cents,13400);
 track=await call('/api/track','POST',{id:created.json.id,key:created.json.key});assert.equal(track.json.order.total_cents,11300);
 assert.equal((await call('/api/quote','POST',{module_ids:['inventado']})).status,400);
 assert.equal((await call('/api/quote','POST',{module_ids:['financeiro']})).status,400);
 assert.equal((await call('/api/orders','POST',{...order,module_ids:['financeiro']})).status,400);
});
