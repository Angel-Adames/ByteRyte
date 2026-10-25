import { test, expect } from './console.js';
import { boot, answerSession, state, isDeep, overflow, themeOf } from './helpers.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

function deep(name, fn) {
  test(name, async ({ page }, testInfo) => {
    test.skip(!isDeep(testInfo), 'deep pass runs on all four projects');
    await fn({ page, testInfo });
  });
}

deep('levels follow the xp curve and huge xp still renders', async ({ page, testInfo }) => {
  await boot(page, testInfo, { profile: { xp: 100 } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('.lvl').getByText('Level 2', { exact: true })).toBeVisible();
  await expect(page.locator('.lvl').getByText('150 XP to level 3')).toBeVisible();
  await boot(page, testInfo, { profile: { xp: 249 } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('.lvl').getByText('1 XP to level 3')).toBeVisible();
  await boot(page, testInfo, { profile: { xp: 250 } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('.lvl').getByText('Level 3', { exact: true })).toBeVisible();
  await expect(page.locator('.lvl').getByText('200 XP to level 4')).toBeVisible();
  await boot(page, testInfo, { profile: { xp: 1e20, gems: 1e20, streak: 1e20, hearts: 'no', goal: 0, name: '<img src=x onerror="window.__xss=1">', avatar: '<svg onload="window.__xss=1">' } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('.lvl').getByText(/Level /)).toBeVisible();
  const s = await state(page);
  expect(s.xp).toBe(1e9);
  expect(s.gems).toBe(1e9);
  expect(s.streak).toBe(100000);
  expect(s.hearts).toBe(5);
  expect(s.goal).toBe(30);
  expect(await page.evaluate(() => window.__xss)).toBeFalsy();
  expect(await page.locator('img, svg').count()).toBe(0);
  expect(await overflow(page)).toEqual([]);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByLabel(/1000000000 gems|1000000000 gems/)).toBeVisible();
  expect(await overflow(page)).toEqual([]);
});

deep('hearts regenerate, refill at midnight, and block lessons at zero', async ({ page, testInfo }) => {
  const noon = new Date('2026-06-15T12:00:00');
  await page.clock.install({ time: noon });
  await boot(page, testInfo, { profile: { hearts: 2, heartAt: noon.getTime() - 31 * 60 * 1000, heartDay: '2026-06-15' } });
  expect((await state(page)).hearts).toBe(3);

  await boot(page, testInfo, { profile: { hearts: 0, heartDay: '2026-06-14', heartAt: noon.getTime() } });
  expect((await state(page)).hearts).toBe(5);
  expect((await state(page)).heartDay).toBe('2026-06-15');

  await boot(page, testInfo, { profile: { hearts: 0, heartDay: '2026-06-15' } });
  await page.locator('.node').first().click();
  await expect(page.getByRole('heading', { name: 'Out of hearts' })).toBeVisible();
  await page.getByRole('button', { name: 'Practice mistakes instead' }).click();
  await expect(page.getByRole('heading', { name: 'Practice' })).toBeVisible();
  await page.getByRole('button', { name: 'Interview', exact: true }).click();
  await page.getByRole('button', { name: /Quick screen/ }).click();
  await expect(page.locator('.q, #go, .kind').first()).toBeVisible();
  expect((await state(page)).hearts).toBe(0);
});

deep('streak freeze covers one missed day and resets when it cannot', async ({ page, testInfo }) => {
  const noon = new Date('2026-06-15T12:00:00');
  await page.clock.install({ time: noon });
  await boot(page, testInfo, { profile: { last: '2026-06-13', streak: 4, best: 4, freezes: 1, heartDay: '2026-06-15' } });
  let s = await state(page);
  expect(s.streak).toBe(4);
  expect(s.freezes).toBe(0);
  expect(s.last).toBe('2026-06-14');

  await boot(page, testInfo, { profile: { last: '2026-06-13', streak: 4, freezes: 0, heartDay: '2026-06-15' } });
  s = await state(page);
  expect(s.streak).toBe(0);
  expect(s.last).toBe('2026-06-13');

  await boot(page, testInfo, { profile: { last: '2026-06-14', streak: 4, freezes: 0, heartDay: '2026-06-15' } });
  s = await state(page);
  expect(s.streak).toBe(4);
  expect(s.last).toBe('2026-06-14');
});

deep('shop buys every power-up and refuses an empty wallet', async ({ page, testInfo }) => {
  await boot(page, testInfo, { profile: { hearts: 3, gems: 400, freezes: 0, inv: { fifty: 1, skip: 1 } } });
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page.getByRole('button', { name: /Heart refill/ }).click();
  await page.getByRole('button', { name: /Streak freeze/ }).click();
  await page.getByRole('button', { name: /50\/50 hint/ }).click();
  await page.getByRole('button', { name: /Skip question/ }).click();
  await page.getByRole('button', { name: /Double XP/ }).click();
  let s = await state(page);
  expect(s.hearts).toBe(5);
  expect(s.freezes).toBe(1);
  expect(s.fifty).toBe(4);
  expect(s.skip).toBe(3);
  expect(s.doubleUntil).toBeGreaterThan(Date.now());
  expect(s.gems).toBe(400 - 30 - 50 - 20 - 25 - 40);
  expect(s.bought).toBe(5);
  await expect(page.getByRole('button', { name: /Heart refill: Full/ })).toBeDisabled();
  await page.waitForTimeout(420);
  await page.getByRole('button', { name: /Streak freeze/ }).click();
  expect((await state(page)).freezes).toBe(2);
  expect((await state(page)).gems).toBe(400 - 30 - 50 - 20 - 25 - 40 - 50);
  await expect(page.getByRole('button', { name: /Streak freeze: Max/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByText('Double XP active')).toBeVisible();
  await expect(page.getByText(/streak freeze/)).toBeVisible();

  await boot(page, testInfo, { profile: { gems: 0, hearts: 5, freezes: 2 } });
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  for (const name of [/Heart refill/, /Streak freeze/, /50\/50 hint/, /Skip question/, /Double XP/]) {
    await expect(page.getByRole('button', { name })).toBeDisabled();
  }
});

deep('50/50, skip, and number keys ignore eliminated choices', async ({ page, testInfo }) => {
  await boot(page, testInfo, { profile: { inv: { fifty: 1, skip: 1 }, hearts: 5 } });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  const before = await page.locator('.q').innerText();
  await page.keyboard.press('s');
  await expect(page.locator('.q')).not.toHaveText(before);
  expect((await state(page)).hearts).toBe(5);
  expect((await state(page)).skip).toBe(0);
  await page.keyboard.press('h');
  const gone = await page.locator('.opt.gone').count();
  expect(gone).toBeGreaterThan(0);
  await page.keyboard.press('1');
  const selected = page.locator('.opt.sel');
  await expect(selected).toBeVisible();
  await expect(selected).not.toHaveClass(/gone/);
  await expect(selected.locator('kbd')).toHaveText('1');
});

deep('a second click does not skip the explanation', async ({ page, testInfo }) => {
  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.locator('.opt').first().click();
  const box = await page.locator('#chk').boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#ft p').last()).not.toHaveText('');
});

deep('review, saved questions, and a speed challenge', async ({ page, testInfo }) => {
  const noon = new Date('2026-06-15T12:00:00');
  await page.clock.install({ time: noon });
  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.evaluate(() => {
    const e = window.__BR.cur();
    const opt = [...document.querySelectorAll('.opt')].find((o) => +o.dataset.i !== e.a);
    opt.click();
    document.querySelector('#chk').click();
  });
  await expect(page.getByText('Not quite')).toBeVisible();
  await page.locator('#bm').click();
  await expect(page.locator('#bm')).toHaveAttribute('aria-pressed', 'true');
  await answerSession(page);
  let s = await state(page);
  expect(s.hearts).toBe(4);
  expect(s.misses['java.run']).toBe(1);
  expect(Object.keys(s.saved).length).toBe(1);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('button', { name: /Review mistakes/ })).toBeEnabled();
  await page.getByRole('button', { name: /Review mistakes/ }).click();
  await answerSession(page);
  s = await state(page);
  expect(s.hearts).toBe(5);
  expect(s.reviews).toBe(1);
  expect(s.review['java.run~0'].box).toBe(1);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.getByRole('button', { name: /Review mistakes/ })).toBeDisabled();
  await page.getByRole('button', { name: /Saved questions/ }).click();
  await answerSession(page);
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await page.getByRole('button', { name: 'Remove from saved' }).click();
  await expect(page.getByRole('button', { name: /Saved questions/ })).toBeDisabled();
  await page.getByRole('button', { name: /Speed challenge/ }).click();
  await expect(page.locator('#tmr')).toBeVisible();
  await page.clock.fastForward(70000);
  await expect(page.getByRole('heading', { name: /Time/ })).toBeVisible();
});

deep('replaying a lesson does not inflate the lesson count', async ({ page, testInfo }) => {
  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await answerSession(page);
  const first = await state(page);
  expect(first.lessons).toBe(1);
  await page.locator('.node.done').first().click();
  await answerSession(page);
  const second = await state(page);
  expect(second.lessons).toBe(1);
  expect(second.done).toContain('java.run');
  expect(second.xp).toBeGreaterThan(first.xp);
});

deep('placement opens HTML and CSS only', async ({ page, testInfo }) => {
  await boot(page, testInfo, { profile: { onboarded: false, name: 'Ada' } });
  await expect(page.getByRole('button', { name: /Take placement test/ })).toBeVisible();
  await page.getByRole('button', { name: /Take placement test/ }).click();
  await answerSession(page);
  const s = await state(page);
  expect(s.done).toEqual(expect.arrayContaining(['java.types', 'java.strings', 'java.control', 'java.methods', 'java.arrays']));
  expect(s.done).not.toContain('java.run');
  expect(s.gates.css).toBe(true);
  expect(s.gates.javafx).toBeFalsy();
  await page.getByRole('tab', { name: /HTML & CSS/ }).click();
  await expect(page.getByText('How the Browser Paints').first()).toBeVisible();
  await expect(page.locator('.node.cur')).toHaveCount(1);
  await page.getByRole('tab', { name: /JavaFX/ }).click();
  await expect(page.getByText('separate OpenJFX library')).toBeVisible();
});

deep('old index saves migrate and keep the storage keys', async ({ page, testInfo }) => {
  const raw = JSON.stringify({
    active: 'old',
    list: {
      old: {
        id: 'old', name: 'Old', avatar: '🐼', onboarded: true, xp: 12, hearts: 4, goal: 30, track: 'java',
        done: { 'java-0-0': 1, 'java-0-1': 1, 'java-0-2': 1, 'java-0-3': 1, 'java-0-4': 1, 'java-2-3': 1 },
        review: { 'java-1-3-7': { box: 0, due: 1 } },
        misses: { 'css-0-1': 2 },
        saved: { 'swift-1-2-8': 9, 'iv-3': 4 },
      },
    },
  });
  await boot(page, testInfo, { raw });
  const s = await state(page);
  expect(s.curriculum).toBe(2);
  expect(s.done).toEqual(expect.arrayContaining(['java.types', 'java.strings', 'java.control', 'java.methods', 'java.arrays', 'java.records']));
  expect(s.done).not.toContain('java.run');
  expect(s.gates.css).toBe(true);
  expect(s.gates.javafx).toBe(true);
  expect(s.review['java.refs~7'].box).toBe(0);
  expect(s.misses['css.box']).toBe(2);
  expect(s.saved['swift.lists~8']).toBe(9);
  expect(s.saved['iv-3']).toBe(4);
  const keys = await page.evaluate(() => Object.keys(localStorage).sort());
  expect(keys).toEqual(['byteroots-profiles', 'byteroots-settings']);
  await page.getByRole('tab', { name: /HTML & CSS/ }).click();
  await expect(page.locator('.branchbox')).toHaveCount(0);
  await page.getByRole('tab', { name: /JavaFX/ }).click();
  await expect(page.getByText('App Lifecycle & Scene Graph').first()).toBeVisible();
});

deep('legacy single-profile save becomes a profile', async ({ page, testInfo }) => {
  await page.addInitScript(() => {
    localStorage.removeItem('byteroots-profiles');
    localStorage.setItem('byteroots-v1', JSON.stringify({ xp: 42, streak: 3, done: {}, track: 'java', last: Date.now() }));
    localStorage.setItem('byteroots-settings', JSON.stringify({ theme: 'light', sound: false, big: false }));
  });
  await page.goto('./');
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).xp).toBe(42);
  expect((await state(page)).streak).toBe(3);
});

deep('legacy single-profile positional keys migrate', async ({ page, testInfo }) => {
  await page.addInitScript(({ theme }) => {
    localStorage.removeItem('byteroots-profiles');
    localStorage.setItem('byteroots-v1', JSON.stringify({
      xp: 7, streak: 1, track: 'java', last: Date.now(),
      done: { 'java-0-0': 1, 'java-0-1': 1, 'java-0-2': 1, 'java-0-3': 1, 'java-0-4': 1 },
      review: { 'css-0-2-1': { box: 2 } },
      misses: { 'swift-1-0': 4 },
      saved: { 'javafx-1-2-3': 8 },
    }));
    localStorage.setItem('byteroots-settings', JSON.stringify({ theme, sound: false, big: false }));
  }, themeOf(testInfo));
  await page.goto('./');
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.xp).toBe(7);
  expect(s.curriculum).toBe(2);
  expect(s.done).toEqual(expect.arrayContaining(['java.types', 'java.strings', 'java.control', 'java.methods', 'java.arrays']));
  expect(s.done).not.toContain('java.run');
  expect(s.gates.css).toBe(true);
  expect(s.gates.javafx).toBe(true);
  expect(s.review['css.flex~1'].box).toBe(2);
  expect(s.misses['swift.strings']).toBe(4);
  expect(s.saved['fx.lists~3']).toBe(8);
});

