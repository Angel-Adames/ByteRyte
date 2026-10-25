import { test, expect } from './console.js';
import { boot, answerSession, state } from './helpers.js';

test('a second tab keeps a purchase and a goal change from the other tab', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { gems: 400, freezes: 0, goal: 30 } });
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect.poll(async () => {
    const a = await page.evaluate(() => window.__BR.P().rev || 0);
    const b = await other.evaluate(() => window.__BR.P().rev || 0);
    return a === b ? a : 0;
  }).toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page.getByRole('button', { name: /Streak freeze/ }).click();
  await expect(other.getByText('1 streak freeze ready')).toBeVisible();
  await other.getByRole('button', { name: 'Settings' }).click();
  await other.getByRole('radio', { name: '50 XP' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.S.goal)).toBe(50);
  expect(await page.evaluate(() => window.__BR.S.freezes)).toBe(1);
  const stored = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('byteroots-profiles'));
    return p.list[p.active];
  });
  expect(stored.freezes).toBe(1);
  expect(stored.goal).toBe(50);
  const theme = testInfo.project.use.brTheme === 'dark' ? 'light' : 'dark';
  const label = theme === 'dark' ? 'Dark' : 'Light';
  await other.getByRole('radio', { name: label }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
  await other.close();
});

test('fifty lessons in a row leave the home screen the same size', async ({ page }, testInfo) => {
  test.setTimeout(300000);
  await boot(page, testInfo, { profile: { unlockAll: true, gems: 50 } });
  const nodes = () => page.evaluate(() => document.querySelectorAll('#app *').length);
  await page.getByRole('tab', { name: /^☕ Java/ }).click();
  const before = await nodes();
  const tracks = [/^☕ Java/, /HTML & CSS/, /JavaFX/, /Swift/];
  let done = 0;
  while (done < 50) {
    if (!(await page.locator('.node.cur').count())) {
      let moved = false;
      for (const name of tracks) {
        await page.getByRole('tab', { name }).click();
        if (await page.locator('.node.cur').count()) { moved = true; break; }
      }
      if (!moved) break;
    }
    await page.locator('.node.cur').click();
    await page.getByRole('button', { name: 'Start lesson' }).click();
    await answerSession(page);
    await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
    done++;
  }
  expect(done).toBe(50);
  expect((await state(page)).lessons).toBe(50);
  await page.getByRole('tab', { name: /^☕ Java/ }).click();
  await expect.poll(() => page.locator('.toast').count(), { timeout: 90000 }).toBe(0);
  const after = await nodes();
  expect(Math.abs(after - before)).toBeLessThan(80);
  expect(await page.locator('.conf').count()).toBe(0);
  const session = await page.context().newCDPSession(page);
  await session.send('Performance.enable');
  await session.send('HeapProfiler.collectGarbage');
  const { metrics } = await session.send('Performance.getMetrics');
  const heap = metrics.find(m => m.name === 'JSHeapUsedSize').value;
  expect(heap).toBeLessThan(40 * 1024 * 1024);
  console.log('soak nodes', before, after, 'heap', heap, 'lessons', done);
});

test('slow 4G and a 4x CPU still reach the daily goal', async ({ page }, testInfo) => {
  const client = await page.context().newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
    uploadThroughput: Math.floor((750 * 1024) / 8),
    latency: 150,
  });
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const started = Date.now();
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const ms = Date.now() - started;
  console.log('slow4g ms', ms);
  expect(ms).toBeLessThan(8000);
});
