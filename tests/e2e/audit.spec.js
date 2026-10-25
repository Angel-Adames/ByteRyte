import { test, expect } from './console.js';
import { boot, state, answerSession } from './helpers.js';

async function revsMatch(page, other) {
  await expect.poll(async () => {
    const a = await page.evaluate(() => window.__BR.P().rev || 0);
    const b = await other.evaluate(() => window.__BR.P().rev || 0);
    return a === b ? a : 0;
  }).toBeGreaterThan(0);
}

async function answerOne(page) {
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
}

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

test('a lesson tab keeps xp and done from a lesson the other tab finished', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { xp: 0, name: 'Ada' } });
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await revsMatch(page, other);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await other.locator('.node.cur').click();
  await other.getByRole('button', { name: 'Start lesson' }).click();
  await answerSession(other);
  const finished = await other.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, done: !!row.done['java.run'], lessons: row.stats.lessons, streak: row.streak, last: row.last, badges: Object.keys(row.badges || {}), questLessons: (row.qd && row.qd.p && row.qd.p.lessons) || 0 };
  });
  expect(finished.done).toBe(true);
  expect(finished.xp).toBeGreaterThan(0);
  expect(finished.lessons).toBeGreaterThan(0);
  await answerOne(page);
  const stored = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, done: !!row.done['java.run'], lessons: row.stats.lessons, streak: row.streak, last: row.last, name: row.name, badges: Object.keys(row.badges || {}), questLessons: (row.qd && row.qd.p && row.qd.p.lessons) || 0 };
  });
  expect(stored.name).toBe('Ada');
  expect(stored.done).toBe(true);
  expect(stored.xp).toBe(finished.xp);
  expect(stored.lessons).toBe(finished.lessons);
  expect(stored.streak).toBe(finished.streak);
  expect(stored.last).toBe(finished.last);
  expect(finished.badges).toContain('first');
  expect(stored.badges).toEqual(expect.arrayContaining(finished.badges));
  expect(finished.questLessons).toBeGreaterThan(0);
  expect(stored.questLessons).toBe(finished.questLessons);
  await other.close();
});

test('two lesson tabs that each spend 50 gems keep both spends', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { gems: 200, freezes: 0, name: 'Ada' } });
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await revsMatch(page, other);
  for (const p of [page, other]) {
    await p.locator('.node.cur').click();
    await p.getByRole('button', { name: 'Start lesson' }).click();
    await expect(p.locator('#chk')).toBeVisible();
  }
  for (const p of [page, other]) {
    await p.evaluate(() => {
      const s = window.__BR.S;
      s.gems -= 50;
      s.freezes += 1;
    });
  }
  await answerOne(page);
  await answerOne(other);
  const stored = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { gems: row.gems, freezes: row.freezes };
  });
  expect(stored.freezes).toBe(2);
  expect(stored.gems).toBe(100);
  await other.close();
});

test('a wrong review answer counts a miss', async ({ page }, testInfo) => {
  await boot(page, testInfo, {
    profile: { misses: { 'java.run': 1 }, review: { 'java.run~0': { box: 0, due: 0 } } },
  });
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: /Review mistakes/ }).click();
  await expect(page.locator('#chk')).toBeVisible();
  const key = await page.evaluate(() => {
    const e = window.__BR.cur();
    const wrong = [...document.querySelectorAll('.opt')].find((o) => o.dataset.i !== String(e.a));
    wrong.click();
    return e.q;
  });
  expect(key.length).toBeGreaterThan(0);
  await page.locator('#chk').click();
  await expect(page.locator('#cont')).toBeVisible();
  const mid = await state(page);
  expect(mid.misses['java.run']).toBe(2);
  expect(mid.hearts).toBe(5);
});

test('an impossible last is dropped and the streak number stays', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { last: '2026-02-31', streak: 4, best: 4, hearts: 5 } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.last).toBe(null);
  expect(s.streak).toBe(4);
  await expect(page.getByLabel('4 day streak')).toBeVisible();
});

