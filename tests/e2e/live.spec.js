import { test, expect } from './console.js';
import { boot, state, answerSession } from './helpers.js';
import fs from 'fs';
import path from 'path';

const swPath = [path.resolve(process.cwd(), 'sw.js'), path.resolve(process.cwd(), '../sw.js')].find((p) => fs.existsSync(p));

test('a question on screen refills hearts at midnight', async ({ page }, testInfo) => {
  await boot(page, testInfo, {
    time: new Date('2026-06-15T23:59:30'),
    profile: { hearts: 1, heartAt: null, heartDay: '2026-06-15', gems: 0 },
  });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#hs')).toHaveText('❤️ 1');
  await page.clock.fastForward(60000);
  await expect(page.locator('#hs')).toHaveText('❤️ 5');
  const s = await state(page);
  expect(s.hearts).toBe(5);
  expect(s.heartDay).toBe('2026-06-16');
  await page.evaluate(() => {
    const e = window.__BR.cur();
    const opt = [...document.querySelectorAll('.opt')].find((o) => Number(o.dataset.i) !== e.a);
    opt.click();
  });
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Out of hearts' })).toHaveCount(0);
  expect((await state(page)).hearts).toBe(4);
});

test('a heart comes back while the question stays on screen', async ({ page }, testInfo) => {
  const noon = new Date('2026-06-15T12:00:00');
  await boot(page, testInfo, {
    time: noon,
    profile: { hearts: 4, heartAt: noon.getTime() - 29 * 60 * 1000, heartDay: '2026-06-15' },
  });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#hs')).toHaveText('❤️ 4');
  await page.clock.fastForward(2 * 60 * 1000);
  await expect(page.locator('#hs')).toHaveText('❤️ 5');
  expect((await state(page)).hearts).toBe(5);
});

test('a lesson started during double XP keeps the boost after the timer ends', async ({ page }, testInfo) => {
  const noon = new Date('2026-06-15T12:00:00');
  await boot(page, testInfo, {
    time: noon,
    profile: { doubleUntil: noon.getTime() + 60000, xp: 0, goal: 100, gems: 0 },
  });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.getByText('2× XP')).toBeVisible();
  await page.clock.fastForward(90000);
  await expect(page.getByText('2× XP')).toBeVisible();
  await answerSession(page);
  expect((await state(page)).xp).toBe(62);
});

test('a lesson started after double XP expired is not boosted', async ({ page }, testInfo) => {
  const noon = new Date('2026-06-15T12:00:00');
  await boot(page, testInfo, {
    time: noon,
    profile: { doubleUntil: noon.getTime() - 1000, xp: 0, goal: 100, gems: 0 },
  });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.getByText('2× XP')).toHaveCount(0);
  await answerSession(page);
  expect((await state(page)).xp).toBe(31);
});

test('settings and the question name their radio groups', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Settings' }).click();
  const appearance = page.getByRole('radiogroup', { name: 'Appearance' });
  await expect(appearance).toBeVisible();
  await expect(appearance.getByRole('radio', { name: 'System' })).toHaveCount(1);
  await expect(appearance.getByRole('radio', { name: 'Light' })).toHaveCount(1);
  await expect(appearance.getByRole('radio', { name: 'Dark' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  const q = await page.locator('#prompt').innerText();
  await expect(page.getByRole('radiogroup', { name: q })).toBeVisible();
});

test('buying Double XP twice extends the window by 15 minutes each time', async ({ page }, testInfo) => {
  const noon = new Date('2026-06-15T12:00:00');
  const buyAt = new Date(noon.getTime() + 60 * 1000);
  await boot(page, testInfo, { time: noon, profile: { gems: 200, xp: 0, goal: 100 } });
  await page.clock.pauseAt(buyAt);
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page.getByRole('button', { name: /Double XP/ }).click();
  let s = await state(page);
  expect(s.doubleUntil).toBe(buyAt.getTime() + 15 * 60 * 1000);
  expect(s.gems).toBe(160);
  await page.clock.fastForward(500);
  await page.getByRole('button', { name: /Double XP/ }).click();
  s = await state(page);
  expect(s.doubleUntil).toBe(buyAt.getTime() + 30 * 60 * 1000);
  expect(s.gems).toBe(120);
  expect(s.bought).toBe(2);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByText(/Double XP active/)).toBeVisible();
  await expect(page.getByText(/30 min left/)).toBeVisible();
});

test('the shop lists every gem reward', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(page.getByText('Level up: +20')).toBeVisible();
  await expect(page.getByText('Daily quest: +15')).toBeVisible();
  await expect(page.getByText('All 3 quests: +25')).toBeVisible();
  await expect(page.getByText('Adds 15 minutes. A lesson you start while it is active earns 2× XP')).toBeVisible();
});

test('an open tab installs a newer service worker without reloading', async ({ page }, testInfo) => {
  const real = fs.readFileSync(swPath, 'utf8');
  let body = real.replaceAll('byteryte-v24', 'byteryte-v23');
  await page.context().route('**/sw.js', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      headers: { 'cache-control': 'no-store' },
      body,
    });
  });
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await expect.poll(() => page.evaluate(async () => (await caches.keys()).includes('byteryte-v23'))).toBe(true);
  await expect(page.getByText('A new version of ByteRyte is ready. Reload to use it.')).toHaveCount(0);
  body = real;
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) throw new Error('no registration');
    await reg.update();
  });
  await expect(page.getByText('A new version of ByteRyte is ready. Reload to use it.')).toBeVisible();
  await expect.poll(async () => page.evaluate(async () => {
    const keys = await caches.keys();
    return { v24: keys.includes('byteryte-v24'), v23: keys.includes('byteryte-v23') };
  })).toEqual({ v24: true, v23: false });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
});
