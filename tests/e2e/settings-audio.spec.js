import { test, expect } from './console.js';
import { boot } from './helpers.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

async function openSettings(page) {
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
}

async function spill(page, selector) {
  return page.evaluate((selector) => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll(selector)) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      if (r.left < -2 || r.right > vw + 2) bad.push(String(el.id || el.className || el.tagName).slice(0, 48));
    }
    return bad;
  }, selector);
}

async function answerWrong(page) {
  await page.evaluate(() => {
    const e = window.__BR.cur();
    const $ = (s) => document.querySelector(s);
    if (e.t === 'ar') {
      [...document.querySelectorAll('#bank .chip')].reverse().forEach((c) => c.click());
    } else if (e.t === 'type') {
      const box = $('#typebox');
      box.value = 'nope';
      box.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      const opt = [...document.querySelectorAll('.opt')].find((o) => o.dataset.i !== String(e.a));
      if (!opt) throw new Error('no wrong choice');
      opt.click();
    }
    if ($('#chk').disabled) throw new Error('Check stayed disabled');
    $('#chk').click();
  });
}

test('color, text size, audio, and motion settings persist and apply', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 40, done: { 'java.run': true } } });
  await openSettings(page);
  await page.getByRole('radio', { name: 'Tide', exact: true }).click();
  await page.getByRole('radio', { name: 'Small', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-text', 'sm');
  await expect(page.locator('html')).not.toHaveAttribute('data-big', '');
  await page.getByRole('radio', { name: 'Extra large', exact: true }).click();
  await page.getByRole('switch', { name: 'Reduce motion' }).click();
  await page.getByRole('switch', { name: 'Vibration' }).click();
  await expect(page.getByRole('switch', { name: 'Reduce motion' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('switch', { name: 'Vibration' })).toHaveAttribute('aria-checked', 'false');
  await page.getByLabel('Music volume').fill('25');
  await page.getByLabel('Effects volume').fill('40');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'tide');
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'tide');
  await expect(page.locator('html')).toHaveAttribute('data-text', 'xl');
  await expect(page.locator('html')).toHaveAttribute('data-big', '');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')));
  expect(saved.accent).toBe('tide');
  expect(saved.text).toBe('xl');
  expect(saved.motion).toBe(true);
  expect(saved.haptics).toBe(false);
  expect(saved.music).toBe(false);
  expect(saved.musicVol).toBeCloseTo(0.25, 2);
  expect(saved.sfxVol).toBeCloseTo(0.4, 2);
  const kept = await page.evaluate(() => ({ name: window.__BR.S.name, xp: window.__BR.S.xp, run: !!window.__BR.S.done['java.run'] }));
  expect(kept).toEqual({ name: 'Ada', xp: 40, run: true });

  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  expect(await spill(page, '.nlab, .node, .top, .top *')).toEqual([]);
  expect(await page.evaluate(() => {
    const b = document.querySelector('.brand');
    return b.scrollWidth <= b.clientWidth + 1;
  })).toBe(true);

  await page.locator('.node[data-k="java.run"]').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  expect(await spill(page, '.q, .opt, .typebox, .code')).toEqual([]);
  await answerWrong(page);
  await page.getByRole('button', { name: 'Ask Rytia why' }).click();
  await expect(page.locator('#rytia-card')).toBeVisible();
  expect(await spill(page, '#rytia-card, .rytia-sum, .typebox, .q')).toEqual([]);
  page.once('dialog', (d) => d.accept());
  await page.locator('#x').click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: /Swift/ }).click();
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    let guard = 0;
    while (guard++ < 40) {
      const e = window.__BR.cur();
      if (e && e.t === 'type') return;
      if (!e || !$('#chk')) throw new Error('no question before a typed answer');
      if (e.t === 'ar') {
        for (const line of e.lines) {
          const chip = [...document.querySelectorAll('#bank .chip')].find((c) => c.dataset.raw === line);
          chip.click();
        }
      } else {
        document.querySelector('.opt[data-i="' + e.a + '"]').click();
      }
      $('#chk').click();
      $('#cont').click();
    }
    throw new Error('did not reach a typed answer');
  });
  await expect(page.locator('#typebox')).toBeVisible();
  expect(await spill(page, '#typebox, .typelab, .q')).toEqual([]);

  page.once('dialog', (d) => d.accept());
  await page.locator('#x').click();
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: "Reset Ada's progress" }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'tide');
  expect(await page.evaluate(() => window.__BR.S.xp)).toBe(0);
  const afterReset = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')));
  expect(afterReset.accent).toBe('tide');
  expect(afterReset.text).toBe('xl');

  await page.evaluate(() => {
    const next = Object.assign(JSON.parse(localStorage.getItem('byteroots-settings')), { accent: 'dusk', text: 'sm', music: true, musicVol: 0.2 });
    const raw = JSON.stringify(next);
    localStorage.setItem('byteroots-settings', raw);
    window.dispatchEvent(new StorageEvent('storage', { key: 'byteroots-settings', newValue: raw }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'dusk');
  await expect(page.locator('html')).toHaveAttribute('data-text', 'sm');
  await expect(page.locator('html')).not.toHaveAttribute('data-big', '');
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ music: true, musicGain: 0, state: 'none' });
});

