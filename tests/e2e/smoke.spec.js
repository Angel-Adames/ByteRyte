import { test, expect } from './console.js';
import { boot, overflow, answerSession, state } from './helpers.js';

test.beforeEach(async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
});

test('home shows the foundation path and accurate counts', async ({ page }) => {
  await expect(page.getByRole('tab', { name: /Main path · 0\/34/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: /HTML & CSS/ })).toContainText('0/10');
  await expect(page.getByRole('tab', { name: /JavaFX/ })).toContainText('0/8');
  await expect(page.getByRole('tab', { name: /Swift/ })).toContainText('0/10');
  await expect(page.getByText('How a Program Runs').first()).toBeVisible();
  await expect(page.getByText('Unit 1 · Foundations')).toBeVisible();
  await expect(page.getByText('OpenJFX 21+')).toBeVisible();
  await expect(page.getByText('Gems stay in the app')).toBeVisible();
  expect(await overflow(page)).toEqual([]);
});

test('every screen opens in this theme and viewport', async ({ page }) => {
  const theme = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(['light', 'dark']).toContain(theme);
  for (const [name, heading] of [['Practice', 'Practice'], ['Interview', 'Mock Interview'], ['Shop', 'Gem Shop'], ['Profile', 'Ada']]) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    expect(await overflow(page)).toEqual([]);
  }
  await page.getByRole('button', { name: 'Interview', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Mock Interview' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Quick screen/ })).toBeVisible();
  await expect(page.locator('.tbtn').first()).toBeVisible();
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gem Shop' })).toBeVisible();
  await expect(page.getByText('no real money involved')).toBeVisible();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await expect(page.getByText(/Achievements · 0\//)).toBeVisible();
  await page.getByRole('button', { name: /Weekly recap/ }).click();
  await expect(page.getByRole('heading', { name: 'Weekly recap' })).toBeVisible();
  await page.getByRole('button', { name: /Back to profile/ }).click();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('1–9 choose an answer')).toBeVisible();
  expect(await overflow(page)).toEqual([]);
});

test('settings keep larger text, sound, and theme', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Larger text' }).click();
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-big', '');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-big', '');
  const sound = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')).sound);
  expect(sound).toBe(true);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual(['byteroots-profiles', 'byteroots-settings']);
});

test('guide, quit, and one correct answer', async ({ page }) => {
  await page.getByRole('button', { name: /Guide, Unit 1/ }).click();
  await expect(page.getByRole('heading', { name: /Unit 1 · Foundations/ })).toBeVisible();
  await expect(page.locator('.gcard')).toHaveCount(8);
  await page.getByRole('button', { name: /Back to path/ }).click();
  await page.locator('.node.cur').click();
  await expect(page.getByRole('heading', { name: 'How a Program Runs' })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Quit' }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.keyboard.press('1');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#ft')).toContainText(/Nice|Correct|You got it|Solid|Exactly|Not quite/);
  const s = await state(page);
  expect(s.hearts).toBeGreaterThan(0);
});

test('locked branches explain what they wait for', async ({ page }) => {
  await page.getByRole('tab', { name: /HTML & CSS/ }).click();
  await expect(page.getByText('types, strings, control flow, methods, and arrays')).toBeVisible();
  await page.getByRole('tab', { name: /JavaFX/ }).click();
  await expect(page.getByText('separate OpenJFX library')).toBeVisible();
  await page.getByRole('tab', { name: /Swift/ }).click();
  await expect(page.getByText('Basics & Optionals').first()).toBeVisible();
  await expect(page.locator('.branchbox')).toHaveCount(0);
});

test('body text and lesson labels meet contrast', async ({ page }) => {
  const home = await page.evaluate(() => {
    const ratio = (fg, bg) => {
      const lum = (c) => {
        const p = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
        return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
      };
      const a = lum(fg), b = lum(bg);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const app = getComputedStyle(document.querySelector('#app')).backgroundColor;
    const sample = (sel) => {
      const el = document.querySelector(sel);
      return ratio(getComputedStyle(el).color, app);
    };
    return { muted: sample('.note'), ink: sample('.h1, .goalcard b, b') };
  });
  expect(home.muted).toBeGreaterThan(4.5);
  expect(home.ink).toBeGreaterThan(4.5);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  const kind = await page.evaluate(() => {
    const lum = (c) => {
      const p = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
    };
    const el = document.querySelector('.kind');
    const fg = getComputedStyle(el).color;
    const bg = getComputedStyle(document.querySelector('#app')).backgroundColor;
    const a = lum(fg), b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(kind).toBeGreaterThan(4.5);
});

test('answering the open lesson records progress', async ({ page }) => {
  await page.locator('.node.cur').click();
  await answerSession(page);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.done).toContain('java.run');
  expect(s.lessons).toBe(1);
  expect(s.hearts).toBe(5);
  expect(s.xp).toBeGreaterThan(0);
});
