import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {phraseEntries} from '../frontend/phrases/records.mjs';
import {MAX_PAGES,storyConfig,normalizePage,normalizeStory,putPage,movePage,removePage} from '../frontend/stories/model.mjs';
const read=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url)));
const themes=['fundo-do-mar','astronomia','natureza','frutas'].map(id=>read('knowledge/vocabulary/'+id+'.json'));
const catalog={themes:themes.map(item=>item.theme),words:themes.flatMap(item=>item.words.map(word=>({...word,themeId:item.theme.id})))};
const config=storyConfig(catalog,phraseEntries(read('frontend/phrases/catalog.json'),read('frontend/phrases/continuations.json')));
const page={characterId:'peixe',sceneId:'mar',phraseId:'frase-peixe'};
test('story resources reuse the eight subjects, six scenes and 24 existing recordings',()=>{
 assert.equal(config.characters.length,8);assert.equal(config.scenes.length,6);assert.equal(config.phrases.length,24);assert.equal(MAX_PAGES,6);assert.equal(new Set(config.characters.map(item=>item.themeId)).size,4);
});
test('only catalog choices are saved; free text and extra metadata are omitted',()=>{
 assert.deepEqual(normalizePage({...page,name:'private',text:'free',duration:100},config),page);assert.equal(normalizePage({...page,characterId:'unknown'},config),null);assert.equal(normalizePage({...page,sceneId:'unknown'},config),null);assert.equal(normalizePage({...page,phraseId:'frase-lua'},config),null);
 assert.equal(normalizeStory({version:2,pages:[page]},config),null);assert.equal(normalizeStory({version:1,pages:'unknown'},config),null);assert.equal(normalizeStory({version:1,pages:[{...page,phraseId:'unknown'}]},config),null);assert.equal(normalizeStory({version:1,pages:Array(7).fill(page)},config),null);
});
test('pages are freely repeatable, bounded at six and editable at the limit',()=>{
 let pages=[];for(let i=0;i<6;i++)pages=putPage(pages,page,config);assert.equal(pages.length,6);assert.equal(putPage(pages,page,config),pages);
 const updated=putPage(pages,{...page,sceneId:'ceu'},config,5);assert.equal(updated.length,6);assert.equal(updated[5].sceneId,'ceu');assert.equal(pages[5].sceneId,'mar');assert.equal(putPage(pages,page,config,-1),pages);assert.equal(putPage(pages,{...page,phraseId:'unknown'},config),pages);
});
test('move and remove preserve source pages, with stable boundaries and no scoring',()=>{
 const pages=[page,{characterId:'lua',sceneId:'ceu',phraseId:'frase-lua'}];const before=structuredClone(pages);const moved=movePage(pages,0,1);assert.equal(moved[0].characterId,'lua');assert.deepEqual(movePage(moved,1,-1),pages);assert.equal(movePage(pages,0,-1),pages);assert.equal(movePage(pages,0,2),pages);assert.equal(movePage(pages,NaN,1),pages);assert.deepEqual(removePage(pages,0),[pages[1]]);assert.equal(removePage(pages,5),pages);assert.deepEqual(pages,before);
});
test('saved stories round-trip as IDs without mutating their original draft',()=>{
 const source={version:1,pages:[page,{characterId:'maca',sceneId:'jardim',phraseId:'frase-maca-2'}],title:'private'};const before=structuredClone(source);const normalized=normalizeStory(source,config);assert.deepEqual(normalizeStory(JSON.parse(JSON.stringify(normalized)),config),normalized);assert.equal(Object.hasOwn(normalized,'title'),false);assert.deepEqual(source,before);assert.deepEqual(normalizeStory({version:1,pages:[]},config),{version:1,pages:[]});
});