test('accent themes keep AA contrast in this color scheme', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await openSettings(page);
  for (const name of ['Grove', 'Tide', 'Dusk', 'Clay']) {
    await page.getByRole('radio', { name, exact: true }).click();
    const ratios = await page.evaluate(() => {
      const read = (prop) => getComputedStyle(document.documentElement).getPropertyValue(prop).trim();
      const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
      const L = (c) => {
        const ch = (c.startsWith('#') ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : parse(c)).map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
      };
      const pair = (a, b) => {
        const hi = Math.max(L(a), L(b));
        const lo = Math.min(L(a), L(b));
        return (hi + 0.05) / (lo + 0.05);
      };
      const ink = read('--ink');
      const bg = read('--bg');
      const mut = read('--mut');
      const g = read('--g');
      const gt = read('--gt');
      return { text: pair(ink, bg), muted: pair(mut, bg), button: pair('#ffffff', g), accent: pair(gt, bg) };
    });
    expect(ratios.text, name + ' text').toBeGreaterThanOrEqual(4.5);
    expect(ratios.muted, name + ' muted').toBeGreaterThanOrEqual(4.5);
    expect(ratios.button, name + ' button').toBeGreaterThanOrEqual(4.5);
    expect(ratios.accent, name + ' accent').toBeGreaterThanOrEqual(4.5);
  }
});

test('lofi starts only after a tap, and the volume sliders change the gain', async ({ page }, testInfo) => {
  await boot(page, testInfo, { settings: { sound: true } });
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ state: 'none', music: false, musicGain: 0, sfxGain: 0 });
  await page.getByRole('button', { name: 'Lofi music' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ state: 'running', music: true });
  const on = await page.evaluate(() => window.__BR.aud());
  expect(on.musicGain).toBeGreaterThan(0.02);
  expect(on.sfxGain).toBeGreaterThan(0.5);
  expect(on.musicDest).toBe(true);
  expect(on.sfxDest).toBe(true);
  expect(on.silent).toBe(true);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Music volume').fill('10');
  await expect.poll(() => page.evaluate(() => window.__BR.aud().musicGain)).toBeLessThan(on.musicGain);
  const quiet = await page.evaluate(() => window.__BR.aud().musicGain);
  expect(quiet).toBeGreaterThan(0);
  await page.getByLabel('Effects volume').fill('20');
  await expect.poll(() => page.evaluate(() => window.__BR.aud().sfxGain)).toBeLessThan(0.3);
  const sfxQuiet = await page.evaluate(() => window.__BR.aud().sfxGain);
  expect(sfxQuiet).toBeGreaterThan(0.1);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__BR.aud().musicGain)).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => window.__BR.aud().musicGain)).toBeGreaterThan(0);
  await page.getByRole('switch', { name: 'Lofi music' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ music: false, musicGain: 0 });
  await expect(page.getByRole('button', { name: 'Lofi music' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.aud().sfxGain)).toBe(0);
  await page.getByRole('button', { name: 'Preview sound' }).click();
  const silent = await page.evaluate(() => window.__BR.aud());
  expect(silent.sound).toBe(false);
  expect(silent.sfxVol).toBeGreaterThan(0);
  expect(silent.sfxGain).toBe(0);
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.__BR.aud().music)).toBe(false);
});

test('a saved music preference starts on the first tap', async ({ page }, testInfo) => {
  await boot(page, testInfo, { settings: { music: true, sound: true } });
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ state: 'none', music: true, musicGain: 0, silent: false });
  await page.getByRole('button', { name: 'Lofi music' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({ state: 'running', music: true, musicDest: true, silent: true });
  expect(await page.evaluate(() => window.__BR.aud().musicGain)).toBeGreaterThan(0.02);
});

