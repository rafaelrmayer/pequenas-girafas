import {reviewOverview} from './reviews.mjs';
import {nextPresentation,presentationsFor} from '../../modules/presentations.mjs';
import {evidenceFor} from './engine.mjs';
import {relatedWords} from '../semantic-expansion/graph.mjs';
const labels={build:'Montar a palavra',missing:'Completar uma letra',match:'Associar imagem e palavra'};
export function recommendActivities({catalog,events,wordId,activity='build',settings={},rules={},today,sessionId,imageId}) {
  if(settings.adapt===false) return [];
  const current=catalog.words.find(word=>word.id===wordId);
  if(!current) return [];
  if(current.themeId) catalog={...catalog,words:catalog.words.filter(word=>word.themeId===current.themeId)};
  const facts=evidenceFor(events,wordId,activity);
  const next=[];
  function add(action,id,type,label,reason,extra={}) {
    if(!catalog.words.some(word=>word.id===id) || !labels[type]) return;
    if(next.some(item=>item.wordId===id && item.activity===type && item.lowercase===extra.lowercase && item.imageId===extra.imageId)) return;
    next.push({id:`${action}:${id}:${type}`,action,wordId:id,activity:type,label,reason,...extra});
  }
  const preferred=labels[settings.preferredActivity]?settings.preferredActivity:null;
  const overview=reviewOverview({catalog,events,today,settings,rules});
  if(overview.available.length && settings.exploration!=='new') {
    const item=overview.available[0];
    add('review',item.wordId,item.activity,`Revisitar ${item.text}`,`O último registro datado de ${labels[item.activity]} é de ${item.lastDay}. O intervalo escolhido é ${overview.interval} dias; revisitar não significa que houve esquecimento. A atividade registrada é preservada.`,{mode:'model'});
  }
  if(settings.exploration==='review' && !next.length) {
    const item=overview.entries.find(entry=>entry.wordId!==wordId && ['recent','undated'].includes(entry.status));
    if(item) add('review',item.wordId,item.activity,`Revisitar ${item.text}`,item.status==='undated'
      ?`Você escolheu revisitar ${labels[item.activity]}, que já tem registros. Registros sem data não permitem calcular um intervalo.`
      :`Você escolheu revisitar ${labels[item.activity]}, com último registro datado em ${item.lastDay}. O intervalo de ${overview.interval} dias ainda não foi atingido; revisitar continua sendo uma escolha livre.`,{mode:'model'});
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
  const visual=nextPresentation(current,imageId || presentationsFor(current)[0].id,events,activity);
  const offerVisual=()=>{if(facts.completions && visual) add('new_image',wordId,preferred || activity,`Explorar outra imagem de ${current.text}`,'Há uma conclusão registrada desta palavra. Outra ilustração é uma escolha opcional; a conclusão não comprova reconhecimento ou generalização.',{mode:'model',imageId:visual.id});};
  if(!facts.completions) add('maintain',wordId,activity,'Explorar a atividade atual','Ainda não há conclusão registrada desta palavra nesta atividade. Falta de registro não é dificuldade.',{mode:'model'});
  else if(!facts.independent) {add(facts.withHints?'reinforce':'offer_support',wordId,activity,facts.withHints?'Retomar com pistas disponíveis':'Explorar novamente com apoio',`Há ${facts.assisted} conclusões com apoio nesta atividade. O modelo e as pistas podem continuar disponíveis, sem limitar novas escolhas.`,{mode:'model'});offerVisual();}
  else if(activity!=='build') {add('introduce_activity',wordId,preferred || alternative,`Experimentar: ${labels[preferred || alternative]}`,'Há uma conclusão sem pistas nesta atividade. Você pode experimentar outra; isso não comprova domínio da palavra.',{mode:'model'});offerVisual();}
  else {
    offerWord();offerVisual();
    add('new_presentation',wordId,'build',settings.lowercase?'Explorar letras maiúsculas':'Explorar letras minúsculas','Há construção sem pistas registrada. Outra apresentação é opcional; mudar a grafia não comprova generalização.',{mode:'model',lowercase:!settings.lowercase});
  }
  if(activity==='build') offerWord();
  add('alternative',wordId,preferred || alternative,`Experimentar: ${labels[preferred || alternative]}`,'Outra forma de explorar a mesma palavra. Todas as atividades permanecem livres.',{mode:'model'});
  return next.slice(0,Math.max(1,Math.min(2,Number(rules.maxSuggestions) || 2)));
}
