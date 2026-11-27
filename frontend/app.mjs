import {setupReport} from './reports/view.mjs';
import {reviewOverview} from './ai/adaptive-learning/reviews.mjs';
import * as store from './storage/store.mjs';
import {recommendSupport, completion, matchesWord, evidenceFor, localDay} from './ai/adaptive-learning/engine.mjs';
import {recommendActivities} from './ai/adaptive-learning/planner.mjs';
import {relatedWords} from './ai/semantic-expansion/graph.mjs';
import {presentationsFor,visualEvidence,changeRoundVisual,illustrationOnVisit,rememberIllustration,clearIllustrationRotation} from './modules/presentations.mjs';
import {ACTIVITIES, lettersRound, placeLetter, associationChoices} from './modules/activities.mjs';
import {letterDrag} from './accessibility/letter-drag.mjs';
import {speak, stop} from './accessibility/speech.mjs';
const $ = id => document.getElementById(id);
const sessionId = crypto.randomUUID();
const environment = document.body.dataset.environment;
$('environment').textContent = `${environment === 'testes' ? 'AMBIENTE DE TESTES · Mudanças em avaliação' : environment === 'principal' ? 'VERSÃO PRINCIPAL' : 'AMBIENTE LOCAL'} · V0.1 experimental`;
let report, catalog, fullCatalog, rules, state = {events: [], settings: {}}, word, bank = [], selected = [], mode = 'model', usedSupport = true, completed = false, saving = false, storageOK = true, letter = 'P';
let activity='build', round=0, locked=[], activeSlot=null, matchChoice=null, showAnswer=false, drag;
let hintUsed=false, audioRequested=false, roundPresentation='upper', adviceDismissed=false;
let currentImage, roundVisualIds=[], roundStarted=false;
const text = value => state.settings.lowercase ? value.toLocaleLowerCase('pt-BR') : value;
const announce = message => {$('feedback').textContent = message;};
function button(label, handler, className = '') { const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.className = className; node.addEventListener('click', handler); return node; }
function summary() {
  report?.invalidate();
  $('storage-status').textContent = storageOK ? 'Os registros ficam somente neste navegador.' : 'Armazenamento indisponível. As descobertas desta sessão ficarão apenas na memória; não foram salvas.';
  $('progress').replaceChildren();
  for (const item of fullCatalog.words) {
    const events = state.events.filter(e => e.wordId === item.id && e.outcome === 'completed');
    const builds=events.filter(e=>(e.activity || 'build')==='build');
    if (!events.length) continue;
    const li = document.createElement('li');
    const parts=[];
    if(builds.length) parts.push(`${builds.length} construções; ${builds.filter(e=>e.support==='assisted').length} com apoio visual ou pista`);
    for(const type of ['missing','match']) {
      const count=events.filter(e=>e.activity===type).length;
      if(count) parts.push(`${ACTIVITIES[type]}: ${count} conclusões`);
    }
    li.textContent = `${item.text}: ${parts.join(' · ')}. Registro de exploração, sem conclusão sobre domínio.`;
    $('progress').append(li);
  }
  if(word) renderEvidence();
  if (!$('progress').children.length) {const li = document.createElement('li'); li.textContent = 'Ainda não há construções registradas. Explore no seu tempo.'; $('progress').append(li);}
}
function applySettings() {
  document.body.classList.toggle('reduced', Boolean(state.settings.reduced));
  document.body.classList.toggle('dark', Boolean(state.settings.dark));
  for (const id of ['reduced','dark','lowercase','adapt']) $(id).checked = Boolean(state.settings[id]);
  $('on-success-audio').checked = state.settings.onSuccessAudio !== false;
  $('volume').value = state.settings.volume ?? 0.7;
  $('threshold').value = state.settings.minIndependentSessions || rules.minIndependentSessions;
  $('category-interest').value=state.settings.categoryInterest || 'all';
  $('exploration-goal').value=state.settings.exploration || 'balanced';
  $('preferred-activity').value=state.settings.preferredActivity || 'any';
  $('review-days').value=state.settings.reviewAfterDays || rules.reviewAfterDays || 7;
}
let settingsQueue = Promise.resolve();
function changeSettings(patch) {
  state.settings = {...state.settings, ...patch};
  if('adapt' in patch) adviceDismissed=false;
  applySettings();
  if ('lowercase' in patch) { if(!completed) roundPresentation='mixed';renderLetters(); renderModel(); }
  if ('adapt' in patch || 'minIndependentSessions' in patch) recommendation();
  const affectsAdvice=['adapt','minIndependentSessions','categoryInterest','exploration','preferredActivity','reviewAfterDays','lowercase'].some(key=>key in patch);
  if(word && affectsAdvice) {renderRelated();renderAdvice();}
  settingsQueue = settingsQueue.then(async () => {
    try {await store.settings(patch);}
    catch {storageOK = false;}
    summary();
  });
  return settingsQueue;
}

