import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium, firefox} from 'playwright';
const browserEngine = process.env.TEST_BROWSER === 'firefox' ? firefox : chromium;
const URL = process.env.TEST_URL || 'http://127.0.0.1:8000';
async function setup(options = {}) {
  const browser = await browserEngine.launch();
  const context = await browser.newContext({...options, serviceWorkers:'allow'});
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', e => failures.push(e.message));
  const network = [];
  page.on('request', request => network.push({url:request.url(), method:request.method(), body:request.postData()}));
  await page.goto(URL);
  await page.locator('#experience').waitFor({state:'visible'});
  return {browser,context,page,failures,network};
}
async function construct(page, value) {
  for (const char of value) await page.getByRole('button',{name:`Adicionar ${char}`,exact:true}).and(page.locator(':enabled')).first().click();
  await page.locator('#check').click();
  await page.locator('#repeat').waitFor({state:'visible'});
}
test('PEIXE with duplicate letters, hint, persistence, backup and explicit deletion', async () => {
  const {browser,page,failures,network} = await setup();
  try {
    await construct(page,'PEIXE');
    assert.match(await page.locator('#feedback').innerText(),/Você construiu PEIXE/);
    await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/PEIXE: 1 construções/);
    await page.locator('#adult-title').click();
    const download = page.waitForEvent('download'); await page.locator('#export').click();
    assert.equal((await download).suggestedFilename(),'pequenas-girafas-copia-local.json');
    await page.locator('#delete').click(); await page.locator('#cancel-delete').click();
    assert.match(await page.locator('#progress').textContent(),/PEIXE: 1/);
    await page.locator('#delete').click(); await page.locator('#confirm-delete').click();
    await page.waitForFunction(()=>document.querySelector('#data-feedback').textContent.includes('apagados'));
    await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
    assert.equal(network.filter(r=>r.method!=='GET').length,0);
    assert.ok(network.every(r=>new globalThis.URL(r.url).origin===URL));
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
test('keyboard and hint are sufficient; settings, accent and mobile layout', async () => {
  const {browser,page,failures} = await setup({viewport:{width:390,height:844}});
  try {
    await page.locator('#word').selectOption('agua');
    await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
    await page.locator('input[value="memory"]').check();
    await page.locator('#hint').focus(); await page.keyboard.press('Enter');
    assert.match(await page.locator('#feedback').innerText(),/letra Á/);
    for (const char of 'GUA') {
      await page.getByRole('button',{name:`Adicionar ${char}`,exact:true}).focus(); await page.keyboard.press('Enter');
    }
    await page.locator('#check').focus(); await page.keyboard.press('Enter');
    await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/ÁGUA: 1 construções; 1 com apoio/);
    await page.locator('#dark').check(); await page.locator('#reduced').check(); await page.locator('#lowercase').check();
    await page.waitForFunction(()=>document.body.classList.contains('dark')&&document.body.classList.contains('reduced'));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const contrast = await page.evaluate(() => {
      const luminance = color => {
        const [r,g,b] = color.match(/[\d.]+/g).slice(0,3).map(value => {
          const v = Number(value)/255; return v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4;
        });
        return .2126*r+.7152*g+.0722*b;
      };
      const fg = luminance(getComputedStyle(document.querySelector('#activity-title')).color);
      const bg = luminance(getComputedStyle(document.querySelector('.workspace')).backgroundColor);
      return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
    });
    assert.ok(contrast >= 4.5, `Dark heading contrast ${contrast}`);
    await page.screenshot({path:'test-results/girafas-mobile.png',fullPage:true});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
test('independent evidence across sessions recommends optional memory mode, never blocks words', async () => {
  const {browser,page,failures} = await setup();
  try {
    for(let round=0;round<2;round++) {
      await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
      await page.locator('input[value="memory"]').check(); await construct(page,'PEIXE');
      await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    }
    assert.equal(await page.locator('input[value="memory"]').isChecked(),true);
    assert.match(await page.locator('#adapt-reason').textContent(),/2 sessões/);
    assert.equal(await page.locator('#word option').count(),7);
    assert.equal(await page.locator('#recommendations button').count(),6);
    await page.locator('#adult-title').click(); await page.locator('#adapt').uncheck();
    await page.waitForFunction(()=>document.querySelector('#adapt-reason').textContent.includes('desligada'));
    await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    assert.equal(await page.locator('input[value="model"]').isChecked(),true);
    assert.deepEqual(failures,[]);
    await page.screenshot({path:'test-results/girafas-desktop.png',fullPage:true});
  } finally {await browser.close();}
});
test('offline reload still supports word activity after caching', async () => {
  const {browser,context,page,failures} = await setup();
  try {
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true); await page.reload();
    await page.locator('#experience').waitFor({state:'visible'}); await construct(page,'PEIXE');
    assert.match(await page.locator('#feedback').textContent(),/Você construiu/);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
test('bundled audio works even when storage and browser voices are unavailable', async () => {
  const browser = await browserEngine.launch(); const context = await browser.newContext();
  try {
    await context.addInitScript(()=>{
      Object.defineProperty(window,'indexedDB',{value:{open(){throw new Error('blocked');}}});
      Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}}});
    });
    const page = await context.newPage(); await page.goto(URL); await page.locator('#experience').waitFor({state:'visible'});
    await page.locator('#listen').click();
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    await construct(page,'PEIXE');
    assert.match(await page.locator('#feedback').textContent(),/não pôde ser salvo/);
    assert.match(await page.locator('#storage-status').textContent(),/apenas na memória/);
  } finally {await browser.close();}
});

test('word and letter audio decode offline and zero volume gives feedback beside the button', async () => {
  const {browser,context,page,failures} = await setup();
  try {
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    await page.locator('#listen').click();
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    await page.locator('#listen-letter').click();
    await page.waitForFunction(()=>document.querySelector('#letter-audio-status').textContent==='Leitura concluída.');
    await page.locator('#volume').focus(); await page.keyboard.press('Home');
    await page.locator('#listen').click();
    assert.match(await page.locator('#word-audio-status').textContent(),/volume.*zero/);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('confirmation reads only correct words; preference persists and manual playback stays available', async () => {
  const browser = await browserEngine.launch(); const context = await browser.newContext();
  try {
    await context.addInitScript(() => {
      window.playedAudio = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() {window.playedAudio.push(this.src); return play.call(this);};
    });
    const page = await context.newPage(); await page.goto(URL);
    await page.locator('#experience').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>window.playedAudio.length),0);
    await page.locator('#check').click(); await page.locator('#hint').click();
    assert.equal(await page.evaluate(()=>window.playedAudio.length),0);
    await page.locator('#clear').click(); await construct(page,'PEIXE');
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
    await page.locator('#on-success-audio').uncheck();
    await page.waitForFunction(() => new Promise(resolve => {
      const request = indexedDB.open('pequenas-girafas-v1', 1);
      request.onsuccess = () => {
        const db = request.result;
        const read = db.transaction('local','readonly').objectStore('local').get('state');
        read.onsuccess = () => {db.close(); resolve(read.result?.settings.onSuccessAudio === false);};
      };
    }));
    await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    assert.equal(await page.locator('#on-success-audio').isChecked(),false);
    await construct(page,'PEIXE');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),0);
    await page.locator('#listen').click();
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
    await page.locator('#on-success-audio').check();
    await page.locator('#volume').focus(); await page.keyboard.press('Home');
    await page.locator('#repeat').click(); await construct(page,'PEIXE');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
  } finally {await browser.close();}
});

test('association and missing-letter activities remain freely selectable, keyboard-accessible and separately recorded', async () => {
  const {browser,page,failures,network} = await setup();
  try {
    await page.locator('input[name="activity"][value="match"]').check();
    assert.equal(await page.locator('#match-options button').count(),3);
    assert.ok(!(await page.locator('#word-model').textContent()).includes('PEIXE'));
    await page.locator('#match-options button').filter({hasText:'MAR'}).click();
    await page.locator('#check').click();
    assert.equal(await page.locator('#repeat').isVisible(),false);
    assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
    await page.locator('#hint').click();
    assert.equal(await page.locator('#word-model').textContent(),'PEIXE');
    await page.locator('#match-options button').filter({hasText:'PEIXE'}).focus(); await page.keyboard.press('Enter');
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/Associar imagem e palavra: 1/);
    assert.ok(!(await page.locator('#progress').textContent()).includes('1 construções'));
    await page.locator('input[name="activity"][value="missing"]').check();
    await page.locator('#word').selectOption('agua');
    assert.equal(await page.locator('#slots .fixed').count(),3);
    await page.getByRole('button',{name:'Adicionar A',exact:true}).click();
    await page.locator('#check').click();assert.equal(await page.locator('#repeat').isVisible(),false);
    await page.getByRole('button',{name:'Adicionar U',exact:true}).focus();await page.keyboard.press('Enter');
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#feedback').textContent(),/Você completou ÁGUA/);
    assert.match(await page.locator('#progress').textContent(),/Completar uma letra: 1/);
    await page.reload();await page.locator('#experience').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/Associar imagem e palavra: 1/);
    assert.match(await page.locator('#progress').textContent(),/Completar uma letra: 1/);
    assert.equal(network.filter(request=>request.method!=='GET').length,0);
    assert.deepEqual(failures,[]);
    await page.screenshot({path:'test-results/activities-desktop.png',fullPage:true});
  } finally {await browser.close();}
});

