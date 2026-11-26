export function recommendSupport(events, wordId, rules, enabled = true) {
  if (!enabled) return {mode: 'model', reason: 'Adaptação desligada. Você escolhe o apoio.'};
  const completed = events.filter(e => e.wordId === wordId && e.outcome === 'completed' && (e.activity || 'build') === 'build');
  const independent = new Set(completed.filter(e => e.support === 'independent').map(e => e.sessionId));
  if (independent.size >= rules.minIndependentSessions)
    return {mode: 'memory', reason: `Há construções sem pistas em ${independent.size} sessões. Você pode experimentar sem o modelo e pedir apoio a qualquer momento. Sessões podem ser recargas do mesmo dia; isso não comprova retenção.`};
  if (completed.some(e => e.support === 'assisted'))
    return {mode: 'model', reason: 'Você usou apoio nesta palavra. O modelo continua disponível para explorar novamente.'};
  return {mode: 'model', reason: 'Vamos explorar com o modelo disponível. Ainda não há evidências em sessões diferentes para sugerir outro apoio.'};
}
export function completion(wordId, sessionId, usedSupport, activity = 'build', details) {
  const event={wordId, sessionId, support: usedSupport ? 'assisted' : 'independent', outcome: 'completed', activity};
  if(details) {
    if(dayIndex(details.day)!==null) event.day=details.day;
    if(typeof details.contextId==='string' && /^[a-z0-9:_-]{1,100}$/.test(details.contextId)) event.contextId=details.contextId;
    if(Array.isArray(details.visualIds)) event.visualIds=[...new Set(details.visualIds.filter(id=>typeof id==='string' && /^image-v[1-9]\d?$/.test(id)))].slice(0,3);
    for(const key of ['hintUsed','modelUsed','audioRequested']) if(typeof details[key]==='boolean') event[key]=details[key];
  }
  return event;
}
export function matchesWord(letters, word) { return letters.join('').normalize('NFC') === word.normalize('NFC'); }

export function localDay(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function dayIndex(day) {
  if(typeof day!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const time=Date.parse(day+'T00:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10)===day ? time/86400000 : null;
}
export function evidenceFor(events, wordId, activity='build') {
  const values=events.filter(e=>e.wordId===wordId && (e.activity || 'build')===activity && e.outcome==='completed');
  const independent=values.filter(e=>e.support==='independent');
  const days=[...new Set(values.map(e=>e.day).filter(day=>dayIndex(day)!==null))].sort();
  const independentDays=[...new Set(independent.map(e=>e.day).filter(day=>dayIndex(day)!==null))].sort();
  return {
    completions:values.length, independent:independent.length,
    assisted:values.filter(e=>e.support==='assisted').length,
    withHints:values.filter(e=>e.hintUsed===true).length,
    unknownHints:values.filter(e=>typeof e.hintUsed!=='boolean').length,
    sessions:new Set(values.map(e=>e.sessionId)).size,
    independentSessions:new Set(independent.map(e=>e.sessionId)).size,
    days, independentDays, lastDay:days.at(-1) || null,
    undated:values.filter(e=>dayIndex(e.day)===null).length,
    presentations:[...new Set(values.map(e=>e.contextId).filter(Boolean))],
    status:!values.length?'no_evidence':independent.length?'observed_independent':'explored_with_support'
  };
}
