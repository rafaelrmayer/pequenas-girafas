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
async function go(page,area){
 const panel={atividades:'#area-atividades',historias:'#historias',apoios:'#configuracoes',responsaveis:'#responsaveis'}[area];
 if(await page.locator(panel).isHidden())await page.locator('#nav-'+area).click();
}
async function inArea(page,area,action){await go(page,area);return action();}
async function construct(page, value) {
  await go(page,'atividades');
  for (const char of value) await inArea(page,'atividades',()=>page.getByRole('button',{name:`Adicionar ${char}`,exact:true}).and(page.locator(':enabled')).first().click());
  await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
}
test('PEIXE with duplicate letters, hint, persistence, backup and explicit deletion', async () => {
  const {browser,page,failures,network} = await setup();
  try {
    await construct(page,'PEIXE');
    assert.match(await page.locator('#feedback').innerText(),/Você construiu PEIXE/);
    await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/PEIXE: 1 construções/);
    await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
    const download = page.waitForEvent('download'); await inArea(page,'responsaveis',()=>page.locator('#export').click());
    assert.equal((await download).suggestedFilename(),'pequenas-girafas-copia-local.json');
    await inArea(page,'responsaveis',()=>page.locator('#delete').click()); await inArea(page,'responsaveis',()=>page.locator('#cancel-delete').click());
    assert.match(await page.locator('#progress').textContent(),/PEIXE: 1/);
    await inArea(page,'responsaveis',()=>page.locator('#delete').click()); await inArea(page,'responsaveis',()=>page.locator('#confirm-delete').click());
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
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('agua'));
    await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
    await inArea(page,'atividades',()=>page.locator('input[value="memory"]').check());
    await inArea(page,'atividades',()=>page.locator('#hint').focus()); await page.keyboard.press('Enter');
    assert.match(await page.locator('#feedback').innerText(),/letra Á/);
    for (const char of 'GUA') {
      await inArea(page,'atividades',()=>page.getByRole('button',{name:`Adicionar ${char}`,exact:true}).focus()); await page.keyboard.press('Enter');
    }
    await inArea(page,'atividades',()=>page.locator('#check').focus()); await page.keyboard.press('Enter');
    await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/ÁGUA: 1 construções; 1 com apoio/);
    await go(page,'apoios');
    for (const id of ['dark', 'reduced', 'lowercase']) {
      const setting = page.locator(`#${id}`);
      await setting.focus();await setting.press('Space');
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
      await inArea(page,'atividades',()=>page.locator('input[value="memory"]').check()); await construct(page,'PEIXE');
      await page.reload(); await page.locator('#experience').waitFor({state:'visible'});
    }
    assert.equal(await page.locator('input[value="memory"]').isChecked(),true);
    assert.match(await page.locator('#adapt-reason').textContent(),/2 sessões/);
    assert.equal(await page.locator('#word option').count(),7);
    assert.equal(await page.locator('#recommendations button').count(),6);
    await inArea(page,'responsaveis',()=>page.locator('#adult-title').click()); await inArea(page,'responsaveis',()=>page.locator('#adapt').uncheck());
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
    await inArea(page,'atividades',()=>page.locator('#listen').click());
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
    await inArea(page,'atividades',()=>page.locator('#listen').click());
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    await inArea(page,'atividades',()=>page.locator('#listen-letter').click());
    await page.waitForFunction(()=>document.querySelector('#letter-audio-status').textContent==='Leitura concluída.');
    await inArea(page,'apoios',()=>page.locator('#volume').focus()); await page.keyboard.press('Home');
    await inArea(page,'atividades',()=>page.locator('#listen').click());
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
    await inArea(page,'atividades',()=>page.locator('#check').click()); await inArea(page,'atividades',()=>page.locator('#hint').click());
    assert.equal(await page.evaluate(()=>window.playedAudio.length),0);
    await inArea(page,'atividades',()=>page.locator('#clear').click()); await construct(page,'PEIXE');
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
    await inArea(page,'apoios',()=>page.locator('#on-success-audio').uncheck());
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
    await inArea(page,'atividades',()=>page.locator('#listen').click());
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
    await inArea(page,'apoios',()=>page.locator('#on-success-audio').check());
    await inArea(page,'apoios',()=>page.locator('#volume').focus()); await page.keyboard.press('Home');
    await inArea(page,'atividades',()=>page.locator('#repeat').click()); await construct(page,'PEIXE');
    assert.equal(await page.evaluate(()=>window.playedAudio.length),1);
  } finally {await browser.close();}
});

test('association and missing-letter activities remain freely selectable, keyboard-accessible and separately recorded', async () => {
  const {browser,page,failures,network} = await setup();
  try {
    await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="match"]').check());
    assert.equal(await page.locator('#match-options button').count(),3);
    assert.ok(!(await page.locator('#word-model').textContent()).includes('PEIXE'));
    await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'MAR'}).click());
    await inArea(page,'atividades',()=>page.locator('#check').click());
    assert.equal(await page.locator('#repeat').isVisible(),false);
    assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
    await inArea(page,'atividades',()=>page.locator('#hint').click());
    assert.equal(await page.locator('#word-model').textContent(),'PEIXE');
    await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'PEIXE'}).focus()); await page.keyboard.press('Enter');
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#progress').textContent(),/Associar imagem e palavra: 1/);
    assert.ok(!(await page.locator('#progress').textContent()).includes('1 construções'));
    const missing = page.locator('input[name="activity"][value="missing"]');
    await missing.press('Space');
    assert.equal(await missing.isChecked(), true);
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('agua'));
    assert.equal(await page.locator('#slots .fixed').count(),3);
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar A',exact:true}).click());
    await inArea(page,'atividades',()=>page.locator('#check').click());assert.equal(await page.locator('#repeat').isVisible(),false);
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar U',exact:true}).focus());await page.keyboard.press('Enter');
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
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
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#feedback').textContent(),/Você construiu PEIXE/);
    await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="missing"]').check());
    const wrong = page.getByRole('button',{name:'Adicionar A',exact:true});
    await wrong.dragTo(slot(0));assert.equal(await slot(0).textContent(),'P');
    const right = page.getByRole('button',{name:'Adicionar I',exact:true});
    await right.dragTo(slot(2));
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
    assert.match(await page.locator('#feedback').textContent(),/Você completou PEIXE/);
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('touch adds and removes letters, and drag starts without waiting on mobile', async () => {
  const {browser,context,page,failures} = await setup({viewport:{width:390,height:844}, hasTouch:true});
  try {
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('agua'));
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
      await inArea(page,'atividades',()=>page.getByRole('button',{name:`Adicionar ${letter}`,exact:true}).tap());
      await page.waitForFunction(([slot, value]) =>
        document.querySelector(`#slots [data-slot="${slot}"]`).textContent === value,
      [index + 1, letter], {timeout:2000});
    }
    await inArea(page,'atividades',()=>page.locator('#check').tap());
    await page.locator('#repeat').waitFor({state:'visible'});
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('caranguejo'));
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
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar P',exact:true}).click());
    await inArea(page,'atividades',()=>page.locator('#ignore-advice').click());
    assert.equal(await page.locator('#slots [data-slot="0"]').textContent(),'P');
    assert.equal(await page.locator('#adaptive-suggestions button').count(),0);
    assert.match(await page.locator('#adaptive-status').textContent(),/Continue por aqui/);
    await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
    await inArea(page,'responsaveis',()=>page.locator('#category-interest').selectOption('animal'));
    await inArea(page,'responsaveis',()=>page.locator('#exploration-goal').selectOption('new'));
    await inArea(page,'responsaveis',()=>page.locator('#preferred-activity').selectOption('missing'));
    assert.equal(await page.locator('#recommendations button').first().locator('strong').textContent(),'POLVO');
    const suggestion=page.locator('#adaptive-suggestions button[data-action="new_word"]');
    assert.equal(await suggestion.getAttribute('data-word-id'),'polvo');
    await inArea(page,'atividades',()=>suggestion.click());
    assert.equal(await page.locator('#word').inputValue(),'polvo');
    assert.equal(await page.locator('input[name="activity"][value="missing"]').isChecked(),true);
    assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
    await inArea(page,'responsaveis',()=>page.locator('#adapt').uncheck());
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
    await inArea(page,'atividades',()=>page.locator('input[value="memory"]').check());await construct(page,'PEIXE');
    const first=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events[0];});
    assert.match(first.day,/^\d{4}-\d{2}-\d{2}$/);assert.equal(first.contextId,'build:upper:image-v1');
    assert.equal(first.hintUsed,false);assert.equal(first.modelUsed,false);assert.equal(first.audioRequested,false);
    assert.ok(!('responseTime' in first) && !('timestamp' in first));
    await page.reload();await page.locator('#experience').waitFor({state:'visible'});
    await page.locator('input[value="memory"]').evaluate(n=>n.closest('details').open=true);
    await inArea(page,'atividades',()=>page.locator('input[value="memory"]').check());await construct(page,'PEIXE');
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
    await inArea(page,'atividades',()=>review.focus());await page.keyboard.press('Enter');
    assert.equal(await page.locator('#word').inputValue(),'agua');
    assert.equal(await page.locator('input[name="activity"][value="match"]').isChecked(),true);
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('mar'));
    assert.match(await page.locator('#skill-evidence [data-activity="build"]').textContent(),/1 registro sem data/);
    const legacy=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.find(e=>e.sessionId==='legacy');});
    assert.equal(legacy.day,undefined);
    await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
    await page.screenshot({path:'test-results/adaptive-evidence.png',fullPage:true});
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

