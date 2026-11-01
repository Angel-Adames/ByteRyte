import { test, expect } from './console.js';
import { boot } from './helpers.js';
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '../..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const oldSw = `const C='byteryte-old',F=['./','index.html','style.css','app.js','data.js','interview.js','grade.js','rytia.js','boot.js','manifest.webmanifest','icons/icon.svg','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;let same=false;try{same=new URL(q.url).origin===location.origin}catch(err){return}if(!same)return;e.respondWith(caches.match(q,{ignoreSearch:true}).then(r=>r||fetch(q)))});
`;

test('an open tab moves from an old cached version onto the newly deployed assets', async ({ page }, testInfo) => {
  let gen = 'old';
  const sw = read('sw.js');
  await page.context().route('**/*', (route) => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;
    const headers = { 'cache-control': 'max-age=600' };
    if (pathname.endsWith('/sw.js')) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', headers, body: gen === 'old' ? oldSw : sw });
    }
    if (pathname.endsWith('/app.js')) {
      return route.fulfill({ status: 200, contentType: 'application/javascript', headers, body: read('app.js') + '\nwindow.__BYTERYTE_ASSET=' + JSON.stringify(gen) + ';' });
    }
    if (pathname.endsWith('/style.css')) {
      return route.fulfill({ status: 200, contentType: 'text/css', headers, body: read('style.css') + '\n:root{--asset-gen:' + gen + '}' });
    }
    if (req.resourceType() === 'document' || pathname.endsWith('/index.html') || pathname.endsWith('/ByteRyte/') || pathname.endsWith('/ByteRyte')) {
      return route.fulfill({ status: 200, contentType: 'text/html', headers, body: read('index.html').replace('<html lang="en">', '<html lang="en" data-asset="' + gen + '">') });
    }
    return route.continue();
  });
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 80, done: { 'java.run': true } } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await expect.poll(() => page.evaluate(() => ({
    asset: window.__BYTERYTE_ASSET,
    doc: document.documentElement.getAttribute('data-asset'),
    css: getComputedStyle(document.documentElement).getPropertyValue('--asset-gen').trim(),
  }))).toEqual({ asset: 'old', doc: 'old', css: 'old' });

  gen = 'new';
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const readGen = async () => {
    try {
      return await page.evaluate(() => ({
        asset: window.__BYTERYTE_ASSET,
        doc: document.documentElement.getAttribute('data-asset'),
        css: getComputedStyle(document.documentElement).getPropertyValue('--asset-gen').trim(),
      }));
    } catch (e) {
      return { asset: '', doc: '', css: '' };
    }
  };
  await expect.poll(readGen, { timeout: 20000 }).toEqual({ asset: 'new', doc: 'new', css: 'new' });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const kept = await page.evaluate(() => {
    const s = window.__BR.S;
    return { name: s.name, xp: s.xp, run: !!(s.done && s.done['java.run']) };
  });
  expect(kept).toEqual({ name: 'Ada', xp: 80, run: true });
  const names = await page.evaluate(async () => (await caches.keys()).sort());
  expect(names).toContain('byteryte-v30');
  expect(names).not.toContain('byteryte-old');

  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__BYTERYTE_ASSET)).toBe('new');
});
