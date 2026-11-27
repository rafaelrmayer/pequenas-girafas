import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildReport} from '../frontend/reports/summary.mjs';
const themes=['fundo-do-mar','astronomia','natureza','frutas'].map(name=>JSON.parse(fs.readFileSync(new URL('../knowledge/vocabulary/'+name+'.json',import.meta.url))));
const catalog={themes:themes.map(entry=>entry.theme),words:themes.flatMap(entry=>entry.words.map(word=>({...word,themeId:entry.theme.id})))};
const event=(wordId,activity,day,support='independent',details={})=>({wordId,activity,day,support,outcome:'completed',sessionId:'not-for-report',...details});
const report=(events,options={})=>buildReport({catalog,events,today:'2026-11-27',...options});
test('report separates activities, support and missing metadata without identifiers or mutation',()=>{
 const values=[event('peixe','build','2026-11-20','independent',{hintUsed:false,audioRequested:true}),event('peixe','build','2026-11-21','assisted',{hintUsed:true}),event('peixe','match','2026-11-21','unknown')];
 const before=JSON.stringify(values);const result=report(values);
 assert.equal(result.datedCount,3);assert.equal(result.datedRows.length,2);assert.equal(result.days.length,2);
 const build=result.datedRows.find(row=>row.activity==='build');assert.equal(build.independent,1);assert.equal(build.assisted,1);assert.equal(build.hints,1);assert.equal(build.unknownAudio,1);
 assert.equal(result.datedRows.find(row=>row.activity==='match').unknownSupport,1);
 assert.ok(!JSON.stringify(result).includes('not-for-report'));assert.equal(JSON.stringify(values),before);
});
test('date ranges are inclusive; undated and invalid dates remain separate from selected period',()=>{
 const values=[event('maca','build','2026-11-10'),event('maca','build','2026-11-20'),event('maca','build','2026-11-21'),event('maca','build',undefined),event('maca','build','2026-02-30')];
 const result=report(values,{period:'range',from:'2026-11-10',to:'2026-11-20'});
 assert.equal(result.datedCount,2);assert.equal(result.undatedCount,2);assert.equal(result.excluded.outsidePeriod,1);
 assert.deepEqual(result.undatedRows[0].days,[]);assert.equal(result.undatedRows[0].lastDay,null);
 const omitted=report(values,{includeUndated:false});assert.equal(omitted.undatedCount,0);assert.equal(omitted.excluded.undated,2);
});
test('future evidence and unrecognized records cannot become current progress',()=>{
 const result=report([event('lua','build','2026-12-01'),event('unknown','build','2026-11-20'),event('lua','unexpected','2026-11-20'),{...event('lua','build','2026-11-20'),outcome:'abandoned'}]);
 assert.equal(result.datedCount,0);assert.equal(result.excluded.future,1);assert.equal(result.excluded.unrecognized,2);assert.deepEqual(result.datedRows,[]);
});
test('theme filtering preserves accented vocabulary and legacy missing activity only maps to build',()=>{
 const result=report([event('maca',undefined,'2026-11-20'),event('pessego','match','2026-11-21'),event('peixe','build','2026-11-21')],{themeId:'frutas'});
 assert.equal(result.datedCount,2);assert.equal(result.datedRows[0].word,'MAÇÃ');assert.equal(result.datedRows[0].activity,'build');assert.equal(result.datedRows[1].word,'PÊSSEGO');
});
test('invalid filters are rejected, and missing evidence stays an empty descriptive report',()=>{
 for(const options of [{period:'range',from:'2026-11-22',to:'2026-11-20'},{period:'range',from:'2026-11-01',to:'2026-12-01'},{period:'range',from:'',to:''},{themeId:'missing'},{today:'invalid'}])assert.throws(()=>report([],options));
 const empty=report([]);assert.equal(empty.datedCount,0);assert.equal(empty.undatedCount,0);assert.deepEqual(empty.datedRows,[]);
});
