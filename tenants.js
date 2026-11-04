import {findFeature,featureCatalog} from './feature-catalog.js';
import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import {renderChurchSite} from './site-renderer.js';
import {renderCRM} from './crm-view.js';
import {initCRM,handleCRM,exportContactsCSV,syncLegacyMembers,syncLegacyEvents} from './crm-server.js';
import {registerPublicVisitor,checkPublicIntakeRate} from './visitor-intake.js';
const id=()=>randomBytes(16).toString('hex');
const sha=v=>createHash('sha256').update(v).digest('hex');
const date=()=>new Date().toISOString();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const error=(code,message)=>Object.assign(new Error(message),{code});
const valid=(v,min=1,max=200)=>typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;
const resources={events:{table:'church_events',cols:['title','starts_at','location','description'],module:'eventos'},members:{table:'church_members',cols:['name','email','phone','notes'],module:'membros'},prayers:{table:'church_prayers',cols:['requester','message','status'],module:'oracao'},schedules:{table:'church_schedules',cols:['ministry','person','starts_at','notes'],module:'escalas'}};
const pages={events:'Eventos',members:'Membros',prayers:'Pedidos de oração',schedules:'Escalas'};
function page(title,content){return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Elovia</title><link rel="stylesheet" href="/style.css"></head><body><header class="top"><a class="logo" href="/">◈ <b>elovia</b></a><nav><a href="/">Início</a><a href="/igreja/entrar">Minha igreja</a></nav></header><main class="wrap">${content}</main><footer>Elovia · Plataforma operacional de igrejas</footer><script src="/tenant.js" defer></script></body></html>`;}
function respond(res,status,data,extra={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...extra});res.end(JSON.stringify(data));}
function render(res,body){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});res.end(body);}
async function input(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>30000)throw error(413,'Corpo excedeu 30 KB');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw error(400,'JSON inválido');}}
function init(db){db.exec(`CREATE TABLE IF NOT EXISTS churches(id TEXT PRIMARY KEY,slug TEXT NOT NULL UNIQUE,name TEXT NOT NULL,template TEXT NOT NULL,color TEXT NOT NULL,description TEXT NOT NULL DEFAULT '',contact_email TEXT NOT NULL DEFAULT '',order_id TEXT UNIQUE,created_at TEXT NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS church_users(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,username TEXT NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('owner','editor')),UNIQUE(church_id,username),FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL,FOREIGN KEY(user_id) REFERENCES church_users(id));
CREATE TABLE IF NOT EXISTS church_modules(church_id TEXT NOT NULL,module_id TEXT NOT NULL,PRIMARY KEY(church_id,module_id),FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_events(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,title TEXT NOT NULL,starts_at TEXT NOT NULL,location TEXT NOT NULL,description TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_members(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,name TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_prayers(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,requester TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pendente',created_at TEXT NOT NULL,FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_schedules(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,ministry TEXT NOT NULL,person TEXT NOT NULL,starts_at TEXT NOT NULL,notes TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE TABLE IF NOT EXISTS church_upgrade_requests(id TEXT PRIMARY KEY,church_id TEXT NOT NULL,module_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'requested' CHECK(status IN ('requested','reviewing','cancelled','approved')),created_at TEXT NOT NULL,FOREIGN KEY(church_id) REFERENCES churches(id));
CREATE UNIQUE INDEX IF NOT EXISTS upgrade_request_unique_open ON church_upgrade_requests(church_id,module_id) WHERE status IN ('requested','reviewing');
CREATE INDEX IF NOT EXISTS church_events_tenant ON church_events(church_id,starts_at);
CREATE INDEX IF NOT EXISTS church_members_tenant ON church_members(church_id);
CREATE INDEX IF NOT EXISTS church_prayers_tenant ON church_prayers(church_id);
CREATE INDEX IF NOT EXISTS church_schedules_tenant ON church_schedules(church_id);`);}
export function makeTenantRoutes(db){init(db);initCRM(db);
 for(const [column,type] of [['headline',"TEXT NOT NULL DEFAULT ''"],['location',"TEXT NOT NULL DEFAULT ''"],['logo_data',"TEXT NOT NULL DEFAULT ''"]]){if(!db.prepare('PRAGMA table_info(churches)').all().some(x=>x.name===column))db.exec(`ALTER TABLE churches ADD COLUMN ${column} ${type}`);}

 const getUser=req=>{const token=/\belovia_church=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];if(!token)return null;return db.prepare('SELECT u.id AS user_id,u.church_id,u.role,c.slug,c.name,c.color,s.csrf FROM church_sessions s JOIN church_users u ON s.user_id=u.id JOIN churches c ON c.id=u.church_id WHERE s.token_hash=? AND s.expires_at>?').get(sha(token),Date.now())||null;};
 const requireUser=req=>{const user=getUser(req);if(!user)throw error(401,'Faça login na sua igreja');return user;};
 const checkCsrf=(req,user)=>{if(req.headers['x-csrf-token']!==user.csrf)throw error(403,'Token de segurança inválido');};
 const permitted=(churchId,module)=>!!db.prepare('SELECT 1 FROM church_modules WHERE church_id=? AND module_id=?').get(churchId,module);
 const churchData=slug=>db.prepare('SELECT id,slug,name,color,template,description,contact_email,headline,location,logo_data FROM churches WHERE slug=?').get(slug);
 return async function tenantHandler(req,res,pathname){const method=req.method;
 try{
  if(method==='GET'&&pathname==='/tenant.js'){res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','X-Content-Type-Options':'nosniff'});const {readFileSync}=await import('node:fs');res.end(readFileSync(new URL('./public/tenant.js',import.meta.url)));return true;}
  if(method==='GET'&&pathname==='/igreja/entrar'){render(res,page('Acesso da igreja',`<section class="panel narrow"><h1>Área da sua igreja</h1><p>Entre com as credenciais entregues na implantação.</p><form id="church-login" class="stack"><label>Identificador da igreja<input name="slug" required placeholder="minha-igreja"></label><label>Usuário<input name="username" required></label><label>Senha<input type="password" name="password" required></label><button class="btn">Entrar</button></form><p id="church-feedback" aria-live="polite"></p></section>`));return true;}
  if(method==='GET'&&pathname==='/igreja/painel'){render(res,page('Painel da igreja',`<p id="church-feedback" aria-live="polite"></p><div id="church-console" class="church-shell" hidden><aside class="church-rail"><a class="rail-brand" href="/">◈ elovia<span>ESPAÇO DA IGREJA</span></a><div class="rail-church"><span class="rail-church-icon">✦</span><div><strong id="church-title"></strong><small>Administração</small></div></div><div class="rail-label">ESPAÇO DE TRABALHO</div><nav id="church-tabs" aria-label="Seções da igreja"><button data-resource="overview">⌂ <span>Visão geral</span></button><button data-resource="site">▣ <span>Meu site</span></button><button data-resource="events">▦ <span>Agenda</span></button><button data-resource="members">♙ <span>Pessoas</span></button><a class="rail-crm-link" href="/igreja/crm">✦ <span>CRM de pessoas</span></a><button data-resource="prayers">♡ <span>Pedidos de oração</span></button><button data-resource="schedules">☷ <span>Escalas</span></button><button data-resource="security">⚿ <span>Segurança</span></button></nav><div class="rail-foot"><a id="public-site-link" href="#" target="_blank" rel="noopener">↗ Visualizar meu site</a><button id="church-logout">Sair da conta</button></div></aside><section class="church-main"><header class="church-header"><div><span>ÁREA ADMINISTRATIVA</span><strong id="workspace-heading">Visão geral</strong></div><a id="public-site-header" href="#" target="_blank" rel="noopener">Ver site ↗</a></header><div id="church-workspace" class="workspace" aria-live="polite"></div></section></div>`));return true;}
  // Authenticated CRM: all read and write operations are scoped to this church.
  if(method==='GET'&&pathname==='/igreja/crm'){
    const user=requireUser(req);
    if(!permitted(user.church_id,'membros'))throw error(403,'O módulo de gestão de membros não está habilitado');
    syncLegacyMembers(db,user.church_id);syncLegacyEvents(db,user.church_id);
    const church=db.prepare('SELECT name,template,color,location,logo_data FROM churches WHERE id=?').get(user.church_id);
    render(res,renderCRM(church,{live:true}));return true;
  }
  if(pathname==='/api/church/crm/export/people'){
    const user=requireUser(req);if(!permitted(user.church_id,'membros'))throw error(403,'Módulo não habilitado');
    syncLegacyMembers(db,user.church_id);
    if(method!=='GET')throw error(405,'Método não permitido');
    const csv=exportContactsCSV(db,{type:'church',id:user.church_id});
    res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="contatos-igreja.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(csv);return true;
  }
  const crmRoute=/^\/api\/church\/crm\/(people|activities|tasks|events|groups|attendance)(?:\/([a-f0-9]{32}))?$/.exec(pathname);
  if(crmRoute){
    const user=requireUser(req);
    if(!permitted(user.church_id,'membros'))throw error(403,'Módulo de gestão de membros não habilitado');
    syncLegacyMembers(db,user.church_id);syncLegacyEvents(db,user.church_id);
    if(['events','attendance'].includes(crmRoute[1])&&!permitted(user.church_id,'eventos'))throw error(403,'Módulo de eventos não habilitado');
    await handleCRM(req,res,db,{type:'church',id:user.church_id},crmRoute[1],crmRoute[2],{csrf:user.csrf,allowDelete:user.role==='owner'});return true;
  }
  const pub=/^\/igreja\/([a-z0-9-]{3,50})$/.exec(pathname);
  if(method==='GET'&&pub){
   const c=churchData(pub[1]);if(!c)throw error(404,'Igreja não encontrada');
   const modules=db.prepare('SELECT module_id FROM church_modules WHERE church_id=?').all(c.id).map(x=>x.module_id);
   const events=modules.includes('eventos')?db.prepare('SELECT title,starts_at,location,description FROM church_events WHERE church_id=? ORDER BY starts_at LIMIT 8').all(c.id):[];
   const user=getUser(req);const owner=!!(user&&user.church_id===c.id);
   const prices=Object.fromEntries(db.prepare('SELECT id,price_cents FROM modules').all().map(x=>[x.id,x.price_cents]));
   render(res,renderChurchSite({...c,modules,events,prices},{owner}));return true;
  }
  if(method==='POST'&&pathname==='/api/church/login'){const b=await input(req);if(!valid(b.slug,3,50)||!valid(b.username,1,80)||!valid(b.password,1,300))throw error(400,'Credenciais inválidas');const account=db.prepare('SELECT u.* FROM church_users u JOIN churches c ON c.id=u.church_id WHERE c.slug=? AND u.username=?').get(b.slug,b.username);if(!account)throw error(401,'Credenciais inválidas');const pwd=scryptSync(b.password,account.salt,64);if(!timingSafeEqual(pwd,Buffer.from(account.password_hash,'hex')))throw error(401,'Credenciais inválidas');const token=randomBytes(32).toString('hex'),csrf=id();db.prepare('INSERT INTO church_sessions VALUES(?,?,?,?)').run(sha(token),account.id,csrf,Date.now()+8*3600000);respond(res,200,{ok:true,csrf},{'Set-Cookie':`elovia_church=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`});return true;}
  if(method==='GET'&&pathname==='/api/church/me'){const user=requireUser(req);respond(res,200,{church:{slug:user.slug,name:user.name,color:user.color},csrf:user.csrf,modules:db.prepare('SELECT module_id FROM church_modules WHERE church_id=?').all(user.church_id).map(x=>x.module_id)});return true;}
  if(method==='POST'&&pathname==='/api/church/logout'){const user=requireUser(req);checkCsrf(req,user);const token=/\belovia_church=([a-f0-9]{64})\b/.exec(req.headers.cookie||'')?.[1];db.prepare('DELETE FROM church_sessions WHERE token_hash=?').run(sha(token));respond(res,200,{ok:true},{'Set-Cookie':'elovia_church=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return true;}
  if(method==='GET'&&pathname==='/api/church/features'){
   const user=requireUser(req);
   const enabled=db.prepare('SELECT module_id FROM church_modules WHERE church_id=?').all(user.church_id).map(x=>x.module_id);
   const requests=db.prepare('SELECT id,module_id,status,created_at FROM church_upgrade_requests WHERE church_id=? ORDER BY created_at DESC').all(user.church_id);
   respond(res,200,{features:featureCatalog,enabled,requests});return true;
  }
  if(method==='POST'&&pathname==='/api/church/upgrade-requests'){
   const user=requireUser(req);checkCsrf(req,user);
   if(user.role!=='owner')throw error(403,'Apenas o responsável da igreja pode solicitar novos módulos');
   const b=await input(req);const feature=findFeature(b.module_id);
   if(!feature)throw error(400,'Módulo não encontrado');
   if(permitted(user.church_id,feature.id))throw error(409,'Módulo já ativo para esta igreja');
   if(db.prepare("SELECT 1 FROM church_upgrade_requests WHERE church_id=? AND module_id=? AND status IN ('requested','reviewing')").get(user.church_id,feature.id))throw error(409,'Já existe uma solicitação em análise para este módulo');
   const requestId=id();
   db.prepare('INSERT INTO church_upgrade_requests(id,church_id,module_id,status,created_at) VALUES(?,?,?,?,?)').run(requestId,user.church_id,feature.id,'requested',date());
   respond(res,201,{id:requestId,module_id:feature.id,status:'requested',payment_required:false,message:feature.operational?'Solicitação enviada. A equipe confirmará o valor e a ativação.':'Interesse registrado. Este recurso ainda está em desenvolvimento.'});return true;
  }
  if(method==='GET'&&pathname==='/api/church/overview'){const user=requireUser(req);const counts={};for(const [key,config] of Object.entries(resources)){counts[key]=permitted(user.church_id,config.module)?db.prepare(`SELECT COUNT(*) AS n FROM ${config.table} WHERE church_id=?`).get(user.church_id).n:null;}const upcoming=permitted(user.church_id,'eventos')?db.prepare('SELECT id,title,starts_at,location FROM church_events WHERE church_id=? ORDER BY starts_at ASC LIMIT 5').all(user.church_id):[];const pending=permitted(user.church_id,'oracao')?db.prepare("SELECT COUNT(*) AS n FROM church_prayers WHERE church_id=? AND status='pendente'").get(user.church_id).n:null;respond(res,200,{counts,upcoming,pending,slug:user.slug});return true;}
  if(method==='POST'&&pathname==='/api/church/change-password'){const user=requireUser(req);checkCsrf(req,user);const b=await input(req);if(!valid(b.current_password,1,300)||!valid(b.new_password,14,300)||!/[A-Z]/.test(b.new_password)||!/[a-z]/.test(b.new_password)||!/[0-9]/.test(b.new_password))throw error(400,'A nova senha deve ter no mínimo 14 caracteres, letras maiúsculas, minúsculas e números');const stored=db.prepare('SELECT salt,password_hash FROM church_users WHERE id=?').get(user.user_id);const computed=scryptSync(b.current_password,stored.salt,64);if(!timingSafeEqual(computed,Buffer.from(stored.password_hash,'hex')))throw error(403,'Senha atual incorreta');const salt=id(),password_hash=scryptSync(b.new_password,salt,64).toString('hex');db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE church_users SET salt=?,password_hash=? WHERE id=?').run(salt,password_hash,user.user_id);db.prepare('DELETE FROM church_sessions WHERE user_id=?').run(user.user_id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}respond(res,200,{ok:true,reauth:true},{'Set-Cookie':'elovia_church=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});return true;}
  if(method==='GET'&&pathname==='/api/church/members/export'){
   const user=requireUser(req);if(!permitted(user.church_id,'membros'))throw error(403,'Módulo não contratado');
   const rows=db.prepare('SELECT name,email,phone,notes FROM church_members WHERE church_id=? ORDER BY name COLLATE NOCASE LIMIT 10000').all(user.church_id);
   const cell=v=>'"'+String(v??'').replace(/^[\s]*[=+\-@]/,match=>'\t'+match).replace(/"/g,'""')+'"';
   const csv='\uFEFF'+[['Nome','E-mail','Telefone','Observações'],...rows.map(x=>[x.name,x.email,x.phone,x.notes])].map(r=>r.map(cell).join(';')).join('\r\n');
   res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="membros.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(csv);return true;
  }
  if(method==='GET'&&pathname==='/api/church/site'){const user=requireUser(req);const c=db.prepare('SELECT description,color,template,name,headline,location,logo_data,contact_email FROM churches WHERE id=?').get(user.church_id);respond(res,200,c);return true;}
  if(method==='PATCH'&&pathname==='/api/church/site'){const user=requireUser(req);checkCsrf(req,user);if(!permitted(user.church_id,'site'))throw error(403,'Site não contratado');const b=await input(req);if(!valid(b.description,0,1000)||!valid(b.headline||'',0,120)||!valid(b.location||'',0,90)||!/^#[0-9a-fA-F]{6}$/.test(b.color))throw error(400,'Dados inválidos');db.prepare('UPDATE churches SET description=?,color=?,headline=?,location=? WHERE id=?').run(b.description,b.color,b.headline||'',b.location||'',user.church_id);respond(res,200,{ok:true});return true;}
  const match=/^\/api\/church\/(events|members|prayers|schedules)(?:\/([a-f0-9]{32}))?$/.exec(pathname);
  if(match){const type=match[1],itemId=match[2],config=resources[type],user=requireUser(req);if(!permitted(user.church_id,config.module))throw error(403,'Módulo não contratado');const {table,cols}=config;
   if(method==='GET'&&!itemId){respond(res,200,{items:db.prepare(`SELECT * FROM ${table} WHERE church_id=? ORDER BY created_at DESC LIMIT 300`).all(user.church_id)});return true;}
   if(['POST','PATCH','DELETE'].includes(method)){checkCsrf(req,user);if(method==='DELETE'&&itemId){const r=db.prepare(`DELETE FROM ${table} WHERE id=? AND church_id=?`).run(itemId,user.church_id);if(!r.changes)throw error(404,'Registro não encontrado');respond(res,200,{ok:true});return true;}
    if(method==='POST'&&!itemId||method==='PATCH'&&itemId){const b=await input(req);for(const col of cols){const max=col==='message'?2000:col==='notes'||col==='description'?1000:200;if(!valid(b[col],col==='status'?1:0,max))throw error(400,`Campo ${col} inválido`);}if(type==='prayers'&&!['pendente','em_oracao','concluido'].includes(b.status))throw error(400,'Status inválido');if(method==='POST'){const rowId=id(),values=cols.map(col=>b[col].trim());db.prepare(`INSERT INTO ${table}(id,church_id,${cols.join(',')},created_at) VALUES(${Array(cols.length+3).fill('?').join(',')})`).run(rowId,user.church_id,...values,date());respond(res,201,{id:rowId});return true;}const values=cols.map(col=>b[col].trim());const r=db.prepare(`UPDATE ${table} SET ${cols.map(c=>c+'=?').join(',')} WHERE id=? AND church_id=?`).run(...values,itemId,user.church_id);if(!r.changes)throw error(404,'Registro não encontrado');respond(res,200,{ok:true});return true;}
   }
   throw error(405,'Método não permitido');
  }
  const publicVisitor=/^\/api\/public\/([a-z0-9-]{3,50})\/visitors$/.exec(pathname);
  if(method==='POST'&&publicVisitor){
   const c=churchData(publicVisitor[1]);
   if(!c||!permitted(c.id,'site')||!permitted(c.id,'membros'))throw error(404,'Formulário indisponível');
   const scope={type:'church',id:c.id};
   checkPublicIntakeRate(req.socket.remoteAddress,scope);
   const origin=req.headers.origin;
   if(origin){let host;try{host=new URL(origin).host;}catch{throw error(403,'Origem inválida');}if(host!==req.headers.host)throw error(403,'Origem não autorizada');}
   respond(res,201,registerPublicVisitor(db,scope,await input(req)));return true;
  }
  const prayer=/^\/api\/public\/([a-z0-9-]{3,50})\/prayers$/.exec(pathname);
  if(method==='POST'&&prayer){const c=churchData(prayer[1]);if(!c||!permitted(c.id,'oracao'))throw error(404,'Formulário indisponível');const b=await input(req);if(!valid(b.requester,2,100)||!valid(b.message,5,2000))throw error(400,'Confira os campos');db.prepare('INSERT INTO church_prayers VALUES(?,?,?,?,?,?)').run(id(),c.id,b.requester.trim(),b.message.trim(),'pendente',date());respond(res,201,{ok:true});return true;}
  return false;
 }catch(e){respond(res,e.code||500,{error:e.code?e.message:'Erro interno'});return true;}}
}
export function provisionChurch(db,orderId,slug,username,password){if(!/^([a-z0-9]+-?){3,50}$/.test(slug)||!valid(username,3,80)||!valid(password,12,300))throw error(400,'Identificador, usuário ou senha inválidos');const order=db.prepare('SELECT * FROM orders WHERE id=?').get(orderId);if(!order)throw error(404,'Pedido inexistente');if(db.prepare('SELECT 1 FROM churches WHERE order_id=? OR slug=?').get(orderId,slug))throw error(409,'Igreja já provisionada ou identificador utilizado');const modules=db.prepare('SELECT module_id FROM order_modules WHERE order_id=?').all(orderId).map(x=>x.module_id);const churchId=id(),uid=id(),salt=id(),hashed=scryptSync(password,salt,64).toString('hex');db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO churches(id,slug,name,template,color,description,contact_email,order_id,created_at,headline,location,logo_data) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(churchId,slug,order.church,order.template,order.color,order.site_description||'Encontre acolhimento, comunhão e uma comunidade pronta para receber você.',order.email,orderId,date(),order.headline||'',order.location||order.city,order.logo_data||'');db.prepare('INSERT INTO church_users VALUES(?,?,?,?,?,?)').run(uid,churchId,username,salt,hashed,'owner');for(const mid of modules)db.prepare('INSERT INTO church_modules VALUES(?,?)').run(churchId,mid);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return {id:churchId,slug,username,modules};}
