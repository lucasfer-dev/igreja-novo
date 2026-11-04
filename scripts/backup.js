import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,existsSync,copyFileSync,statSync,openSync,closeSync,fsyncSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
const dbPath=resolve(process.env.DB_FILE||new URL('../data/elovia.sqlite',import.meta.url).pathname);
const backupDir=resolve(process.env.BACKUP_DIR||new URL('../backups',import.meta.url).pathname);
if(!existsSync(dbPath)){console.error('Banco de dados não encontrado:',dbPath);process.exitCode=1;}
else{
 mkdirSync(backupDir,{recursive:true});
 const database=new DatabaseSync(dbPath,{readOnly:true});
 try{
  // VACUUM INTO creates a consistent point-in-time snapshot, including WAL changes.
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const target=join(backupDir,`elovia-${stamp}.sqlite`);
  database.exec(`VACUUM INTO '${target.replaceAll("'","''")}'`);
  const restored=new DatabaseSync(target,{readOnly:true});
  const check=restored.prepare('PRAGMA integrity_check').get();restored.close();
  if(Object.values(check)[0]!=='ok')throw Error('Falha na verificação de integridade');
  console.log(`Backup verificado: ${target} (${statSync(target).size} bytes)`);
 }finally{database.close();}
}
