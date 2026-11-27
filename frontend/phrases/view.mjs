import {recommendPhrases} from './planner.mjs';
import {localDay} from '../ai/adaptive-learning/engine.mjs';
import {phraseEntries,phraseCompletion} from './records.mjs';
import {continuationGroup,continuationChoice,continuationPhrase} from './continuations.mjs';
import {phraseRound,addToken,removeToken,isComplete,nextHint} from './model.mjs';
import {speak,stop} from '../accessibility/speech.mjs';
export function setupPhrases({catalog,phrases,continuations,settings,events,recordCompletion,isBusy}){
 const el=id=>document.getElementById(id);let phrase,basePhrase,group,round,completed=false,busy=false,recorded=false,modelUsed=false,hintUsed=false,audioRequested=false,dismissed=false,preferenceKey;
 const entries=phraseEntries(phrases,continuations);
 const display=value=>settings().lowercase?value.toLocaleLowerCase('pt-BR'):value;
 const announce=value=>{el('phrase-feedback').textContent=value;};
 const audioStatus=value=>{el('phrase-audio-status').textContent=value;};
 function button(label,action){const node=document.createElement('button');node.type='button';node.className='soft';node.textContent=label;node.addEventListener('click',action);return node;}
 function draw(){
  el('phrase-bank').replaceChildren();el('phrase-slots').replaceChildren();
  for(const token of round.bank){const node=button(display(token.value),()=>{round=addToken(round,token.key);completed=false;announce('Palavra adicionada. Você pode removê-la para mudar a ordem.');draw();el('phrase-slots').lastElementChild?.focus();});node.dataset.tokenKey=token.key;node.setAttribute('aria-label','Adicionar palavra '+display(token.value));node.disabled=round.selected.includes(token.key);el('phrase-bank').append(node);}
  for(const [index,key] of round.selected.entries()){const token=round.tokens.find(item=>item.key===key);const node=button(display(token.value),()=>{round=removeToken(round,key);completed=false;announce('Palavra removida. Escolha outra no banco.');draw();el('phrase-bank').querySelector(`[data-token-key="${key}"]`).focus();});node.setAttribute('aria-label',`Remover palavra ${display(token.value)}, posição ${index+1}`);el('phrase-slots').append(node);}
  el('phrase-empty').hidden=round.selected.length>0;el('phrase-model').textContent=display(phrase.text)+'.';el('phrase-check').disabled=completed;previewContinuation();renderAdvice();if(busy)lock();
 }
 function restart(){stop();audioStatus('');dismissed=false;el('phrase-advice-details').open=false;recorded=false;modelUsed=false;hintUsed=false;audioRequested=false;round=phraseRound(phrase);completed=false;el('phrase-show-model').checked=false;el('phrase-model').hidden=true;announce('Escolha as palavras na ordem da frase de exemplo. Você pode pedir uma pista ou ver o modelo.');draw();}
 function previewContinuation(){
  const choice=continuationChoice(group,el('phrase-action').value,el('phrase-complement').value);
  if(!recorded&&el('phrase-continuations').open&&choice?.audioId===phrase.id)modelUsed=true;
  el('phrase-continuation-preview').textContent=choice?display(choice.text)+'.':'';
  el('phrase-use-continuation').disabled=!choice||choice.audioId===phrase.id;
  el('phrase-continuation-status').textContent=choice?.audioId===phrase.id?'Esta é a frase em montagem.':'Prévia de outra frase. Seus cartões só mudam ao escolher Montar esta frase.';
 }
 function actionChanged(){
  const action=group?.actions.find(item=>item.id===el('phrase-action').value);
  el('phrase-complement').replaceChildren(...(action?.complements??[]).map(item=>new Option(item.label,item.id)));previewContinuation();if(busy)lock();
 }
 function choose(){
  basePhrase=phrases.find(item=>item.id===el('phrase-choice').value);phrase=basePhrase;group=continuationGroup(continuations,basePhrase.id);
  el('phrase-continuations').hidden=!group;el('phrase-continuations').open=false;
  el('phrase-action').replaceChildren(...(group?.actions??[]).map(item=>new Option(item.label,item.id)));actionChanged();
  const word=catalog.words.find(item=>item.id===phrase.wordId);el('phrase-image').src=word.image;el('phrase-image').alt='Imagem de referência: '+word.text+'. A imagem não representa toda a ação da frase.';restart();
 }
 function advice(){return recommendPhrases({entries,events:events(),phraseId:phrase.id,settings:settings(),today:localDay()});}
 function markAdviceModel(){if(!recorded&&el('phrase-advice-details').open&&[...el('phrase-advice-list').children].some(node=>node.dataset.phraseId===phrase.id))modelUsed=true;}
 function acceptAdvice(item){
  if(busy||isBusy())return;const target=entries.find(entry=>entry.id===item.phraseId);if(!target)return;
  const base=phrases.find(entry=>entry.id===target.exampleId);if(!base)return;
  el('phrase-theme').value=target.themeId;theme();el('phrase-choice').value=base.id;choose();
  const action=group.actions.find(action=>action.complements.some(choice=>choice.audioId===target.id));if(!action)return;
  el('phrase-action').value=action.id;actionChanged();el('phrase-complement').value=target.id;phrase=target;restart();
  modelUsed=true;el('phrase-show-model').checked=true;el('phrase-model').hidden=false;
  announce('Sugestão escolhida. Os cartões foram reiniciados e o modelo está disponível. Você pode escondê-lo ou escolher outra frase.');el('phrase-bank').querySelector('button')?.focus();
 }
 function renderAdvice(){
  const config=settings(),key=JSON.stringify([config.adapt,config.exploration,config.reviewAfterDays]);if(key!==preferenceKey){preferenceKey=key;dismissed=false;}
  el('phrase-advice-list').replaceChildren();
  el('phrase-ignore-advice').hidden=config.adapt===false||dismissed;
  if(config.adapt===false){el('phrase-advice-status').textContent='Sugestões personalizadas desligadas em Responsáveis. Todas as frases e apoios continuam disponíveis.';return;}
  if(dismissed){el('phrase-advice-status').textContent='Continue por aqui. Seus cartões foram preservados; as opções voltam ao recomeçar ou escolher outra frase.';return;}
  const suggestions=advice();
  for(const item of suggestions){const article=document.createElement('article');article.className='advice-card';article.dataset.phraseId=item.phraseId;article.dataset.action=item.action;
   const title=document.createElement('h4');title.textContent=display(item.text);const reason=document.createElement('p');reason.textContent=item.reason;
   const accept=button('Escolher esta sugestão',()=>acceptAdvice(item));accept.setAttribute('aria-label','Escolher sugestão: '+display(item.text));accept.dataset.suggestionId=item.id;article.append(title,reason,accept);el('phrase-advice-list').append(article);
  }
  el('phrase-advice-status').textContent='Até duas opções do tema atual, com base somente nos registros de frases. São escolhas opcionais, sem avaliação de capacidade.';markAdviceModel();
 }
 function theme(){const options=phrases.filter(item=>item.themeId===el('phrase-theme').value);el('phrase-choice').replaceChildren(...options.map((item,index)=>new Option('Exemplo '+(index+1)+' · '+catalog.words.find(word=>word.id===item.wordId).text,item.id)));choose();}
 function playPhrase(){speak(phrase.text,settings().volume,audioStatus,'/assets/audio/'+phrase.id+'.mp3');}
 el('phrase-theme').replaceChildren(...catalog.themes.map(item=>new Option(item.label,item.id)));theme();
 el('phrase-theme').addEventListener('change',theme);el('phrase-choice').addEventListener('change',choose);
 el('phrase-next').addEventListener('click',()=>{const select=el('phrase-choice');select.selectedIndex=(select.selectedIndex+1)%select.options.length;choose();el('phrase-choice').focus();});
 el('phrase-reset').addEventListener('click',()=>{restart();el('phrase-bank').querySelector('button')?.focus();});
 el('phrase-action').addEventListener('change',()=>{stop();audioStatus('');actionChanged();});
 el('phrase-complement').addEventListener('change',()=>{stop();audioStatus('');previewContinuation();});
 el('phrase-use-continuation').addEventListener('click',()=>{
  const next=continuationPhrase(basePhrase,group,el('phrase-action').value,el('phrase-complement').value);if(!next)return;
  phrase=next;restart();announce('Continuação escolhida. Monte esta frase com os novos cartões.');el('phrase-bank').querySelector('button')?.focus();
 });
 el('phrase-advice-details').addEventListener('toggle',markAdviceModel);
 el('phrase-ignore-advice').addEventListener('click',()=>{dismissed=true;renderAdvice();el('phrase-advice-details').querySelector('summary').focus();});
 el('phrase-show-model').addEventListener('change',()=>{el('phrase-model').hidden=!el('phrase-show-model').checked;if(!recorded&&el('phrase-show-model').checked)modelUsed=true;});
 el('phrase-hint').addEventListener('click',()=>{if(!recorded)hintUsed=true;const hint=nextHint(round);announce(hint?`Pista: na posição ${hint.position}, use ${display(hint.value)}. Você escolhe quando mudar os cartões.`:'As palavras estão na ordem do exemplo. Você pode conferir a frase.');});
 function lock(){for(const node of el('frases').querySelectorAll('button,select,input'))node.disabled=true;}
 el('phrase-continuations').addEventListener('toggle',()=>{if(!recorded)previewContinuation();});
 el('phrase-check').addEventListener('click',async()=>{
  if(busy||isBusy()){announce('Aguarde a conclusão do registro em andamento.');return;}
  if(!isComplete(round)){announce('Vamos explorar mais? Você pode mudar a ordem, ver o modelo ou pedir uma pista.');draw();return;}
  completed=true;announce('Você organizou a frase do exemplo! Preparando o registro local…');const event=!recorded?phraseCompletion(entries,phrase.id,{day:localDay(),modelUsed,hintUsed,audioRequested}):null;
  if(settings().onSuccessAudio!==false)playPhrase();
  if(event){recorded=true;busy=true;draw();try{
    const saved=await recordCompletion(event);announce('Você organizou a frase do exemplo! Pode ouvir, repetir ou escolher outra.'+(saved?' Registro salvo neste navegador.':' O registro ficou apenas na memória desta sessão; não foi salvo.'));
   }finally{busy=false;for(const node of el('frases').querySelectorAll('button,select,input'))node.disabled=false;draw();}
  }else{announce('Você organizou a frase do exemplo! Esta rodada já foi registrada. Recomece para uma nova exploração.');draw();}
 });
 el('phrase-listen').addEventListener('click',()=>{if(!recorded)audioRequested=true;playPhrase();});el('phrase-stop').addEventListener('click',()=>{stop();audioStatus('Leitura interrompida.');});
 return {refresh:draw,reset:choose};
}
