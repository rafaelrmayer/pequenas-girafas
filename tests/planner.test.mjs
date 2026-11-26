import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {completion,evidenceFor,localDay,dayIndex,recommendSupport} from '../frontend/ai/adaptive-learning/engine.mjs';
import {recommendActivities} from '../frontend/ai/adaptive-learning/planner.mjs';
import {relatedWords} from '../frontend/ai/semantic-expansion/graph.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../knowledge/vocabulary/fundo-do-mar.json',import.meta.url)));
const make=(id,session,support=false,activity='build',day='2026-11-26',context='build:upper:image-v1')=>completion(id,session,support,activity,{day,contextId:context,hintUsed:support});
const plan=(events=[],options={})=>recommendActivities({catalog,events,wordId:'peixe',activity:'build',settings:{},rules:{},today:'2026-11-26',sessionId:'now',...options});
test('missing evidence and support lead to optional support, never difficulty labels or blocked content',()=>{
  const empty=plan();assert.equal(empty[0].action,'maintain');assert.match(empty[0].reason,/Falta de registro não é dificuldade/);
  const supported=plan([make('peixe','a',true)]);assert.equal(supported[0].action,'reinforce');
  assert.equal(catalog.words.length,7);assert.ok(supported.every(s=>s.reason && s.wordId));
});
test('sessions, local dates and presentations are distinct facts; no retention is inferred',()=>{
  const events=[make('peixe','a'),make('peixe','b'),make('peixe','b')];
  const facts=evidenceFor(events,'peixe');assert.equal(facts.independentSessions,2);assert.equal(facts.independentDays.length,1);assert.equal(facts.presentations.length,1);
  const support=recommendSupport(events,'peixe',{minIndependentSessions:2});assert.match(support.reason,/não comprova retenção/);
  events.push(make('peixe','c',false,'build','2026-11-27','build:lower:image-v1'));
  const next=evidenceFor(events,'peixe');assert.equal(next.independentDays.length,2);assert.equal(next.presentations.length,2);
});
test('legacy events stay undated and isolated by activity',()=>{
  const events=[{wordId:'peixe',sessionId:'old',support:'independent',outcome:'completed'},make('peixe','new',false,'match')];
  const facts=evidenceFor(events,'peixe');assert.equal(facts.completions,1);assert.equal(facts.undated,1);assert.equal(facts.days.length,0);assert.equal(facts.unknownHints,1);
  assert.equal(evidenceFor(events,'peixe','missing').status,'no_evidence');
  assert.equal(evidenceFor(events,'peixe','match').independent,1);
});
test('review uses completed dated observations and explicit interval, not silence or invalid/future dates',()=>{
  const old=[make('mar','a',false,'match','2026-11-01')];
  const suggestions=plan(old);assert.equal(suggestions[0].action,'review');assert.match(suggestions[0].reason,/não significa.*esquecimento/);
  assert.ok(!plan([make('mar','a',false,'match','2026-11-25')]).some(s=>s.action==='review'));
  assert.ok(!plan([make('mar','a',false,'match','2026-12-01')]).some(s=>s.action==='review'));
  assert.ok(!plan([{wordId:'mar',sessionId:'x',support:'independent',outcome:'completed'}]).some(s=>s.action==='review'));
  assert.equal(dayIndex('2026-02-30'),null);assert.equal(dayIndex('invalid'),null);
  assert.equal(localDay(new Date(2026,10,26,0,5)),'2026-11-26');
});
test('preferences affect ordering, without excluding or treating related complexity as ability',()=>{
  const animals=relatedWords(catalog,'peixe',[],{categoryInterest:'animal'});
  assert.equal(animals[0].category,'animal');assert.equal(animals.length,6);
  assert.ok(animals.some(w=>w.id==='caranguejo' && w.higherEditorialComplexity));
  const newWords=plan([make('peixe','a',true)],{settings:{exploration:'new',preferredActivity:'missing'}});
  assert.equal(newWords[0].action,'new_word');assert.equal(newWords[0].activity,'missing');
  const alternative=plan([],{settings:{preferredActivity:'match'}});assert.equal(alternative[0].activity,'match');
});
test('independent observations can suggest new word and presentation, without forced transition',()=>{
  const suggestions=plan([make('peixe','a')]);
  assert.equal(suggestions[0].action,'new_word');assert.equal(suggestions[0].wordId,'mar');
  assert.equal(suggestions[1].action,'new_image');assert.equal(suggestions[1].imageId,'image-v2');
  assert.match(suggestions[1].reason,/não comprova reconhecimento ou generalização/);
  const single=plan([make('mar','a')],{wordId:'mar'});
  assert.ok(single.some(s=>s.action==='new_presentation' && s.lowercase===true));
  const repeated=plan([make('peixe','now'),make('peixe','now'),make('peixe','now')]);
  assert.equal(repeated[0].action,'alternative');assert.match(repeated[0].reason,/não indica cansaço/);
});
test('disabled adaptation returns no personalized plan; details whitelist excludes timing and personal fields',()=>{
  assert.deepEqual(plan([make('peixe','a')],{settings:{adapt:false}}),[]);
  const record=completion('peixe','a',false,'build',{day:'2026-11-26',contextId:'build:upper:image-v1',hintUsed:true,name:'excluded',responseTime:42,diagnosis:'excluded'});
  assert.ok(!('name' in record) && !('responseTime' in record) && !('diagnosis' in record));
  assert.equal(record.hintUsed,true);
  assert.equal(completion('peixe','a',false,'build',{day:'invalid'}).day,undefined);
});
