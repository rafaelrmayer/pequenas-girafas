import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phraseEntries} from '../frontend/phrases/records.mjs';
import {buildPhraseReport} from '../frontend/reports/phrases.mjs';
const read=name=>JSON.parse(readFileSync(new URL('../frontend/phrases/'+name+'.json',import.meta.url)));
const entries=phraseEntries(read('catalog'),read('continuations'));
const catalog={themes:[{id:'fundo-do-mar',label:'Fundo do mar'},{id:'frutas',label:'Frutas'}],words:[]};
const event=(phraseId,day,extra={})=>({phraseId,day,outcome:'completed',...extra});
const report=(events,filters={})=>buildPhraseReport({catalog,entries,events,today:'2026-11-27',...filters});
test('phrase reports keep variants and unknown support separate without touching evidence',()=>{
 const events=[event('frase-peixe','2026-11-27',{modelUsed:false,hintUsed:false}),event('frase-peixe-2','2026-11-27',{modelUsed:true,hintUsed:false,audioRequested:true}),event('frase-peixe-2','2026-11-27')];const before=structuredClone(events),r=report(events);
 assert.equal(r.datedCount,3);assert.equal(r.datedRows.length,2);assert.equal(r.datedRows[1].unknownSupport,1);assert.equal(r.datedRows[1].unknownModel,1);assert.equal(r.datedRows[1].audio,1);assert.deepEqual(events,before);
});
test('phrase filters apply inclusive dates and theme while undated records stay separate',()=>{
 const events=[event('frase-maca-2','2026-11-26'),event('frase-maca','2026-11-27'),event('frase-pera',null),event('frase-peixe','2026-11-27')];const r=report(events,{themeId:'frutas',period:'range',from:'2026-11-27',to:'2026-11-27'});assert.equal(r.datedCount,1);assert.equal(r.undatedCount,1);assert.equal(r.excluded.outsidePeriod,1);assert.equal(r.datedRows[0].text,'A MAÇÃ É UMA FRUTA');assert.equal(report(events,{includeUndated:false}).excluded.undated,1);
});
test('future, unknown and word events cannot become phrase evidence',()=>{
 const r=report([event('frase-peixe','2026-11-28'),event('unknown','2026-11-27'),{wordId:'peixe',outcome:'completed',day:'2026-11-27'},event('frase-sol','2026-11-27',{outcome:'abandoned'})]);assert.equal(r.datedCount,0);assert.equal(r.excluded.future,1);assert.equal(r.excluded.unrecognized,2);
});
test('phrase reports use the same date and theme validation as word reports',()=>{
 assert.throws(()=>report([],{period:'range',from:'2026-11-28',to:'2026-11-27'}));assert.throws(()=>report([],{themeId:'unknown'}));assert.equal(report([]).datedRows.length,0);
});
