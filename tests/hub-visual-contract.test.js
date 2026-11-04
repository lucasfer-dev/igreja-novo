import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {renderDemoHub} from '../demo-hub.js';

const id='a'.repeat(40);
const sample={name:'Igreja Batista Central',headline:'Uma comunidade para todos',description:'Acolhimento e fé',location:'Quintino Bocaiúva · RJ',logo_data:'',color:'#dca64f',modules:['site','eventos','oracao']};
const sourceFile=path=>new URL(path,import.meta.url);

test('Hub Moderno: composição compacta da referência, 6 indicadores, 10 grupos, navegação e assets próprios',()=>{
 const html=renderDemoHub({...sample,template:'moderno'},id);
 assert.match(html,/class="hub-theme-moderno"/);
 for(const name of ['hub-topbar','hub-welcome','hub-metrics','hub-content-grid','hub-live card','hub-events card','hub-sermon card','hub-radio card','hub-quick-grid','hub-module-grid','hub-side-column','hub-calendar','hub-tasks','hub-links'])assert.ok(html.includes(name),name);
 assert.equal((html.match(/class="hub-metric"/g)||[]).length,6);
 assert.equal((html.match(/class="hub-module hub-module-/g)||[]).length,10);
 assert.equal((html.match(/data-feature=/g)||[]).length,74);
 assert.match(html,/id="hub-sidebar-close"/);
 assert.ok(existsSync(sourceFile('../public/assets/hub-modern-hero.webp')));
 assert.ok(existsSync(sourceFile('../public/assets/hub-modern-live.webp')));
 assert.ok(existsSync(sourceFile('../public/assets/hub-modern-sermon.webp')));
 assert.ok(existsSync(sourceFile('../public/assets/hub-modern-radio.webp')));
 const css=readFileSync(sourceFile('../public/demo-hub.css'),'utf8');
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:650px\)/);
});

test('Hub Tradicional: composição creme/marrom independente, 5 indicadores, 4 cards centrais, 10 grupos',()=>{
 const html=renderDemoHub({...sample,template:'tradicional'},id);
 assert.match(html,/class="th-app"/);
 for(const name of ['th-sidebar','th-topbar','th-welcome','th-metrics','th-top-grid','th-bottom-grid','th-categories','th-events','th-message','th-radio','th-calendar','th-quick','th-links'])assert.ok(html.includes(name),name);
 assert.equal((html.match(/class="th-metric"/g)||[]).length,5);
 assert.equal((html.match(/class="th-module th-module-/g)||[]).length,10);
 assert.match(html,/id="hub-sidebar-close"/);
 assert.ok(existsSync(sourceFile('../public/assets/hub-traditional-hero.webp')));
 assert.ok(existsSync(sourceFile('../public/assets/hub-traditional-bible.webp')));
 assert.ok(existsSync(sourceFile('../public/assets/hub-traditional-mic.webp')));
 const css=readFileSync(sourceFile('../public/traditional-hub.css'),'utf8');
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:650px\)/);
});
