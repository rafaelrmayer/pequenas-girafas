import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phraseRound,addToken,removeToken,isComplete,nextHint} from '../frontend/phrases/model.mjs';
const phrases=JSON.parse(readFileSync(new URL('../frontend/phrases/catalog.json',import.meta.url)));
test('phrases preserve accents and repeated words, with independent movable tokens',()=>{
 const phrase={text:'A MAÇÃ E A PERA'};let round=phraseRound(phrase);const original=structuredClone(round);
 round=addToken(round,'3');round=addToken(round,'1');round=addToken(round,'2');round=addToken(round,'0');round=addToken(round,'4');
 assert.equal(isComplete(round),true);assert.deepEqual(original.selected,[]);assert.deepEqual(nextHint(round),null);
 assert.equal(addToken(round,'3'),round);assert.equal(addToken(round,'unknown'),round);
 round=removeToken(round,'1');assert.equal(isComplete(round),false);assert.deepEqual(nextHint(round),{position:2,value:'MAÇÃ'});
});
test('a hint describes the first difference without filling or changing the answer',()=>{
 let round=phraseRound({text:'O PEIXE NADA'});assert.deepEqual(nextHint(round),{position:1,value:'O'});
 round=addToken(round,'2');const before=structuredClone(round);assert.deepEqual(nextHint(round),{position:1,value:'O'});assert.deepEqual(round,before);assert.equal(isComplete(round),false);
 round=removeToken(round,'2');for(const key of ['0','1','2'])round=addToken(round,key);assert.equal(isComplete(round),true);
});
test('every fixed phrase has a theme, reference word and complete token round',()=>{
 const words=['fundo-do-mar','astronomia','natureza','frutas'].flatMap(id=>JSON.parse(readFileSync(new URL('../knowledge/vocabulary/'+id+'.json',import.meta.url))).words.map(word=>({...word,themeId:id})));
 assert.equal(new Set(phrases.map(p=>p.id)).size,8);
 for(const phrase of phrases){assert.ok(words.some(word=>word.id===phrase.wordId&&word.themeId===phrase.themeId));let round=phraseRound(phrase);for(const token of round.tokens)round=addToken(round,token.key);assert.equal(isComplete(round),true);assert.equal(round.tokens.map(t=>t.value).join(' '),phrase.text);}
});
