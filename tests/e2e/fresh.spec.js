import { test, expect } from './console.js';
import { boot, state, overflow } from './helpers.js';

function ymd(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const AVATAR_NAMES = ['Fox', 'Panda', 'Octopus', 'Owl', 'Frog', 'Tiger', 'Koala', 'Unicorn', 'Penguin', 'Whale', 'Dinosaur', 'Robot', 'Woman at a computer', 'Man at a computer', 'Astronaut', 'Bee'];

test('a full daily bar pays the goal and the xp quest once', async ({ page }, testInfo) => {
  const today = ymd();
  await boot(page, testInfo, { profile: { gems: 50, goal: 30, goalDay: null, xpLog: { [today]: 40 } } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const paid = await page.evaluate((day) => ({
    gems: window.__BR.S.gems,
    goalDay: window.__BR.S.goalDay,
    xp: window.__BR.S.xpLog[day],
    claimed: window.__BR.S.qd && window.__BR.S.qd.claimed.xp,
    chest: window.__BR.S.qd && window.__BR.S.qd.chest,
    pageDay: (d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'))(new Date()),
  }), today);
  expect(paid.pageDay).toBe(today);
  expect(paid.xp).toBe(40);
  expect(paid.gems).toBe(75);
  expect(paid.goalDay).toBe(today);
  expect(paid.claimed).toBe(1);
  expect(paid.chest).toBe(false);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).gems).toBe(75);
});

test('lowering the daily goal pays gems that were already earned', async ({ page }, testInfo) => {
  const today = ymd();
  await boot(page, testInfo, { profile: { gems: 50, goal: 30, goalDay: null, xpLog: { [today]: 20 } } });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).gems).toBe(50);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: '10 XP' }).click();
  await expect(page.getByRole('radio', { name: '10 XP' })).toHaveAttribute('aria-checked', 'true');
  const paid = await page.evaluate((day) => ({
    gems: window.__BR.S.gems,
    goal: window.__BR.S.goal,
    goalDay: window.__BR.S.goalDay,
    claimed: window.__BR.S.qd.claimed.xp,
  }), today);
  expect(paid.goal).toBe(10);
  expect(paid.gems).toBe(75);
  expect(paid.goalDay).toBe(today);
  expect(paid.claimed).toBe(1);
});

test('out of hearts refreshes when the day rolls over', async ({ page }, testInfo) => {
  await boot(page, testInfo, {
    time: new Date('2026-06-15T23:59:30'),
    profile: { hearts: 0, heartDay: '2026-06-15', gems: 0 },
  });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).hearts).toBe(0);
  await page.locator('.node').first().click();
  await expect(page.getByRole('heading', { name: 'Out of hearts' })).toBeVisible();
  await expect(page.locator('#buyh')).toBeVisible();
  await page.clock.fastForward(60000);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const s = await state(page);
  expect(s.hearts).toBe(5);
  expect(s.heartDay).toBe('2026-06-16');
});

test('a lesson keeps its profile when another tab adds one', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada', gems: 80 } });
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await expect(page.locator('#chk')).toBeVisible();
  const other = await page.context().newPage();
  await other.goto(page.url());
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  await other.getByRole('button', { name: 'Profile', exact: true }).click();
  await other.getByRole('button', { name: 'Add profile' }).click();
  await other.locator('#nm').fill('Bea');
  await other.getByRole('button', { name: 'Start from scratch' }).click();
  await expect(other.getByText('Daily goal', { exact: true })).toBeVisible();
  const index = await page.evaluate(() => {
    const e = window.__BR.cur();
    const opts = [...document.querySelectorAll('.opt')].filter((o) => !o.disabled);
    return opts.findIndex((o) => o.dataset.i === String(e.a));
  });
  expect(index).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(index + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  const who = await page.evaluate(() => ({
    name: window.__BR.S.name,
    names: Object.values(window.__BR.P().list).map((p) => p.name).sort(),
  }));
  expect(who.name).toBe('Ada');
  expect(who.names).toEqual(['Ada', 'Bea']);
  await other.close();
});

test('avatars, the daily goal, and profile switches have names', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada' } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await expect(page.getByRole('radiogroup', { name: 'Pick an avatar' })).toBeVisible();
  for (const name of AVATAR_NAMES) {
    await expect(page.getByRole('radio', { name: name + ' avatar', exact: true })).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Settings' }).click();
  const goals = page.getByRole('radiogroup', { name: 'Daily goal' });
  await expect(goals).toBeVisible();
  await expect(goals.getByRole('radio', { name: '30 XP' })).toHaveAttribute('aria-checked', 'true');
  await expect(goals.getByRole('radio', { name: '10 XP' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('img', { name: /Sunday through Saturday/ })).toBeVisible();
});

test('reduced motion skips confetti', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await page.getByRole('button', { name: 'Start lesson' }).click();
  await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    let guard = 0;
    while (guard++ < 8000) {
      if ($('#h')) return;
      if ($('#cont')) { $('#cont').click(); continue; }
      if ($('#go')) { $('#go').click(); continue; }
      if ($('#buyh')) throw new Error('out of hearts');
      const e = window.__BR.cur();
      if (!e || !$('#chk')) throw new Error('no question');
      if (e.t === 'ar') {
        for (const line of e.lines) {
          const chip = [...document.querySelectorAll('#bank .chip')].find((c) => c.dataset.raw === line);
          chip.click();
        }
      } else if (e.t === 'type') {
        const box = document.querySelector('#typebox');
        box.value = e.canon;
        box.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        document.querySelector('.opt[data-i="' + e.a + '"]').click();
      }
      $('#chk').click();
      if (!$('#cont')) throw new Error('no explanation');
      $('#cont').click();
    }
    throw new Error('lesson did not finish');
  });
  await expect(page.locator('#h')).toBeVisible();
  expect(await page.locator('.conf').count()).toBe(0);
  const anim = await page.evaluate(() => {
    const c = document.createElement('div');
    c.className = 'conf';
    document.body.appendChild(c);
    const name = getComputedStyle(c).animationName;
    c.remove();
    return name;
  });
  expect(anim).toBe('none');
});