async function selectImage(page, id) {
  const options = page.locator('#picture-options');
  if (await options.getAttribute('open') === null) await options.locator('summary').click();
  await inArea(page,'atividades',()=>page.locator('#presentation-select').selectOption(id));
}

test('mobile illustrations stay with the letters and rotate between visits', async () => {
  const {browser,context,page,failures} = await setup({viewport:{width:390,height:740}});
  try {
    const currentImage = () => page.locator('#presentation-select').inputValue();
    const word = page.locator('#word');
    assert.equal(await currentImage(), 'image-v1');
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await context.setOffline(true);
    for (const id of ['image-v2', 'image-v3', 'image-v1']) {
      await page.reload();
      await page.locator('#experience').waitFor({state:'visible'});
      assert.equal(await currentImage(), id);
    }
    await page.locator('.activity-grid').evaluate(grid => {
      window.scrollTo(0, window.scrollY + grid.getBoundingClientRect().top + 80);
    });
    const picture = await page.locator('#picture').boundingBox();
    const letters = await page.locator('#letter-bank').boundingBox();
    assert.ok(picture.y >= 0 && picture.width >= 112);
    assert.ok(picture.y + picture.height < letters.y && letters.y + letters.height < 740);
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar P',exact:true}).click());
    assert.equal(await page.locator('#slots [data-slot="0"]').textContent(),'P');
    assert.equal(await currentImage(), 'image-v1');

    await go(page,'atividades');await word.selectOption('polvo');
    assert.equal(await currentImage(), 'image-v1');
    await go(page,'atividades');await word.selectOption('mar');
    assert.equal(await currentImage(), 'image-v1');
    await go(page,'atividades');await word.selectOption('polvo');
    assert.equal(await currentImage(), 'image-v2');
    await selectImage(page, 'image-v1');
    await go(page,'atividades');await word.selectOption('peixe');
    assert.equal(await currentImage(), 'image-v2');
    await go(page,'atividades');await word.selectOption('polvo');
    assert.equal(await currentImage(), 'image-v2');
    assert.match(await page.locator('#progress').textContent(), /Ainda não há/);

    await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
    await inArea(page,'responsaveis',()=>page.locator('#delete').click());
    await inArea(page,'responsaveis',()=>page.locator('#confirm-delete').click());
    await page.waitForFunction(() => document.querySelector('#data-feedback').textContent.includes('apagados'));
    assert.equal(await word.inputValue(), 'peixe');
    assert.equal(await currentImage(), 'image-v1');
    await go(page,'atividades');await word.selectOption('polvo');
    assert.equal(await currentImage(), 'image-v1');
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

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
    await inArea(page,'atividades',()=>suggestion.focus());await page.keyboard.press('Enter');
    assert.equal(await page.locator('#word').inputValue(),'peixe');
    assert.equal(await page.locator('#presentation-select').inputValue(),image);
    assert.equal(await page.evaluate(()=>window.visualPlayCount),1);
    await selectImage(page, 'image-v3');
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar P',exact:true}).click());
    await selectImage(page, 'image-v1');
    assert.equal(await page.locator('#slots [data-slot="0"]').textContent(),'P');
    assert.equal(await page.evaluate(()=>window.visualPlayCount),1);
    await construct(page,'EIXE');
    record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.deepEqual(record.visualIds,['image-v3','image-v1']);assert.match(record.contextId,/image-mixed/);
    assert.match(await page.locator('#visual-evidence-note').textContent(),/1 rodada com troca/);
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('mar'));
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
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('polvo'));
    await selectImage(page, 'image-v3');
    await page.waitForFunction(()=>{const img=document.querySelector('#picture');return img.complete&&img.naturalWidth>0;});
    await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="match"]').check());
    await inArea(page,'atividades',()=>page.locator('#match-options').getByRole('button',{name:'POLVO',exact:true}).click());
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
    let record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.equal(record.activity,'match');assert.deepEqual(record.visualIds,['image-v3']);
    await inArea(page,'atividades',()=>page.locator('#word').selectOption('agua'));
    await selectImage(page, 'image-v2');
    await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="missing"]').check());
    await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar U',exact:true}).click());
    await inArea(page,'atividades',()=>page.locator('#check').click());await page.locator('#repeat').waitFor({state:'visible'});
    record=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.at(-1);});
    assert.equal(record.contextId,'missing:upper:image-v2:gap-2');
    for(const word of ['peixe','polvo','agua']) {
      await inArea(page,'atividades',()=>page.locator('#word').selectOption(word));
      for(const id of ['image-v1','image-v2','image-v3']) {
        await selectImage(page, id);
        await page.waitForFunction(()=>{const img=document.querySelector('#picture');return img.complete&&img.naturalWidth>0;});
        if(id!=='image-v1') await inArea(page,'atividades',()=>page.locator('.picture-card').screenshot({path:`test-results/visual-${word}-${id}.png`}));
      }
    }
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(failures,[]);
  } finally {await browser.close();}
});

test('astronomy is freely selected, keeps both themes records and works offline with accents and local audio',async()=>{
 const {browser,context,page,failures,network}=await setup();
 try{
  await construct(page,'PEIXE');
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('PEIXE:'));
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('astronomia'));
  assert.equal(await page.locator('#activity-title').textContent(),'Astronomia');
  assert.equal(await page.locator('#word option').count(),5);
  assert.equal(await page.locator('#word').inputValue(),'lua');
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await page.waitForFunction(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).settings.themeId==='astronomia';});
  await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  assert.equal(await page.locator('#theme').inputValue(),'astronomia');
  await construct(page,'LUA');
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('LUA:'));
  assert.match(await page.locator('#progress').textContent(),/PEIXE:/);
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('ceu'));
  await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="missing"]').check());
  await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar É',exact:true}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  assert.match(await page.locator('#feedback').textContent(),/CÉU/);
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('CÉU:'));
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('planeta'));await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="match"]').check());
  await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'PLANETA'}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('PLANETA:'));
  assert.equal(await page.evaluate(async()=>{
   const ctx=new (window.AudioContext||window.webkitAudioContext)();
   try{for(const id of ['lua','sol','estrela','ceu','planeta']){
    const image=await fetch('/assets/'+id+'.svg');if(!image.ok)return false;
    const response=await fetch('/assets/audio/'+id+'.mp3');if(!response.ok)return false;
    const decoded=await ctx.decodeAudioData(await response.arrayBuffer());if(decoded.duration<=0)return false;
   }return true;}finally{await ctx.close();}
  }),true);
  await page.screenshot({path:'test-results/astronomia-desktop.png',fullPage:true});
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));
  for(const id of ['lua','sol','estrela','ceu','planeta']){
    await inArea(page,'atividades',()=>page.locator('#word').selectOption(id));await inArea(page,'atividades',()=>page.locator('#listen').click());
    await page.waitForFunction(()=>document.querySelector('#word-audio-status').textContent==='Leitura concluída.');
    await inArea(page,'atividades',()=>page.locator('#picture').screenshot({path:'test-results/astronomia-'+id+'.png'}));
  }
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('fundo-do-mar'));
  assert.equal(await page.locator('#word option').count(),7);
  assert.match(await page.locator('#progress').textContent(),/LUA:/);
  assert.equal(network.filter(request=>request.method!=='GET').length,0);
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});


