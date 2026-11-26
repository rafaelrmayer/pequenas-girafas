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
