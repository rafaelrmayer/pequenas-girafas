export const MAX_PAGES=6;
export function storyConfig(catalog,entries){
 const ids=[...new Set(entries.map(entry=>entry.wordId))];
 return {characters:catalog.words.filter(word=>ids.includes(word.id)),scenes:catalog.words.filter(word=>['mar','praia','ceu','planeta','jardim','arvore'].includes(word.id)),phrases:entries,themes:catalog.themes};
}
export function normalizePage(value,config){
 if(!value||!config.characters.some(item=>item.id===value.characterId)||!config.scenes.some(item=>item.id===value.sceneId)||!config.phrases.some(item=>item.id===value.phraseId&&item.wordId===value.characterId))return null;
 return {characterId:value.characterId,sceneId:value.sceneId,phraseId:value.phraseId};
}
export function normalizeStory(value,config){
 if(!value||value.version!==1||!Array.isArray(value.pages)||value.pages.length>MAX_PAGES)return null;
 const pages=value.pages.map(page=>normalizePage(page,config));return pages.every(Boolean)?{version:1,pages}:null;
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
