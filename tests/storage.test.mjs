import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import * as store from '../frontend/storage/store.mjs';

test('transactional local records survive module re-open, cap at 200 and erase completely', async () => {
  await store.erase();
  await Promise.all(Array.from({length:205},(_,i)=>store.record({wordId:'peixe',sessionId:`s${i}`,support:'assisted',outcome:'completed'})));
  const loaded = await store.load();
  assert.equal(loaded.events.length,200);
  assert.equal(new Set(loaded.events.map(e=>e.sessionId)).size,200);
  await Promise.all([store.settings({dark:true}),store.settings({adapt:false})]);
  const reopened = await import('../frontend/storage/store.mjs?reopen=1');
  const persisted = await reopened.load();
  assert.equal(persisted.events.length,200);
  assert.equal(persisted.settings.dark,true);
  assert.equal(persisted.settings.adapt,false);
  await store.erase();
  const cleared = await reopened.load();
  assert.deepEqual(cleared.events,[]);
  assert.equal(cleared.settings.dark,false);
  assert.equal(cleared.settings.adapt,true);
});