test('desktop drag places letters out of order, swaps occupied spaces and leaves canceled drops unchanged', async () => {
  const {browser,page,failures} = await setup();
  try {
    const tile = key=>page.locator(`#letter-bank [data-letter-key="${key}"]`);
    const slot = index=>page.locator(`#slots [data-slot="${index}"]`);
    await tile('2').dragTo(slot(2));
    assert.equal(await slot(2).textContent(),'I');assert.equal(await slot(0).textContent(),'·');
    await tile('0').dragTo(page.locator('#task-title'));
    assert.equal(await tile('0').isDisabled(),false);
    await tile('0').dragTo(slot(0));
    await slot(2).dragTo(slot(0));
    assert.equal(await slot(0).textContent(),'I');assert.equal(await slot(2).textContent(),'P');
    await slot(0).dragTo(slot(2));
    for(const index of [1,3,4]) await tile(String(index)).dragTo(slot(index));
    assert.equal((await page.locator('#slots').textContent()).trim(),'PEIXE');
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#feedback').textContent(),/Você construiu PEIXE/);
    await page.locator('input[name="activity"][value="missing"]').check();
    const wrong = page.getByRole('button',{name:'Adicionar A',exact:true});
    await wrong.dragTo(slot(0));assert.equal(await slot(0).textContent(),'P');
    const right = page.getByRole('button',{name:'Adicionar I',exact:true});
    await right.dragTo(slot(2));
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#feedback').textContent(),/Você completou PEIXE/);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('touch hold, drop and cancellation preserve accented letters on mobile', async () => {
  const {browser,page,failures} = await setup({viewport:{width:390,height:844}});
  try {
    await page.locator('#word').selectOption('agua');
    const source=page.getByRole('button',{name:'Adicionar Á',exact:true});
    await source.scrollIntoViewIfNeeded();
    const start=await source.boundingBox();
    await source.dispatchEvent('pointerdown',{pointerId:42,pointerType:'touch',clientX:start.x+10,clientY:start.y+10});
    await page.waitForFunction(()=>document.querySelector('.letter-dragging'));
    await source.dispatchEvent('pointercancel',{pointerId:42,pointerType:'touch'});
    assert.equal(await source.isDisabled(),false);
    await source.dispatchEvent('pointerdown',{pointerId:43,pointerType:'touch',clientX:start.x+10,clientY:start.y+10});
    await page.waitForFunction(()=>document.querySelector('.letter-dragging'));
    const target=page.locator('#slots [data-slot="0"]');await target.scrollIntoViewIfNeeded();
    const box=await target.boundingBox();
    await source.dispatchEvent('pointermove',{pointerId:43,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+box.height/2});
    await source.dispatchEvent('pointerup',{pointerId:43,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+box.height/2});
    assert.equal(await target.textContent(),'Á');
    assert.equal(await page.getByRole('button',{name:'Adicionar Á',exact:true}).isDisabled(),true);
    for(const letter of 'GUA') await page.getByRole('button',{name:`Adicionar ${letter}`,exact:true}).click();
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    await page.locator('input[name="activity"][value="missing"]').check();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:'test-results/activities-mobile.png',fullPage:true});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