function recommendation() {
  const suggestion = recommendSupport(state.events, word.id, {...rules, minIndependentSessions: state.settings.minIndependentSessions || rules.minIndependentSessions}, state.settings.adapt);
  $('adapt-reason').textContent = suggestion.reason;
  return suggestion;
}
function chooseTheme(id, persist=false) {
  if(saving) {$('theme').value=catalog.theme.id;return;}
  const theme=fullCatalog.themes.find(item=>item.id===id) || fullCatalog.themes[0];
  catalog={...fullCatalog,theme,words:fullCatalog.words.filter(item=>item.themeId===theme.id)};
  $('theme').value=theme.id;$('activity-title').textContent=theme.label;
  $('word').replaceChildren(...catalog.words.map(item=>new Option(item.text,item.id)));
  chooseWord(catalog.words[0].id);renderAlphabet();summary();
  if(persist) changeSettings({themeId:theme.id});
}
function chooseWord(id, options={}) {
  if (saving) { $('word').value = word.id; return; }
  stop(); drag?.cancel(); round=0; word = catalog.words.find(w => w.id === id) || catalog.words[0];
  $('word').value = word.id;
  $('picture-options').open=false;
  currentImage=illustrationOnVisit(word, options.imageId);renderPicture();
  const support=recommendation();mode = options.mode || support.mode;
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  reset();
  renderRelated();renderEvidence();
}
function renderRelated() {
  $('recommendations').replaceChildren();
  for (const related of relatedWords(catalog, word.id, state.settings.adapt===false?[]:state.events, state.settings.adapt===false?{}:{...state.settings,today:localDay()})) {
    const node = button('', () => {chooseWord(related.id); $('activity-title').focus();});
    const img = document.createElement('img'); img.src = related.image; img.alt = ''; img.width = 54; img.height = 54;
    const content = document.createElement('span'); const title = document.createElement('strong'); title.textContent = related.text;
    const reason = document.createElement('small'); reason.textContent = related.reason;
    content.append(title, reason); node.append(img, content); $('recommendations').append(node);
  }
  const concepts=new Map((catalog.concepts || []).map(concept=>[concept.id,concept]));
  $('semantic-note').textContent=catalog.relations.filter(edge=>edge.from===word.id && concepts.has(edge.to)).map(edge=>`${word.text}: ${edge.label} ${concepts.get(edge.to).label}.`).join(' ');

}
function renderPicture() {
  const images=presentationsFor(word);
  $('picture').src=currentImage.asset;$('picture').alt=currentImage.alt;
  $('presentation-select').replaceChildren();
  for(const [index,image] of images.entries()) {
    const option=document.createElement('option');option.value=image.id;option.textContent=`Imagem ${index+1}: ${image.label}`;
    $('presentation-select').append(option);
  }
  $('presentation-select').value=currentImage.id;$('presentation-select').disabled=images.length<2;
  $('next-image').disabled=images.length<2;
  $('picture-options').hidden=images.length<2;
  $('image-status').textContent=`Imagem ${images.findIndex(image=>image.id===currentImage.id)+1} de ${images.length}.`;
}
function changeVisual(id) {
  if(saving) {$('presentation-select').value=currentImage.id;return;}
  const next=presentationsFor(word).find(image=>image.id===id);
  if(!next || next.id===currentImage.id) return;
  stop();currentImage=next;rememberIllustration(word.id, next.id);renderPicture();
  if(completed) {reset();announce('Outra imagem escolhida. Uma nova rodada está disponível.');return;}
  roundVisualIds=changeRoundVisual(roundVisualIds,id,roundStarted);
  renderAdvice();
  announce(roundStarted?'Imagem alterada. Sua rodada e as letras foram preservadas; a troca será identificada no registro.':'Imagem escolhida. Explore quando quiser.');
}
function acceptSuggestion(suggestion) {
  if(saving) return;
  if(typeof suggestion.lowercase==='boolean') changeSettings({lowercase:suggestion.lowercase});
  activity=suggestion.activity;document.querySelector(`input[name="activity"][value="${activity}"]`).checked=true;
  chooseWord(suggestion.wordId,{mode:suggestion.mode,imageId:suggestion.imageId});$('task-title').focus();
}
function renderReviews() {
  if(!word) return;
  const overview=reviewOverview({catalog,events:state.events,today:localDay(),settings:state.settings,rules});
  $('review-list').replaceChildren();
  const updateStatus=message=>{if($('review-status').textContent!==message)$('review-status').textContent=message;};
  if(!overview.enabled){updateStatus('Personalização desligada. Não há lista personalizada de revisitas; todas as palavras continuam disponíveis.');return;}
  const unknown=overview.entries.filter(item=>item.status==='undated').length;
  const checkDates=overview.entries.filter(item=>['check_clock','check_date'].includes(item.status)).length;
  const recent=overview.entries.filter(item=>item.status==='recent').length;
  let message=`Tema ${catalog.theme.label}. Intervalo escolhido: ${overview.interval} dias. Opções com intervalo atingido: ${overview.available.length}. Atividades com registro datado mais recente: ${recent}. Sem data para calcular intervalo: ${unknown}. Com data a conferir: ${checkDates}. Apenas atividades com conclusões registradas entram nesta lista. Todas as escolhas são opcionais.`;
  if(!overview.entries.length)message+=' Ainda não há conclusões registradas neste tema; falta de registro não é dificuldade.';
  if(checkDates)message+=' Há datas que não podem ser comparadas com hoje. Confira a data do dispositivo; não foram usadas para indicar revisita.';
  updateStatus(message);
  for(const item of overview.available.slice(0,5)) {
    const row=document.createElement('li');
    const label=document.createElement('p');label.textContent=`${item.text} — ${ACTIVITIES[item.activity]}. Último registro datado: ${item.lastDay}; ${item.daysSince} dias desde essa data. ${item.independent} conclusões sem pistas e ${item.assisted} com apoio.${item.undated?` Outros ${item.undated} registros não têm data válida.`:''}`;
    const visit=button(`Revisitar ${item.text}: ${ACTIVITIES[item.activity]}`,()=>acceptSuggestion({wordId:item.wordId,activity:item.activity,mode:'model'}),'soft');
    visit.dataset.wordId=item.wordId;visit.dataset.activity=item.activity;row.append(label,visit);$('review-list').append(row);
  }
}
function renderEvidence() {
  if(!word) return;
  renderReviews();
  $('evidence-word').textContent=word.text;
  $('skill-evidence').replaceChildren();
  for(const type of Object.keys(ACTIVITIES)) {
    const facts=evidenceFor(state.events,word.id,type);
    const li=document.createElement('li');li.dataset.activity=type;
    const label=facts.status==='no_evidence'?'Sem registro':facts.status==='observed_independent'?'Há conclusão sem pistas':'Explorada com apoio';
    li.textContent=`${ACTIVITIES[type]}: ${label}.`;
    if(facts.completions) li.textContent+=` ${facts.completions} ${facts.completions===1?'conclusão':'conclusões'}; ${facts.independent} sem pistas e ${facts.assisted} com apoio; ${facts.withHints} com pista solicitada${facts.unknownHints?`; ${facts.unknownHints} sem informação sobre pistas`:""}. ${facts.sessions} ${facts.sessions===1?'sessão':'sessões'}, ${facts.days.length} ${facts.days.length===1?'dia local':'dias locais'} com data, ${facts.presentations.length} ${facts.presentations.length===1?'apresentação registrada':'apresentações registradas'}.${facts.undated?` ${facts.undated} ${facts.undated===1?'registro':'registros'} sem data.`:''}`;
    $('skill-evidence').append(li);
  }
  const visuals=visualEvidence(state.events,word);
  $('visual-evidence').replaceChildren();
  for(const row of visuals.rows) {
    const li=document.createElement('li');li.dataset.imageId=row.id;
    li.textContent=`${row.label}: ${row.completions} ${row.completions===1?'conclusão':'conclusões'} em atividades com esta imagem na rodada; ${row.independent} sem pistas e ${row.assisted} com apoio.`;
    $('visual-evidence').append(li);
  }
  $('visual-evidence-note').textContent=`${visuals.mixed} ${visuals.mixed===1?'rodada':'rodadas'} com troca de imagem durante as interações; ${visuals.unknown} ${visuals.unknown===1?'registro':'registros'} sem identificação da imagem. Esses registros não comprovam reconhecimento ou generalização.`;

}
function renderAdvice() {
  if(!word) return;
  renderReviews();
  $('adaptive-suggestions').replaceChildren();
  const disabled=state.settings.adapt===false;
  $('ignore-advice').hidden=disabled || adviceDismissed;
  $('adaptive-status').textContent=disabled?'Personalização desligada. Todas as atividades continuam disponíveis.':adviceDismissed?'Tudo bem. Continue por aqui; nenhuma escolha foi bloqueada.':'Você pode aceitar uma sugestão ou continuar na atividade atual.';
  if(disabled || adviceDismissed) return;
  const suggestions=recommendActivities({catalog,events:state.events,wordId:word.id,activity,settings:state.settings,rules,today:localDay(),sessionId,imageId:currentImage.id});
  for(const suggestion of suggestions) {
    const card=document.createElement('article');card.className='advice-card';
    const title=document.createElement('h4');title.textContent=suggestion.label;
    const why=document.createElement('p');why.textContent=suggestion.reason;
    const accept=button('Experimentar',()=>{
      acceptSuggestion(suggestion);
    },'soft');
    if(suggestion.imageId) accept.dataset.imageId=suggestion.imageId;
    accept.dataset.action=suggestion.action;accept.dataset.wordId=suggestion.wordId;accept.dataset.activity=suggestion.activity;
    accept.setAttribute('aria-label',`${suggestion.label}: experimentar`);
    card.append(title,why,accept);$('adaptive-suggestions').append(card);
  }
}
function reset() {
  stop(); drag?.cancel(); completed=false; matchChoice=null; showAnswer=false; activeSlot=null;
  usedSupport=activity==='build' && mode==='model';
  hintUsed=false;audioRequested=false;roundStarted=false;roundVisualIds=[currentImage.id];roundPresentation=state.settings.lowercase?'lower':'upper';adviceDismissed=false;
  const next=lettersRound(word.text,activity,round);
  bank=next.bank; selected=next.slots; locked=next.locked;
  $('repeat').hidden=true; $('check').disabled=false; $('hint').disabled=false;
  $('task-title').textContent = activity==='build' ? 'Vamos juntar as letras?' : activity==='missing' ? 'Qual letra está faltando?' : 'Qual palavra combina com a imagem?';
  $('task-instructions').textContent = activity==='build' ? 'Toque ou arraste as letras. Para retirar uma, toque nela na palavra.' : activity==='missing' ? 'Toque em uma letra ou arraste-a até o espaço vazio.' : 'Observe a imagem e escolha uma palavra. Depois, clique em Conferir palavra.';
  $('support-controls').hidden=activity!=='build';
  $('word-audio-status').textContent='';
  renderModel();renderLetters();renderAdvice();renderEvidence();announce('Escolha quando quiser. Você pode pedir uma pista.');
}
function renderModel() {
  const visible=activity==='build' ? mode==='model' : showAnswer;
  $('word-model').classList.toggle('masked',!visible);
  $('word-model').textContent=visible ? text(word.text) : activity==='build' ? 'O modelo está guardado. Você pode pedir uma pista.' : 'Observe a imagem. Peça uma pista quando quiser.';
}
function putLetter(key,index,focus=true,preventScroll=false) {
  if(completed || saving || activity==='match') return;
  const next=placeLetter(selected,bank,key,index,locked);
  if(next===selected) return;
  roundStarted=true;selected=next;activeSlot=null;renderLetters();
  announce(`Letra ${text(selected[index].value)} na posição ${index+1}.`);
  if(focus) ($('letter-bank').querySelector('button:not(:disabled)') || $('check')).focus({preventScroll});
}
function renderLetters() {
  drag?.cancel();
  $('slots').replaceChildren();$('letter-bank').replaceChildren();$('match-options').replaceChildren();
  $('letter-play').hidden=activity==='match';$('match-options').hidden=activity!=='match';
  if(activity==='match') {
    for(const option of associationChoices(catalog,word.id,round)) {
      const node=button(text(option.text),()=>{
        if(completed || saving) return;
        roundStarted=true;matchChoice=option.id;renderLetters();
        [...$('match-options').children].find(n=>n.dataset.wordId===option.id)?.focus();
      },'word-choice');
      node.dataset.wordId=option.id;node.setAttribute('aria-pressed',String(matchChoice===option.id));node.disabled=completed;
      $('match-options').append(node);
    }
    return;
  }
  const nextSlot = activity === 'missing'
    ? locked.findIndex(value => !value)
    : activeSlot ?? selected.findIndex(entry => !entry);
  Array.from(word.text).forEach((_,index)=>{
    const entry=selected[index];
    const node=button(entry?text(entry.value):'·',event=>{
      const preventScroll = event.detail > 0 || !event.isTrusted;
      if(completed || saving || locked[index]) return;
      roundStarted=true;
      if(entry) {selected[index]=null;activeSlot=index;renderLetters();$('slots').children[index].focus({preventScroll});}
      else {activeSlot=index;renderLetters();$('letter-bank').querySelector('button:not(:disabled)')?.focus({preventScroll});}
    },'slot');
    node.dataset.slot=String(index);
    node.setAttribute('aria-label',`Posição ${index+1}: ${entry?text(entry.value):'vazia'}. ${locked[index]?'Já preenchida':entry?'Retirar letra':'Escolher espaço'}`);
    node.disabled=completed || locked[index];node.classList.toggle('fixed',locked[index]);node.classList.toggle('chosen-slot',activeSlot===index);
    node.classList.toggle('next-slot',!completed && !entry && nextSlot===index);
    if(entry && !node.disabled) {node.dataset.letterKey=entry.key;node.draggable=true;}
    $('slots').append(node);
  });
  bank.forEach(entry=>{
    const node=button(text(entry.value),event=>{
      putLetter(entry.key,nextSlot,true,event.detail > 0 || !event.isTrusted);
    },'tile');
    node.dataset.tile=entry.key;node.dataset.letterKey=entry.key;node.setAttribute('aria-label',`Adicionar ${text(entry.value)}`);
    node.disabled=completed || selected.some(item=>item?.key===entry.key);node.draggable=!node.disabled;
    $('letter-bank').append(node);
  });
}

