import { test, expect } from './console.js';
import { boot } from './helpers.js';

test('offline reload under /ByteRyte/ uses cache v16', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const cache = await caches.open('byteryte-v16');
    const urls = (await cache.keys()).map(r => r.url);
    return { keys, boot: urls.some(u => u.endsWith('/boot.js')) };
  });
  expect(cached.keys).toContain('byteryte-v16');
  expect(cached.boot).toBe(true);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});
