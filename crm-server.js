import { randomBytes } from 'node:crypto';

const newId=()=>randomBytes(16).toString('hex');
const when=()=>new Date().toISOString();
const fail=(code,message)=>Object.assign(new Error(message),{code});
const text=(v,max=240)=>typeof v==='string'&&v.trim().length<=max?v.trim():null;
const needed=(v,max=240)=>{const t=text(v,max);if(!t)throw fail(400,'Preencha os campos obrigatórios');return t;};
const optional=(v,max=240)=>{if(v===undefined||v===null)return '';const t=text(v,max);if(t===null)throw fail(400,'Campo inválido ou muito longo');return t;};
const enumerated=(v,allowed)=>{if(!allowed.includes(v))throw fail(400,'Valor inválido');return v;};
const dateValue=(v)=>{const x=optional(v,35);if(x&&!/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d(?::\d\d)?)?$/.test(x))throw fail(400,'Data inválida');return x;};
const schemas={
 people:{table:'crm_people',fields:['name','kind','stage','email','phone','ministry','notes'],required:['name'],sort:'created_at DESC'},
 activities:{table:'crm_activities',fields:['person_id','channel','summary','occurred_at'],required:['person_id','summary'],sort:'occurred_at DESC'},
 tasks:{table:'crm_tasks',fields:['title','details','due_at','status','assigned_to','person_id'],required:['title'],sort:"CASE WHEN status='done' THEN 1 ELSE 0 END,due_at ASC,created_at DESC"},
 events:{table:'crm_events',fields:['title','starts_at','location','description'],required:['title'],sort:'starts_at ASC,created_at DESC'},
 groups:{table:'crm_groups',fields:['name','leader','description'],required:['name'],sort:'name COLLATE NOCASE ASC'},
 attendance:{table:'crm_attendance',fields:['person_id','event_id','status'],required:['person_id','event_id'],sort:'created_at DESC'}
};
const idCols=['person_id','event_id'];
const withUpdatedAt=new Set(['people','tasks','events','groups']);
export function initCRM(db){
 db.exec(`CREATE TABLE IF NOT EXISTS crm_people(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,name TEXT NOT NULL,kind TEXT NOT NULL,stage TEXT NOT NULL,email TEXT NOT NULL DEFAULT '',phone TEXT NOT NULL DEFAULT '',ministry TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS crm_activities(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,person_id TEXT NOT NULL,channel TEXT NOT NULL,summary TEXT NOT NULL,occurred_at TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(person_id) REFERENCES crm_people(id) ON DELETE CASCADE);
 CREATE TABLE IF NOT EXISTS crm_tasks(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,title TEXT NOT NULL,details TEXT NOT NULL DEFAULT '',due_at TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'todo',assigned_to TEXT NOT NULL DEFAULT '',person_id TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS crm_events(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,title TEXT NOT NULL,starts_at TEXT NOT NULL DEFAULT '',location TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS crm_groups(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,name TEXT NOT NULL,leader TEXT NOT NULL DEFAULT '',description TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS crm_attendance(id TEXT PRIMARY KEY,owner_type TEXT NOT NULL,owner_id TEXT NOT NULL,person_id TEXT NOT NULL,event_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'presente',created_at TEXT NOT NULL,FOREIGN KEY(person_id) REFERENCES crm_people(id) ON DELETE CASCADE,FOREIGN KEY(event_id) REFERENCES crm_events(id) ON DELETE CASCADE);
 CREATE INDEX IF NOT EXISTS ix_crm_people_scope ON crm_people(owner_type,owner_id,kind,stage);
 CREATE INDEX IF NOT EXISTS ix_crm_activities_scope ON crm_activities(owner_type,owner_id,person_id);
 CREATE INDEX IF NOT EXISTS ix_crm_tasks_scope ON crm_tasks(owner_type,owner_id,status);
 CREATE INDEX IF NOT EXISTS ix_crm_events_scope ON crm_events(owner_type,owner_id,starts_at);
 CREATE INDEX IF NOT EXISTS ix_crm_attendance_scope ON crm_attendance(owner_type,owner_id,event_id);
 CREATE UNIQUE INDEX IF NOT EXISTS ux_crm_attendance ON crm_attendance(owner_type,owner_id,person_id,event_id);`);
}


/** Importa os membros cadastrados anteriormente no painel operacional.
 * O CRM usa o mesmo ID de cada membro, evitando uma segunda cópia independente. */
