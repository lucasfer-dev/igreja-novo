import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {renderChurchSite} from '../site-renderer.js';
import {featureCatalog} from '../feature-catalog.js';

test('prévia usa o mesmo renderizador do site publicado e mantém personalização após provisionamento',async t=>{
 const tmp=mkdtempSync(join(tmpdir(),'elovia-live-')),port=32000+Math.floor(Math.random()*9000),base=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,PORT:String(port),DB_FILE:join(tmp,'live.sqlite'),ADMIN_USER:'admin',ADMIN_PASSWORD:'test-password-long-and-strong'},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/catalog')).ok)break;}catch{}await new Promise(r=>setTimeout(r,40));}
 const api=async(path,payload,cookie='',csrf='')=>{const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...(csrf?{'x-csrf-token':csrf}:{})},body:JSON.stringify(payload)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};};
 const logo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL/nwAAAABJRU5ErkJggg==';
 for(const template of ['moderno','tradicional','minimalista','transmissoes','personalizado']){
  const payload={name:'Comunidade Vida Nova',headline:'Uma casa de fé e acolhimento',description:'Pessoas, fé e comunidade em cada encontro.',location:'Rio de Janeiro · RJ',template,color:'#225aa7',logo_data:logo,modules:['site','eventos','oracao'],events:[]};
  const response=await api('/api/site-preview',payload);
  assert.equal(response.status,200);
  assert.match(response.data.html,/Uma casa de fé e acolhimento/);
  assert.match(response.data.html,/Rio de Janeiro · RJ/);
  assert.match(response.data.html,/church-site.css/);
  assert.match(response.data.html,/cs-theme-/);
  const expected=renderChurchSite({...payload,modules:featureCatalog.map(f=>f.id)},{preview:true,demo:true});
  assert.equal(response.data.html,expected,'A prévia precisa renderizar o componente compartilhado.');
 }
 const order=await api('/api/orders',{church:'Comunidade Vida Nova',contact:'Pessoa Responsável',email:'pessoa@example.com',phone:'21999999999',city:'Rio de Janeiro',state:'RJ',notes:'',template:'tradicional',color:'#225aa7',headline:'Uma casa de fé e acolhimento',location:'Rio de Janeiro · RJ',site_description:'Pessoas, fé e comunidade em cada encontro.',logo_data:logo,module_ids:['site','eventos','oracao']});
 assert.equal(order.status,201);
 const admin=await api('/api/admin/login',{username:'admin',password:'test-password-long-and-strong'});
 assert.equal(admin.status,200);
 const created=await api('/api/admin/provision',{order_id:order.data.id,slug:'comunidade-vida-nova',username:'pastor',password:'senha-segura-para-teste'},admin.cookie,admin.data.csrf);
 assert.equal(created.status,201);
 const published=await fetch(base+'/igreja/comunidade-vida-nova');
 assert.equal(published.status,200);
 const html=await published.text();
 assert.match(html,/cs-theme-tradicional/);
 assert.match(html,/Uma casa de fé e acolhimento/);
 assert.match(html,/Pessoas, fé e comunidade em cada encontro/);
 assert.match(html,/Rio de Janeiro · RJ/);
 assert.match(html,/data:image\/png;base64/);
 assert.match(html,/public-prayer/);
 assert.match(html,/Em breve, nossa programação/);
 assert.doesNotMatch(html,/Membros cadastrados/);
 const css=await fetch(base+'/church-site.css');assert.equal(css.status,200);assert.match(await css.text(),/cs-theme-tradicional/);
 const churchLogin=await api('/api/church/login',{slug:'comunidade-vida-nova',username:'pastor',password:'senha-segura-para-teste'});
 assert.equal(churchLogin.status,200);
 const churchSite=await fetch(base+'/api/church/site',{headers:{Cookie:churchLogin.cookie}}).then(r=>r.json());
 assert.equal(churchSite.headline,'Uma casa de fé e acolhimento');
 const change=await fetch(base+'/api/church/site',{method:'PATCH',headers:{Cookie:churchLogin.cookie,'x-csrf-token':churchLogin.data.csrf,'Content-Type':'application/json'},body:JSON.stringify({description:'Nova descrição publicada pela igreja.',headline:'Um novo tempo começa aqui.',location:'Niterói · RJ',color:'#147d68'})});
 assert.equal(change.status,200);
 const updated=await fetch(base+'/igreja/comunidade-vida-nova').then(r=>r.text());
 assert.match(updated,/Um novo tempo começa aqui/);
 assert.match(updated,/Nova descrição publicada pela igreja/);
 assert.match(updated,/Niterói · RJ/);
 assert.match(updated,/#147d68/);

 const invalid=await api('/api/site-preview',{name:'Teste',headline:'',description:'',location:'',template:'inexistente',color:'#123456',logo_data:'',modules:['site']});
 assert.equal(invalid.status,400);
});
