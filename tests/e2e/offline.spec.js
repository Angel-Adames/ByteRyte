import { test, expect } from './console.js';
import { boot } from './helpers.js';

test('offline reload under /ByteRyte/ uses cache v15', async ({ page }, testInfo) => {
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const keys = await page.evaluate(async () => await caches.keys());
  expect(keys).toContain('byteryte-v15');
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});
