import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {featureCatalog} from '../feature-catalog.js';
import {renderChurchSite} from '../site-renderer.js';

test('site institucional não exibe o catálogo comercial; funcionalidades pertencem à administração',()=>{
 assert.equal(featureCatalog.length,74);
 for(const model of ['moderno','tradicional','minimalista','transmissoes','futurista','personalizado']){
  const base={name:'Igreja Exemplo',template:model,color:'#1485d7',modules:['site','eventos','membros']};
  const preview=renderChurchSite(base,{preview:true});
  assert.match(preview,new RegExp(`cs-theme-${model}`));
  assert.match(preview,/Recepção de visitantes/);
  assert.doesNotMatch(preview,/Rede social interna da igreja|Escolher no catálogo|Solicitar desbloqueio/);
  const visitor=renderChurchSite(base);
  assert.match(visitor,/id="public-visitor"/);
  assert.match(visitor,/Sou novo aqui/);
  assert.doesNotMatch(visitor,/Rede social interna da igreja|Solicitar desbloqueio|Referência: R\$/);
  const owner=renderChurchSite(base,{owner:true});
  assert.doesNotMatch(owner,/Solicitar desbloqueio|data-upgrade-feature=/);
 }
});

test('upgrade exige autenticação, CSRF e não ativa módulo automaticamente',async t=>{
 const temp=mkdtempSync(join(tmpdir(),'elovia-upgrade-'));
 const port=34000+Math.floor(Math.random()*5000);
 const base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(temp,'test.sqlite'),ADMIN_USER:'admin',ADMIN_PASSWORD:'password-strong-test-value'},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(temp,{recursive:true,force:true});});
 for(let n=0;n<90;n++){try{if((await fetch(base+'/api/catalog')).ok)break;}catch{}await new Promise(r=>setTimeout(r,40));}
 const call=async(path,body,cookie,csrf,method='POST')=>{
  const r=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:body?JSON.stringify(body):undefined});
  return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};
 };
 const order=await call('/api/orders',{church:'Igreja Teste',contact:'Pessoa de Teste',email:'test@example.com',phone:'21999999999',city:'Rio de Janeiro',state:'RJ',notes:'',template:'futurista',color:'#2589c1',module_ids:['site']});
 assert.equal(order.status,201);
 const a=await call('/api/admin/login',{username:'admin',password:'password-strong-test-value'});
 assert.equal(a.status,200);
 const provision=await call('/api/admin/provision',{order_id:order.data.id,slug:'igreja-teste-upgrades',username:'pastor',password:'uma-senha-segura-123'},a.cookie,a.data.csrf);
 assert.equal(provision.status,201);
 const unauth=await call('/api/church/upgrade-requests',{module_id:'eventos'});assert.equal(unauth.status,401);
 const churchLogin=await call('/api/church/login',{slug:'igreja-teste-upgrades',username:'pastor',password:'uma-senha-segura-123'});
 assert.equal(churchLogin.status,200);
 const noCsrf=await call('/api/church/upgrade-requests',{module_id:'eventos'},churchLogin.cookie);assert.equal(noCsrf.status,403);
 const bad=await call('/api/church/upgrade-requests',{module_id:'not-a-feature'},churchLogin.cookie,churchLogin.data.csrf);assert.equal(bad.status,400);
 const good=await call('/api/church/upgrade-requests',{module_id:'eventos'},churchLogin.cookie,churchLogin.data.csrf);assert.equal(good.status,201);
 assert.equal(good.data.payment_required,false);
 const duplicate=await call('/api/church/upgrade-requests',{module_id:'eventos'},churchLogin.cookie,churchLogin.data.csrf);assert.equal(duplicate.status,409);
 const planned=await call('/api/church/upgrade-requests',{module_id:'rede-social'},churchLogin.cookie,churchLogin.data.csrf);assert.equal(planned.status,201);
 assert.match(planned.data.message,/desenvolvimento/);
 const permissions=await call('/api/church/features',null,churchLogin.cookie,null,'GET');
 assert.equal(permissions.status,200);
 assert.deepEqual(permissions.data.enabled,['site']);
 const stillForbidden=await call('/api/church/events',null,churchLogin.cookie,null,'GET');assert.equal(stillForbidden.status,403);
 const publicSite=await fetch(base+'/igreja/igreja-teste-upgrades').then(r=>r.text());
 assert.doesNotMatch(publicSite,/data-upgrade-feature=/);
 const ownedSite=await fetch(base+'/igreja/igreja-teste-upgrades',{headers:{Cookie:churchLogin.cookie}}).then(r=>r.text());
 assert.doesNotMatch(ownedSite,/data-upgrade-feature=/);
 const upgrades=await call('/api/admin/upgrade-requests',null,a.cookie,null,'GET');
 assert.equal(upgrades.status,200);
 assert.equal(upgrades.data.requests.length,2);
});
