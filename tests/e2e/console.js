import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push('PAGE ' + err.message));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/offline/i.test(testInfo.title) && /ERR_INTERNET_DISCONNECTED|Failed to load resource|net::ERR_FAILED/.test(text)) return;
      errors.push(text);
    });
    await use(page);
    expect(errors, 'console or page errors:\n' + errors.join('\n')).toEqual([]);
  },
});
export { expect };
