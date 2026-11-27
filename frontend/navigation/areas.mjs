export function setupAreas({stopAudio}){
 const panels={atividades:document.getElementById('area-atividades'),apoios:document.getElementById('configuracoes'),responsaveis:document.getElementById('responsaveis')};
 const targets={atividade:'atividades',frases:'atividades',historias:'atividades',alfabeto:'atividades',configuracoes:'apoios',responsaveis:'responsaveis'};
 const headings={atividades:'activity-title',apoios:'settings-title',responsaveis:'adult-title'};
 const scroll={atividades:0,apoios:0,responsaveis:0},lastFocus={};let current='atividades';
 function activate(target,{restore=false,focus=true}={}){
  const area=targets[target];if(!area)return;if(target==='historias')document.getElementById('story-editor').open=true;
  if(current!==area){scroll[current]=window.scrollY;stopAudio();}
  for(const [id,panel] of Object.entries(panels))panel.hidden=id!==area;
  document.querySelector('.intro').hidden=area!=='atividades';current=area;
  for(const link of document.querySelectorAll('#bottom-nav a')){if(link.dataset.area===area)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}
  const previous=restore&&lastFocus[area]?.isConnected&&!lastFocus[area].disabled&&!lastFocus[area].closest('[hidden]')?lastFocus[area]:null;
  const node=previous||document.getElementById(area==='atividades'&&target!=='atividade'?target:headings[area]);
  if(focus)node?.focus({preventScroll:true});
  if(restore)window.scrollTo({top:scroll[area],behavior:'instant'});else node?.scrollIntoView({block:'start',behavior:'instant'});
 }
 document.addEventListener('focusin',event=>{for(const [area,panel] of Object.entries(panels))if(panel.contains(event.target))lastFocus[area]=event.target;});
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href^="#"]');if(!link||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const target=link.getAttribute('href').slice(1);if(!targets[target])return;event.preventDefault();
  if(location.hash!=='#'+target)history.pushState(null,'','#'+target);
  activate(target,{restore:link.dataset.area==='atividades'});
 });
 const fromLocation=()=>activate(location.hash.slice(1)||'atividade');
 window.addEventListener('popstate',fromLocation);window.addEventListener('hashchange',fromLocation);
 document.getElementById('bottom-nav').hidden=false;
 if(targets[location.hash.slice(1)])activate(location.hash.slice(1),{focus:false});
 return {activity(){activate('atividade',{restore:true});if(location.hash!=='#atividade')history.pushState(null,'','#atividade');}};
}
