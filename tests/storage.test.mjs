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

test('legacy states gain an independent phrase history without losing words or preferences',async()=>{
 await store.erase();await new Promise((resolve,reject)=>{const request=indexedDB.open('pequenas-girafas-v1',1);request.onsuccess=()=>{const db=request.result,tx=db.transaction('local','readwrite');tx.objectStore('local').put({events:[{wordId:'mar'}],settings:{dark:true}},'state');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};request.onerror=()=>reject(request.error);});
 const before=await store.load();assert.deepEqual(before.phraseEvents,[]);assert.equal(before.events[0].wordId,'mar');assert.equal(before.settings.dark,true);
 await Promise.all(Array.from({length:205},(_,i)=>store.recordPhrase({phraseId:'frase-peixe',serial:i})));
 await Promise.all([store.record({wordId:'lua'}),store.settings({volume:.3})]);
 const reopened=await import('../frontend/storage/store.mjs?phrases-reopen=1');const after=await reopened.load();assert.equal(after.phraseEvents.length,200);assert.equal(new Set(after.phraseEvents.map(e=>e.serial)).size,200);assert.equal(after.events.length,2);assert.equal(after.settings.dark,true);assert.equal(after.settings.volume,.3);
 await store.erase();const erased=await reopened.load();assert.deepEqual(erased.phraseEvents,[]);assert.deepEqual(erased.events,[]);assert.equal(erased.settings.dark,false);
});
