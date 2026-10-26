import { test, expect } from './console.js';
import { boot, state, overflow } from './helpers.js';

const ESSENTIALS = {
  'swift.basics': true,
  'swift.values': true,
  'swift.errors': true,
  'swift.protocols': true,
  'swift.enums': true,
};

async function openBasics(page) {
  await page.getByRole('tab', { name: /Swift/ }).click();
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
}

async function untilCanon(page, canon) {
  await page.evaluate((canon) => {
    const $ = (s) => document.querySelector(s);
    let guard = 0;
    while (guard++ < 40) {
      const e = window.__BR.cur();
      if (e && e.t === 'type' && e.canon === canon) return;
      if (!e || !$('#chk')) throw new Error('no question before ' + canon);
      if (e.t === 'ar') {
        for (const line of e.lines) {
          const chip = [...document.querySelectorAll('#bank .chip')].find((c) => c.dataset.raw === line);
          if (!chip) throw new Error('missing line');
          chip.click();
        }
      } else if (e.t === 'type') {
        const box = $('#typebox');
        box.value = e.canon;
        box.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.querySelector('.opt[data-i="' + e.a + '"]').click();
      }
      if ($('#chk').disabled) throw new Error('Check stayed disabled');
      $('#chk').click();
      if (!$('#cont')) throw new Error('no explanation');
      $('#cont').click();
    }
    throw new Error('did not reach ' + canon);
  }, canon);
  await expect(page.locator('#typebox')).toBeVisible();
}

async function playQuiz(page, plan) {
  await page.evaluate((plan) => {
    const $ = (s) => document.querySelector(s);
    for (const want of plan) {
      const e = window.__BR.cur();
      if (!e || !$('#chk')) throw new Error('quiz ended early');
      if (e.t === 'type') {
        const box = $('#typebox');
        box.value = want === 'right' ? e.canon : 'let nope = 0';
        box.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        const wrong = [...document.querySelectorAll('.opt')].map((o) => +o.dataset.i).find((i) => i !== e.a);
        document.querySelector('.opt[data-i="' + (want === 'right' ? e.a : wrong) + '"]').click();
      }
      $('#chk').click();
      if (!$('#cont')) throw new Error('no quiz feedback');
      $('#cont').click();
    }
  }, plan);
}

test('a typed canonical answer is accepted and a wrong answer shows the canonical line', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(testInfo.project.use.brTheme || 'light');
  await expect(page.getByRole('button', { name: /^Unit check/ })).toHaveCount(0);
  await openBasics(page);
  await untilCanon(page, 'let x = 5');
  const box = page.locator('#typebox');
  await expect(box).toHaveAttribute('spellcheck', 'false');
  await expect(box).toHaveAttribute('autocapitalize', 'none');
  await expect(box).toHaveAttribute('autocorrect', 'off');
  await expect(box).toHaveAttribute('autocomplete', 'off');
  const fontSize = await box.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(16);
  const family = await box.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(family.toLowerCase()).toMatch(/mono|menlo|consolas/);
  await expect(page.locator('#ff')).toBeDisabled();
  await expect(page.locator('#chk')).toBeDisabled();
  await box.fill('   ');
  await expect(page.locator('#chk')).toBeDisabled();
  await box.fill('let x = 5');
  await box.press('Enter');
  await expect(page.locator('#cont')).toHaveCount(0);
  await expect(page.locator('#chk')).toBeEnabled();
  expect(await overflow(page)).toEqual([]);
  const before = await state(page);
  await page.locator('#chk').click();
  await expect(page.locator('#ft')).toHaveClass(/ok/);
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toHaveCount(0);
  const afterRight = await state(page);
  expect(afterRight.hearts).toBe(before.hearts);
  expect(afterRight.gems).toBe(before.gems);
  await page.locator('#cont').click();
  await untilCanon(page, 'n += 1');
  await page.locator('#typebox').fill('let x = 6');
  await page.locator('#chk').click();
  await expect(page.getByRole('heading', { name: 'Not quite' })).toBeVisible();
  await expect(page.locator('#ft')).toContainText('n += 1');
  const ask = page.getByRole('button', { name: 'Ask Rytia why' });
  await expect(ask).toBeVisible();
  await expect(page.locator('#rytia-card')).toBeHidden();
  await ask.click();
  await expect(page.locator('#rytia-card')).toBeVisible();
  await expect(page.locator('.rytia-sum')).toContainText('n += 1');
  await expect(page.locator('#cont')).toBeVisible();
  const afterWrong = await state(page);
  expect(afterWrong.hearts).toBe(before.hearts - 1);
  expect(afterWrong.gems).toBe(before.gems);
  expect(afterWrong.xp).toBe(before.xp);
});

test('an accepted alternative grades as correct', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { track: 'swift' } });
  await openBasics(page);
  await untilCanon(page, 'let x = 5');
  const before = await state(page);
  await page.locator('#typebox').fill('let x: Int = 5');
  await page.locator('#chk').click();
  await expect(page.locator('#ft')).toHaveClass(/ok/);
  await expect(page.getByRole('button', { name: 'Ask Rytia why' })).toHaveCount(0);
  await expect(page.locator('#ft')).toContainText('let binds a constant');
  const after = await state(page);
  expect(after.hearts).toBe(before.hearts);
});

test('passing the Swift Essentials unit check awards gems once', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { track: 'swift', done: ESSENTIALS } });
  await expect(page.getByRole('button', { name: /Strings & Characters/ })).toBeDisabled();
  const before = await state(page);
  await page.getByRole('button', { name: /^Unit check$/ }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await playQuiz(page, ['right', 'right', 'right', 'right', 'right', 'right']);
  await expect(page.getByRole('heading', { name: 'Unit check passed' })).toBeVisible();
  await expect(page.getByText('6/6')).toBeVisible();
  await expect(page.getByText(/5 of 6 to pass/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry unit check' })).toHaveCount(0);
  const passed = await state(page);
  expect(passed.done).toContain('swift.essentials.quiz');
  expect(passed.gems).toBe(before.gems + 5);
  expect(passed.xp).toBe(before.xp + 22);
  expect(passed.hearts).toBe(before.hearts);
  await page.locator('#h').click();
  await expect(page.getByRole('button', { name: /Strings & Characters/ })).toBeEnabled();
  await page.getByRole('button', { name: /^Unit check \(complete\)$/ }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await playQuiz(page, ['right', 'right', 'right', 'right', 'right', 'right']);
  await expect(page.getByRole('heading', { name: 'Unit check passed' })).toBeVisible();
  const again = await state(page);
  expect(again.gems).toBe(passed.gems);
  expect(again.xp).toBe(passed.xp);
});

test('failing the unit check shows the score and a retry', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { track: 'swift', done: ESSENTIALS } });
  const before = await state(page);
  await page.getByRole('button', { name: /^Unit check$/ }).click();
  await playQuiz(page, ['wrong', 'wrong', 'right', 'right', 'right', 'right']);
  await expect(page.getByRole('heading', { name: 'Unit check not passed' })).toBeVisible();
  await expect(page.getByText('4/6')).toBeVisible();
  await expect(page.getByText(/Not passed · 5 of 6 to pass/)).toBeVisible();
  const failed = await state(page);
  expect(failed.done).not.toContain('swift.essentials.quiz');
  expect(failed.gems).toBe(before.gems);
  expect(failed.xp).toBe(before.xp);
  expect(failed.hearts).toBe(before.hearts - 2);
  await page.getByRole('button', { name: 'Retry unit check' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unit check not passed' })).toHaveCount(0);
});
