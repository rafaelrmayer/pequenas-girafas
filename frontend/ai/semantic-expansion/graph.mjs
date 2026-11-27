import {dayIndex, evidenceFor} from '../adaptive-learning/engine.mjs';
export function relatedWords(catalog, wordId, events = [], options = {}) {
  const start=catalog.words.find(w=>w.id===wordId);
  if(!start) return [];
  const direct=new Map();
  for(const edge of catalog.relations) {
    if(edge.from===wordId) direct.set(edge.to,edge.label);
    if(edge.to===wordId) direct.set(edge.from,`ligação no tema: ${edge.label}`);
  }
  const activity=['build','missing','match'].includes(options.preferredActivity)?options.preferredActivity:'build';
  const today=dayIndex(options.today);
  const goal=options.exploration || 'balanced';
  return catalog.words.filter(w=>w.id!==wordId && (!start.themeId || !w.themeId || w.themeId===start.themeId)).map(w=>{
    const facts=evidenceFor(events,w.id,activity);
    const explored=events.some(e=>e.wordId===w.id && e.outcome==='completed');
    const related=direct.has(w.id);
    const higherEditorialComplexity=w.complexity>start.complexity && facts.independent===0;
    const preferred=options.categoryInterest && options.categoryInterest!=='all' && w.category===options.categoryInterest;
    const since=today!==null && facts.lastDay ? today-dayIndex(facts.lastDay) : null;
    const revisit=since!==null && since>=Number(options.reviewAfterDays || 7);
    const reasons=[related?`Relação com ${start.text}: ${direct.get(w.id)}.`:'Outra palavra do mesmo tema.'];
    if(preferred) reasons.push('Categoria escolhida nas preferências.');
    if(goal==='review' && explored) reasons.push('Você escolheu revisitar palavras exploradas.');
    if(goal==='new' && !explored) reasons.push('Você escolheu explorar palavras novas.');
    if(higherEditorialComplexity) reasons.push('Anotação editorial mais complexa; a escolha continua livre.');
    return {...w,reason:reasons.join(' '),direct:related,explored,preferred,higherEditorialComplexity,revisit,lastDay:facts.lastDay};
  }).sort((a,b)=>Number(b.preferred)-Number(a.preferred)
    || Number(a.higherEditorialComplexity)-Number(b.higherEditorialComplexity)
    || Number(b.direct)-Number(a.direct)
    || (goal==='balanced'?Number(b.revisit)-Number(a.revisit):0)
    || (goal==='review'?Number(b.explored)-Number(a.explored):Number(a.explored)-Number(b.explored))
    || a.complexity-b.complexity || a.text.localeCompare(b.text,'pt-BR'));
}
