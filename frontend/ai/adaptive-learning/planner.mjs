import {dayIndex,evidenceFor} from './engine.mjs';
import {relatedWords} from '../semantic-expansion/graph.mjs';
const labels={build:'Montar a palavra',missing:'Completar uma letra',match:'Associar imagem e palavra'};
export function recommendActivities({catalog,events,wordId,activity='build',settings={},rules={},today,sessionId}) {
  if(settings.adapt===false) return [];
  const current=catalog.words.find(word=>word.id===wordId);
  if(!current) return [];
  const facts=evidenceFor(events,wordId,activity);
  const next=[];
  function add(action,id,type,label,reason,extra={}) {
    if(!catalog.words.some(word=>word.id===id) || !labels[type]) return;
    if(next.some(item=>item.wordId===id && item.activity===type && item.lowercase===extra.lowercase)) return;
    next.push({id:`${action}:${id}:${type}`,action,wordId:id,activity:type,label,reason,...extra});
  }
  const preferred=labels[settings.preferredActivity]?settings.preferredActivity:null;
  const interval=Number(settings.reviewAfterDays || rules.reviewAfterDays || 7);
  const reviewDays=Number.isInteger(interval) && interval>=3 && interval<=30?interval:7;
  const now=dayIndex(today);
  const reviews=catalog.words.flatMap(word=>Object.keys(labels).map(type=>({word,type,facts:evidenceFor(events,word.id,type)})))
    .filter(item=>item.facts.lastDay && now!==null && now-dayIndex(item.facts.lastDay)>=reviewDays)
    .sort((a,b)=>a.facts.lastDay.localeCompare(b.facts.lastDay) || a.word.complexity-b.word.complexity);
  if(reviews.length && settings.exploration!=='new') {
    const item=reviews[0];
    add('review',item.word.id,preferred || item.type,`Revisitar ${item.word.text}`,`Há um registro de ${labels[item.type]} em ${item.facts.lastDay}. O intervalo escolhido é ${reviewDays} dias; revisitar não significa que houve esquecimento.`,{mode:'model'});
  }
  if(settings.exploration==='review' && !next.length) {
    const old=catalog.words.find(word=>word.id!==wordId && events.some(e=>e.wordId===word.id && e.outcome==='completed'));
    if(old) add('review',old.id,preferred || activity,`Revisitar ${old.text}`,'Você escolheu revisar palavras já exploradas. Registros sem data não permitem calcular um intervalo.',{mode:'model'});
  }
  const related=relatedWords(catalog,wordId,events,{...settings,today});
  const candidate=related[0];
  const offerWord=()=>{
    if(candidate) add('new_word',candidate.id,preferred || 'match',`Explorar ${candidate.text}`,candidate.reason+' A relação é temática, não uma avaliação de capacidade.',{mode:'model'});
  };
  if(settings.exploration==='new') offerWord();
  if(preferred && preferred!==activity) add('alternative',wordId,preferred,`Experimentar: ${labels[preferred]}`,'Esta atividade foi escolhida nas preferências. Você pode aceitar ou continuar na atual.',{mode:'model'});
  const repeats=events.filter(e=>e.wordId===wordId && (e.activity || 'build')===activity && e.sessionId===sessionId && e.outcome==='completed').length;
  const alternative=activity==='match'?'missing':activity==='missing'?'build':'match';
  if(repeats>=3) add('alternative',wordId,preferred || alternative,`Variar: ${labels[preferred || alternative]}`,`Há ${repeats} conclusões desta atividade nesta sessão. Variar é opcional; esse número não indica cansaço ou dificuldade.`,{mode:'model'});
  if(!facts.completions) add('maintain',wordId,activity,'Explorar a atividade atual','Ainda não há conclusão registrada desta palavra nesta atividade. Falta de registro não é dificuldade.',{mode:'model'});
  else if(!facts.independent) add(facts.withHints?'reinforce':'offer_support',wordId,activity,facts.withHints?'Retomar com pistas disponíveis':'Explorar novamente com apoio',`Há ${facts.assisted} conclusões com apoio nesta atividade. O modelo e as pistas podem continuar disponíveis, sem limitar novas escolhas.`,{mode:'model'});
  else if(activity!=='build') add('introduce_activity',wordId,preferred || alternative,`Experimentar: ${labels[preferred || alternative]}`,'Há uma conclusão sem pistas nesta atividade. Você pode experimentar outra; isso não comprova domínio da palavra.',{mode:'model'});
  else {
    offerWord();
    add('new_presentation',wordId,'build',settings.lowercase?'Explorar letras maiúsculas':'Explorar letras minúsculas','Há construção sem pistas registrada. Outra apresentação é opcional; mudar a grafia não comprova generalização.',{mode:'model',lowercase:!settings.lowercase});
  }
  if(activity==='build') offerWord();
  add('alternative',wordId,preferred || alternative,`Experimentar: ${labels[preferred || alternative]}`,'Outra forma de explorar a mesma palavra. Todas as atividades permanecem livres.',{mode:'model'});
  return next.slice(0,Math.max(1,Math.min(2,Number(rules.maxSuggestions) || 2)));
}
