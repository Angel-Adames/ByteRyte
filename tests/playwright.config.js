const path = require('path');
const root = path.resolve(__dirname, '..');
const pages = '/tmp/byteryte-pages';
const ports = { 'phone-light': 8877, 'phone-dark': 8878, 'desk-light': 8879, 'desk-dark': 8880 };

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
    baseURL: `http://127.0.0.1:${ports['phone-light']}/ByteRyte/`,
    serviceWorkers: 'allow',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `rm -rf ${pages} && mkdir -p ${pages} && ln -sfn ${root} ${pages}/ByteRyte && bash -c 'cleanup(){ jobs -p | xargs -r kill; }; trap cleanup EXIT; trap "cleanup; exit 0" INT TERM; node ${root}/tests/gzip-server.js ${pages} 8881 & for p in ${Object.values(ports).join(' ')}; do python3 -m http.server $p --bind 127.0.0.1 --directory ${pages} & done; wait'`,
    url: `http://127.0.0.1:${ports['phone-light']}/ByteRyte/`,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: 'phone-light', use: { baseURL: `http://127.0.0.1:${ports['phone-light']}/ByteRyte/`, viewport: { width: 390, height: 844 }, colorScheme: 'light', brTheme: 'light' } },
    { name: 'phone-dark', use: { baseURL: `http://127.0.0.1:${ports['phone-dark']}/ByteRyte/`, viewport: { width: 390, height: 844 }, colorScheme: 'dark', brTheme: 'dark' } },
    { name: 'desk-light', use: { baseURL: `http://127.0.0.1:${ports['desk-light']}/ByteRyte/`, viewport: { width: 1280, height: 800 }, colorScheme: 'light', brTheme: 'light' } },
    { name: 'desk-dark', use: { baseURL: `http://127.0.0.1:${ports['desk-dark']}/ByteRyte/`, viewport: { width: 1280, height: 800 }, colorScheme: 'dark', brTheme: 'dark' } },
  ],
};
