import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recommendSupport, completion, matchesWord} from '../frontend/ai/adaptive-learning/engine.mjs';
import {relatedWords} from '../frontend/ai/semantic-expansion/graph.mjs';
const catalog = JSON.parse(fs.readFileSync(new URL('../knowledge/vocabulary/fundo-do-mar.json', import.meta.url)));
const rules = {minIndependentSessions:2};
test('unknown evidence is not difficulty; default keeps model without imposing a limit', () => {
  assert.equal(recommendSupport([], 'peixe', rules).mode, 'model');
  assert.match(recommendSupport([], 'peixe', rules).reason, /não há evidências/);
});
test('same-session repeats cannot produce cross-session recommendation', () => {
  const event = completion('peixe','session-a',false);
  assert.equal(recommendSupport([event,event,event], 'peixe', rules).mode, 'model');
  assert.equal(recommendSupport([event,completion('peixe','session-b',false)], 'peixe', rules).mode, 'memory');
});
test('supported completions are distinguished; thresholds and personalization are configurable', () => {
  const events = [completion('peixe','a',true),completion('peixe','b',false)];
  assert.equal(recommendSupport(events,'peixe',rules).mode,'model');
  events.push(completion('peixe','c',false));
  assert.equal(recommendSupport(events,'peixe',rules,false).mode,'model');
  assert.equal(recommendSupport(events,'peixe',{minIndependentSessions:3}).mode,'model');
});
test('no timing, personal details, errors or abandonments are recorded', () => {
  assert.deepEqual(Object.keys(completion('peixe','a',false)), ['wordId','sessionId','support','outcome']);
});
test('related words account for relation, length annotation and prior exploration; never gate', () => {
  const results = relatedWords(catalog,'peixe');
  assert.equal(results.length,6);
  assert.equal(results[0].id,'mar');
  const explored = relatedWords(catalog,'peixe',[completion('mar','a',false)]);
  assert.notEqual(explored[0].id,'mar');
  assert.ok(explored.some(w=>w.id==='caranguejo'));
  assert.ok(results.every(w=>w.reason));
});
test('accents, repeated letters and order are preserved', () => {
  assert.ok(matchesWord(['P','E','I','X','E'],'PEIXE'));
  assert.ok(matchesWord(['A\u0301','G','U','A'],'ÁGUA'));
  assert.ok(!matchesWord(['A','G','U','A'],'ÁGUA'));
  assert.ok(!matchesWord(['P','E','X','I','E'],'PEIXE'));
});
