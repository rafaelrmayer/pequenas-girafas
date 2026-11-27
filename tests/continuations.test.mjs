import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {continuationGroup,continuationChoice,continuationPhrase} from '../frontend/phrases/continuations.mjs';
import {phraseRound,addToken,isComplete} from '../frontend/phrases/model.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../frontend/phrases/'+name+'.json',import.meta.url)));
const bases=read('catalog'),groups=read('continuations');
test('continuations preserve every original example and offer only complete curated relations',()=>{
 const ids=new Set();assert.equal(groups.length,8);
 for(const base of bases){const group=continuationGroup(groups,base.id);assert.equal(group.actions.length,2);assert.equal(group.actions[0].complements[0].text,base.text);assert.equal(group.actions[0].complements[0].audioId,base.id);
  for(const action of group.actions)for(const choice of action.complements){assert.equal(ids.has(choice.audioId),false);ids.add(choice.audioId);const phrase=continuationPhrase(base,group,action.id,choice.id);assert.equal(phrase.wordId,base.wordId);assert.equal(phrase.themeId,base.themeId);assert.ok(phrase.text.startsWith(group.subject+' '+action.label));let round=phraseRound(phrase);for(const token of round.tokens)round=addToken(round,token.key);assert.equal(isComplete(round),true);}
 }assert.equal(ids.size,24);
});
test('unknown or crossed actions, complements and examples cannot generate arbitrary text',()=>{
 const group=groups[0];assert.equal(continuationGroup(groups,'unknown'),null);assert.equal(continuationChoice(group,'unknown','frase-peixe'),null);assert.equal(continuationChoice(group,'nadar','frase-polvo'),null);assert.equal(continuationChoice(group,'viver','frase-peixe-1'),null);assert.equal(continuationPhrase(bases[1],group,'nadar','frase-peixe'),null);assert.equal(continuationPhrase(null,group,'nadar','frase-peixe'),null);
});
test('choosing a continuation never mutates examples, relations or a round already underway',()=>{
 const before=JSON.stringify({bases,groups}),round=addToken(phraseRound(bases[0]),'0');const snapshot=structuredClone(round);
 const phrase=continuationPhrase(bases[0],groups[0],'viver','frase-peixe-2');assert.equal(phrase.text,'O PEIXE VIVE NA ÁGUA');assert.deepEqual(round,snapshot);assert.equal(JSON.stringify({bases,groups}),before);assert.notEqual(phrase,bases[0]);
});
