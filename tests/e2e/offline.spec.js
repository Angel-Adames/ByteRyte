import { test, expect } from './console.js';
import { boot } from './helpers.js';

test('offline reload under /ByteRyte/ uses cache v27', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open('byteryte-v27');
    const urls = (await cache.keys()).map(r => r.url);
    return { keys, boot: urls.some(u => u.endsWith('/boot.js')), rytia: urls.some(u => u.endsWith('/rytia.js')), grade: urls.some(u => u.endsWith('/grade.js')) };
  });
  expect(cached.keys).toContain('byteryte-v27');
  expect(cached.boot).toBe(true);
  expect(cached.rytia).toBe(true);
  expect(cached.grade).toBe(true);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});