function readWord() {
  speak(word.text, $('volume').value, message => {
    $('word-audio-status').textContent = message;
    $('audio-status').textContent = message;
  }, `/assets/audio/${word.id}.mp3`);
}
async function check() {
  if (completed || saving) return;
  roundStarted=true;
  if (!(activity==='match' ? matchChoice===word.id : selected.every(Boolean) && matchesWord(selected.map(e=>e.value),word.text))) {
    announce('Podemos continuar explorando. Você pode retirar letras ou pedir uma pista.'); return;
  }
  completed = true; saving = true; $('check').disabled = true; $('hint').disabled = true; renderLetters();
  // Start within the confirmation click, before asynchronous storage work.
  if (state.settings.onSuccessAudio !== false && Number($('volume').value) > 0) readWord();
  const event = completion(word.id, sessionId, usedSupport, activity, {day:localDay(),contextId:`${activity}:${roundPresentation}:${roundVisualIds.length>1?'image-mixed':currentImage.id}${activity==='missing'?':gap-'+locked.findIndex(value=>!value):''}`,visualIds:roundVisualIds,hintUsed,modelUsed:activity==='build' && mode==='model',audioRequested});
  let saved = false;
  try {await settingsQueue; const stored = await store.record(event); state.events = stored.events; saved = true;}
  catch {storageOK = false; state.events = [...state.events, event].slice(-200);}
  finally {saving = false;}
  announce(`Você ${activity==='match'?'associou':activity==='missing'?'completou':'construiu'} ${word.text}! Pode repetir ou explorar outra palavra.${saved ? '' : ' O registro não pôde ser salvo neste dispositivo.'}`);
  $('repeat').hidden = false; summary(); recommendation();renderRelated();renderAdvice();
}
function hint() {
  if(completed || saving) return;
  roundStarted=true;usedSupport=true;hintUsed=true;
  if(activity==='match') {showAnswer=true;renderModel();announce('Pista: a palavra apareceu junto da imagem. Escolha a palavra correspondente.');return;}
  const target=Array.from(word.text);
  if(activity==='missing') {
    const index=locked.findIndex(value=>!value);
    const entry=bank.find(value=>value.value===target[index]);
    putLetter(entry.key,index,false);announce(`Pista: a letra que falta é ${target[index]}.`);return;
  }
  let prefix=0;
  while(prefix<selected.length && selected[prefix]?.value===target[prefix]) prefix++;
  if(prefix<target.length) {
    selected=selected.map((entry,index)=>index<prefix?entry:null);
    const entry=bank.find(e=>e.value===target[prefix] && !selected.some(value=>value?.key===e.key));
    putLetter(entry.key,prefix,false);
  }
  announce(`Pista: a posição ${Math.min(prefix+1,target.length)} tem a letra ${target[Math.min(prefix,target.length-1)]}.`);
}