test('doubleUntil on the 30-day line stays and one 15-minute step past it clears', async ({ page }, testInfo) => {
  const cap = 30 * 864e5;
  const step = 15 * 60 * 1000;
  const kept = Date.now() + cap;
  await boot(page, testInfo, { profile: { doubleUntil: kept } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const onLine = await state(page);
  expect(onLine.doubleUntil).toBe(kept);
  const other = await page.context().newPage();
  await boot(other, testInfo, { profile: { doubleUntil: Date.now() + cap + step } });
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  const past = await state(other);
  expect(past.doubleUntil).toBe(0);
  await expect(other.getByText(/Double XP active/)).toHaveCount(0);
  await other.close();
});

test('a lesson tab does not restore progress the other tab reset', async ({ page }, testInfo) => {
  await boot(page, testInfo, {
    profile: {
      name: 'Ada', xp: 80, streak: 2, best: 2,
      done: { 'java.run': true },
      badges: { first: 1 },
      stats: { lessons: 1, answered: 8, correct: 8 },
    },
  });
  const other = await page.context().newPage();
  other.on('dialog', (d) => d.accept());
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await revsMatch(page, other);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  await other.getByRole('button', { name: 'Settings', exact: true }).click();
  await other.getByRole('button', { name: "Reset Ada's progress" }).click();
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  const cleared = await other.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, done: !!row.done['java.run'], badges: Object.keys(row.badges || {}), name: row.name };
  });
  expect(cleared.done).toBe(false);
  expect(cleared.xp).toBe(0);
  expect(cleared.badges).toEqual([]);
  expect(cleared.name).toBe('Ada');
  await answerOne(page);
  const stored = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, done: !!row.done['java.run'], badges: Object.keys(row.badges || {}), name: row.name, gen: row.gen || 0 };
  });
  expect(stored.name).toBe('Ada');
  expect(stored.done).toBe(false);
  expect(stored.xp).toBe(0);
  expect(stored.badges).toEqual([]);
  expect(stored.gen).toBeGreaterThan(0);
  await other.close();
});

test('a newer quest day from the other tab replaces a stale quest day', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada' } });
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await revsMatch(page, other);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  const planted = await other.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('byteroots-profiles'));
    const row = raw.list.ptest;
    row.qd.day = '2099-06-01';
    row.qd.p = { lessons: 1 };
    raw.rev = (raw.rev || 0) + 1;
    localStorage.setItem('byteroots-profiles', JSON.stringify(raw));
    return row.qd.day;
  });
  await page.evaluate(() => {
    const q = window.__BR.S.qd;
    q.day = '2020-01-01';
    q.p = { lessons: 9 };
  });
  const picked = await page.evaluate(() => {
    const e = window.__BR.cur();
    const opts = [...document.querySelectorAll('.opt')].filter((o) => !o.disabled);
    const hit = opts.find((o) => o.dataset.i !== String(e.a));
    if (!hit) return -1;
    return opts.indexOf(hit);
  });
  expect(picked).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(picked + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  const stored = await page.evaluate(() => {
    const q = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest.qd;
    return { day: q && q.day, lessons: (q && q.p && q.p.lessons) || 0 };
  });
  expect(stored.day).toBe(planted);
  expect(stored.lessons).toBe(1);
  await other.close();
});

test('an offline failed script fetch is not answered with the page HTML', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.context().setOffline(true);
  const result = await page.evaluate(async () => {
    try {
      const res = await fetch('./not-a-real-asset.js', { cache: 'no-store' });
      const text = await res.text();
      return { ok: res.ok, status: res.status, type: res.headers.get('content-type'), html: /<html/i.test(text), start: text.slice(0, 60) };
    } catch (e) {
      return { error: String(e) };
    }
  });
  expect(result.error).toBeTruthy();
  expect(result.html).toBeUndefined();
});

test('an impossible heartDay still opens the path', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { heartDay: '2026-02-31', last: '2026-02-31', streak: 4, hearts: 1 } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.hearts).toBeGreaterThan(0);
  expect(s.heartDay).not.toBe('2026-02-31');
  expect(s.last).toBe(null);
});
