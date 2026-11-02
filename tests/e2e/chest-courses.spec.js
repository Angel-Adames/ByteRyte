import { test, expect } from './console.js';
import { boot, passCoursePick } from './helpers.js';

function ymd(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const rank = { common: 0, rare: 1, epic: 2, legendary: 3 };

test('reroll odds move 5 points off common and a roll never gets worse', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  const result = await page.evaluate(() => {
    const { odds, draw, keep, rng } = window.__BR.loot;
    const oddsSeq = [0, 1, 2, 3].map(odds);
    const a = rng(20260315);
    const b = rng(20260315);
    const first = [draw(a, 0), draw(b, 0)];
    const r = rng(99);
    let best = null;
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const n = draw(r, Math.min(3, i));
      best = keep(best, n);
      rows.push({ roll: n, kept: { tier: best.tier, gems: best.gems } });
    }
    return { oddsSeq, same: first[0].tier === first[1].tier && first[0].gems === first[1].gems, rows };
  });
  expect(result.oddsSeq).toEqual([[50, 30, 15, 5], [45, 32, 17, 6], [40, 34, 19, 7], [35, 36, 21, 8]]);
  expect(result.same).toBe(true);
  let prev = null;
  for (const row of result.rows) {
    expect(rank[row.kept.tier]).toBeGreaterThanOrEqual(rank[row.roll.tier]);
    if (row.kept.tier === row.roll.tier) expect(row.kept.gems).toBeGreaterThanOrEqual(row.roll.gems);
    if (prev) {
      expect(rank[row.kept.tier]).toBeGreaterThanOrEqual(rank[prev.tier]);
      if (row.kept.tier === prev.tier) expect(row.kept.gems).toBeGreaterThanOrEqual(prev.gems);
    }
    prev = row.kept;
  }
});

test('the daily chest pays once, then not again the same day', async ({ page }, testInfo) => {
  const today = ymd();
  await boot(page, testInfo, { profile: { gems: 20, goal: 10, goalDay: today, xpLog: { [today]: 10 } } });
  await page.evaluate((today) => {
    const raw = JSON.parse(localStorage.getItem('byteroots-profiles'));
    const p = raw.list.ptest;
    p.gems = 20;
    p.goal = 10;
    p.goalDay = today;
    p.xpLog[today] = 10;
    p.qd = { day: today, ids: ['xp', 'lessons', 'review'], p: { lessons: 2, review: 1 }, claimed: { xp: 1, lessons: 1, review: 1 }, chest: false };
    localStorage.setItem('byteroots-profiles', JSON.stringify(raw));
  }, today);
  await page.reload();
  expect(await page.evaluate(() => window.__BR.S.gems)).toBe(20);
  await page.getByRole('button', { name: 'Open chest' }).click();
  await expect(page.locator('#loot')).toHaveAttribute('data-calm', '1');
  await expect(page.locator('#loot h2')).toBeVisible();
  expect(await page.locator('#loot .lid').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
  const shown = Number((await page.locator('#loot .gems').innerText()).replace(/\D/g, ''));
  expect(shown).toBeGreaterThan(0);
  await expect(page.locator('#codds')).toContainText('Common 45%');
  await page.getByRole('button', { name: /Reroll/ }).click();
  await expect(page.locator('#codds')).toContainText('Common 40%');
  const after = await page.evaluate(() => window.__BR.S.qd.loot);
  expect(after.used).toBe(1);
  expect(after.gems).toBeGreaterThanOrEqual(shown);
  expect(rank[after.tier]).toBeGreaterThanOrEqual(rank[(await page.locator('#loot').getAttribute('data-tier'))]);
  await page.getByRole('button', { name: 'Keep' }).click();
  await expect(page.getByRole('heading', { name: 'Kept' })).toBeVisible();
  const gems = await page.evaluate(() => window.__BR.S.gems);
  expect(gems).toBe(20 + after.gems);
  await page.reload();
  expect(await page.evaluate(() => window.__BR.S.gems)).toBe(gems);
  expect(await page.evaluate(() => window.__BR.S.qd.loot.claimed)).toBe(true);
  await expect(page.locator('.openchest')).toHaveCount(0);
});

test('a new profile picks courses and an existing profile keeps its path', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.removeItem('byteroots-profiles'));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Skip welcome' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip welcome' }).click();
  await page.getByRole('button', { name: 'Skip question' }).click();
  await page.getByRole('button', { name: 'Skip question' }).click();
  await expect(page.getByRole('heading', { name: 'What do you want to learn first?' })).toBeVisible();
  await expect(page.getByText('Daily goal', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: /^Swift\./ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /^Java\./ }).click();
  await page.getByRole('button', { name: 'Add these' }).click();
  await expect(page.getByRole('heading', { name: 'What is your daily goal?' })).toBeVisible();
  const picked = await page.evaluate(() => ({ track: window.__BR.S.track, courses: window.__BR.S.courses.slice(), onboarded: window.__BR.S.onboarded }));
  expect(picked.track).toBe('swift');
  expect(picked.courses).toEqual(['swift', 'java']);
  expect(picked.onboarded).toBe(false);

  await boot(page, testInfo, { profile: { name: 'Ada', xp: 40, done: { 'java.run': true, 'swift.basics': true }, track: 'java' } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip welcome' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'What do you want to learn first?' })).toHaveCount(0);
  const kept = await page.evaluate(() => ({ xp: window.__BR.S.xp, run: !!window.__BR.S.done['java.run'], courses: window.__BR.S.courses.slice(), track: window.__BR.S.track }));
  expect(kept).toEqual({ xp: 40, run: true, courses: ['java', 'swift'], track: 'java' });

  await page.getByRole('button', { name: /Courses/ }).click();
  await page.getByRole('menuitem', { name: 'Add a course' }).click();
  await page.getByRole('button', { name: /^HTML & CSS\./ }).click();
  await page.getByRole('button', { name: 'Add these' }).click();
  await expect(page.locator('.tab.on')).toContainText('HTML');
  await page.getByRole('button', { name: /Courses/ }).click();
  await page.locator('#cmenu [data-course="java"]').click();
  await expect(page.locator('.tab.on')).toContainText('Java');
  expect(await page.evaluate(() => window.__BR.S.xp)).toBe(40);
});
