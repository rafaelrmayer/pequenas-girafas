import {MAX_PAGES,MAX_WORDS,storyConfig,normalizeStory,normalizePage,pageText,narrationFor,putPage,movePage,removePage} from './model.mjs';
import {setupDrawing} from './drawing.mjs';
import {speakSequence,stop} from '../accessibility/speech.mjs';
export function setupStories({catalog,entries,tokens,initialDraft,settings,isBusy,saveDraft}){
 const el=id=>document.getElementById(id),config=storyConfig(catalog,entries,tokens),initial=normalizeStory(initialDraft,config);
 let pages=initial?.pages||[],savedKey=JSON.stringify(pages),history=[],editing=null,reading=0,busy=false,tokenIds=[],drawingFailed=false;
 const display=value=>settings().lowercase?value.toLocaleLowerCase('pt-BR'):value;
 const announce=value=>{el('story-status').textContent=value;};
 const audio=value=>{el('story-audio-status').textContent=value;};
 const dirty=()=>JSON.stringify(pages)!==savedKey;
 const cards=()=>el('story-text-mode').value==='cards',drawMode=()=>el('story-art-mode').value==='drawing';
 function builderChanged(){el('story-builder-note').textContent='Use Adicionar ou Atualizar página para incluir as escolhas e o desenho na história.';}
 const drawing=setupDrawing({changed:()=>{const failed=drawingFailed;drawingFailed=false;builderChanged();if(failed)preview();}});
 function button(label,action){const node=document.createElement('button');node.type='button';node.className='soft';node.textContent=label;node.addEventListener('click',action);return node;}
 function image(id,word,prefix){el(id).src=word.image;el(id).alt=prefix+word.text;}
 function candidate(includeDrawing=false){return {characterId:el('story-character').value,sceneId:el('story-scene').value,...(cards()?{tokenIds:[...tokenIds]}:{phraseId:el('story-phrase').value}),...(includeDrawing&&drawMode()?{drawing:drawing.snapshot()}:{})};}
 function renderWords(){
  el('story-word-bank').replaceChildren();el('story-token-list').replaceChildren();
  const group=el('story-bank-group').value;
  const available=config.tokens.filter(token=>group==='all'||(group==='links'?token.themeId===null:token.themeId===el('story-theme').value));
  for(const token of available){const add=button(display(token.text),()=>{tokenIds.push(token.id);builderChanged();renderWords();preview();});add.setAttribute('aria-label','Adicionar à história: '+display(token.text));add.disabled=tokenIds.length>=MAX_WORDS;el('story-word-bank').append(add);}
  for(const [index,id] of tokenIds.entries()){
   const li=document.createElement('li'),word=document.createElement('strong'),actions=document.createElement('div');actions.className='actions';word.textContent=display(config.tokens.find(token=>token.id===id).text);
   const up=button('Subir palavra '+(index+1),()=>{[tokenIds[index-1],tokenIds[index]]=[tokenIds[index],tokenIds[index-1]];builderChanged();renderWords();preview();el('story-token-list').querySelector('button')?.focus();});up.disabled=index===0;
   const down=button('Descer palavra '+(index+1),()=>{[tokenIds[index+1],tokenIds[index]]=[tokenIds[index],tokenIds[index+1]];builderChanged();renderWords();preview();el('story-token-list').querySelector('button')?.focus();});down.disabled=index===tokenIds.length-1;
   const remove=button('Retirar palavra '+(index+1),()=>{tokenIds.splice(index,1);builderChanged();renderWords();preview();el('story-bank-group').focus();});
   actions.append(up,down,remove);li.append(word,actions);el('story-token-list').append(li);
  }
  el('story-word-count').textContent=`${tokenIds.length} de ${MAX_WORDS} palavras. Você pode repetir palavras e escolher a ordem.`;el('story-clear-words').disabled=!tokenIds.length;
 }
 function preview(){
  const page=candidate(),character=config.characters.find(item=>item.id===page.characterId),scene=config.scenes.find(item=>item.id===page.sceneId);
  image('story-character-image',character,'Personagem ou elemento: ');image('story-scene-image',scene,'Cenário de referência: ');
  const text=pageText(page,config);el('story-candidate-text').textContent=text?display(text)+'.':'Escolha palavras para criar a frase.';
  el('story-preview-listen').disabled=!text;el('story-add-page').disabled=drawingFailed||(cards()&&!tokenIds.length)||(editing===null&&pages.length>=MAX_PAGES);
 }
 function stopReading(){stop();audio('');}
 function renderReader(){
  el('story-reader').hidden=!pages.length;
  if(!pages.length){el('story-page-text').textContent='';el('story-reader-title').textContent='Minha história';el('story-reader-drawing').removeAttribute('src');el('story-reader-drawing').hidden=true;image('story-reader-character',config.characters[0],'Personagem ou elemento: ');image('story-reader-scene',config.scenes[0],'Cenário de referência: ');return;}
  reading=Math.max(0,Math.min(reading,pages.length-1));const page=pages[reading];
  el('story-reader-figures').hidden=Boolean(page.drawing);el('story-reader-drawing').hidden=!page.drawing;
  if(page.drawing)el('story-reader-drawing').src=page.drawing;else el('story-reader-drawing').removeAttribute('src');
  image('story-reader-character',config.characters.find(item=>item.id===page.characterId),'Personagem ou elemento: ');image('story-reader-scene',config.scenes.find(item=>item.id===page.sceneId),'Cenário de referência: ');
  el('story-reader-title').textContent=`Minha história · Página ${reading+1} de ${pages.length}`;el('story-page-text').textContent=display(pageText(page,config))+'.';
  el('story-reading-note').textContent=narrationFor(page,config).length>1?'A frase criada será lida palavra por palavra com áudios do aplicativo.':'Esta frase tem uma gravação completa no aplicativo.';
  el('story-previous').disabled=reading===0;el('story-next').disabled=reading===pages.length-1;
 }
 function render(){
  el('story-word-builder').hidden=!cards();el('story-ready-label').hidden=cards();el('story-drawing-panel').hidden=!drawMode();el('story-figure-preview').hidden=drawMode();el('story-scene-label').hidden=drawMode();el('story-character-label').hidden=drawMode()&&cards();
  renderWords();preview();el('story-pages').replaceChildren();
  for(const [index,page] of pages.entries()){
   const li=document.createElement('li'),title=document.createElement('h4'),description=document.createElement('p'),actions=document.createElement('div');actions.className='actions';
   title.textContent=`Página ${index+1}: `+display(pageText(page,config));description.textContent=page.drawing?'Imagem: desenho criado nesta página.':'Cenário: '+display(config.scenes.find(item=>item.id===page.sceneId).text)+'.';
   const read=button('Ver página '+(index+1),()=>{stopReading();reading=index;renderReader();el('story-reader-title').focus();});
   const edit=button('Editar página '+(index+1),async()=>{
    stopReading();editing=index;const entry=config.characters.find(item=>item.id===page.characterId);el('story-theme').value=entry.themeId;characters(page.characterId);el('story-scene').value=page.sceneId;
    el('story-text-mode').value=page.tokenIds?'cards':'ready';tokenIds=[...(page.tokenIds||[])];if(page.phraseId)el('story-phrase').value=page.phraseId;el('story-art-mode').value=page.drawing?'drawing':'figures';
    busy=true;render();try{await drawing.load(page.drawing||null);drawingFailed=false;announce('Editando página '+(index+1)+'. Atualize a página ou cancele a edição.');}catch{drawingFailed=true;announce('Não foi possível abrir o desenho. A página foi preservada; cancele a edição ou escolha figuras para substituir a imagem.');}
    finally{busy=false;unlock();render();el('story-text-mode').focus();}
   });
   const up=button('Subir página '+(index+1),()=>{commit(movePage(pages,index,-1),'Ordem das páginas alterada.',index-1);el('story-pages').querySelector('button')?.focus();});up.disabled=index===0;
   const down=button('Descer página '+(index+1),()=>{commit(movePage(pages,index,1),'Ordem das páginas alterada.',index+1);el('story-pages').querySelector('button')?.focus();});down.disabled=index===pages.length-1;
   const remove=button('Remover página '+(index+1),()=>{commit(removePage(pages,index),'Página removida. Você pode desfazer.',Math.min(index,pages.length-2));el('story-add-page').focus();});
   for(const node of [edit,up,down,remove])if(editing!==null)node.disabled=true;
   actions.append(read,edit,up,down,remove);li.append(title,description,actions);el('story-pages').append(li);
  }
  el('story-count').textContent=`${pages.length} de ${MAX_PAGES} páginas. As escolhas só entram na história ao adicionar ou atualizar a página.`;
  el('story-editing').textContent=editing===null?'Preparando uma nova página.':'Editando a página '+(editing+1)+'.';el('story-add-page').textContent=editing===null?'Adicionar página':'Atualizar página '+(editing+1);el('story-cancel-edit').hidden=editing===null;
  el('story-undo').disabled=!history.length||editing!==null;el('story-clear').disabled=!pages.length||editing!==null;el('story-save').disabled=!dirty()||editing!==null;
  el('story-save-status').textContent=dirty()?'Há alterações apenas na memória. Salve neste navegador antes de recarregar; a cópia local inclui somente a última versão salva.':'Não há mudanças nas páginas já adicionadas. As escolhas e o desenho em criação só entram na história ao adicionar ou atualizar a página.';
  renderReader();drawing.setEnabled(!busy&&drawMode());if(busy)for(const node of el('historias').querySelectorAll('button,select'))node.disabled=true;
 }
 function unlock(){for(const node of el('historias').querySelectorAll('button,select'))node.disabled=false;}
 function commit(next,message,index=reading){if(next===pages)return;stopReading();history.push(structuredClone(pages));history=history.slice(-10);pages=next;reading=Math.max(0,index);editing=null;render();announce(message);}
 function phrases(){const options=config.phrases.filter(item=>item.wordId===el('story-character').value);el('story-phrase').replaceChildren(...options.map(item=>new Option(display(item.text),item.id)));}
 function characters(selected){const options=config.characters.filter(item=>item.themeId===el('story-theme').value);el('story-character').replaceChildren(...options.map(item=>new Option(item.text,item.id)));if(selected)el('story-character').value=selected;phrases();}
 function theme(){characters();el('story-scene').value={astronomia:'ceu','fundo-do-mar':'mar',natureza:'jardim',frutas:'jardim'}[el('story-theme').value];render();}
 el('story-theme').replaceChildren(...config.themes.map(item=>new Option(item.label,item.id)));el('story-scene').replaceChildren(...config.scenes.map(item=>new Option(item.text,item.id)));theme();
 el('story-theme').addEventListener('change',()=>{stopReading();builderChanged();theme();});el('story-character').addEventListener('change',()=>{stopReading();builderChanged();phrases();preview();});
 for(const id of ['story-scene','story-phrase'])el(id).addEventListener('change',()=>{stopReading();builderChanged();preview();});
 for(const id of ['story-text-mode','story-art-mode'])el(id).addEventListener('change',()=>{stopReading();if(id==='story-art-mode'&&!drawMode())drawingFailed=false;builderChanged();render();});
 el('story-bank-group').addEventListener('change',renderWords);el('story-clear-words').addEventListener('click',()=>{tokenIds=[];builderChanged();renderWords();preview();});
 el('story-add-page').addEventListener('click',()=>{
  try{const page=candidate(true);if(!normalizePage(page,config)){announce('Não foi possível incluir esta página. As escolhas e o desenho foram preservados para você continuar.');return;}const index=editing===null?pages.length:editing;commit(putPage(pages,page,config,editing),'Página '+(index+1)+' pronta para explorar. Salve quando quiser.',index);el('story-builder-note').textContent='Página incluída. Você pode preparar outra ou salvar a história.';}catch{announce('Não foi possível incluir o desenho. A edição foi preservada.');}
 });
 el('story-cancel-edit').addEventListener('click',()=>{editing=null;drawingFailed=false;render();announce('Edição cancelada. As páginas da história foram preservadas.');el('story-add-page').focus();});
 el('story-undo').addEventListener('click',()=>{if(!history.length)return;stopReading();pages=history.pop();editing=null;render();announce('Última alteração desfeita. A versão salva só muda quando você salva novamente.');});
 el('story-clear').addEventListener('click',()=>commit([],'Páginas retiradas da edição. Use Desfazer para recuperá-las. A história salva só muda quando você salva novamente.',0));
 el('story-save').addEventListener('click',async()=>{
  if(busy||isBusy()){announce('Aguarde a operação em andamento antes de salvar a história.');return;}
  const draft=normalizeStory({version:2,pages},config);if(!draft)return;busy=true;render();
  try{const saved=await saveDraft(draft);if(saved){savedKey=JSON.stringify(draft.pages);announce('História salva neste navegador. Você pode continuar criando ou ler as páginas.');}else announce('Não foi possível salvar. A história ficou apenas na memória desta página; você pode tentar novamente.');}
  catch{announce('Não foi possível salvar. A história ficou apenas na memória desta página; você pode tentar novamente.');}
  finally{busy=false;unlock();render();}
 });
 for(const [id,delta] of [['story-previous',-1],['story-next',1]])el(id).addEventListener('click',()=>{stopReading();reading+=delta;renderReader();el('story-reader-title').focus();});
 el('story-listen').addEventListener('click',()=>{if(pages[reading])speakSequence(narrationFor(pages[reading],config),settings().volume,audio);});
 el('story-preview-listen').addEventListener('click',()=>speakSequence(narrationFor(candidate(),config),settings().volume,audio));
 el('story-stop').addEventListener('click',()=>{stop();audio('Leitura interrompida.');});
 if(initialDraft&&!initial)announce('O rascunho salvo não pôde ser aberto. Ele só será substituído se você salvar outra história.');
 return {refresh:render,reset(){stopReading();drawing.reset();pages=[];savedKey='[]';history=[];editing=null;reading=0;busy=false;tokenIds=[];drawingFailed=false;el('story-text-mode').value='ready';el('story-art-mode').value='figures';el('story-theme').selectedIndex=0;unlock();theme();announce('História e rascunho removidos deste dispositivo.');}};
}
