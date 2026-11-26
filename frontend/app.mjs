import * as store from './storage/store.mjs';
import {recommendSupport, completion, matchesWord} from './ai/adaptive-learning/engine.mjs';
import {relatedWords} from './ai/semantic-expansion/graph.mjs';
import {speak, stop} from './accessibility/speech.mjs';
const $ = id => document.getElementById(id);
const sessionId = crypto.randomUUID();
let catalog, rules, state = {events: [], settings: {}}, word, bank = [], selected = [], mode = 'model', usedSupport = true, completed = false, saving = false, storageOK = true, letter = 'P';
const text = value => state.settings.lowercase ? value.toLocaleLowerCase('pt-BR') : value;
const announce = message => {$('feedback').textContent = message;};
function button(label, handler, className = '') { const node = document.createElement('button'); node.type = 'button'; node.textContent = label; node.className = className; node.addEventListener('click', handler); return node; }
function summary() {
  $('storage-status').textContent = storageOK ? 'Os registros ficam somente neste navegador.' : 'Armazenamento indisponível. As descobertas desta sessão ficarão apenas na memória; não foram salvas.';
  $('progress').replaceChildren();
  for (const item of catalog.words) {
    const events = state.events.filter(e => e.wordId === item.id && e.outcome === 'completed');
    if (!events.length) continue;
    const li = document.createElement('li');
    li.textContent = `${item.text}: ${events.length} construções; ${events.filter(e => e.support === 'assisted').length} com apoio visual ou pista. Registro de exploração, sem conclusão sobre domínio.`;
    $('progress').append(li);
  }
  if (!$('progress').children.length) {const li = document.createElement('li'); li.textContent = 'Ainda não há construções registradas. Explore no seu tempo.'; $('progress').append(li);}
}
function applySettings() {
  document.body.classList.toggle('reduced', Boolean(state.settings.reduced));
  document.body.classList.toggle('dark', Boolean(state.settings.dark));
  for (const id of ['reduced','dark','lowercase','adapt']) $(id).checked = Boolean(state.settings[id]);
  $('volume').value = state.settings.volume ?? 0.7;
  $('threshold').value = state.settings.minIndependentSessions || rules.minIndependentSessions;
}
let settingsQueue = Promise.resolve();
function changeSettings(patch) {
  state.settings = {...state.settings, ...patch};
  applySettings();
  if ('lowercase' in patch) { renderLetters(); renderModel(); }
  if ('adapt' in patch || 'minIndependentSessions' in patch) recommendation();
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
function chooseWord(id) {
  if (saving) { $('word').value = word.id; return; }
  stop(); word = catalog.words.find(w => w.id === id) || catalog.words[0];
  $('word').value = word.id;
  $('picture').src = word.image; $('picture').alt = word.alt;
  mode = recommendation().mode;
  document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true;
  reset();
  $('recommendations').replaceChildren();
  for (const related of relatedWords(catalog, word.id, state.events)) {
    const node = button('', () => {chooseWord(related.id); $('activity-title').focus();});
    const img = document.createElement('img'); img.src = related.image; img.alt = ''; img.width = 54; img.height = 54;
    const content = document.createElement('span'); const title = document.createElement('strong'); title.textContent = related.text;
    const reason = document.createElement('small'); reason.textContent = related.reason;
    content.append(title, reason); node.append(img, content); $('recommendations').append(node);
  }
}
function reset() {
  selected = []; completed = false; usedSupport = mode === 'model';
  // Stable tiles, including duplicate letters, in a deliberately non-target order.
  bank = Array.from(word.text).map((value, key) => ({value, key}));
  bank = [...bank.slice(2), ...bank.slice(0, 2)].reverse();
  $('repeat').hidden = true; $('check').disabled = false; $('hint').disabled = false;
  renderModel(); renderLetters(); announce('Escolha a primeira letra quando quiser.');
}
function renderModel() {
  $('word-model').classList.toggle('masked', mode === 'memory');
  $('word-model').textContent = mode === 'model' ? text(word.text) : 'O modelo está guardado. Você pode pedir uma pista.';
  $('mode-description').textContent = mode === 'model' ? 'A palavra está disponível como modelo.' : 'Explorando sem modelo. As pistas continuam disponíveis.';
}
function renderLetters() {
  const focus = document.activeElement;
  const oldKey = focus?.dataset?.tile;
  $('slots').replaceChildren(); $('letter-bank').replaceChildren();
  const letters = Array.from(word.text);
  letters.forEach((_, index) => {
    const entry = selected[index];
    const node = button(entry ? text(entry.value) : '·', () => {if (!completed && !saving && entry) { selected.splice(index, 1); renderLetters(); $('slots').children[Math.min(index, selected.length)].focus(); }}, 'slot');
    node.setAttribute('aria-label', entry ? `Posição ${index+1}: ${text(entry.value)}. Retirar letra` : `Posição ${index+1}: vazia`);
    node.disabled = !entry || completed; $('slots').append(node);
  });
  bank.forEach(entry => {
    const node = button(text(entry.value), () => {
      if (completed || saving || selected.some(item => item.key === entry.key) || selected.length >= letters.length) return;
      selected.push(entry); renderLetters();
      const next = [...$('letter-bank').children].find(n => !n.disabled);
      (next || $('check')).focus();
    }, 'tile');
    node.dataset.tile = String(entry.key); node.setAttribute('aria-label', `Adicionar ${text(entry.value)}`);
    node.disabled = completed || selected.some(item => item.key === entry.key);
    $('letter-bank').append(node);
  });
  if (oldKey !== undefined) [...$('letter-bank').children].find(n => n.dataset.tile === oldKey && !n.disabled)?.focus();
}
async function check() {
  if (completed || saving) return;
  if (!matchesWord(selected.map(e => e.value), word.text)) {
    announce('Podemos continuar explorando. Você pode retirar letras ou pedir uma pista.'); return;
  }
  completed = true; saving = true; $('check').disabled = true; $('hint').disabled = true; renderLetters();
  const event = completion(word.id, sessionId, usedSupport);
  let saved = false;
  try {await settingsQueue; const stored = await store.record(event); state.events = stored.events; saved = true;}
  catch {storageOK = false; state.events = [...state.events, event].slice(-200);}
  finally {saving = false;}
  announce(`Você construiu ${word.text}! Pode repetir ou explorar outra palavra.${saved ? '' : ' O registro não pôde ser salvo neste dispositivo.'}`);
  $('repeat').hidden = false; summary(); recommendation();
}
function hint() {
  if (completed || saving) return;
  usedSupport = true;
  const target = Array.from(word.text);
  let prefix = 0;
  while (prefix < selected.length && selected[prefix].value === target[prefix]) prefix++;
  selected = selected.slice(0, prefix);
  if (prefix < target.length) selected.push(bank.find(e => e.value === target[prefix] && !selected.some(s => s.key === e.key)));
  renderLetters(); announce(`Pista: a posição ${Math.min(prefix+1,target.length)} tem a letra ${target[Math.min(prefix,target.length-1)]}.`);
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
    [catalog, rules] = await Promise.all(responses.map(response => response.json()));
    try {state = await store.load();} catch {storageOK = false; state.settings = {adapt:true};}
    for (const item of catalog.words) {const option = document.createElement('option'); option.value = item.id; option.textContent = item.text; $('word').append(option);}
    $('word').addEventListener('change', event => chooseWord(event.target.value));
    $('check').addEventListener('click', check); $('hint').addEventListener('click', hint);
    $('clear').addEventListener('click', () => {if (!saving) reset();}); $('repeat').addEventListener('click', () => {if (saving) return; reset(); $('letter-bank').querySelector('button')?.focus();});
    for (const input of document.querySelectorAll('input[name="mode"]')) input.addEventListener('change', () => {if (saving) {document.querySelector(`input[name="mode"][value="${mode}"]`).checked = true; return;} mode = input.value; reset();});
    $('listen').addEventListener('click', () => speak(word.text, $('volume').value, message => $('audio-status').textContent = message));
    $('listen-letter').addEventListener('click', () => speak(letter, $('volume').value, message => $('audio-status').textContent = message));
    $('stop-sound').addEventListener('click', stop);
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
      try {await settingsQueue; state = await store.erase(); saving = false; storageOK = true; applySettings(); chooseWord('peixe'); summary(); $('data-feedback').textContent = 'Registros e preferências apagados deste navegador.'; $('delete-confirm').hidden = true; $('delete').focus();}
      catch {$('data-feedback').textContent = 'Não foi possível apagar os registros. Tente novamente ou limpe os dados deste site nas configurações do navegador.';}
      finally {saving = false;}
    });
    $('export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify({schemaVersion:1, ...state}, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'pequenas-girafas-copia-local.json'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); $('data-feedback').textContent = 'Cópia solicitada. O arquivo contém registros locais; guarde-o com cuidado. A restauração será implementada em outra versão.';
    });
    applySettings(); alphabet(); chooseWord('peixe'); summary(); $('experience').hidden = false; $('boot').hidden = true;
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(() => {
        const ready = () => {$('offline-status').textContent = 'Atividades essenciais disponíveis offline neste navegador. A leitura depende de uma voz instalada.';};
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
