import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phraseEntries,phraseCompletion,phraseOverview} from '../frontend/phrases/records.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../frontend/phrases/'+name+'.json',import.meta.url)));
const entries=phraseEntries(read('catalog'),read('continuations'));
test('phrase completion accepts only catalog identifiers and explicit metadata',()=>{
 assert.equal(entries.length,24);const event=phraseCompletion(entries,'frase-peixe-2',{day:'2026-11-27',modelUsed:true,hintUsed:false,audioRequested:false,freeText:'private',duration:50});
 assert.deepEqual(event,{phraseId:'frase-peixe-2',exampleId:'frase-peixe',themeId:'fundo-do-mar',outcome:'completed',day:'2026-11-27',modelUsed:true,hintUsed:false,audioRequested:false});
 assert.equal(phraseCompletion(entries,'private',{day:'2026-11-27'}),null);assert.equal(phraseCompletion(entries,'frase-peixe',{day:'2026-02-30'}),null);
});
test('phrase summaries separate variants, explicit support and unknown metadata',()=>{
 const events=[{phraseId:'frase-peixe',outcome:'completed',modelUsed:false,hintUsed:false,audioRequested:false},{phraseId:'frase-peixe',outcome:'completed',modelUsed:true,hintUsed:false,audioRequested:true},{phraseId:'frase-peixe',outcome:'completed'}, {phraseId:'frase-peixe-2',outcome:'completed',hintUsed:true}, {phraseId:'unknown',outcome:'completed'}, {phraseId:'frase-sol',outcome:'abandoned'}];
 const before=structuredClone(events);const rows=phraseOverview(entries,events);assert.equal(rows.length,2);const row=rows.find(r=>r.id==='frase-peixe');assert.equal(row.total,3);assert.equal(row.withSupport,1);assert.equal(row.withoutSupport,1);assert.equal(row.unknownSupport,1);assert.equal(row.audio,1);assert.equal(row.unknownAudio,1);assert.equal(rows.find(r=>r.id==='frase-peixe-2').hints,1);assert.deepEqual(events,before);
});
