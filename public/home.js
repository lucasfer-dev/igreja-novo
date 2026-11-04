// Progressive enhancement for the commercial homepage. No framework or build tool required.
const trigger=document.querySelector('.el-menu-trigger');
const links=document.querySelector('#el-nav-links');
if(trigger&&links){
 trigger.addEventListener('click',()=>{
  const isOpen=trigger.getAttribute('aria-expanded')==='true';
  trigger.setAttribute('aria-expanded',String(!isOpen));
  trigger.setAttribute('aria-label',isOpen?'Abrir menu':'Fechar menu');
  links.classList.toggle('is-open',!isOpen);
 });
 links.addEventListener('click',e=>{
  if(e.target.closest('a')){
   links.classList.remove('is-open');
   trigger.setAttribute('aria-expanded','false');
   trigger.setAttribute('aria-label','Abrir menu');
  }
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){links.classList.remove('is-open');trigger.setAttribute('aria-expanded','false');}});
}
