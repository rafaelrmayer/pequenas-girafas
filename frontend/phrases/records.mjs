import {dayIndex} from '../ai/adaptive-learning/engine.mjs';
export function phraseEntries(phrases,groups){
 const entries=new Map(phrases.map(phrase=>[phrase.id,{...phrase,exampleId:phrase.id}]));
 for(const group of groups){const base=phrases.find(item=>item.id===group.exampleId);if(!base)continue;
  for(const action of group.actions)for(const choice of action.complements)entries.set(choice.audioId,{...base,id:choice.audioId,text:choice.text,exampleId:base.id});
 }return [...entries.values()];
}
export function phraseCompletion(entries,phraseId,details){
 const entry=entries.find(item=>item.id===phraseId);if(!entry||dayIndex(details.day)===null)return null;
 const event={phraseId:entry.id,exampleId:entry.exampleId,themeId:entry.themeId,outcome:'completed',day:details.day};
 for(const key of ['modelUsed','hintUsed','audioRequested'])if(typeof details[key]==='boolean')event[key]=details[key];
 return event;
}
export function phraseOverview(entries,events){
 return entries.flatMap(entry=>{
  const selected=events.filter(event=>event.phraseId===entry.id&&event.outcome==='completed');if(!selected.length)return [];
  return [{...entry,total:selected.length,withSupport:selected.filter(e=>e.modelUsed===true||e.hintUsed===true).length,
   withoutSupport:selected.filter(e=>e.modelUsed===false&&e.hintUsed===false).length,
   unknownSupport:selected.filter(e=>e.modelUsed!==true&&e.hintUsed!==true&&(typeof e.modelUsed!=='boolean'||typeof e.hintUsed!=='boolean')).length,
   model:selected.filter(e=>e.modelUsed===true).length,unknownModel:selected.filter(e=>typeof e.modelUsed!=='boolean').length,unknownHints:selected.filter(e=>typeof e.hintUsed!=='boolean').length,hints:selected.filter(e=>e.hintUsed===true).length,
   audio:selected.filter(e=>e.audioRequested===true).length,unknownAudio:selected.filter(e=>typeof e.audioRequested!=='boolean').length}];
 });
}
