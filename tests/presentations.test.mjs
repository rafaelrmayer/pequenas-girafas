import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {presentationsFor,recordedVisualIds,visualEvidence,nextPresentation,changeRoundVisual} from '../frontend/modules/presentations.mjs';
import {completion} from '../frontend/ai/adaptive-learning/engine.mjs';
import {recommendActivities} from '../frontend/ai/adaptive-learning/planner.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../knowledge/vocabulary/fundo-do-mar.json',import.meta.url)));
const fish=catalog.words.find(w=>w.id==='peixe');
test('three words have three fixed images; other words keep the original and fallback stays compatible',()=>{
  for(const word of catalog.words) assert.equal(presentationsFor(word).length,['peixe','polvo','agua'].includes(word.id)?3:1);
  assert.equal(presentationsFor({image:'/original.svg',alt:'original'})[0].asset,'/original.svg');
  assert.equal(new Set(presentationsFor(fish).map(p=>p.id)).size,3);
});
test('legacy image-v1 is identified only when explicitly recorded; unknown and mixed observations stay separate',()=>{
  const events=[
    {wordId:'peixe',outcome:'completed',support:'independent',contextId:'build:upper:image-v1'},
    {wordId:'peixe',outcome:'completed',support:'assisted'},
    {wordId:'peixe',outcome:'completed',support:'independent',contextId:'build:upper:image-mixed',visualIds:['image-v1','image-v2']}
  ];
  const facts=visualEvidence(events,fish);
  assert.equal(facts.rows[0].completions,1);assert.equal(facts.rows[1].completions,0);
  assert.equal(facts.mixed,1);assert.equal(facts.unknown,1);
  assert.deepEqual(recordedVisualIds(events[0]),['image-v1']);
  assert.equal(nextPresentation(fish,'image-v1',events).id,'image-v2');
});
test('selecting before interaction starts a single context; switching mid-round retains both without duplicate identities',()=>{
  assert.deepEqual(changeRoundVisual(['image-v1'],'image-v2',false),['image-v2']);
  assert.deepEqual(changeRoundVisual(['image-v1'],'image-v2',true),['image-v1','image-v2']);
  assert.deepEqual(changeRoundVisual(['image-v1','image-v2'],'image-v1',true),['image-v1','image-v2']);
  const event=completion('peixe','test',false,'build',{visualIds:['image-v2','image-v2','https://invalid','name'],contextId:'build:upper:image-v2'});
  assert.deepEqual(event.visualIds,['image-v2']);
});
test('another image is optional, executable and never recommended for single-image words or disabled adaptation',()=>{
  const event=completion('peixe','one',true,'build',{visualIds:['image-v1']});
  const options={catalog,events:[event],wordId:'peixe',activity:'build',settings:{},rules:{},imageId:'image-v1'};
  const next=recommendActivities(options).find(s=>s.action==='new_image');
  assert.equal(next.imageId,'image-v2');assert.equal(next.wordId,'peixe');assert.equal(next.mode,'model');
  assert.deepEqual(recommendActivities({...options,settings:{adapt:false}}),[]);
  assert.ok(!recommendActivities({...options,wordId:'mar'}).some(s=>s.action==='new_image'));
});
