import http from 'node:http';
import zlib from 'node:zlib';
import { test, expect } from './console.js';
import { seed, themeOf } from './helpers.js';

function getGzip(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({
      hostname: '127.0.0.1',
      port: 8881,
      path,
      headers: { 'Accept-Encoding': 'gzip' },
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        encoding: res.headers['content-encoding'] || '',
        body: Buffer.concat(chunks),
      }));
    });
    req.on('error', reject);
  });
}

test('a gzip response under /ByteRyte/ still shows the daily goal', async ({ page }, testInfo) => {
  const raw = await getGzip('/ByteRyte/index.html');
  expect(raw.status).toBe(200);
  expect(raw.encoding).toBe('gzip');
  const html = zlib.gunzipSync(raw.body).toString('utf8');
  expect(html).toContain('<title>ByteRyte</title>');
  expect(html).toContain('src="boot.js"');
  const script = await getGzip('/ByteRyte/app.js');
  expect(script.status).toBe(200);
  expect(script.encoding).toBe('gzip');
  expect(zlib.gunzipSync(script.body).toString('utf8')).toContain('byteroots-profiles');
  await seed(page, { settings: { theme: themeOf(testInfo), sound: false, big: false } });
  await page.goto('http://127.0.0.1:8881/ByteRyte/');
  await expect(page.getByText('Daily goal', { exact: true })).toBeVisible();
  expect(page.url()).toContain('/ByteRyte/');
});
