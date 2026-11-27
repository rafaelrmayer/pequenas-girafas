import {dayIndex,evidenceFor} from './engine.mjs';
const activities=['build','missing','match'];
export function reviewOverview({catalog,events,today,settings={},rules={}}){
 const requested=Number(settings.reviewAfterDays ?? rules.reviewAfterDays ?? 7);
 const interval=Number.isInteger(requested)&&requested>=3&&requested<=30?requested:7;
 if(settings.adapt===false)return {enabled:false,interval,entries:[],available:[]};
 const now=dayIndex(today),entries=[];
 for(const word of catalog.words)for(const activity of activities){
  const facts=evidenceFor(events,word.id,activity);
  if(!facts.completions)continue;
  const future=now!==null&&facts.days.some(day=>dayIndex(day)>now);
  const daysSince=now!==null&&facts.lastDay&&!future?now-dayIndex(facts.lastDay):null;
  const status=now===null?'check_clock':future?'check_date':!facts.lastDay?'undated':daysSince>=interval?'available':'recent';
  entries.push({wordId:word.id,text:word.text,activity,status,lastDay:facts.lastDay,daysSince,
   completions:facts.completions,independent:facts.independent,assisted:facts.assisted,undated:facts.undated,interval});
 }
 entries.sort((a,b)=>(a.lastDay||'9999').localeCompare(b.lastDay||'9999')||a.text.localeCompare(b.text,'pt-BR')||activities.indexOf(a.activity)-activities.indexOf(b.activity));
 return {enabled:true,interval,entries,available:entries.filter(item=>item.status==='available')};
}
