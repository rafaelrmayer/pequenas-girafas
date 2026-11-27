import {continuationGroup,continuationChoice,continuationPhrase} from './continuations.mjs';
import {phraseRound,addToken,removeToken,isComplete,nextHint} from './model.mjs';
import {speak,stop} from '../accessibility/speech.mjs';
export function setupPhrases({catalog,phrases,continuations,settings}){
 const el=id=>document.getElementById(id);let phrase,basePhrase,group,round,completed=false;
 const display=value=>settings().lowercase?value.toLocaleLowerCase('pt-BR'):value;
 const announce=value=>{el('phrase-feedback').textContent=value;};
 const audioStatus=value=>{el('phrase-audio-status').textContent=value;};
 function button(label,action){const node=document.createElement('button');node.type='button';node.className='soft';node.textContent=label;node.addEventListener('click',action);return node;}
 function draw(){
  el('phrase-bank').replaceChildren();el('phrase-slots').replaceChildren();
  for(const token of round.bank){const node=button(display(token.value),()=>{round=addToken(round,token.key);completed=false;announce('Palavra adicionada. Você pode removê-la para mudar a ordem.');draw();el('phrase-slots').lastElementChild?.focus();});node.dataset.tokenKey=token.key;node.setAttribute('aria-label','Adicionar palavra '+display(token.value));node.disabled=round.selected.includes(token.key);el('phrase-bank').append(node);}
  for(const [index,key] of round.selected.entries()){const token=round.tokens.find(item=>item.key===key);const node=button(display(token.value),()=>{round=removeToken(round,key);completed=false;announce('Palavra removida. Escolha outra no banco.');draw();el('phrase-bank').querySelector(`[data-token-key="${key}"]`).focus();});node.setAttribute('aria-label',`Remover palavra ${display(token.value)}, posição ${index+1}`);el('phrase-slots').append(node);}
  el('phrase-empty').hidden=round.selected.length>0;el('phrase-model').textContent=display(phrase.text)+'.';el('phrase-check').disabled=completed;previewContinuation();
 }
 function restart(){stop();audioStatus('');round=phraseRound(phrase);completed=false;el('phrase-show-model').checked=false;el('phrase-model').hidden=true;announce('Escolha as palavras na ordem da frase de exemplo. Você pode pedir uma pista ou ver o modelo.');draw();}
 function previewContinuation(){
  const choice=continuationChoice(group,el('phrase-action').value,el('phrase-complement').value);
  el('phrase-continuation-preview').textContent=choice?display(choice.text)+'.':'';
  el('phrase-use-continuation').disabled=!choice||choice.audioId===phrase.id;
  el('phrase-continuation-status').textContent=choice?.audioId===phrase.id?'Esta é a frase em montagem.':'Prévia de outra frase. Seus cartões só mudam ao escolher Montar esta frase.';
 }
 function actionChanged(){
  const action=group?.actions.find(item=>item.id===el('phrase-action').value);
  el('phrase-complement').replaceChildren(...(action?.complements??[]).map(item=>new Option(item.label,item.id)));previewContinuation();
 }
 function choose(){
  basePhrase=phrases.find(item=>item.id===el('phrase-choice').value);phrase=basePhrase;group=continuationGroup(continuations,basePhrase.id);
  el('phrase-continuations').hidden=!group;el('phrase-continuations').open=false;
  el('phrase-action').replaceChildren(...(group?.actions??[]).map(item=>new Option(item.label,item.id)));actionChanged();
  const word=catalog.words.find(item=>item.id===phrase.wordId);el('phrase-image').src=word.image;el('phrase-image').alt='Imagem de referência: '+word.text+'. A imagem não representa toda a ação da frase.';restart();
 }
 function theme(){const options=phrases.filter(item=>item.themeId===el('phrase-theme').value);el('phrase-choice').replaceChildren(...options.map((item,index)=>new Option('Exemplo '+(index+1)+' · '+catalog.words.find(word=>word.id===item.wordId).text,item.id)));choose();}
 function listen(){speak(phrase.text,settings().volume,audioStatus,'/assets/audio/'+phrase.id+'.mp3');}
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
 el('phrase-show-model').addEventListener('change',()=>{el('phrase-model').hidden=!el('phrase-show-model').checked;});
 el('phrase-hint').addEventListener('click',()=>{const hint=nextHint(round);announce(hint?`Pista: na posição ${hint.position}, use ${display(hint.value)}. Você escolhe quando mudar os cartões.`:'As palavras estão na ordem do exemplo. Você pode conferir a frase.');});
 el('phrase-check').addEventListener('click',()=>{if(isComplete(round)){completed=true;announce('Você organizou a frase do exemplo! Pode ouvir, repetir ou escolher outra.');if(settings().onSuccessAudio!==false)listen();}else announce('Vamos explorar mais? Você pode mudar a ordem, ver o modelo ou pedir uma pista.');draw();});
 el('phrase-listen').addEventListener('click',listen);el('phrase-stop').addEventListener('click',()=>{stop();audioStatus('Leitura interrompida.');});
 return {refresh:draw,reset:choose};
}
