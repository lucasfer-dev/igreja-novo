import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

test('cria e abre site de demonstração em todos os cinco modelos sem enviar pedido ou cobrar',async t=>{
 const temp=mkdtempSync(join(tmpdir(),'elovia-demonstracao-'));
 const port=36000+Math.floor(Math.random()*2000),url=`http://127.0.0.1:${port}`;
 const proc=spawn(process.execPath,['--experimental-sqlite','server.js'],{cwd:process.cwd(),env:{...process.env,DB_FILE:join(temp,'app.sqlite'),PORT:String(port)},stdio:'ignore'});
 t.after(()=>{proc.kill();rmSync(temp,{recursive:true,force:true});});
 let ready=false;
 for(let i=0;i<100;i++){try{if((await fetch(url+'/montar')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,40));}
 assert.equal(ready,true,'servidor iniciado');
 const create=async b=>{const response=await fetch(url+'/api/demo-sites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:response.status,data:await response.json()};};
 for(const template of ['moderno','tradicional','minimalista','transmissoes','futurista','personalizado']){
  const config={name:'Comunidade Nova Esperança',headline:`Testando ${template} agora`,description:'Uma comunidade de portas abertas.',location:'Rio de Janeiro · RJ',template,color:'#aabbcc',logo_data:'',modules:['site','eventos','oracao']};
  const created=await create(config);
  assert.equal(created.status,201,JSON.stringify(created.data));
  assert.match(created.data.url,/^\/demo\/[0-9a-f]{40}$/);
  const page=await fetch(url+created.data.url);
  assert.equal(page.status,200);
  const html=await page.text();
  assert.match(html,new RegExp(`cs-theme-${template}`));
  assert.match(html,new RegExp(`Testando ${template} agora`));
  assert.match(html,/Comunidade Nova Esperança/);
  assert.match(html,/DEMONSTRAÇÃO COMPLETA/);
  assert.match(html,/Editar esta igreja/);
  assert.match(html,/Sou novo aqui/);
  assert.match(html,/data-endpoint=\"\/api\/demo\//);
  assert.doesNotMatch(html,/Tudo que sua igreja pode utilizar|Referência: R\$/);
  assert.doesNotMatch(html,/Disponível por contratação|Solicitar desbloqueio/);
  const modulePage=await fetch(url+created.data.url+'/recurso/assistente-ia');
  assert.equal(modulePage.status,200);
  assert.match(await modulePage.text(),/Assistente virtual com IA/);
  assert.doesNotMatch(html,/elovia_session=|Solicitação enviada/);
  const read=await fetch(url+'/api/demo-sites/'+created.data.id).then(r=>r.json());
  assert.equal(read.site.template,template);
  assert.equal(read.site.color,'#aabbcc');
 }
 const bad=await create({name:'Teste',template:'inexistente',color:'#000000',modules:[]});
 assert.equal(bad.status,400);
 const notFound=await fetch(url+'/demo/'+'0'.repeat(40));
 assert.equal(notFound.status,404);
});
