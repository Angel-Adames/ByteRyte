import { test, expect } from './console.js';
import { boot } from './helpers.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';

function png(w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    const row = y * (w * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const i = row + 1 + x * 3;
      raw[i] = x < w / 2 ? 220 : 20;
      raw[i + 1] = 70;
      raw[i + 2] = y < h / 2 ? 40 : 190;
    }
  }
  const chunk = (type, data) => {
    const head = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([head, data])) >>> 0);
    return Buffer.concat([len, head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const photoPng = png(48, 16);

async function openEdit(page) {
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Edit profile' })).toBeVisible();
}

async function storedPhoto(page) {
  return page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return row.photo || '';
  });
}

test('path lines join node centers and stay off the labels', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { unlockAll: true } });
  await page.evaluate(() => document.fonts.ready);
  const tracks = ['java', 'javafx', 'css', 'swift'];
  for (const id of tracks) {
    await page.locator('.tab[data-t="' + id + '"]').click();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const report = await page.evaluate((track) => {
      const bad = [];
      const vw = document.documentElement.clientWidth;
      let unitCheck = false;
      let longLabel = 0;
      document.querySelectorAll('.path').forEach((pathEl) => {
        const nodes = [...pathEl.querySelectorAll('.node')];
        const labels = [...pathEl.querySelectorAll('.nlab')];
        const bubbles = [...pathEl.querySelectorAll('.startbub')];
        const line = pathEl.querySelector('canvas.spine');
        if (nodes.length < 2) return;
        if (!line) { bad.push('missing spine'); return; }
        const nums = (line.dataset.pts || '').match(/-?\d+(?:\.\d+)?/g) || [];
        if (nums.length !== nodes.length * 2) bad.push('point count ' + nums.length + ' for ' + nodes.length);
        const box = pathEl.getBoundingClientRect();
        const z = pathEl.offsetWidth ? box.width / pathEl.offsetWidth : 1;
        const centers = nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return { x: (r.left + r.width / 2 - box.left) / z, y: (r.top + r.height / 2 - box.top) / z, label: n.getAttribute('aria-label') || '' };
        });
        centers.forEach((c, i) => {
          const dx = +nums[i * 2] - c.x;
          const dy = +nums[i * 2 + 1] - c.y;
          if (Math.hypot(dx, dy) > 1.5) bad.push('center ' + c.label);
          if (/Unit check/.test(c.label)) unitCheck = true;
        });
        const obstacles = labels.concat(bubbles).map((el) => {
          const r = el.getBoundingClientRect();
          return {
            left: (r.left - box.left) / z, right: (r.right - box.left) / z,
            top: (r.top - box.top) / z, bottom: (r.bottom - box.top) / z,
            text: (el.textContent || '').trim(),
          };
        });
        for (let i = 0; i < centers.length - 1; i++) {
          const a = centers[i], b = centers[i + 1];
          for (let s = 0; s <= 24; s++) {
            const t = s / 24;
            const x = a.x + (b.x - a.x) * t;
            const y = a.y + (b.y - a.y) * t;
            for (const o of obstacles) {
              if (x >= o.left - 3 && x <= o.right + 3 && y >= o.top - 3 && y <= o.bottom + 3) bad.push('hits ' + o.text);
            }
          }
        }
        labels.forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.left < -1 || r.right > vw + 1) bad.push('overflow ' + (el.textContent || '').trim());
          if ((el.textContent || '').includes('Memory: Values')) longLabel = r.height;
        });
      });
      return { bad: [...new Set(bad)].slice(0, 6), unitCheck, longLabel, track };
    }, id);
    expect(report.bad, id + ' ' + JSON.stringify(report.bad)).toEqual([]);
    if (id === 'java') expect(report.longLabel).toBeGreaterThan(28);
    if (id === 'swift') expect(report.unitCheck).toBe(true);
  }
});

