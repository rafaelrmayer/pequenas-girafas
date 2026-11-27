import {buildReport} from './summary.mjs';
import {dayIndex} from '../ai/adaptive-learning/engine.mjs';
import {phraseOverview} from '../phrases/records.mjs';
export function buildPhraseReport({catalog,entries,events,today,...filters}){
 // Shared validation/labels, while phrase evidence stays separate from word evidence.
 const metadata=buildReport({catalog,events:[],today,...filters});
 const dated=[],undated=[],excluded={future:0,outsidePeriod:0,undated:0,unrecognized:0};
 for(const event of events){
  if(event.outcome!=='completed')continue;const entry=entries.find(item=>item.id===event.phraseId);
  if(!entry){excluded.unrecognized++;continue;}if(filters.themeId&&filters.themeId!=='all'&&entry.themeId!==filters.themeId)continue;
  const day=dayIndex(event.day);if(day===null){if(metadata.includeUndated)undated.push(event);else excluded.undated++;continue;}
  if(day>dayIndex(today)){excluded.future++;continue;}
  if(filters.period==='range'&&(day<dayIndex(filters.from)||day>dayIndex(filters.to))){excluded.outsidePeriod++;continue;}dated.push(event);
 }
 function rows(values){return phraseOverview(entries,values).map(row=>{const days=[...new Set(values.filter(event=>event.phraseId===row.id).map(event=>event.day).filter(day=>dayIndex(day)!==null))].sort();return {...row,days,firstDay:days[0]||null,lastDay:days.at(-1)||null};});}
 return {...metadata,datedRows:rows(dated),undatedRows:rows(undated),datedCount:dated.length,undatedCount:undated.length,excluded};
}
