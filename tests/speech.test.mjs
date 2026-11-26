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
  assert.match(status,/não há voz local/);
  delete globalThis.speechSynthesis;
  speak('PEIXE',.5,s=>status=s);
  assert.match(status,/não há voz local/);
  stop();
});