test('a photo uploads, shows, persists, and can be removed', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await openEdit(page);
  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeDisabled();
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('#avprev img')).toBeVisible();
  const preview = await page.locator('#avprev img').evaluate((img) => ({ w: img.naturalWidth, h: img.naturalHeight, src: img.src.slice(0, 23) }));
  expect(preview).toEqual({ w: 256, h: 256, src: 'data:image/jpeg;base64,' });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible();
  await expect(page.locator('.phead .avimg')).toBeVisible();
  const saved = await storedPhoto(page);
  expect(saved.startsWith('data:image/jpeg;base64,')).toBe(true);
  await page.reload();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('.phead .avimg')).toBeVisible();
  expect(await storedPhoto(page)).toBe(saved);
  if (testInfo.project.name.startsWith('desk')) await expect(page.locator('.rail .avimg')).toBeVisible();
  await page.getByRole('button', { name: '＋ Add profile' }).click();
  await page.getByRole('button', { name: 'Start from scratch' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  const round = await page.locator('.sitem .pic.has-photo').evaluate((el) => parseFloat(getComputedStyle(el).borderTopLeftRadius));
  expect(round).toBeGreaterThan(20);
  await page.getByRole('button', { name: 'Switch to Ada' }).click();
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(page.locator('#avprev img')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('.phead .avimg')).toHaveCount(0);
  await expect(page.locator('.phead .avatar')).toContainText('🦊');
  expect(await storedPhoto(page)).toBe('');
});

