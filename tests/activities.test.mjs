import test from 'node:test';
import assert from 'node:assert/strict';
import {lettersRound,placeLetter,associationChoices} from '../frontend/modules/activities.mjs';
const catalog={words:[{id:'peixe'},{id:'agua'},{id:'mar'},{id:'polvo'}]};
test('fixed positions support out-of-order placement, repeated letters and swaps without duplicating tiles',()=>{
  const round=lettersRound('PEIXE');let slots=round.slots;
  slots=placeLetter(slots,round.bank,'2',2,round.locked);
  slots=placeLetter(slots,round.bank,'0',0,round.locked);
  assert.equal(slots[1],null);assert.equal(slots[2].value,'I');
  slots=placeLetter(slots,round.bank,'2',0,round.locked);
  assert.equal(slots[0].value,'I');assert.equal(slots[2].value,'P');
  slots=placeLetter(slots,round.bank,'2',2,round.locked);
  for(const index of [1,3,4]) slots=placeLetter(slots,round.bank,String(index),index,round.locked);
  assert.equal(slots.map(entry=>entry.value).join(''),'PEIXE');
  assert.equal(new Set(slots.map(entry=>entry.key)).size,5);
});
test('missing letter keeps fixed letters, preserves accents and varies the gap on repeat',()=>{
  const round=lettersRound('ÁGUA','missing');
  assert.equal(round.gap,2);assert.equal(round.slots[0].value,'Á');
  assert.equal(round.locked.filter(Boolean).length,3);
  const right=round.bank.find(entry=>entry.value==='U');
  assert.equal(placeLetter(round.slots,round.bank,right.key,0,round.locked),round.slots);
  assert.equal(placeLetter(round.slots,round.bank,'fixed-0',2,round.locked),round.slots);
  const filled=placeLetter(round.slots,round.bank,right.key,2,round.locked);
  assert.equal(filled.map(entry=>entry.value).join(''),'ÁGUA');
  assert.equal(lettersRound('ÁGUA','missing',1).gap,3);
});
test('bad keys or destinations do not change a round; bank replacement frees the old candidate',()=>{
  const round=lettersRound('PEIXE','missing');
  assert.equal(placeLetter(round.slots,round.bank,'external',round.gap,round.locked),round.slots);
  assert.equal(placeLetter(round.slots,round.bank,round.bank[0].key,-1,round.locked),round.slots);
  const wrong=placeLetter(round.slots,round.bank,round.bank[0].key,round.gap,round.locked);
  const right=round.bank.find(entry=>entry.value==='I');
  const fixed=placeLetter(wrong,round.bank,right.key,round.gap,round.locked);
  assert.equal(fixed.map(entry=>entry.value).join(''),'PEIXE');
  assert.ok(!fixed.some(entry=>entry?.key===round.bank[0].key));
});
test('association offers three distinct words and varies the correct position on repeat',()=>{
  const first=associationChoices(catalog,'peixe');
  const next=associationChoices(catalog,'peixe',1);
  assert.equal(first.length,3);assert.equal(new Set(first.map(w=>w.id)).size,3);
  assert.ok(first.some(w=>w.id==='peixe'));
  assert.notEqual(first.findIndex(w=>w.id==='peixe'),next.findIndex(w=>w.id==='peixe'));
});
