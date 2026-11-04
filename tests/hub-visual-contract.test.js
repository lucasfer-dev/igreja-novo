import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderDemoHub} from '../demo-hub.js';

const id='a'.repeat(40);
const sample={name:'Igreja Batista Central',headline:'Uma comunidade para todos',description:'Acolhimento e fé',location:'Quintino Bocaiúva · RJ',logo_data:'',color:'#dca64f',modules:['site','eventos','oracao']};

test('painel integrado: seis indicadores vinculados a dados reais e navegação operacional',()=>{
 const html=renderDemoHub({...sample,template:'moderno'},id);
 assert.match(html,/crm-style-moderno crm-unified/);
 for(const name of ['crm-sidebar','crm-topbar','crm-stats','crm-workspace','crm-dialog','crm-client.js','crm.css'])assert.ok(html.includes(name),name);
 assert.equal((html.match(/class="crm-side-item crm-side-active"/g)||[]).length,1);
 assert.equal((html.match(/id="crm-stat-/g)||[]).length,6);
 assert.equal((html.match(/data-nav="/g)||[]).length,10);
 for(const section of ['Visão geral','Membros e visitantes','Acompanhamentos','Tarefas e retornos','Pedidos de oração','Escalas ministeriais','Meu site institucional'])assert.match(html,new RegExp(section));
 assert.doesNotMatch(html,/2\.845|18\.540|74 módulos|Todos os módulos acessíveis/);
 const css=readFileSync(new URL('../public/crm.css',import.meta.url),'utf8');
 assert.match(css,/.crm-site-layout/);
 assert.match(css,/@media\(max-width:650px\)/);
});

test('tema visual da igreja não muda as operações, permissões ou navegação do CRM',()=>{
 const modern=renderDemoHub({...sample,template:'moderno'},id);
 const traditional=renderDemoHub({...sample,template:'tradicional'},id);
 for(const html of [modern,traditional]){
  assert.match(html,/data-nav="site"/);
  assert.match(html,/data-nav="prayers"/);
  assert.match(html,/data-nav="schedules"/);
  assert.match(html,/crm-style-moderno crm-unified/);
 }
 assert.doesNotMatch(traditional,/class="th-app"|hub-module-|traditional-hub.css/);
});