test('next word cycles within the selected theme by click and keyboard without recording skipped rounds',async()=>{
 const {browser,page,failures}=await setup({viewport:{width:390,height:844}});
 try{
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('astronomia'));
  await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar L',exact:true}).click());
  await inArea(page,'atividades',()=>page.getByRole('button',{name:'Próxima palavra',exact:true}).click());
  assert.equal(await page.locator('#word').inputValue(),'sol');
  assert.match(await page.locator('#feedback').textContent(),/Próxima palavra: SOL/);
  assert.match(await page.locator('#progress').textContent(),/Ainda não há/);
  await page.keyboard.press('Enter');assert.equal(await page.locator('#word').inputValue(),'estrela');
  await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="match"]').check());
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('planeta'));await inArea(page,'atividades',()=>page.locator('#next-word').click());
  assert.equal(await page.locator('#word').inputValue(),'lua');
  assert.equal(await page.locator('input[name="activity"][value="match"]').isChecked(),true);
  await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'LUA'}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('LUA:'));
  await inArea(page,'atividades',()=>page.locator('#next-word').click());assert.equal(await page.locator('#word').inputValue(),'sol');
  assert.match(await page.locator('#progress').textContent(),/Associar imagem e palavra: 1/);
  assert.ok(!(await page.locator('#progress').textContent()).includes('SOL:'));
  const events=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events;});
  assert.equal(events.length,1);assert.equal(events[0].wordId,'lua');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(failures,[]);
  await page.screenshot({path:'test-results/proxima-palavra-mobile.png',fullPage:true});
 }finally{await browser.close();}
});


test('Nature and Fruits preserve accents, records and next-word cycles with all new audio offline',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('natureza'));
  assert.equal(await page.locator('#word option').count(),6);
  await construct(page,'FLOR');await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('FLOR:'));
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('arvore'));
  await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="missing"]').check());
  // ÁRVORE has gap index 3 in the first round.
  await inArea(page,'atividades',()=>page.getByRole('button',{name:'Adicionar O',exact:true}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('ÁRVORE:'));
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('jardim'));await inArea(page,'atividades',()=>page.locator('#next-word').click());
  assert.equal(await page.locator('#word').inputValue(),'flor');
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('frutas'));assert.equal(await page.locator('#word option').count(),6);
  await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="build"]').check());
  await construct(page,'MAÇÃ');await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('MAÇÃ:'));
  await inArea(page,'atividades',()=>page.locator('#word').selectOption('pessego'));await inArea(page,'atividades',()=>page.locator('input[name="activity"][value="match"]').check());
  await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'PÊSSEGO'}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#progress').textContent.includes('PÊSSEGO:'));
  assert.match(await page.locator('#progress').textContent(),/ÁRVORE:/);
  await inArea(page,'atividades',()=>page.locator('#next-word').click());assert.equal(await page.locator('#word').inputValue(),'maca');
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));
  await page.evaluate(()=>{
   const AudioOriginal=window.Audio;window.audioDiagnostics=[];
   window.Audio=function(source){
    const audio=new AudioOriginal(source),play=audio.play.bind(audio);
    audio.play=()=>play().catch(error=>{window.audioDiagnostics.push({source,name:error.name,message:error.message});throw error;});
    audio.addEventListener('error',()=>{if(audio.error)window.audioDiagnostics.push({source,code:audio.error.code,message:audio.error.message});});
    return audio;
   };
  });
  for(const [theme,words] of [['natureza',['flor','grama','folha','arvore','semente','jardim']],['frutas',['maca','pera','laranja','abacaxi','manga','pessego']]]){
   await inArea(page,'atividades',()=>page.locator('#theme').selectOption(theme));
   for(const id of words){
    await inArea(page,'atividades',()=>page.locator('#word').selectOption(id));await inArea(page,'atividades',()=>page.locator('#listen').click());
    try {await page.waitForFunction(()=>{const status=document.querySelector('#word-audio-status').textContent;return status==='Leitura concluída.'||status.includes('Não foi possível');});}
    catch(error){throw new Error('Áudio '+id+': '+await page.locator('#word-audio-status').textContent(),{cause:error});}
    assert.equal(await page.locator('#word-audio-status').textContent(),'Leitura concluída.','Áudio '+id+' '+JSON.stringify(await page.evaluate(()=>window.audioDiagnostics)));
    await inArea(page,'atividades',()=>page.locator('#picture').screenshot({path:'test-results/'+theme+'-'+id+'.png'}));
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:'test-results/'+theme+'-mobile.png',fullPage:true});
  }
  assert.equal(network.filter(request=>request.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});


test('optional review list preserves original activities, separates dates and updates only after completion',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.evaluate(async()=>{
   const store=await import('/storage/store.mjs');const {localDay}=await import('/ai/adaptive-learning/engine.mjs');
   const old=new Date(),future=new Date();old.setDate(old.getDate()-10);future.setDate(future.getDate()+3);
   await store.mutate(state=>({...state,settings:{...state.settings,preferredActivity:'build',reviewAfterDays:7},events:[
    {wordId:'mar',sessionId:'old',activity:'match',outcome:'completed',support:'assisted',day:localDay(old)},
    {wordId:'concha',sessionId:'legacy',activity:'build',outcome:'completed',support:'independent'},
    {wordId:'polvo',sessionId:'future',activity:'missing',outcome:'completed',support:'independent',day:localDay(future)}]}));
  });
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
  assert.match(await page.locator('#review-status').textContent(),/Opções com intervalo atingido: 1/);
  assert.match(await page.locator('#review-status').textContent(),/Sem data para calcular intervalo: 1/);assert.match(await page.locator('#review-status').textContent(),/Com data a conferir: 1/);
  assert.equal(await page.locator('#review-list button').count(),1);
  assert.equal(await page.locator('#review-list button').getAttribute('data-activity'),'match');
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('astronomia'));assert.equal(await page.locator('#review-list button').count(),0);
  assert.match(await page.locator('#review-status').textContent(),/falta de registro não é dificuldade/);
  await inArea(page,'atividades',()=>page.locator('#theme').selectOption('fundo-do-mar'));
  await inArea(page,'responsaveis',()=>page.locator('#adapt').uncheck());assert.equal(await page.locator('#review-list button').count(),0);
  assert.equal(await page.locator('#word option').count(),7);
  await inArea(page,'responsaveis',()=>page.locator('#adapt').check());await inArea(page,'responsaveis',()=>page.locator('#review-list button').click());
  assert.equal(await page.locator('#word').inputValue(),'mar');
  assert.equal(await page.locator('input[name="activity"][value="match"]').isChecked(),true);
  const before=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');return (await store.load()).events.length;});assert.equal(before,3);
  await inArea(page,'atividades',()=>page.locator('#match-options button').filter({hasText:'MAR'}).click());await inArea(page,'atividades',()=>page.locator('#check').click());
  await page.locator('#repeat').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelectorAll('#review-list button').length===0);
  assert.match(await page.locator('#review-status').textContent(),/Atividades com registro datado mais recente: 1/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(network.filter(request=>request.method!=='GET').length,0);assert.deepEqual(failures,[]);
  await page.screenshot({path:'test-results/revisitas-mobile.png',fullPage:true});
 }finally{await browser.close();}
});

