import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('hub: a demonstração abre um painel com 10 categorias, 74 recursos e navegação real',async t=>{
 const tmp=mkdtempSync(join(tmpdir(),'elovia-hub-'));
 const port=38000+Math.floor(Math.random()*1500),url=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,DB_FILE:join(tmp,'test.sqlite'),PORT:String(port)},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(tmp,{recursive:true,force:true});});
 let ready=false;
 for(let n=0;n<120;n++){try{if((await fetch(url+'/montar')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,35));}
 assert.ok(ready,'servidor iniciou');
 const config={name:'Igreja da Esperança',headline:'Uma família que acolhe',description:'Um exemplo de comunidade.',location:'Rio de Janeiro · RJ',template:'moderno',color:'#dca64f',logo_data:'',modules:['site','eventos','oracao']};
 const create=await fetch(url+'/api/demo-sites',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(config)});
 assert.equal(create.status,201);
 const data=await create.json();
 const hub=await fetch(url+data.url+'/hub');
 assert.equal(hub.status,200);
 const html=await hub.text();
 for(const term of ['Igreja da Esperança','Gestão de membros e visitantes','Ferramentas avançadas','Mídia e comunicação visual','Todos os módulos da plataforma','74 módulos','demo-hub.css','demo-hub.js']) assert.ok(html.includes(term),term);
 assert.equal((html.match(/class="hub-module hub-module-/g)||[]).length,10);
 assert.equal((html.match(/data-feature=/g)||[]).length,74);
 const css=await fetch(url+'/demo-hub.css');assert.equal(css.status,200);assert.match(css.headers.get('content-type'),/text\/css/);
 const js=await fetch(url+'/demo-hub.js');assert.equal(js.status,200);assert.match(js.headers.get('content-type'),/javascript/);
 const module=await fetch(url+data.url+'/recurso/assistente-ia');assert.equal(module.status,200);
 assert.equal((await fetch(url+'/demo/'+'0'.repeat(40)+'/hub')).status,404);
});
