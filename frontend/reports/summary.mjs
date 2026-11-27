import {dayIndex} from '../ai/adaptive-learning/engine.mjs';
import {ACTIVITIES} from '../modules/activities.mjs';
export function buildReport({catalog,events,today,themeId='all',period='all',from='',to='',includeUndated=true}){
 const now=dayIndex(today);
 if(now===null)throw new Error('Confira a data do dispositivo antes de gerar o relatório.');
 if(!['all','range'].includes(period))throw new Error('Escolha um período válido.');
 if(themeId!=='all'&&!catalog.themes.some(theme=>theme.id===themeId))throw new Error('Escolha um tema disponível.');
 const start=dayIndex(from),end=dayIndex(to);
 if(period==='range'&&(start===null||end===null||start>end||end>now))throw new Error('Informe início e fim válidos, em ordem e sem data posterior a hoje.');
 const words=new Map(catalog.words.map(word=>[word.id,word]));
 const dated=[],undated=[],excluded={future:0,outsidePeriod:0,undated:0,unrecognized:0};
 for(const event of events){
  if(event.outcome!=='completed')continue;
  const word=words.get(event.wordId),activity=event.activity||'build';
  if(!word||!ACTIVITIES[activity]){excluded.unrecognized++;continue;}
  if(themeId!=='all'&&word.themeId!==themeId)continue;
  const day=dayIndex(event.day);
  if(day===null){if(includeUndated)undated.push(event);else excluded.undated++;continue;}
  if(day>now){excluded.future++;continue;}
  if(period==='range'&&(day<start||day>end)){excluded.outsidePeriod++;continue;}
  dated.push(event);
 }
 function rows(values){
  const result=[];
  for(const word of catalog.words)for(const activity of Object.keys(ACTIVITIES)){
   const matches=values.filter(event=>event.wordId===word.id&&(event.activity||'build')===activity);
   if(!matches.length)continue;
   const days=[...new Set(matches.map(event=>event.day).filter(day=>dayIndex(day)!==null))].sort();
   const independent=matches.filter(event=>event.support==='independent').length,assisted=matches.filter(event=>event.support==='assisted').length;
   result.push({wordId:word.id,word:word.text,theme:catalog.themes.find(theme=>theme.id===word.themeId)?.label||'Tema não informado',activity,activityLabel:ACTIVITIES[activity],
    completions:matches.length,independent,assisted,unknownSupport:matches.length-independent-assisted,
    hints:matches.filter(event=>event.hintUsed===true).length,unknownHints:matches.filter(event=>typeof event.hintUsed!=='boolean').length,
    audioRequested:matches.filter(event=>event.audioRequested===true).length,unknownAudio:matches.filter(event=>typeof event.audioRequested!=='boolean').length,
    days,firstDay:days[0]||null,lastDay:days.at(-1)||null});
  }return result;
 }
 return {generatedOn:today,theme:themeId==='all'?'Todos os temas':catalog.themes.find(theme=>theme.id===themeId).label,
  period:period==='all'?'Registros datados até '+today:from+' a '+to,includeUndated,
  datedRows:rows(dated),undatedRows:rows(undated),datedCount:dated.length,undatedCount:undated.length,
  days:[...new Set(dated.map(event=>event.day))].sort(),excluded,loadedCount:events.length};
}
