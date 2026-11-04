import test from 'node:test';import assert from 'node:assert/strict';import {spawn} from 'node:child_process';import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
test('igrejas reais: provisionamento, recursos privados, isolamento, autorizações e site público',async t=>{
 const tmp=mkdtempSync(join(tmpdir(),'elovia-tenant-')),port=19000+Math.floor(Math.random()*10000),base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(tmp,'db.sqlite'),ADMIN_USER:'admin',ADMIN_PASSWORD:'a-strong-test-password-here'},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 const api=async(path,method='GET',data,cookie='',csrf='')=>{const r=await fetch(base+path,{method,headers:{...(data?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:data?JSON.stringify(data):undefined});const txt=await r.text();return {status:r.status,data:JSON.parse(txt),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 for(let i=0;i<100;i++){try{await fetch(base+'/api/catalog');break;}catch{await new Promise(r=>setTimeout(r,50));}}
 const admin=await api('/api/admin/login','POST',{username:'admin',password:'a-strong-test-password-here'});assert.equal(admin.status,200);
 const createOrder=async(name,modules)=>{const o=await api('/api/orders','POST',{church:name,contact:'Pessoa Teste',email:'pessoa@example.com',phone:'21999999999',city:'Rio de Janeiro',state:'RJ',template:'moderno',color:'#173d46',notes:'',module_ids:modules});assert.equal(o.status,201);return o.data.id;};
 const aId=await createOrder('Comunidade A',['site','eventos','membros','oracao','escalas']);const bId=await createOrder('Comunidade B',['site','eventos','membros']);
 const provision=async(order_id,slug)=>api('/api/admin/provision','POST',{order_id,slug,username:'pastor',password:'senha-forte-para-testes'},admin.cookie,admin.data.csrf);
 assert.equal((await provision(aId,'comunidade-a')).status,201);assert.equal((await provision(bId,'comunidade-b')).status,201);assert.equal((await provision(aId,'outra-a')).status,409);
 const login=async slug=>api('/api/church/login','POST',{slug,username:'pastor',password:'senha-forte-para-testes'});
 const a=await login('comunidade-a'),b=await login('comunidade-b');assert.equal(a.status,200);assert.equal(b.status,200);
 const insert=await api('/api/church/members','POST',{name:'Pessoa A',email:'a@example.com',phone:'21000000000',notes:'privado'},a.cookie,a.data.csrf);assert.equal(insert.status,201);
 const membersA=await api('/api/church/members','GET',undefined,a.cookie);assert.equal(membersA.data.items.length,1);
 assert.equal((await api('/api/church/members','GET',undefined,b.cookie)).data.items.length,0);

 const csvA=await fetch(base+'/api/church/members/export',{headers:{Cookie:a.cookie}});assert.equal(csvA.status,200);const exportedA=await csvA.text();assert.match(exportedA,/Pessoa A/);assert.match(exportedA,/a@example.com/);
 const csvB=await fetch(base+'/api/church/members/export',{headers:{Cookie:b.cookie}});assert.equal(csvB.status,200);assert.doesNotMatch(await csvB.text(),/Pessoa A/);
 assert.equal((await fetch(base+'/api/church/members/export')).status,401);

 assert.equal((await api('/api/church/members/'+insert.data.id,'DELETE',{},b.cookie,b.data.csrf)).status,404);
 assert.equal((await api('/api/church/members/'+insert.data.id,'DELETE',{},a.cookie)).status,403);
 assert.equal((await api('/api/church/events','POST',{title:'Culto A',starts_at:'2026-12-20 10:00',location:'Salão',description:'Boas-vindas'},a.cookie,a.data.csrf)).status,201);
 assert.equal((await api('/api/church/events','GET',undefined,b.cookie)).data.items.length,0);
 const publicSite=await fetch(base+'/igreja/comunidade-a').then(r=>r.text());assert.match(publicSite,/Culto A/);assert.doesNotMatch(publicSite,/Pessoa A/);
 assert.equal((await api('/api/public/comunidade-a/prayers','POST',{requester:'Visitante',message:'Pedido particular'})).status,201);
 assert.equal((await api('/api/public/comunidade-b/prayers','POST',{requester:'Visitante',message:'Pedido particular'})).status,404);
 assert.equal((await api('/api/church/prayers','GET',undefined,a.cookie)).data.items.length,1);
 assert.equal((await api('/api/church/events/'+insert.data.id,'DELETE',{},a.cookie,a.data.csrf)).status,404);
 const overview=await api('/api/church/overview','GET',undefined,a.cookie);
 assert.equal(overview.status,200);assert.equal(overview.data.counts.events,1);assert.equal(overview.data.counts.members,1);assert.equal(overview.data.pending,1);
 const overviewB=await api('/api/church/overview','GET',undefined,b.cookie);
 assert.equal(overviewB.data.counts.members,0);assert.equal(overviewB.data.counts.prayers,null);
 assert.equal((await api('/api/church/change-password','POST',{current_password:'wrong',new_password:'NewPassword123456789'},a.cookie,a.data.csrf)).status,403);
 assert.equal((await api('/api/church/change-password','POST',{current_password:'senha-forte-para-testes',new_password:'weak'},a.cookie,a.data.csrf)).status,400);
 const changed=await api('/api/church/change-password','POST',{current_password:'senha-forte-para-testes',new_password:'NewPassword123456789'},a.cookie,a.data.csrf);
 assert.equal(changed.status,200);assert.equal((await api('/api/church/me','GET',undefined,a.cookie)).status,401);
 assert.equal((await login('comunidade-a')).status,401);
 const loginNew=await api('/api/church/login','POST',{slug:'comunidade-a',username:'pastor',password:'NewPassword123456789'});assert.equal(loginNew.status,200);
 assert.equal((await api('/api/church/members/'+insert.data.id,'DELETE',{},loginNew.cookie,loginNew.data.csrf)).status,200);
 assert.equal((await api('/api/church/members','GET',undefined,loginNew.cookie)).data.items.length,0);
});