deep('canceling profile edit keeps the previous daily goal', async ({ page, testInfo }) => {
  await boot(page, testInfo, { profile: { goal: 30 } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.locator('#edit2').click();
  await page.getByRole('button', { name: /Intense/ }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect((await state(page)).goal).toBe(30);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).goal).toBe(30);
});

deep('profiles can be created, switched, and deleted', async ({ page, testInfo }) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Add profile' }).click();
  await page.locator('#nm').fill('Sam');
  await page.getByRole('button', { name: 'Start from scratch' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sam' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await page.getByRole('button', { name: 'Switch' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.locator('#edit2').click();
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Delete this profile' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await page.locator('#edit2').click();
  await expect(page.getByRole('button', { name: 'Delete this profile' })).toHaveCount(0);
});

deep('export and import round-trip, including the same file twice', async ({ page, testInfo }) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export/ }).click();
  const download = await downloadPromise;
  const file = path.join(os.tmpdir(), 'byteryte-backup.json');
  await download.saveAs(file);
  const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(backup.app).toBe('ByteRyte');
  expect(backup.profiles.list.ptest.name).toBe('Ada');
  backup.profiles.list.ptest.name = 'Imported';
  backup.profiles.list.ptest.xp = 80;
  const imported = path.join(os.tmpdir(), 'byteryte-import.json');
  fs.writeFileSync(imported, JSON.stringify(backup));
  page.once('dialog', (d) => d.accept());
  await page.locator('#imp').setInputFiles(imported);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).name).toBe('Imported');
  expect((await state(page)).xp).toBe(80);
  const bad = path.join(os.tmpdir(), 'byteryte-bad.json');
  fs.writeFileSync(bad, JSON.stringify({ nope: true }));
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#imp').setInputFiles(bad);
  await expect(page.getByText('not a ByteRyte backup')).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await page.locator('#imp').setInputFiles(imported);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).name).toBe('Imported');
});