test('local report filters offline records, prints a checked snapshot and blocks erased data',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  const dates=await page.evaluate(async()=>{
   const store=await import('/storage/store.mjs');const {localDay}=await import('/ai/adaptive-learning/engine.mjs');
   const old=new Date(),future=new Date();old.setDate(old.getDate()-10);future.setDate(future.getDate()+2);
   const today=localDay();await store.mutate(state=>({...state,events:[
    {wordId:'maca',sessionId:'private-session',activity:'build',outcome:'completed',support:'independent',day:today,hintUsed:false,audioRequested:true},
    {wordId:'maca',activity:'match',outcome:'completed',support:'assisted',day:today,hintUsed:true},
    {wordId:'pessego',activity:'build',outcome:'completed'},
    {wordId:'mar',activity:'build',outcome:'completed',day:localDay(old)},
    {wordId:'sol',activity:'build',outcome:'completed',day:localDay(future)}]}));return {today};
  });
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());
  const records=()=>page.evaluate(async()=>JSON.stringify((await (await import('/storage/store.mjs')).load()).events));const before=await records();
  await inArea(page,'responsaveis',()=>page.locator('#report-theme').selectOption('frutas'));await inArea(page,'responsaveis',()=>page.locator('#report-period').selectOption('range'));await inArea(page,'responsaveis',()=>page.locator('#report-from').fill(dates.today));await inArea(page,'responsaveis',()=>page.locator('#report-to').fill(dates.today));
  await inArea(page,'responsaveis',()=>page.locator('#generate-report').focus());await page.keyboard.press('Enter');await page.locator('#report-preview').waitFor({state:'visible'});
  assert.match(await page.locator('#report-preview').textContent(),/2 conclusões datadas/);assert.match(await page.locator('#report-preview').textContent(),/1 conclusões sem data/);
  assert.equal(await page.locator('#report-preview .report-row').count(),3);assert.match(await page.locator('#report-preview').textContent(),/PÊSSEGO/);assert.doesNotMatch(await page.locator('#report-preview').textContent(),/private-session/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'test-results/relatorio-mobile.png',fullPage:true});
  await page.evaluate(()=>{window.print=()=>{window.printedReport=document.querySelector('#report-print-root').textContent;window.dispatchEvent(new Event('afterprint'));};});
  await inArea(page,'responsaveis',()=>page.locator('#print-report').click());await page.waitForFunction(()=>Boolean(window.printedReport));assert.match(await page.evaluate(()=>window.printedReport),/MAÇÃ/);assert.equal(await page.locator('#report-print-root').count(),0);assert.equal(await records(),before);
  await inArea(page,'responsaveis',()=>page.locator('#report-undated').uncheck());assert.equal(await page.locator('#print-report').isDisabled(),true);await inArea(page,'responsaveis',()=>page.locator('#generate-report').click());await page.locator('#report-preview').waitFor({state:'visible'});assert.equal(await page.locator('#report-preview .report-row').count(),2);
  await page.evaluate(async()=>{window.printedReport=null;await (await import('/storage/store.mjs')).erase();});await inArea(page,'responsaveis',()=>page.locator('#print-report').click());await page.waitForFunction(()=>document.querySelector('#report-preview').hidden);assert.equal(await page.evaluate(()=>window.printedReport),null);assert.match(await page.locator('#report-status').textContent(),/registros mudaram/);
  await inArea(page,'responsaveis',()=>page.locator('#generate-report').click());await page.locator('#report-preview').waitFor({state:'visible'});assert.match(await page.locator('#report-preview').textContent(),/0 conclusões datadas/);await inArea(page,'responsaveis',()=>page.locator('#clear-report').click());assert.equal(await page.locator('#report-preview').isHidden(),true);
  assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('phrases work by keyboard offline, preserve duplicate words and never mix with word records',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  const events=()=>page.evaluate(async()=>JSON.stringify((await (await import('/storage/store.mjs')).load()).events));const before=await events();
  await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.match(await page.locator('#phrase-feedback').textContent(),/Vamos explorar/);
  await inArea(page,'atividades',()=>page.locator('#phrase-bank button[data-token-key="2"]').focus());await page.keyboard.press('Enter');
  await inArea(page,'atividades',()=>page.locator('#phrase-hint').click());assert.match(await page.locator('#phrase-feedback').textContent(),/posição 1, use O/);assert.equal(await page.locator('#phrase-slots button').count(),1);
  await inArea(page,'atividades',()=>page.locator('#phrase-slots button').focus());await page.keyboard.press('Enter');assert.equal(await page.locator('#phrase-slots button').count(),0);
  await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());assert.equal(await page.locator('#phrase-model').textContent(),'O PEIXE NADA.');
  await inArea(page,'apoios',()=>page.locator('#on-success-audio').uncheck());
  for(const key of ['0','1','2']){await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).focus());await page.keyboard.press('Enter');}
  await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.match(await page.locator('#phrase-feedback').textContent(),/Você organizou/);assert.equal(await page.locator('#phrase-audio-status').textContent(),'');
  await inArea(page,'atividades',()=>page.locator('#phrase-next').click());assert.equal(await page.locator('#phrase-choice').inputValue(),'frase-polvo');assert.equal(await page.locator('#phrase-slots button').count(),0);assert.equal(await page.locator('#phrase-model').isHidden(),true);
  await inArea(page,'atividades',()=>page.locator('#phrase-theme').selectOption('frutas'));await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());assert.equal(await page.locator('#phrase-model').textContent(),'A MAÇÃ É UMA FRUTA.');
  for(const key of ['4','1','2','3','0'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.match(await page.locator('#phrase-feedback').textContent(),/Vamos explorar/);
  await inArea(page,'atividades',()=>page.locator('#phrase-reset').click());for(const key of ['0','1','2','3','4'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.match(await page.locator('#phrase-feedback').textContent(),/Você organizou/);
  await inArea(page,'apoios',()=>page.locator('#lowercase').check());assert.equal(await page.locator('#phrase-slots button').first().textContent(),'a');assert.equal(await events(),before);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await inArea(page,'atividades',()=>page.locator('#frases').screenshot({path:'test-results/frases-mobile.png'}));await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});assert.equal(await page.locator('#phrase-slots button').count(),0);assert.equal(await events(),before);
  assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('all eight fixed phrases play app audio without browser voices and honor zero volume',async()=>{
 const {browser,page,failures}=await setup();
 try{
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));
  for(const [theme,ids] of [['fundo-do-mar',['frase-peixe','frase-polvo']],['astronomia',['frase-lua','frase-sol']],['natureza',['frase-flor','frase-arvore']],['frutas',['frase-maca','frase-pera']]]){
   await inArea(page,'atividades',()=>page.locator('#phrase-theme').selectOption(theme));
   for(const id of ids){await inArea(page,'atividades',()=>page.locator('#phrase-choice').selectOption(id));await inArea(page,'atividades',()=>page.locator('#phrase-listen').click());await page.waitForFunction(()=>document.querySelector('#phrase-audio-status').textContent==='Leitura concluída.');}
  }
  for(const key of ['0','1','2','3','4'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());await page.waitForFunction(()=>document.querySelector('#phrase-audio-status').textContent==='Leitura concluída.');
  await inArea(page,'apoios',()=>page.locator('#volume').fill('0'));await page.locator('#volume').dispatchEvent('change');await inArea(page,'atividades',()=>page.locator('#phrase-listen').click());assert.match(await page.locator('#phrase-audio-status').textContent(),/volume da leitura está em zero/);
  await inArea(page,'atividades',()=>page.locator('#phrase-stop').click());assert.equal(await page.locator('#phrase-audio-status').textContent(),'Leitura interrompida.');assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('optional continuations preserve an unfinished phrase until explicit choice and work offline by keyboard',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  const records=()=>page.evaluate(async()=>JSON.stringify((await (await import('/storage/store.mjs')).load()).events));const before=await records();
  await inArea(page,'atividades',()=>page.locator('#phrase-bank button[data-token-key="0"]').click());await inArea(page,'atividades',()=>page.locator('#phrase-continuations summary').click());assert.equal(await page.locator('#phrase-use-continuation').isDisabled(),true);
  await inArea(page,'atividades',()=>page.locator('#phrase-complement').selectOption('frase-peixe-1'));assert.equal(await page.locator('#phrase-continuation-preview').textContent(),'O PEIXE NADA NO MAR.');assert.equal(await page.locator('#phrase-slots button').count(),1);assert.equal(await page.locator('#phrase-bank button').count(),3);
  await inArea(page,'atividades',()=>page.locator('#phrase-action').selectOption('viver'));assert.equal(await page.locator('#phrase-continuation-preview').textContent(),'O PEIXE VIVE NA ÁGUA.');assert.equal(await page.locator('#phrase-slots button').count(),1);
  await inArea(page,'atividades',()=>page.locator('#phrase-use-continuation').focus());await page.keyboard.press('Enter');assert.equal(await page.locator('#phrase-slots button').count(),0);assert.equal(await page.locator('#phrase-bank button').count(),5);assert.equal(await page.locator('#phrase-use-continuation').isDisabled(),true);
  await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());assert.equal(await page.locator('#phrase-model').textContent(),'O PEIXE VIVE NA ÁGUA.');await inArea(page,'apoios',()=>page.locator('#on-success-audio').uncheck());
  for(const key of ['0','1','2','3','4']){await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).focus());await page.keyboard.press('Enter');}await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.match(await page.locator('#phrase-feedback').textContent(),/Você organizou/);
  await inArea(page,'atividades',()=>page.locator('#phrase-action').selectOption('nadar'));assert.equal(await page.locator('#phrase-slots button').count(),5);await inArea(page,'atividades',()=>page.locator('#phrase-reset').click());await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());assert.equal(await page.locator('#phrase-model').textContent(),'O PEIXE VIVE NA ÁGUA.');
  await inArea(page,'apoios',()=>page.locator('#lowercase').check());assert.equal(await page.locator('#phrase-continuation-preview').textContent(),'o peixe nada.');assert.equal(await records(),before);
  await inArea(page,'atividades',()=>page.locator('#frases').screenshot({path:'test-results/continuacoes-mobile.png'}));await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await inArea(page,'atividades',()=>page.locator('#phrase-next').click());assert.equal(await page.locator('#phrase-choice').inputValue(),'frase-polvo');assert.equal(await page.locator('#phrase-continuations').getAttribute('open'),null);await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());assert.equal(await page.locator('#phrase-model').textContent(),'o polvo vive no mar.');
  await inArea(page,'atividades',()=>page.locator('#phrase-theme').selectOption('frutas'));await inArea(page,'atividades',()=>page.locator('#phrase-continuations summary').click());await inArea(page,'atividades',()=>page.locator('#phrase-action').selectOption('ter'));assert.equal(await page.locator('#phrase-continuation-preview').textContent(),'a maçã tem sementes.');await inArea(page,'atividades',()=>page.locator('#phrase-use-continuation').click());await inArea(page,'atividades',()=>page.locator('#phrase-hint').click());assert.match(await page.locator('#phrase-feedback').textContent(),/posição 1, use a/);
  assert.equal(await records(),before);assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('all sixteen continuation recordings play locally without browser voices',async()=>{
 const {browser,context,page,failures}=await setup();
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));
  const groups=await page.evaluate(async()=>await (await fetch('/phrases/continuations.json')).json());
  for(const group of groups){const theme=group.exampleId.includes('peixe')||group.exampleId.includes('polvo')?'fundo-do-mar':group.exampleId.includes('lua')||group.exampleId.includes('sol')?'astronomia':group.exampleId.includes('flor')||group.exampleId.includes('arvore')?'natureza':'frutas';
   await inArea(page,'atividades',()=>page.locator('#phrase-theme').selectOption(theme));await inArea(page,'atividades',()=>page.locator('#phrase-choice').selectOption(group.exampleId));await inArea(page,'atividades',()=>page.locator('#phrase-continuations summary').click());
   for(const action of group.actions)for(const choice of action.complements){if(choice.audioId===group.exampleId)continue;await inArea(page,'atividades',()=>page.locator('#phrase-action').selectOption(action.id));await inArea(page,'atividades',()=>page.locator('#phrase-complement').selectOption(choice.id));await inArea(page,'atividades',()=>page.locator('#phrase-use-continuation').click());await inArea(page,'atividades',()=>page.locator('#phrase-listen').click());await page.waitForFunction(()=>document.querySelector('#phrase-audio-status').textContent==='Leitura concluída.');}
  }assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('phrase conclusions persist separately offline, track support conservatively, export and erase',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  const snapshot=()=>page.evaluate(async()=>await (await import('/storage/store.mjs')).load());
  await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.equal((await snapshot()).phraseEvents.length,0);
  for(const key of ['0','1','2'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());
  await page.evaluate(()=>{document.querySelector('#phrase-check').click();document.querySelector('#phrase-check').click();});await page.waitForFunction(()=>document.querySelector('#phrase-feedback').textContent.includes('Registro salvo'));
  let state=await snapshot();assert.equal(state.phraseEvents.length,1);assert.equal(state.events.length,0);assert.deepEqual([state.phraseEvents[0].modelUsed,state.phraseEvents[0].hintUsed,state.phraseEvents[0].audioRequested],[false,false,false]);
  await inArea(page,'apoios',()=>page.locator('#on-success-audio').uncheck());await inArea(page,'atividades',()=>page.locator('#phrase-continuations summary').click());await inArea(page,'atividades',()=>page.locator('#phrase-action').selectOption('viver'));await inArea(page,'atividades',()=>page.locator('#phrase-use-continuation').click());await inArea(page,'atividades',()=>page.locator('#phrase-continuations summary').click());
  await inArea(page,'atividades',()=>page.locator('#phrase-hint').click());await inArea(page,'atividades',()=>page.locator('#phrase-listen').click());await inArea(page,'atividades',()=>page.locator('#phrase-stop').click());
  for(const key of ['0','1','2','3','4'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());await page.waitForFunction(()=>document.querySelector('#phrase-feedback').textContent.includes('Registro salvo'));
  state=await snapshot();assert.equal(state.phraseEvents.length,2);assert.equal(state.phraseEvents[1].phraseId,'frase-peixe-2');assert.deepEqual([state.phraseEvents[1].modelUsed,state.phraseEvents[1].hintUsed,state.phraseEvents[1].audioRequested],[true,true,true]);
  await inArea(page,'atividades',()=>page.locator('#phrase-slots button').last().click());await inArea(page,'atividades',()=>page.locator('#phrase-bank button[data-token-key="4"]').click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());assert.equal((await snapshot()).phraseEvents.length,2);
  await construct(page,'PEIXE');await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());assert.match(await page.locator('#phrase-progress').textContent(),/O PEIXE VIVE NA ÁGUA: 1/);assert.match(await page.locator('#progress').textContent(),/PEIXE: 1/);
  const download=page.waitForEvent('download');await inArea(page,'responsaveis',()=>page.locator('#export').click());const file=await download;const {readFile}=await import('node:fs/promises');const backup=JSON.parse(await readFile(await file.path(),'utf8'));assert.equal(backup.schemaVersion,7);assert.equal(backup.phraseEvents.length,2);assert.equal(backup.events.length,1);
  await inArea(page,'responsaveis',()=>page.locator('#phrase-progress').screenshot({path:'test-results/registros-frases-mobile.png'}));await page.reload();await page.locator('#experience').waitFor({state:'visible'});await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());assert.match(await page.locator('#phrase-progress').textContent(),/O PEIXE VIVE NA ÁGUA: 1/);
  await inArea(page,'responsaveis',()=>page.locator('#delete').click());await inArea(page,'responsaveis',()=>page.locator('#confirm-delete').click());await page.waitForFunction(()=>document.querySelector('#data-feedback').textContent.includes('apagados'));assert.equal((await snapshot()).phraseEvents.length,0);assert.equal((await snapshot()).events.length,0);assert.match(await page.locator('#phrase-progress').textContent(),/Ainda não há/);
  assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('unavailable storage keeps phrase conclusions only in memory with an explicit warning',async()=>{
 const {browser,context,page,failures,network}=await setup();
 try{
  await context.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new Error('unavailable');}}));await page.reload();await page.locator('#experience').waitFor({state:'visible'});await inArea(page,'apoios',()=>page.locator('#on-success-audio').uncheck());
  await inArea(page,'atividades',()=>page.locator('#phrase-show-model').check());await inArea(page,'atividades',()=>page.locator('#phrase-show-model').uncheck());for(const key of ['0','1','2'])await inArea(page,'atividades',()=>page.locator(`#phrase-bank button[data-token-key="${key}"]`).click());await inArea(page,'atividades',()=>page.locator('#phrase-check').click());await page.waitForFunction(()=>document.querySelector('#phrase-feedback').textContent.includes('apenas na memória'));
  await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());assert.match(await page.locator('#phrase-progress').textContent(),/O PEIXE NADA: 1/);assert.match(await page.locator('#phrase-progress').textContent(),/1 com modelo ou pista/);assert.match(await page.locator('#storage-status').textContent(),/apenas na memória/);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});await inArea(page,'responsaveis',()=>page.locator('#adult-title').click());assert.match(await page.locator('#phrase-progress').textContent(),/Ainda não há/);assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('bottom navigation opens separate areas by keyboard, preserves rounds and supports history offline',async()=>{
 const {browser,context,page,failures}=await setup({viewport:{width:390,height:844}});
 try{
  assert.equal(await page.locator('#configuracoes').isHidden(),true);assert.equal(await page.locator('#responsaveis').isHidden(),true);
  await page.getByRole('button',{name:'Adicionar P',exact:true}).click();const selected=await page.locator('#slots').textContent();
  await page.locator('#nav-apoios').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#configuracoes').isVisible(),true);assert.equal(await page.locator('#area-atividades').isHidden(),true);assert.equal(await page.locator('#settings-title').evaluate(node=>node===document.activeElement),true);assert.equal(await page.locator('#nav-apoios').getAttribute('aria-current'),'page');
  await page.locator('#dark').check();await page.screenshot({path:'test-results/apoios-mobile-dark.png',fullPage:true});await page.locator('#dark').uncheck();
  await page.locator('#nav-responsaveis').click();assert.equal(await page.locator('#responsaveis').isVisible(),true);assert.equal(await page.locator('#configuracoes').isHidden(),true);assert.equal(await page.locator('#adult-title').evaluate(node=>node===document.activeElement),true);
  await page.goBack();assert.equal(await page.locator('#configuracoes').isVisible(),true);await page.goForward();assert.equal(await page.locator('#responsaveis').isVisible(),true);
  await page.locator('#nav-atividades').click();assert.equal(await page.locator('#slots').textContent(),selected);assert.equal(await page.locator('#responsaveis').isHidden(),true);
  await page.locator('.top a[href="#frases"]').click();assert.equal(await page.locator('#frases').evaluate(node=>node===document.activeElement),true);await page.locator('#phrase-bank button[data-token-key="0"]').click();const phrase=await page.locator('#phrase-slots').textContent();
  await page.locator('#nav-apoios').click();await page.locator('#nav-atividades').click();assert.equal(await page.locator('#phrase-slots').textContent(),phrase);
  const box=await page.locator('#bottom-nav').boundingBox();assert.ok(box.y>=0&&box.y+box.height<=845);await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'test-results/navegacao-mobile.png',fullPage:true});await page.locator('#bottom-nav').screenshot({path:'test-results/menu-inferior-320.png'});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.locator('#nav-responsaveis').click();await page.reload();await page.locator('#experience').waitFor({state:'visible'});assert.equal(await page.locator('#responsaveis').isVisible(),true);await page.locator('#nav-apoios').click();assert.equal(await page.locator('#configuracoes').isVisible(),true);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('report keeps phrase evidence separate, filters both histories and rejects stale phrase printing',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  const today=await page.evaluate(async()=>{const store=await import('/storage/store.mjs');const {localDay}=await import('/ai/adaptive-learning/engine.mjs');const day=localDay();await store.mutate(state=>({...state,events:[{wordId:'maca',activity:'build',outcome:'completed',day,support:'independent'}],phraseEvents:[{phraseId:'frase-maca-2',outcome:'completed',day,modelUsed:true,hintUsed:false,audioRequested:true},{phraseId:'frase-pera',outcome:'completed'}]}));return day;});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-responsaveis').click();
  await page.locator('#report-theme').selectOption('frutas');await page.locator('#report-period').selectOption('range');await page.locator('#report-from').fill(today);await page.locator('#report-to').fill(today);await page.locator('#generate-report').click();await page.locator('#report-preview').waitFor({state:'visible'});
  assert.equal(await page.locator('#report-preview .report-row').count(),1);assert.equal(await page.locator('#report-preview .report-phrase-row').count(),2);assert.match(await page.locator('#report-preview').textContent(),/A MAÇÃ TEM SEMENTES/);assert.match(await page.locator('#report-preview').textContent(),/Frases: 1 conclusões datadas/);
  await page.evaluate(()=>{window.print=()=>{window.printed=document.querySelector('#report-print-root').textContent;};});await page.locator('#print-report').click();await page.waitForFunction(()=>Boolean(window.printed));assert.match(await page.evaluate(()=>window.printed),/A MAÇÃ TEM SEMENTES/);await page.emulateMedia({media:'print'});assert.equal(await page.locator('#bottom-nav').isHidden(),true);assert.equal(await page.locator('main').isHidden(),true);await page.locator('#report-print-root').screenshot({path:'test-results/relatorio-impressao.png'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await page.emulateMedia({media:'screen'});
  await page.locator('#report-undated').uncheck();await page.locator('#generate-report').click();await page.locator('#report-preview').waitFor({state:'visible'});assert.equal(await page.locator('#report-preview .report-phrase-row').count(),1);await page.locator('#report-preview').screenshot({path:'test-results/relatorio-palavras-frases.png'});
  await page.evaluate(async()=>{window.printed=null;const store=await import('/storage/store.mjs');await store.mutate(state=>({...state,phraseEvents:[]}));});await page.locator('#print-report').click();await page.waitForFunction(()=>document.querySelector('#report-preview').hidden);assert.equal(await page.evaluate(()=>window.printed),null);
  await page.locator('#report-theme').selectOption('astronomia');await page.locator('#generate-report').click();await page.locator('#report-preview').waitFor({state:'visible'});assert.equal(await page.locator('#report-preview .report-row,.report-phrase-row').count(),0);
  assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('optional phrase advice explains history, preserves a round when ignored and respects explicit preferences offline',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.evaluate(async()=>{const store=await import('/storage/store.mjs');const {localDay}=await import('/ai/adaptive-learning/engine.mjs');const old=new Date();old.setDate(old.getDate()-10);await store.mutate(state=>({...state,settings:{...state.settings,adapt:true,exploration:'balanced',reviewAfterDays:7,onSuccessAudio:false},phraseEvents:[{phraseId:'frase-peixe',outcome:'completed',day:localDay(),modelUsed:true,hintUsed:false},{phraseId:'frase-polvo',outcome:'completed',day:localDay(old),modelUsed:false,hintUsed:false}]}));});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  await page.locator('#phrase-bank button[data-token-key="0"]').click();const selected=await page.locator('#phrase-slots').textContent();await page.locator('#phrase-advice-details summary').click();assert.equal(await page.locator('#phrase-advice-list article').count(),2);assert.match(await page.locator('#phrase-advice-list').textContent(),/intervalo escolhido é 7 dias/);assert.match(await page.locator('#phrase-advice-list').textContent(),/conclusão desta frase com modelo ou pista/);
  await page.locator('#phrase-ignore-advice').click();assert.equal(await page.locator('#phrase-slots').textContent(),selected);assert.equal(await page.locator('#phrase-advice-list article').count(),0);assert.match(await page.locator('#phrase-advice-status').textContent(),/cartões foram preservados/);
  await page.locator('#nav-responsaveis').click();await page.locator('#adapt').uncheck();await page.locator('#nav-atividades').click();assert.equal(await page.locator('#phrase-advice-list article').count(),0);assert.match(await page.locator('#phrase-advice-status').textContent(),/desligadas/);assert.equal(await page.locator('#phrase-slots').textContent(),selected);assert.equal(await page.locator('#phrase-choice option').count(),2);
  await page.locator('#nav-responsaveis').click();await page.locator('#adapt').check();await page.locator('#exploration-goal').selectOption('new');await page.locator('#nav-atividades').click();assert.equal(await page.locator('#phrase-advice-list article').first().getAttribute('data-action'),'new_phrase');
  await page.locator('#phrase-advice-details').screenshot({path:'test-results/sugestoes-frases-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('#phrase-advice-list article[data-action="new_phrase"] button').click();assert.equal(await page.locator('#phrase-slots button').count(),0);assert.equal(await page.locator('#phrase-show-model').isChecked(),true);assert.equal(await page.locator('#phrase-model').textContent(),'O PEIXE NADA NO MAR.');assert.equal(await page.locator('#phrase-bank button').first().evaluate(node=>node===document.activeElement),true);
  let stored=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(stored.phraseEvents.length,2);assert.equal(stored.events.length,0);
  for(const key of ['0','1','2','3','4'])await page.locator(`#phrase-bank button[data-token-key="${key}"]`).click();await page.locator('#phrase-check').click();await page.waitForFunction(()=>document.querySelector('#phrase-feedback').textContent.includes('Registro salvo'));stored=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(stored.phraseEvents.length,3);assert.equal(stored.phraseEvents.at(-1).phraseId,'frase-peixe-1');assert.equal(stored.phraseEvents.at(-1).modelUsed,true);
  await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('phrase suggestions keep unknown dates and future dates distinct and remain within the chosen theme',async()=>{
 const {browser,page,failures}=await setup();
 try{
  await page.evaluate(async()=>{const store=await import('/storage/store.mjs');const {localDay}=await import('/ai/adaptive-learning/engine.mjs');const future=new Date();future.setDate(future.getDate()+10);await store.mutate(state=>({...state,settings:{...state.settings,exploration:'balanced',reviewAfterDays:7},phraseEvents:[{phraseId:'frase-peixe',outcome:'completed'},{phraseId:'frase-polvo',outcome:'completed',day:localDay(future),modelUsed:true}]}));});await page.reload();await page.locator('#experience').waitFor({state:'visible'});
  await page.locator('#phrase-advice-details summary').click();assert.equal(await page.locator('#phrase-advice-list article[data-action="review"]').count(),0);assert.match(await page.locator('#phrase-advice-list').textContent(),/informações de apoio ausentes/);
  await page.locator('#phrase-theme').selectOption('astronomia');await page.locator('#phrase-advice-details summary').click();assert.doesNotMatch(await page.locator('#phrase-advice-list').textContent(),/PEIXE|POLVO/);assert.match(await page.locator('#phrase-advice-list').textContent(),/Falta de registro não é dificuldade/);
  await page.locator('#nav-responsaveis').click();await page.locator('#exploration-goal').selectOption('review');await page.locator('#review-days').fill('3');await page.locator('#review-days').dispatchEvent('change');await page.locator('#nav-atividades').click();await page.locator('#phrase-theme').selectOption('fundo-do-mar');await page.locator('#phrase-advice-details summary').click();const review=page.locator('#phrase-advice-list article[data-action="review"]');assert.equal(await review.getAttribute('data-phrase-id'),'frase-peixe');assert.match(await review.textContent(),/sem data válida/);const state=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(state.phraseEvents.length,2);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('first stories create, edit, order, read and save pages offline without learning events',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-editor').getAttribute('open'),'');
  await page.locator('#story-add-page').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#story-pages li').count(),1);assert.equal(await page.locator('#story-page-text').textContent(),'O PEIXE NADA.');assert.equal(await page.locator('#story-audio-status').textContent(),'');
  await page.locator('#story-theme').selectOption('astronomia');await page.locator('#story-scene').selectOption('planeta');await page.locator('#story-add-page').click();assert.equal(await page.locator('#story-pages li').count(),2);assert.equal(await page.locator('#story-page-text').textContent(),'A LUA ESTÁ NO CÉU.');
  await page.getByRole('button',{name:'Editar página 1',exact:true}).click();await page.locator('#story-phrase').selectOption('frase-peixe-1');await page.locator('#story-add-page').click();assert.match(await page.locator('#story-pages li').first().textContent(),/O PEIXE NADA NO MAR/);
  await page.getByRole('button',{name:'Descer página 1',exact:true}).click();assert.match(await page.locator('#story-pages li').first().textContent(),/A LUA ESTÁ NO CÉU/);await page.getByRole('button',{name:'Remover página 2',exact:true}).click();assert.equal(await page.locator('#story-pages li').count(),1);await page.locator('#story-undo').click();assert.equal(await page.locator('#story-pages li').count(),2);
  await page.getByRole('button',{name:'Ver página 1',exact:true}).click();await page.locator('#story-listen').click();await page.waitForFunction(()=>document.querySelector('#story-audio-status').textContent==='Leitura concluída.');await page.locator('#story-next').click();assert.match(await page.locator('#story-reader-title').textContent(),/Página 2 de 2/);assert.equal(await page.locator('#story-audio-status').textContent(),'');assert.equal(await page.locator('#story-page-text').textContent(),'O PEIXE NADA NO MAR.');
  await page.locator('#nav-apoios').click();await page.locator('#lowercase').check();await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-page-text').textContent(),'o peixe nada no mar.');assert.equal(await page.locator('#story-pages li').count(),2);
  await page.locator('#story-save').click();await page.waitForFunction(()=>document.querySelector('#story-status').textContent.includes('História salva'));let state=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(state.storyDraft.pages.length,2);assert.deepEqual(state.events,[]);assert.deepEqual(state.phraseEvents,[]);
  await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#story-reader').screenshot({path:'test-results/historia-leitura-mobile.png'});
  await page.locator('#nav-responsaveis').click();const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;const {readFile}=await import('node:fs/promises');const backup=JSON.parse(await readFile(await file.path(),'utf8'));assert.equal(backup.schemaVersion,7);assert.equal(backup.storyDraft.pages.length,2);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-pages li').count(),2);await page.locator('#story-clear').click();assert.equal(await page.locator('#story-pages li').count(),0);await page.locator('#story-undo').click();assert.equal(await page.locator('#story-pages li').count(),2);
  await page.locator('#nav-responsaveis').click();await page.locator('#delete').click();await page.locator('#confirm-delete').click();await page.waitForFunction(()=>document.querySelector('#data-feedback').textContent.includes('apagados'));state=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(state.storyDraft,null);await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-pages li').count(),0);
  assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('stories allow six pages, editing at the limit, undo and explicit-only persistence',async()=>{
 const {browser,page,failures}=await setup();
 try{
  await page.locator('#nav-historias').click();for(let i=0;i<6;i++)await page.locator('#story-add-page').click();assert.equal(await page.locator('#story-add-page').isDisabled(),true);assert.equal(await page.locator('#story-pages li').count(),6);assert.equal(await page.evaluate(async()=>(await (await import('/storage/store.mjs')).load()).storyDraft),null);
  await page.getByRole('button',{name:'Editar página 6',exact:true}).click();await page.locator('#story-scene').selectOption('ceu');assert.equal(await page.locator('#story-save').isDisabled(),true);assert.equal(await page.locator('#story-add-page').isEnabled(),true);await page.locator('#story-add-page').click();assert.match(await page.locator('#story-pages li').last().textContent(),/Cenário: CÉU/);await page.locator('#story-undo').click();assert.match(await page.locator('#story-pages li').last().textContent(),/Cenário: MAR/);
  await page.getByRole('button',{name:'Editar página 1',exact:true}).click();await page.locator('#story-character').selectOption('polvo');await page.locator('#story-cancel-edit').click();assert.match(await page.locator('#story-pages li').first().textContent(),/O PEIXE NADA/);
  await page.locator('#story-save').click();await page.waitForFunction(()=>document.querySelector('#story-status').textContent.includes('História salva'));await page.getByRole('button',{name:'Remover página 6',exact:true}).click();assert.equal(await page.locator('#story-pages li').count(),5);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-pages li').count(),6);
  await page.locator('#nav-apoios').click();await page.locator('#volume').fill('0');await page.locator('#volume').dispatchEvent('change');await page.locator('#nav-historias').click();await page.locator('#story-listen').click();assert.match(await page.locator('#story-audio-status').textContent(),/volume da leitura está em zero/);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('story save failure is explicit and keeps only the working pages in memory',async()=>{
 const {browser,context,page,failures}=await setup();
 try{
  await context.addInitScript(()=>Object.defineProperty(window,'indexedDB',{get(){throw new Error('unavailable');}}));await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();await page.locator('#story-add-page').click();await page.locator('#story-save').click();await page.waitForFunction(()=>document.querySelector('#story-status').textContent.includes('apenas na memória'));assert.equal(await page.locator('#story-pages li').count(),1);assert.equal(await page.locator('#story-save').isEnabled(),true);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();assert.equal(await page.locator('#story-pages li').count(),0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('stories have their own area, preserve legacy pages and save card sentences with local drawings offline',async()=>{
 const {browser,context,page,failures,network}=await setup({viewport:{width:390,height:844}});
 try{
  await page.evaluate(async()=>{const store=await import('/storage/store.mjs');await store.saveStory({version:1,pages:[{characterId:'peixe',sceneId:'mar',phraseId:'frase-peixe'}]});});
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.locator('#nav-historias').click();assert.equal(await page.locator('#area-atividades').isHidden(),true);assert.equal(await page.locator('#nav-historias').getAttribute('aria-current'),'page');assert.equal(await page.locator('#story-pages li').count(),1);
  await page.locator('#story-text-mode').selectOption('cards');await page.locator('#story-art-mode').selectOption('drawing');await page.locator('#story-bank-group').selectOption('links');
  for(const text of ['EU','VEJO','A'])await page.getByRole('button',{name:'Adicionar à história: '+text,exact:true}).click();
  await page.locator('#story-theme').selectOption('astronomia');await page.locator('#story-bank-group').selectOption('theme');await page.getByRole('button',{name:'Adicionar à história: LUA',exact:true}).click();assert.equal(await page.locator('#story-candidate-text').textContent(),'EU VEJO A LUA.');
  await page.getByRole('button',{name:'Descer palavra 1',exact:true}).click();assert.match(await page.locator('#story-candidate-text').textContent(),/^VEJO EU/);await page.getByRole('button',{name:'Subir palavra 2',exact:true}).click();
  await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));await page.locator('#story-preview-listen').click();await page.waitForFunction(()=>document.querySelector('#story-audio-status').textContent==='Leitura concluída.');
  await page.locator('#story-draw-color').selectOption('#2864a0');await page.locator('#story-drawing').focus();await page.keyboard.press('Enter');for(let i=0;i<8;i++)await page.keyboard.press('ArrowRight');await page.keyboard.press('Escape');await page.keyboard.press('Tab');assert.equal(await page.locator('#story-drawing').evaluate(node=>node===document.activeElement),false);
  const alpha=()=>page.locator('#story-drawing').evaluate(node=>node.getContext('2d').getImageData(0,0,600,400).data.some((v,i)=>i%4===3&&v>0));assert.equal(await alpha(),true);
  await page.locator('#story-add-page').click();assert.equal(await page.locator('#story-pages li').count(),2);assert.equal(await page.locator('#story-reader-drawing').isVisible(),true);assert.equal(await page.locator('#story-reader-figures').isHidden(),true);assert.equal(await page.locator('#story-page-text').textContent(),'EU VEJO A LUA.');assert.match(await page.locator('#story-reading-note').textContent(),/palavra por palavra/);
  await page.locator('#story-save').click();await page.waitForFunction(()=>document.querySelector('#story-status').textContent.includes('História salva'));let state=await page.evaluate(async()=>await (await import('/storage/store.mjs')).load());assert.equal(state.storyDraft.version,2);assert.equal(state.storyDraft.pages[1].tokenIds.length,4);assert.match(state.storyDraft.pages[1].drawing,/^data:image\/png;base64,/);assert.deepEqual(state.events,[]);assert.deepEqual(state.phraseEvents,[]);
  await page.setViewportSize({width:320,height:800});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('#story-reader').screenshot({path:'test-results/historia-desenho-leitura.png'});await page.locator('#bottom-nav').screenshot({path:'test-results/menu-quatro-areas-320.png'});
  await page.locator('#nav-apoios').click();await page.locator('#nav-historias').click();assert.equal(await alpha(),true);
  await page.reload();await page.locator('#experience').waitFor({state:'visible'});assert.equal(await page.locator('#historias').isVisible(),true);await page.getByRole('button',{name:'Ver página 2',exact:true}).click();assert.equal(await page.locator('#story-reader-drawing').isVisible(),true);await page.getByRole('button',{name:'Editar página 2',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#story-add-page').disabled===false);assert.equal(await page.locator('#story-text-mode').inputValue(),'cards');assert.equal(await page.locator('#story-art-mode').inputValue(),'drawing');assert.equal(await page.locator('#story-token-list li').count(),4);assert.equal(await alpha(),true);await page.locator('#story-cancel-edit').click();
  await page.locator('#nav-responsaveis').click();const download=page.waitForEvent('download');await page.locator('#export').click();const file=await download;const {readFile}=await import('node:fs/promises');const backup=JSON.parse(await readFile(await file.path(),'utf8'));assert.equal(backup.schemaVersion,7);assert.match(backup.storyDraft.pages[1].drawing,/^data:image\/png;base64,/);
  await page.locator('#delete').click();await page.locator('#confirm-delete').click();await page.waitForFunction(()=>document.querySelector('#data-feedback').textContent.includes('apagados'));await page.locator('#nav-historias').click();assert.equal(await alpha(),false);assert.equal(await page.locator('#story-reader-drawing').getAttribute('src'),null);assert.equal(await page.locator('#story-token-list li').count(),0);assert.equal(await page.locator('#story-draw-undo').isDisabled(),true);assert.equal(network.filter(r=>r.method!=='GET').length,0);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('drawing supports touch, eraser, undo and clearing; card words can repeat up to twelve',async()=>{
 const {browser,page,failures}=await setup({viewport:{width:390,height:844},hasTouch:true});
 try{
  await page.locator('#nav-historias').click();await page.locator('#story-art-mode').selectOption('drawing');const canvas=page.locator('#story-drawing');
  const count=()=>canvas.evaluate(node=>node.getContext('2d').getImageData(0,0,600,400).data.reduce((n,v,i)=>n+(i%4===3&&v>0?1:0),0));
  await canvas.scrollIntoViewIfNeeded();let box=await canvas.boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.ok(await count()>0);await page.locator('#story-draw-undo').click();assert.equal(await count(),0);
  async function line(){await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.7,box.y+box.height*.5,{steps:10});await page.mouse.up();}
  await line();const before=await count();assert.ok(before>0);await page.locator('#story-draw-tool').selectOption('eraser');await line();assert.ok(await count()<before);await page.locator('#story-draw-undo').click();assert.equal(await count(),before);await page.locator('#story-draw-clear').click();assert.equal(await count(),0);await page.locator('#story-draw-undo').click();assert.equal(await count(),before);
  await page.locator('#story-text-mode').selectOption('cards');await page.locator('#story-bank-group').selectOption('links');const add=page.getByRole('button',{name:'Adicionar à história: A',exact:true});for(let i=0;i<12;i++)await add.click();assert.equal(await page.locator('#story-token-list li').count(),12);assert.equal(await add.isDisabled(),true);await page.getByRole('button',{name:'Retirar palavra 6',exact:true}).click();assert.equal(await add.isEnabled(),true);await page.locator('#story-clear-words').click();assert.equal(await page.locator('#story-add-page').isDisabled(),true);assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});

test('all card-word recordings decode offline with browser voices unavailable',async()=>{
 const {browser,context,page,failures}=await setup();
 try{
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));await context.setOffline(true);await page.reload();await page.locator('#experience').waitFor({state:'visible'});await page.evaluate(()=>Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true}));
  const tokens=await page.evaluate(async()=>await (await fetch('/stories/tokens.json')).json());
  for(const token of tokens.filter(item=>item.audioId.startsWith('card-'))){await page.evaluate(async token=>{window.cardAudioStatus='';const {speak}=await import('/accessibility/speech.mjs');speak(token.text,.7,status=>window.cardAudioStatus=status,'/assets/audio/'+token.audioId+'.mp3');},token);await page.waitForFunction(()=>window.cardAudioStatus==='Leitura concluída.');}
  assert.deepEqual(failures,[]);
 }finally{await browser.close();}
});
