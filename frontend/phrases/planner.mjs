import {dayIndex} from '../ai/adaptive-learning/engine.mjs';
export function recommendPhrases({entries,events,phraseId,settings={},today}){
 if(settings.adapt===false)return [];
 const current=entries.find(entry=>entry.id===phraseId);if(!current)return [];
 const scope=entries.filter(entry=>entry.themeId===current.themeId),now=dayIndex(today);
 const completed=events.filter(event=>event.outcome==='completed'&&scope.some(entry=>entry.id===event.phraseId));
 const usable=completed.filter(event=>dayIndex(event.day)===null||(now!==null&&dayIndex(event.day)<=now));
 const interval=Number.isInteger(settings.reviewAfterDays)&&settings.reviewAfterDays>=3&&settings.reviewAfterDays<=30?settings.reviewAfterDays:7;
 const facts=scope.map(entry=>{
  const all=completed.filter(event=>event.phraseId===entry.id),records=usable.filter(event=>event.phraseId===entry.id);
  const days=records.map(event=>event.day).filter(day=>dayIndex(day)!==null).sort();
  return {entry,all,records,lastDay:days.at(-1),future:now!==null&&all.some(event=>dayIndex(event.day)!==null&&dayIndex(event.day)>now)};
 });
 const next=[];
 function add(action,fact,reason){if(next.some(item=>item.phraseId===fact.entry.id))return;next.push({id:action+':'+fact.entry.id,action,phraseId:fact.entry.id,text:fact.entry.text,exampleId:fact.entry.exampleId,themeId:fact.entry.themeId,reason});}
 const due=now===null?[]:facts.filter(f=>f.lastDay&&!f.future&&now-dayIndex(f.lastDay)>=interval).sort((a,b)=>a.lastDay.localeCompare(b.lastDay)||a.entry.id.localeCompare(b.entry.id));
 const review=()=>{
  const fact=due[0];if(fact){add('review',fact,`O último registro datado desta frase é de ${fact.lastDay}. O intervalo escolhido é ${interval} dias; revisitar é opcional e não significa esquecimento.`);return;}
  if(settings.exploration==='review'){
   const chosen=facts.find(f=>f.records.length&&!f.future);if(chosen)add('review',chosen,chosen.lastDay?`Você escolheu revisitar frases. Há registro de ${chosen.lastDay}; o intervalo de ${interval} dias ainda não foi atingido. Repetir continua sendo uma escolha livre.`:'Você escolheu revisitar frases já registradas. Esta frase tem registros sem data válida, que não permitem calcular intervalo.');
  }
 };
 const newPhrase=()=>{
  const unseen=facts.filter(f=>!f.all.length&&f.entry.id!==current.id).sort((a,b)=>Number(b.entry.exampleId===current.exampleId)-Number(a.entry.exampleId===current.exampleId)||a.entry.text.split(' ').length-b.entry.text.split(' ').length||a.entry.id.localeCompare(b.entry.id))[0];
  if(unseen)add('new_phrase',unseen,unseen.entry.exampleId===current.exampleId?'Esta continuação pertence ao mesmo exemplo e ainda não tem conclusão registrada. Você pode escolhê-la ou continuar na frase atual.':'Outra frase do tema escolhido, ainda sem conclusão registrada. A escolha é livre e não depende de concluir a frase atual.');
 };
 if(settings.exploration==='new')newPhrase();else review();
 const fact=facts.find(f=>f.entry.id===current.id);
 const support=fact.records.filter(event=>event.modelUsed===true||event.hintUsed===true).length;
 if(support)add('support',fact,`Há ${support} ${support===1?'conclusão':'conclusões'} desta frase com modelo ou pista registrados. Você pode explorar novamente com os apoios disponíveis; isso não indica dificuldade nem limita outras escolhas.`);
 else if(!fact.records.length)add('maintain',fact,fact.future?'Há registros desta frase com data futura. Confira a data do dispositivo; eles não foram usados para organizar revisitas. Você pode continuar explorando livremente.':'Não há conclusão utilizável desta frase nos registros locais. Falta de registro não é dificuldade. Modelo e pistas continuam opcionais.');
 else add('maintain',fact,fact.records.some(event=>typeof event.modelUsed!=='boolean'||typeof event.hintUsed!=='boolean')?'Há conclusões com informações de apoio ausentes. Isso não significa ausência de apoio. Continuar ou variar é uma escolha livre.':'Há conclusões desta frase registradas. Repetir é opcional; esses registros não comprovam domínio, retenção ou capacidade.');
 newPhrase();if(settings.exploration==='new')review();
 return next.slice(0,2);
}