function alphabet() {
  for (const value of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    const node = button('', () => {letter = value; renderAlphabet();});
    const upper = document.createElement('span'); upper.textContent = value;
    const lower = document.createElement('small'); lower.textContent = ` ${value.toLowerCase()}`;
    node.append(upper,lower); node.dataset.letter = value; node.setAttribute('aria-label', `Letra ${value}`); $('letters').append(node);
  }
  renderAlphabet();
}
function renderAlphabet() {
  $('selected-letter').textContent = `${letter} ${letter.toLowerCase()}`;
  const found = catalog.words.filter(w => w.text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(letter));
  $('letter-example').textContent = found.length ? `${letter} aparece em ${found.map(w => w.text).join(', ')}.` : `A letra ${letter} ainda não aparece nas palavras deste tema. Você pode explorá-la livremente.`;
  for (const node of $('letters').children) node.setAttribute('aria-pressed', String(node.dataset.letter === letter));
}
async function boot() {
  try {
    const responses = await Promise.all(['/api/v1/catalog','/api/v1/rules'].map(url => fetch(url, {signal: AbortSignal.timeout(15000)})));
    if (responses.some(response => !response.ok)) throw new Error('Catálogo indisponível');
    [fullCatalog, rules] = await Promise.all(responses.map(response => response.json()));
    catalog=fullCatalog;
    try {state = await store.load();} catch {storageOK = false; state.settings = {adapt:true};}
    for(const theme of fullCatalog.themes) $('theme').add(new Option(theme.label,theme.id));
    $('theme').addEventListener('change',()=>chooseTheme($('theme').value,true));
    $('word').addEventListener('change', event => chooseWord(event.target.value));
    $('presentation-select').addEventListener('change',()=>changeVisual($('presentation-select').value));
    $('next-image').addEventListener('click',()=>{
      const images=presentationsFor(word);const index=images.findIndex(image=>image.id===currentImage.id);
      changeVisual(images[(index+1)%images.length].id);
    });
    for(const input of document.querySelectorAll('input[name="activity"]')) input.addEventListener('change',()=>{
      if(saving) {document.querySelector(`input[name="activity"][value="${activity}"]`).checked=true;return;}
      activity=input.value;round=0;reset();
    });
    drag=letterDrag($('atividade'),{
      canDrop:index=>activity!=='match' && !completed && !saving && index>=0 && index<selected.length && !locked[index],
      drop:(key,index)=>putLetter(key,index,false)
    });
    $('check').addEventListener('click', check); $('hint').addEventListener('click', hint);
    $('clear').addEventListener('click', () => {if (!saving) reset();}); $('repeat').addEventListener('click', () => {if (saving) return; round++; reset(); ($('letter-bank').querySelector('button:not(:disabled)') || $('match-options').querySelector('button'))?.focus();});
    for (const input of document.querySelectorAll('input[name="mode"]')) input.addEventListener('change', () => {if (saving) {document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true; return;} mode = input.value; reset();});
    $('next-word').addEventListener('click',()=>{
      if(saving) return;
      const index=catalog.words.findIndex(item=>item.id===word.id);
      chooseWord(catalog.words[(index+1)%catalog.words.length].id);
      announce(`Próxima palavra: ${word.text}. Você pode explorar no seu tempo.`);
    });
    $('listen').addEventListener('click', () => {if(!completed) {roundStarted=true;audioRequested=true;if(activity!=='build') usedSupport=true;}readWord();});
    $('listen-letter').addEventListener('click', () => speak(letter, $('volume').value, message => { $('letter-audio-status').textContent = message; $('audio-status').textContent = message; }, `/assets/audio/letra-${letter.toLowerCase()}.mp3`));
    $('stop-sound').addEventListener('click', () => {stop(); $('word-audio-status').textContent = 'Áudio interrompido.';});
    $('ignore-advice').addEventListener('click',()=>{adviceDismissed=true;renderAdvice();$('task-title').focus();});
    for(const [id,key] of [['category-interest','categoryInterest'],['exploration-goal','exploration'],['preferred-activity','preferredActivity']]) $(id).addEventListener('change',()=>{adviceDismissed=false;changeSettings({[key]:$(id).value});});
    $('review-days').addEventListener('change',()=>{if(!$('review-days').checkValidity()) {$('review-days').reportValidity();return;}adviceDismissed=false;changeSettings({reviewAfterDays:Number($('review-days').value)});});
    $('on-success-audio').addEventListener('change', () => changeSettings({onSuccessAudio:$('on-success-audio').checked}));
    $('volume').addEventListener('change', () => changeSettings({volume:Number($('volume').value)}));
    for (const id of ['reduced','dark','lowercase','adapt']) $(id).addEventListener('change', () => changeSettings({[id]:$(id).checked}));
    $('threshold').addEventListener('change', () => {
      if (!$('threshold').checkValidity()) {$('threshold').reportValidity(); return;}
      changeSettings({minIndependentSessions:Number($('threshold').value)});
    });
    $('delete').addEventListener('click', () => {$('delete-confirm').hidden = false; $('confirm-delete').focus();});
    $('cancel-delete').addEventListener('click', () => {$('delete-confirm').hidden = true; $('delete').focus();});
    $('confirm-delete').addEventListener('click', async () => {
      if (saving) return; saving = true; stop();
      try {await settingsQueue; state = await store.erase(); clearIllustrationRotation(); saving = false; storageOK = true; applySettings(); chooseTheme('fundo-do-mar'); summary(); $('data-feedback').textContent = 'Registros e preferências apagados deste navegador.'; $('delete-confirm').hidden = true; $('delete').focus();}
      catch {$('data-feedback').textContent = 'Não foi possível apagar os registros. Tente novamente ou limpe os dados deste site nas configurações do navegador.';}
      finally {saving = false;}
    });
    $('export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({schemaVersion:4, ...state}, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'pequenas-girafas-copia-local.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); $('data-feedback').textContent = 'Cópia solicitada. O arquivo contém registros locais; guarde-o com cuidado. A restauração será implementada em outra versão.';
    });
    report=setupReport({catalog:fullCatalog,stopAudio:stop,readSnapshot:async()=>{
      await settingsQueue;
      if(saving) throw new Error('Aguarde a conclusão da atividade ou da exclusão antes de gerar o relatório.');
      if(storageOK){
        try {const saved=await store.load();if(saving)throw new Error('Aguarde a conclusão da atividade.');return {events:saved.events,persisted:true};}
        catch(error){if(saving)throw error;}
      }
      return {events:structuredClone(state.events),persisted:false};
    }});
    applySettings(); alphabet(); chooseTheme(state.settings.themeId || 'fundo-do-mar'); summary(); $('experience').hidden = false; $('boot').hidden = true;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        const ready = () => {$('offline-status').textContent = 'Atividades essenciais disponíveis offline neste navegador. Os áudios do catálogo estão incluídos.';};
        navigator.serviceWorker.ready.then(() => {if (navigator.serviceWorker.controller) ready(); else navigator.serviceWorker.addEventListener('controllerchange', ready, {once:true});});
      }).catch(() => {$('offline-status').textContent = 'Modo offline indisponível neste navegador. Você pode continuar online.';});
    }
  } catch {
    $('boot').textContent = 'Não foi possível preparar as atividades. Confira a conexão e tente novamente.';
    $('boot').append(button('Tentar novamente', () => location.reload(), 'soft'));
  }
}
window.addEventListener('pagehide', stop);
boot();