test('long emoji and right-to-left names stay on screen', async ({ page }, testInfo) => {
  const emoji = '🦊'.repeat(12);
  await boot(page, testInfo, { profile: { name: emoji } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('h1.h1')).toHaveText(emoji);
  expect(await overflow(page)).toEqual([]);
  await boot(page, testInfo, { profile: { name: 'مرحبا يا عالم' } });
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.locator('h1.h1')).toHaveText('مرحبا يا عالم');
  expect(await overflow(page)).toEqual([]);
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  expect(await overflow(page)).toEqual([]);
});

test('several profiles can be added and switched by name', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { name: 'Ada' } });
  for (const name of ['Bea', 'Cam', 'Dee']) {
    await page.getByRole('button', { name: 'Profile', exact: true }).click();
    await page.getByRole('button', { name: 'Add profile' }).click();
    await page.locator('#nm').fill(name);
    await page.getByRole('button', { name: 'Start from scratch' }).click();
    await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
    expect((await state(page)).name).toBe(name);
  }
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Ada' }).click();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect((await state(page)).name).toBe('Ada');
  await page.getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to Cam' }).click();
  expect((await state(page)).name).toBe('Cam');
  const names = await page.evaluate(() => Object.values(window.__BR.P().list).map((p) => p.name).sort());
  expect(names).toEqual(['Ada', 'Bea', 'Cam', 'Dee']);
});

test('the first answer can be entered from the keyboard', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.locator('.node.cur').click();
  await expect(page.getByRole('button', { name: 'Start lesson' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#chk')).toBeVisible();
  const index = await page.evaluate(() => {
    const e = window.__BR.cur();
    const opts = [...document.querySelectorAll('.opt')].filter((o) => !o.disabled);
    return opts.findIndex((o) => o.dataset.i === String(e.a));
  });
  expect(index).toBeGreaterThanOrEqual(0);
  await page.keyboard.press(String(index + 1));
  await page.keyboard.press('Enter');
  await expect(page.locator('#cont')).toBeVisible();
  await expect(page.locator('#ft p').last()).not.toHaveText('');
});

test('rapid navigation lands on the last screen', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.evaluate(() => {
    document.querySelector('[data-go="practice"]').click();
    document.querySelector('[data-go="shop"]').click();
    document.querySelector('[data-go="interview"]').click();
    document.querySelector('[data-go="learn"]').click();
  });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Gem Shop' })).toHaveCount(0);
});

test('a fresh install with no profile reaches onboarding', async ({ page }) => {
  await page.addInitScript(() => localStorage.removeItem('byteroots-profiles'));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Start from scratch' })).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Pick an avatar' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Fox avatar' })).toBeVisible();
});

test('the local day follows a timezone change', async ({ page }, testInfo) => {
  await boot(page, testInfo, { profile: { hearts: 3, heartDay: '2020-01-01' } });
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTimezoneOverride', { timezoneId: 'Pacific/Kiritimati' });
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  const zone = await page.evaluate(() => new Date().getTimezoneOffset());
  expect(zone).toBe(-840);
  const ok = await page.evaluate(() => {
    const d = new Date();
    const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return window.__BR.S.heartDay === today && window.__BR.S.hearts === 5;
  });
  expect(ok).toBe(true);
});

test('larger text keeps the home screen inside the viewport', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('switch', { name: 'Larger text' }).click();
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.hasAttribute('data-big'))).toBe(true);
  expect(await overflow(page)).toEqual([]);
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  const zoomed = await page.evaluate(() => {
    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
    const vw = document.documentElement.clientWidth;
    const bad = [];
    for (const el of document.querySelectorAll('#app *')) {
      const r = el.getBoundingClientRect();
      const left = r.left / z, right = r.right / z;
      if (right - left < 4 || (r.bottom - r.top) / z < 4) continue;
      if (right <= vw + 2 && left >= -2) continue;
      const cls = typeof el.className === 'string' ? el.className : '';
      if (el.tagName === 'PRE' || /code|chip|tabs|toast|conf|path/.test(cls)) continue;
      bad.push((cls || el.tagName) + ' ' + Math.round(left) + '..' + Math.round(right));
    }
    return bad.slice(0, 8);
  });
  expect(zoomed).toEqual([]);
});

test('service worker v27 replaces a v26 cache and tells an open tab to reload', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.evaluate(async () => {
    const cache = await caches.open('byteryte-v26');
    await cache.put(new Request(new URL('legacy-v26.txt', location.href)), new Response('old'));
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) await reg.unregister();
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await expect.poll(async () => page.evaluate(async () => {
    const keys = await caches.keys();
    return { v27: keys.includes('byteryte-v27'), v26: keys.includes('byteryte-v26') };
  })).toEqual({ v27: true, v26: false });
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.dispatchEvent(new Event('controllerchange')));
  await expect(page.getByText('A new version of ByteRyte is ready. Reload to use it.')).toBeVisible();
});
