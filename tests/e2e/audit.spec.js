import { test, expect } from './console.js';
import { boot, state } from './helpers.js';

test('a lesson tab does not drop a shop purchase from the other tab', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { gems: 200, freezes: 0, name: 'Ada' } });
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect.poll(async () => {
    const a = await page.evaluate(() => window.__BR.P().rev || 0);
    const b = await other.evaluate(() => window.__BR.P().rev || 0);
    return a === b ? a : 0;
  }).toBeGreaterThan(0);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await other.getByRole('button', { name: 'Shop', exact: true }).click();
  await other.getByRole('button', { name: /Streak freeze/ }).click();
  await expect.poll(() => other.evaluate(() => window.__BR.S.freezes)).toBe(1);
  const picked = await page.evaluate(() => {
    const e = window.__BR.cur();
    const opts = [...document.querySelectorAll('.opt')].filter((o) => !o.disabled);
    const hit = opts.find((o) => o.dataset.i === String(e.a));
    if (!hit) return -1;
    return opts.indexOf(hit);
  });
  expect(picked).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(picked + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  const stored = await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('byteroots-profiles'));
    const row = p.list.ptest;
    return { freezes: row.freezes, gems: row.gems, name: row.name, active: p.active };
  });
  expect(stored.name).toBe('Ada');
  expect(stored.active).toBe('ptest');
  expect(stored.freezes).toBe(1);
  expect(stored.gems).toBe(150);
  await other.close();
});

test('weak-spot practice does not add a miss for a wrong answer', async ({ page }, testInfo) => {
  page.on('dialog', (d) => d.accept());
  await boot(page, testInfo, { profile: { name: 'Ada' } });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await page.evaluate(() => {
    const e = window.__BR.cur();
    const wrong = [...document.querySelectorAll('.opt')].find((o) => o.dataset.i !== String(e.a));
    wrong.click();
  });
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  await page.locator('#x').click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const before = await state(page);
  expect(before.misses['java.run']).toBe(1);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.locator('.weak').click();
  await expect(page.locator('#chk')).toBeVisible();
  await page.evaluate(() => {
    const e = window.__BR.cur();
    const wrong = [...document.querySelectorAll('.opt')].find((o) => o.dataset.i !== String(e.a));
    wrong.click();
  });
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  const mid = await state(page);
  expect(mid.misses['java.run']).toBe(1);
});

test('a corrupt doubleUntil does not stay active for a year', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { doubleUntil: Date.now() + 400 * 86400000 } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.doubleUntil).toBe(0);
  await expect(page.getByText(/Double XP active/)).toHaveCount(0);
});

test('corrupt profile JSON boots a new profile', async ({ page }, testInfo) => {
  await boot(page, testInfo, { raw: '{' });
  await expect(page.getByRole('heading', { name: /Welcome to ByteRyte/ })).toBeVisible();
});

test('a profile list that is an array boots a new profile', async ({ page }, testInfo) => {
  await boot(page, testInfo, { raw: '[]' });
  await expect(page.getByRole('heading', { name: /Welcome to ByteRyte/ })).toBeVisible();
});

test('an impossible heartDay still opens the path', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { heartDay: '2026-02-31', last: '2026-02-31', streak: 4, hearts: 1 } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.hearts).toBeGreaterThan(0);
  expect(s.heartDay).not.toBe('2026-02-31');
  expect(s.last).toBe(null);
});
