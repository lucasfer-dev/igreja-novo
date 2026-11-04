import {featureCatalog,featureGroups} from './feature-catalog.js';
/** Fonte única do site: o iframe do configurador e a publicação chamam este mesmo renderizador. */
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const templateSet=new Set(['moderno','tradicional','minimalista','transmissoes','futurista','personalizado']);
const allowedModules=new Set(featureCatalog.map(f=>f.id));
export const validLogo=v=>{
 if(v==='')return true;
 if(typeof v!=='string'||v.length>270000)return false;
 const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(v);
 if(!match)return false;
 const bytes=Buffer.from(match[2],'base64');
 if(bytes.length>200000||bytes.length<12)return false;
 return match[1]==='png'?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):
   match[1]==='jpeg'?bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff:
   bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
};
export const normalizeSite=raw=>{
 const source=raw||{};
 const template=templateSet.has(source.template)?source.template:'moderno';
 const color=/^#[\da-fA-F]{6}$/.test(source.color||'')?source.color:'#dca64f';
 const modules=Array.isArray(source.modules)?source.modules.filter(x=>allowedModules.has(x)):['site'];
 return {
  name:String(source.name||'Sua igreja').slice(0,100),template,color,
  headline:String(source.headline||'Um lugar para viver a fé juntos.').slice(0,120),
  description:String(source.description||'Uma comunidade que acolhe, conecta e transforma vidas.').slice(0,1000),
  location:String(source.location||'').slice(0,90),
  logo_data:validLogo(source.logo_data)?source.logo_data:'',modules,
  events:Array.isArray(source.events)?source.events.slice(0,8):[],
  contact_email:typeof source.contact_email==='string'?source.contact_email.slice(0,200):'',
  prices:source.prices && typeof source.prices==='object'?source.prices:{},
  slug:typeof source.slug==='string'&&/^[a-z0-9-]{3,50}$/.test(source.slug)?source.slug:''
 };
};
const copy={
 moderno:{eyebrow:'FÉ • COMUNIDADE • PROPÓSITO',action:'Conhecer a igreja',second:'Nossos encontros'},
 tradicional:{eyebrow:'UMA HISTÓRIA DE FÉ',action:'Conheça nossa história',second:'Próximos cultos'},
 minimalista:{eyebrow:'SEJA BEM-VINDO',action:'Saiba mais',second:'Nossa programação'},
 transmissoes:{eyebrow:'CULTO • PALAVRA • COMUNIDADE',action:'Conheça nossa programação',second:'Sobre nós'},
 futurista:{eyebrow:'CONEXÃO • TECNOLOGIA • COMUNIDADE',action:'Explore nossa igreja',second:'Nossa agenda'},
 personalizado:{eyebrow:'UMA IDENTIDADE SÓ SUA',action:'Descubra nossa igreja',second:'Conheça nossa história'}
};
const formatDate=s=>{const d=new Date(String(s||'').replace(' ','T'));return Number.isNaN(+d)?'Data a definir':new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(d);};
function siteHeader(s,logo,links){
 const logoHtml=`<a class="cs-brand" href="#inicio">${logo}<span>${esc(s.name)}</span></a>`;
 const navHtml=`<nav class="cs-nav" aria-label="Menu principal">${links.map(([href,label])=>`<a href="${href}">${label}</a>`).join('')}</nav>`;
 return `<header class="cs-header"><div class="cs-header-inner">${logoHtml}${navHtml}<a class="cs-header-cta" href="${s.modules.includes('membros')?'#visitantes':'#contato'}">Venha nos visitar <span aria-hidden="true">↗</span></a></div></header>`;
}
function hero(s){
 const c=copy[s.template],headline=esc(s.headline),description=esc(s.description);
 const primary=`<a class="cs-btn-primary" href="#sobre">${c.action} <span aria-hidden="true">↗</span></a>`;
 const secondary=s.modules.includes('eventos')?`<a class="cs-btn-secondary" href="#eventos">${c.second} →</a>`:`<a class="cs-btn-secondary" href="#contato">Venha nos conhecer →</a>`;
 if(s.template==='tradicional')return `<section class="cs-hero cs-hero-traditional" id="inicio"><div class="cs-hero-picture" aria-hidden="true"></div><div class="cs-hero-inner"><div class="cs-overline">✧ ${c.eyebrow} ✧</div><h1>${headline}</h1><div class="cs-ornament">✦</div><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div></div><div class="cs-hero-bottom">TRADIÇÃO &nbsp; / &nbsp; ACOLHIMENTO &nbsp; / &nbsp; COMUNIDADE</div></section>`;
 if(s.template==='minimalista')return `<section class="cs-hero cs-hero-minimal" id="inicio"><div class="cs-hero-inner"><div class="cs-overline">${c.eyebrow}</div><h1>${headline}</h1><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div><div class="cs-minimal-foot">Comunidade • Encontros • Propósito</div></div><div class="cs-minimal-image" role="img" aria-label="Imagem visual do modelo minimalista"><span class="cs-minimal-stamp">AQUI VOCÊ É BEM-VINDO</span></div></section>`;
 if(s.template==='transmissoes')return `<section class="cs-hero cs-hero-stream" id="inicio"><div class="cs-stream-picture" aria-hidden="true"></div><div class="cs-stream-frame"><div class="cs-stream-label"><span class="cs-stream-dot"></span> MENSAGENS E CULTOS</div><div class="cs-hero-inner"><div class="cs-overline">${c.eyebrow}</div><h1>${headline}</h1><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div></div><div class="cs-stream-bottom"><span>▶ &nbsp; Conheça nossas mensagens</span><span>Programação e comunidade ↗</span></div></div></section>`;
 if(s.template==='futurista')return `<section class="cs-hero cs-hero-future" id="inicio"><div class="cs-future-orbit" aria-hidden="true">✧</div><div class="cs-hero-inner"><div class="cs-overline">${c.eyebrow}</div><h1>${headline}</h1><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div></div><div class="cs-hero-bottom"><span>CONEXÃO</span><span>COMUNIDADE</span><span>PROPÓSITO</span></div></section>`;
 if(s.template==='personalizado')return `<section class="cs-hero cs-hero-custom" id="inicio"><div class="cs-hero-inner"><div class="cs-overline">${c.eyebrow}</div><h1>${headline}</h1><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div></div><div class="cs-custom-art" aria-hidden="true"><div class="cs-custom-line"></div><div class="cs-custom-mark">✦</div><small>PROJETO SOB MEDIDA</small></div></section>`;
 return `<section class="cs-hero cs-hero-modern" id="inicio"><div class="cs-hero-picture" aria-hidden="true"></div><div class="cs-hero-inner"><div class="cs-overline"><span class="cs-overline-line"></span>${c.eyebrow}</div><h1>${headline}</h1><p>${description}</p><div class="cs-hero-buttons">${primary}${secondary}</div><div class="cs-hero-foot">Uma comunidade para pertencer. Uma história para viver.</div></div><div class="cs-hero-bottom"><span>01 / CONHEÇA</span><span>02 / PARTICIPE</span><span>03 / CAMINHE CONOSCO</span></div></section>`;
}
function aboutSection(s){
 const location=s.location?`Estamos em ${esc(s.location)}. `:'';
 if(s.template==='tradicional')return `<section class="cs-about cs-about-traditional" id="sobre"><div class="cs-legacy-symbol">✣</div><div><span class="cs-eyebrow">QUEM SOMOS</span><h2>Uma história que <em>continua.</em></h2><p>${esc(s.description)}</p><p>${location}Será uma alegria receber você em nossos encontros.</p><a href="#contato" class="cs-text-link">Faça-nos uma visita ↗</a></div></section>`;
 if(s.template==='minimalista')return `<section class="cs-about cs-about-minimal" id="sobre"><div class="cs-about-index">01 / NOSSA COMUNIDADE</div><div><h2>Um lugar simples.<br><em>Para ser você.</em></h2><p>${esc(s.description)} ${location}</p><a href="#contato" class="cs-text-link">Entre em contato ↗</a></div></section>`;
 if(s.template==='transmissoes')return `<section class="cs-about cs-about-stream" id="sobre"><div><span class="cs-eyebrow">CONEXÕES QUE TRANSFORMAM</span><h2>A mensagem vai <em>além do templo.</em></h2><p>${esc(s.description)} ${location}</p><a href="#contato" class="cs-text-link">Conheça nossa comunidade ↗</a></div><div class="cs-stream-side"><span>▶</span><strong>Conteúdo, encontros e propósito.</strong></div></section>`;
 return `<section class="cs-about" id="sobre"><div class="cs-about-intro"><span class="cs-eyebrow">NOSSA COMUNIDADE</span><h2>Um lugar para <em>pertencer.</em></h2><p>${esc(s.description)}</p><a href="#contato" class="cs-text-link">Saiba mais sobre nossa igreja ↗</a></div><div class="cs-about-card"><span class="cs-about-icon">✧</span><strong>Mais do que um endereço, uma comunidade.</strong><p>${location}Será uma alegria receber você em nossos encontros.</p></div></section>`;
}
function featureShowcase(s,{preview=false,owner=false,demo=false,demoId=''}={}){
 const active=new Set(demo?featureCatalog.map(f=>f.id):s.modules);
 const showLocked=preview||owner||demo;
 const groups=featureGroups.map(group=>{
  const features=featureCatalog.filter(f=>f.category===group && (showLocked||active.has(f.id)));
  if(!features.length)return '';
  const items=features.map(f=>{
   const unlocked=active.has(f.id);
   const pending=!f.operational;
   const estimate=Number.isInteger(s.prices[f.id])?s.prices[f.id]:f.price_cents;
   const cost=(estimate/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
   const label=demo?'Disponível na demonstração':unlocked?'Ativo':pending?'Em desenvolvimento':'Bloqueado';
   const url={site:'#inicio',eventos:'#eventos',oracao:'#oracao',membros:'/igreja/painel',escalas:'/igreja/painel'}[f.id]||'#recursos';
   const action=demo?(demoId?`<a class="cs-feature-state cs-feature-active" href="/demo/${esc(demoId)}/recurso/${esc(f.id)}">Explorar recurso ↗</a>`:`<span class="cs-feature-state cs-feature-active">✓ Desbloqueado no teste</span>`):unlocked?`<a href="${url}" class="cs-feature-state cs-feature-active">✓ Abrir recurso ↗</a>`:
    preview?'<span class="cs-feature-cta cs-preview-cta">Escolher no catálogo →</span>':
    `<button type="button" class="cs-feature-cta" data-upgrade-feature="${esc(f.id)}">${pending?'Solicitar interesse':'Solicitar desbloqueio'} ↗</button>`;
   return `<article class="cs-feature-card ${unlocked?'is-active':'is-locked'}"><div class="cs-feature-content"><div class="cs-feature-symbol">${unlocked?'✦':'♧'}</div><small class="cs-feature-status">${label}</small><h3>${esc(f.name)}</h3><p>${demo?'Área de demonstração acessível para explorar.':unlocked?'Recurso incluído nesta igreja.':pending?'Recurso previsto no catálogo, ainda não disponível para ativação.':'Este módulo não está incluído na assinatura.'}</p><small class="cs-feature-price">Referência: ${cost}/mês</small></div><div class="cs-feature-action">${action}</div></article>`;
  }).join('');
  return `<details class="cs-feature-group" ${group===featureGroups[0]?'open':''}><summary>${esc(group)} <span>${features.length} recursos <span aria-hidden="true">⌄</span></span></summary><div class="cs-feature-grid">${items}</div></details>`;
 }).join('');
 return `<section id="recursos" class="cs-features"><div class="cs-feature-heading"><span class="cs-eyebrow">${showLocked?'EXPANDA SUA PLATAFORMA':'RECURSOS DA IGREJA'}</span><h2>${showLocked?'Tudo que sua igreja pode utilizar.':'Ferramentas da nossa comunidade.'}</h2><p>${demo?'Todos os recursos estão acessíveis para explorar, sem cobrança. As telas de recursos ainda não implementados utilizam dados de exemplo.':showLocked?'Os módulos contratados estão disponíveis. Os demais permanecem bloqueados até a confirmação da contratação e ativação pela Elovia.':'Acesse os recursos e serviços disponíveis para esta comunidade.'}</p></div>${groups}${owner?'<div class="cs-upgrade-feedback" id="cs-upgrade-feedback" role="status" aria-live="polite"></div>':''}${showLocked&&!demo?'<p class="cs-feature-disclaimer">Preços de referência do catálogo; os valores definitivos são confirmados em proposta. Recursos em desenvolvimento não são ativados por pagamento.</p>':''}</section>`;
}

function ministryDashboard(s,{demo=false}={}){
 const active=new Set(s.modules),isLive=Boolean(!demo);
 const demoLink=id=>demo&&s.demoId?`/demo/${esc(s.demoId)}/recurso/${id}`:'#contato';
 const shortcutOptions=[
  ['eventos','#eventos','▦','Agenda'],
  ['membros','#visitantes','♡','Sou novo aqui'],
  ['oracao','#oracao','✧','Pedidos de oração'],
  ...(demo?[['pregacoes',demoLink('pregacoes'),'▷','Mensagens'],['radio',demoLink('radio'),'◉','Rádio'],['pagina-ministerios',demoLink('pagina-ministerios'),'♧','Ministérios']]:[])
 ];
 const links=shortcutOptions.filter(([id])=>demo||active.has(id));
 const events=s.events||[];
 const hasEvents=active.has('eventos');
 const eventCards=hasEvents&&events.length?events.slice(0,3).map(e=>`<li><span>${esc(formatDate(e.starts_at))}</span><strong>${esc(e.title)}</strong></li>`).join(''):
  demo?'<li><span>EXEMPLO</span><strong>Culto da Família · Domingo</strong></li><li><span>EXEMPLO</span><strong>Encontro de oração · Quarta</strong></li>':
  '<li><span>AGENDA</span><strong>Em breve, novos encontros.</strong></li>';
 if(isLive){
  const cards=[
   ...(hasEvents?[`<article class="cs-hub-events"><div class="cs-hub-label"><span>PRÓXIMOS EVENTOS</span><small>AGENDA DA IGREJA</small></div><ul>${eventCards}</ul><a href="#eventos">Ver programação →</a></article>`]:[]),
   ...(active.has('membros')?[`<article class="cs-hub-message"><div class="cs-hub-label"><span>PRIMEIRA VISITA</span><small>ACOLHIMENTO</small></div><div class="cs-hub-message-content"><span class="cs-hub-play">♡</span><h3>Você é bem-vindo aqui.</h3><p>Entre em contato com nossa equipe e venha conhecer a comunidade.</p><a href="#visitantes">Quero conhecer a igreja ↗</a></div></article>`]:[]),
   ...(active.has('oracao')?[`<article class="cs-hub-side"><div><span>♡ CUIDADO E ORAÇÃO</span><strong>Podemos orar com você?</strong><small>Conte com nossa comunidade.</small><a href="#oracao">Enviar pedido ↗</a></div></article>`]:[])
  ];
  if(!links.length&&!cards.length)return '';
  return `<section class="cs-hub cs-hub-live" aria-label="Serviços e acesso rápido da igreja">${links.length?`<div class="cs-hub-shortcuts">${links.map(([,href,ico,label])=>`<a href="${href}"><span>${ico}</span><strong>${label}</strong></a>`).join('')}</div>`:''}${cards.length?`<div class="cs-hub-content cs-hub-content-live">${cards.join('')}</div>`:''}</section>`;
 }
 return `<section class="cs-hub" aria-label="Destaques e acesso rápido da igreja"><div class="cs-hub-shortcuts">${links.map(([,href,ico,label])=>`<a href="${href}"><span>${ico}</span><strong>${label}</strong></a>`).join('')}</div><div class="cs-hub-content"><article class="cs-hub-events"><div class="cs-hub-label"><span>PRÓXIMOS EVENTOS</span><small>CONTEÚDO DE DEMONSTRAÇÃO</small></div><ul>${eventCards}</ul><a href="#eventos">Ver programação →</a></article><article class="cs-hub-message"><div class="cs-hub-label"><span>MENSAGEM EM DESTAQUE</span><small>EXEMPLO ILUSTRATIVO</small></div><div class="cs-hub-message-content"><span class="cs-hub-play">▶</span><h3>Uma palavra para caminhar em fé.</h3><p>Exemplo de como mensagens e pregações poderão aparecer no site.</p><a href="${demoLink('pregacoes')}">Explorar conteúdos ↗</a></div></article><div class="cs-hub-side"><article><span>◉ RÁDIO E CONTEÚDOS</span><strong>Player de exemplo</strong><small>Uma área demonstrativa, sem transmissão real.</small><a href="${demoLink('radio')}">Explorar recurso ↗</a></article><article><span>♡ PEDIDOS DE ORAÇÃO</span><strong>Estamos com você.</strong><small>Um espaço para acolher e cuidar.</small><a href="#oracao">Saiba mais ↗</a></article></div></div></section>`;
}
export function renderChurchSite(raw,{preview=false,owner=false,demo=false,demoId=''}={}){
 const s=normalizeSite(raw), hasEvents=s.modules.includes('eventos'),hasPrayer=s.modules.includes('oracao');
 const logo=s.logo_data?`<img class="cs-logo-image" src="${esc(s.logo_data)}" alt="Logotipo da igreja">`:`<span class="cs-logo-symbol" aria-hidden="true">✳</span>`;
 const hasVisitors=s.modules.includes('membros');
 const links=[['#inicio','Início'],['#sobre','Quem somos'],...(hasEvents?[['#eventos','Eventos']]:[]),...(hasVisitors?[['#visitantes','Sou novo aqui']]:[]),...(hasPrayer?[['#oracao','Oração']]:[]),['#contato','Contato']];
 const events=s.events.map(e=>`<article class="cs-event-card"><span class="cs-event-date">${esc(formatDate(e.starts_at))}</span><h3>${esc(e.title)}</h3><p>${esc(e.description||'Esperamos você neste encontro.')}</p><small>◷ ${esc(e.starts_at||'Horário a definir')}${e.location?' · '+esc(e.location):''}</small></article>`).join();
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="${esc(s.color)}"><title>${esc(s.name)}</title><link rel="stylesheet" href="/church-site.css"></head>
 <body class="cs-theme-${esc(s.template)}" style="--cs-accent:${esc(s.color)}">
 <div class="cs-announcement"><span>Você é bem-vindo aqui.</span>${s.location?`<span>⌁ ${esc(s.location)}</span>`:''}</div>
 ${demo&&demoId?`<div class="cs-demo-banner"><span><b>SITE DE DEMONSTRAÇÃO</b> · Esta é a página institucional da igreja. Use somente dados fictícios.</span><div><a href="/demo/${esc(demoId)}/hub">▦ Abrir sistema de gestão</a><a href="/demo/${esc(demoId)}/hub?view=site">✎ Editar site no CRM</a><a href="/montar">Criar outra ↗</a></div></div>`:''}
 ${siteHeader(s,logo,links)}
 <main>${hero(s)}${ministryDashboard({...s,demoId},{demo:preview&&!demoId})}${aboutSection(s)}
 ${hasEvents?`<section class="cs-section cs-events" id="eventos"><div class="cs-section-heading"><div><span class="cs-eyebrow">NOSSA PROGRAMAÇÃO</span><h2>Próximos <em>encontros.</em></h2></div><p>Momentos para celebrar, aprender e construir novas conexões.</p></div><div class="cs-event-grid">${events||'<div class="cs-empty-event"><span>◷</span><h3>Em breve, nossa programação por aqui.</h3><p>Acompanhe os próximos cultos e encontros da comunidade.</p></div>'}</div></section>`:''}
 ${hasVisitors?`<section class="cs-section cs-visitor" id="visitantes"><div class="cs-visitor-copy"><span class="cs-eyebrow">CONEXÃO E ACOLHIMENTO</span><h2>É sua primeira vez <em>com a gente?</em></h2><p>Quer conhecer a nossa comunidade? Deixe seu contato para a equipe de recepção conversar com você. Sem compromisso.</p><p class="cs-visitor-trust">Seus dados são usados apenas para o acolhimento e acompanhamento solicitado.</p></div>${preview&&!(demo&&demoId)?`<div class="cs-visitor-form cs-visitor-preview"><strong>Recepção de visitantes</strong><p>Na plataforma entregue, este formulário cria um contato e um retorno no CRM.</p></div>`:`<form id="public-visitor" class="cs-visitor-form" data-endpoint="${demo&&demoId?'/api/demo/'+esc(demoId)+'/visitors':'/api/public/'+esc(s.slug)+'/visitors'}"><label>Seu nome<input name="name" required minlength="2" maxlength="100" autocomplete="name" placeholder="Como podemos chamar você?"></label><div class="cs-visitor-fields"><label>WhatsApp (opcional)<input name="phone" type="tel" maxlength="30" autocomplete="tel" placeholder="(21) 99999-9999"></label><label>E-mail (opcional)<input name="email" type="email" maxlength="200" autocomplete="email" placeholder="voce@exemplo.com"></label></div><label>Deseja deixar uma mensagem?<textarea name="message" maxlength="800" rows="3" placeholder="Conte quando gostaria de nos visitar (opcional)"></textarea></label><input name="website" class="cs-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="cs-visitor-consent"><input type="checkbox" name="consent" required><span>Autorizo que a equipe da igreja entre em contato comigo sobre minha visita. <small>Os dados não serão publicados no site.</small></span></label><button type="submit">Quero conhecer a igreja →</button><p id="visitor-feedback" role="status" aria-live="polite"></p></form>`}</section>`:''}
 ${hasPrayer?`<section class="cs-section cs-prayer" id="oracao"><div><span class="cs-eyebrow">CUIDADO E ACOLHIMENTO</span><h2>Podemos orar <em>com você?</em></h2><p>Compartilhe seu pedido de oração com nossa equipe. Sua mensagem será recebida com respeito e cuidado.</p></div>${preview&&!(demo&&demoId)?'<div class="cs-prayer-form"><strong>Formulário de oração</strong><p>O envio de pedidos estará disponível no site operacional após a implantação.</p></div>':`<form id="public-prayer" data-endpoint="${demo&&demoId?'/api/demo/'+esc(demoId)+'/prayer-intake':'/api/public/'+esc(s.slug)+'/prayers'}" data-slug="${esc(s.slug)}" class="cs-prayer-form"><label>Seu nome<input name="requester" maxlength="100" required placeholder="Como podemos chamar você?"></label><label>Seu pedido<textarea name="message" maxlength="2000" required rows="4" placeholder="Escreva aqui sua mensagem"></textarea></label><button type="submit">Enviar pedido de oração →</button><p id="prayer-feedback" role="status"></p></form>`}</section>`:''}
 <section class="cs-final" id="contato"><span class="cs-eyebrow">ESPERAMOS POR VOCÊ</span><h2>Sua história também tem lugar aqui.</h2><p>${s.location?`Encontre-nos em ${esc(s.location)}. `:''}Venha conhecer nossa comunidade e fazer parte dessa caminhada.</p>${s.contact_email?`<a href="mailto:${esc(s.contact_email)}" class="cs-final-link">Entre em contato ↗</a>`:''}</section>
 </main><footer class="cs-footer"><span>${logo}<strong>${esc(s.name)}</strong></span><small>${s.location?esc(s.location)+' · ':''}Feito com cuidado para nossa comunidade.</small></footer>
 ${preview&&!(demo&&demoId)?'':`<script src="/tenant.js" defer></script>`}</body></html>`;
}


/** Navegação de demonstração: todos os 74 módulos são exploráveis, sem criar dados reais nem conceder assinatura. */
export function renderDemoFeature(raw,feature,demoId){
 const s=normalizeSite(raw),name=esc(s.name),heading=esc(feature.name),category=esc(feature.category);
 const samples={
  'Site e presença digital':['Editar página inicial','Gerenciar agenda','Biblioteca de conteúdos','Publicar novidades'],
  'Gestão de membros e visitantes':['Pessoas cadastradas','Novos visitantes','Acompanhamento','Registros internos'],
  'Ministérios e organização dos cultos':['Equipes e ministérios','Escalas da semana','Programação do culto','Organização de voluntários'],
  'Comunicação e comunidade':['Avisos recentes','Grupos de conversa','Mensagens programadas','Interações da comunidade'],
  'Louvor, mídia e conteúdos':['Biblioteca de mídias','Conteúdos em destaque','Playlists e episódios','Materiais disponíveis'],
  'Educação, discipulado e pequenos grupos':['Turmas e trilhas','Materiais de estudo','Acompanhamento','Certificados e avaliações'],
  'Administração e patrimônio':['Visão geral','Registros e documentos','Relatórios','Controle interno'],
  'Eventos e inscrições':['Próximos eventos','Participantes','Inscrições','Check-in e certificados'],
  'Ferramentas avançadas':['Configuração','Regras e integrações','Acompanhamento','Indicadores'],
  'Mídia e comunicação visual':['Calendário de conteúdos','Solicitações','Arquivos e materiais','Aprovações']
 };
 const cards=(samples[feature.category]||['Visão geral','Conteúdos','Configuração','Relatórios']).map((x,i)=>`<article class="df-card"><span class="df-card-num">0${i+1}</span><h3>${esc(x)}</h3><p>Exemplo visual de como este espaço será organizado na plataforma da igreja.</p><button class="df-action" type="button" data-sample="${esc(x)}">Explorar exemplo →</button></article>`).join('');
 return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading} · ${name}</title><link rel="stylesheet" href="/demo-feature.css"></head><body style="--accent:${esc(s.color)}"><aside class="df-rail"><a class="df-brand" href="/demo/${demoId}">✦ ${name}</a><small>PLATAFORMA DE DEMONSTRAÇÃO</small><a href="/demo/${demoId}/hub">⌂ Hub da igreja</a><a href="/demo/${demoId}">↗ Site público</a><a href="/demo/${demoId}#recursos">▦ Todos os recursos</a><div class="df-rail-bottom">Demonstração · Sem cobrança<br><span>Conteúdo ilustrativo</span></div></aside><main class="df-main"><header class="df-top"><a href="/demo/${demoId}/hub">← Voltar ao hub</a><span class="df-pill">Todos os recursos desbloqueados para teste</span></header><div class="df-eyebrow">${category} / MÓDULO DE DEMONSTRAÇÃO</div><h1>${heading}</h1><p class="df-lead">Conheça a organização e as possibilidades deste recurso dentro da plataforma ${name}. Os elementos abaixo usam exemplos fictícios e não executam operações reais.</p><div class="df-banner"><div><small>AMBIENTE DEMONSTRATIVO</small><strong>Acesso liberado para explorar</strong><p>Este recurso ainda não representa uma implementação operacional completa.</p></div><span>✓ Acesso de demonstração</span></div><h2>Visão geral do recurso</h2><div class="df-grid">${cards}</div><section class="df-sample"><h2 id="df-detail-heading">Explore a experiência</h2><p id="df-detail-copy">Selecione um dos blocos acima para visualizar como essa funcionalidade será apresentada.</p><div class="df-mock"><span>EXEMPLO DE INFORMAÇÃO</span><strong id="df-mock-name">${heading}</strong><div class="df-lines"><i></i><i></i><i></i></div></div></section></main><script>document.querySelectorAll('[data-sample]').forEach(b=>b.addEventListener('click',()=>{let name=b.dataset.sample;document.getElementById('df-detail-heading').textContent=name;document.getElementById('df-detail-copy').textContent='Prévia de interface para '+name+'. Nenhum dado real é criado ou alterado.';document.getElementById('df-mock-name').textContent=name;document.querySelector('.df-sample').scrollIntoView({behavior:'smooth',block:'center'});}));</script></body></html>`;
}