test('a chosen photo clears the emoji highlight, and picking an emoji brings one back', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', avatar: '🦊', xp: 12 } });
  await openEdit(page);
  await expect(page.getByLabel('Your name')).toHaveValue('Ada');
  const fox = page.getByRole('radio', { name: 'Fox avatar' });
  const panda = page.getByRole('radio', { name: 'Panda avatar' });
  await expect(fox).toHaveAttribute('aria-checked', 'true');
  await expect(fox).toHaveClass(/\bon\b/);
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('#avprev img')).toBeVisible();
  await expect(page.locator('.avs .avatar.on')).toHaveCount(0);
  await expect(page.locator('.avs [aria-checked="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await openEdit(page);
  await expect(page.getByLabel('Your name')).toHaveValue('Ada');
  await expect(page.locator('.avs .avatar.on')).toHaveCount(0);
  await expect(page.locator('#avprev img')).toBeVisible();
  await panda.click();
  await expect(page.locator('#avprev img')).toHaveCount(0);
  await expect(panda).toHaveAttribute('aria-checked', 'true');
  await expect(panda).toHaveClass(/\bon\b/);
  await expect(fox).toHaveAttribute('aria-checked', 'false');
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('.avs .avatar.on')).toHaveCount(0);
  await page.getByRole('button', { name: 'Remove photo' }).click();
  await expect(panda).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.avs .avatar.on')).toHaveCount(1);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: '＋ Add profile' }).click();
  await expect(page.getByRole('button', { name: 'Start from scratch' })).toBeVisible();
  await expect(page.getByPlaceholder('e.g. Alex')).toHaveValue('');
  await expect(page.getByRole('radio', { name: 'Fox avatar' })).toHaveAttribute('aria-checked', 'true');
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('.avs .avatar.on')).toHaveCount(0);
  await expect(page.locator('.avs [aria-checked="true"]')).toHaveCount(0);
  await page.getByRole('radio', { name: 'Owl avatar' }).click();
  await expect(page.getByRole('radio', { name: 'Owl avatar' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.avs .avatar.on')).toHaveCount(1);
  await expect(page.locator('#avprev img')).toHaveCount(0);
  await expect(page.locator('.sitem .avatar.on')).toHaveCount(0);
});

test('a bad photo is refused and a good one survives reset, import, and another tab', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { xp: 40, name: 'Ada' } });
  await openEdit(page);
  await page.locator('#pic').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
  await expect(page.locator('#picerr')).toHaveText('That file is not an image.');
  await page.locator('#pic').setInputFiles({ name: 'shot.heic', mimeType: 'image/heic', buffer: Buffer.from('not-a-photo') });
  await expect(page.locator('#picerr')).toHaveText('This browser cannot read HEIC photos. Save a JPEG or PNG and try again.');
  const big = path.join(os.tmpdir(), 'byteryte-big-photo.bin');
  if (!fs.existsSync(big) || fs.statSync(big).size < 8 * 1024 * 1024) fs.writeFileSync(big, Buffer.alloc(8 * 1024 * 1024 + 1, 7));
  await page.locator('#pic').setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: fs.readFileSync(big) });
  await expect(page.locator('#picerr')).toHaveText('That photo is too large. Choose one under 8 MB.');
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('#avprev img')).toBeVisible();
  await page.evaluate(() => {
    const orig = localStorage.setItem.bind(localStorage);
    localStorage.setItem = (key, value) => {
      if (key === 'byteroots-profiles' && String(value).includes('data:image/jpeg')) throw new Error('quota');
      return orig(key, value);
    };
  });
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.locator('#picerr')).toHaveText('Not enough space on this device to keep that photo.');
  expect(await storedPhoto(page)).toBe('');
  await page.reload();
  await openEdit(page);
  await page.locator('#pic').setInputFiles({ name: 'ada.png', mimeType: 'image/png', buffer: photoPng });
  await expect(page.locator('#avprev img')).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const photo = await storedPhoto(page);
  expect(photo.startsWith('data:image/jpeg;base64,')).toBe(true);
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /Reset Ada/ }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const afterReset = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, photo: row.photo || '' };
  });
  expect(afterReset.xp).toBe(0);
  expect(afterReset.photo).toBe(photo);
  const backup = await page.evaluate(() => JSON.stringify({ app: 'ByteRyte', v: 2, profiles: JSON.parse(localStorage.getItem('byteroots-profiles')), settings: { theme: 'light', sound: false, big: false, rytia: true } }));
  const evil = JSON.parse(backup);
  evil.profiles.list.ptest.photo = 'data:text/html,<img src=x onerror=alert(1)>';
  evil.profiles.list.ptest.xp = 12;
  const evilFile = path.join(os.tmpdir(), 'byteryte-evil-photo-' + testInfo.project.name + '.json');
  fs.writeFileSync(evilFile, JSON.stringify(evil));
  await page.getByRole('button', { name: 'Settings' }).click();
  page.once('dialog', (d) => d.accept());
  await page.locator('#imp').setInputFiles(evilFile);
  await expect(page.getByText('Progress imported')).toBeVisible();
  const dropped = await page.evaluate(() => {
    const row = JSON.parse(localStorage.getItem('byteroots-profiles')).list.ptest;
    return { xp: row.xp, photo: row.photo || '', html: document.body.innerHTML.includes('onerror=alert') };
  });
  expect(dropped.xp).toBe(12);
  expect(dropped.photo).toBe('');
  expect(dropped.html).toBe(false);
  const good = JSON.parse(backup);
  good.profiles.list.ptest.xp = 18;
  const goodFile = path.join(os.tmpdir(), 'byteryte-good-photo-' + testInfo.project.name + '.json');
  fs.writeFileSync(goodFile, JSON.stringify(good));
  await page.getByRole('button', { name: 'Settings' }).click();
  page.once('dialog', (d) => d.accept());
  await page.locator('#imp').setInputFiles(goodFile);
  await expect(page.getByText('Progress imported')).toBeVisible();
  expect(await storedPhoto(page)).toBe(photo);
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
  await other.getByRole('button', { name: 'Profile', exact: true }).click();
  await other.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await other.getByRole('button', { name: 'Remove photo' }).click();
  await other.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await storedPhoto(other)).toBe('');
  const picked = await page.evaluate(() => {
    const e = window.__BR.cur();
    const opts = [...document.querySelectorAll('.opt')].filter((o) => !o.disabled);
    return opts.findIndex((o) => o.dataset.i === String(e.a));
  });
  expect(picked).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(picked + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  expect(await storedPhoto(page)).toBe('');
  await other.close();
});
