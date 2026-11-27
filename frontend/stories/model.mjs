export const MAX_PAGES=6;
export const MAX_WORDS=12;
export const DRAWING_WIDTH=600,DRAWING_HEIGHT=400;
export function storyConfig(catalog,entries,tokens=[]){
 const ids=[...new Set(entries.map(entry=>entry.wordId))];
 return {characters:catalog.words.filter(word=>ids.includes(word.id)),scenes:catalog.words.filter(word=>['mar','praia','ceu','planeta','jardim','arvore'].includes(word.id)),phrases:entries,themes:catalog.themes,tokens};
}
export function validDrawing(value){
 if(typeof value!=='string'||value.length>1400000||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))return false;
 try{const bytes=atob(value.slice(22));if(bytes.length<45||![137,80,78,71,13,10,26,10].every((n,i)=>bytes.charCodeAt(i)===n)||bytes.slice(12,16)!=='IHDR'||bytes.slice(-8,-4)!=='IEND')return false;
  const n=offset=>[0,1,2,3].reduce((sum,i)=>sum*256+bytes.charCodeAt(offset+i),0);return n(16)===DRAWING_WIDTH&&n(20)===DRAWING_HEIGHT;
 }catch{return false;}
}
export function normalizePage(value,config){
 if(!value||!config.characters.some(item=>item.id===value.characterId)||!config.scenes.some(item=>item.id===value.sceneId))return null;
 const page={characterId:value.characterId,sceneId:value.sceneId};
 if(Array.isArray(value.tokenIds)&&value.phraseId===undefined){
  if(!value.tokenIds.length||value.tokenIds.length>MAX_WORDS||!value.tokenIds.every(id=>config.tokens.some(item=>item.id===id)))return null;page.tokenIds=[...value.tokenIds];
 }else if(value.tokenIds===undefined&&config.phrases.some(item=>item.id===value.phraseId&&item.wordId===value.characterId))page.phraseId=value.phraseId;
 else return null;
 if(value.drawing!==undefined){if(!validDrawing(value.drawing))return null;page.drawing=value.drawing;}
 return page;
}
export function normalizeStory(value,config){
 if(!value||![1,2].includes(value.version)||!Array.isArray(value.pages)||value.pages.length>MAX_PAGES)return null;
 const pages=value.pages.map(page=>normalizePage(page,config));return pages.every(Boolean)?{version:2,pages}:null;
}
export function pageText(page,config){return page.tokenIds?page.tokenIds.map(id=>config.tokens.find(token=>token.id===id)?.text||'').join(' '):config.phrases.find(item=>item.id===page.phraseId)?.text||'';}
export function narrationFor(page,config){
 const text=pageText(page,config),ready=config.phrases.find(item=>item.text===text);
 return ready?[{text:ready.text,source:'/assets/audio/'+ready.id+'.mp3'}]:(page.tokenIds||[]).map(id=>{const token=config.tokens.find(item=>item.id===id);return {text:token.text,source:'/assets/audio/'+token.audioId+'.mp3'};});
}
export function putPage(pages,value,config,index=null){
 const page=normalizePage(value,config);if(!page)return pages;
 if(index===null)return pages.length<MAX_PAGES?[...pages,page]:pages;
 if(!Number.isInteger(index)||index<0||index>=pages.length)return pages;
 return pages.map((old,i)=>i===index?page:old);
}
export function movePage(pages,index,direction){
 const target=index+direction;if(!Number.isInteger(index)||![-1,1].includes(direction)||index<0||index>=pages.length||target<0||target>=pages.length)return pages;
 const next=[...pages];[next[index],next[target]]=[next[target],next[index]];return next;
}
export function removePage(pages,index){return Number.isInteger(index)&&index>=0&&index<pages.length?pages.filter((_,i)=>i!==index):pages;}
