/**
 * Jornada pública: site institucional -> CRM da igreja.
 * Sem contato automático: autorizar contato não equivale a enviar WhatsApp/e-mail.
 * Os dados e o consentimento são isolados por igreja/demonstração.
 */
import {randomBytes} from 'node:crypto';
const newId=()=>randomBytes(16).toString('hex');
const failure=(code,message)=>Object.assign(new Error(message),{code});
const clean=(value,max)=>typeof value==='string'&&value.trim().length<=max?value.trim():null;
const attempts=new Map();
const PRIVACY_VERSION='acolhimento-contato-v1';

export function initVisitorIntake(db){
 db.exec(`CREATE TABLE IF NOT EXISTS crm_public_consents (
  id TEXT PRIMARY KEY,
  owner_type TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  person_id TEXT NOT NULL,
  statement TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  FOREIGN KEY(person_id) REFERENCES crm_people(id) ON DELETE CASCADE
 );
 CREATE INDEX IF NOT EXISTS ix_crm_public_consents_scope ON crm_public_consents(owner_type,owner_id,person_id);`);
}

export function checkPublicIntakeRate(ip,scope){
 const key=`${ip||'unknown'}:${scope.type}:${scope.id}`;
 const now=Date.now();
 let current=attempts.get(key);
 if(!current||now-current.start>=60000)current={start:now,count:0};
 current.count++;
 attempts.set(key,current);
 if(attempts.size>2500){for(const [k,v] of attempts){if(now-v.start>=60000)attempts.delete(k);}}
 if(current.count>8)throw failure(429,'Muitas solicitações. Tente novamente em um minuto.');
}

export function registerPublicVisitor(db,scope,body){
 if(!body||typeof body!=='object'||Array.isArray(body))throw failure(400,'Dados inválidos');
 // Campo-isca contra envios automatizados simples. Não grava dados de robôs.
 if(body.website)return {ok:true};
 const name=clean(body.name,100),email=clean(body.email??'',200),phone=clean(body.phone??'',30),message=clean(body.message??'',800);
 if(!name||name.length<2||email===null||phone===null||message===null)throw failure(400,'Revise os campos do formulário');
 if(!email&&!phone)throw failure(400,'Informe um telefone ou e-mail para contato');
 if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw failure(400,'E-mail inválido');
 if(phone&&phone.replace(/\D/g,'').length<8)throw failure(400,'Telefone inválido');
 if(body.consent!==true)throw failure(400,'É necessário autorizar o contato da equipe');
 if(!['church','demo'].includes(scope.type)||!scope.id)throw failure(400,'Igreja inválida');
 const now=new Date().toISOString(),due=new Date(Date.now()+2*86400000).toISOString().slice(0,10);
 let personId=newId(),existing=false;
 db.exec('BEGIN IMMEDIATE');
 try{
  const person=(email?db.prepare("SELECT id FROM crm_people WHERE owner_type=? AND owner_id=? AND kind='visitante' AND lower(email)=lower(?) LIMIT 1").get(scope.type,scope.id,email):null)
    ||(phone?db.prepare("SELECT id FROM crm_people WHERE owner_type=? AND owner_id=? AND kind='visitante' AND phone=? LIMIT 1").get(scope.type,scope.id,phone):null);
  if(person){personId=person.id;existing=true;}
  if(!existing){
   db.prepare('INSERT INTO crm_people(id,owner_type,owner_id,name,kind,stage,email,phone,ministry,notes,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
     .run(personId,scope.type,scope.id,name,'visitante','novo',email.toLowerCase(),phone,'',`Cadastro pelo site institucional${message?' · Mensagem: '+message:''}`,now,now);
  }
  db.prepare('INSERT INTO crm_public_consents(id,owner_type,owner_id,person_id,statement,accepted_at) VALUES(?,?,?,?,?,?)')
    .run(newId(),scope.type,scope.id,personId,PRIVACY_VERSION,now);
  const summary=`Interesse registrado no site institucional. Consentimento ${PRIVACY_VERSION}.${message?' Mensagem: '+message:''}`;
  db.prepare('INSERT INTO crm_activities(id,owner_type,owner_id,person_id,channel,summary,occurred_at,created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(newId(),scope.type,scope.id,personId,'outro',summary,now,now);
  const pending=db.prepare("SELECT 1 FROM crm_tasks WHERE owner_type=? AND owner_id=? AND person_id=? AND status='todo' AND title LIKE 'Acolher visitante:%' LIMIT 1").get(scope.type,scope.id,personId);
  if(!pending){
   db.prepare('INSERT INTO crm_tasks(id,owner_type,owner_id,title,details,due_at,status,assigned_to,person_id,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
     .run(newId(),scope.type,scope.id,`Acolher visitante: ${name}`,'Realizar primeiro contato autorizado pelo formulário do site.',''+due,'todo','Equipe de recepção',personId,now,now);
  }
  db.exec('COMMIT');
  return {ok:true};
 }catch(e){db.exec('ROLLBACK');throw e;}
}
