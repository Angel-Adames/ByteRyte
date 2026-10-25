import { test, expect } from './console.js';
import { boot, answerSession, state } from './helpers.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

function tmp(testInfo, name) {
  return path.join(os.tmpdir(), `byteryte-${testInfo.project.name}-${name}.json`);
}

async function lesson(page) {
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await answerSession(page);
}

test('browser Back returns in the app and a second Back stays on ByteRyte', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Gem Shop' })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
  await page.evaluate(() => { const b = document.querySelector('.bnav [data-go="shop"]'); b.click(); b.click(); });
  await expect(page.getByRole('heading', { name: 'Gem Shop' })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
});

test('guide, recap, and a lesson all return on browser Back', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: /Guide, Unit 1/ }).click();
  await expect(page.getByRole('heading', { name: /Unit 1 · Foundations/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.locator('.node.cur').click();
  await expect(page.getByRole('heading', { name: 'How a Program Runs' })).toBeVisible();
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__BR.cur())).toBeFalsy();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: /Weekly recap/ }).click();
  await expect(page.getByRole('heading', { name: 'Weekly recap' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
});

test('standalone display mode keeps Back inside the app', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const orig = window.matchMedia.bind(window);
    window.matchMedia = (q) => q === '(display-mode: standalone)'
      ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } }
      : orig(q);
  });
  await boot(page, testInfo);
  await expect(page.locator('html')).toHaveAttribute('data-standalone', '');
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});

test('a correct answer starts the success tones', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    window.__brTones = [];
    window.__brResume = 0;
    const origOsc = AC.prototype.createOscillator;
    const origResume = AC.prototype.resume;
    AC.prototype.resume = function () { window.__brResume++; return origResume.apply(this, arguments); };
    AC.prototype.createOscillator = function () {
      const o = origOsc.apply(this, arguments);
      const start = o.start;
      o.start = function () {
        window.__brTones.push({ f: o.frequency.value, type: o.type });
        return start.apply(this, arguments);
      };
      return o;
    };
    try {
      Object.defineProperty(AC.prototype, 'state', { configurable: true, get() { return 'suspended'; } });
      window.__brForce = true;
    } catch (e) { window.__brForce = false; }
  });
  await boot(page, testInfo, { settings: { sound: true } });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.evaluate(() => {
    const e = window.__BR.cur();
    document.querySelector('.opt[data-i="' + e.a + '"]').click();
    document.querySelector('#chk').click();
  });
  const heard = await page.evaluate(() => ({ tones: window.__brTones, resume: window.__brResume, force: window.__brForce }));
  expect(heard.tones.map(t => t.f)).toEqual(expect.arrayContaining([660, 880]));
  expect(heard.force).toBe(true);
  expect(heard.resume).toBeGreaterThan(0);
});

test.describe('fall-back evening', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('a fall-back evening increments the streak and the calendar stays unique', async ({ page }, testInfo) => {
    await boot(page, testInfo, {
      time: new Date('2026-11-01T23:30:00-05:00'),
      profile: { last: '2026-10-31', streak: 4, best: 4, heartDay: '2026-11-01', xpLog: { '2026-10-31': 12 } },
    });
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    const dates = await page.locator('.cal i[title]').evaluateAll(els => els.map(el => el.getAttribute('title').split(':')[0]));
    expect(new Set(dates).size).toBe(dates.length);
    expect(dates).toContain('2026-11-01');
    expect(dates).toContain('2026-10-31');
    await page.getByRole('button', { name: 'Learn', exact: true }).click();
    await lesson(page);
    const s = await state(page);
    expect(s.streak).toBe(5);
    expect(s.last).toBe('2026-11-01');
    expect(s.best).toBe(5);
  });
});

test.describe('spring-forward noon', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('a spring-forward noon increments the streak', async ({ page }, testInfo) => {
    await boot(page, testInfo, {
      time: new Date('2026-03-08T12:00:00-04:00'),
      profile: { last: '2026-03-07', streak: 4, best: 4, heartDay: '2026-03-08' },
    });
    await lesson(page);
    const s = await state(page);
    expect(s.streak).toBe(5);
    expect(s.last).toBe('2026-03-08');
  });
});

