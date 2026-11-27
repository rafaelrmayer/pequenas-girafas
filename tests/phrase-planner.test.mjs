import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phraseEntries} from '../frontend/phrases/records.mjs';
import {recommendPhrases} from '../frontend/phrases/planner.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../frontend/phrases/'+name+'.json',import.meta.url)));
const entries=phraseEntries(read('catalog'),read('continuations'));
const event=(phraseId,extra={})=>({phraseId,outcome:'completed',day:'2026-11-27',...extra});
const plan=(events=[],settings={},phraseId='frase-peixe',today='2026-11-27')=>recommendPhrases({entries,events,settings,phraseId,today});
test('no phrase history offers optional same-theme choices without claims of difficulty',()=>{
 const result=plan();assert.equal(result.length,2);assert.equal(result[0].action,'maintain');assert.match(result[0].reason,/Falta de registro não é dificuldade/);assert.equal(result[1].exampleId,'frase-peixe');assert.ok(result.every(item=>item.themeId==='fundo-do-mar'));assert.equal(new Set(result.map(item=>item.phraseId)).size,result.length);
});
test('supported and unknown phrase metadata never become independent evidence',()=>{
 assert.equal(plan([event('frase-peixe',{modelUsed:true,hintUsed:false})])[0].action,'support');assert.match(plan([event('frase-peixe')])[0].reason,/informações de apoio ausentes/);
 const words=[{wordId:'peixe',support:'independent',outcome:'completed'}];assert.deepEqual(plan(words),plan());assert.deepEqual(plan([event('frase-sol',{modelUsed:true})]),plan());
});
test('reviews use last dated record, selected interval and conservative future/unknown dates',()=>{
 const old=event('frase-polvo',{day:'2026-11-17'});assert.equal(plan([old])[0].action,'review');assert.match(plan([old])[0].reason,/2026-11-17/);assert.notEqual(plan([old],{reviewAfterDays:14})[0].action,'review');assert.equal(plan([old,event('frase-polvo',{day:null})])[0].action,'review');assert.notEqual(plan([old,event('frase-polvo',{day:'2026-11-26'})])[0].action,'review');assert.notEqual(plan([old,event('frase-polvo',{day:'2026-11-28'})])[0].action,'review');assert.notEqual(plan([event('frase-polvo',{day:null})])[0].action,'review');assert.notEqual(plan([old],{},'frase-peixe','invalid')[0].action,'review');
});
test('explicit new and review preferences reorder choices without requiring completions',()=>{
 assert.equal(plan([],{exploration:'new'})[0].action,'new_phrase');const unknown=plan([event('frase-polvo',{day:null})],{exploration:'review'});assert.equal(unknown[0].action,'review');assert.match(unknown[0].reason,/sem data válida/);const recent=plan([event('frase-polvo')],{exploration:'review'});assert.match(recent[0].reason,/ainda não foi atingido/);
});
test('adaptation disabled, unknown phrases and unavailable history cannot create external targets',()=>{
 assert.deepEqual(plan([],{adapt:false}),[]);assert.deepEqual(plan([],{},'unknown'),[]);const result=plan([event('untrusted',{day:'2026-11-01'}),event('frase-peixe',{day:'2026-11-28'})]);assert.ok(result.every(item=>entries.some(entry=>entry.id===item.phraseId)));assert.match(result.find(item=>item.phraseId==='frase-peixe').reason,/data futura/);
});
test('planner is deterministic, read-only and offers no more than two unique choices',()=>{
 const events=[event('frase-peixe',{modelUsed:true}),event('frase-polvo',{day:'2026-11-01'})],before=structuredClone({entries,events});const a=plan(events),b=plan(events);assert.deepEqual(a,b);assert.ok(a.length<=2);assert.deepEqual({entries,events},before);assert.ok(a.every(item=>typeof item.reason==='string'&&item.reason.length>20));
});
