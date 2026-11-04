import test from 'node:test';
import assert from 'node:assert/strict';
import {renderChurchSite} from '../site-renderer.js';
import {renderBuilder} from '../builder.js';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
test('cada modelo possui composição independente com renderização compartilhada',()=>{
 const patterns={moderno:'cs-hero-modern',tradicional:'cs-hero-traditional',minimalista:'cs-hero-minimal',transmissoes:'cs-hero-stream',personalizado:'cs-hero-custom'};
 const htmls={};
 for(const [template,pattern] of Object.entries(patterns)){
  const html=renderChurchSite({name:'Comunidade Exemplo',template,headline:'Uma mensagem especial',color:'#aabbcc',modules:['site','eventos']},{preview:true});
  htmls[template]=html;
  assert.ok(html.includes(pattern),template);
  assert.ok(html.includes('Uma mensagem especial'));
  assert.ok(html.includes('Comunidade Exemplo'));
  assert.ok(html.includes('#aabbcc'));
 }
 assert.equal(new Set(Object.values(htmls)).size,5);
 const builder=renderBuilder();
 assert.doesNotMatch(builder,/b-model-mini-site/);
 for(const template of ['moderno','tradicional','minimalista','transmissoes']){
  assert.ok(builder.includes(`/assets/photo-${template}.webp`));
  assert.ok(existsSync(path.join(root,'public/assets',`photo-${template}.webp`)));
 }
 const css=readFileSync(path.join(root,'public/church-site.css'),'utf8');
 for(const template of ['moderno','tradicional','minimalista','transmissoes'])assert.ok(css.includes(`photo-${template}.webp`));
});
