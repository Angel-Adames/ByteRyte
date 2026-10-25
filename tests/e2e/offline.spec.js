import { test, expect } from './console.js';
import { boot } from './helpers.js';

test('offline reload under /ByteRyte/ uses cache v13', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desk-light', 'offline pass runs once');
  await boot(page, testInfo);
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  const keys = await page.evaluate(async () => await caches.keys());
  expect(keys).toContain('byteryte-v13');
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});
