export function phraseRound(phrase){
 const tokens=phrase.text.normalize('NFC').split(' ').map((value,index)=>({key:String(index),value}));
 return {tokens,bank:[...tokens.slice(1),tokens[0]].reverse(),selected:[]};
}
export function addToken(round,key){
 if(!round.tokens.some(token=>token.key===key)||round.selected.includes(key))return round;
 return {...round,selected:[...round.selected,key]};
}
export function removeToken(round,key){return {...round,selected:round.selected.filter(id=>id!==key)};}
export function isComplete(round){return round.selected.length===round.tokens.length&&round.selected.every((key,index)=>round.tokens.find(token=>token.key===key)?.value===round.tokens[index].value);}
export function nextHint(round){
 const correct=round.tokens.map(token=>token.value);
 const prefix=round.selected.findIndex((key,index)=>round.tokens.find(token=>token.key===key)?.value!==correct[index]);
 const index=prefix<0?round.selected.length:prefix;
 return index<correct.length?{position:index+1,value:correct[index]}:null;
}
