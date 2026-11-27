import {MAX_PAGES,storyConfig,normalizeStory,putPage,movePage,removePage} from './model.mjs';
import {speak,stop} from '../accessibility/speech.mjs';
export function setupStories({catalog,entries,initialDraft,settings,isBusy,saveDraft}){
 const el=id=>document.getElementById(id),config=storyConfig(catalog,entries),initial=normalizeStory(initialDraft,config);
 let pages=initial?.pages||[],savedKey=JSON.stringify(pages),history=[],editing=null,reading=0,busy=false;
 const display=value=>settings().lowercase?value.toLocaleLowerCase('pt-BR'):value;
 const announce=value=>{el('story-status').textContent=value;};
 const audio=value=>{el('story-audio-status').textContent=value;};
 const dirty=()=>JSON.stringify(pages)!==savedKey;
 function button(label,action){const node=document.createElement('button');node.type='button';node.className='soft';node.textContent=label;node.addEventListener('click',action);return node;}
 function image(id,word,prefix){el(id).src=word.image;el(id).alt=prefix+word.text;}
 function candidate(){return {characterId:el('story-character').value,sceneId:el('story-scene').value,phraseId:el('story-phrase').value};}
 function preview(){const page=candidate();const character=config.characters.find(item=>item.id===page.characterId),scene=config.scenes.find(item=>item.id===page.sceneId),phrase=config.phrases.find(item=>item.id===page.phraseId);image('story-character-image',character,'Personagem ou elemento: ');image('story-scene-image',scene,'Cenário de referência: ');el('story-candidate-text').textContent=display(phrase.text)+'.';}
 function stopReading(){stop();audio('');}
 function renderReader(){
  el('story-reader').hidden=!pages.length;if(!pages.length){el('story-page-text').textContent='';el('story-reader-title').textContent='Minha história';image('story-reader-character',config.characters[0],'Personagem ou elemento: ');image('story-reader-scene',config.scenes[0],'Cenário de referência: ');return;}
  reading=Math.max(0,Math.min(reading,pages.length-1));const page=pages[reading];
  image('story-reader-character',config.characters.find(item=>item.id===page.characterId),'Personagem ou elemento: ');
  image('story-reader-scene',config.scenes.find(item=>item.id===page.sceneId),'Cenário de referência: ');
  el('story-reader-title').textContent=`Minha história · Página ${reading+1} de ${pages.length}`;
  el('story-page-text').textContent=display(config.phrases.find(item=>item.id===page.phraseId).text)+'.';
  el('story-previous').disabled=reading===0;el('story-next').disabled=reading===pages.length-1;
 }
 function render(){
  preview();el('story-pages').replaceChildren();
  for(const [index,page] of pages.entries()){
   const li=document.createElement('li'),title=document.createElement('h4'),description=document.createElement('p'),actions=document.createElement('div');actions.className='actions';
   title.textContent=`Página ${index+1}: `+display(config.phrases.find(item=>item.id===page.phraseId).text);
   description.textContent='Cenário: '+display(config.scenes.find(item=>item.id===page.sceneId).text)+'.';
   const read=button('Ver página '+(index+1),()=>{stopReading();reading=index;renderReader();el('story-reader-title').focus();});
   const edit=button('Editar página '+(index+1),()=>{stopReading();editing=index;const entry=config.characters.find(item=>item.id===page.characterId);el('story-theme').value=entry.themeId;characters(page.characterId);el('story-scene').value=page.sceneId;el('story-phrase').value=page.phraseId;render();announce('Editando página '+(index+1)+'. Atualize a página ou cancele a edição.');el('story-character').focus();});
   const up=button('Subir página '+(index+1),()=>{commit(movePage(pages,index,-1),'Ordem das páginas alterada.',index-1);el('story-pages').querySelector('button')?.focus();});up.disabled=index===0;
   const down=button('Descer página '+(index+1),()=>{commit(movePage(pages,index,1),'Ordem das páginas alterada.',index+1);el('story-pages').querySelector('button')?.focus();});down.disabled=index===pages.length-1;
   const remove=button('Remover página '+(index+1),()=>{commit(removePage(pages,index),'Página removida. Você pode desfazer.',Math.min(index,pages.length-2));el('story-add-page').focus();});
   for(const node of [edit,up,down,remove])if(editing!==null)node.disabled=true;
   actions.append(read,edit,up,down,remove);li.append(title,description,actions);el('story-pages').append(li);
  }
  el('story-count').textContent=`${pages.length} de ${MAX_PAGES} páginas. As escolhas só entram na história ao adicionar ou atualizar a página.`;
  el('story-editing').textContent=editing===null?'Preparando uma nova página.':'Editando a página '+(editing+1)+'.';
  el('story-add-page').textContent=editing===null?'Adicionar página':'Atualizar página '+(editing+1);
  el('story-add-page').disabled=editing===null&&pages.length>=MAX_PAGES;el('story-cancel-edit').hidden=editing===null;
  el('story-undo').disabled=!history.length||editing!==null;el('story-clear').disabled=!pages.length||editing!==null;el('story-save').disabled=!dirty()||editing!==null;
  el('story-save-status').textContent=dirty()?'Há alterações apenas na memória. Salve neste navegador antes de recarregar; a cópia local inclui somente a última versão salva.':'Nenhuma alteração pendente. O rascunho salvo, quando existente, fica somente neste perfil de navegador.';
  renderReader();if(busy)for(const node of el('historias').querySelectorAll('button,select'))node.disabled=true;
 }
 function commit(next,message,index=reading){if(next===pages)return;stopReading();history.push(structuredClone(pages));history=history.slice(-10);pages=next;reading=Math.max(0,index);editing=null;render();announce(message);}
 function phrases(){const options=config.phrases.filter(item=>item.wordId===el('story-character').value);el('story-phrase').replaceChildren(...options.map(item=>new Option(display(item.text),item.id)));}
 function characters(selected){const options=config.characters.filter(item=>item.themeId===el('story-theme').value);el('story-character').replaceChildren(...options.map(item=>new Option(item.text,item.id)));if(selected)el('story-character').value=selected;phrases();}
 function theme(){characters();el('story-scene').value={astronomia:'ceu','fundo-do-mar':'mar',natureza:'jardim',frutas:'jardim'}[el('story-theme').value];render();}
 el('story-theme').replaceChildren(...config.themes.map(item=>new Option(item.label,item.id)));el('story-scene').replaceChildren(...config.scenes.map(item=>new Option(item.text,item.id)));theme();
 el('story-theme').addEventListener('change',()=>{stopReading();theme();});el('story-character').addEventListener('change',()=>{stopReading();phrases();preview();});
 for(const id of ['story-scene','story-phrase'])el(id).addEventListener('change',()=>{stopReading();preview();});
 el('story-add-page').addEventListener('click',()=>{const index=editing===null?pages.length:editing;commit(putPage(pages,candidate(),config,editing),'Página '+(index+1)+' pronta para explorar. Salve quando quiser.',index);});
 el('story-cancel-edit').addEventListener('click',()=>{editing=null;render();announce('Edição cancelada. As páginas da história foram preservadas.');el('story-add-page').focus();});
 el('story-undo').addEventListener('click',()=>{if(!history.length)return;stopReading();pages=history.pop();editing=null;render();announce('Última alteração desfeita. A versão salva só muda quando você salva novamente.');});
 el('story-clear').addEventListener('click',()=>commit([],'Páginas retiradas da edição. Use Desfazer para recuperá-las. A história salva só muda quando você salva novamente.',0));
 el('story-save').addEventListener('click',async()=>{
  if(busy||isBusy()){announce('Aguarde a operação em andamento antes de salvar a história.');return;}
  const draft=normalizeStory({version:1,pages},config);if(!draft)return;busy=true;render();
  try{const saved=await saveDraft(draft);if(saved){savedKey=JSON.stringify(draft.pages);announce('História salva neste navegador. Você pode continuar criando ou ler as páginas.');}else announce('Não foi possível salvar. A história ficou apenas na memória desta página; você pode tentar novamente.');}
  catch{announce('Não foi possível salvar. A história ficou apenas na memória desta página; você pode tentar novamente.');}
  finally{busy=false;for(const node of el('historias').querySelectorAll('button,select'))node.disabled=false;render();}
 });
 for(const [id,delta] of [['story-previous',-1],['story-next',1]])el(id).addEventListener('click',()=>{stopReading();reading+=delta;renderReader();el('story-reader-title').focus();});
 el('story-listen').addEventListener('click',()=>{const phrase=config.phrases.find(item=>item.id===pages[reading]?.phraseId);if(phrase)speak(phrase.text,settings().volume,audio,'/assets/audio/'+phrase.id+'.mp3');});
 el('story-stop').addEventListener('click',()=>{stop();audio('Leitura interrompida.');});
 if(initialDraft&&!initial)announce('O rascunho salvo não pôde ser aberto. Ele só será substituído se você salvar outra história.');
 return {refresh:render,reset(){stopReading();pages=[];savedKey='[]';history=[];editing=null;reading=0;el('story-theme').selectedIndex=0;theme();announce('História e rascunho removidos deste dispositivo.');}};
}