export function syncLegacyMembers(db,churchId){
 const current=db.prepare('SELECT * FROM church_members WHERE church_id=? LIMIT 10000').all(churchId);
 const insert=db.prepare(`INSERT INTO crm_people(id,owner_type,owner_id,name,kind,stage,email,phone,ministry,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,phone=excluded.phone,notes=excluded.notes,updated_at=excluded.updated_at WHERE owner_type='church' AND owner_id=excluded.owner_id`);
 for(const member of current){insert.run(member.id,'church',churchId,member.name,'membro','integrado',member.email||'',member.phone||'','',member.notes||'',member.created_at,member.created_at);}
}
function mirrorPersonToLegacy(db,scope,personId){
 if(scope.type!=='church')return;
 const person=db.prepare("SELECT * FROM crm_people WHERE owner_type='church' AND owner_id=? AND id=?").get(scope.id,personId);
 if(!person||person.kind!=='membro'){
  db.prepare('DELETE FROM church_members WHERE id=? AND church_id=?').run(personId,scope.id);
  return;
 }
 db.prepare(`INSERT INTO church_members(id,church_id,name,email,phone,notes,created_at) VALUES(?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET name=excluded.name,email=excluded.email,phone=excluded.phone,notes=excluded.notes
 WHERE church_id=excluded.church_id`).run(person.id,scope.id,person.name,person.email,person.phone,person.notes,person.created_at);
}


export function syncLegacyEvents(db,churchId){
 const events=db.prepare('SELECT * FROM church_events WHERE church_id=? LIMIT 10000').all(churchId);
 const insert=db.prepare(`INSERT INTO crm_events(id,owner_type,owner_id,title,starts_at,location,description,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,starts_at=excluded.starts_at,location=excluded.location,description=excluded.description,updated_at=excluded.updated_at
 WHERE owner_type='church' AND owner_id=excluded.owner_id`);
 for(const e of events)insert.run(e.id,'church',churchId,e.title,e.starts_at,e.location,e.description,e.created_at,e.created_at);
}
function mirrorEventToLegacy(db,scope,eventId){
 if(scope.type!=='church')return;
 const e=db.prepare("SELECT * FROM crm_events WHERE owner_type='church' AND owner_id=? AND id=?").get(scope.id,eventId);
 if(!e){db.prepare('DELETE FROM church_events WHERE church_id=? AND id=?').run(scope.id,eventId);return;}
 db.prepare(`INSERT INTO church_events(id,church_id,title,starts_at,location,description,created_at) VALUES(?,?,?,?,?,?,?)
 ON CONFLICT(id) DO UPDATE SET title=excluded.title,starts_at=excluded.starts_at,location=excluded.location,description=excluded.description
 WHERE church_id=excluded.church_id`).run(e.id,scope.id,e.title,e.starts_at,e.location,e.description,e.created_at);
}

