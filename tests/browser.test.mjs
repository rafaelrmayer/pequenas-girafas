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
    for (const id of ['dark', 'reduced', 'lowercase']) {
      const setting = page.locator(`#${id}`);
      await setting.press('Space');
      assert.equal(await setting.isChecked(), true);
    }
    await page.waitForFunction(()=>document.body.classList.contains('dark')&&document.body.classList.contains('reduced'));
    assert.equal(await page.locator('#slots').textContent(), 'água');
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
    await page.waitForFunction(async () => {
      const {load} = await import('/storage/store.mjs');
      return (await load()).settings.adapt === false;
    });
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

test('touch adds and removes letters, and drag starts without waiting on mobile', async () => {
  const {browser,context,page,failures} = await setup({viewport:{width:390,height:844}, hasTouch:true});
  try {
    await page.locator('#word').selectOption('agua');
    const source = page.getByRole('button',{name:'Adicionar Á',exact:true});
    const target = page.locator('#slots [data-slot="0"]');
    await page.locator('#letter-play').evaluate(node => node.scrollIntoView({block:'center'}));
    const scroll = await page.evaluate(() => scrollY);
    await source.tap();
    assert.equal(await target.textContent(),'Á');
    await target.tap();
    assert.equal(await target.textContent(),'·');
    assert.equal(await page.evaluate(() => scrollY),scroll);

    if (browserEngine === chromium) {
      const cdp = await context.newCDPSession(page);
      const point = async locator => {
        const {x,y,width,height} = await locator.boundingBox();
        return {x:x+width/2, y:y+height/2};
      };
      const touch = (type,...touchPoints) => cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
      const start = await point(source);
      const end = await point(target);
      await touch('touchStart',start);
      await touch('touchMove',end);
      assert.equal(await page.locator('.letter-drag-preview').textContent(),'Á');
      assert.equal(await target.evaluate(node => node.classList.contains('drop-target')),true);
      await touch('touchCancel');
      assert.equal(await target.textContent(),'·');
      assert.equal(await page.locator('.letter-drag-preview').count(),0);

      await touch('touchStart',start);
      await touch('touchMove',{x:4,y:start.y});
      await touch('touchEnd');
      assert.equal(await target.textContent(),'·');

      await touch('touchStart',start);
      await touch('touchMove',end);
      await touch('touchEnd');
      await page.waitForFunction(() => document.querySelector('#slots [data-slot="0"]').textContent === 'Á');
      assert.equal(await page.locator('.letter-drag-preview').count(),0);
    } else {
      await source.tap();
    }
    assert.equal(await source.isDisabled(),true);
    for (const [index, letter] of [...'GUA'].entries()) {
      await page.getByRole('button',{name:`Adicionar ${letter}`,exact:true}).tap();
      await page.waitForFunction(([slot, value]) =>
        document.querySelector(`#slots [data-slot="${slot}"]`).textContent === value,
      [index + 1, letter], {timeout:2000});
    }
    await page.locator('#check').tap();
    await page.locator('#repeat').waitFor({state:'visible'});
    await page.locator('#word').selectOption('caranguejo');
    await page.setViewportSize({width:320,height:700});
    await page.locator('.activity-grid').scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth));
    assert.ok(await page.locator('#letter-play button').evaluateAll(buttons =>
      buttons.every(button => button.getBoundingClientRect().width >= 44)
    ));
    await page.screenshot({path:'test-results/activities-mobile.png',fullPage:true});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('optional advice preserves a round when ignored, follows explicit preferences and can be disabled', async () => {
  const {browser,page,failures,network} = await setup();
  try {
    assert.match(await page.locator('#adaptive-suggestions').textContent(),/Falta de registro não é dificuldade/);
    assert.match(await page.locator('#semantic-note').textContent(),/realiza a ação NADAR/);
    await page.getByRole('button',{name:'Adicionar P',exact:true}).click();
    await page.locator('#ignore-advice').click();
    assert.equal(await page.locator('#slots [data-slot="0"]').textContent(),'P');
    assert.equal(await page.locator('#adaptive-suggestions button').count(),0);
    assert.match(await page.locator('#adaptive-status').textContent(),/Continue por aqui/);
    await page.locator('#adult-title').click();
    await page.locator('#category-interest').selectOption('animal');
    await page.locator('#exploration-goal').selectOption('new');
    await page.locator('#preferred-activity').selectOption('missing');
    assert.equal(await page.locator('#recommendations button').first().locator('strong').textContent(),'POLVO');
    const suggestion=page.locator('#adaptive-suggestions button[data-action="new_word"]');
    assert.equal(await suggestion.getAttribute('data-word-id'),'polvo');
    await suggestion.click();
    assert.equal(await page.locator('#word').inputValue(),'polvo');
    assert.equal(await page.locator('input[name="activity"][value="missing"]').isChecked(),true);
    assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
    await page.locator('#adapt').uncheck();
    assert.equal(await page.locator('#adaptive-suggestions button').count(),0);
    assert.equal(await page.locator('#word option').count(),7);
    assert.equal(await page.locator('#recommendations button').count(),6);
    await page.waitForFunction(() => new Promise(resolve=>{
      const request=indexedDB.open('pequenas-girafas-v1',1);
      request.onsuccess=()=>{const db=request.result;const read=db.transaction('local','readonly').objectStore('local').get('state');read.onsuccess=()=>{db.close();resolve(read.result?.settings.adapt===false && read.result?.settings.preferredActivity==='missing');};};
    }));
    await page.reload();await page.locator('#experience').waitFor({state:'visible'});
    assert.equal(await page.locator('#category-interest').inputValue(),'animal');
    assert.match(await page.locator('#adaptive-status').textContent(),/Personalização desligada/);
    assert.equal(network.filter(request=>request.method!=='GET').length,0);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('completed evidence records only day and presentation; revisits preserve legacy unknown dates', async () => {
  const {browser,page,failures} = await setup();
  try {
    await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
    await page.locator('input[value="memory"]').check();await construct(page,'PEIXE');
    const first=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events[0];});
    assert.match(first.day,/^\d{4}-\d{2}-\d{2}$/);assert.equal(first.contextId,'build:upper:image-v1');
    assert.equal(first.hintUsed,false);assert.equal(first.modelUsed,false);assert.equal(first.audioRequested,false);
    assert.ok(!('responseTime' in first) && !('timestamp' in first));
    await page.reload();await page.locator('#experience').waitFor({state:'visible'});
    await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
    await page.locator('input[value="memory"]').check();await construct(page,'PEIXE');
    assert.match(await page.locator('#skill-evidence [data-activity="build"]').textContent(),/2 sessões, 1 dia local/);
    assert.match(await page.locator('#adapt-reason').textContent(),/não comprova retenção/);
    await page.evaluate(async()=>{
      const store=await import('/storage/store.mjs');
      await store.record({wordId:'mar',sessionId:'legacy',support:'assisted',outcome:'completed'});
      await store.record({wordId:'agua',sessionId:'past',activity:'match',support:'independent',outcome:'completed',day:'2020-01-01',contextId:'match:upper:image-v1'});
    });
    await page.reload();await page.locator('#experience').waitFor({state:'visible'});
    const review=page.locator('#adaptive-suggestions button[data-action="review"]');
    assert.equal(await review.getAttribute('data-word-id'),'agua');
    assert.match(await review.locator('..').textContent(),/não significa.*esquecimento/);
    await review.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#word').inputValue(),'agua');
    assert.equal(await page.locator('input[name="activity"][value="match"]').isChecked(),true);
    await page.locator('#word').selectOption('mar');
    assert.match(await page.locator('#skill-evidence [data-activity="build"]').textContent(),/1 registro sem data/);
    const legacy=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.find(e=>e.sessionId==='legacy');});
    assert.equal(legacy.day,undefined);
    await page.locator('#adult-title').click();
    await page.screenshot({path:'test-results/adaptive-evidence.png',fullPage:true});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

async function selectImage(page, id) {
  const options = page.locator('#picture-options');
  if (await options.getAttribute('open') === null) await options.locator('summary').click();
  await page.locator('#presentation-select').selectOption(id);
}

test('visual choice preserves the word and in-progress letters, records mixed rounds and accepts optional image revisits', async () => {
  const {browser,page,failures} = await setup();
  try {
    await page.evaluate(()=>{
      window.visualPlayCount=0;const play=HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play=function(){window.visualPlayCount++;return play.call(this);};
    });
    assert.match(await page.locator('#image-status').textContent(),/Imagem 1 de 3/);
    await selectImage(page, 'image-v2');
    assert.equal(await page.locator('#word').inputValue(),'peixe');
    assert.match(await page.locator('#picture').getAttribute('src'),/peixe-azul/);
    assert.equal(await page.evaluate(()=>window.visualPlayCount),0);
    await construct(page,'PEIXE');
    let record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.deepEqual(record.visualIds,['image-v2']);assert.equal(record.contextId,'build:upper:image-v2');
    const suggestion=page.locator('#adaptive-suggestions button[data-action="new_image"]');
    const image=await suggestion.getAttribute('data-image-id');assert.notEqual(image,'image-v2');
    await suggestion.focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('#word').inputValue(),'peixe');
    assert.equal(await page.locator('#presentation-select').inputValue(),image);
    assert.equal(await page.evaluate(()=>window.visualPlayCount),1);
    await selectImage(page, 'image-v3');
    await page.getByRole('button',{name:'Adicionar P',exact:true}).click();
    await selectImage(page, 'image-v1');
    assert.equal(await page.locator('#slots [data-slot="0"]').textContent(),'P');
    assert.equal(await page.evaluate(()=>window.visualPlayCount),1);
    await construct(page,'EIXE');
    record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.deepEqual(record.visualIds,['image-v3','image-v1']);assert.match(record.contextId,/image-mixed/);
    assert.match(await page.locator('#visual-evidence-note').textContent(),/1 rodada com troca/);
    await page.locator('#word').selectOption('mar');
    assert.equal(await page.locator('#presentation-select').isDisabled(),true);
    assert.equal(await page.locator('#next-image').isDisabled(),true);
    assert.equal(await page.locator('#adaptive-suggestions button[data-action="new_image"]').count(),0);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('new illustrations decode offline and work with association and missing-letter activities', async () => {
  const {browser,context,page,failures} = await setup({viewport:{width:390,height:844}});
  try {
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);
    await page.locator('#word').selectOption('polvo');
    await selectImage(page, 'image-v3');
    await page.waitForFunction(()=>{const img=document.querySelector('#picture');return img.complete&&img.naturalWidth>0;});
    await page.locator('input[name="activity"][value="match"]').check();
    await page.locator('#match-options').getByRole('button',{name:'POLVO',exact:true}).click();
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    let record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.equal(record.activity,'match');assert.deepEqual(record.visualIds,['image-v3']);
    await page.locator('#word').selectOption('agua');
    await selectImage(page, 'image-v2');
    await page.locator('input[name="activity"][value="missing"]').check();
    await page.getByRole('button',{name:'Adicionar U',exact:true}).click();
    await page.locator('#check').click();await page.locator('#repeat').waitFor({state:'visible'});
    record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.equal(record.contextId,'missing:upper:image-v2:gap-2');
    for(const word of ['peixe','polvo','agua']) {
      await page.locator('#word').selectOption(word);
      for(const id of ['image-v1','image-v2','image-v3']) {
        await selectImage(page, id);
        await page.waitForFunction(()=>{const img=document.querySelector('#picture');return img.complete&&img.naturalWidth>0;});
        if(id!=='image-v1') await page.locator('.picture-card').screenshot({path:`test-results/visual-${word}-${id}.png`});
      }
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});
