import test from 'node:test';
import assert from 'node:assert/strict';
import {speak, stop, localPortugueseVoices} from '../frontend/accessibility/speech.mjs';

test('local Portuguese voice selection excludes remote services and prefers pt-BR', () => {
  const utterances = [];
  globalThis.speechSynthesis = {getVoices:()=>[
    {name:'Remote Brazilian',lang:'pt-BR',localService:false},
    {name:'Portuguese local',lang:'pt-PT',localService:true},
    {name:'Brazilian local',lang:'pt-BR',localService:true},
    {name:'English local',lang:'en-US',localService:true}
  ], cancel:()=>{}, speak:u=>utterances.push(u)};
  globalThis.SpeechSynthesisUtterance = class {constructor(text){this.text=text;}};
  assert.equal(utterances.length,0);
  assert.equal(localPortugueseVoices().length,2);
  let status = '';
  speak('PEIXE',.4,s=>status=s);
  assert.equal(utterances.length,1);
  assert.equal(utterances[0].voice.name,'Brazilian local');
  assert.equal(utterances[0].lang,'pt-BR');
  assert.equal(utterances[0].volume,.4);
  assert.match(status,/voz local/);
  stop();
});

test('remote-only voice and no speech engine never call a provider and report unavailability', () => {
  globalThis.speechSynthesis = {getVoices:()=>[{lang:'pt-BR',localService:false}],cancel:()=>{},speak:()=>{throw new Error('remote voice must never be used');}};
  let status = '';
  speak('PEIXE',.5,s=>status=s);
  assert.match(status,/não há voz local/i);
  delete globalThis.speechSynthesis;
  speak('PEIXE',.5,s=>status=s);
  assert.match(status,/não há voz local/i);
  stop();
});

test('bundled audio plays without any browser voices, honors volume and stops', async () => {
  const players = [];
  globalThis.Audio = class {
    constructor(src){this.src=src;players.push(this);}
    play(){this.onplaying();return Promise.resolve();}
    pause(){this.paused=true;}
    removeAttribute(){}
    load(){}
  };
  let status='';
  speak('PEIXE',.6,s=>status=s,'/assets/audio/peixe.mp3');
  assert.match(status,/áudio do aplicativo/);
  assert.equal(players[0].volume,.6);
  stop(); assert.equal(players[0].paused,true);
  players[0].onended(); assert.match(status,/áudio do aplicativo/);
  for(const id of ['lua','sol','estrela','ceu','planeta','flor','grama','folha','arvore','semente','jardim','maca','pera','laranja','abacaxi','manga','pessego']) {
    speak(id,.6,s=>status=s,'/assets/audio/'+id+'.mp3');
    assert.equal(players.at(-1).src,'/assets/audio/'+id+'.mp3');
    assert.match(status,/áudio do aplicativo/);
  }
  stop();
  delete globalThis.Audio;
});

test('zero volume is explicit and a failed audio file produces an actionable message', async () => {
  let status='';
  speak('PEIXE',0,s=>status=s,'/assets/audio/peixe.mp3');
  assert.match(status,/volume.*zero/);
  globalThis.Audio = class {play(){return Promise.reject(new Error('decode failed'));} pause(){} removeAttribute(){} load(){}};
  speak('PEIXE',.7,s=>status=s,'/assets/audio/peixe.mp3');
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(status,/Não foi possível reproduzir/);
  delete globalThis.Audio;
});


test('finished recordings release media resources before another word plays',()=>{
 const players=[];let status='';
 globalThis.Audio=class{
  constructor(src){this.src=src;players.push(this);}
  play(){this.onplaying();return Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(name){if(name==='src')this.src='';}
  load(){this.unloaded=true;}
 };
 for(const id of ['flor','grama','folha','arvore','semente','jardim']){
  speak(id,.6,s=>status=s,'/assets/audio/'+id+'.mp3');
  const audio=players.at(-1);audio.onended();
  assert.equal(status,'Leitura concluída.');assert.equal(audio.src,'');assert.ok(audio.unloaded);
  audio.onerror();assert.equal(status,'Leitura concluída.');
 }
 stop();delete globalThis.Audio;
});
