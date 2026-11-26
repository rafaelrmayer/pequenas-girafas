export const ACTIVITIES = {build:'Montar a palavra', missing:'Completar uma letra', match:'Associar imagem e palavra'};
export function lettersRound(word, activity = 'build', round = 0) {
  const letters = Array.from(word.normalize('NFC'));
  if (activity === 'missing') {
    const gap = (Math.floor(letters.length/2) + round) % letters.length;
    const choices = [letters[gap], ...Array.from('AMSOEPIXLU').filter(value=>value!==letters[gap]).slice(0,3)];
    const bank = choices.map((value,key)=>({value,key:`choice-${key}`}));
    return {bank:[...bank.slice(1),bank[0]], slots:letters.map((value,index)=>index===gap?null:{value,key:`fixed-${index}`}), locked:letters.map((_,index)=>index!==gap), gap};
  }
  const bank = letters.map((value,key)=>({value,key:String(key)}));
  return {bank:[...bank.slice(2),...bank.slice(0,2)].reverse(), slots:letters.map(()=>null), locked:letters.map(()=>false), gap:null};
}
export function placeLetter(slots, bank, key, index, locked = []) {
  if (!Number.isInteger(index) || index<0 || index>=slots.length || locked[index]) return slots;
  const from = slots.findIndex(entry=>entry?.key===key);
  if (from>=0 && locked[from]) return slots;
  const entry = from>=0 ? slots[from] : bank.find(item=>item.key===key);
  if (!entry || from===index) return slots;
  const next = [...slots];
  if (from>=0) next[from] = next[index];
  next[index] = entry;
  return next;
}
export function associationChoices(catalog, wordId, round = 0) {
  const target = catalog.words.find(word=>word.id===wordId);
  if (!target) return [];
  const others = catalog.words.filter(word=>word.id!==wordId);
  const choices = [target, ...others.slice(0,2)];
  const shift = (catalog.words.indexOf(target)+round+1)%choices.length;
  return [...choices.slice(shift),...choices.slice(0,shift)];
}
