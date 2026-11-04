import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {renderHome} from '../home.js';
const root=path.resolve(import.meta.dirname,'..');

test('landing comercial comunica site + CRM integrados e navega para recursos reais',()=>{
 const html=renderHome();
 for(const id of ['plataforma','jornada','modulos','experiencia'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/<html lang="pt-BR">/);
 assert.match(html,/href="\/montar"/);
 assert.match(html,/href="\/igreja\/entrar"/);
 assert.match(html,/href="\/acompanhar"/);
 assert.match(html,/Começar minha plataforma/);
 assert.match(html,/CONTRATAÇÃO MODULAR/);
 for(const category of ['Site e presença digital','Membros e visitantes','Ministérios e cultos','Mídia e comunicação visual'])assert.ok(html.includes(category),category);
 assert.match(html,/em planejamento/i);
 assert.match(html,/el-app-window/);
 assert.match(html,/el-site-behind/);
 assert.doesNotMatch(html,/clientes satisfeitos|igrejas atendidas|100% de satisfação/i);
 for(const match of html.matchAll(/(?:src|href)="(\/assets\/[a-z0-9-]+\.webp)"/g))assert.ok(fs.existsSync(path.join(root,'public',match[1])),'asset ausente '+match[1]);
 assert.ok(fs.existsSync(path.join(root,'public','home.css')));
 assert.ok(fs.existsSync(path.join(root,'public','home.js')));
});
