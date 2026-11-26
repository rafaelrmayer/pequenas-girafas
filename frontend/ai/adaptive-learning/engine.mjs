export function recommendSupport(events, wordId, rules, enabled = true) {
  if (!enabled) return {mode: 'model', reason: 'Adaptação desligada. Você escolhe o apoio.'};
  const completed = events.filter(e => e.wordId === wordId && e.outcome === 'completed');
  const independent = new Set(completed.filter(e => e.support === 'independent').map(e => e.sessionId));
  if (independent.size >= rules.minIndependentSessions)
    return {mode: 'memory', reason: `Há construções sem pistas em ${independent.size} sessões. Você pode experimentar sem o modelo e pedir apoio a qualquer momento.`};
  if (completed.some(e => e.support === 'assisted'))
    return {mode: 'model', reason: 'Você usou apoio nesta palavra. O modelo continua disponível para explorar novamente.'};
  return {mode: 'model', reason: 'Vamos explorar com o modelo disponível. Ainda não há evidências em sessões diferentes para sugerir outro apoio.'};
}
export function completion(wordId, sessionId, usedSupport) {
  return {wordId, sessionId, support: usedSupport ? 'assisted' : 'independent', outcome: 'completed'};
}
export function matchesWord(letters, word) { return letters.join('').normalize('NFC') === word.normalize('NFC'); }
