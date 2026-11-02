import { test, expect } from './console.js';
import { boot, state } from './helpers.js';

async function fresh(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('br-fresh')) return;
    sessionStorage.setItem('br-fresh', '1');
    localStorage.removeItem('byteroots-profiles');
    localStorage.setItem('byteroots-settings', JSON.stringify({ theme: 'light', sound: false, motion: false }));
  });
  await page.goto('./');
}

test('a new user sees the welcome, answers the survey, and lands on that course and goal', async ({ page }) => {
  await fresh(page);
  await expect(page.getByRole('button', { name: 'Get started' })).toBeFocused();
  await expect(page.locator('[aria-live="polite"]')).toHaveText("hello, world. welcome to ByteRyte. let's write some code");
  await expect(page.locator('.term')).toHaveAttribute('aria-hidden', 'true');
  await page.getByRole('button', { name: 'Get started' }).click();

  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Question 1 of 4' })).toHaveAttribute('aria-valuenow', '1');
  const career = page.getByRole('checkbox', { name: /Career/ });
  const build = page.getByRole('checkbox', { name: /Build an app/ });
  await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
  await career.focus();
  await page.keyboard.press('Enter');
  await expect(career).toHaveAttribute('aria-checked', 'true');
  await build.click();
  await expect(build).toHaveAttribute('aria-checked', 'true');
  await career.click();
  await expect(career).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
  await career.click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'How much coding experience do you have?' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
  await page.getByRole('checkbox', { name: /Career/ }).click();
  await page.getByRole('checkbox', { name: /Build an app/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'New to coding' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('heading', { name: 'What do you want to learn first?' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Question 3 of 4' })).toBeVisible();
  await page.getByRole('button', { name: /^Swift\./ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Want to add another?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'What is your daily goal?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip question' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Intense/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: "You're all set" })).toBeVisible();
  await expect(page.getByText('Swift, 20 min a day. Learning for: career, building apps.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start from scratch' }).click();

  await expect(page.getByText('0 / 150 XP')).toBeVisible();
  await expect(page.locator('.tab.on')).toContainText('Swift');
  const saved = await page.evaluate(() => ({ track: window.__BR.S.track, goal: window.__BR.S.goal, why: window.__BR.S.why, exp: window.__BR.S.exp }));
  expect(saved).toEqual({ track: 'swift', goal: 150, why: ['career', 'app'], exp: 'new' });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByText('Learning for: career, building apps')).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '20 XP' }).click();
  await expect(page.getByRole('radio', { name: '20 XP' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByText('0 / 20 XP')).toBeVisible();
  await page.reload();
  await expect(page.getByText('0 / 20 XP')).toBeVisible();
  expect((await state(page)).goal).toBe(20);
  expect(await page.evaluate(() => window.__BR.S.why)).toEqual(['career', 'app']);
});

test('cosmetic questions can be skipped and do not change the course', async ({ page }) => {
  await fresh(page);
  await page.locator('.term').click();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip question' }).click();
  await page.getByRole('button', { name: 'Skip question' }).click();
  await page.getByRole('button', { name: /^Java\./ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: /^Regular/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Java, 10 min a day.')).toBeVisible();
  await expect(page.getByText(/Learning for:/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start from scratch' }).click();
  await expect(page.getByText('0 / 50 XP')).toBeVisible();
  await expect(page.locator('.tab.on')).toContainText('Java');
  const saved = await page.evaluate(() => ({ why: window.__BR.S.why, exp: window.__BR.S.exp, goal: window.__BR.S.goal, track: window.__BR.S.track }));
  expect(saved.goal).toBe(50);
  expect(saved.track).toBe('java');
  expect(saved.why || []).toEqual([]);
  expect(saved.exp || '').toBe('');
});

test('reduced motion shows the welcome complete, with no typing', async ({ page }) => {
  await fresh(page);
  const lines = page.locator('#lines');
  await expect(lines).toContainText('hello, world');
  await expect(lines).toContainText('welcome to ByteRyte');
  await expect(lines).toContainText("let's write some code");
  const font = await page.locator('.term').evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font.toLowerCase()).toContain('monospace');
  const before = await lines.innerText();
  await page.waitForTimeout(350);
  expect(await lines.innerText()).toBe(before);
  expect(await page.locator('.caret').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  await expect(page.getByRole('button', { name: 'Get started' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
});

test('motion types the welcome one line at a time', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await fresh(page);
  await page.getByRole('button', { name: 'Skip', exact: true }).waitFor();
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-reduce'))).toBe(false);
  const early = await page.locator('#lines').innerText();
  expect(early).not.toContain("let's write some code");
  await expect(page.locator('[aria-live="polite"]')).toHaveText("hello, world. welcome to ByteRyte. let's write some code");
  await page.waitForTimeout(200);
  expect((await page.locator('#lines').innerText()).length).toBeGreaterThan(early.length);
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#lines')).toContainText("let's write some code");
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toHaveCount(0);
  await page.waitForTimeout(1500);
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Get started' }).focus();
  await page.keyboard.press(' ');
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
});

test('an existing profile skips the welcome and keeps its goal', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 40, goal: 30, done: { 'java.run': true }, track: 'java' } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Get started' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toHaveCount(0);
  expect(await page.evaluate(() => ({ xp: window.__BR.S.xp, run: !!window.__BR.S.done['java.run'], goal: window.__BR.S.goal, track: window.__BR.S.track }))).toEqual({ xp: 40, run: true, goal: 30, track: 'java' });
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('radio', { name: '30 XP' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: '100 XP' }).click();
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByText('0 / 100 XP')).toBeVisible();
  await page.reload();
  await expect(page.getByText('0 / 100 XP')).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.xp)).toBe(40);
  expect((await state(page)).goal).toBe(100);
});

test('the welcome stays after typing until Get started is pressed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await fresh(page);
  await page.getByRole('button', { name: 'Get started' }).waitFor({ timeout: 8000 });
  await expect(page.locator('#lines')).toContainText("let's write some code");
  await expect(page.getByRole('button', { name: 'Skip', exact: true })).toBeHidden();
  await page.waitForTimeout(1500);
  await page.locator('.term').click();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Why do you want to learn to code?' })).toBeVisible();
});

test('a saved reason string becomes one list item', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 8, onboarded: true, why: 'app' } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.why)).toEqual(['app']);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByText('Learning for: building apps')).toBeVisible();
});

test('several reasons stay in order and a long line is shortened', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 8, onboarded: true, why: ['nope', 'app', 'career', 'career'] } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.why)).toEqual(['career', 'app']);
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 8, onboarded: true, why: ['other', 'curiosity', 'interviews', 'app', 'school', 'career'] } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  const line = await page.getByText(/Learning for:/).innerText();
  expect(line.startsWith('Learning for: career, school, building apps')).toBe(true);
  expect(line.endsWith('…')).toBe(true);
  expect(line).not.toContain('curiosity');
});
