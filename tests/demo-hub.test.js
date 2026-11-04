import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('entrada da igreja é o CRM completo e não um hub de cartões fictícios',async t=>{
 const tmp=mkdtempSync(join(tmpdir(),'elovia-hub-'));
 const port=38000+Math.floor(Math.random()*1500),base='http://127.0.0.1:'+port;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,DB_FILE:join(tmp,'test.sqlite'),PORT:String(port)},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 let ready=false;
 for(let n=0;n<120;n++){try{if((await fetch(base+'/montar')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,35));}
 assert.ok(ready,'servidor iniciou');
 const config={name:'Igreja da Esperança',headline:'Uma família que acolhe',description:'Um exemplo de comunidade.',location:'Rio de Janeiro · RJ',template:'moderno',color:'#dca64f',logo_data:'',modules:['site','eventos','oracao']};
 const created=await fetch(base+'/api/demo-sites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(config)});
 assert.equal(created.status,201);
 const data=await created.json();
 const hub=await fetch(base+data.url+'/hub');
 assert.equal(hub.status,200);
 const html=await hub.text();
 for(const term of ['Igreja da Esperança','Membros e visitantes','Acompanhamentos','Tarefas e retornos','Eventos','Pedidos de oração','Escalas ministeriais','Meu site institucional','crm-stat-contacts','crm-client.js'])assert.ok(html.includes(term),term);
 assert.equal((html.match(/data-nav="/g)||[]).length,10,'10 visões efetivamente operacionais no menu');
 assert.doesNotMatch(html,/2\.845|18\.540|Todos os módulos acessíveis|74 módulos/);
 assert.equal((await fetch(base+'/crm.css')).status,200);
 assert.equal((await fetch(base+'/crm-client.js')).status,200);
 const crm=await fetch(base+data.url+'/crm').then(r=>r.text());
 assert.match(crm,/crm-stat-contacts/,'rota antiga permanece compatível');
 assert.equal((await fetch(base+'/demo/'+('0'.repeat(40))+'/hub')).status,404);
});
