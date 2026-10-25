const path = require('path');
const root = path.resolve(__dirname, '..');
const pages = '/tmp/byteryte-pages';
const port = 8877;

module.exports = {
  testDir: './e2e',
  timeout: 180000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${port}/ByteRyte/`,
    serviceWorkers: 'allow',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `rm -rf ${pages} && mkdir -p ${pages} && ln -sfn ${root} ${pages}/ByteRyte && python3 -m http.server ${port} --bind 127.0.0.1 --directory ${pages}`,
    url: `http://127.0.0.1:${port}/ByteRyte/`,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: 'phone-light', use: { viewport: { width: 390, height: 844 }, colorScheme: 'light', brTheme: 'light' } },
    { name: 'phone-dark', use: { viewport: { width: 390, height: 844 }, colorScheme: 'dark', brTheme: 'dark' } },
    { name: 'desk-light', use: { viewport: { width: 1280, height: 800 }, colorScheme: 'light', brTheme: 'light' } },
    { name: 'desk-dark', use: { viewport: { width: 1280, height: 800 }, colorScheme: 'dark', brTheme: 'dark' } },
  ],
};