deep('corrupt storage boots instead of hanging', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('byteroots-profiles', '{'));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Start from scratch' })).toBeVisible();
});

deep('mock interview covers every topic', async ({ page, testInfo }) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Interview', exact: true }).click();
  const tags = await page.locator('.tbtn').allTextContents();
  expect(tags.length).toBeGreaterThan(8);
  for (const tag of tags) {
    await page.locator('.tbtn', { hasText: tag.split(' · ')[0] }).first().click();
    await answerSession(page);
    await expect(page.getByRole('heading', { name: 'Mock Interview' })).toBeVisible();
  }
  const s = await state(page);
  expect(s.interviews).toBe(tags.length);
  expect(s.bestIv).toBe(100);
});

deep('every lesson can be completed in order', async ({ page, testInfo }) => {
  test.setTimeout(300000);
  await boot(page, testInfo);
  for (const track of ['java', 'css', 'javafx', 'swift']) {
    await page.locator(`.tab[data-t="${track}"]`).click();
    let guard = 0;
    while (await page.locator('.node.cur').count()) {
      if (++guard > 40) throw new Error('too many lessons on ' + track);
      await page.locator('.node.cur').click();
      await answerSession(page);
      await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
    }
  }
  const s = await state(page);
  expect(s.done.length).toBe(62);
  expect(s.lessons).toBe(62);
  expect(s.hearts).toBe(5);
  await expect(page.getByRole('tab', { name: /34\/34/ })).toBeVisible();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByText('Java Master')).toBeVisible();
  expect(await overflow(page)).toEqual([]);
});

deep('home stays responsive', async ({ page, testInfo }) => {
  const started = Date.now();
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(5000);
});
