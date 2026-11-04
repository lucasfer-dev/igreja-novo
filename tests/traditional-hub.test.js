import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDemoHub} from '../demo-hub.js';
import {renderChurchSite} from '../site-renderer.js';

const demoId='b'.repeat(40);
const base={name:'Igreja Batista Central',headline:'Servindo com propósito',description:'Um lugar para acolher',location:'Rio de Janeiro · RJ',color:'#b58749',logo_data:'',modules:['site','eventos','oracao','membros']};

test('site tradicional conserva identidade própria; administração mantém workspace de gestão',()=>{
 const site=renderChurchSite({...base,template:'tradicional'},{preview:true,demo:true,demoId});
 const admin=renderDemoHub({...base,template:'tradicional'},demoId);
 assert.match(site,/cs-theme-tradicional/);
 assert.match(site,/Servindo com propósito/);
 assert.match(site,/Abrir sistema de gestão/);
 assert.match(site,/Editar site no CRM/);
 assert.match(admin,/crm-style-moderno crm-unified/);
 assert.match(admin,/Meu site institucional/);
 assert.doesNotMatch(admin,/th-app|Todos os módulos acessíveis|74 módulos/);
 const modernSite=renderChurchSite({...base,template:'moderno'},{preview:true,demo:true,demoId});
 assert.match(modernSite,/cs-theme-moderno/);
 assert.notEqual(modernSite,site);
});
