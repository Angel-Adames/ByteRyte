import { test, expect } from './console.js';
import { boot, state, overflow } from './helpers.js';

async function openFirst(page) {
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__BR.cur() && window.__BR.cur().q)).toBe('What does javac write?');
}

async function pick(page, correct) {
  return page.evaluate((correct) => {
    const e = window.__BR.cur();
    const opt = [...document.querySelectorAll('.opt')].find((o) => !o.disabled && (correct ? o.dataset.i === String(e.a) : o.dataset.i !== String(e.a)));
    if (!opt) throw new Error('no option');
    const i = opt.dataset.i;
    opt.click();
    return i;
  }, correct);
}

test('a wrong answer shows Ask Rytia why and the card stays closed until the tap', async ({ page }, testInfo) => {
  let quit = false;
  page.on('dialog', async (d) => { quit = true; await d.dismiss(); });
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(theme).toBe(testInfo.project.use.brTheme || 'light');
  await openFirst(page);
  const picked = await pick(page, false);
  await page.locator('#chk').click();
  const ask = page.getByRole('button', { name: 'Ask Rytia why' });
  await expect(ask).toBeVisible();
  await expect(page.locator('#rytia')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#rytia')).toHaveAttribute('aria-controls', 'rytia-card');
  await expect(page.locator('#rytia-card')).toBeHidden();
  await expect(page.locator('#rytia-card')).toHaveAttribute('aria-live', 'polite');
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#cont')).toBeFocused();
  const before = await state(page);
  await ask.click();
  await expect(page.locator('#rytia-card')).toBeVisible();
  await expect(page.locator('#rytia')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText('Rytia · your study helper')).toBeVisible();
  const revealed = await page.evaluate((picked) => {
    const btn = document.querySelector('#rytia');
    const row = window.RYTIA[btn.dataset.k];
    const text = document.querySelector('#rytia-card').textContent;
    return {
      key: btn.dataset.k,
      index: btn.dataset.i,
      summary: row.s,
      note: row.n[picked],
      hasSummary: text.includes(row.s),
      hasNote: text.includes(row.n[picked]),
      namesAnswer: row.s.includes('A .class file of bytecode'),
    };
  }, picked);
  expect(revealed.key).toBe('java.run~0');
  expect(revealed.index).toBe(picked);
  expect(revealed.hasSummary).toBe(true);
  expect(revealed.hasNote).toBe(true);
  expect(revealed.namesAnswer).toBe(true);
  expect(revealed.note.length).toBeGreaterThan(20);
  const after = await state(page);
  expect(after.hearts).toBe(before.hearts);
  expect(after.xp).toBe(before.xp);
  expect(after.gems).toBe(before.gems);
  expect(await overflow(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('#rytia-card')).toBeHidden();
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#x')).toBeVisible();
  expect(quit).toBe(false);
  await page.locator('#rytia').focus();
  await expect(page.locator('#rytia')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#rytia-card')).toBeVisible();
  await expect(page.locator('#cont')).toBeVisible();
  expect(quit).toBe(false);
  await page.getByRole('button', { name: 'Close Rytia' }).click();
  await expect(page.locator('#rytia-card')).toBeHidden();
});

test('Continue works without asking Rytia, and a correct answer has no button', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await openFirst(page);
  await pick(page, false);
  await page.locator('#chk').click();
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toBeVisible();
  await expect(page.locator('#rytia-card')).toBeHidden();
  await page.locator('#cont').click();
  await expect(page.locator('#chk')).toBeVisible();
  await expect(page.locator('#rytia')).toHaveCount(0);
  await expect(page.locator('#rytia-card')).toHaveCount(0);
  await pick(page, true);
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#rytia')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toHaveCount(0);
  await page.locator('#cont').click();
  await expect(page.locator('#chk')).toBeVisible();
});

test('the Ask Rytia why setting hides the button', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  const toggle = page.getByRole('switch', { name: 'Ask Rytia why' });
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')).rytia);
  expect(stored).toBe(false);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await openFirst(page);
  await pick(page, false);
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#rytia')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toHaveCount(0);
  await page.locator('#cont').click();
  await expect(page.locator('#chk')).toBeVisible();
});

test('offline Ask Rytia why still shows the saved summary', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const cache = await caches.open('byteryte-v26');
    const urls = (await cache.keys()).map((r) => r.url);
    return urls.some((u) => u.endsWith('/rytia.js'));
  });
  expect(cached).toBe(true);
  await page.context().setOffline(true);
  await openFirst(page);
  const picked = await pick(page, false);
  await page.locator('#chk').click();
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toBeVisible();
  await expect(page.locator('#rytia-card')).toBeHidden();
  await page.getByRole('button', { name: 'Ask Rytia why' }).click();
  await expect(page.locator('#rytia-card')).toBeVisible();
  const revealed = await page.evaluate((picked) => {
    const row = window.RYTIA['java.run~0'];
    const text = document.querySelector('#rytia-card').textContent;
    return text.includes(row.s) && text.includes(row.n[picked]);
  }, picked);
  expect(revealed).toBe(true);
  await expect(page.locator('#cont')).toBeVisible();
});
