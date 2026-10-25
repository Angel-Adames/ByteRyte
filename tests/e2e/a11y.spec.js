import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './console.js';
import { boot, isDeep } from './helpers.js';

const pages = [
  ['home', async (page) => {}],
  ['lesson', async (page) => {
    await page.locator('.node.cur').click();
    await page.getByRole('button', { name: 'Start lesson' }).click();
  }],
  ['practice', async (page) => { await page.getByRole('button', { name: 'Practice', exact: true }).click(); }],
  ['interview', async (page) => { await page.getByRole('button', { name: 'Interview', exact: true }).click(); }],
  ['shop', async (page) => { await page.getByRole('button', { name: 'Shop', exact: true }).click(); }],
  ['profile', async (page) => { await page.getByRole('button', { name: 'Profile', exact: true }).click(); }],
  ['settings', async (page) => { await page.getByRole('button', { name: 'Settings' }).click(); }],
];

for (const [name, open] of pages) {
  test('axe ' + name, async ({ page }, testInfo) => {
    test.skip(!isDeep(testInfo), 'axe runs on all four projects');
    await boot(page, testInfo);
    await open(page);
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious, JSON.stringify(serious.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 2).map((n) => n.html) })), null, 2)).toEqual([]);
  });
}