function sanitize(resource,payload,scope,db){
 if(!payload||typeof payload!=='object'||Array.isArray(payload))throw fail(400,'Dados inválidos');
 const out={};
 for(const field of schemas[resource].fields){
  const val=payload[field];
  if(schemas[resource].required.includes(field))out[field]=needed(val,field==='summary'?1800:150);
  else out[field]=optional(val,field==='notes'||field==='details'||field==='description'?1800:field==='email'?200:150);
 }
 if(resource==='people'){
  out.kind=enumerated(payload.kind||'visitante',['membro','visitante']);
  out.stage=enumerated(payload.stage||'novo',['novo','contatado','acompanhamento','integrado','inativo']);
  if(out.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))throw fail(400,'E-mail inválido');
 }
 if(resource==='activities'){
  out.channel=enumerated(payload.channel||'outro',['whatsapp','telefone','presencial','email','outro']);
  out.occurred_at=dateValue(payload.occurred_at)||when();
 }
 if(resource==='tasks'){
  out.status=enumerated(payload.status||'todo',['todo','done']);
  out.due_at=dateValue(payload.due_at);
 }
 if(resource==='events')out.starts_at=dateValue(payload.starts_at);
 if(resource==='attendance')out.status=enumerated(payload.status||'presente',['presente','ausente']);
 for(const col of idCols){
  if(out[col]){
   if(!/^[a-f0-9]{32}$/.test(out[col]))throw fail(400,'Referência inválida');
   const table=col==='person_id'?'crm_people':'crm_events';
   if(!db.prepare(`SELECT 1 FROM ${table} WHERE owner_type=? AND owner_id=? AND id=?`).get(scope.type,scope.id,out[col]))throw fail(404,'Registro relacionado não encontrado');
  }
 }
 return out;
}
function result(res,code,data,headers={}){res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(data));}
async function payload(req){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>25000)throw fail(413,'Dados excedem o limite');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw fail(400,'JSON inválido');}}
function scoped(db,resource,scope){const spec=schemas[resource];return db.prepare(`SELECT * FROM ${spec.table} WHERE owner_type=? AND owner_id=? ORDER BY ${spec.sort} LIMIT 1000`).all(scope.type,scope.id);}
export async function handleCRM(req,res,db,scope,resource,id,options={}){
 if(!schemas[resource])throw fail(404,'Seção não encontrada');
 const method=req.method;
 if(method==='GET'&&!id){return result(res,200,{items:scoped(db,resource,scope)});}
 if(!['POST','PATCH','DELETE'].includes(method))throw fail(405,'Método não permitido');
 if(options.readOnly)throw fail(403,'Ação não permitida');
 if(options.csrf && req.headers['x-csrf-token']!==options.csrf)throw fail(403,'Token de segurança inválido');
 if(scope.type==='demo'){
   const origin=req.headers.origin;
   if(origin){let host;try{host=new URL(origin).host;}catch{throw fail(403,'Origem inválida');}if(host!==req.headers.host)throw fail(403,'Origem não autorizada');}
 }
 const spec=schemas[resource];
 if(method==='DELETE'){
  if(options.allowDelete===false)throw fail(403,'Apenas o responsável pode excluir registros');
  if(!id)throw fail(400,'Informe o registro');
  const row=db.prepare(`DELETE FROM ${spec.table} WHERE id=? AND owner_type=? AND owner_id=?`).run(id,scope.type,scope.id);
  if(!row.changes)throw fail(404,'Registro não encontrado');
  if(resource==='people'){db.prepare("UPDATE crm_tasks SET person_id='' WHERE owner_type=? AND owner_id=? AND person_id=?").run(scope.type,scope.id,id);mirrorPersonToLegacy(db,scope,id);}
  if(resource==='events')mirrorEventToLegacy(db,scope,id);
  return result(res,200,{ok:true});
 }
 if(method==='PATCH'&&!id||method==='POST'&&id)throw fail(405,'Método não permitido');
 if(method==='PATCH'&&!db.prepare(`SELECT 1 FROM ${spec.table} WHERE id=? AND owner_type=? AND owner_id=?`).get(id,scope.type,scope.id))throw fail(404,'Registro não encontrado');
 const data=sanitize(resource,await payload(req),scope,db);
 const fields=spec.fields;
 const values=fields.map(f=>data[f]);
 const now=when();
 if(method==='POST'){
  const rowId=newId();
  const extras=withUpdatedAt.has(resource)?['created_at','updated_at']:['created_at'];
  const names=['id','owner_type','owner_id',...fields,...extras];
  try{db.prepare(`INSERT INTO ${spec.table} (${names.join(',')}) VALUES (${names.map(()=>'?').join(',')})`).run(rowId,scope.type,scope.id,...values,...extras.map(()=>now));}
  catch(e){if(e.code==='ERR_SQLITE_ERROR'||String(e.message).includes('UNIQUE'))throw fail(409,'Registro já existente');throw e;}
  if(resource==='people')mirrorPersonToLegacy(db,scope,rowId);
  if(resource==='events')mirrorEventToLegacy(db,scope,rowId);
  return result(res,201,{id:rowId,ok:true});
 }
 const updates=fields.map(f=>f+'=?').concat(withUpdatedAt.has(resource)?['updated_at=?']:[]);
 const v=values.concat(withUpdatedAt.has(resource)?[now]:[]);
 db.prepare(`UPDATE ${spec.table} SET ${updates.join(',')} WHERE id=? AND owner_type=? AND owner_id=?`).run(...v,id,scope.type,scope.id);
 if(resource==='people')mirrorPersonToLegacy(db,scope,id);
 if(resource==='events')mirrorEventToLegacy(db,scope,id);
 return result(res,200,{ok:true});
}
export function crmSummary(db,scope){
 const count=(table,extra='')=>db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE owner_type=? AND owner_id=? ${extra}`).get(scope.type,scope.id).n;
 return {
  contacts:count('crm_people'),members:count('crm_people',"AND kind='membro'"),visitors:count('crm_people',"AND kind='visitante'"),
  pending:count('crm_tasks',"AND status='todo'"),events:count('crm_events'),groups:count('crm_groups'),
  activities:count('crm_activities'),attendance:count('crm_attendance')
 };
}
export function exportContactsCSV(db,scope){
 const rows=scoped(db,'people',scope);
 const cell=x=>'"'+String(x??'').replace(/^\s*[=+\-@]/,match=>'\t'+match).replace(/"/g,'""')+'"';
 return '\uFEFF'+[['Nome','Tipo','Etapa','E-mail','Telefone','Ministério','Observações','Criado em'],...rows.map(x=>[x.name,x.kind,x.stage,x.email,x.phone,x.ministry,x.notes,x.created_at])].map(a=>a.map(cell).join(';')).join('\r\n');
}

/** Popular somente uma demonstração, após confirmação explícita do usuário. */
export function seedDemoCRM(db,demoId){
 const scope={type:'demo',id:demoId};
 if(db.prepare("SELECT 1 FROM crm_people WHERE owner_type='demo' AND owner_id=? LIMIT 1").get(demoId))throw fail(409,'Esta demonstração já tem contatos. Cadastre ou edite os registros existentes.');
 const now=when();const contacts=[
  ['Ana Martins','membro','integrado','ana.exemplo@invalid.test','(21) 90000-0001','Louvor'],
  ['Gabriel Costa','membro','integrado','gabriel.exemplo@invalid.test','(21) 90000-0002','Juventude'],
  ['Mariana Lima','visitante','novo','mariana.exemplo@invalid.test','(21) 90000-0003',''],
  ['Ricardo Oliveira','visitante','contatado','ricardo.exemplo@invalid.test','(21) 90000-0004',''],
  ['Juliana Souza','visitante','acompanhamento','juliana.exemplo@invalid.test','(21) 90000-0005',''],
  ['Pedro Almeida','membro','integrado','pedro.exemplo@invalid.test','(21) 90000-0006','Acolhimento']
 ];
 const people=[];
 db.exec('BEGIN IMMEDIATE');
 try{
  for(const [name,kind,stage,email,phone,ministry] of contacts){const id=newId();people.push(id);db.prepare('INSERT INTO crm_people VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'demo',demoId,name,kind,stage,email,phone,ministry,'REGISTRO FICTÍCIO PARA TESTES',now,now);}
  const actions=[[people[2],'whatsapp','Mensagem de boas-vindas enviada à visitante'],[people[3],'telefone','Ligação de acolhimento realizada'],[people[4],'presencial','Participou de um encontro de integração']];
  for(const [pid,channel,summary] of actions)db.prepare('INSERT INTO crm_activities VALUES(?,?,?,?,?,?,?,?)').run(newId(),'demo',demoId,pid,channel,summary,now,now);
  for(const [title,details,due,person,staff] of [['Retornar contato com Mariana','Fazer um acompanhamento de boas-vindas','2026-11-09',people[2],'Equipe de acolhimento'],['Preparar escala do domingo','Conferir voluntários confirmados','2026-11-13','', 'Secretaria'],['Atualizar agenda da igreja','Confirmar horário do próximo culto','2026-11-15','','Comunicação']])db.prepare('INSERT INTO crm_tasks VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(newId(),'demo',demoId,title,details,due,'todo',staff,person,now,now);
  const events=[['Culto da Família','2026-11-15T18:00','Templo principal'],['Encontro de Jovens','2026-11-21T19:00','Salão de eventos'],['Escola Bíblica','2026-11-22T09:00','Salas de aula']];
  const eventIds=[];for(const [title,starts_at,location] of events){const eventId=newId();eventIds.push(eventId);db.prepare('INSERT INTO crm_events VALUES(?,?,?,?,?,?,?,?,?)').run(eventId,'demo',demoId,title,starts_at,location,'EVENTO FICTÍCIO PARA TESTES',now,now);}
  for(const [name,leader,description] of [['Louvor','Ana Martins','Equipe de música e adoração'],['Juventude','Gabriel Costa','Encontros e atividades dos jovens'],['Acolhimento','Pedro Almeida','Recepção de visitantes']])db.prepare('INSERT INTO crm_groups VALUES(?,?,?,?,?,?,?,?)').run(newId(),'demo',demoId,name,leader,description,now,now);
  db.prepare('INSERT INTO crm_attendance VALUES(?,?,?,?,?,?,?)').run(newId(),'demo',demoId,people[0],eventIds[0],'presente',now);
  db.exec('COMMIT');
 }catch(e){db.exec('ROLLBACK');throw e;}
 return {ok:true,created:{people:6,tasks:3,events:3,groups:3,activities:3,attendance:1}};
}