test('a sound-effect tap unlocks audio without starting music', async ({ page }, testInfo) => {
  await boot(page, testInfo, { settings: { sound: true } });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Preview sound' }).click();
  await expect.poll(() => page.evaluate(() => window.__BR.aud())).toMatchObject({
    state: 'running', music: false, musicGain: 0, sfxDest: true, silent: true,
  });
  expect(await page.evaluate(() => window.__BR.aud().sfxGain)).toBeGreaterThan(0);
});

test('settings survive export and import', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 12 } });
  await openSettings(page);
  await page.getByRole('radio', { name: 'Clay', exact: true }).click();
  await page.getByRole('radio', { name: 'Large', exact: true }).click();
  await page.getByLabel('Music volume').fill('30');
  await page.getByLabel('Effects volume').fill('55');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Export/ }).click();
  const download = await downloadPromise;
  const file = path.join(os.tmpdir(), 'byteryte-settings-' + testInfo.project.name + '.json');
  await download.saveAs(file);
  const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(backup.settings.accent).toBe('clay');
  expect(backup.settings.text).toBe('lg');
  expect(backup.settings.musicVol).toBeCloseTo(0.3, 2);
  expect(backup.settings.sfxVol).toBeCloseTo(0.55, 2);
  expect(backup.settings.music).toBe(false);
  backup.settings = Object.assign({}, backup.settings, { accent: 'tide', text: 'sm', music: false, musicVol: 0.15, sfxVol: 0.25, sound: false, rytia: false, motion: true, haptics: false, theme: testInfo.project.use.brTheme || 'light' });
  const imported = path.join(os.tmpdir(), 'byteryte-settings-in-' + testInfo.project.name + '.json');
  fs.writeFileSync(imported, JSON.stringify(backup));
  page.once('dialog', (d) => d.accept());
  await page.locator('#imp').setInputFiles(imported);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'tide');
  await expect(page.locator('html')).toHaveAttribute('data-text', 'sm');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('byteroots-settings')));
  expect(stored.musicVol).toBeCloseTo(0.15, 2);
  expect(stored.sfxVol).toBeCloseTo(0.25, 2);
  expect(stored.sound).toBe(false);
  expect(stored.rytia).toBe(false);
  expect(stored.motion).toBe(true);
  expect(stored.haptics).toBe(false);
  expect(await page.evaluate(() => window.__BR.S.name)).toBe('Ada');
  expect(await page.evaluate(() => window.__BR.S.xp)).toBe(12);
});

test('delete-all confirms only after DELETE, and cancel leaves the profile', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', xp: 33 } });
  const otherId = 'pother';
  await page.evaluate((otherId) => {
    const raw = JSON.parse(localStorage.getItem('byteroots-profiles'));
    const ada = raw.list.ptest;
    raw.list[otherId] = Object.assign({}, ada, { id: otherId, name: 'Bea', xp: 4 });
    localStorage.setItem('byteroots-profiles', JSON.stringify(raw));
  }, otherId);
  await page.reload();
  await openSettings(page);
  await page.getByRole('button', { name: 'Delete all data on this device' }).click();
  await expect(page.getByRole('button', { name: 'Delete everything' })).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm').fill('NOPE');
  await expect(page.getByRole('button', { name: 'Delete everything' })).toBeDisabled();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await expect(page.getByRole('button', { name: 'Delete everything' })).toBeEnabled();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete everything' })).toBeHidden();
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.name)).toBe('Ada');
  await openSettings(page);
  page.once('dialog', (d) => d.dismiss());
  await page.getByRole('button', { name: "Delete Ada's profile" }).click();
  expect(await page.evaluate(() => !!JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest)).toBe(true);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: "Delete Ada's profile" }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__BR.S.name)).toBe('Bea');
  await openSettings(page);
  await expect(page.getByRole('button', { name: /Delete Bea's profile/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete all data on this device' }).click();
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByRole('heading', { name: /Welcome to ByteRyte/ })).toBeVisible();
  const fresh = await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('byteroots-profiles'));
    const row = raw.list[raw.active];
    return { onboarded: row.onboarded, xp: row.xp, photo: row.photo || '', settings: localStorage.getItem('byteroots-settings'), names: Object.values(raw.list).map((p) => p.name) };
  });
  expect(fresh.onboarded).toBe(false);
  expect(fresh.xp).toBe(0);
  expect(fresh.photo).toBe('');
  expect(fresh.settings).toBe(null);
  expect(fresh.names).not.toContain('Ada');
  expect(fresh.names).not.toContain('Bea');
});