test.describe('pacific midnight', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  test('one minute before Pacific midnight does not refill hearts', async ({ page }, testInfo) => {
    await boot(page, testInfo, {
      time: new Date('2026-06-15T06:59:00Z'),
      profile: { hearts: 1, heartDay: '2026-06-14' },
    });
    const s = await state(page);
    expect(s.hearts).toBe(1);
    expect(s.heartDay).toBe('2026-06-14');
  });
  test('Pacific midnight refills hearts', async ({ page }, testInfo) => {
    await boot(page, testInfo, {
      time: new Date('2026-06-15T07:00:00Z'),
      profile: { hearts: 1, heartDay: '2026-06-14' },
    });
    const s = await state(page);
    expect(s.hearts).toBe(5);
    expect(s.heartDay).toBe('2026-06-15');
  });
});

test('a full disk shows a save error instead of a page error', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { gems: 200, freezes: 0 } });
  await page.evaluate(() => {
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (k === 'byteroots-profiles') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return orig.call(this, k, v);
    };
  });
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page.locator('.buy[data-id="freeze"]').click();
  await expect(page.getByText('blocked saving').first()).toBeVisible();
  const s = await state(page);
  expect(s.freezes).toBe(1);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest.freezes);
  expect(stored).toBe(0);
});

test('rapid double taps buy, add, answer, and toggle once', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { gems: 400, freezes: 0 } });
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  await page.evaluate(() => {
    document.querySelector('.buy[data-id="freeze"]').click();
    document.querySelector('.buy[data-id="freeze"]').click();
  });
  let s = await state(page);
  expect(s.freezes).toBe(1);
  expect(s.gems).toBe(350);

  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  const before = await page.evaluate(() => Object.keys(window.__BR.P().list).length);
  await page.evaluate(() => { const b = document.querySelector('#addp'); b.click(); b.click(); });
  expect(await page.evaluate(() => Object.keys(window.__BR.P().list).length)).toBe(before + 1);

  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.evaluate(() => {
    const e = window.__BR.cur();
    document.querySelector('.opt[data-i="' + e.a + '"]').click();
    const c = document.querySelector('#chk');
    c.click();
    c.click();
  });
  await expect(page.locator('#cont')).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.stats.answered)).toBe(1);
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.evaluate(() => { const b = document.querySelector('.node.cur'); b.click(); b.click(); });
  await expect(page.getByRole('heading', { name: 'How a Program Runs' })).toHaveCount(1);
  await page.goBack();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.evaluate(() => {
    document.querySelector('#snd').click();
    document.querySelector('#snd').click();
  });
  const sound = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')).sound);
  expect(sound).toBe(true);
});

test('malformed backups are rejected and a hostile file cannot change the prototype', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Settings' }).click();
  const bad = ['{', '[]', 'null', '{"app":"ByteRyte"}', '{"app":"ByteRyte","profiles":null}', '{"app":"ByteRyte","profiles":{"list":[]}}', '{"app":"ByteRyte","profiles":{"list":{"ok":1}}}'];
  for (const [i, text] of bad.entries()) {
    const file = tmp(testInfo, 'bad-' + i);
    fs.writeFileSync(file, text);
    await page.locator('#imp').setInputFiles(file);
    await expect(page.getByText('not a ByteRyte backup').last()).toBeVisible();
  }
  const hostile = tmp(testInfo, 'hostile');
  fs.writeFileSync(hostile, '{"app":"ByteRyte","profiles":{"active":"ok","list":{"__proto__":{"id":"__proto__","name":"Evil","onboarded":true,"xp":1},"ok":{"id":"ok","name":"Kept","onboarded":true,"xp":15,"__proto__":{"admin":true}}}}}');
  page.once('dialog', d => d.accept());
  await page.locator('#imp').setInputFiles(hostile);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.name).toBe('Kept');
  expect(s.xp).toBe(15);
  const proto = await page.evaluate(() => ({ admin: window.__BR.S.admin, protoAdmin: Object.getPrototypeOf(window.__BR.S).admin, globalAdmin: ({}).admin }));
  expect(proto.admin).toBeUndefined();
  expect(proto.protoAdmin).toBeUndefined();
  expect(proto.globalAdmin).toBeUndefined();
});

test('first load shows the daily goal quickly and requests the scripts', async ({ page }, testInfo) => {
  const started = Date.now();
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(Date.now() - started).toBeLessThan(5000);
  const names = await page.evaluate(() => performance.getEntriesByType('resource').map(r => r.name));
  expect(names.some(n => n.includes('data.js'))).toBe(true);
  expect(names.some(n => n.includes('app.js'))).toBe(true);
});
