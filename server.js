import {featureCatalog} from './feature-catalog.js';
import {renderDemoHub} from './demo-hub.js';
import {renderCRM} from './crm-view.js';
import {initCRM,handleCRM,seedDemoCRM,exportContactsCSV,crmSummary} from './crm-server.js';
import {initVisitorIntake,registerPublicVisitor,checkPublicIntakeRate} from './visitor-intake.js';
import {renderBuilder} from './builder.js';
import {renderHome} from './home.js';
import {renderChurchSite,renderDemoFeature,validLogo,normalizeSite} from './site-renderer.js';
import {makeTenantRoutes,provisionChurch} from './tenants.js';
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root=path.dirname(fileURLToPath(import.meta.url));
const isVercel=Boolean(process.env.VERCEL);
// TEMPORARY DEMO-ONLY DATABASE. Serverless file storage is ephemeral;
// never store real member or visitor data here.
if(!isVercel)fs.mkdirSync(path.join(root,'data'),{recursive:true});
const dbFile=process.env.DB_FILE || (isVercel ? path.join(os.tmpdir(),`elovia-demo-${process.pid}.sqlite`) : path.join(root,'data','elovia.sqlite'));
const db=new DatabaseSync(dbFile);
db.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
db.exec(`CREATE TABLE IF NOT EXISTS modules(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,description TEXT NOT NULL,price_cents INTEGER NOT NULL CHECK(price_cents>=0),active INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,tracking_hash TEXT NOT NULL,church TEXT NOT NULL,contact TEXT NOT NULL,email TEXT NOT NULL,phone TEXT NOT NULL,city TEXT NOT NULL,state TEXT NOT NULL,template TEXT NOT NULL,color TEXT NOT NULL,notes TEXT NOT NULL,base_cents INTEGER NOT NULL,setup_cents INTEGER NOT NULL,total_cents INTEGER NOT NULL,status TEXT NOT NULL DEFAULT 'recebido',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS order_modules(order_id TEXT NOT NULL,module_id TEXT NOT NULL,module_name TEXT NOT NULL,price_cents INTEGER NOT NULL,PRIMARY KEY(order_id,module_id),FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS order_events(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id));
CREATE TABLE IF NOT EXISTS admins(id INTEGER PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(id_hash TEXT PRIMARY KEY,admin_id INTEGER NOT NULL,csrf TEXT NOT NULL,expires_at INTEGER NOT NULL,FOREIGN KEY(admin_id) REFERENCES admins(id));
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY AUTOINCREMENT,admin_id INTEGER NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,created_at TEXT NOT NULL);
`);
// Demonstrations are isolated from orders and real church accounts; no billing or live entitlement is granted.
db.exec(`CREATE TABLE IF NOT EXISTS demo_sites (
 id TEXT PRIMARY KEY,
 payload TEXT NOT NULL,
 created_at TEXT NOT NULL
)`);
initCRM(db);
initVisitorIntake(db);
// Migrations are additive: old customer records are retained.
for(const [table,column,sql] of [
 ['orders','headline',"TEXT NOT NULL DEFAULT ''"],['orders','site_description',"TEXT NOT NULL DEFAULT ''"],['orders','location',"TEXT NOT NULL DEFAULT ''"],['orders','logo_data',"TEXT NOT NULL DEFAULT ''"],
 ['churches','headline',"TEXT NOT NULL DEFAULT ''"],['churches','location',"TEXT NOT NULL DEFAULT ''"],['churches','logo_data',"TEXT NOT NULL DEFAULT ''"]
]){
 // churches is initialized by makeTenantRoutes further below, so migrate it in that module.
 if(table==='churches')continue;
 if(!db.prepare(`PRAGMA table_info(${table})`).all().some(x=>x.name===column))db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${sql}`);
}
const seed=[
 ['site','Site institucional','Presença digital','Página pública com identidade da igreja',3900],
 ['eventos','Agenda de eventos','Presença digital','Divulgação de atividades',1500],
 ['pregacoes','Biblioteca de pregações','Presença digital','Conteúdos organizados',1900],
 ['oracao','Pedidos de oração','Presença digital','Solicitações com tratamento reservado',1500],
 ['ao-vivo','Transmissões ao vivo','Presença digital','Links para transmissões',1900],
 ['radio','Rádio do ministério','Presença digital','Player para emissora existente',4900],
 ['ofertas','Dízimos e ofertas','Presença digital','Página de instruções para contribuição',2500],
 ['membros','Gestão de membros','Gestão administrativa','Cadastro e organização de membros',5900],
 ['cadastro','Cadastro de novos membros','Gestão administrativa','Formulário de entrada de membros',1900],
 ['visitantes','Acompanhamento de visitantes','Gestão administrativa','Acompanhamento de visitas',3500],
 ['patrimonio','Controle de patrimônio','Gestão administrativa','Registro de bens',2900],
 ['financeiro','Gestão financeira','Gestão administrativa','Entradas, saídas e relatórios',6900],
 ['relatorios','Relatórios e indicadores','Gestão administrativa','Indicadores de operação',2900],
 ['congregacoes','Gestão de congregações','Gestão administrativa','Organização de unidades',4900],
 ['escalas','Escalas ministeriais','Ministérios e cultos','Planejamento de voluntários',3900],
 ['ordem','Ordem do culto','Ministérios e cultos','Programação das celebrações',1900],
 ['louvor','Repertório do louvor','Ministérios e cultos','Organização de músicas',2500],
 ['espacos','Reserva de espaços','Ministérios e cultos','Agendamento de ambientes',1900],
 ['escola','Escola bíblica','Ministérios e cultos','Turmas e estudos',3500],
 ['voluntarios','Gestão de voluntários','Ministérios e cultos','Equipes e disponibilidade',2900],
 ['comunicados','Comunicados e notificações','Comunicação e comunidade','Avisos internos',2500],
 ['mensagens','Mensagens para visitantes','Comunicação e comunidade','Comunicação de acolhimento',3900],
 ['chat','Chat entre membros','Comunicação e comunidade','Comunicação interna',6900],
 ['rede','Rede social da igreja','Comunicação e comunidade','Mural comunitário',9900],
 ['celulas','Pequenos grupos e células','Comunicação e comunidade','Organização de grupos',3900],
 ['cursos','Cursos e discipulado','Comunicação e comunidade','Conteúdos educacionais',5900]
];
const ins=db.prepare('INSERT OR IGNORE INTO modules(id,name,category,description,price_cents) VALUES(?,?,?,?,?)');seed.forEach(m=>ins.run(...m));
// Registra o catálogo ampliado como não operacional por padrão; não libera contratação sem implementação.
for(const f of featureCatalog){
 const result=ins.run(f.id,f.name,f.category,'Funcionalidade complementar — solicite disponibilidade',f.price_cents);
 if(result.changes && !f.operational)db.prepare('UPDATE modules SET active=0 WHERE id=?').run(f.id);
}
db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run('base_cents',3900);
db.prepare('INSERT OR IGNORE INTO settings(key,value) VALUES(?,?)').run('setup_cents',29900);
if(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length>=12){
 const salt=randomBytes(16).toString('hex');const hashed=scryptSync(process.env.ADMIN_PASSWORD,salt,64).toString('hex');
 db.prepare('INSERT OR IGNORE INTO admins(username,salt,password_hash) VALUES(?,?,?)').run(process.env.ADMIN_USER||'admin',salt,hashed);
}
const DELIVERABLE_MODULES=['site','eventos','membros','oracao','escalas'];
const statuses=['recebido','aguardando_materiais','em_producao','em_revisao','entregue','cancelado','rejeitado'];
const transitions={recebido:['aguardando_materiais','cancelado','rejeitado'],pagamento_confirmado:['aguardando_materiais','cancelado'],aguardando_materiais:['em_producao','cancelado'],em_producao:['em_revisao','cancelado'],em_revisao:['em_producao','entregue'],entregue:[],cancelado:[],rejeitado:[]};
const templates=['moderno','tradicional','minimalista','transmissoes','futurista','personalizado'];
const money=c=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const err=(code,message)=>{const e=new Error(message);e.code=code;return e;};
const getSettings=()=>Object.fromEntries(db.prepare('SELECT key,value FROM settings').all().map(x=>[x.key,x.value]));
function quote(ids){
 if(!Array.isArray(ids)||ids.length>26||new Set(ids).size!==ids.length||ids.some(x=>typeof x!=='string'))throw err(400,'Seleção inválida');
 if(ids.some(id=>!DELIVERABLE_MODULES.includes(id)))throw err(400,'Este recurso ainda não está disponível para contratação');
 const selected=ids.map(id=>db.prepare('SELECT * FROM modules WHERE id=? AND active=1').get(id));
 if(selected.some(x=>!x))throw err(400,'Módulo inexistente ou indisponível');
 const s=getSettings();return {modules:selected,base_cents:s.base_cents,setup_cents:s.setup_cents,total_cents:s.base_cents+selected.reduce((a,x)=>a+x.price_cents,0)};
}
function json(res,code,obj,extra={}){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra});res.end(JSON.stringify(obj));}
function html(res,code,body){res.writeHead(code,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; script-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'self'"});res.end(body);}
const limit=new Map();function rate(req){let ip=req.socket.remoteAddress||'local',now=Date.now(),v=limit.get(ip);if(!v||v.end<now)v={n:0,end:now+60000};v.n++;limit.set(ip,v);if(limit.size>4000)limit.clear();return v.n>100;}
async function body(req){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>360000)throw err(413,'Requisição muito grande');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw err(400,'JSON inválido');}}
const hex=()=>randomBytes(24).toString('hex');const hash=s=>createHash('sha256').update(s).digest('hex');
function admin(req){const token=/\belovia_session=([0-9a-f]{48})\b/.exec(req.headers.cookie||'')?.[1];if(!token)return null;const row=db.prepare('SELECT * FROM sessions WHERE id_hash=? AND expires_at>?').get(hash(token),Date.now());return row||null;}
function requireAdmin(req){let a=admin(req);if(!a)throw err(401,'Faça login como administrador');return a;}
function csrf(req,a){if(req.headers['x-csrf-token']!==a.csrf)throw err(403,'Token de segurança inválido');}
function validText(v,min,max){return typeof v==='string'&&v.trim().length>=min&&v.trim().length<=max;}
const now=()=>new Date().toISOString();
function layout(title,content){return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Elovia</title><link rel="stylesheet" href="/style.css"></head><body><header class="top"><a class="logo" href="/">◈ <b>elovia</b><small> / tecnologia para comunidades</small></a><nav><a href="/#como-funciona">Como funciona</a><a href="/montar">Montar solução</a><a href="/acompanhar">Acompanhar pedido</a><a href="/igreja/entrar">Entrar na igreja</a><a href="/admin">Equipe</a></nav></header>${content}<footer>Elovia — conceito de marca em validação · Serviço em desenvolvimento · Solicitações sem cobrança automática</footer><script src="/app.js" defer></script></body></html>`;}
function mainPage(){return layout('Gestão e presença digital para igrejas',`<main class="site-home"><section class="home-hero"><div class="hero-copy"><div class="eyebrow"><span class="live-dot"></span> SOFTWARE PARA IGREJAS QUE FAZEM ACONTECER</div><h1>Mais tempo para <em>cuidar de pessoas.</em><br>Menos tempo organizando planilhas.</h1><p>Seu site, seus eventos, seus membros e suas equipes trabalhando no mesmo lugar. Escolha o que sua igreja precisa. A gente ajuda a colocar em funcionamento.</p><div class="hero-actions"><a class="btn" href="/montar">Montar minha solução <span aria-hidden="true">↗</span></a><a class="link-under" href="#produto">Conhecer a plataforma ↓</a></div><div class="hero-assurance"><span>✓ Preço por recurso</span><span>✓ Sem implantação surpresa</span><span>✓ Suporte na configuração</span></div></div><div class="product-stage" aria-label="Prévia ilustrativa do painel da igreja"><div class="stage-bar"><span class="stage-mark">e</span> EL<span class="stage-secondary">OVIA</span><span class="stage-context">/ PAINEL DA IGREJA</span><span class="stage-avatar">AP</span></div><div class="stage-main"><div class="stage-sidebar"><div class="stage-nav active">▦ &nbsp; Visão geral</div><div class="stage-nav">▤ &nbsp; Membros</div><div class="stage-nav">▣ &nbsp; Eventos</div><div class="stage-nav">◎ &nbsp; Orações</div><div class="stage-nav">☷ &nbsp; Escalas</div><div class="stage-bottom">Sua comunidade, organizada.</div></div><div class="stage-content"><div class="stage-greeting"><span>EXEMPLO DE INTERFACE</span><strong>Bom dia, equipe 👋</strong><p>Veja o que está acontecendo na sua comunidade.</p></div><div class="stage-stats"><div><small>Membros cadastrados</small><b>248</b><span>↗ Atualizado recentemente</span></div><div><small>Próximos encontros</small><b>04</b><span>Confira a agenda</span></div><div><small>Pedidos de oração</small><b>12</b><span>3 aguardando atenção</span></div></div><div class="stage-list"><div><strong>Próximos eventos</strong><small>Ver agenda →</small></div><article><span class="date-tile">15 <small>NOV</small></span><div><b>Culto da família</b><small>Domingo · 10h</small></div><span class="pill">Confirmado</span></article><article><span class="date-tile">18 <small>NOV</small></span><div><b>Encontro de líderes</b><small>Quarta · 19h30</small></div><span class="pill">Confirmado</span></article></div></div></div><div class="stage-label">PRÉVIA ILUSTRATIVA · DADOS FICTÍCIOS</div></div></section><section class="wrap value-section" id="produto"><div class="section-heading"><div><div class="eyebrow">TUDO EM SEU LUGAR</div><h2>Uma rotina mais leve.<br><em>Uma igreja mais próxima.</em></h2></div><p>Do cadastro de membros à comunicação dos próximos encontros: recursos que resolvem tarefas reais do dia a dia.</p></div><div class="value-grid"><article class="value-card value-feature"><div class="feature-icon">◉</div><span class="feature-count">01 / PRESENÇA DIGITAL</span><h3>Um lugar para sua comunidade encontrar você.</h3><p>Apresente sua igreja, publique sua agenda e receba pedidos de oração em uma página própria.</p><div class="feature-mini"><span>Endereço exclusivo da sua igreja</span><b>↗</b></div></article><article class="value-card"><div class="feature-icon">♧</div><span class="feature-count">02 / GESTÃO</span><h3>Conheça e acompanhe seus membros.</h3><p>Informações organizadas e protegidas, acessíveis à equipe autorizada.</p></article><article class="value-card"><div class="feature-icon">▤</div><span class="feature-count">03 / MINISTÉRIOS</span><h3>Organize escalas sem desencontro.</h3><p>Centralize as equipes e distribua responsabilidades com clareza.</p></article></div></section><section class="wrap steps-section" id="como-funciona"><div class="section-heading"><div><div class="eyebrow">DO PRIMEIRO CONTATO À IMPLANTAÇÃO</div><h2>Simples de começar.<br><em>Feito para continuar.</em></h2></div></div><div class="steps-row"><article><span>01</span><h3>Escolha seus recursos</h3><p>Você vê exatamente o que está contratando e quanto custa.</p></article><article><span>02</span><h3>Receba sua proposta</h3><p>Nossa equipe confirma o escopo e organiza a implantação.</p></article><article><span>03</span><h3>Comece a usar</h3><p>Acesse o painel da igreja e gerencie sua comunidade.</p></article></div></section><section class="wrap final-section"><div class="final-cta"><div class="eyebrow">SUA IGREJA, NO SEU RITMO</div><h2>Comece pelo que importa.<br>O resto acompanha seu crescimento.</h2><a href="/montar" class="btn btn-light">Montar minha solução ↗</a><p>Orçamento sem compromisso. Não há cobrança nesta etapa.</p></div></section></main>`);}
function configurator(){return layout('Monte sua solução',`<main class="wrap"><div class="eyebrow">CONFIGURADOR · ETAPA ÚNICA</div><h1>Monte a solução da sua igreja</h1><p class="muted">Simule sua mensalidade e solicite a implantação. O envio ainda não gera cobrança.</p><div class="builder"><form id="order-form" class="stack"><div class="builder-progress" aria-label="Etapas da configuração"><span class="is-current">01 <b>Identidade</b></span><span>02 <b>Ferramentas</b></span><span>03 <b>Solicitação</b></span></div><section class="panel"><h2>1. Escolha um modelo</h2><div id="templates" class="templates"><label><input type="radio" name="template" value="moderno" checked><span>Moderno</span></label><label><input type="radio" name="template" value="tradicional"><span>Tradicional</span></label><label><input type="radio" name="template" value="minimalista"><span>Minimalista</span></label><label><input type="radio" name="template" value="transmissoes"><span>Transmissões</span></label><label><input type="radio" name="template" value="personalizado"><span>Personalizado</span></label></div><div class="builder-identity"><label>Nome da igreja para visualizar<input id="preview-church-input" type="text" placeholder="Ex.: Comunidade Esperança" maxlength="100"></label><label>Cor principal <input type="color" name="color" value="#173d46"></label></div><div id="site-preview" class="preview"><div class="preview-top"><span class="preview-emblem">✳</span><span id="preview-name">Sua comunidade</span><span class="preview-menu">Início &nbsp; Agenda &nbsp; Contato</span></div><div class="preview-body"><div class="preview-kicker">SEJA BEM-VINDO</div><h3 id="preview-title">Um lugar para estarmos juntos.</h3><p>Encontros, histórias e uma comunidade que acolhe.</p><span class="preview-button">Conheça nossa igreja ↗</span></div><div class="preview-bottom">Domingo · 10h e 18h <span>SEU SITE, SUA IDENTIDADE</span></div></div></section><section class="panel"><div class="section-kicker">ESCOLHA SOMENTE O QUE VOCÊ VAI USAR</div><h2>2. Selecione os recursos</h2><p class="muted">Cada recurso abaixo já possui funcionalidade operacional. Você pode contratar um ou vários.</p><div id="catalog" class="catalog">Carregando catálogo…</div></section><section class="panel"><div class="section-kicker">ÚLTIMA ETAPA</div><h2>3. Identifique sua igreja</h2><p class="muted">Nossa equipe avaliará sua solicitação antes de qualquer cobrança. Você receberá um código para acompanhar.</p><div class="fields"><label>Nome da igreja *<input name="church" required maxlength="100"></label><label>Responsável *<input name="contact" required maxlength="100"></label><label>E-mail *<input name="email" type="email" required maxlength="200"></label><label>WhatsApp *<input name="phone" required maxlength="20" placeholder="(21) 99999-9999"></label><label>Cidade *<input name="city" required maxlength="90"></label><label>Estado (UF) *<input name="state" required maxlength="2" minlength="2" placeholder="RJ"></label></div><label>Observações <textarea name="notes" maxlength="1000" rows="3"></textarea></label><button class="btn" type="submit">Solicitar proposta personalizada ↗</button><p id="order-result" aria-live="polite"></p></section></form><aside class="panel summary"><h2>Seu orçamento</h2><p class="summary-caption">CONFIGURAÇÃO ATUAL</p><div id="selected-items" class="selected">Nenhum módulo selecionado</div><hr><div class="sumline">Mensalidade básica <span id="base">—</span></div><div class="sumline total">Mensalidade estimada <strong id="total">—</strong></div><div class="summary-divider"></div><div class="sumline">Implantação única <span id="setup">—</span></div><small>Valores indicativos para solicitação. Não há pagamento nesta etapa. Recursos serão confirmados na proposta e somente entregues após implantação.</small></aside></div></main>`);}
function tracking(){return layout('Acompanhar pedido',`<main class="wrap narrow"><h1>Acompanhe sua solicitação</h1><p>Informe o número e a chave de acompanhamento recebidos após o envio do orçamento.</p><form id="track-form" class="panel stack"><label>Número do pedido <input name="id" required></label><label>Chave privativa <input name="key" required></label><button class="btn">Consultar pedido</button></form><div id="track-result" aria-live="polite"></div></main>`);}
function adminPage(){return layout('Painel da equipe',`<main class="wrap"><h1>Painel operacional</h1><div id="login-area" class="panel narrow"><h2>Entrar como administrador</h2><form id="login-form" class="stack"><label>Usuário <input name="username" required></label><label>Senha <input name="password" type="password" required></label><button class="btn">Entrar</button></form></div><div id="admin-area" hidden><div class="tabs"><button data-panel="orders">Pedidos</button><button data-panel="catalog-admin">Catálogo</button><button data-panel="upgrades-admin">Pedidos de desbloqueio</button><button data-panel="churches-admin">Igrejas</button><button data-panel="settings-admin">Preços base</button><button id="logout">Sair</button></div><section id="orders" class="panel admin-panel"><h2>Solicitações recebidas</h2><div id="orders-list"></div></section><section id="churches-admin" hidden class="panel admin-panel"><h2>Igrejas provisionadas</h2><p>Converta um pedido em uma igreja operacional. A senha inicial deve ser compartilhada por canal seguro e trocada antes do uso público.</p><form id="provision-form" class="stack"><label>ID do pedido<input name="order_id" required placeholder="ELV-..."></label><label>Endereço da igreja (slug)<input name="slug" required minlength="3" placeholder="igreja-exemplo"></label><label>Usuário inicial<input name="username" required></label><label>Senha inicial (mín. 12 caracteres)<input name="password" type="password" required minlength="12"></label><button class="btn">Criar igreja</button></form><div id="churches-list"></div></section><section id="catalog-admin" hidden class="panel admin-panel"><h2>Gerenciar módulos</h2><p class="muted">Alterações no catálogo afetam novos orçamentos, não pedidos antigos.</p><div id="admin-modules"></div></section><section id="upgrades-admin" hidden class="panel admin-panel"><h2>Solicitações de desbloqueio</h2><p>Pedidos de interesse e contratação. Nenhum recurso é liberado automaticamente.</p><div id="upgrades-list"></div></section><section id="settings-admin" hidden class="panel admin-panel"><h2>Valores do serviço</h2><form id="settings-form" class="stack"><label>Mensalidade básica (R$) <input name="base" type="number" min="0" step="0.01" required></label><label>Implantação (R$) <input name="setup" type="number" min="0" step="0.01" required></label><button class="btn">Salvar preços</button></form></section></div><p id="admin-status" aria-live="polite"></p></main>`);}
const publicDir=path.join(root,'public');
const tenantRoutes=makeTenantRoutes(db);
export async function handler(req,res){try{
 if(rate(req))throw err(429,'Muitas requisições; tente novamente em um minuto');
 const u=new URL(req.url,'http://localhost'); const p=u.pathname;const m=req.method;
 if(await tenantRoutes(req,res,p))return;
 if(m==='GET'&&(p==='/'||p==='/montar'||p==='/acompanhar'||p==='/admin'))return html(res,200,({'/':renderHome,'/montar':renderBuilder,'/acompanhar':tracking,'/admin':adminPage})[p]());
 if(m==='GET'&&(p==='/style.css'||p==='/app.js'||p==='/home.css'||p==='/home.js'||p==='/builder.css'||p==='/builder-client.js'||p==='/church-site.css'||p==='/demo-feature.css'||p==='/demo-hub.css'||p==='/demo-hub.js'||p==='/traditional-hub.css'||p==='/crm.css'||p==='/crm-client.js')){res.writeHead(200,{'Content-Type':p.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','X-Content-Type-Options':'nosniff'});return res.end(fs.readFileSync(path.join(publicDir,p.substring(1))));}
 if(m==='GET'&&/^\/assets\/[a-z0-9-]+\.webp$/.test(p)){
  const asset=path.join(publicDir,p.substring(1));
  if(!fs.existsSync(asset))throw err(404,'Arquivo não encontrado');
  res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'});
  return res.end(fs.readFileSync(asset));
 }
 // Instant trial: generates a non-production site without order, payment, or customer provisioning.
 if(m==='POST'&&p==='/api/demo-sites'){
  const b=await body(req);
  if(!validText(b.name,1,100)||!validText(b.headline||'',0,120)||!validText(b.description||'',0,1000)||!validText(b.location||'',0,90)||!templates.includes(b.template)||!/^#[0-9a-fA-F]{6}$/.test(b.color)||!validLogo(b.logo_data||'')||!Array.isArray(b.modules)||b.modules.some(x=>!DELIVERABLE_MODULES.includes(x)))throw err(400,'Confira as informações do site');
  const id=randomBytes(20).toString('hex');
  const site=normalizeSite({...b,modules:['site','eventos','oracao']});
  db.prepare('INSERT INTO demo_sites(id,payload,created_at) VALUES(?,?,?)').run(id,JSON.stringify(site),now());
  return json(res,201,{id,url:'/demo/'+id});
 }
 // CRM persists the data of each demo independently. Its random URL acts as a test-only access key.
 const demoVisitor=/^\/api\/demo\/([0-9a-f]{40})\/visitors$/.exec(p);
 if(m==='POST'&&demoVisitor){
  const exists=db.prepare('SELECT id FROM demo_sites WHERE id=?').get(demoVisitor[1]);
  if(!exists)throw err(404,'Demonstração não encontrada');
  const scope={type:'demo',id:demoVisitor[1]};
  checkPublicIntakeRate(req.socket.remoteAddress,scope);
  const origin=req.headers.origin;
  if(origin){let host;try{host=new URL(origin).host;}catch{throw err(403,'Origem inválida');}if(host!==req.headers.host)throw err(403,'Origem não autorizada');}
  return json(res,201,registerPublicVisitor(db,scope,await body(req)));
 }
 const demoCRM=/^\/demo\/([0-9a-f]{40})\/crm$/.exec(p);
 if(m==='GET'&&demoCRM){
  const record=db.prepare('SELECT payload FROM demo_sites WHERE id=?').get(demoCRM[1]);
  if(!record)throw err(404,'Demonstração não encontrada');
  return html(res,200,renderCRM(JSON.parse(record.payload),{demoId:demoCRM[1]}));
 }
 const demoCRMApi=/^\/api\/demo\/([0-9a-f]{40})\/crm\/(people|activities|tasks|events|groups|attendance)(?:\/([a-f0-9]{32}))?$/.exec(p);
 const demoCRMExport=/^\/api\/demo\/([0-9a-f]{40})\/crm\/export\/people$/.exec(p);
 const demoCRMSeed=/^\/api\/demo\/([0-9a-f]{40})\/crm\/seed$/.exec(p);
 const demoCRMSummary=/^\/api\/demo\/([0-9a-f]{40})\/crm\/summary$/.exec(p);
 if(demoCRMApi||demoCRMExport||demoCRMSeed||demoCRMSummary){
  const ownerId=(demoCRMApi||demoCRMExport||demoCRMSeed||demoCRMSummary)[1];
  if(!db.prepare('SELECT 1 FROM demo_sites WHERE id=?').get(ownerId))throw err(404,'Demonstração não encontrada');
  const scope={type:'demo',id:ownerId};
  if(demoCRMSummary){if(m!=='GET')throw err(405,'Método não permitido');return json(res,200,{...crmSummary(db,scope),tasks:db.prepare("SELECT * FROM crm_tasks WHERE owner_type='demo' AND owner_id=? AND status='todo' ORDER BY due_at ASC LIMIT 4").all(ownerId),upcoming_events:db.prepare("SELECT * FROM crm_events WHERE owner_type='demo' AND owner_id=? ORDER BY starts_at ASC LIMIT 3").all(ownerId)});}
  if(demoCRMSeed){if(m!=='POST')throw err(405,'Método não permitido');const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host)throw err(403,'Origem não autorizada');return json(res,201,seedDemoCRM(db,ownerId));}
  if(demoCRMExport){if(m!=='GET')throw err(405,'Método não permitido');res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="contatos-crm.csv"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});return res.end(exportContactsCSV(db,scope));}
  return await handleCRM(req,res,db,scope,demoCRMApi[2],demoCRMApi[3]);
 }
 const demoHub=/^\/demo\/([0-9a-f]{40})\/hub$/.exec(p);
 if(m==='GET'&&demoHub){
  const record=db.prepare('SELECT payload FROM demo_sites WHERE id=?').get(demoHub[1]);
  if(!record)throw err(404,'Demonstração não encontrada');
  return html(res,200,renderDemoHub(JSON.parse(record.payload),demoHub[1]));
 }
 const demoPage=/^\/demo\/([0-9a-f]{40})$/.exec(p);
 if(m==='GET'&&demoPage){
  const record=db.prepare('SELECT payload FROM demo_sites WHERE id=?').get(demoPage[1]);
  if(!record)throw err(404,'Demonstração não encontrada');
  const site=JSON.parse(record.payload);
  const events=db.prepare("SELECT title,starts_at,location,description FROM crm_events WHERE owner_type='demo' AND owner_id=? ORDER BY starts_at ASC LIMIT 12").all(demoPage[1]);
  return html(res,200,renderChurchSite({...site,modules:featureCatalog.map(f=>f.id),events},{preview:true,demo:true,demoId:demoPage[1]}));
 }
 const demoFeature=/^\/demo\/([0-9a-f]{40})\/recurso\/([a-z0-9-]+)$/.exec(p);
 if(m==='GET'&&demoFeature){
  const record=db.prepare('SELECT payload FROM demo_sites WHERE id=?').get(demoFeature[1]);
  if(!record)throw err(404,'Demonstração não encontrada');
  const feature=featureCatalog.find(x=>x.id===demoFeature[2]);
  if(!feature)throw err(404,'Recurso não encontrado');
  const crmViews={membros:'people',visitantes:'people',cadastro:'people',carteirinha:'people',presenca:'attendance',eventos:'events',inscricoes:'events',celulas:'groups',paginaMinisterios:'groups','pagina-ministerios':'groups',voluntarios:'groups',tarefas:'tasks',mensagensVisitantes:'activities','mensagens-visitantes':'activities'};
  if(crmViews[feature.id]){res.writeHead(302,{Location:'/demo/'+demoFeature[1]+'/crm?view='+crmViews[feature.id], 'Cache-Control':'no-store'});return res.end();}
  return html(res,200,renderDemoFeature(JSON.parse(record.payload),feature,demoFeature[1]));
 }
 const demoApi=/^\/api\/demo-sites\/([0-9a-f]{40})$/.exec(p);
 if(m==='GET'&&demoApi){
  const record=db.prepare('SELECT payload FROM demo_sites WHERE id=?').get(demoApi[1]);
  if(!record)throw err(404,'Demonstração não encontrada');
  return json(res,200,{site:JSON.parse(record.payload)});
 }
 if(m==='POST'&&p==='/api/site-preview'){
  const b=await body(req);
  if(!validText(b.name||'Sua igreja',1,100)||!validText(b.headline||'',0,120)||!validText(b.description||'',0,1000)||!validText(b.location||'',0,90)||!templates.includes(b.template)||!/^#[0-9a-fA-F]{6}$/.test(b.color)||!validLogo(b.logo_data||'')||!Array.isArray(b.modules)||b.modules.some(x=>!DELIVERABLE_MODULES.includes(x)))throw err(400,'Configuração inválida para a prévia');
  return json(res,200,{html:renderChurchSite({...normalizeSite(b),modules:featureCatalog.map(f=>f.id)},{preview:true,demo:true})});
 }
 if(m==='GET'&&p==='/api/catalog')return json(res,200,{modules:db.prepare(`SELECT * FROM modules WHERE active=1 AND id IN ('site','eventos','membros','oracao','escalas') ORDER BY category,name`).all(),...getSettings()});
 if(m==='POST'&&p==='/api/quote'){const b=await body(req);const q=quote(b.module_ids);return json(res,200,q);}
 if(m==='POST'&&p==='/api/orders'){
  const b=await body(req);const fields=[['church',2,100],['contact',2,100],['email',5,200],['phone',8,20],['city',2,90],['state',2,2]];
  for(let [f,a,z] of fields)if(!validText(b[f],a,z))throw err(400,`Campo ${f} inválido`);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)||!/^[A-Za-z]{2}$/.test(b.state)||!templates.includes(b.template)||!/^#[0-9a-fA-F]{6}$/.test(b.color)||!validText(b.notes??'',0,1000)||!validText(b.headline??'',0,120)||!validText(b.location??'',0,90)||!validText(b.site_description??'',0,1000)||!validLogo(b.logo_data||''))throw err(400,'Dados inválidos');
  const q=quote(b.module_ids);const id='ELV-'+randomBytes(6).toString('hex').toUpperCase();const key=hex();const dt=now();
  db.exec('BEGIN IMMEDIATE');try{
   db.prepare('INSERT INTO orders(id,tracking_hash,church,contact,email,phone,city,state,template,color,notes,base_cents,setup_cents,total_cents,status,created_at,updated_at,headline,location,logo_data,site_description) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,hash(key),b.church.trim(),b.contact.trim(),b.email.trim().toLowerCase(),b.phone.trim(),b.city.trim(),b.state.toUpperCase(),b.template,b.color,b.notes??'',q.base_cents,q.setup_cents,q.total_cents,'recebido',dt,dt,b.headline||'',b.location||'',b.logo_data||'',b.site_description||'');
   const stmt=db.prepare('INSERT INTO order_modules VALUES(?,?,?,?)');q.modules.forEach(x=>stmt.run(id,x.id,x.name,x.price_cents));
   db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(id,'recebido','Solicitação registrada',dt);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');throw e;}
  return json(res,201,{id,key,status:'recebido',total_cents:q.total_cents,setup_cents:q.setup_cents});
 }
 if(m==='POST'&&p==='/api/track'){
  const b=await body(req);if(!validText(b.id,8,40)||!validText(b.key,48,48))throw err(400,'Credenciais de acompanhamento inválidas');
  const order=db.prepare('SELECT id,church,template,color,total_cents,setup_cents,status,created_at,updated_at FROM orders WHERE id=? AND tracking_hash=?').get(b.id,hash(b.key));if(!order)throw err(404,'Pedido não encontrado');
  return json(res,200,{order,modules:db.prepare('SELECT module_name,price_cents FROM order_modules WHERE order_id=?').all(b.id),history:db.prepare('SELECT status,note,created_at FROM order_events WHERE order_id=? ORDER BY id').all(b.id)});
 }
 if(m==='POST'&&p==='/api/admin/login'){
  const b=await body(req);const a=db.prepare('SELECT * FROM admins WHERE username=?').get(b.username||'');if(!a||typeof b.password!=='string'||b.password.length>300)throw err(401,'Credenciais inválidas');
  const h=scryptSync(b.password,a.salt,64);if(!timingSafeEqual(h,Buffer.from(a.password_hash,'hex')))throw err(401,'Credenciais inválidas');
  const token=hex(),csrfToken=hex();db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(hash(token),a.id,csrfToken,Date.now()+8*3600000);
  return json(res,200,{csrf:csrfToken},{'Set-Cookie':`elovia_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`});
 }
 if(p.startsWith('/api/admin/')){
  const a=requireAdmin(req);if(m==='GET'&&p==='/api/admin/session')return json(res,200,{csrf:a.csrf});
  if(m==='GET'&&p==='/api/admin/upgrade-requests')return json(res,200,{requests:db.prepare('SELECT r.id,r.module_id,r.status,r.created_at,c.name AS church,c.slug FROM church_upgrade_requests r JOIN churches c ON c.id=r.church_id ORDER BY r.created_at DESC LIMIT 500').all()});
  if(m==='GET'&&p==='/api/admin/orders')return json(res,200,{orders:db.prepare('SELECT id,church,contact,email,phone,city,state,template,total_cents,setup_cents,status,created_at FROM orders ORDER BY created_at DESC LIMIT 200').all()});
  if(m==='GET'&&p==='/api/admin/churches')return json(res,200,{churches:db.prepare('SELECT c.id,c.slug,c.name,c.order_id,c.created_at FROM churches c ORDER BY c.created_at DESC').all()});
  if(m==='POST'&&p==='/api/admin/provision'){csrf(req,a);const b=await body(req);const created=provisionChurch(db,b.order_id,b.slug,b.username,b.password);return json(res,201,created);}
  if(m==='GET'&&p==='/api/admin/modules')return json(res,200,{modules:db.prepare('SELECT * FROM modules ORDER BY category,name').all(),settings:getSettings()});
  if(m==='POST'&&p==='/api/admin/logout'){csrf(req,a);const token=/\belovia_session=([0-9a-f]{48})\b/.exec(req.headers.cookie||'')?.[1];db.prepare('DELETE FROM sessions WHERE id_hash=?').run(hash(token));return json(res,200,{ok:true},{'Set-Cookie':'elovia_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
  if(m==='POST'&&/^\/api\/admin\/orders\/ELV-[0-9A-F]{12}\/status$/.test(p)){
   csrf(req,a);const id=p.split('/')[4],b=await body(req),order=db.prepare('SELECT status FROM orders WHERE id=?').get(id);
   if(!order)throw err(404,'Pedido não encontrado');if(!statuses.includes(b.status)||!transitions[order.status].includes(b.status)||!validText(b.note||'',0,500))throw err(400,'Transição de status inválida');
   db.exec('BEGIN IMMEDIATE');try{db.prepare('UPDATE orders SET status=?,updated_at=? WHERE id=?').run(b.status,now(),id);db.prepare('INSERT INTO order_events(order_id,status,note,created_at) VALUES(?,?,?,?)').run(id,b.status,b.note||'',now());db.prepare('INSERT INTO audit(admin_id,action,target,created_at) VALUES(?,?,?,?)').run(a.admin_id,'status:'+b.status,id,now());db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}return json(res,200,{ok:true});
  }
  if(m==='PATCH'&&/^\/api\/admin\/modules\/[a-z-]+$/.test(p)){
   csrf(req,a);const id=p.split('/')[4],b=await body(req);if(!validText(b.name,2,80)||!validText(b.description,2,240)||!Number.isInteger(b.price_cents)||b.price_cents<0||b.price_cents>10000000||typeof b.active!=='boolean')throw err(400,'Dados do módulo inválidos');
   const r=db.prepare('UPDATE modules SET name=?,description=?,price_cents=?,active=? WHERE id=?').run(b.name,b.description,b.price_cents,b.active?1:0,id);if(!r.changes)throw err(404,'Módulo não encontrado');db.prepare('INSERT INTO audit(admin_id,action,target,created_at) VALUES(?,?,?,?)').run(a.admin_id,'module:update',id,now());return json(res,200,{ok:true});
  }
  if(m==='PATCH'&&p==='/api/admin/settings'){
   csrf(req,a);const b=await body(req);for(const key of ['base_cents','setup_cents'])if(!Number.isInteger(b[key])||b[key]<0||b[key]>10000000)throw err(400,'Preço inválido');
   db.prepare('UPDATE settings SET value=? WHERE key=?').run(b.base_cents,'base_cents');db.prepare('UPDATE settings SET value=? WHERE key=?').run(b.setup_cents,'setup_cents');db.prepare('INSERT INTO audit(admin_id,action,target,created_at) VALUES(?,?,?,?)').run(a.admin_id,'settings:update','pricing',now());return json(res,200,{ok:true});
  }
 }
 throw err(404,'Rota não encontrada');
 }catch(e){console.error(e.code>=500?e:e.message);return json(res,e.code||500,{error:e.code?e.message:'Erro interno do servidor'});}}
// Vercel invokes the exported handler, while local development binds a port.
if(process.env.NODE_ENV!=='test' && !isVercel){const server=http.createServer(handler);server.listen(Number(process.env.PORT||3000),'127.0.0.1',()=>console.log('Elovia: http://127.0.0.1:'+server.address().port));}
export default handler;
export {quote,db,transitions};
